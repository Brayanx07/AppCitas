import pool from '../config/db.js';

// GET /api/doctores — Lista todos los doctores de la clínica
export const getDoctores = async (req, res) => {
  const id_clinica = req.usuario.id_clinica;
  const { activo } = req.query;

  let query = `
    SELECT
      d.id_doctor,
      d.nombre,
      d.especialidad,
      d.correo,
      d.telefono,
      d.activo,
      COALESCE(
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'dia_semana', h.dia_semana,
            'hora_inicio', h.hora_inicio,
            'hora_fin', h.hora_fin
          ) ORDER BY CASE h.dia_semana
            WHEN 'lunes' THEN 1 WHEN 'martes' THEN 2 WHEN 'miercoles' THEN 3
            WHEN 'jueves' THEN 4 WHEN 'viernes' THEN 5 WHEN 'sabado' THEN 6
            WHEN 'domingo' THEN 7 END
        ) FILTER (WHERE h.id_horario IS NOT NULL AND h.activo = true),
        '[]'
      ) AS horarios
    FROM doctores d
    LEFT JOIN horarios h ON h.id_doctor = d.id_doctor
    WHERE d.id_clinica = $1
  `;
  const params = [id_clinica];

  if (activo !== undefined) {
    params.push(activo === 'true');
    query += ` AND d.activo = $${params.length}`;
  }

  query += ` GROUP BY d.id_doctor ORDER BY d.nombre`;

  try {
    const result = await pool.query(query, params);
    res.json({ doctores: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener doctores' });
  }
};

// GET /api/doctores/:id — Detalle de un doctor con sus citas del día
export const getDoctorById = async (req, res) => {
  const { id } = req.params;
  const id_clinica = req.usuario.id_clinica;

  try {
    // Datos del doctor + horarios
    const doctorResult = await pool.query(
      `SELECT
        d.*,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id_horario', h.id_horario,
              'dia_semana', h.dia_semana,
              'hora_inicio', h.hora_inicio,
              'hora_fin', h.hora_fin,
              'activo', h.activo
            ) ORDER BY CASE h.dia_semana
              WHEN 'lunes' THEN 1 WHEN 'martes' THEN 2 WHEN 'miercoles' THEN 3
              WHEN 'jueves' THEN 4 WHEN 'viernes' THEN 5 WHEN 'sabado' THEN 6
              WHEN 'domingo' THEN 7 END
          ) FILTER (WHERE h.id_horario IS NOT NULL),
          '[]'
        ) AS horarios
      FROM doctores d
      LEFT JOIN horarios h ON h.id_doctor = d.id_doctor
      WHERE d.id_doctor = $1 AND d.id_clinica = $2
      GROUP BY d.id_doctor`,
      [id, id_clinica]
    );

    if (doctorResult.rows.length === 0) {
      return res.status(404).json({ error: 'Doctor no encontrado' });
    }

    // Citas del día asignadas a este doctor
    const citasHoy = await pool.query(
      `SELECT
        c.id_cita, c.hora, c.estado, c.motivo,
        p.nombre AS nombre_paciente, p.telefono,
        s.nombre AS nombre_servicio
      FROM citas c
      JOIN pacientes p ON c.id_paciente = p.id_paciente
      JOIN servicios s ON c.id_servicio = s.id_servicio
      WHERE c.id_doctor = $1 AND c.id_clinica = $2
        AND c.fecha = CURRENT_DATE
        AND c.estado NOT IN ('cancelada')
      ORDER BY c.hora`,
      [id, id_clinica]
    );

    res.json({
      doctor: doctorResult.rows[0],
      citas_hoy: citasHoy.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener el doctor' });
  }
};

// POST /api/doctores — Crear doctor
export const createDoctor = async (req, res) => {
  const id_clinica = req.usuario.id_clinica;
  const { nombre, especialidad, correo, telefono } = req.body;

  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre del doctor es requerido' });
  }

  // Validar formato de correo si se proporciona
  if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    return res.status(400).json({ error: 'Formato de correo inválido' });
  }

  try {
    // Verificar si ya existe un doctor con ese correo en esta clínica
    if (correo) {
      const existe = await pool.query(
        `SELECT id_doctor FROM doctores WHERE id_clinica = $1 AND correo = $2`,
        [id_clinica, correo]
      );
      if (existe.rows.length > 0) {
        return res.status(409).json({ error: 'Ya existe un doctor con ese correo en esta clínica' });
      }
    }

    const result = await pool.query(
      `INSERT INTO doctores (id_clinica, nombre, especialidad, correo, telefono)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id_clinica, nombre.trim(), especialidad?.trim() || null, correo?.trim() || null, telefono?.trim() || null]
    );

    res.status(201).json({ doctor: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear el doctor' });
  }
};

// PUT /api/doctores/:id — Editar doctor
export const updateDoctor = async (req, res) => {
  const { id } = req.params;
  const id_clinica = req.usuario.id_clinica;
  const { nombre, especialidad, correo, telefono, activo } = req.body;

  if (nombre !== undefined && !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre no puede estar vacío' });
  }

  if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    return res.status(400).json({ error: 'Formato de correo inválido' });
  }

  try {
    // Verificar que el correo no esté en uso por otro doctor de la misma clínica
    if (correo) {
      const correoEnUso = await pool.query(
        `SELECT id_doctor FROM doctores WHERE id_clinica = $1 AND correo = $2 AND id_doctor != $3`,
        [id_clinica, correo, id]
      );
      if (correoEnUso.rows.length > 0) {
        return res.status(409).json({ error: 'Ese correo ya está en uso por otro doctor' });
      }
    }

    const result = await pool.query(
      `UPDATE doctores
       SET nombre       = COALESCE($1, nombre),
           especialidad = COALESCE($2, especialidad),
           correo       = COALESCE($3, correo),
           telefono     = COALESCE($4, telefono),
           activo       = COALESCE($5, activo)
       WHERE id_doctor = $6 AND id_clinica = $7
       RETURNING *`,
      [
        nombre?.trim() || null,
        especialidad?.trim() || null,
        correo?.trim() || null,
        telefono?.trim() || null,
        activo,
        id,
        id_clinica,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Doctor no encontrado' });
    }

    res.json({ doctor: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar el doctor' });
  }
};

// DELETE /api/doctores/:id — Desactivar doctor (soft delete)
// No se puede desactivar si tiene citas pendientes o confirmadas
export const deleteDoctor = async (req, res) => {
  const { id } = req.params;
  const id_clinica = req.usuario.id_clinica;

  try {
    // Verificar citas activas asignadas a este doctor
    const citasActivas = await pool.query(
      `SELECT COUNT(*) AS total FROM citas
       WHERE id_doctor = $1 AND id_clinica = $2
         AND estado IN ('pendiente', 'confirmada')
         AND fecha >= CURRENT_DATE`,
      [id, id_clinica]
    );

    if (parseInt(citasActivas.rows[0].total) > 0) {
      return res.status(409).json({
        error: `No se puede desactivar. El doctor tiene ${citasActivas.rows[0].total} cita(s) pendiente(s) o confirmada(s). Cancélalas o reasígnalas primero.`,
      });
    }

    const result = await pool.query(
      `UPDATE doctores SET activo = false
       WHERE id_doctor = $1 AND id_clinica = $2
       RETURNING id_doctor, nombre, activo`,
      [id, id_clinica]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Doctor no encontrado' });
    }

    // Desactivar también sus horarios
    await pool.query(
      `UPDATE horarios SET activo = false WHERE id_doctor = $1 AND id_clinica = $2`,
      [id, id_clinica]
    );

    res.json({
      mensaje: 'Doctor desactivado. Sus horarios también fueron desactivados.',
      doctor: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al desactivar el doctor' });
  }
};
