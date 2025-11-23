require('dotenv').config();

const express = require('express');
const cors = require('cors');
const usuariosRoutes = require('./routes/usuarioRoutes');
const authRoutes = require('./routes/authRoutes');
const productosRoutes = require('./routes/productoRoutes');
const clienteRoutes = require("./routes/clienteRoutes");
const proveedorRoutes = require("./routes/proveedorRoutes");
const productoComboRoutes = require("./routes/comboRoutes");
const compraRoutes = require("./routes/comprasRoutes");
const ventasRoutes = require('./routes/ventasRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const inventarioRoutes = require('./routes/inventarioRoutes');
const app = express();

// Middleware básico
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configura CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
};

app.use(cors(corsOptions));

// Middleware para debug (opcional)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Rutas PÚBLICAS
app.use('/api/auth', authRoutes);

// Rutas PROTEGIDAS
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/proveedores', proveedorRoutes);
app.use('/api/combos', productoComboRoutes);
app.use('/api/compras', compraRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/inventario-movimientos', inventarioRoutes);

app.use('/api/dashboard', dashboardRoutes);

// CORRECCIÓN: Manejo de rutas no encontradas (sin usar *)
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
  });
});

// Middleware global de manejo de errores
app.use((error, req, res, next) => {
  console.error('Error global:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Error interno del servidor'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
  console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log('JWT_SECRET configurado:', !!process.env.JWT_SECRET);
});