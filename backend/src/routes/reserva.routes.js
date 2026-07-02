import { Router } from 'express';
import { crearReserva } from '../controllers/reserva.controller.js';

const router = Router();

// Pública — sin token
router.post('/', crearReserva);

export default router;
