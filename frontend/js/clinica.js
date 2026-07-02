// Puerto 8080 = servidor python (prueba local) → usa Railway
// Puerto 3000  = backend local corriendo → usa localhost
const API_URL = (window.location.hostname === 'localhost' && window.location.port === '3000')
  ? 'http://localhost:3000/api'
  : 'https://appcitas-production-d492.up.railway.app/api';

const DIAS_ES = {
  lunes:'Lunes', martes:'Martes', miercoles:'Miércoles',
  jueves:'Jueves', viernes:'Viernes', sabado:'Sábado', domingo:'Domingo',
};

// Soporta ?clinica=san-rafael para pruebas locales Y /clinica/san-rafael en producción
const params = new URLSearchParams(window.location.search);
const slug = params.get('clinica') || window.location.pathname.split('/').filter(Boolean)[1];

let clinicaData = null;
let R = {
  visible:false, paso:0,
  id_servicio:'', id_doctor:'', fecha:'', hora:'',
  nombre:'', telefono:'', correo:'', motivo:'',
  slots:[], loadingSlots:false, errorSlots:'',
  loadingReserva:false, errorReserva:'', exitosa:null, errores:{},
};

/* ===== ICONS ===== */
function svcIcon(nombre) {
  const n = (nombre||'').toLowerCase();
  if (/dental|dent|boca|dient|orto/.test(n))        return '🦷';
  if (/oftal|ojo|vision|visual|lent/.test(n))        return '👁️';
  if (/pedia|niño|infant|bebe|partos/.test(n))       return '👶';
  if (/ginec|obste|mujer|femeni|mama/.test(n))       return '🌸';
  if (/cardio|coraz|vascular|arteri/.test(n))        return '❤️';
  if (/ortop|hueso|column|trauma|fractura/.test(n))  return '🦴';
  if (/psic|mental|ansiedad|depres|emoc/.test(n))    return '🧠';
  if (/dermat|piel|acne|cutane/.test(n))             return '✨';
  if (/nutric|diet|peso|alimenta/.test(n))           return '🥗';
  if (/urgent|emerg|guardia/.test(n))                return '🚨';
  if (/laborat|analisis|sangre|muestra/.test(n))     return '🔬';
  if (/imagen|radiolog|rx|tomograf|resonan/.test(n)) return '📷';
  if (/fisio|rehab|terapia/.test(n))                 return '💪';
  if (/neuro|cerebro|epilep/.test(n))                return '🧬';
  if (/endocrin|hormona|tiroides|diabet/.test(n))    return '⚗️';
  return '🩺';
}

/* ===== INIT ===== */
async function init() {
  showSkeleton();
  if (!slug) { renderError('URL inválida — agrega ?clinica=TU-SLUG'); return; }
  try {
    const res = await fetch(`${API_URL}/clinicas/slug/${slug}`);
    if (!res.ok) throw new Error();
    clinicaData = await res.json();
    document.title = `${clinicaData.clinica.nombre} | CitaHN`;
    renderPage(clinicaData);
    setTimeout(() => { initAnimations(); addWhatsApp(clinicaData.clinica); }, 80);
  } catch {
    renderError('Clínica no encontrada o no disponible.');
  }
}

/* ===== SKELETON ===== */
function showSkeleton() {
  document.getElementById('root').innerHTML = `
    <div class="clinica-page">
      <header class="clinica-header">
        <div class="container clinica-header__inner">
          <div class="clinica-header__brand">
            <div class="sk sk-avatar"></div>
            <div><div class="sk sk-text" style="width:180px;height:18px"></div><div class="sk sk-text" style="width:100px;height:12px;margin-top:.4rem"></div></div>
          </div>
          <div class="sk sk-btn"></div>
        </div>
      </header>
      <div class="skeleton-hero"></div>
      <main class="clinica-main container">
        <div class="sk sk-text" style="width:200px;height:22px;margin-bottom:1rem"></div>
        <div class="servicios-grid">
          ${[1,2,3].map(()=>`<div class="sk sk-card" style="height:100px"></div>`).join('')}
        </div>
      </main>
    </div>`;
}

function renderError(msg) {
  document.getElementById('root').innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:80vh;gap:1rem;text-align:center;padding:2rem;color:var(--gray-400)">
      <div style="font-size:4rem">🏥</div>
      <h2 style="font-size:1.5rem;color:var(--gray-800)">Clínica no disponible</h2>
      <p>${msg}</p>
    </div>`;
}

/* ===== RENDER PAGE ===== */
function renderPage({ clinica, servicios, doctores, horarios }) {
  const tieneWa = !!clinica.whatsapp;
  document.getElementById('root').innerHTML = `
    <div class="clinica-page">

      <!-- HEADER -->
      <header class="clinica-header" id="main-header">
        <div class="container clinica-header__inner">
          <div class="clinica-header__brand">
            ${clinica.logo_url
              ? `<img src="${clinica.logo_url}" alt="${clinica.nombre}" class="clinica-header__logo">`
              : `<div class="clinica-header__logo-placeholder">${clinica.nombre.charAt(0)}</div>`}
            <div>
              <h1 class="clinica-header__nombre">${clinica.nombre}</h1>
              ${clinica.ciudad ? `<p class="clinica-header__ciudad">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                ${clinica.ciudad}</p>` : ''}
            </div>
          </div>
          <div class="clinica-header__actions">
            <button class="btn btn-primary" id="btn-reservar-top">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Reservar
            </button>
            <a href="/admin" class="btn btn-outline btn-icon-only" title="Panel Admin">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M12 12c-4.4 0-8 2.7-8 7"/><path d="M17 17v4m0-4h4m-4 0h-4m4 0v-4"/></svg>
            </a>
          </div>
        </div>
      </header>

      <!-- HERO -->
      <section class="clinica-hero">
        <div class="hero-pattern"></div>
        <div class="container hero-inner">
          <div class="hero-text fade-up">
            <div class="hero-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              CitaHN · Reserva online
            </div>
            <h2 class="hero-nombre">${clinica.nombre}</h2>
            ${clinica.descripcion ? `<p class="hero-desc">${clinica.descripcion}</p>` : ''}
            <div class="hero-actions">
              <button class="btn btn-white btn-lg" id="btn-reservar-hero">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Reservar cita
              </button>
              ${tieneWa ? `<a href="https://wa.me/${clinica.whatsapp.replace(/[^0-9]/g,'')}" target="_blank" class="btn btn-wa btn-lg">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.117 1.527 5.845L0 24l6.31-1.504A11.948 11.948 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.795 9.795 0 01-5.028-1.384l-.361-.215-3.741.892.924-3.647-.235-.374A9.821 9.821 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/></svg>
                WhatsApp
              </a>` : ''}
            </div>
          </div>
          ${(servicios.length + doctores.length) > 0 ? `
          <div class="hero-stats fade-up" style="transition-delay:.15s">
            ${servicios.length > 0 ? `<div class="hero-stat"><span class="hero-stat__num">${servicios.length}</span><span class="hero-stat__label">Servicios</span></div>` : ''}
            ${doctores.length > 0 ? `<div class="hero-stat"><span class="hero-stat__num">${doctores.length}</span><span class="hero-stat__label">Especialistas</span></div>` : ''}
            ${horarios.length > 0 ? `<div class="hero-stat"><span class="hero-stat__num">${horarios.length}</span><span class="hero-stat__label">Días activos</span></div>` : ''}
          </div>` : ''}
        </div>
      </section>

      <!-- MAIN -->
      <main class="clinica-main container">

        ${servicios.length > 0 ? `
        <section class="clinica-section fade-up">
          <h2 class="clinica-section__title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            Nuestros servicios
          </h2>
          <div class="servicios-grid">
            ${servicios.map(s => `
              <button class="servicio-card" data-id="${s.id_servicio}" type="button">
                <div class="servicio-card__icon">${svcIcon(s.nombre)}</div>
                <div class="servicio-card__info">
                  <h3>${s.nombre}</h3>
                  ${s.descripcion ? `<p>${s.descripcion}</p>` : ''}
                  <div class="servicio-card__meta">
                    ${s.duracion_minutos ? `<span>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      ${s.duracion_minutos} min
                    </span>` : ''}
                    ${s.precio ? `<span class="servicio-card__precio">L ${parseFloat(s.precio).toLocaleString()}</span>` : ''}
                  </div>
                </div>
                <div class="servicio-card__arrow">→</div>
              </button>`).join('')}
          </div>
        </section>` : ''}

        <div class="clinica-cols">
          ${horarios.length > 0 ? `
          <section class="clinica-section fade-up">
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
          <section class="clinica-section fade-up" style="transition-delay:.1s">
            <h2 class="clinica-section__title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
              Especialistas
            </h2>
            <div class="doctores-list">
              ${doctores.map((d,i) => `
                <div class="doctor-card fade-up" style="transition-delay:${i*0.07}s">
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
        <section class="clinica-section fade-up">
          <h2 class="clinica-section__title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.5a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .82h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.1a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
            Contacto y ubicación
          </h2>
          <div class="card contacto-grid">
            ${clinica.direccion ? `<div class="contacto-item"><span class="contacto-item__label">Dirección</span><span>${clinica.direccion}</span></div>` : ''}
            ${clinica.telefono ? `<div class="contacto-item"><span class="contacto-item__label">Teléfono</span><a href="tel:${clinica.telefono}">${clinica.telefono}</a></div>` : ''}
            ${clinica.whatsapp ? `<div class="contacto-item"><span class="contacto-item__label">WhatsApp</span><a href="https://wa.me/${clinica.whatsapp.replace(/[^0-9]/g,'')}" target="_blank" style="color:#25D366">${clinica.whatsapp}</a></div>` : ''}
            ${clinica.correo ? `<div class="contacto-item"><span class="contacto-item__label">Correo</span><a href="mailto:${clinica.correo}">${clinica.correo}</a></div>` : ''}
          </div>
        </section>` : ''}

      </main>

      <footer class="clinica-footer">
        <div class="container">
          <p>${clinica.nombre} · Powered by <strong>CitaHN</strong></p>
          <p class="clinica-footer__sub">Reserva tu cita en línea, fácil y rápido.</p>
        </div>
      </footer>

      <div id="modal-root"></div>
    </div>`;

  document.getElementById('btn-reservar-top').onclick = () => openModal('');
  document.getElementById('btn-reservar-hero').onclick = () => openModal('');
  document.querySelectorAll('.servicio-card').forEach(c => c.onclick = () => openModal(c.dataset.id));
}

/* ===== ANIMATIONS ===== */
function initAnimations() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.fade-up').forEach(el => obs.observe(el));

  const header = document.getElementById('main-header');
  if (header) {
    window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 30), { passive: true });
  }
}

function addWhatsApp(clinica) {
  if (!clinica.whatsapp) return;
  const num = clinica.whatsapp.replace(/[^0-9]/g,'');
  const btn = document.createElement('a');
  btn.href = `https://wa.me/${num}?text=Hola, quiero información sobre ${encodeURIComponent(clinica.nombre)}`;
  btn.target = '_blank';
  btn.className = 'wa-float';
  btn.title = 'Contactar por WhatsApp';
  btn.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.117 1.527 5.845L0 24l6.31-1.504A11.948 11.948 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.795 9.795 0 01-5.028-1.384l-.361-.215-3.741.892.924-3.647-.235-.374A9.821 9.821 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/></svg>`;
  document.body.appendChild(btn);
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
  const PASOS = ['Servicio','Fecha','Datos','Confirmación'];
  const svc = servicios.find(s => s.id_servicio === parseInt(R.id_servicio));
  document.body.style.overflow = 'hidden';
  const progress = R.paso < 4 ? Math.round((R.paso / 3) * 100) : 100;

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
          ${PASOS.map((l,i) => `
            <div class="step ${i===R.paso?'step--active':i<R.paso?'step--done':''}">
              <div class="step__circle">${i<R.paso?'✓':i+1}</div>
              <span class="step__label">${l}</span>
            </div>
            ${i<PASOS.length-1?'<div class="step-line"><div class="step-line-fill" style="width:${i<R.paso?100:0}%"></div></div>':''}`).join('')}
        </div>` : ''}
        <div class="modal-content">${stepContent(servicios, doctores, svc, clinica)}</div>
        ${R.paso < 4 ? `
        <div class="modal-footer">
          ${R.paso>0 ? `<button class="btn btn-ghost" id="btn-atras">← Atrás</button>`
                     : `<button class="btn btn-ghost" id="btn-cancel">Cancelar</button>`}
          ${R.paso<3 ? `<button class="btn btn-primary" id="btn-sig" ${!canNext()?'disabled':''}>Siguiente →</button>`
                     : `<button class="btn btn-primary" id="btn-conf" ${R.loadingReserva?'disabled':''}>
                          ${R.loadingReserva?'<span class="spinner spinner-sm"></span> Reservando…':'✓ Confirmar cita'}
                        </button>`}
        </div>` : ''}
      </div>
    </div>`;

  document.getElementById('btn-x').onclick = closeModal;
  document.getElementById('overlay').onclick = e => { if(e.target===e.currentTarget) closeModal(); };
  const a = document.getElementById('btn-atras');  if(a) a.onclick = () => { R.paso--; drawModal(); };
  const c = document.getElementById('btn-cancel'); if(c) c.onclick = closeModal;
  const s = document.getElementById('btn-sig');    if(s) s.onclick = siguiente;
  const f = document.getElementById('btn-conf');   if(f) f.onclick = confirmar;
  bindStep(servicios, doctores);
}

function stepContent(servicios, doctores, svc, clinica) {
  if (R.paso===0) return `
    <p class="modal-hint">¿Qué servicio necesitas hoy?</p>
    <div class="servicio-select-list">
      ${servicios.map(s=>`
        <button class="servicio-option ${R.id_servicio===String(s.id_servicio)?'servicio-option--selected':''}" data-svc="${s.id_servicio}" type="button">
          <span class="servicio-option__icon">${svcIcon(s.nombre)}</span>
          <div class="servicio-option__info">
            <strong>${s.nombre}</strong>
            <span>${s.duracion_minutos||30} min${s.precio?` · L ${parseFloat(s.precio).toLocaleString()}`:''}</span>
          </div>
          ${R.id_servicio===String(s.id_servicio)?`<span class="servicio-option__check">✓</span>`:''}
        </button>`).join('')}
    </div>
    ${doctores.length>0?`<div class="input-group" style="margin-top:1rem"><label>Doctor (opcional)</label>
      <select id="sel-doc"><option value="">Sin preferencia</option>
      ${doctores.map(d=>`<option value="${d.id_doctor}" ${R.id_doctor===String(d.id_doctor)?'selected':''}>${d.nombre}${d.especialidad?` — ${d.especialidad}`:''}</option>`).join('')}
      </select></div>`:''}`;

  if (R.paso===1) {
    const hoy = new Date().toISOString().split('T')[0];
    return `
      <div class="input-group"><label>Selecciona una fecha</label>
        <input type="date" id="inp-fecha" min="${hoy}" value="${R.fecha}">
      </div>
      ${R.fecha?`<div class="slots-section">
        <p class="slots-label">Horarios disponibles para <strong>${fmtFechaCorta(R.fecha)}</strong></p>
        ${R.loadingSlots?`<div class="slots-loading"><div class="spinner spinner-sm"></div><span>Cargando…</span></div>`
          :R.errorSlots?`<p class="slots-error">⚠️ ${R.errorSlots}</p>`
          :R.slots.length>0?`<div class="slots-grid">${R.slots.map(t=>`
            <button type="button" class="slot-btn ${R.hora===t?'slot-btn--selected':''}" data-slot="${t}">${t}</button>`).join('')}</div>`
          :''}
      </div>`:'<p class="modal-hint" style="margin-top:1rem;color:var(--gray-400)">Elige una fecha para ver horarios disponibles.</p>'}`;
  }

  if (R.paso===2) return `
    <p class="modal-hint">Ingresa tus datos de contacto</p>
    <div class="form-grid">
      <div class="input-group ${R.errores.nombre?'input-error':''}">
        <label>Nombre completo *</label>
        <input type="text" id="inp-nombre" placeholder="Ej. María López" value="${R.nombre}" autocomplete="name">
        ${R.errores.nombre?`<span class="input-error-msg">${R.errores.nombre}</span>`:''}
      </div>
      <div class="input-group ${R.errores.telefono?'input-error':''}">
        <label>Teléfono *</label>
        <input type="tel" id="inp-tel" placeholder="+504 9999-9999" value="${R.telefono}" autocomplete="tel">
        ${R.errores.telefono?`<span class="input-error-msg">${R.errores.telefono}</span>`:''}
      </div>
      <div class="input-group" style="grid-column:1/-1">
        <label>Correo (opcional)</label>
        <input type="email" id="inp-correo" placeholder="tu@correo.com" value="${R.correo}" autocomplete="email">
      </div>
      <div class="input-group" style="grid-column:1/-1">
        <label>Motivo de consulta (opcional)</label>
        <textarea id="inp-motivo" rows="3" placeholder="Describe brevemente el motivo…">${R.motivo}</textarea>
      </div>
    </div>`;

  if (R.paso===3) {
    const doc = R.id_doctor ? doctores.find(d=>d.id_doctor===parseInt(R.id_doctor)) : null;
    return `
      <p class="modal-hint">Confirma los detalles de tu cita</p>
      <div class="resumen-box">
        <div class="resumen-row"><span>📍 Clínica</span><strong>${clinica.nombre}</strong></div>
        <div class="resumen-row"><span>${svcIcon(svc?.nombre||'')} Servicio</span><strong>${svc?.nombre||''}</strong></div>
        ${doc?`<div class="resumen-row"><span>👨‍⚕️ Doctor</span><strong>${doc.nombre}</strong></div>`:''}
        <div class="resumen-row"><span>📅 Fecha</span><strong>${fmtFecha(R.fecha)}</strong></div>
        <div class="resumen-row"><span>🕐 Hora</span><strong>${R.hora}</strong></div>
        <div class="resumen-row"><span>👤 Paciente</span><strong>${R.nombre}</strong></div>
        <div class="resumen-row"><span>📞 Teléfono</span><strong>${R.telefono}</strong></div>
        ${R.motivo?`<div class="resumen-row"><span>💬 Motivo</span><strong>${R.motivo}</strong></div>`:''}
      </div>
      ${R.errorReserva?`<div class="reserva-error">⚠️ ${R.errorReserva}</div>`:''}`;
  }

  if (R.paso===4) {
    const c = R.exitosa?.cita;
    return `
      <div class="modal-success">
        <div class="success-anim">✅</div>
        <h3>¡Cita reservada con éxito!</h3>
        <p>${R.exitosa?.mensaje||'Tu cita ha sido confirmada.'}</p>
        <div class="resumen-box mt-2">
          <div class="resumen-row"><span>Servicio</span><strong>${c?.nombre_servicio||''}</strong></div>
          <div class="resumen-row"><span>Fecha</span><strong>${fmtFecha((c?.fecha||'').toString().slice(0,10))}</strong></div>
          <div class="resumen-row"><span>Hora</span><strong>${String(c?.hora||'').slice(0,5)}</strong></div>
        </div>
        <p class="success-note">📌 Guarda estos datos. La clínica confirmará tu cita pronto.</p>
        <button class="btn btn-primary btn-full mt-2" id="btn-ok">Cerrar</button>
      </div>`;
  }
  return '';
}

function bindStep(servicios, doctores) {
  document.querySelectorAll('.servicio-option').forEach(b => b.onclick = () => { R.id_servicio = b.dataset.svc; drawModal(); });
  const sd = document.getElementById('sel-doc');   if(sd) sd.onchange = e => { R.id_doctor = e.target.value; };
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
      R.errorSlots = R.slots.length===0 ? 'No hay horarios disponibles para este día.' : '';
    } catch { R.errorSlots = 'No se pudo cargar la disponibilidad.'; }
    R.loadingSlots = false; drawModal();
  };
  document.querySelectorAll('.slot-btn').forEach(b => b.onclick = () => { R.hora = b.dataset.slot; drawModal(); });
  const binds = [['inp-nombre','nombre'],['inp-tel','telefono'],['inp-correo','correo'],['inp-motivo','motivo']];
  binds.forEach(([id,key]) => { const el=document.getElementById(id); if(el) el.oninput=e=>{R[key]=e.target.value; const btn=document.getElementById('btn-sig');if(btn)btn.disabled=!canNext();}; });
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
  R.errores = e; return Object.keys(e).length===0;
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

function fmtFechaCorta(s) {
  if (!s) return '';
  return new Date(s+'T00:00:00').toLocaleDateString('es-HN', { weekday:'short', month:'short', day:'numeric' });
}

init();
