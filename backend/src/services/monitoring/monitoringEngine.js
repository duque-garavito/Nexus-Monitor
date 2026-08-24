const pool = require("../../config/database");
const { comprobarHost } = require("./icmpService");
const { evaluarTriggers } = require("./triggerEngine");

const ejecutarMonitoreo = async () => {
    console.log("🔍 Ejecutando monitoreo...");

    try {
        /*
        ========================================
        1. Obtener Items ICMP
        ========================================
        */
        const [items] = await pool.query(`
            SELECT
                items.id,
                items.name,
                items.key_name,
                items.interval_seconds,
                hosts.id AS host_id,
                hosts.name AS host_name,
                hosts.ip
            FROM items
            INNER JOIN hosts
                ON hosts.id = items.host_id
            WHERE
                items.enabled = TRUE
                AND hosts.enabled = TRUE
                AND items.type = 'icmp'
        `);

        /*
        ========================================
        2. Recorrer Items
        ========================================
        */
        for (const item of items) {
            console.log(`📡 ${item.host_name} (${item.ip})`);

            /*
            ====================================
            3. Ejecutar Ping
            ====================================
            */
            const resultado = await comprobarHost(item.ip);

            console.log(
                resultado.online
                    ? `🟢 ONLINE - ${resultado.latency} ms`
                    : `🔴 OFFLINE`
            );

            /*
            ====================================
            4. Guardar HISTORY (con latencia)
            ====================================
            */
            const valor = resultado.online ? 1 : 0;

            await pool.query(
                `
                INSERT INTO item_history
                (
                    item_id,
                    value_numeric,
                    latency_ms
                )
                VALUES (?, ?, ?)
                `,
                [
                    item.id,
                    valor,
                    resultado.latency
                ]
            );

            /*
            ====================================
            Evaluar TRIGGERS
            ====================================
            */
            await evaluarTriggers(
                item.id,
                valor
            );

            /*
            ====================================
            5. Actualizar estado del Host
            ====================================
            */
            await pool.query(
                `
                UPDATE hosts
                SET status = ?
                WHERE id = ?
                `,
                [
                    resultado.online
                        ? "online"
                        : "offline",
                    item.host_id
                ]
            );
        }

    } catch (error) {
        console.error("❌ Error en Monitoring Engine:", error);
    }
};

module.exports = {
    ejecutarMonitoreo
};
