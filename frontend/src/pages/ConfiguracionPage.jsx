import { useState, useEffect, useRef } from 'react';
import './ConfiguracionPage.css';

const STORAGE_KEY = 'citahn_config_v1';

const MONEDAS = {
  lempira: { nombre: 'Lempira', simbolo: 'L' },
  dolar:   { nombre: 'Dólar',   simbolo: '$' },
  colon:   { nombre: 'Colón',   simbolo: '₡' },
  quetzal: { nombre: 'Quetzal', simbolo: 'Q' },
  peso_mx: { nombre: 'Peso MX', simbolo: 'MX$' },
  euro:    { nombre: 'Euro',    simbolo: '€' },
};

const TIPOS = {
  dental:       'Dental',
  dermatologia: 'Dermatología',
  psicologia:   'Psicología',
  general:      'Medicina general',
  estetica:     'Estética',
  nutricion:    'Nutrición',
  veterinaria:  'Veterinaria',
  otra:         'Otra',
};

const SERVICIOS_EJEMPLO = {
  dental:       [
    { nombre: 'Consulta',          precio: 350, duracion: 30, descripcion: 'Evaluación inicial y diagnóstico.' },
    { nombre: 'Limpieza dental',   precio: 600, duracion: 45, descripcion: 'Profilaxis y remoción de sarro.' },
    { nombre: 'Extracción',        precio: 800, duracion: 40, descripcion: 'Extracción simple.' },
    { nombre: 'Resina',            precio: 750, duracion: 50, descripcion: 'Restauración estética.' },
  ],
  dermatologia: [
    { nombre: 'Consulta dermatológica', precio: 700, duracion: 30, descripcion: 'Valoración de piel.' },
    { nombre: 'Limpieza facial',        precio: 900, duracion: 60, descripcion: 'Limpieza profunda.' },
    { nombre: 'Crioterapia',            precio: 500, duracion: 20, descripcion: 'Remoción con frío.' },
  ],
  psicologia:   [
    { nombre: 'Sesión individual',    precio: 650, duracion: 50, descripcion: 'Terapia personal.' },
    { nombre: 'Terapia de pareja',    precio: 900, duracion: 60, descripcion: 'Sesión para parejas.' },
    { nombre: 'Evaluación psicológica', precio: 1100, duracion: 90, descripcion: 'Pruebas y diagnóstico.' },
  ],
  general:      [
    { nombre: 'Consulta general',   precio: 400, duracion: 30, descripcion: 'Atención médica general.' },
    { nombre: 'Chequeo médico',     precio: 800, duracion: 45, descripcion: 'Revisión completa.' },
    { nombre: 'Certificado médico', precio: 300, duracion: 20, descripcion: 'Emisión de constancia.' },
  ],
  estetica:     [
    { nombre: 'Limpieza facial',     precio: 700,  duracion: 60, descripcion: 'Limpieza e hidratación.' },
    { nombre: 'Masaje reductivo',    precio: 850,  duracion: 60, descripcion: 'Masaje moldeador.' },
    { nombre: 'Depilación láser',    precio: 1200, duracion: 45, descripcion: 'Por sesión.' },
  ],
  nutricion:    [
    { nombre: 'Consulta nutricional', precio: 500, duracion: 45, descripcion: 'Plan inicial.' },
    { nombre: 'Control de peso',      precio: 300, duracion: 20, descripcion: 'Seguimiento mensual.' },
  ],
  veterinaria:  [
    { nombre: 'Consulta veterinaria', precio: 350, duracion: 30, descripcion: 'Revisión de mascota.' },
    { nombre: 'Vacunación',           precio: 450, duracion: 20, descripcion: 'Aplicación de vacunas.' },
    { nombre: 'Baño y estética',      precio: 400, duracion: 60, descripcion: 'Baño y corte.' },
  ],
  otra:         [{ nombre: 'Consulta general', precio: 400, duracion: 30, descripcion: 'Servicio principal.' }],
};

const TEMAS = [
  { id: 'azul',     nombre: 'Azul',          etiqueta: 'Por defecto',  color: '#2563EB' },
  { id: 'indigo',   nombre: 'Índigo',         etiqueta: 'Profesional', color: '#6366f1' },
  { id: 'turquesa', nombre: 'Turquesa',       etiqueta: 'Fresco',      color: '#14b8a6' },
  { id: 'verde',    nombre: 'Verde',          etiqueta: 'Natural',     color: '#16a34a' },
  { id: 'rosado',   nombre: 'Rosado',         etiqueta: 'Cálido',      color: '#ec4899' },
  { id: 'naranja',  nombre: 'Naranja',        etiqueta: 'Energético',  color: '#f97316' },
  { id: 'gris',     nombre: 'Gris',           etiqueta: 'Neutro',      color: '#6b7280' },
  { id: 'negro',    nombre: 'Blanco y negro', etiqueta: 'Minimalista', color: '#111827' },
];

const ESTADO_INICIAL = {
  clinica:   { nombre: 'Mi Clínica', tipo: 'dental', logo: null, moneda: 'lempira' },
  acceso:    { pin: '', telefono: '', direccion: '', horario: 'Lun–Vie 8:00 a.m. – 5:00 p.m.' },
  servicios: SERVICIOS_EJEMPLO.dental.map((s, i) => ({ id: Date.now() + i, ...s })),
  tema:      'azul',
};

/* ====== Iconos ====== */
const Ico = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const ICONS = {
  citas:      'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  pacientes:  'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 100-8 4 4 0 000 8z',
  pagos:      'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  reportes:   'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  config:     'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  search:     'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  user:       'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  portal:     'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14',
  logout:     'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  plus:       'M12 4v16m8-8H4',
  edit:       'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  trash:      'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
  check:      'M5 13l4 4L19 7',
  x:          'M6 18L18 6M6 6l12 12',
  clock:      'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  image:      'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  clinica:    'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  servicios:  'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  tema:       'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01',
};

const NAV_ITEMS = [
  { id: 'citas',      label: 'Citas',          icon: 'citas' },
  { id: 'pacientes',  label: 'Pacientes',       icon: 'pacientes' },
  { id: 'pagos',      label: 'Pagos',           icon: 'pagos' },
  { id: 'reportes',   label: 'Reportes',        icon: 'reportes' },
  { id: 'config',     label: 'Configuración',   icon: 'config' },
];

export default function ConfiguracionPage() {
  const [estado, setEstado]           = useState(ESTADO_INICIAL);
  const [cargado, setCargado]         = useState(false);
  const [busqueda, setBusqueda]       = useState('');
  const [toast, setToast]             = useState(null);
  const [modalServicio, setModalServicio] = useState(null);
  const [confirmar, setConfirmar]     = useState(null);
  const fileRef                       = useRef(null);

  /* Cargar desde localStorage */
  useEffect(() => {
    try {
      const guardado = localStorage.getItem(STORAGE_KEY);
      if (guardado) setEstado(prev => ({ ...prev, ...JSON.parse(guardado) }));
    } catch {}
    setCargado(true);
  }, []);

  const moneda = MONEDAS[estado.clinica.moneda] || MONEDAS.lempira;

  const setClinica = (k, v) => setEstado(e => ({ ...e, clinica: { ...e.clinica, [k]: v } }));
  const setAcceso  = (k, v) => setEstado(e => ({ ...e, acceso:  { ...e.acceso,  [k]: v } }));

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2600); };

  const guardar = (msg = 'Cambios guardados') => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(estado)); showToast(msg); }
    catch { showToast('No se pudo guardar'); }
  };

  const subirLogo = (ev) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setClinica('logo', reader.result);
    reader.readAsDataURL(file);
  };

  const guardarServicio = (datos) => {
    setEstado(e => {
      const servicios = datos.id
        ? e.servicios.map(s => s.id === datos.id ? { ...s, ...datos } : s)
        : [...e.servicios, { ...datos, id: Date.now() }];
      return { ...e, servicios };
    });
    setModalServicio(null);
    showToast(datos.id ? 'Servicio actualizado' : 'Servicio agregado');
  };

  const eliminarServicio = (id) => {
    setEstado(e => ({ ...e, servicios: e.servicios.filter(s => s.id !== id) }));
    setConfirmar(null);
    showToast('Servicio eliminado');
  };

  const cargarEjemplos = () => {
    const ejemplos = SERVICIOS_EJEMPLO[estado.clinica.tipo] || SERVICIOS_EJEMPLO.otra;
    setEstado(e => ({ ...e, servicios: ejemplos.map((s, i) => ({ id: Date.now() + i, ...s })) }));
    showToast('Ejemplos cargados');
  };

  const serviciosFiltrados = estado.servicios.filter(s =>
    s.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (!cargado) return null;

  return (
    <div className="panel">
      {/* ===== SIDEBAR ===== */}
      <aside className="panel-sidebar">
        <div className="panel-sidebar__brand">
          <div className="panel-sidebar__avatar">
            {estado.clinica.logo
              ? <img src={estado.clinica.logo} alt="logo" />
              : estado.clinica.nombre.charAt(0).toUpperCase()
            }
          </div>
          <div className="panel-sidebar__brand-info">
            <p className="panel-sidebar__nombre">{estado.clinica.nombre}</p>
            <p className="panel-sidebar__tipo">{TIPOS[estado.clinica.tipo]}</p>
          </div>
        </div>

        <nav className="panel-sidebar__nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`panel-nav-item ${item.id === 'config' ? 'panel-nav-item--active' : ''}`}
            >
              <Ico d={ICONS[item.icon]} size={17} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="panel-sidebar__footer">
          <div className="panel-sidebar__user">
            <Ico d={ICONS.user} size={16} />
            Administrador
          </div>
          <button className="panel-footer-btn">
            <Ico d={ICONS.portal} size={16} />
            Ver portal del paciente
          </button>
          <button className="panel-footer-btn">
            <Ico d={ICONS.logout} size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ===== CONTENIDO ===== */}
      <div className="panel-main">
        {/* Topbar */}
        <header className="panel-topbar">
          <h1>Configuración</h1>
          <div className="panel-search">
            <Ico d={ICONS.search} size={16} />
            <input
              type="text"
              placeholder="Buscar servicios…"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>
        </header>

        <div className="panel-content">

          {/* ===== 1. DATOS DE LA CLÍNICA ===== */}
          <div className="panel-card">
            <div className="panel-card__header">
              <h2 className="panel-card__title">
                <Ico d={ICONS.clinica} size={17} />
                Datos de la clínica
              </h2>
            </div>
            <div className="panel-card__body">
              <div className="form-grid-2">
                <div className="input-group">
                  <label>Nombre de la clínica</label>
                  <input
                    type="text"
                    value={estado.clinica.nombre}
                    onChange={e => setClinica('nombre', e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label>Tipo / especialidad</label>
                  <select value={estado.clinica.tipo} onChange={e => setClinica('tipo', e.target.value)}>
                    {Object.entries(TIPOS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label>Moneda</label>
                  <select value={estado.clinica.moneda} onChange={e => setClinica('moneda', e.target.value)}>
                    {Object.entries(MONEDAS).map(([k, v]) => (
                      <option key={k} value={k}>{v.nombre} ({v.simbolo})</option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label>Logo</label>
                  <div className="logo-upload">
                    <div className="logo-preview">
                      {estado.clinica.logo
                        ? <img src={estado.clinica.logo} alt="logo" />
                        : <Ico d={ICONS.image} size={22} />
                      }
                    </div>
                    <div className="logo-btns">
                      <input ref={fileRef} type="file" accept="image/*" onChange={subirLogo} style={{ display: 'none' }} />
                      <button className="btn btn-outline btn-sm" onClick={() => fileRef.current?.click()}>
                        Subir imagen
                      </button>
                      {estado.clinica.logo && (
                        <button className="btn btn-ghost btn-sm" onClick={() => setClinica('logo', null)}>
                          Quitar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===== 2. ACCESO Y CONTACTO ===== */}
          <div className="panel-card">
            <div className="panel-card__header">
              <h2 className="panel-card__title">
                <Ico d={ICONS.user} size={17} />
                Acceso y contacto
              </h2>
            </div>
            <div className="panel-card__body">
              <div className="form-grid-2">
                <div className="input-group">
                  <label>PIN de administrador</label>
                  <input
                    type="password"
                    value={estado.acceso.pin}
                    onChange={e => setAcceso('pin', e.target.value)}
                    placeholder="••••"
                  />
                </div>
                <div className="input-group">
                  <label>Teléfono / WhatsApp</label>
                  <input
                    type="tel"
                    value={estado.acceso.telefono}
                    onChange={e => setAcceso('telefono', e.target.value)}
                    placeholder="+504 9999-9999"
                  />
                </div>
                <div className="input-group">
                  <label>Dirección</label>
                  <input
                    type="text"
                    value={estado.acceso.direccion}
                    onChange={e => setAcceso('direccion', e.target.value)}
                    placeholder="Col. Palmira, Tegucigalpa"
                  />
                </div>
                <div className="input-group">
                  <label>Horario de atención</label>
                  <input
                    type="text"
                    value={estado.acceso.horario}
                    onChange={e => setAcceso('horario', e.target.value)}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                <button className="btn btn-primary" onClick={() => guardar()}>
                  Guardar cambios
                </button>
              </div>
            </div>
          </div>

          {/* ===== 3. SERVICIOS ===== */}
          <div className="panel-card">
            <div className="panel-card__header">
              <h2 className="panel-card__title">
                <Ico d={ICONS.servicios} size={17} />
                Servicios
                <span className="badge badge-gray" style={{ marginLeft: '0.5rem', fontWeight: 500 }}>
                  {serviciosFiltrados.length}
                </span>
              </h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-ghost btn-sm" onClick={cargarEjemplos}>
                  Cargar ejemplos
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setModalServicio({ nombre: '', precio: '', duracion: '', descripcion: '' })}
                >
                  <Ico d={ICONS.plus} size={15} />
                  Agregar
                </button>
              </div>
            </div>

            {serviciosFiltrados.length === 0 ? (
              <div className="servicios-empty">
                {busqueda ? 'No hay servicios que coincidan.' : 'No hay servicios. Agrega uno o carga ejemplos.'}
              </div>
            ) : (
              <div className="servicios-tabla">
                {serviciosFiltrados.map(s => (
                  <div key={s.id} className="servicio-row">
                    <div className="servicio-row__info">
                      <p className="servicio-row__nombre">{s.nombre}</p>
                      {s.descripcion && <p className="servicio-row__desc">{s.descripcion}</p>}
                    </div>
                    <div className="servicio-row__meta">
                      <span className="servicio-row__duracion">
                        <Ico d={ICONS.clock} size={13} />
                        {s.duracion} min
                      </span>
                      <span className="servicio-row__precio">
                        {moneda.simbolo} {Number(s.precio || 0).toLocaleString()}
                      </span>
                      <div className="servicio-row__actions">
                        <button className="icon-btn" title="Editar" onClick={() => setModalServicio(s)}>
                          <Ico d={ICONS.edit} size={15} />
                        </button>
                        <button className="icon-btn icon-btn--danger" title="Eliminar" onClick={() => setConfirmar({ id: s.id, nombre: s.nombre })}>
                          <Ico d={ICONS.trash} size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ===== 4. TEMA VISUAL ===== */}
          <div className="panel-card">
            <div className="panel-card__header">
              <h2 className="panel-card__title">
                <Ico d={ICONS.tema} size={17} />
                Tema visual
              </h2>
            </div>
            <div className="panel-card__body">
              <p style={{ fontSize: '0.85rem', color: 'var(--gray-400)', marginBottom: '1rem' }}>
                Elige una paleta de colores para el portal de tu clínica.
              </p>
              <div className="temas-grid">
                {TEMAS.map(t => {
                  const activo = t.id === estado.tema;
                  return (
                    <button
                      key={t.id}
                      className={`tema-btn ${activo ? 'tema-btn--active' : ''}`}
                      onClick={() => setEstado(e => ({ ...e, tema: t.id }))}
                    >
                      <span className="tema-swatch" style={{ backgroundColor: t.color }} />
                      <span className="tema-info">
                        <span className="tema-nombre">{t.nombre}</span>
                        <span className="tema-etiqueta">{t.etiqueta}</span>
                      </span>
                      {activo && (
                        <span className="tema-check">
                          <Ico d={ICONS.check} size={11} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                <button className="btn btn-primary" onClick={() => guardar('Tema guardado')}>
                  Guardar cambios
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ===== MODAL SERVICIO ===== */}
      {modalServicio && (
        <ModalServicio
          servicio={modalServicio}
          moneda={moneda}
          onCancelar={() => setModalServicio(null)}
          onGuardar={guardarServicio}
        />
      )}

      {/* ===== CONFIRMAR ELIMINAR ===== */}
      {confirmar && (
        <div className="modal-overlay" onClick={() => setConfirmar(null)}>
          <div className="modal-box confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-box__header">
              <h3 className="modal-box__title">Eliminar servicio</h3>
              <button className="icon-btn" onClick={() => setConfirmar(null)}>
                <Ico d={ICONS.x} size={16} />
              </button>
            </div>
            <div className="modal-box__body">
              <p>
                ¿Seguro que quieres eliminar <strong>{confirmar.nombre}</strong>?
                Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="modal-box__footer">
              <button className="btn btn-ghost btn-sm" onClick={() => setConfirmar(null)}>Cancelar</button>
              <button className="btn btn-danger btn-sm" onClick={() => eliminarServicio(confirmar.id)}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== TOAST ===== */}
      {toast && (
        <div className="panel-toast">
          <Ico d={ICONS.check} size={15} />
          {toast}
        </div>
      )}
    </div>
  );
}

/* ===== MODAL AGREGAR / EDITAR SERVICIO ===== */
function ModalServicio({ servicio, moneda, onCancelar, onGuardar }) {
  const [form, setForm] = useState({
    nombre:      servicio.nombre      || '',
    precio:      servicio.precio      ?? '',
    duracion:    servicio.duracion    ?? '',
    descripcion: servicio.descripcion || '',
  });
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const enviar = () => {
    if (!form.nombre.trim())                             return setError('El nombre es obligatorio.');
    if (form.precio === '' || Number(form.precio) < 0)  return setError('Ingresa un precio válido.');
    if (form.duracion === '' || Number(form.duracion) <= 0) return setError('Ingresa una duración válida.');
    onGuardar({
      ...(servicio.id ? { id: servicio.id } : {}),
      nombre:      form.nombre.trim(),
      precio:      Number(form.precio),
      duracion:    Number(form.duracion),
      descripcion: form.descripcion.trim(),
    });
  };

  return (
    <div className="modal-overlay" onClick={onCancelar}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-box__header">
          <h3 className="modal-box__title">
            {servicio.id ? 'Editar servicio' : 'Nuevo servicio'}
          </h3>
          <button className="icon-btn" onClick={onCancelar}>
            <Ico d="M6 18L18 6M6 6l12 12" size={16} />
          </button>
        </div>
        <div className="modal-box__body">
          <div className="input-group">
            <label>Nombre *</label>
            <input type="text" value={form.nombre} onChange={e => set('nombre', e.target.value)} autoFocus />
          </div>
          <div className="form-grid-2">
            <div className="input-group">
              <label>Precio ({moneda.simbolo}) *</label>
              <input type="number" min="0" value={form.precio} onChange={e => set('precio', e.target.value)} />
            </div>
            <div className="input-group">
              <label>Duración (min) *</label>
              <input type="number" min="1" value={form.duracion} onChange={e => set('duracion', e.target.value)} />
            </div>
          </div>
          <div className="input-group">
            <label>Descripción (opcional)</label>
            <textarea rows={3} value={form.descripcion} onChange={e => set('descripcion', e.target.value)} style={{ resize: 'vertical' }} />
          </div>
          {error && <p style={{ fontSize: '0.82rem', color: 'var(--danger)' }}>{error}</p>}
        </div>
        <div className="modal-box__footer">
          <button className="btn btn-ghost btn-sm" onClick={onCancelar}>Cancelar</button>
          <button className="btn btn-primary btn-sm" onClick={enviar}>Guardar</button>
        </div>
      </div>
    </div>
  );
}
