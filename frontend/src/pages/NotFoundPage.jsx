import './NotFoundPage.css';

export default function NotFoundPage() {
  return (
    <div className="notfound">
      <div className="notfound__icon">🏥</div>
      <h1 className="notfound__title">Página no encontrada</h1>
      <p className="notfound__desc">
        El link que ingresaste no existe o la clínica no está disponible.
      </p>
    </div>
  );
}
