import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ClinicaPage from './pages/ClinicaPage';
import ConfiguracionPage from './pages/ConfiguracionPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/clinica/:slug" element={<ClinicaPage />} />
        <Route path="/admin" element={<ConfiguracionPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
