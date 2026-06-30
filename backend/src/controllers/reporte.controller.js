import pool from '../config/db.js';

// GET /api/reportes/resumen — Resumen general del panel (dashboard)
export const getResumen = async (req, res) => {
  const id_clinica = req.usuario.id_clinica;

  try {
    const [citasHoy, citasMes, pacientesTotal, citasPendientes] = await Promise.all([
      // Citas de hoy por estado
      pool.query(
        `SELECT estado, COUNT(*) AS total
         FROM citas WHERE id_clinica = $1 AND fecha = CURRENT_DATE
         GROUP BY estado`,
        [id_clinica]
      ),
      // Citas del mes actual por estado
      pool.query(
        `SELECT estado, COUNT(*) AS total
         FROM citas
         WHERE id_clinica = $1
           AND DATE_TRUNC('month', fecha) = DATE_TRUNC('month', CURRENT_DATE)
         GROUP BY estado`,
        [id_clinica]
      ),
      // Total de pacientes registrados
      pool.query(
        `SELECT COUNT(*) AS total FROM pacientes WHERE id_clinica = $1`,
        [id_clinica]
      ),
      // Citas pendientes de confirmación
      pool.query(
        `SELECT COUNT(*) AS total
         FROM citas WHERE id_clinica = $1 AND estado = 'pendiente' AND fecha >= CURRENT_DATE`,
        [id_clinica]
      ),
    ]);

    // Normalizar citas de hoy
    const hoy = {};
    citasHoy.rows.forEach(r => { hoy[r.estado] = parseInt(r.total); });

    // Normalizar citas del mes
    const mes = {};
    citasMes.rows.forEach(r => { mes[r.estado] = parseInt(r.total); });

    res.json({
      hoy: {
        total: Object.values(hoy).reduce((a, b) => a + b, 0),
        pendiente: hoy.pendiente || 0,
        confirmada: hoy.confirmada || 0,
        atendida: hoy.atendida || 0,
        cancelada: hoy.cancelada || 0,
        no_asistio: hoy.no_asistio || 0,
      },
      mes: {
        total: Object.values(mes).reduce((a, b) => a + b, 0),
        pendiente: mes.pendiente || 0,
        confirmada: mes.confirmada || 0,
        atendida: mes.atendida || 0,
        cancelada: mes.cancelada || 0,
        no_asistio: mes.no_asistio || 0,
        reprogramada: mes.reprogramada || 0,
      },
      pacientes_total: parseInt(pacientesTotal.rows[0].total),
      citas_por_confirmar: parseInt(citasPendientes.rows[0].total),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener resumen' });
  }
};

// GET /api/reportes/citas?mes=2026-06 — Reporte de citas por mes
export const getReporteCitas = async (req, res) => {
  const id_clinica = req.usuario.id_clinica;
  const { mes } = req.query; // formato: YYYY-MM

  const fechaRef = mes ? `${mes}-01` : null;

  try {
    const result = await pool.query(
      `SELECT
        c.id_cita,
        c.fecha,
        c.hora,
        c.estado,
        p.nombre AS paciente,
        p.telefono,
        s.nombre AS servicio,
        d.nombre AS doctor
      FROM citas c
      JOIN pacientes p ON c.id_paciente = p.id_paciente
      JOIN servicios s ON c.id_servicio = s.id_servicio
      LEFT JOIN doctores d ON c.id_doctor = d.id_doctor
      WHERE c.id_clinica = $1
        AND DATE_TRUNC('month', c.fecha) = DATE_TRUNC('month', $2::date)
      ORDER BY c.fecha, c.hora`,
      [id_clinica, fechaRef || new Date().toISOString().split('T')[0]]
    );

    // Totales por estado
    const totales = result.rows.reduce((acc, c) => {
      acc[c.estado] = (acc[c.estado] || 0) + 1;
      return acc;
    }, {});

    res.json({
      mes: mes || new Date().toISOString().slice(0, 7),
      total: result.rows.length,
      totales,
      citas: result.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener reporte de citas' });
  }
};

// GET /api/reportes/servicios — Servicios más solicitados
export const getReporteServicios = async (req, res) => {
  const id_clinica = req.usuario.id_clinica;
  const { mes } = req.query;

  const fechaRef = mes ? `${mes}-01` : null;

  try {
    const result = await pool.query(
      `SELECT
        s.nombre AS servicio,
        COUNT(c.id_cita) AS total_citas,
        SUM(CASE WHEN c.estado = 'atendida' THEN 1 ELSE 0 END) AS atendidas,
        SUM(CASE WHEN c.estado = 'cancelada' THEN 1 ELSE 0 END) AS canceladas,
        SUM(CASE WHEN c.estado = 'no_asistio' THEN 1 ELSE 0 END) AS no_asistieron
      FROM servicios s
      LEFT JOIN citas c ON c.id_servicio = s.id_servicio
        AND c.id_clinica = $1
        AND ($2::date IS NULL OR DATE_TRUNC('month', c.fecha) = DATE_TRUNC('month', $2::date))
      WHERE s.id_clinica = $1
      GROUP BY s.id_servicio, s.nombre
      ORDER BY total_citas DESC`,
      [id_clinica, fechaRef]
    );

    res.json({ servicios: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener reporte de servicios' });
  }
};

// GET /api/reportes/doctores — Doctores con más citas
export const getReporteDoctores = async (req, res) => {
  const id_clinica = req.usuario.id_clinica;
  const { mes } = req.query;

  const fechaRef = mes ? `${mes}-01` : null;

  try {
    const result = await pool.query(
      `SELECT
        d.nombre AS doctor,
        d.especialidad,
        COUNT(c.id_cita) AS total_citas,
        SUM(CASE WHEN c.estado = 'atendida' THEN 1 ELSE 0 END) AS atendidas,
        SUM(CASE WHEN c.estado = 'cancelada' THEN 1 ELSE 0 END) AS canceladas,
        SUM(CASE WHEN c.estado = 'no_asistio' THEN 1 ELSE 0 END) AS no_asistieron
      FROM doctores d
      LEFT JOIN citas c ON c.id_doctor = d.id_doctor
        AND c.id_clinica = $1
        AND ($2::date IS NULL OR DATE_TRUNC('month', c.fecha) = DATE_TRUNC('month', $2::date))
      WHERE d.id_clinica = $1 AND d.activo = true
      GROUP BY d.id_doctor, d.nombre, d.especialidad
      ORDER BY total_citas DESC`,
      [id_clinica, fechaRef]
    );

    res.json({ doctores: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener reporte de doctores' });
  }
};

// GET /api/reportes/pacientes-frecuentes — Pacientes que más visitan la clínica
export const getPacientesFrecuentes = async (req, res) => {
  const id_clinica = req.usuario.id_clinica;

  try {
    const result = await pool.query(
      `SELECT
        p.nombre,
        p.telefono,
        COUNT(c.id_cita) AS total_visitas,
        MAX(c.fecha) AS ultima_visita,
        SUM(CASE WHEN c.estado = 'no_asistio' THEN 1 ELSE 0 END) AS inasistencias
      FROM pacientes p
      JOIN citas c ON c.id_paciente = p.id_paciente
      WHERE p.id_clinica = $1
      GROUP BY p.id_paciente, p.nombre, p.telefono
      HAVING COUNT(c.id_cita) > 0
      ORDER BY total_visitas DESC
      LIMIT 20`,
      [id_clinica]
    );

    res.json({ pacientes: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener pacientes frecuentes' });
  }
};
