import pool from '../config/db.js';

// GET /api/servicios — Lista servicios de la clínica del usuario logueado
export const getServicios = async (req, res) => {
  const id_clinica = req.usuario.id_clinica;

  try {
    const result = await pool.query(
      `SELECT * FROM servicios WHERE id_clinica = $1 ORDER BY nombre`,
      [id_clinica]
    );
    res.json({ servicios: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener servicios' });
  }
};

// GET /api/servicios/:id — Detalle de un servicio
export const getServicioById = async (req, res) => {
  const { id } = req.params;
  const id_clinica = req.usuario.id_clinica;

  try {
    const result = await pool.query(
      `SELECT * FROM servicios WHERE id_servicio = $1 AND id_clinica = $2`,
      [id, id_clinica]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    res.json({ servicio: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener servicio' });
  }
};

// POST /api/servicios — Crear servicio
export const createServicio = async (req, res) => {
  const id_clinica = req.usuario.id_clinica;
  const { nombre, descripcion, duracion_minutos, precio } = req.body;

  if (!nombre) {
    return res.status(400).json({ error: 'El nombre del servicio es requerido' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO servicios (id_clinica, nombre, descripcion, duracion_minutos, precio)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id_clinica, nombre, descripcion, duracion_minutos || 30, precio || null]
    );
    res.status(201).json({ servicio: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear servicio' });
  }
};

// PUT /api/servicios/:id — Editar servicio
export const updateServicio = async (req, res) => {
  const { id } = req.params;
  const id_clinica = req.usuario.id_clinica;
  const { nombre, descripcion, duracion_minutos, precio, activo } = req.body;

  try {
    const result = await pool.query(
      `UPDATE servicios
       SET nombre = COALESCE($1, nombre),
           descripcion = COALESCE($2, descripcion),
           duracion_minutos = COALESCE($3, duracion_minutos),
           precio = COALESCE($4, precio),
           activo = COALESCE($5, activo)
       WHERE id_servicio = $6 AND id_clinica = $7
       RETURNING *`,
      [nombre, descripcion, duracion_minutos, precio, activo, id, id_clinica]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    res.json({ servicio: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar servicio' });
  }
};

// DELETE /api/servicios/:id — Desactivar servicio (no se borra físicamente)
export const deleteServicio = async (req, res) => {
  const { id } = req.params;
  const id_clinica = req.usuario.id_clinica;

  try {
    const result = await pool.query(
      `UPDATE servicios SET activo = false WHERE id_servicio = $1 AND id_clinica = $2 RETURNING id_servicio, nombre, activo`,
      [id, id_clinica]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    res.json({ mensaje: 'Servicio desactivado', servicio: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al desactivar servicio' });
  }
};
