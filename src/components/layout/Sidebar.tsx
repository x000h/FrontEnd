import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: 'grid' },
  { to: '/inspect', label: 'Predict', icon: 'scan' },
  { to: '/stats', label: 'Historical Data', icon: 'history' },
  { to: '/models', label: 'Models', icon: 'model' },
];

function Icon({ name }: { name: string }) {
  const common = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (name === 'scan') return <svg {...common}><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 12h8M12 8v8"/></svg>;
  if (name === 'history') return <svg {...common}><path d="M3.5 12a8.5 8.5 0 1 0 2.4-5.9"/><path d="M3.5 5.5v5h5"/><path d="M12 7.5v5l3.2 2"/></svg>;
  if (name === 'model') return <svg {...common}><rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="12" cy="12" r="3"/><path d="M12 4v3M12 17v3M4 12h3M17 12h3"/></svg>;
  return <svg {...common}><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></svg>;
}

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="ll-logo" title="OPTIMIZATION">L</div>
      <nav className="navlist">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title={item.label}>
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <button className="side-mini" title="설정">⚙</button>
        <div className="live-status" title="운영 모델 연결 상태"><span className="status-dot" /></div>
      </div>
    </aside>
  );
}
