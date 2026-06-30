import pool from '../config/db.js';

// GET /api/pacientes — Lista pacientes de la clínica con búsqueda
export const getPacientes = async (req, res) => {
  const id_clinica = req.usuario.id_clinica;
  const { buscar, limite = 50, pagina = 1 } = req.query;

  const offset = (parseInt(pagina) - 1) * parseInt(limite);

  let query = `
    SELECT
      p.id_paciente,
      p.nombre,
      p.telefono,
      p.correo,
      p.edad,
      p.fecha_creacion,
      COUNT(c.id_cita) AS total_citas,
      MAX(c.fecha) AS ultima_cita,
      SUM(CASE WHEN c.estado = 'atendida' THEN 1 ELSE 0 END) AS citas_atendidas,
      SUM(CASE WHEN c.estado = 'no_asistio' THEN 1 ELSE 0 END) AS citas_no_asistio
    FROM pacientes p
    LEFT JOIN citas c ON c.id_paciente = p.id_paciente AND c.id_clinica = p.id_clinica
    WHERE p.id_clinica = $1
  `;
  const params = [id_clinica];

  if (buscar) {
    params.push(`%${buscar}%`);
    query += ` AND (p.nombre ILIKE $${params.length} OR p.telefono ILIKE $${params.length})`;
  }

  query += ` GROUP BY p.id_paciente ORDER BY p.nombre`;

  // Total para paginación
  const countQuery = `SELECT COUNT(*) FROM (${query}) AS sub`;
  const countResult = await pool.query(countQuery, params);
  const total = parseInt(countResult.rows[0].count);

  query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(parseInt(limite), offset);

  try {
    const result = await pool.query(query, params);
    res.json({
      pacientes: result.rows,
      paginacion: {
        total,
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        paginas: Math.ceil(total / parseInt(limite)),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener pacientes' });
  }
};

// GET /api/pacientes/:id — Detalle del paciente con historial completo de citas
export const getPacienteById = async (req, res) => {
  const { id } = req.params;
  const id_clinica = req.usuario.id_clinica;

  try {
    const pacienteResult = await pool.query(
      `SELECT * FROM pacientes WHERE id_paciente = $1 AND id_clinica = $2`,
      [id, id_clinica]
    );

    if (pacienteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    // Historial completo de citas
    const historial = await pool.query(
      `SELECT
        c.id_cita,
        c.fecha,
        c.hora,
        c.motivo,
        c.estado,
        c.fecha_creacion,
        s.nombre AS servicio,
        d.nombre AS doctor
      FROM citas c
      JOIN servicios s ON c.id_servicio = s.id_servicio
      LEFT JOIN doctores d ON c.id_doctor = d.id_doctor
      WHERE c.id_paciente = $1 AND c.id_clinica = $2
      ORDER BY c.fecha DESC, c.hora DESC`,
      [id, id_clinica]
    );

    res.json({
      paciente: pacienteResult.rows[0],
      historial_citas: historial.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener el paciente' });
  }
};

// PUT /api/pacientes/:id — Editar datos del paciente
export const updatePaciente = async (req, res) => {
  const { id } = req.params;
  const id_clinica = req.usuario.id_clinica;
  const { nombre, telefono, correo, edad } = req.body;

  if (nombre !== undefined && !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre no puede estar vacío' });
  }

  if (telefono !== undefined && !telefono.trim()) {
    return res.status(400).json({ error: 'El teléfono no puede estar vacío' });
  }

  if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    return res.status(400).json({ error: 'Formato de correo inválido' });
  }

  if (edad !== undefined && (isNaN(edad) || edad < 0 || edad > 120)) {
    return res.status(400).json({ error: 'Edad inválida' });
  }

  try {
    // Verificar que el teléfono no esté en uso por otro paciente de la misma clínica
    if (telefono) {
      const telEnUso = await pool.query(
        `SELECT id_paciente FROM pacientes WHERE id_clinica = $1 AND telefono = $2 AND id_paciente != $3`,
        [id_clinica, telefono, id]
      );
      if (telEnUso.rows.length > 0) {
        return res.status(409).json({ error: 'Ese teléfono ya está registrado en otro paciente' });
      }
    }

    const result = await pool.query(
      `UPDATE pacientes
       SET nombre   = COALESCE($1, nombre),
           telefono = COALESCE($2, telefono),
           correo   = COALESCE($3, correo),
           edad     = COALESCE($4, edad)
       WHERE id_paciente = $5 AND id_clinica = $6
       RETURNING *`,
      [nombre?.trim() || null, telefono?.trim() || null, correo?.trim() || null, edad || null, id, id_clinica]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    res.json({ paciente: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar el paciente' });
  }
};

// DELETE /api/pacientes/:id — Eliminar paciente solo si no tiene citas activas
export const deletePaciente = async (req, res) => {
  const { id } = req.params;
  const id_clinica = req.usuario.id_clinica;

  try {
    const citasActivas = await pool.query(
      `SELECT COUNT(*) AS total FROM citas
       WHERE id_paciente = $1 AND id_clinica = $2
         AND estado IN ('pendiente', 'confirmada')
         AND fecha >= CURRENT_DATE`,
      [id, id_clinica]
    );

    if (parseInt(citasActivas.rows[0].total) > 0) {
      return res.status(409).json({
        error: `No se puede eliminar. El paciente tiene ${citasActivas.rows[0].total} cita(s) activa(s) pendientes.`,
      });
    }

    const result = await pool.query(
      `DELETE FROM pacientes WHERE id_paciente = $1 AND id_clinica = $2 RETURNING id_paciente, nombre`,
      [id, id_clinica]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    res.json({ mensaje: 'Paciente eliminado', paciente: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar el paciente' });
  }
};
