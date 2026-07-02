import { Router } from 'express';
import { getDisponibilidad } from '../controllers/disponibilidad.controller.js';

const router = Router();

// Pública — el paciente consulta disponibilidad sin token
router.get('/', getDisponibilidad);

export default router;
