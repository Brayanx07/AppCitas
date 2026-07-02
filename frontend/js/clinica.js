const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3000/api'
  : 'https://appcitas-production-d492.up.railway.app/api';

const DIAS_ES = {
  lunes:'Lunes', martes:'Martes', miercoles:'Miércoles',
  jueves:'Jueves', viernes:'Viernes', sabado:'Sábado', domingo:'Domingo',
};

const slug = window.location.pathname.split('/').filter(Boolean)[1];

let clinicaData = null;
let R = {
  visible:false, paso:0,
  id_servicio:'', id_doctor:'', fecha:'', hora:'',
  nombre:'', telefono:'', correo:'', motivo:'',
  slots:[], loadingSlots:false, errorSlots:'',
  loadingReserva:false, errorReserva:'', exitosa:null, errores:{},
};

/* ===== INIT ===== */
async function init() {
  if (!slug) { renderError('URL inválida'); return; }
  try {
    const res = await fetch(`${API_URL}/clinicas/slug/${slug}`);
    if (!res.ok) throw new Error();
    clinicaData = await res.json();
    document.title = `${clinicaData.clinica.nombre} | CitaHN`;
    renderPage(clinicaData);
  } catch {
    renderError('Clínica no encontrada o no disponible.');
  }
}

function renderError(msg) {
  document.getElementById('root').innerHTML = `
    <div class="clinica-error">
      <span class="clinica-error__icon">🏥</span>
      <h2>Clínica no disponible</h2>
      <p>${msg}</p>
    </div>`;
}

/* ===== RENDER PAGE ===== */
function renderPage({ clinica, servicios, doctores, horarios }) {
  document.getElementById('root').innerHTML = `
    <div class="clinica-page">
      <header class="clinica-header">
        <div class="container clinica-header__inner">
          <div class="clinica-header__brand">
            ${clinica.logo_url
              ? `<img src="${clinica.logo_url}" alt="${clinica.nombre}" class="clinica-header__logo">`
              : `<div class="clinica-header__logo-placeholder">${clinica.nombre.charAt(0)}</div>`}
            <div>
              <h1 class="clinica-header__nombre">${clinica.nombre}</h1>
              ${clinica.ciudad ? `<p class="clinica-header__ciudad">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>${clinica.ciudad}</p>` : ''}
            </div>
          </div>
          <div class="clinica-header__actions">
            <button class="btn btn-primary btn-lg" id="btn-reservar-top">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>Reservar cita
            </button>
            <a href="/admin" class="btn btn-outline btn-lg">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>Admin
            </a>
          </div>
        </div>
      </header>

      <div class="clinica-hero">
        <div class="container">
          ${clinica.descripcion ? `<p class="clinica-hero__desc">${clinica.descripcion}</p>` : ''}
          <div class="clinica-hero__badges">
            ${servicios.length > 0 ? `<span class="badge badge-blue">${servicios.length} servicios disponibles</span>` : ''}
            ${doctores.length > 0 ? `<span class="badge badge-green">${doctores.length} especialistas</span>` : ''}
          </div>
        </div>
      </div>

      <main class="clinica-main container">
        ${servicios.length > 0 ? `
        <section class="clinica-section">
          <h2 class="clinica-section__title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            Nuestros servicios
          </h2>
          <div class="servicios-grid">
            ${servicios.map(s => `
              <div class="servicio-card" data-id="${s.id_servicio}" style="cursor:pointer">
                <div class="servicio-card__icon">🩺</div>
                <div class="servicio-card__info">
                  <h3>${s.nombre}</h3>
                  ${s.descripcion ? `<p>${s.descripcion}</p>` : ''}
                  <div class="servicio-card__meta">
                    ${s.duracion_minutos ? `<span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${s.duracion_minutos} min</span>` : ''}
                    ${s.precio ? `<span class="servicio-card__precio">L ${parseFloat(s.precio).toLocaleString()}</span>` : ''}
                  </div>
                </div>
                <div class="servicio-card__arrow">→</div>
              </div>`).join('')}
          </div>
        </section>` : ''}

        <div class="clinica-cols">
          ${horarios.length > 0 ? `
          <section class="clinica-section">
            <h2 class="clinica-section__title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Horarios de atención
            </h2>
            <div class="card horarios-list">
              ${horarios.map(h => `
                <div class="horario-row">
                  <span class="horario-row__dia">${DIAS_ES[h.dia_semana] || h.dia_semana}</span>
                  <span class="horario-row__horas">${String(h.hora_inicio).slice(0,5)} – ${String(h.hora_fin).slice(0,5)}</span>
                </div>`).join('')}
            </div>
          </section>` : ''}

          ${doctores.length > 0 ? `
          <section class="clinica-section">
            <h2 class="clinica-section__title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
              Nuestros especialistas
            </h2>
            <div class="doctores-list">
              ${doctores.map(d => `
                <div class="doctor-card">
                  <div class="doctor-card__avatar">${d.nombre.charAt(0)}</div>
                  <div>
                    <p class="doctor-card__nombre">${d.nombre}</p>
                    ${d.especialidad ? `<p class="doctor-card__especialidad">${d.especialidad}</p>` : ''}
                  </div>
                </div>`).join('')}
            </div>
          </section>` : ''}
        </div>

        ${(clinica.direccion||clinica.telefono||clinica.whatsapp||clinica.correo) ? `
        <section class="clinica-section">
          <h2 class="clinica-section__title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.5a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .82h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.1a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
            Contacto y ubicación
          </h2>
          <div class="card contacto-grid">
            ${clinica.direccion ? `<div class="contacto-item"><span class="contacto-item__label">Dirección</span><span>${clinica.direccion}</span></div>` : ''}
            ${clinica.telefono ? `<div class="contacto-item"><span class="contacto-item__label">Teléfono</span><a href="tel:${clinica.telefono}">${clinica.telefono}</a></div>` : ''}
            ${clinica.whatsapp ? `<div class="contacto-item"><span class="contacto-item__label">WhatsApp</span><a href="https://wa.me/${clinica.whatsapp.replace(/[^0-9]/g,'')}" target="_blank" class="contacto-item__wa">${clinica.whatsapp}</a></div>` : ''}
            ${clinica.correo ? `<div class="contacto-item"><span class="contacto-item__label">Correo</span><a href="mailto:${clinica.correo}">${clinica.correo}</a></div>` : ''}
          </div>
        </section>` : ''}
      </main>

      <footer class="clinica-footer">
        <div class="container"><p>${clinica.nombre} · Powered by <strong>CitaHN</strong></p></div>
      </footer>
      <div id="modal-root"></div>
    </div>`;

  document.getElementById('btn-reservar-top').onclick = () => openModal('');
  document.querySelectorAll('.servicio-card').forEach(c => c.onclick = () => openModal(c.dataset.id));
}

/* ===== MODAL ===== */
function openModal(idServicio) {
  R = { visible:true, paso:0, id_servicio:idServicio||'', id_doctor:'', fecha:'', hora:'',
        nombre:'', telefono:'', correo:'', motivo:'', slots:[], loadingSlots:false,
        errorSlots:'', loadingReserva:false, errorReserva:'', exitosa:null, errores:{} };
  drawModal();
}

function closeModal() {
  document.getElementById('modal-root').innerHTML = '';
  document.body.style.overflow = '';
}

function drawModal() {
  const { clinica, servicios, doctores } = clinicaData;
  const PASOS = ['Servicio','Fecha y hora','Tus datos','Confirmación'];
  const svc = servicios.find(s => s.id_servicio === parseInt(R.id_servicio));
  document.body.style.overflow = 'hidden';

  document.getElementById('modal-root').innerHTML = `
    <div class="modal-overlay" id="overlay">
      <div class="modal-box">
        <div class="modal-header">
          <div>
            <h2 class="modal-title">Reservar cita</h2>
            <p class="modal-subtitle">${clinica.nombre}</p>
          </div>
          <button class="modal-close" id="btn-x">✕</button>
        </div>
        ${R.paso < 4 ? `
        <div class="modal-steps">
          ${PASOS.map((l,i) => `<div class="step ${i===R.paso?'step--active':i<R.paso?'step--done':''}">
            <div class="step__circle">${i<R.paso?'✓':i+1}</div>
            <span class="step__label">${l}</span>
          </div>`).join('')}
        </div>` : ''}
        <div class="modal-content">${stepContent(servicios, doctores, svc, clinica)}</div>
        ${R.paso < 4 ? `
        <div class="modal-footer">
          ${R.paso>0 ? `<button class="btn btn-ghost" id="btn-atras">← Atrás</button>`
                     : `<button class="btn btn-ghost" id="btn-cancel">Cancelar</button>`}
          ${R.paso<3 ? `<button class="btn btn-primary" id="btn-sig" ${!canNext()?'disabled':''}>Siguiente →</button>`
                     : `<button class="btn btn-primary" id="btn-conf" ${R.loadingReserva?'disabled':''}>
                          ${R.loadingReserva?'<span class="spinner spinner-sm"></span> Reservando…':'Confirmar cita'}
                        </button>`}
        </div>` : ''}
      </div>
    </div>`;

  document.getElementById('btn-x').onclick = closeModal;
  document.getElementById('overlay').onclick = e => { if(e.target===e.currentTarget) closeModal(); };
  const a = document.getElementById('btn-atras');   if(a) a.onclick = () => { R.paso--; drawModal(); };
  const c = document.getElementById('btn-cancel');  if(c) c.onclick = closeModal;
  const s = document.getElementById('btn-sig');     if(s) s.onclick = siguiente;
  const f = document.getElementById('btn-conf');    if(f) f.onclick = confirmar;
  bindStep(servicios, doctores);
}

function stepContent(servicios, doctores, svc, clinica) {
  if (R.paso===0) return `
    <p class="modal-hint">¿Qué servicio necesitas?</p>
    <div class="servicio-select-list">
      ${servicios.map(s=>`
        <button class="servicio-option ${R.id_servicio===String(s.id_servicio)?'servicio-option--selected':''}" data-svc="${s.id_servicio}" type="button">
          <div class="servicio-option__check">${R.id_servicio===String(s.id_servicio)?'✓':''}</div>
          <div class="servicio-option__info">
            <strong>${s.nombre}</strong>
            <span>${s.duracion_minutos} min${s.precio?` · L ${parseFloat(s.precio).toLocaleString()}`:''}</span>
          </div>
        </button>`).join('')}
    </div>
    ${doctores.length>0?`<div class="input-group" style="margin-top:.75rem"><label>Doctor (opcional)</label>
      <select id="sel-doc"><option value="">Sin preferencia</option>
      ${doctores.map(d=>`<option value="${d.id_doctor}" ${R.id_doctor===String(d.id_doctor)?'selected':''}>${d.nombre}${d.especialidad?` — ${d.especialidad}`:''}</option>`).join('')}
      </select></div>`:''}`;

  if (R.paso===1) {
    const hoy = new Date().toISOString().split('T')[0];
    return `
      <div class="input-group"><label>Selecciona una fecha</label>
        <input type="date" id="inp-fecha" min="${hoy}" value="${R.fecha}">
      </div>
      ${R.fecha?`<div class="slots-section"><p class="slots-label">Horas disponibles</p>
        ${R.loadingSlots?`<div class="slots-loading"><div class="spinner spinner-sm"></div><span>Cargando horarios…</span></div>`
          :R.errorSlots?`<p class="slots-error">${R.errorSlots}</p>`
          :R.slots.length>0?`<div class="slots-grid">${R.slots.map(t=>`
            <button type="button" class="slot-btn ${R.hora===t?'slot-btn--selected':''}" data-slot="${t}">${t}</button>`).join('')}</div>`:''}
      </div>`:''}`;
  }

  if (R.paso===2) return `
    <p class="modal-hint">Ingresa tus datos de contacto</p>
    <div class="form-grid">
      <div class="input-group ${R.errores.nombre?'input-error':''}">
        <label>Nombre completo *</label>
        <input type="text" id="inp-nombre" placeholder="Ej. María López" value="${R.nombre}">
        ${R.errores.nombre?`<span class="input-error-msg">${R.errores.nombre}</span>`:''}
      </div>
      <div class="input-group ${R.errores.telefono?'input-error':''}">
        <label>Teléfono *</label>
        <input type="tel" id="inp-tel" placeholder="+504 9999-9999" value="${R.telefono}">
        ${R.errores.telefono?`<span class="input-error-msg">${R.errores.telefono}</span>`:''}
      </div>
      <div class="input-group ${R.errores.correo?'input-error':''}">
        <label>Correo electrónico (opcional)</label>
        <input type="email" id="inp-correo" placeholder="tu@correo.com" value="${R.correo}">
        ${R.errores.correo?`<span class="input-error-msg">${R.errores.correo}</span>`:''}
      </div>
      <div class="input-group">
        <label>Motivo (opcional)</label>
        <textarea id="inp-motivo" rows="3" placeholder="Describe el motivo…" style="resize:vertical">${R.motivo}</textarea>
      </div>
    </div>`;

  if (R.paso===3) {
    const doc = R.id_doctor ? doctores.find(d=>d.id_doctor===parseInt(R.id_doctor)) : null;
    return `
      <p class="modal-hint">Revisa los detalles de tu cita</p>
      <div class="resumen-box">
        <div class="resumen-row"><span>Clínica</span><strong>${clinica.nombre}</strong></div>
        <div class="resumen-row"><span>Servicio</span><strong>${svc?.nombre||''}</strong></div>
        ${doc?`<div class="resumen-row"><span>Doctor</span><strong>${doc.nombre}</strong></div>`:''}
        <div class="resumen-row"><span>Fecha</span><strong>${fmtFecha(R.fecha)}</strong></div>
        <div class="resumen-row"><span>Hora</span><strong>${R.hora}</strong></div>
        <div class="resumen-row"><span>Paciente</span><strong>${R.nombre}</strong></div>
        <div class="resumen-row"><span>Teléfono</span><strong>${R.telefono}</strong></div>
        ${R.motivo?`<div class="resumen-row"><span>Motivo</span><strong>${R.motivo}</strong></div>`:''}
      </div>
      ${R.errorReserva?`<div class="reserva-error">⚠️ ${R.errorReserva}</div>`:''}`;
  }

  if (R.paso===4) {
    const c = R.exitosa?.cita;
    return `
      <div class="modal-success">
        <div class="success-icon">✅</div>
        <h3>¡Cita reservada!</h3>
        <p>${R.exitosa?.mensaje||''}</p>
        <div class="resumen-box mt-2">
          <div class="resumen-row"><span>Servicio</span><strong>${c?.nombre_servicio||''}</strong></div>
          <div class="resumen-row"><span>Fecha</span><strong>${fmtFecha((c?.fecha||'').toString().slice(0,10))}</strong></div>
          <div class="resumen-row"><span>Hora</span><strong>${String(c?.hora||'').slice(0,5)}</strong></div>
        </div>
        <p class="success-note">Guarda esta información. La clínica confirmará tu cita.</p>
        <button class="btn btn-primary btn-full mt-2" id="btn-ok">Cerrar</button>
      </div>`;
  }
  return '';
}

function bindStep(servicios, doctores) {
  document.querySelectorAll('.servicio-option').forEach(b => b.onclick = () => { R.id_servicio = b.dataset.svc; drawModal(); });
  const sd = document.getElementById('sel-doc'); if(sd) sd.onchange = e => { R.id_doctor = e.target.value; };
  const fd = document.getElementById('inp-fecha');
  if (fd) fd.onchange = async e => {
    R.fecha = e.target.value; R.hora = ''; R.slots = [];
    R.loadingSlots = true; R.errorSlots = ''; drawModal();
    try {
      const p = new URLSearchParams({ slug, fecha: R.fecha, id_servicio: R.id_servicio });
      if (R.id_doctor) p.append('id_doctor', R.id_doctor);
      const r = await fetch(`${API_URL}/disponibilidad?${p}`);
      const d = await r.json();
      R.slots = d.slots || [];
      R.errorSlots = R.slots.length === 0 ? 'No hay horarios disponibles para este día.' : '';
    } catch { R.errorSlots = 'No se pudo cargar la disponibilidad.'; }
    R.loadingSlots = false; drawModal();
  };
  document.querySelectorAll('.slot-btn').forEach(b => b.onclick = () => { R.hora = b.dataset.slot; drawModal(); });
  ['nombre','telefono','correo','motivo'].forEach(k => {
    const el = document.getElementById(`inp-${k==='telefono'?'tel':k==='correo'?'correo':k}`);
    if(el) el.oninput = e => { R[k] = e.target.value; const btn=document.getElementById('btn-sig'); if(btn) btn.disabled=!canNext(); };
  });
  const bOk = document.getElementById('btn-ok'); if(bOk) bOk.onclick = closeModal;
}

function canNext() {
  if (R.paso===0) return !!R.id_servicio;
  if (R.paso===1) return !!R.fecha && !!R.hora;
  if (R.paso===2) return !!R.nombre.trim() && !!R.telefono.trim();
  return true;
}

function validar2() {
  const e = {};
  if (!R.nombre.trim()) e.nombre = 'El nombre es requerido';
  if (!R.telefono.trim()) e.telefono = 'El teléfono es requerido';
  else if (!/^[\d\s+\-()]{7,}$/.test(R.telefono)) e.telefono = 'Teléfono inválido';
  if (R.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(R.correo)) e.correo = 'Correo inválido';
  R.errores = e; return Object.keys(e).length === 0;
}

function siguiente() {
  if (R.paso===2 && !validar2()) { drawModal(); return; }
  R.paso++; drawModal();
}

async function confirmar() {
  R.loadingReserva = true; R.errorReserva = ''; drawModal();
  try {
    const res = await fetch(`${API_URL}/reservas`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        slug, nombre:R.nombre.trim(), telefono:R.telefono.trim(),
        correo:R.correo.trim()||undefined,
        id_servicio:parseInt(R.id_servicio),
        id_doctor:R.id_doctor?parseInt(R.id_doctor):undefined,
        fecha:R.fecha, hora:R.hora, motivo:R.motivo.trim()||undefined,
      }),
    });
    const d = await res.json();
    if (!res.ok) throw new Error(d.error||'Error al reservar');
    R.exitosa = d; R.paso = 4;
  } catch(err) { R.errorReserva = err.message||'Error al reservar. Intenta de nuevo.'; }
  R.loadingReserva = false; drawModal();
}

function fmtFecha(s) {
  if (!s) return '';
  return new Date(s+'T00:00:00').toLocaleDateString('es-HN', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
}

init();
