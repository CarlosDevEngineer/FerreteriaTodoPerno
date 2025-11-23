const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');
//const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

// Rutas públicas
router.get('/', productoController.getProductos);
router.get('/:id', productoController.getProducto);


// productoRoutes.js
const { authenticate } = require('../middlewares/authMiddleware'); // Cambiado de verifyToken a authenticate

router.post('/', productoController.createProducto); // Usa authenticate
router.put('/:id', productoController.updateProducto);
router.delete('/:id', productoController.deleteProducto);

module.exports = router;