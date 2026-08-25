const express = require("express");
const pool = require("../config/database");
const { verificarToken } = require("../middleware/authMiddleware");

const router = express.Router();

/*
========================================
GET - Problemas activos (Protegido por Token)
========================================
*/
router.get("/", verificarToken, async (req, res) => {
    try {
        const [problems] = await pool.query(`
            SELECT
                alerts.id,
                alerts.status,
                alerts.severity,
                alerts.message,
                
                alerts.acknowledged,
                alerts.acknowledged_by,
                alerts.acknowledged_at,

                alerts.started_at,
                alerts.resolved_at,

                triggers.name AS trigger_name,

                items.name AS item_name,
                items.key_name,

                hosts.id AS host_id,
                hosts.name AS host_name,
                hosts.ip,
                hosts.type

            FROM alerts

            INNER JOIN triggers
                ON triggers.id = alerts.trigger_id

            INNER JOIN items
                ON items.id = alerts.item_id

            INNER JOIN hosts
                ON hosts.id = items.host_id

            WHERE alerts.status = 'problem'

            ORDER BY
                alerts.started_at DESC
        `);

        res.json({
            success: true,
            data: problems
        });
    } catch (error) {
        console.error("Error obteniendo problemas:", error);
        res.status(500).json({
            success: false,
            message: "Error al obtener problemas"
        });
    }
});

/*
========================================
POST - Reconocer problema (Protegido por Token)
========================================
*/
router.post("/:id/acknowledge", verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { message } = req.body;
        
        // Obtener usuario desde el JWT decodificado
        const user_id = req.user.userId;

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: "El usuario es obligatorio"
            });
        }

        // Buscar alerta
        const [alerts] = await pool.query(
            `
            SELECT *
            FROM alerts
            WHERE id = ?
            `,
            [id]
        );

        if (alerts.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Alerta no encontrada"
            });
        }

        const alert = alerts[0];

        // Verificar si ya fue reconocida
        if (alert.acknowledged) {
            return res.status(409).json({
                success: false,
                message: "La alerta ya fue reconocida"
            });
        }

        // Registrar acknowledgement
        await pool.query(
            `
            INSERT INTO acknowledgements
            (
                alert_id,
                user_id,
                message
            )
            VALUES (?, ?, ?)
            `,
            [
                id,
                user_id,
                message || null
            ]
        );

        // Actualizar alerta
        await pool.query(
            `
            UPDATE alerts
            SET
                acknowledged = TRUE,
                acknowledged_by = ?,
                acknowledged_at = CURRENT_TIMESTAMP
            WHERE id = ?
            `,
            [
                user_id,
                id
            ]
        );

        res.json({
            success: true,
            message: "Problema reconocido correctamente"
        });

    } catch (error) {
        console.error("Error reconociendo problema:", error);
        res.status(500).json({
            success: false,
            message: "Error al reconocer problema"
        });
    }
});

module.exports = router;
