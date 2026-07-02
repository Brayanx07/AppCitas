import { useState, useEffect, useRef } from 'react';

/* ============================================================
   Panel de Configuración — CitaHN
   Componente único, sin librerías externas (solo React).
   Estilos: Tailwind (clases core) + colores de tema inline.
   Persistencia: localStorage.
   ============================================================ */

const STORAGE_KEY = 'citahn_config_v1';

/* Clases core de Tailwind reutilizadas en los inputs */
const INPUT = 'w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-gray-200';

/* ---------- Monedas ---------- */
const MONEDAS = {
  lempira: { nombre: 'Lempira', simbolo: 'L' },
  dolar: { nombre: 'Dólar', simbolo: '$' },
  colon: { nombre: 'Colón', simbolo: '₡' },
  quetzal: { nombre: 'Quetzal', simbolo: 'Q' },
  peso_mx: { nombre: 'Peso MX', simbolo: 'MX$' },
  euro: { nombre: 'Euro', simbolo: '€' },
};

/* ---------- Tipos de clínica ---------- */
const TIPOS = {
  dental: 'Dental',
  dermatologia: 'Dermatología',
  psicologia: 'Psicología',
  general: 'Medicina general',
  estetica: 'Estética',
  nutricion: 'Nutrición',
  veterinaria: 'Veterinaria',
  otra: 'Otra',
};

/* ---------- Servicios de ejemplo por tipo ---------- */
const SERVICIOS_EJEMPLO = {
  dental: [
    { nombre: 'Consulta', precio: 350, duracion: 30, descripcion: 'Evaluación inicial y diagnóstico.' },
    { nombre: 'Limpieza dental', precio: 600, duracion: 45, descripcion: 'Profilaxis y remoción de sarro.' },
    { nombre: 'Extracción de muela', precio: 800, duracion: 40, descripcion: 'Extracción simple.' },
    { nombre: 'Resina', precio: 750, duracion: 50, descripcion: 'Restauración estética con resina.' },
  ],
  dermatologia: [
    { nombre: 'Consulta dermatológica', precio: 700, duracion: 30, descripcion: 'Valoración de piel.' },
    { nombre: 'Limpieza facial profunda', precio: 900, duracion: 60, descripcion: 'Limpieza e hidratación.' },
    { nombre: 'Crioterapia', precio: 500, duracion: 20, descripcion: 'Remoción de lesiones con frío.' },
    { nombre: 'Biopsia de piel', precio: 1200, duracion: 40, descripcion: 'Toma de muestra para análisis.' },
  ],
  psicologia: [
    { nombre: 'Sesión individual', precio: 650, duracion: 50, descripcion: 'Terapia personal.' },
    { nombre: 'Terapia de pareja', precio: 900, duracion: 60, descripcion: 'Sesión para parejas.' },
    { nombre: 'Evaluación psicológica', precio: 1100, duracion: 90, descripcion: 'Pruebas y diagnóstico.' },
    { nombre: 'Sesión familiar', precio: 1000, duracion: 60, descripcion: 'Terapia familiar.' },
  ],
  general: [
    { nombre: 'Consulta general', precio: 400, duracion: 30, descripcion: 'Atención médica general.' },
    { nombre: 'Chequeo médico', precio: 800, duracion: 45, descripcion: 'Revisión completa.' },
    { nombre: 'Toma de presión', precio: 100, duracion: 15, descripcion: 'Control de presión arterial.' },
    { nombre: 'Certificado médico', precio: 300, duracion: 20, descripcion: 'Emisión de constancia.' },
  ],
  estetica: [
    { nombre: 'Limpieza facial', precio: 700, duracion: 60, descripcion: 'Limpieza e hidratación facial.' },
    { nombre: 'Masaje reductivo', precio: 850, duracion: 60, descripcion: 'Masaje corporal moldeador.' },
    { nombre: 'Depilación láser', precio: 1200, duracion: 45, descripcion: 'Depilación por sesión.' },
    { nombre: 'Microdermoabrasión', precio: 950, duracion: 50, descripcion: 'Exfoliación profunda.' },
  ],
  nutricion: [
    { nombre: 'Consulta nutricional', precio: 500, duracion: 45, descripcion: 'Valoración y plan inicial.' },
    { nombre: 'Plan alimenticio', precio: 700, duracion: 30, descripcion: 'Diseño de dieta personalizada.' },
    { nombre: 'Control de peso', precio: 300, duracion: 20, descripcion: 'Seguimiento mensual.' },
    { nombre: 'Bioimpedancia', precio: 400, duracion: 20, descripcion: 'Análisis de composición corporal.' },
  ],
  veterinaria: [
    { nombre: 'Consulta veterinaria', precio: 350, duracion: 30, descripcion: 'Revisión general de mascota.' },
    { nombre: 'Vacunación', precio: 450, duracion: 20, descripcion: 'Aplicación de vacunas.' },
    { nombre: 'Desparasitación', precio: 250, duracion: 15, descripcion: 'Tratamiento antiparasitario.' },
    { nombre: 'Baño y estética', precio: 400, duracion: 60, descripcion: 'Baño, corte y limpieza.' },
  ],
  otra: [
    { nombre: 'Consulta general', precio: 400, duracion: 30, descripcion: 'Servicio principal.' },
  ],
};

/* ---------- Temas de color ---------- */
const TEMAS = [
  { id: 'rosado', nombre: 'Rosado', etiqueta: 'Por defecto', primary: '#ec4899', primaryDark: '#db2777', light: '#fce7f3', text: '#831843' },
  { id: 'coral', nombre: 'Coral', etiqueta: 'Cálido', primary: '#fb7185', primaryDark: '#f43f5e', light: '#ffe4e6', text: '#881337' },
  { id: 'salvia', nombre: 'Salvia', etiqueta: 'Natural', primary: '#84a98c', primaryDark: '#6b9080', light: '#e8f0ed', text: '#36433b' },
  { id: 'turquesa', nombre: 'Turquesa', etiqueta: 'Fresco', primary: '#14b8a6', primaryDark: '#0d9488', light: '#ccfbf1', text: '#134e4a' },
  { id: 'cielo', nombre: 'Cielo', etiqueta: 'Sereno', primary: '#0ea5e9', primaryDark: '#0284c7', light: '#e0f2fe', text: '#0c4a6e' },
  { id: 'indigo', nombre: 'Índigo', etiqueta: 'Profesional', primary: '#6366f1', primaryDark: '#4f46e5', light: '#e0e7ff', text: '#312e81' },
  { id: 'lavanda', nombre: 'Lavanda', etiqueta: 'Suave', primary: '#a78bfa', primaryDark: '#8b5cf6', light: '#ede9fe', text: '#4c1d95' },
  { id: 'gris', nombre: 'Gris', etiqueta: 'Neutro', primary: '#6b7280', primaryDark: '#4b5563', light: '#f3f4f6', text: '#1f2937' },
  { id: 'byn', nombre: 'Blanco y negro', etiqueta: 'Minimalista', primary: '#111827', primaryDark: '#000000', light: '#f3f4f6', text: '#111827' },
];

/* ---------- Estado por defecto ---------- */
const ESTADO_INICIAL = {
  clinica: {
    nombre: 'Mi Clínica',
    tipo: 'dental',
    logo: null,
    moneda: 'lempira',
  },
  acceso: {
    pin: '',
    telefono: '',
    direccion: '',
    horario: 'Lun–Vie 8:00 a.m. – 5:00 p.m.',
  },
  servicios: SERVICIOS_EJEMPLO.dental.map((s, i) => ({ id: Date.now() + i, ...s })),
  tema: 'rosado',
};

/* ---------- Iconos SVG inline ---------- */
const Icon = ({ name, className = 'w-5 h-5' }) => {
  const paths = {
    citas: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    pacientes: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 100-8 4 4 0 000 8z',
    pagos: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
    reportes: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    config: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
    buscar: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
    usuario: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    portal: 'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14',
    salir: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
    mas: 'M12 4v16m8-8H4',
    editar: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    borrar: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
    check: 'M5 13l4 4L19 7',
    cerrar: 'M6 18L18 6M6 6l12 12',
    imagen: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    reloj: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  };
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d={paths[name]} />
    </svg>
  );
};

export default function ConfiguracionPage() {
  const [estado, setEstado] = useState(ESTADO_INICIAL);
  const [cargado, setCargado] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [toast, setToast] = useState(null);
  const [modalServicio, setModalServicio] = useState(null); // {id?, nombre, precio, duracion, descripcion}
  const [confirmar, setConfirmar] = useState(null); // {id, nombre}
  const fileInputRef = useRef(null);

  /* ----- Cargar desde localStorage ----- */
  useEffect(() => {
    try {
      const guardado = localStorage.getItem(STORAGE_KEY);
      if (guardado) {
        const parsed = JSON.parse(guardado);
        setEstado({ ...ESTADO_INICIAL, ...parsed });
      }
    } catch (e) {
      console.error('Error al cargar configuración:', e);
    }
    setCargado(true);
  }, []);

  /* ----- Tema activo ----- */
  const tema = TEMAS.find((t) => t.id === estado.tema) || TEMAS[0];
  const moneda = MONEDAS[estado.clinica.moneda] || MONEDAS.lempira;

  /* ----- Helpers de actualización ----- */
  const setClinica = (campo, valor) =>
    setEstado((e) => ({ ...e, clinica: { ...e.clinica, [campo]: valor } }));
  const setAcceso = (campo, valor) =>
    setEstado((e) => ({ ...e, acceso: { ...e.acceso, [campo]: valor } }));

  const mostrarToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const guardar = (msg = 'Cambios guardados correctamente') => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
      mostrarToast(msg);
    } catch (e) {
      mostrarToast('No se pudo guardar');
    }
  };

  /* ----- Logo ----- */
  const subirLogo = (ev) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setClinica('logo', reader.result);
    reader.readAsDataURL(file);
  };

  /* ----- Servicios ----- */
  const guardarServicio = (datos) => {
    setEstado((e) => {
      let servicios;
      if (datos.id) {
        servicios = e.servicios.map((s) => (s.id === datos.id ? { ...s, ...datos } : s));
      } else {
        servicios = [...e.servicios, { ...datos, id: Date.now() }];
      }
      return { ...e, servicios };
    });
    setModalServicio(null);
    mostrarToast(datos.id ? 'Servicio actualizado' : 'Servicio agregado');
  };

  const eliminarServicio = (id) => {
    setEstado((e) => ({ ...e, servicios: e.servicios.filter((s) => s.id !== id) }));
    setConfirmar(null);
    mostrarToast('Servicio eliminado');
  };

  const cargarEjemplos = () => {
    const ejemplos = SERVICIOS_EJEMPLO[estado.clinica.tipo] || SERVICIOS_EJEMPLO.otra;
    setEstado((e) => ({
      ...e,
      servicios: ejemplos.map((s, i) => ({ id: Date.now() + i, ...s })),
    }));
    mostrarToast('Servicios de ejemplo cargados');
  };

  const serviciosFiltrados = estado.servicios.filter((s) =>
    s.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (!cargado) return null;

  /* ----- Estilos reutilizables ----- */
  const navItems = [
    { id: 'citas', label: 'Citas', icon: 'citas' },
    { id: 'pacientes', label: 'Pacientes', icon: 'pacientes' },
    { id: 'pagos', label: 'Pagos', icon: 'pagos' },
    { id: 'reportes', label: 'Reportes', icon: 'reportes' },
    { id: 'config', label: 'Configuración', icon: 'config' },
  ];

  return (
    <div className="min-h-screen flex font-sans" style={{ backgroundColor: tema.light }}>
      {/* ===================== SIDEBAR ===================== */}
      <aside className="w-64 shrink-0 bg-white border-r border-gray-100 flex flex-col min-h-screen">
        {/* Logo + nombre */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold overflow-hidden shrink-0"
            style={{ backgroundColor: tema.primary }}
          >
            {estado.clinica.logo ? (
              <img src={estado.clinica.logo} alt="logo" className="w-full h-full object-cover" />
            ) : (
              estado.clinica.nombre.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-800 text-sm truncate">{estado.clinica.nombre}</p>
            <p className="text-xs text-gray-400">{TIPOS[estado.clinica.tipo]}</p>
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const activo = item.id === 'config';
            return (
              <button
                key={item.id}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition"
                style={
                  activo
                    ? { backgroundColor: tema.light, color: tema.primaryDark }
                    : { color: '#6b7280' }
                }
              >
                <Icon name={item.icon} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Pie */}
        <div className="px-3 py-4 border-t border-gray-100 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600">
            <Icon name="usuario" className="w-5 h-5" />
            Administrador
          </div>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition">
            <Icon name="portal" />
            Abrir portal del paciente
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition">
            <Icon name="salir" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ===================== CONTENIDO ===================== */}
      <main className="flex-1 min-w-0">
        {/* Encabezado */}
        <header className="bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between gap-4 sticky top-0 z-10">
          <h1 className="text-2xl font-bold text-gray-800">Configuración</h1>
          <div className="relative w-72 max-w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Icon name="buscar" className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar servicios…"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
          </div>
        </header>

        <div className="p-8 max-w-4xl mx-auto space-y-6">
          {/* ============ 1. DATOS DE LA CLÍNICA ============ */}
          <Card titulo="Datos de la clínica">
            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Nombre de la clínica">
                <input
                  type="text"
                  value={estado.clinica.nombre}
                  onChange={(e) => setClinica('nombre', e.target.value)}
                  className={INPUT}
                />
              </Field>
              <Field label="Tipo / especialidad">
                <select
                  value={estado.clinica.tipo}
                  onChange={(e) => setClinica('tipo', e.target.value)}
                  className={INPUT}
                >
                  {Object.entries(TIPOS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </Field>
              <Field label="Moneda">
                <select
                  value={estado.clinica.moneda}
                  onChange={(e) => setClinica('moneda', e.target.value)}
                  className={INPUT}
                >
                  {Object.entries(MONEDAS).map(([k, v]) => (
                    <option key={k} value={k}>{v.nombre} ({v.simbolo})</option>
                  ))}
                </select>
              </Field>
              <Field label="Logo">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50 shrink-0">
                    {estado.clinica.logo ? (
                      <img src={estado.clinica.logo} alt="logo" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-300"><Icon name="imagen" className="w-6 h-6" /></span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={subirLogo} className="hidden" />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                      style={{ backgroundColor: tema.primary }}
                    >
                      Subir imagen
                    </button>
                    {estado.clinica.logo && (
                      <button
                        onClick={() => setClinica('logo', null)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 border border-gray-200 hover:bg-gray-50"
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                </div>
              </Field>
            </div>
          </Card>

          {/* ============ 2. ACCESO Y CONTACTO ============ */}
          <Card titulo="Acceso y contacto">
            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="PIN de administrador">
                <input
                  type="password"
                  value={estado.acceso.pin}
                  onChange={(e) => setAcceso('pin', e.target.value)}
                  placeholder="••••"
                  className={INPUT}
                />
              </Field>
              <Field label="Teléfono / WhatsApp">
                <input
                  type="tel"
                  value={estado.acceso.telefono}
                  onChange={(e) => setAcceso('telefono', e.target.value)}
                  placeholder="+504 ...."
                  className={INPUT}
                />
              </Field>
              <Field label="Dirección">
                <input
                  type="text"
                  value={estado.acceso.direccion}
                  onChange={(e) => setAcceso('direccion', e.target.value)}
                  className={INPUT}
                />
              </Field>
              <Field label="Horario de atención">
                <input
                  type="text"
                  value={estado.acceso.horario}
                  onChange={(e) => setAcceso('horario', e.target.value)}
                  className={INPUT}
                />
              </Field>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => guardar()}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm hover:opacity-90 transition"
                style={{ backgroundColor: tema.primary }}
              >
                Guardar cambios
              </button>
            </div>
          </Card>

          {/* ============ 3. SERVICIOS ============ */}
          <Card titulo="Servicios">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <p className="text-sm text-gray-400">
                {serviciosFiltrados.length} servicio{serviciosFiltrados.length !== 1 && 's'}
                {busqueda && ' encontrado(s)'}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={cargarEjemplos}
                  className="px-3 py-2 rounded-xl text-xs font-medium text-gray-500 border border-gray-200 hover:bg-gray-50"
                >
                  Cargar ejemplos de {TIPOS[estado.clinica.tipo]}
                </button>
                <button
                  onClick={() => setModalServicio({ nombre: '', precio: '', duracion: '', descripcion: '' })}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-sm hover:opacity-90 transition"
                  style={{ backgroundColor: tema.primary }}
                >
                  <Icon name="mas" className="w-4 h-4" />
                  Agregar servicio
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {serviciosFiltrados.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-8">
                  No hay servicios {busqueda ? 'que coincidan con la búsqueda' : 'todavía'}.
                </p>
              )}
              {serviciosFiltrados.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{s.nombre}</p>
                    {s.descripcion && <p className="text-sm text-gray-400 truncate">{s.descripcion}</p>}
                    <div className="flex items-center gap-3 mt-1 text-xs">
                      <span className="font-semibold" style={{ color: tema.primaryDark }}>
                        {moneda.simbolo} {Number(s.precio || 0).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1 text-gray-400">
                        <Icon name="reloj" className="w-3.5 h-3.5" />
                        {s.duracion} min
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => setModalServicio(s)}
                      className="p-2 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                      title="Editar"
                    >
                      <Icon name="editar" className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setConfirmar({ id: s.id, nombre: s.nombre })}
                      className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500"
                      title="Eliminar"
                    >
                      <Icon name="borrar" className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* ============ 4. TEMA VISUAL ============ */}
          <Card titulo="Tema visual">
            <p className="text-sm text-gray-400 mb-4">
              Elige una paleta. El cambio se aplica al instante en toda la aplicación.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {TEMAS.map((t) => {
                const activo = t.id === estado.tema;
                return (
                  <button
                    key={t.id}
                    onClick={() => setEstado((e) => ({ ...e, tema: t.id }))}
                    className="relative flex items-center gap-3 p-3 rounded-xl border-2 transition text-left"
                    style={{
                      borderColor: activo ? t.primary : '#f3f4f6',
                      backgroundColor: activo ? t.light : '#fff',
                    }}
                  >
                    <span
                      className="w-9 h-9 rounded-lg shrink-0 border border-black/5"
                      style={{ backgroundColor: t.primary }}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-gray-800 truncate">{t.nombre}</span>
                      <span className="block text-xs text-gray-400">{t.etiqueta}</span>
                    </span>
                    {activo && (
                      <span
                        className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: t.primary }}
                      >
                        <Icon name="check" className="w-3 h-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => guardar('Tema guardado')}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm hover:opacity-90 transition"
                style={{ backgroundColor: tema.primary }}
              >
                Guardar cambios
              </button>
            </div>
          </Card>
        </div>
      </main>

      {/* ===================== MODAL SERVICIO ===================== */}
      {modalServicio && (
        <ModalServicio
          servicio={modalServicio}
          tema={tema}
          moneda={moneda}
          onCancelar={() => setModalServicio(null)}
          onGuardar={guardarServicio}
        />
      )}

      {/* ===================== CONFIRMAR ELIMINAR ===================== */}
      {confirmar && (
        <Overlay onClose={() => setConfirmar(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Eliminar servicio</h3>
            <p className="text-sm text-gray-500 mb-6">
              ¿Seguro que quieres eliminar <span className="font-semibold">{confirmar.nombre}</span>? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmar(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500 border border-gray-200 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => eliminarServicio(confirmar.id)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600"
              >
                Eliminar
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {/* ===================== TOAST ===================== */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium animate-pulse"
          style={{ backgroundColor: tema.primaryDark }}>
          <Icon name="check" className="w-4 h-4" />
          {toast}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Componentes auxiliares
   ============================================================ */

function Card({ titulo, children }) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-50 p-6">
      <h2 className="text-base font-bold text-gray-800 mb-5">{titulo}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-600 mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function Overlay({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} className="w-full flex justify-center">
        {children}
      </div>
    </div>
  );
}

function ModalServicio({ servicio, tema, moneda, onCancelar, onGuardar }) {
  const [form, setForm] = useState({
    nombre: servicio.nombre || '',
    precio: servicio.precio ?? '',
    duracion: servicio.duracion ?? '',
    descripcion: servicio.descripcion || '',
  });
  const [error, setError] = useState('');

  const set = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));

  const enviar = () => {
    if (!form.nombre.trim()) return setError('El nombre es obligatorio.');
    if (form.precio === '' || Number(form.precio) < 0) return setError('Ingresa un precio válido.');
    if (form.duracion === '' || Number(form.duracion) <= 0) return setError('Ingresa una duración válida.');
    onGuardar({
      ...(servicio.id ? { id: servicio.id } : {}),
      nombre: form.nombre.trim(),
      precio: Number(form.precio),
      duracion: Number(form.duracion),
      descripcion: form.descripcion.trim(),
    });
  };

  return (
    <Overlay onClose={onCancelar}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-800">
            {servicio.id ? 'Editar servicio' : 'Nuevo servicio'}
          </h3>
          <button onClick={onCancelar} className="text-gray-400 hover:text-gray-600">
            <Icon name="cerrar" className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <Field label="Nombre">
            <input type="text" value={form.nombre} onChange={(e) => set('nombre', e.target.value)} className={INPUT} autoFocus />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label={`Precio (${moneda.simbolo})`}>
              <input type="number" min="0" value={form.precio} onChange={(e) => set('precio', e.target.value)} className={INPUT} />
            </Field>
            <Field label="Duración (min)">
              <input type="number" min="0" value={form.duracion} onChange={(e) => set('duracion', e.target.value)} className={INPUT} />
            </Field>
          </div>
          <Field label="Descripción (opcional)">
            <textarea rows="2" value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)} className={`${INPUT} resize-none`} />
          </Field>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onCancelar} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500 border border-gray-200 hover:bg-gray-50">
            Cancelar
          </button>
          <button
            onClick={enviar}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90"
            style={{ backgroundColor: tema.primary }}
          >
            Guardar
          </button>
        </div>
      </div>
    </Overlay>
  );
}
