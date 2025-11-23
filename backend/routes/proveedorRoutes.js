const express = require("express");
const router = express.Router();
const ProveedorController = require("../controllers/proveedorController");

// GET /proveedores
router.get("/", ProveedorController.listar);

// GET /proveedores/:id
router.get("/:id", ProveedorController.obtenerPorId);

// POST /proveedores
router.post("/", ProveedorController.crear);

// PUT /proveedores/:id
router.put("/:id", ProveedorController.actualizar);

// DELETE /proveedores/:id
router.delete("/:id", ProveedorController.eliminar);

module.exports = router;
