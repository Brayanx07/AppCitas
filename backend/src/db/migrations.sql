-- CitaHN - Migraciones PostgreSQL
-- Ejecutar en orden

-- 1. Clínicas
CREATE TABLE IF NOT EXISTS clinicas (
  id_clinica SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  descripcion TEXT,
  ciudad VARCHAR(100),
  direccion TEXT,
  telefono VARCHAR(30),
  whatsapp VARCHAR(30),
  correo VARCHAR(150),
  logo_url TEXT,
  estado VARCHAR(30) DEFAULT 'activa',
  plan VARCHAR(50),
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Usuarios internos de cada clínica
CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario SERIAL PRIMARY KEY,
  id_clinica INT REFERENCES clinicas(id_clinica) ON DELETE CASCADE,
  nombre VARCHAR(150) NOT NULL,
  correo VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  rol VARCHAR(50) NOT NULL CHECK (rol IN ('admin_citahn', 'admin_clinica', 'recepcionista', 'doctor', 'laboratorio')),
  estado VARCHAR(30) DEFAULT 'activo',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Servicios de cada clínica
CREATE TABLE IF NOT EXISTS servicios (
  id_servicio SERIAL PRIMARY KEY,
  id_clinica INT REFERENCES clinicas(id_clinica) ON DELETE CASCADE,
  nombre VARCHAR(150) NOT NULL,
  descripcion TEXT,
  duracion_minutos INT DEFAULT 30,
  precio DECIMAL(10,2),
  activo BOOLEAN DEFAULT true
);

-- 4. Doctores de cada clínica
CREATE TABLE IF NOT EXISTS doctores (
  id_doctor SERIAL PRIMARY KEY,
  id_clinica INT REFERENCES clinicas(id_clinica) ON DELETE CASCADE,
  nombre VARCHAR(150) NOT NULL,
  especialidad VARCHAR(150),
  correo VARCHAR(150),
  telefono VARCHAR(30),
  activo BOOLEAN DEFAULT true
);

-- 5. Horarios por clínica y doctor
CREATE TABLE IF NOT EXISTS horarios (
  id_horario SERIAL PRIMARY KEY,
  id_clinica INT REFERENCES clinicas(id_clinica) ON DELETE CASCADE,
  id_doctor INT REFERENCES doctores(id_doctor) ON DELETE SET NULL,
  dia_semana VARCHAR(20) NOT NULL CHECK (dia_semana IN ('lunes','martes','miercoles','jueves','viernes','sabado','domingo')),
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  activo BOOLEAN DEFAULT true
);

-- 6. Pacientes de cada clínica
CREATE TABLE IF NOT EXISTS pacientes (
  id_paciente SERIAL PRIMARY KEY,
  id_clinica INT REFERENCES clinicas(id_clinica) ON DELETE CASCADE,
  nombre VARCHAR(150) NOT NULL,
  telefono VARCHAR(30) NOT NULL,
  correo VARCHAR(150),
  edad INT,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Citas
CREATE TABLE IF NOT EXISTS citas (
  id_cita SERIAL PRIMARY KEY,
  id_clinica INT REFERENCES clinicas(id_clinica) ON DELETE CASCADE,
  id_paciente INT REFERENCES pacientes(id_paciente) ON DELETE SET NULL,
  id_servicio INT REFERENCES servicios(id_servicio) ON DELETE SET NULL,
  id_doctor INT REFERENCES doctores(id_doctor) ON DELETE SET NULL,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  motivo TEXT,
  estado VARCHAR(30) DEFAULT 'pendiente' CHECK (estado IN ('pendiente','confirmada','cancelada','reprogramada','atendida','no_asistio')),
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_clinicas_slug ON clinicas(slug);
CREATE INDEX IF NOT EXISTS idx_citas_clinica_fecha ON citas(id_clinica, fecha);
CREATE INDEX IF NOT EXISTS idx_pacientes_clinica ON pacientes(id_clinica);
CREATE INDEX IF NOT EXISTS idx_usuarios_correo ON usuarios(correo);
