const express = require("express");
const router = express.Router();
const {
    crearTemplate,
    obtenerTemplates,
    obtenerTemplatePorId,
    actualizarTemplate,
    eliminarTemplate
} = require("../services/templates/templateService");

/*
==================================================
GET /api/templates
==================================================
*/
router.get("/", async (req, res) => {
    try {
        const templates = await obtenerTemplates();
        res.json({
            success: true,
            data: templates
        });
    } catch (error) {
        console.error("Error obteniendo templates:", error);
        res.status(500).json({
            success: false,
            message: "Error obteniendo templates"
        });
    }
});

/*
==================================================
GET /api/templates/:id
==================================================
*/
router.get("/:id", async (req, res) => {
    try {
        const template = await obtenerTemplatePorId(req.params.id);

        if (!template) {
            return res.status(404).json({
                success: false,
                message: "Template no encontrado"
            });
        }

        res.json({
            success: true,
            data: template
        });
    } catch (error) {
        console.error("Error obteniendo template:", error);
        res.status(500).json({
            success: false,
            message: "Error obteniendo template"
        });
    }
});

/*
==================================================
POST /api/templates
==================================================
*/
router.post("/", async (req, res) => {
    try {
        const template = await crearTemplate(req.body);

        res.status(201).json({
            success: true,
            message: "Template creado correctamente",
            data: template
        });
    } catch (error) {
        console.error("Error creando template:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Ya existe un template con ese nombre"
            });
        }

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

/*
==================================================
PUT /api/templates/:id
==================================================
*/
router.put("/:id", async (req, res) => {
    try {
        const template = await actualizarTemplate(req.params.id, req.body);

        res.json({
            success: true,
            message: "Template actualizado correctamente",
            data: template
        });
    } catch (error) {
        console.error("Error actualizando template:", error);

        if (error.message === "Template no encontrado") {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

/*
==================================================
DELETE /api/templates/:id
==================================================
*/
router.delete("/:id", async (req, res) => {
    try {
        const resultado = await eliminarTemplate(req.params.id);
        res.json(resultado);
    } catch (error) {
        console.error("Error eliminando template:", error);

        if (error.message === "Template no encontrado") {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: "Error eliminando template"
        });
    }
});

module.exports = router;
