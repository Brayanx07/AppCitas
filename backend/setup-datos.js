// Corre esto UNA VEZ para crear tablas + datos de prueba en Railway
// Uso: node setup-datos.js

import pg from 'pg';
import { readFileSync } from 'fs';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __dir = dirname(fileURLToPath(import.meta.url));
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  console.log('🔄 Conectando a Railway...');

  // 1. Ejecutar migraciones
  const sql = readFileSync(join(__dir, 'src/db/migrations.sql'), 'utf8');
  await pool.query(sql);
  console.log('✅ Tablas creadas / ya existían');

  // 2. Clínica
  const clinica = await pool.query(`
    INSERT INTO clinicas (nombre, slug, descripcion, ciudad, telefono, whatsapp, correo, estado)
    VALUES ('Clínica San Rafael', 'san-rafael',
            'Clínica de medicina general y especialidades en Honduras',
            'Tegucigalpa', '+504 2222-3333', '+50499990000', 'info@sanrafael.hn', 'activa')
    ON CONFLICT (slug) DO UPDATE SET nombre = EXCLUDED.nombre
    RETURNING id_clinica, slug
  `);
  const id_clinica = clinica.rows[0].id_clinica;
  console.log('✅ Clínica:', clinica.rows[0]);

  // 3. Usuario admin
  const hash = await bcrypt.hash('admin123', 10);
  const user = await pool.query(`
    INSERT INTO usuarios (nombre, correo, password_hash, rol, id_clinica, estado)
    VALUES ('Admin San Rafael', 'admin@sanrafael.hn', $1, 'admin_clinica', $2, 'activo')
    ON CONFLICT (correo) DO NOTHING
    RETURNING correo, rol
  `, [hash, id_clinica]);
  console.log('✅ Usuario:', user.rows[0] || 'ya existía');

  // 4. Servicios
  await pool.query(`
    INSERT INTO servicios (id_clinica, nombre, descripcion, duracion_minutos, precio, activo)
    VALUES
      ($1, 'Consulta General',  'Atención médica general para adultos',       30, 500,  true),
      ($1, 'Pediatría',         'Atención médica especializada para niños',    45, 600,  true),
      ($1, 'Cardiología',       'Evaluación y diagnóstico cardiovascular',     60, 1200, true),
      ($1, 'Dermatología',      'Cuidado y diagnóstico de la piel',            40, 800,  true),
      ($1, 'Ginecología',       'Salud femenina y controles prenatales',       50, 900,  true)
    ON CONFLICT DO NOTHING
  `, [id_clinica]);
  console.log('✅ Servicios creados');

  // 5. Horarios
  await pool.query(`
    INSERT INTO horarios (id_clinica, dia_semana, hora_inicio, hora_fin)
    VALUES
      ($1, 'lunes',     '08:00', '17:00'),
      ($1, 'martes',    '08:00', '17:00'),
      ($1, 'miercoles', '08:00', '17:00'),
      ($1, 'jueves',    '08:00', '17:00'),
      ($1, 'viernes',   '08:00', '16:00'),
      ($1, 'sabado',    '09:00', '12:00')
    ON CONFLICT DO NOTHING
  `, [id_clinica]);
  console.log('✅ Horarios creados');

  // 6. Doctor
  await pool.query(`
    INSERT INTO doctores (id_clinica, nombre, especialidad, activo)
    VALUES
      ($1, 'Dr. Carlos Mencia',   'Medicina General',   true),
      ($1, 'Dra. María Rodríguez','Pediatría',          true),
      ($1, 'Dr. José Hernández',  'Cardiología',        true)
    ON CONFLICT DO NOTHING
  `, [id_clinica]);
  console.log('✅ Doctores creados');

  await pool.end();
  console.log('\n🎉 ¡Todo listo!');
  console.log('   Página: http://localhost:8080/clinica.html?clinica=san-rafael');
  console.log('   Login: admin@sanrafael.hn / admin123');
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
