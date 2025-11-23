import React from 'react';
import Sidebar from '../components/Sidebar';

const FullWidthLayout = ({ children }) => {
  return (
    <div className="AppGlass">
      <Sidebar />
      <div className="full-width-content">
        {children}
      </div>
      {/* Div vacío para mantener la estructura de 3 columnas */}
      <div></div>
    </div>
  );
};

export default FullWidthLayout;