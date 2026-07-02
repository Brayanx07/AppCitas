import { Router } from 'express';
import {
  getPacientes,
  getPacienteById,
  updatePaciente,
  deletePaciente,
} from '../controllers/paciente.controller.js';
import { verificarToken, soloRoles } from '../middleware/auth.middleware.js';

const router = Router();

router.use(verificarToken);

router.get('/', getPacientes);
router.get('/:id', getPacienteById);
router.put('/:id', soloRoles('admin_clinica', 'recepcionista', 'admin_citahn'), updatePaciente);
router.delete('/:id', soloRoles('admin_clinica', 'admin_citahn'), deletePaciente);

export default router;
