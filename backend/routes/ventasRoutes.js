const express = require('express');
const router = express.Router();
const VentasController = require('../controllers/ventasController');

//const authenticate = require('../middlewares/authMiddleware');

// Todas las rutas protegidas por autenticación
//router.use(authenticate);

router.get('/', VentasController.listarVentas);
router.get('/:id', VentasController.obtenerVentaDetalle);
router.post('/', VentasController.crearVenta);

module.exports = router;

