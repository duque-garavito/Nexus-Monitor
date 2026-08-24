const express = require("express");
const pool = require("../config/database");

const router = express.Router();

/*
========================================
GET - Problemas activos
========================================
*/
router.get("/", async (req, res) => {
    try {
        const [problems] = await pool.query(`
            SELECT
                alerts.id,
                alerts.status,
                alerts.severity,
                alerts.message,
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

module.exports = router;
