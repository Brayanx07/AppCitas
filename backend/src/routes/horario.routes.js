import { Router } from 'express';
import {
  getHorarios,
  createHorario,
  updateHorario,
  deleteHorario,
} from '../controllers/horario.controller.js';
import { verificarToken, soloRoles } from '../middleware/auth.middleware.js';

const router = Router();

router.use(verificarToken);

router.get('/', getHorarios);
router.post('/', soloRoles('admin_clinica', 'admin_citahn'), createHorario);
router.put('/:id', soloRoles('admin_clinica', 'admin_citahn'), updateHorario);
router.delete('/:id', soloRoles('admin_clinica', 'admin_citahn'), deleteHorario);

export default router;
