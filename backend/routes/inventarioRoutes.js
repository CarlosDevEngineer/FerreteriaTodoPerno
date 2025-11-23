const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventarioController');

// Rutas para movimientos de inventario
router.get('/', inventarioController.getMovimientos);
router.get('/resumen', inventarioController.getResumenMovimientos);
router.get('/producto/:productoId', inventarioController.getMovimientosByProducto);
router.get('/stock/:productoId', inventarioController.getStockProducto);
router.get('/:id', inventarioController.getMovimiento);
router.post('/', inventarioController.createMovimiento);

module.exports = router;