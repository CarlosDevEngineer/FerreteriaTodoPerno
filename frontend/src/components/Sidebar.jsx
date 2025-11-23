import React, { useState, useEffect } from "react";
import "./Sidebar.css";
import Logo from "../imgs/logo.png";
import { UilSignOutAlt, UilBars } from "@iconscout/react-unicons";
import { SidebarData } from "../Data/Data";
import { useAuth } from "../auth/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

const getInitials = (name = '') => {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

const Sidebar = () => {
  const [selected, setSelected] = useState(0);
  const [expanded, setExpanded] = useState(window.innerWidth > 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Detectar tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      setExpanded(!mobile);
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Ejecutar al montar
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Controlar scroll del body en móvil
  useEffect(() => {
    if (isMobile) {
      if (expanded) {
        document.body.classList.add('sidebar-open');
      } else {
        document.body.classList.remove('sidebar-open');
      }
    }
  }, [expanded, isMobile]);

  // Encontrar ítem activo
  useEffect(() => {
    if (user) {
      const filteredData = SidebarData.filter((item) =>
        item.roles?.includes(user.rol)
      );
      const currentPath = location.pathname;
      const index = filteredData.findIndex(item => item.path === currentPath);
      setSelected(index >= 0 ? index : 0);
    }
  }, [location.pathname, user]);

  const handleLogout = () => {
    logout();
    navigate("/login");
    if (isMobile) setExpanded(false);
  };

  const handleMenuItemClick = (index, path) => {
    setSelected(index);
    navigate(path);
    if (isMobile) {
      setExpanded(false);
    }
  };

  const toggleSidebar = () => {
    setExpanded(!expanded);
  };

  const filteredMenuItems = user 
    ? SidebarData.filter((item) => item.roles?.includes(user.rol))
    : [];

  return (
    <>
      {/* Botón hamburguesa/cerrar para móvil */}
      {isMobile && (
        <div 
          className={`bars ${expanded ? 'close-icon' : ''}`} 
          onClick={toggleSidebar}
        >
          <UilBars />
          
        </div>
      )}

      {/* Overlay para móvil */}
      {isMobile && expanded && (
        <div 
          className="sidebar-overlay active" 
          onClick={() => setExpanded(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`sidebar ${expanded ? 'mobile-open' : ''}`}>
        {/* Logo */}
        <div className="logo">
          <img src={Logo} alt="logo" />
          <span>Ferre<span>teria</span> Todo<span> Perno</span></span>
        </div>

        {/* Información del usuario - EN LÍNEA EN MÓVIL */}
        {user && (
          <div className="user-panel">
            <div className="avatar-container">
              <div className="avatar-large">
                {getInitials(user.username)}
              </div>
              <div className="user-info">
                <span className="username">{user.username || "Usuario"}</span>
                <span className="user-role">{user.rol || "Ventas"}</span>
              </div>
            </div>
            <button 
              className="logout-btn" 
              onClick={handleLogout}
              title="Cerrar sesión"
            >
              <UilSignOutAlt size="18" />
            </button>
          </div>
        )}

        {/* Menú con scroll */}
        <div className="menu-container">
          <div className="menu">
            {filteredMenuItems.map((item, index) => (
              <div
                className={selected === index ? "menuItem active" : "menuItem"}
                key={index}
                onClick={() => handleMenuItemClick(index, item.path)}
              >
                <item.icon />
                <span>{item.heading}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;