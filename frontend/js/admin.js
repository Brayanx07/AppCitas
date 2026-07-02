const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3000/api'
  : 'https://appcitas-production-d492.up.railway.app/api';

const STORAGE_KEY = 'citahn_config_v1';
const TEMAS = [
  { id:'azul',    nombre:'Azul Médico',   etiqueta:'Predeterminado', color:'#2563EB' },
  { id:'verde',   nombre:'Verde Salud',   etiqueta:'Natural',        color:'#059669' },
  { id:'violeta', nombre:'Violeta Pro',   etiqueta:'Moderno',        color:'#7C3AED' },
  { id:'slate',   nombre:'Slate Gray',    etiqueta:'Minimalista',    color:'#475569' },
  { id:'rose',    nombre:'Rose Care',     etiqueta:'Femenino',       color:'#E11D48' },
  { id:'orange',  nombre:'Naranja Vital', etiqueta:'Energético',     color:'#EA580C' },
];

const SECCIONES = [
  { id:'datos',    label:'Datos de clínica' },
  { id:'contacto', label:'Acceso y contacto' },
  { id:'servicios',label:'Servicios' },
  { id:'tema',     label:'Tema visual' },
];

let seccion = 'datos';
let cfg = cargarConfig();

function cargarConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    nombre:'', tipo:'', ciudad:'', descripcion:'', logo_url:'',
    slug:'', telefono:'', whatsapp:'', correo:'', web:'',
    servicios:[], tema:'azul',
  };
}

function guardarConfig() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}

/* ===== RENDER ===== */
function render() {
  document.getElementById('root').innerHTML = `
    <div class="panel">
      <aside class="panel-sidebar">
        <div class="panel-sidebar__brand">
          <div class="panel-sidebar__avatar" id="sb-avatar">
            ${cfg.logo_url
              ? `<img src="${cfg.logo_url}" alt="">`
              : (cfg.nombre ? cfg.nombre.charAt(0).toUpperCase() : 'C')}
          </div>
          <div class="panel-sidebar__brand-info">
            <div class="panel-sidebar__nombre">${cfg.nombre || 'Mi Clínica'}</div>
            <div class="panel-sidebar__tipo">${cfg.tipo || 'Clínica'}</div>
          </div>
        </div>
        <nav class="panel-sidebar__nav">
          ${SECCIONES.map(s => `
            <button class="panel-nav-item ${seccion===s.id?'panel-nav-item--active':''}" data-sec="${s.id}">
              ${navIcon(s.id)} ${s.label}
            </button>`).join('')}
        </nav>
        <div class="panel-sidebar__footer">
          <div class="panel-sidebar__user">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
            Admin
          </div>
          <a href="/clinica/san-rafael" class="panel-footer-btn" target="_blank">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
              <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            Ver página pública
          </a>
        </div>
      </aside>

      <div class="panel-main">
        <div class="panel-topbar">
          <h1>${SECCIONES.find(s=>s.id===seccion)?.label || 'Panel'}</h1>
          <button class="btn btn-primary btn-sm" id="btn-guardar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
            </svg>Guardar cambios
          </button>
        </div>
        <div class="panel-content">${seccionContent()}</div>
      </div>
    </div>
    <div id="toast-root"></div>
    <div id="modal-root"></div>`;

  // Nav clicks
  document.querySelectorAll('.panel-nav-item').forEach(b => b.onclick = () => { seccion = b.dataset.sec; render(); });
  document.getElementById('btn-guardar').onclick = guardar;
  bindSection();
}

function navIcon(id) {
  const icons = {
    datos: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
    contacto: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2A19.79 19.79 0 013.07 9.5a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .82h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.1a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>`,
    servicios: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`,
    tema: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>`,
  };
  return icons[id] || '';
}

/* ===== SECCIONES ===== */
function seccionContent() {
  if (seccion==='datos') return `
    <div class="panel-card">
      <div class="panel-card__header">
        <span class="panel-card__title">${navIcon('datos')} Información general</span>
      </div>
      <div class="panel-card__body">
        <div class="logo-upload" style="margin-bottom:1.5rem">
          <div class="logo-preview" id="logo-preview">
            ${cfg.logo_url ? `<img src="${cfg.logo_url}" alt="">` : `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`}
          </div>
          <div class="logo-btns">
            <div class="input-group"><label>URL del logo</label>
              <input type="url" id="inp-logo" placeholder="https://..." value="${cfg.logo_url}">
            </div>
          </div>
        </div>
        <div class="form-grid-2">
          <div class="input-group"><label>Nombre de la clínica *</label>
            <input type="text" id="inp-nombre" placeholder="Clínica San Rafael" value="${cfg.nombre}">
          </div>
          <div class="input-group"><label>Tipo de clínica</label>
            <select id="inp-tipo">
              ${['','General','Dental','Pediátrica','Oftalmológica','Ginecológica','Dermatológica','Ortopédica','Psicológica','Otra'].map(t =>
                `<option value="${t}" ${cfg.tipo===t?'selected':''}>${t||'— Seleccionar —'}</option>`).join('')}
            </select>
          </div>
          <div class="input-group"><label>Ciudad</label>
            <input type="text" id="inp-ciudad" placeholder="Tegucigalpa" value="${cfg.ciudad}">
          </div>
          <div class="input-group"><label>Slug URL</label>
            <input type="text" id="inp-slug" placeholder="san-rafael" value="${cfg.slug}">
          </div>
          <div class="input-group" style="grid-column:1/-1"><label>Descripción</label>
            <textarea id="inp-desc" rows="3" placeholder="Breve descripción de la clínica...">${cfg.descripcion}</textarea>
          </div>
        </div>
      </div>
    </div>`;

  if (seccion==='contacto') return `
    <div class="panel-card">
      <div class="panel-card__header">
        <span class="panel-card__title">${navIcon('contacto')} Contacto</span>
      </div>
      <div class="panel-card__body">
        <div class="form-grid-2">
          <div class="input-group"><label>Teléfono</label>
            <input type="tel" id="inp-tel" placeholder="+504 2222-3333" value="${cfg.telefono}">
          </div>
          <div class="input-group"><label>WhatsApp</label>
            <input type="tel" id="inp-wa" placeholder="+504 9999-0000" value="${cfg.whatsapp}">
          </div>
          <div class="input-group"><label>Correo</label>
            <input type="email" id="inp-correo" placeholder="contacto@clinica.com" value="${cfg.correo}">
          </div>
          <div class="input-group"><label>Sitio web</label>
            <input type="url" id="inp-web" placeholder="https://..." value="${cfg.web}">
          </div>
        </div>
      </div>
    </div>`;

  if (seccion==='servicios') return `
    <div class="panel-card">
      <div class="panel-card__header">
        <span class="panel-card__title">${navIcon('servicios')} Servicios (${cfg.servicios.length})</span>
        <button class="btn btn-primary btn-sm" id="btn-add-svc">+ Agregar servicio</button>
      </div>
      <div class="servicios-tabla" id="svc-lista">
        ${cfg.servicios.length === 0
          ? `<div class="servicios-empty"><p>No hay servicios aún</p><p>Haz clic en "Agregar servicio" para empezar.</p></div>`
          : cfg.servicios.map((s,i) => `
            <div class="servicio-row">
              <div class="servicio-row__info">
                <div class="servicio-row__nombre">${s.nombre}</div>
                <div class="servicio-row__desc">${s.descripcion || 'Sin descripción'}</div>
              </div>
              <div class="servicio-row__meta">
                <span class="servicio-row__duracion">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  ${s.duracion} min
                </span>
                <span class="servicio-row__precio">${s.precio ? `L ${parseFloat(s.precio).toLocaleString()}` : '—'}</span>
              </div>
              <div class="servicio-row__actions">
                <button class="icon-btn" data-edit="${i}" title="Editar">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="icon-btn icon-btn--danger" data-del="${i}" title="Eliminar">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                </button>
              </div>
            </div>`).join('')}
      </div>
    </div>`;

  if (seccion==='tema') return `
    <div class="panel-card">
      <div class="panel-card__header">
        <span class="panel-card__title">${navIcon('tema')} Tema visual</span>
      </div>
      <div class="panel-card__body">
        <p style="font-size:.875rem;color:var(--gray-500);margin-bottom:1rem">
          Elige el color principal que se mostrará en la página de tu clínica.
        </p>
        <div class="temas-grid">
          ${TEMAS.map(t => `
            <button class="tema-btn ${cfg.tema===t.id?'tema-btn--active':''}" data-tema="${t.id}" type="button">
              <div class="tema-swatch" style="background:${t.color}"></div>
              <div class="tema-info">
                <span class="tema-nombre">${t.nombre}</span>
                <span class="tema-etiqueta">${t.etiqueta}</span>
              </div>
              ${cfg.tema===t.id ? `<div class="tema-check"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div>` : ''}
            </button>`).join('')}
        </div>
      </div>
    </div>`;

  return '';
}

function bindSection() {
  // Datos
  const bind = (id, key) => { const el = document.getElementById(id); if(el) el.oninput = e => cfg[key]=e.target.value; };
  bind('inp-nombre','nombre'); bind('inp-tipo','tipo'); bind('inp-ciudad','ciudad');
  bind('inp-slug','slug'); bind('inp-desc','descripcion'); bind('inp-logo','logo_url');
  bind('inp-tel','telefono'); bind('inp-wa','whatsapp'); bind('inp-correo','correo'); bind('inp-web','web');

  const lp = document.getElementById('logo-preview');
  const li = document.getElementById('inp-logo');
  if (li && lp) li.oninput = e => {
    cfg.logo_url = e.target.value;
    lp.innerHTML = e.target.value ? `<img src="${e.target.value}" alt="">` : `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/></svg>`;
  };

  // Servicios
  const addBtn = document.getElementById('btn-add-svc');
  if (addBtn) addBtn.onclick = () => openSvcModal(null);
  document.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => openSvcModal(parseInt(b.dataset.edit)));
  document.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
    if (confirm('¿Eliminar este servicio?')) { cfg.servicios.splice(parseInt(b.dataset.del),1); render(); }
  });

  // Temas
  document.querySelectorAll('.tema-btn').forEach(b => b.onclick = () => { cfg.tema = b.dataset.tema; render(); });
}

/* ===== MODAL SERVICIO ===== */
function openSvcModal(idx) {
  const svc = idx !== null ? { ...cfg.servicios[idx] } : { nombre:'', descripcion:'', duracion:30, precio:'' };
  document.getElementById('modal-root').innerHTML = `
    <div class="modal-overlay" id="svc-overlay">
      <div class="modal-box">
        <div class="modal-box__header">
          <span class="modal-box__title">${idx!==null?'Editar':'Nuevo'} servicio</span>
          <button class="icon-btn" id="svc-x">✕</button>
        </div>
        <div class="modal-box__body">
          <div class="input-group"><label>Nombre del servicio *</label>
            <input type="text" id="svc-nombre" placeholder="Consulta General" value="${svc.nombre}">
          </div>
          <div class="input-group"><label>Descripción</label>
            <textarea id="svc-desc" rows="2" placeholder="Descripción breve...">${svc.descripcion||''}</textarea>
          </div>
          <div class="form-grid-2">
            <div class="input-group"><label>Duración (min)</label>
              <input type="number" id="svc-dur" min="5" step="5" value="${svc.duracion||30}">
            </div>
            <div class="input-group"><label>Precio (L)</label>
              <input type="number" id="svc-precio" min="0" step="10" placeholder="0" value="${svc.precio||''}">
            </div>
          </div>
        </div>
        <div class="modal-box__footer">
          <button class="btn btn-ghost" id="svc-cancel">Cancelar</button>
          <button class="btn btn-primary" id="svc-ok">${idx!==null?'Guardar':'Agregar'}</button>
        </div>
      </div>
    </div>`;

  const close = () => { document.getElementById('modal-root').innerHTML = ''; };
  document.getElementById('svc-x').onclick = close;
  document.getElementById('svc-cancel').onclick = close;
  document.getElementById('svc-overlay').onclick = e => { if(e.target===e.currentTarget) close(); };
  document.getElementById('svc-ok').onclick = () => {
    const nombre = document.getElementById('svc-nombre').value.trim();
    if (!nombre) { document.getElementById('svc-nombre').focus(); return; }
    const obj = {
      nombre, descripcion: document.getElementById('svc-desc').value.trim(),
      duracion: parseInt(document.getElementById('svc-dur').value)||30,
      precio: document.getElementById('svc-precio').value || '',
    };
    if (idx !== null) cfg.servicios[idx] = obj; else cfg.servicios.push(obj);
    close(); render();
  };
}

/* ===== GUARDAR ===== */
function guardar() {
  guardarConfig();
  toast('✓ Cambios guardados');
  // Update sidebar preview
  const sb = document.getElementById('sb-avatar');
  if (sb) sb.innerHTML = cfg.logo_url ? `<img src="${cfg.logo_url}" alt="">` : (cfg.nombre ? cfg.nombre.charAt(0).toUpperCase() : 'C');
}

function toast(msg) {
  const t = document.createElement('div');
  t.className = 'panel-toast'; t.textContent = msg;
  document.getElementById('toast-root').appendChild(t);
  setTimeout(() => t.remove(), 2500);
}

render();
