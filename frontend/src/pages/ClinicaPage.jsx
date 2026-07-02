import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getClinicaBySlug } from '../services/api';
import FormReserva from '../components/reserva/FormReserva';
import './ClinicaPage.css';

const DIAS_ES = {
  lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles',
  jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado', domingo: 'Domingo',
};

export default function ClinicaPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarReserva, setMostrarReserva] = useState(false);

  useEffect(() => {
    getClinicaBySlug(slug)
      .then(setData)
      .catch(() => setError('Clínica no encontrada o no disponible.'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="clinica-loading">
        <div className="spinner"></div>
        <p>Cargando información de la clínica…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="clinica-error">
        <span className="clinica-error__icon">🏥</span>
        <h2>Clínica no disponible</h2>
        <p>{error}</p>
      </div>
    );
  }

  const { clinica, servicios, doctores, horarios } = data;

  return (
    <div className="clinica-page">
      {/* ===== HEADER ===== */}
      <header className="clinica-header">
        <div className="container clinica-header__inner">
          <div className="clinica-header__brand">
            {clinica.logo_url ? (
              <img src={clinica.logo_url} alt={`Logo ${clinica.nombre}`} className="clinica-header__logo" />
            ) : (
              <div className="clinica-header__logo-placeholder">
                {clinica.nombre.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="clinica-header__nombre">{clinica.nombre}</h1>
              {clinica.ciudad && (
                <p className="clinica-header__ciudad">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  {clinica.ciudad}
                </p>
              )}
            </div>
          </div>
          <div className="clinica-header__actions">
            <button className="btn btn-primary btn-lg" onClick={() => setMostrarReserva(true)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Reservar cita
            </button>
            <Link to="/admin" className="btn btn-outline btn-lg">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              Admin
            </Link>
          </div>
        </div>
      </header>

      {/* ===== HERO BANNER ===== */}
      <div className="clinica-hero">
        <div className="container">
          {clinica.descripcion && (
            <p className="clinica-hero__desc">{clinica.descripcion}</p>
          )}
          <div className="clinica-hero__badges">
            {servicios.length > 0 && (
              <span className="badge badge-blue">{servicios.length} servicios disponibles</span>
            )}
            {doctores.length > 0 && (
              <span className="badge badge-green">{doctores.length} especialistas</span>
            )}
          </div>
        </div>
      </div>

      {/* ===== CONTENIDO PRINCIPAL ===== */}
      <main className="clinica-main container">

        {/* Servicios */}
        {servicios.length > 0 && (
          <section className="clinica-section">
            <h2 className="clinica-section__title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
              Nuestros servicios
            </h2>
            <div className="servicios-grid">
              {servicios.map((s) => (
                <div key={s.id_servicio} className="servicio-card" onClick={() => setMostrarReserva(true)}>
                  <div className="servicio-card__icon">🩺</div>
                  <div className="servicio-card__info">
                    <h3>{s.nombre}</h3>
                    {s.descripcion && <p>{s.descripcion}</p>}
                    <div className="servicio-card__meta">
                      {s.duracion_minutos && (
                        <span>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                          </svg>
                          {s.duracion_minutos} min
                        </span>
                      )}
                      {s.precio && (
                        <span className="servicio-card__precio">
                          L {parseFloat(s.precio).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="servicio-card__arrow">→</div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="clinica-cols">
          {/* Horarios */}
          {horarios.length > 0 && (
            <section className="clinica-section">
              <h2 className="clinica-section__title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                Horarios de atención
              </h2>
              <div className="card horarios-list">
                {horarios.map((h, i) => (
                  <div key={i} className="horario-row">
                    <span className="horario-row__dia">{DIAS_ES[h.dia_semana] || h.dia_semana}</span>
                    <span className="horario-row__horas">
                      {String(h.hora_inicio).slice(0,5)} – {String(h.hora_fin).slice(0,5)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Doctores */}
          {doctores.length > 0 && (
            <section className="clinica-section">
              <h2 className="clinica-section__title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                  <path d="M16 3.13a4 4 0 010 7.75"/>
                </svg>
                Nuestros especialistas
              </h2>
              <div className="doctores-list">
                {doctores.map((d) => (
                  <div key={d.id_doctor} className="doctor-card">
                    <div className="doctor-card__avatar">
                      {d.nombre.charAt(0)}
                    </div>
                    <div>
                      <p className="doctor-card__nombre">{d.nombre}</p>
                      {d.especialidad && (
                        <p className="doctor-card__especialidad">{d.especialidad}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Contacto */}
        {(clinica.direccion || clinica.telefono || clinica.whatsapp || clinica.correo) && (
          <section className="clinica-section">
            <h2 className="clinica-section__title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.5a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .82h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.1a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
              </svg>
              Contacto y ubicación
            </h2>
            <div className="card contacto-grid">
              {clinica.direccion && (
                <div className="contacto-item">
                  <span className="contacto-item__label">Dirección</span>
                  <span>{clinica.direccion}</span>
                </div>
              )}
              {clinica.telefono && (
                <div className="contacto-item">
                  <span className="contacto-item__label">Teléfono</span>
                  <a href={`tel:${clinica.telefono}`}>{clinica.telefono}</a>
                </div>
              )}
              {clinica.whatsapp && (
                <div className="contacto-item">
                  <span className="contacto-item__label">WhatsApp</span>
                  <a
                    href={`https://wa.me/${clinica.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="contacto-item__wa"
                  >
                    {clinica.whatsapp}
                  </a>
                </div>
              )}
              {clinica.correo && (
                <div className="contacto-item">
                  <span className="contacto-item__label">Correo</span>
                  <a href={`mailto:${clinica.correo}`}>{clinica.correo}</a>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="clinica-footer">
        <div className="container">
          <p>
            {clinica.nombre} · Powered by{' '}
            <strong>CitaHN</strong>
          </p>
        </div>
      </footer>

      {/* ===== MODAL DE RESERVA ===== */}
      {mostrarReserva && (
        <FormReserva
          clinica={clinica}
          servicios={servicios}
          doctores={doctores}
          onClose={() => setMostrarReserva(false)}
        />
      )}
    </div>
  );
}
