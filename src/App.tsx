import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import DashboardPage from './pages/DashboardPage';
import InspectPage from './pages/InspectPage';
import StatsPage from './pages/StatsPage';
import ModelsPage from './pages/ModelsPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Sidebar />
        <div className="app-main">
          <header className="topbar">
            <div className="project-title">
              <strong>자동차 부품 품질검사</strong>
              <span>Object Detection</span>
            </div>
          </header>
          <div className="workspace-bar">
            <span className="workspace-label">PROJECT</span>
            <span className="workspace-divider">/</span>
            <span>자동차 부품 품질검사</span>
          </div>
          <main className="content">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/inspect" element={<InspectPage />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/models" element={<ModelsPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
