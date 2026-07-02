import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

export const register = async (req, res) => {
  const { nombre, correo, password, rol, id_clinica } = req.body;

  if (!nombre || !correo || !password || !rol) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  try {
    // Verificar si ya existe
    const existe = await pool.query('SELECT id_usuario FROM usuarios WHERE correo = $1', [correo]);
    if (existe.rows.length > 0) {
      return res.status(409).json({ error: 'El correo ya está registrado' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO usuarios (nombre, correo, password_hash, rol, id_clinica)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id_usuario, nombre, correo, rol, id_clinica, fecha_creacion`,
      [nombre, correo, password_hash, rol, id_clinica || null]
    );

    res.status(201).json({ usuario: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

export const login = async (req, res) => {
  const { correo, password } = req.body;

  if (!correo || !password) {
    return res.status(400).json({ error: 'Correo y contraseña requeridos' });
  }

  try {
    const result = await pool.query(
      `SELECT u.*, c.nombre AS nombre_clinica, c.slug
       FROM usuarios u
       LEFT JOIN clinicas c ON u.id_clinica = c.id_clinica
       WHERE u.correo = $1 AND u.estado = 'activo'`,
      [correo]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const usuario = result.rows[0];
    const passwordOk = await bcrypt.compare(password, usuario.password_hash);

    if (!passwordOk) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      {
        id_usuario: usuario.id_usuario,
        correo: usuario.correo,
        rol: usuario.rol,
        id_clinica: usuario.id_clinica,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
        id_clinica: usuario.id_clinica,
        nombre_clinica: usuario.nombre_clinica,
        slug: usuario.slug,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

export const me = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id_usuario, u.nombre, u.correo, u.rol, u.id_clinica, u.fecha_creacion,
              c.nombre AS nombre_clinica, c.slug
       FROM usuarios u
       LEFT JOIN clinicas c ON u.id_clinica = c.id_clinica
       WHERE u.id_usuario = $1`,
      [req.usuario.id_usuario]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ usuario: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
};
