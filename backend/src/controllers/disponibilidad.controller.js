import pool from '../config/db.js';

const DIAS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

// Convierte "09:00:00" a minutos totales: 540
const timeToMinutes = (time) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

// Convierte minutos a string "09:00"
const minutesToTime = (minutes) => {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
};

// GET /api/disponibilidad?slug=san-rafael&fecha=2026-07-01&id_servicio=1&id_doctor=1
export const getDisponibilidad = async (req, res) => {
  const { slug, fecha, id_servicio, id_doctor } = req.query;

  if (!slug || !fecha || !id_servicio) {
    return res.status(400).json({ error: 'slug, fecha y id_servicio son requeridos' });
  }

  try {
    // 1. Obtener la clínica por slug
    const clinicaResult = await pool.query(
      `SELECT id_clinica FROM clinicas WHERE slug = $1 AND estado = 'activa'`,
      [slug]
    );

    if (clinicaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Clínica no encontrada' });
    }

    const id_clinica = clinicaResult.rows[0].id_clinica;

    // 2. Obtener duración del servicio
    const servicioResult = await pool.query(
      `SELECT duracion_minutos FROM servicios WHERE id_servicio = $1 AND id_clinica = $2 AND activo = true`,
      [id_servicio, id_clinica]
    );

    if (servicioResult.rows.length === 0) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    const duracion = servicioResult.rows[0].duracion_minutos;

    // 3. Obtener día de la semana de la fecha
    const fechaObj = new Date(fecha + 'T00:00:00');
    const diaSemana = DIAS[fechaObj.getDay()];

    // 4. Buscar horarios activos para ese día (y doctor si se especifica)
    let horariosQuery = `
      SELECT hora_inicio, hora_fin FROM horarios
      WHERE id_clinica = $1 AND dia_semana = $2 AND activo = true
    `;
    const horariosParams = [id_clinica, diaSemana];

    if (id_doctor) {
      horariosQuery += ` AND (id_doctor = $3 OR id_doctor IS NULL)`;
      horariosParams.push(id_doctor);
    }

    const horariosResult = await pool.query(horariosQuery, horariosParams);

    if (horariosResult.rows.length === 0) {
      return res.json({ fecha, slots: [], mensaje: 'No hay horario disponible para este día' });
    }

    // 5. Obtener citas ya reservadas para esa fecha (pendientes y confirmadas)
    let citasQuery = `
      SELECT hora FROM citas
      WHERE id_clinica = $1 AND fecha = $2
        AND estado IN ('pendiente', 'confirmada')
    `;
    const citasParams = [id_clinica, fecha];

    if (id_doctor) {
      citasQuery += ` AND id_doctor = $3`;
      citasParams.push(id_doctor);
    }

    const citasResult = await pool.query(citasQuery, citasParams);
    const horasOcupadas = citasResult.rows.map(c => c.hora.slice(0, 5)); // "10:00"

    // 6. Generar slots disponibles
    const slots = [];

    for (const horario of horariosResult.rows) {
      const inicio = timeToMinutes(horario.hora_inicio);
      const fin = timeToMinutes(horario.hora_fin);

      let cursor = inicio;
      while (cursor + duracion <= fin) {
        const slotTime = minutesToTime(cursor);
        if (!horasOcupadas.includes(slotTime)) {
          slots.push(slotTime);
        }
        cursor += duracion;
      }
    }

    res.json({ fecha, dia: diaSemana, duracion_minutos: duracion, slots });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al calcular disponibilidad' });
  }
};
