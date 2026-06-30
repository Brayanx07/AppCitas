import { useState } from 'react';
import { getDisponibilidad, crearReserva } from '../../services/api';
import './FormReserva.css';

const PASOS = ['Servicio', 'Fecha y hora', 'Tus datos', 'Confirmación'];

const hoy = () => new Date().toISOString().split('T')[0];

export default function FormReserva({ clinica, servicios, doctores, onClose }) {
  const [paso, setPaso] = useState(0);
  const [form, setForm] = useState({
    id_servicio: '',
    id_doctor: '',
    fecha: '',
    hora: '',
    nombre: '',
    telefono: '',
    correo: '',
    motivo: '',
  });
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingReserva, setLoadingReserva] = useState(false);
  const [errorSlots, setErrorSlots] = useState('');
  const [errorReserva, setErrorReserva] = useState('');
  const [reservaExitosa, setReservaExitosa] = useState(null);
  const [errores, setErrores] = useState({});

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  // ===== PASO 1: elegir servicio =====
  const servicioSeleccionado = servicios.find(s => s.id_servicio === parseInt(form.id_servicio));

  // ===== PASO 2: elegir fecha y cargar slots =====
  const cargarSlots = async (fecha) => {
    if (!fecha || !form.id_servicio) return;
    setLoadingSlots(true);
    setErrorSlots('');
    setSlots([]);
    set('hora', '');
    try {
      const res = await getDisponibilidad(clinica.slug, fecha, form.id_servicio, form.id_doctor || undefined);
      setSlots(res.slots || []);
      if ((res.slots || []).length === 0) {
        setErrorSlots('No hay horarios disponibles para este día. Elige otra fecha.');
      }
    } catch {
      setErrorSlots('No se pudo cargar la disponibilidad. Intenta de nuevo.');
    } finally {
      setLoadingSlots(false);
    }
  };

  const onFechaChange = (e) => {
    set('fecha', e.target.value);
    cargarSlots(e.target.value);
  };

  // ===== PASO 3: validar datos del paciente =====
  const validarPaso3 = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = 'El nombre es requerido';
    if (!form.telefono.trim()) e.telefono = 'El teléfono es requerido';
    else if (!/^[\d\s\+\-\(\)]{7,}$/.test(form.telefono)) e.telefono = 'Teléfono inválido';
    if (form.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) e.correo = 'Correo inválido';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const siguiente = () => {
    if (paso === 2 && !validarPaso3()) return;
    setPaso(p => p + 1);
  };

  // ===== CONFIRMAR RESERVA =====
  const confirmar = async () => {
    setLoadingReserva(true);
    setErrorReserva('');
    try {
      const res = await crearReserva({
        slug: clinica.slug,
        nombre: form.nombre.trim(),
        telefono: form.telefono.trim(),
        correo: form.correo.trim() || undefined,
        id_servicio: parseInt(form.id_servicio),
        id_doctor: form.id_doctor ? parseInt(form.id_doctor) : undefined,
        fecha: form.fecha,
        hora: form.hora,
        motivo: form.motivo.trim() || undefined,
      });
      setReservaExitosa(res);
      setPaso(4);
    } catch (err) {
      setErrorReserva(err.message || 'Error al reservar. Intenta de nuevo.');
    } finally {
      setLoadingReserva(false);
    }
  };

  const puedeAvanzar = () => {
    if (paso === 0) return !!form.id_servicio;
    if (paso === 1) return !!form.fecha && !!form.hora;
    if (paso === 2) return !!form.nombre && !!form.telefono;
    return true;
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" role="dialog" aria-modal="true" aria-label="Reservar cita">

        {/* Header del modal */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Reservar cita</h2>
            <p className="modal-subtitle">{clinica.nombre}</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        {/* Progress steps */}
        {paso < 4 && (
          <div className="modal-steps">
            {PASOS.map((label, i) => (
              <div key={i} className={`step ${i === paso ? 'step--active' : i < paso ? 'step--done' : ''}`}>
                <div className="step__circle">
                  {i < paso ? '✓' : i + 1}
                </div>
                <span className="step__label">{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* ===== PASO 0: SERVICIO ===== */}
        {paso === 0 && (
          <div className="modal-content">
            <p className="modal-hint">¿Qué servicio necesitas?</p>
            <div className="servicio-select-list">
              {servicios.map(s => (
                <button
                  key={s.id_servicio}
                  className={`servicio-option ${form.id_servicio === String(s.id_servicio) ? 'servicio-option--selected' : ''}`}
                  onClick={() => set('id_servicio', String(s.id_servicio))}
                  type="button"
                >
                  <div className="servicio-option__check">
                    {form.id_servicio === String(s.id_servicio) && '✓'}
                  </div>
                  <div className="servicio-option__info">
                    <strong>{s.nombre}</strong>
                    <span>{s.duracion_minutos} min {s.precio ? `· L ${parseFloat(s.precio).toLocaleString()}` : ''}</span>
                  </div>
                </button>
              ))}
            </div>

            {doctores.length > 0 && (
              <div className="input-group mt-2">
                <label>Doctor (opcional)</label>
                <select value={form.id_doctor} onChange={e => set('id_doctor', e.target.value)}>
                  <option value="">Sin preferencia</option>
                  {doctores.map(d => (
                    <option key={d.id_doctor} value={d.id_doctor}>
                      {d.nombre}{d.especialidad ? ` — ${d.especialidad}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* ===== PASO 1: FECHA Y HORA ===== */}
        {paso === 1 && (
          <div className="modal-content">
            <div className="input-group">
              <label>Selecciona una fecha</label>
              <input
                type="date"
                min={hoy()}
                value={form.fecha}
                onChange={onFechaChange}
              />
            </div>

            {form.fecha && (
              <div className="slots-section">
                <p className="slots-label">Horas disponibles</p>
                {loadingSlots && (
                  <div className="slots-loading">
                    <div className="spinner spinner-sm"></div>
                    <span>Cargando horarios…</span>
                  </div>
                )}
                {errorSlots && !loadingSlots && (
                  <p className="slots-error">{errorSlots}</p>
                )}
                {!loadingSlots && slots.length > 0 && (
                  <div className="slots-grid">
                    {slots.map(slot => (
                      <button
                        key={slot}
                        type="button"
                        className={`slot-btn ${form.hora === slot ? 'slot-btn--selected' : ''}`}
                        onClick={() => set('hora', slot)}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===== PASO 2: DATOS DEL PACIENTE ===== */}
        {paso === 2 && (
          <div className="modal-content">
            <p className="modal-hint">Ingresa tus datos de contacto</p>
            <div className="form-grid">
              <div className={`input-group ${errores.nombre ? 'input-error' : ''}`}>
                <label>Nombre completo *</label>
                <input
                  type="text"
                  placeholder="Ej. María López"
                  value={form.nombre}
                  onChange={e => set('nombre', e.target.value)}
                />
                {errores.nombre && <span className="input-error-msg">{errores.nombre}</span>}
              </div>

              <div className={`input-group ${errores.telefono ? 'input-error' : ''}`}>
                <label>Teléfono *</label>
                <input
                  type="tel"
                  placeholder="+504 9999-9999"
                  value={form.telefono}
                  onChange={e => set('telefono', e.target.value)}
                />
                {errores.telefono && <span className="input-error-msg">{errores.telefono}</span>}
              </div>

              <div className={`input-group ${errores.correo ? 'input-error' : ''}`}>
                <label>Correo electrónico (opcional)</label>
                <input
                  type="email"
                  placeholder="tu@correo.com"
                  value={form.correo}
                  onChange={e => set('correo', e.target.value)}
                />
                {errores.correo && <span className="input-error-msg">{errores.correo}</span>}
              </div>

              <div className="input-group">
                <label>Motivo de la cita (opcional)</label>
                <textarea
                  rows={3}
                  placeholder="Describe brevemente el motivo de tu consulta…"
                  value={form.motivo}
                  onChange={e => set('motivo', e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ===== PASO 3: RESUMEN ===== */}
        {paso === 3 && (
          <div className="modal-content">
            <p className="modal-hint">Revisa los detalles de tu cita</p>
            <div className="resumen-box">
              <div className="resumen-row">
                <span>Clínica</span>
                <strong>{clinica.nombre}</strong>
              </div>
              <div className="resumen-row">
                <span>Servicio</span>
                <strong>{servicioSeleccionado?.nombre}</strong>
              </div>
              {form.id_doctor && (
                <div className="resumen-row">
                  <span>Doctor</span>
                  <strong>{doctores.find(d => d.id_doctor === parseInt(form.id_doctor))?.nombre}</strong>
                </div>
              )}
              <div className="resumen-row">
                <span>Fecha</span>
                <strong>{new Date(form.fecha + 'T00:00:00').toLocaleDateString('es-HN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
              </div>
              <div className="resumen-row">
                <span>Hora</span>
                <strong>{form.hora}</strong>
              </div>
              <div className="resumen-row">
                <span>Paciente</span>
                <strong>{form.nombre}</strong>
              </div>
              <div className="resumen-row">
                <span>Teléfono</span>
                <strong>{form.telefono}</strong>
              </div>
              {form.motivo && (
                <div className="resumen-row">
                  <span>Motivo</span>
                  <strong>{form.motivo}</strong>
                </div>
              )}
            </div>

            {errorReserva && (
              <div className="reserva-error">
                <span>⚠️</span> {errorReserva}
              </div>
            )}
          </div>
        )}

        {/* ===== PASO 4: ÉXITO ===== */}
        {paso === 4 && reservaExitosa && (
          <div className="modal-content modal-success">
            <div className="success-icon">✅</div>
            <h3>¡Cita reservada!</h3>
            <p>{reservaExitosa.mensaje}</p>
            <div className="resumen-box mt-2">
              <div className="resumen-row">
                <span>Servicio</span>
                <strong>{reservaExitosa.cita?.nombre_servicio}</strong>
              </div>
              <div className="resumen-row">
                <span>Fecha</span>
                <strong>
                  {new Date((reservaExitosa.cita?.fecha || '').toString().slice(0, 10) + 'T00:00:00').toLocaleDateString('es-HN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </strong>
              </div>
              <div className="resumen-row">
                <span>Hora</span>
                <strong>{String(reservaExitosa.cita?.hora).slice(0,5)}</strong>
              </div>
            </div>
            <p className="success-note">
              Guarda esta información. La clínica se pondrá en contacto contigo para confirmar tu cita.
            </p>
            <button className="btn btn-primary btn-full mt-2" onClick={onClose}>
              Cerrar
            </button>
          </div>
        )}

        {/* ===== FOOTER NAVEGACIÓN ===== */}
        {paso < 4 && (
          <div className="modal-footer">
            {paso > 0 ? (
              <button className="btn btn-ghost" onClick={() => setPaso(p => p - 1)}>
                ← Atrás
              </button>
            ) : (
              <button className="btn btn-ghost" onClick={onClose}>
                Cancelar
              </button>
            )}

            {paso < 3 ? (
              <button
                className="btn btn-primary"
                onClick={siguiente}
                disabled={!puedeAvanzar()}
              >
                Siguiente →
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={confirmar}
                disabled={loadingReserva}
              >
                {loadingReserva ? (
                  <><div className="spinner spinner-sm"></div> Reservando…</>
                ) : (
                  'Confirmar cita'
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
