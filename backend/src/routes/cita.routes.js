import { Router } from 'express';
import {
  getCitas,
  getCitasHoy,
  getCitaById,
  cambiarEstado,
  reprogramarCita,
} from '../controllers/cita.controller.js';
import { verificarToken, soloRoles } from '../middleware/auth.middleware.js';

const router = Router();

router.use(verificarToken);

router.get('/', getCitas);
router.get('/hoy', getCitasHoy);
router.get('/:id', getCitaById);
router.patch('/:id/estado', soloRoles('admin_clinica', 'recepcionista', 'admin_citahn'), cambiarEstado);
router.patch('/:id/reprogramar', soloRoles('admin_clinica', 'recepcionista', 'admin_citahn'), reprogramarCita);

export default router;
