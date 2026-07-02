import pool from '../config/db.js';

// POST /api/reservas — Pública: el paciente agenda su cita sin cuenta
export const crearReserva = async (req, res) => {
  const {
    slug,
    nombre,
    telefono,
    correo,
    edad,
    id_servicio,
    id_doctor,
    fecha,
    hora,
    motivo,
  } = req.body;

  // Validaciones básicas
  if (!slug || !nombre || !telefono || !id_servicio || !fecha || !hora) {
    return res.status(400).json({
      error: 'Faltan campos requeridos: slug, nombre, telefono, id_servicio, fecha, hora',
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Buscar la clínica por slug
    const clinicaResult = await client.query(
      `SELECT id_clinica, nombre FROM clinicas WHERE slug = $1 AND estado = 'activa'`,
      [slug]
    );

    if (clinicaResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Clínica no encontrada o inactiva' });
    }

    const { id_clinica, nombre: nombre_clinica } = clinicaResult.rows[0];

    // 2. Verificar que el servicio existe y pertenece a la clínica
    const servicioResult = await client.query(
      `SELECT id_servicio, nombre, duracion_minutos FROM servicios
       WHERE id_servicio = $1 AND id_clinica = $2 AND activo = true`,
      [id_servicio, id_clinica]
    );

    if (servicioResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    // 3. Verificar que el slot no esté ya ocupado
    const slotOcupado = await client.query(
      `SELECT id_cita FROM citas
       WHERE id_clinica = $1 AND fecha = $2 AND hora = $3
         AND estado IN ('pendiente', 'confirmada')
         AND ($4::int IS NULL OR id_doctor = $4)`,
      [id_clinica, fecha, hora, id_doctor || null]
    );

    if (slotOcupado.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Ese horario ya está reservado, elige otro' });
    }

    // 4. Buscar si el paciente ya existe en esta clínica (por teléfono)
    let id_paciente;
    const pacienteExiste = await client.query(
      `SELECT id_paciente FROM pacientes WHERE id_clinica = $1 AND telefono = $2`,
      [id_clinica, telefono]
    );

    if (pacienteExiste.rows.length > 0) {
      id_paciente = pacienteExiste.rows[0].id_paciente;
    } else {
      // Crear paciente nuevo
      const nuevoPaciente = await client.query(
        `INSERT INTO pacientes (id_clinica, nombre, telefono, correo, edad)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id_paciente`,
        [id_clinica, nombre, telefono, correo || null, edad || null]
      );
      id_paciente = nuevoPaciente.rows[0].id_paciente;
    }

    // 5. Crear la cita
    const citaResult = await client.query(
      `INSERT INTO citas (id_clinica, id_paciente, id_servicio, id_doctor, fecha, hora, motivo)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id_clinica, id_paciente, id_servicio, id_doctor || null, fecha, hora, motivo || null]
    );

    await client.query('COMMIT');

    res.status(201).json({
      mensaje: `Tu cita en ${nombre_clinica} fue reservada con éxito`,
      cita: {
        ...citaResult.rows[0],
        nombre_paciente: nombre,
        nombre_servicio: servicioResult.rows[0].nombre,
        nombre_clinica,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Error al crear la reserva' });
  } finally {
    client.release();
  }
};
