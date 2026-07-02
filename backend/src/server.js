import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes.js';
import clinicaRoutes from './routes/clinica.routes.js';
import servicioRoutes from './routes/servicio.routes.js';
import horarioRoutes from './routes/horario.routes.js';
import disponibilidadRoutes from './routes/disponibilidad.routes.js';
import reservaRoutes from './routes/reserva.routes.js';
import citaRoutes from './routes/cita.routes.js';
import doctorRoutes from './routes/doctor.routes.js';
import pacienteRoutes from './routes/paciente.routes.js';
import reporteRoutes from './routes/reporte.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/clinicas', clinicaRoutes);
app.use('/api/servicios', servicioRoutes);
app.use('/api/horarios', horarioRoutes);
app.use('/api/disponibilidad', disponibilidadRoutes);
app.use('/api/reservas', reservaRoutes);
app.use('/api/citas', citaRoutes);
app.use('/api/doctores', doctorRoutes);
app.use('/api/pacientes', pacienteRoutes);
app.use('/api/reportes', reporteRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CitaHN backend running' });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
