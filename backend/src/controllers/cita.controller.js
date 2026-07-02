import pool from '../config/db.js';

const ESTADOS_VALIDOS = ['pendiente', 'confirmada', 'cancelada', 'reprogramada', 'atendida', 'no_asistio'];

// GET /api/citas — Lista citas de la clínica con filtros opcionales
export const getCitas = async (req, res) => {
  const id_clinica = req.usuario.id_clinica;
  const { fecha, estado, id_doctor } = req.query;

  let query = `
    SELECT
      c.id_cita, c.fecha, c.hora, c.motivo, c.estado, c.fecha_creacion,
      p.nombre AS nombre_paciente, p.telefono, p.correo,
      s.nombre AS nombre_servicio, s.duracion_minutos,
      d.nombre AS nombre_doctor
    FROM citas c
    JOIN pacientes p ON c.id_paciente = p.id_paciente
    JOIN servicios s ON c.id_servicio = s.id_servicio
    LEFT JOIN doctores d ON c.id_doctor = d.id_doctor
    WHERE c.id_clinica = $1
  `;
  const params = [id_clinica];
  let idx = 2;

  if (fecha) {
    query += ` AND c.fecha = $${idx++}`;
    params.push(fecha);
  }

  if (estado) {
    query += ` AND c.estado = $${idx++}`;
    params.push(estado);
  }

  if (id_doctor) {
    query += ` AND c.id_doctor = $${idx++}`;
    params.push(id_doctor);
  }

  query += ` ORDER BY c.fecha, c.hora`;

  try {
    const result = await pool.query(query, params);
    res.json({ citas: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener citas' });
  }
};

// GET /api/citas/hoy — Citas del día actual
export const getCitasHoy = async (req, res) => {
  const id_clinica = req.usuario.id_clinica;

  try {
    const result = await pool.query(
      `SELECT
        c.id_cita, c.fecha, c.hora, c.motivo, c.estado,
        p.nombre AS nombre_paciente, p.telefono,
        s.nombre AS nombre_servicio, s.duracion_minutos,
        d.nombre AS nombre_doctor
      FROM citas c
      JOIN pacientes p ON c.id_paciente = p.id_paciente
      JOIN servicios s ON c.id_servicio = s.id_servicio
      LEFT JOIN doctores d ON c.id_doctor = d.id_doctor
      WHERE c.id_clinica = $1 AND c.fecha = CURRENT_DATE
      ORDER BY c.hora`,
      [id_clinica]
    );
    res.json({ citas: result.rows, fecha: new Date().toISOString().split('T')[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener citas de hoy' });
  }
};

// GET /api/citas/:id — Detalle de una cita
export const getCitaById = async (req, res) => {
  const { id } = req.params;
  const id_clinica = req.usuario.id_clinica;

  try {
    const result = await pool.query(
      `SELECT
        c.*,
        p.nombre AS nombre_paciente, p.telefono, p.correo, p.edad,
        s.nombre AS nombre_servicio, s.duracion_minutos, s.precio,
        d.nombre AS nombre_doctor, d.especialidad
      FROM citas c
      JOIN pacientes p ON c.id_paciente = p.id_paciente
      JOIN servicios s ON c.id_servicio = s.id_servicio
      LEFT JOIN doctores d ON c.id_doctor = d.id_doctor
      WHERE c.id_cita = $1 AND c.id_clinica = $2`,
      [id, id_clinica]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    res.json({ cita: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener la cita' });
  }
};

// PATCH /api/citas/:id/estado — Cambiar estado de una cita
export const cambiarEstado = async (req, res) => {
  const { id } = req.params;
  const id_clinica = req.usuario.id_clinica;
  const { estado } = req.body;

  if (!estado || !ESTADOS_VALIDOS.includes(estado)) {
    return res.status(400).json({
      error: `Estado inválido. Valores permitidos: ${ESTADOS_VALIDOS.join(', ')}`,
    });
  }

  try {
    const result = await pool.query(
      `UPDATE citas SET estado = $1
       WHERE id_cita = $2 AND id_clinica = $3
       RETURNING id_cita, estado, fecha, hora`,
      [estado, id, id_clinica]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    res.json({ mensaje: 'Estado actualizado', cita: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al cambiar estado de la cita' });
  }
};

// PATCH /api/citas/:id/reprogramar — Cambiar fecha y hora de una cita
export const reprogramarCita = async (req, res) => {
  const { id } = req.params;
  const id_clinica = req.usuario.id_clinica;
  const { fecha, hora } = req.body;

  if (!fecha || !hora) {
    return res.status(400).json({ error: 'Nueva fecha y hora son requeridas' });
  }

  try {
    // Verificar que el nuevo slot no esté ocupado
    const slotOcupado = await pool.query(
      `SELECT id_cita FROM citas
       WHERE id_clinica = $1 AND fecha = $2 AND hora = $3
         AND estado IN ('pendiente', 'confirmada')
         AND id_cita != $4`,
      [id_clinica, fecha, hora, id]
    );

    if (slotOcupado.rows.length > 0) {
      return res.status(409).json({ error: 'Ese horario ya está reservado' });
    }

    const result = await pool.query(
      `UPDATE citas SET fecha = $1, hora = $2, estado = 'reprogramada'
       WHERE id_cita = $3 AND id_clinica = $4
       RETURNING id_cita, fecha, hora, estado`,
      [fecha, hora, id, id_clinica]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    res.json({ mensaje: 'Cita reprogramada', cita: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al reprogramar la cita' });
  }
};
