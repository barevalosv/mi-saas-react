import React from 'react';

const Sidebar = React.memo(function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="menu-lateral">
        <div style={{ marginBottom: '30px', textAlign: 'center' }}>
          <h1 style={{ color: '#F59E0B', fontSize: '18px', fontWeight: '800', letterSpacing: '0.5px' }}>
            FOOTBALL HISTORY IA
          </h1>
          <p style={{ color: '#64748B', fontSize: '11px', marginTop: '4px' }}>
            El Archivo de Oro del Balompié
          </p>
        </div>
        
        <button onClick={() => window.location.reload()}>
          ➕ Nueva Consulta Histórica
        </button>
      </div>

      <footer style={{ fontSize: '11px', color: '#64748B', textAlign: 'center' }}>
        Eminencia Mundial • v2.0
      </footer>
    </aside>
  );
});

export default Sidebar;