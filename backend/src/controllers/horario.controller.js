import pool from '../config/db.js';

// GET /api/horarios — Lista horarios de la clínica
export const getHorarios = async (req, res) => {
  const id_clinica = req.usuario.id_clinica;

  try {
    const result = await pool.query(
      `SELECT h.*, d.nombre AS nombre_doctor
       FROM horarios h
       LEFT JOIN doctores d ON h.id_doctor = d.id_doctor
       WHERE h.id_clinica = $1
       ORDER BY CASE h.dia_semana
         WHEN 'lunes' THEN 1 WHEN 'martes' THEN 2 WHEN 'miercoles' THEN 3
         WHEN 'jueves' THEN 4 WHEN 'viernes' THEN 5 WHEN 'sabado' THEN 6
         WHEN 'domingo' THEN 7 END`,
      [id_clinica]
    );
    res.json({ horarios: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener horarios' });
  }
};

// POST /api/horarios — Crear horario
export const createHorario = async (req, res) => {
  const id_clinica = req.usuario.id_clinica;
  const { dia_semana, hora_inicio, hora_fin, id_doctor } = req.body;

  if (!dia_semana || !hora_inicio || !hora_fin) {
    return res.status(400).json({ error: 'Día, hora inicio y hora fin son requeridos' });
  }

  if (hora_inicio >= hora_fin) {
    return res.status(400).json({ error: 'La hora de inicio debe ser menor a la hora de fin' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO horarios (id_clinica, id_doctor, dia_semana, hora_inicio, hora_fin)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id_clinica, id_doctor || null, dia_semana, hora_inicio, hora_fin]
    );
    res.status(201).json({ horario: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear horario' });
  }
};

// PUT /api/horarios/:id — Editar horario
export const updateHorario = async (req, res) => {
  const { id } = req.params;
  const id_clinica = req.usuario.id_clinica;
  const { dia_semana, hora_inicio, hora_fin, id_doctor, activo } = req.body;

  try {
    const result = await pool.query(
      `UPDATE horarios
       SET dia_semana = COALESCE($1, dia_semana),
           hora_inicio = COALESCE($2, hora_inicio),
           hora_fin = COALESCE($3, hora_fin),
           id_doctor = COALESCE($4, id_doctor),
           activo = COALESCE($5, activo)
       WHERE id_horario = $6 AND id_clinica = $7
       RETURNING *`,
      [dia_semana, hora_inicio, hora_fin, id_doctor, activo, id, id_clinica]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Horario no encontrado' });
    }

    res.json({ horario: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar horario' });
  }
};

// DELETE /api/horarios/:id — Desactivar horario
export const deleteHorario = async (req, res) => {
  const { id } = req.params;
  const id_clinica = req.usuario.id_clinica;

  try {
    const result = await pool.query(
      `UPDATE horarios SET activo = false WHERE id_horario = $1 AND id_clinica = $2 RETURNING id_horario, dia_semana, activo`,
      [id, id_clinica]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Horario no encontrado' });
    }

    res.json({ mensaje: 'Horario desactivado', horario: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al desactivar horario' });
  }
};
