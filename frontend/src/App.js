import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import PublicRoute from './auth/PublicRoute'; // ← Importa PublicRoute
import Login from './pages/Login/Login';
import MainDash from './components/MainDash/MainDash';
import Usuario from './pages/Usuario/Usuario';
import DashboardLayout from './layouts/dashboardLayout';
import Producto from './pages/Producto/Producto';
import Cliente from './pages/Cliente/Cliente';
import Proveedor from './pages/Proveedor/Proveedor';
import Combo from './pages/Producto-Combo/ProductoCombo';
import Compras from './pages/Compras/Compras';
import Ventas from './pages/Ventas/VentasMobile';
import Inventario from './pages/Inventario/Inventario';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Ruta pública - solo para no autenticados */}
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />

          {/* Rutas protegidas */}
          <Route path="/" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<MainDash />} />
            <Route path="usuario" element={<Usuario />} />
            <Route path="producto" element={<Producto />} />
            <Route path='clientes' element={<Cliente />} />
            <Route path='proveedor' element={<Proveedor />} />
            <Route path='combo' element={<Combo />} />
            <Route path='compras' element={<Compras />} />
            <Route path='ventas' element={<Ventas />} />
            <Route path='inventario' element={<Inventario />} />
          </Route>

          {/* Redirección para rutas no encontradas */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;