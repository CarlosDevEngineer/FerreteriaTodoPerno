const express = require("express");
const router = express.Router();
const ClienteController = require("../controllers/clienteController");

// GET /clientes
router.get("/", ClienteController.listar);

// GET /clientes/:id
router.get("/:id", ClienteController.obtenerPorId);

// POST /clientes
router.post("/", ClienteController.crear);

// PUT /clientes/:id
router.put("/:id", ClienteController.actualizar);

// DELETE /clientes/:id
router.delete("/:id", ClienteController.eliminar);

module.exports = router;
