import { Router } from 'express';
import {
  getClinicaBySlug,
  getClinicas,
  createClinica,
  updateClinica,
  deleteClinica,
} from '../controllers/clinica.controller.js';
import { verificarToken, soloRoles } from '../middleware/auth.middleware.js';

const router = Router();

// Pública — no requiere token
router.get('/slug/:slug', getClinicaBySlug);

// Privadas — requieren token
router.get('/', verificarToken, soloRoles('admin_citahn'), getClinicas);
router.post('/', verificarToken, soloRoles('admin_citahn'), createClinica);
router.put('/:id', verificarToken, soloRoles('admin_citahn', 'admin_clinica'), updateClinica);
router.delete('/:id', verificarToken, soloRoles('admin_citahn'), deleteClinica);

export default router;
