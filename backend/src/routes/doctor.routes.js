import { Router } from 'express';
import {
  getDoctores,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} from '../controllers/doctor.controller.js';
import { verificarToken, soloRoles } from '../middleware/auth.middleware.js';

const router = Router();

router.use(verificarToken);

// Lectura: admin, recepcionista y el propio doctor pueden ver
router.get('/', getDoctores);
router.get('/:id', getDoctorById);

// Escritura: solo admin
router.post('/', soloRoles('admin_clinica', 'admin_citahn'), createDoctor);
router.put('/:id', soloRoles('admin_clinica', 'admin_citahn'), updateDoctor);
router.delete('/:id', soloRoles('admin_clinica', 'admin_citahn'), deleteDoctor);

export default router;
