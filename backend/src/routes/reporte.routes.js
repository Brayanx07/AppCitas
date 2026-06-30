import { Router } from 'express';
import {
  getResumen,
  getReporteCitas,
  getReporteServicios,
  getReporteDoctores,
  getPacientesFrecuentes,
} from '../controllers/reporte.controller.js';
import { verificarToken, soloRoles } from '../middleware/auth.middleware.js';

const router = Router();

router.use(verificarToken);
router.use(soloRoles('admin_clinica', 'admin_citahn'));

router.get('/resumen', getResumen);
router.get('/citas', getReporteCitas);
router.get('/servicios', getReporteServicios);
router.get('/doctores', getReporteDoctores);
router.get('/pacientes-frecuentes', getPacientesFrecuentes);

export default router;
