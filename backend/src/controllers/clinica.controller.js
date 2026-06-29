import pool from '../config/db.js';

// GET /api/clinicas/:slug — Pública: perfil de la clínica por slug
export const getClinicaBySlug = async (req, res) => {
  const { slug } = req.params;

  try {
    const result = await pool.query(
      `SELECT id_clinica, nombre, slug, descripcion, ciudad, direccion,
              telefono, whatsapp, correo, logo_url, estado
       FROM clinicas
       WHERE slug = $1 AND estado = 'activa'`,
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Clínica no encontrada' });
    }

    // Servicios activos de la clínica
    const servicios = await pool.query(
      `SELECT id_servicio, nombre, descripcion, duracion_minutos, precio
       FROM servicios
       WHERE id_clinica = $1 AND activo = true`,
      [result.rows[0].id_clinica]
    );

    // Doctores activos
    const doctores = await pool.query(
      `SELECT id_doctor, nombre, especialidad
       FROM doctores
       WHERE id_clinica = $1 AND activo = true`,
      [result.rows[0].id_clinica]
    );

    // Horarios activos
    const horarios = await pool.query(
      `SELECT dia_semana, hora_inicio, hora_fin
       FROM horarios
       WHERE id_clinica = $1 AND activo = true
       ORDER BY CASE dia_semana
         WHEN 'lunes' THEN 1 WHEN 'martes' THEN 2 WHEN 'miercoles' THEN 3
         WHEN 'jueves' THEN 4 WHEN 'viernes' THEN 5 WHEN 'sabado' THEN 6
         WHEN 'domingo' THEN 7 END`,
      [result.rows[0].id_clinica]
    );

    res.json({
      clinica: result.rows[0],
      servicios: servicios.rows,
      doctores: doctores.rows,
      horarios: horarios.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener la clínica' });
  }
};

// GET /api/clinicas — Admin CitaHN: lista todas las clínicas
export const getClinicas = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id_clinica, nombre, slug, ciudad, estado, plan, fecha_creacion
       FROM clinicas
       ORDER BY fecha_creacion DESC`
    );
    res.json({ clinicas: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener clínicas' });
  }
};

// POST /api/clinicas — Admin CitaHN: crear clínica
export const createClinica = async (req, res) => {
  const { nombre, slug, descripcion, ciudad, direccion, telefono, whatsapp, correo, logo_url, plan } = req.body;

  if (!nombre || !slug) {
    return res.status(400).json({ error: 'Nombre y slug son requeridos' });
  }

  // Validar slug: solo letras, números y guiones
  const slugValido = /^[a-z0-9-]+$/.test(slug);
  if (!slugValido) {
    return res.status(400).json({ error: 'El slug solo puede contener letras minúsculas, números y guiones' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO clinicas (nombre, slug, descripcion, ciudad, direccion, telefono, whatsapp, correo, logo_url, plan)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [nombre, slug, descripcion, ciudad, direccion, telefono, whatsapp, correo, logo_url, plan]
    );
    res.status(201).json({ clinica: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ese slug ya está en uso' });
    }
    console.error(err);
    res.status(500).json({ error: 'Error al crear la clínica' });
  }
};

// PUT /api/clinicas/:id — Admin CitaHN o Admin Clínica: editar clínica
export const updateClinica = async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, ciudad, direccion, telefono, whatsapp, correo, logo_url, estado, plan } = req.body;

  // Si es admin_clinica, solo puede editar su propia clínica
  if (req.usuario.rol === 'admin_clinica' && req.usuario.id_clinica !== parseInt(id)) {
    return res.status(403).json({ error: 'No tienes permiso para editar esta clínica' });
  }

  try {
    const result = await pool.query(
      `UPDATE clinicas
       SET nombre = COALESCE($1, nombre),
           descripcion = COALESCE($2, descripcion),
           ciudad = COALESCE($3, ciudad),
           direccion = COALESCE($4, direccion),
           telefono = COALESCE($5, telefono),
           whatsapp = COALESCE($6, whatsapp),
           correo = COALESCE($7, correo),
           logo_url = COALESCE($8, logo_url),
           estado = COALESCE($9, estado),
           plan = COALESCE($10, plan)
       WHERE id_clinica = $11
       RETURNING *`,
      [nombre, descripcion, ciudad, direccion, telefono, whatsapp, correo, logo_url, estado, plan, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Clínica no encontrada' });
    }

    res.json({ clinica: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar la clínica' });
  }
};

// DELETE /api/clinicas/:id — Solo Admin CitaHN
export const deleteClinica = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE clinicas SET estado = 'suspendida' WHERE id_clinica = $1 RETURNING id_clinica, nombre, estado`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Clínica no encontrada' });
    }

    res.json({ mensaje: 'Clínica suspendida', clinica: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al suspender la clínica' });
  }
};
