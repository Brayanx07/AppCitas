const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('citahn_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) throw new Error(data.error || 'Error en la solicitud');
  return data;
};

// Clínicas
export const getClinicaBySlug = (slug) => request(`/clinicas/slug/${slug}`);

// Disponibilidad
export const getDisponibilidad = (slug, fecha, id_servicio, id_doctor) => {
  const params = new URLSearchParams({ slug, fecha, id_servicio });
  if (id_doctor) params.append('id_doctor', id_doctor);
  return request(`/disponibilidad?${params}`);
};

// Reserva pública
export const crearReserva = (data) =>
  request('/reservas', { method: 'POST', body: JSON.stringify(data) });

// Auth
export const login = (correo, password) =>
  request('/auth/login', { method: 'POST', body: JSON.stringify({ correo, password }) });

export const getMe = () => request('/auth/me');

// Panel — Citas
export const getCitas = (params = {}) =>
  request(`/citas?${new URLSearchParams(params)}`);

export const getCitasHoy = () => request('/citas/hoy');

export const cambiarEstadoCita = (id, estado) =>
  request(`/citas/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) });

export const reprogramarCita = (id, fecha, hora) =>
  request(`/citas/${id}/reprogramar`, { method: 'PATCH', body: JSON.stringify({ fecha, hora }) });

// Panel — Servicios
export const getServicios = () => request('/servicios');
export const createServicio = (data) =>
  request('/servicios', { method: 'POST', body: JSON.stringify(data) });
export const updateServicio = (id, data) =>
  request(`/servicios/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteServicio = (id) =>
  request(`/servicios/${id}`, { method: 'DELETE' });

// Panel — Doctores
export const getDoctores = () => request('/doctores');
export const createDoctor = (data) =>
  request('/doctores', { method: 'POST', body: JSON.stringify(data) });
export const updateDoctor = (id, data) =>
  request(`/doctores/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteDoctor = (id) =>
  request(`/doctores/${id}`, { method: 'DELETE' });

// Panel — Pacientes
export const getPacientes = (params = {}) =>
  request(`/pacientes?${new URLSearchParams(params)}`);
export const getPacienteById = (id) => request(`/pacientes/${id}`);

// Panel — Reportes
export const getResumen = () => request('/reportes/resumen');
export const getReporteCitas = (mes) =>
  request(`/reportes/citas${mes ? `?mes=${mes}` : ''}`);
export const getReporteServicios = (mes) =>
  request(`/reportes/servicios${mes ? `?mes=${mes}` : ''}`);
