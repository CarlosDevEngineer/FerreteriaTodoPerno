import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import RightSide from '../components/RigtSide/RightSide';
import '../App.css';

function DashboardLayout() {
  const location = useLocation();
  const isDashboard = location.pathname === '/';

  return (
    <div className="App">
      <div className={`AppGlass ${!isDashboard ? 'full-width-content' : ''}`}>
        <Sidebar />
        
        {/* Área de contenido principal - siempre ocupa la columna 2 */}
        <div className={`main-content ${!isDashboard ? 'expanded' : ''}`}>
          <Outlet />
        </div>
        
        {isDashboard && <RightSide />}
      </div>
    </div>
  );
}

export default DashboardLayout;