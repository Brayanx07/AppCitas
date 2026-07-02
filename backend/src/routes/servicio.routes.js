import { Router } from 'express';
import {
  getServicios,
  getServicioById,
  createServicio,
  updateServicio,
  deleteServicio,
} from '../controllers/servicio.controller.js';
import { verificarToken, soloRoles } from '../middleware/auth.middleware.js';

const router = Router();

// Todas requieren token
router.use(verificarToken);

router.get('/', getServicios);
router.get('/:id', getServicioById);
router.post('/', soloRoles('admin_clinica', 'admin_citahn'), createServicio);
router.put('/:id', soloRoles('admin_clinica', 'admin_citahn'), updateServicio);
router.delete('/:id', soloRoles('admin_clinica', 'admin_citahn'), deleteServicio);

export default router;
