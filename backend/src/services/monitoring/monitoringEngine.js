const pool = require("../../config/database");
const { comprobarHost } = require("./icmpService");
const { evaluarTriggers } = require("./triggerEngine");

const ejecutarMonitoreoItem = async (itemId) => {
    try {
        /*
        ========================================
        OBTENER ITEM
        ========================================
        */
        const [items] = await pool.query(`
            SELECT
                items.id,
                items.name,
                items.key_name,
                items.type,
                items.interval_seconds,

                hosts.id AS host_id,
                hosts.name AS host_name,
                hosts.ip

            FROM items

            INNER JOIN hosts
                ON hosts.id = items.host_id

            WHERE
                items.id = ?
                AND items.enabled = TRUE
                AND hosts.enabled = TRUE

            LIMIT 1
        `, [itemId]);

        if (items.length === 0) {
            console.log(`⚠️ Item ${itemId} no encontrado o deshabilitado`);
            return;
        }

        const item = items[0];

        console.log(`📡 ${item.host_name} (${item.ip})`);

        /*
        ========================================
        ICMP
        ========================================
        */
        if (item.type === "icmp") {
            const resultado = await comprobarHost(item.ip);

            console.log(
                resultado.online
                    ? `🟢 ONLINE - ${resultado.latency} ms`
                    : `🔴 OFFLINE`
            );

            const valor = resultado.online ? 1 : 0;

            /*
            ====================================
            HISTORY
            ====================================
            */
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
            TRIGGERS
            ====================================
            */
            await evaluarTriggers(item.id, valor);

            /*
            ====================================
            ACTUALIZAR HOST
            ====================================
            */
            await pool.query(
                `
                UPDATE hosts
                SET status = ?
                WHERE id = ?
                `,
                [
                    resultado.online ? "online" : "offline",
                    item.host_id
                ]
            );
        }

    } catch (error) {
        console.error(`Error monitoreando Item ${itemId}:`, error);
        throw error;
    }
};

const ejecutarMonitoreo = async () => {
    try {
        const [items] = await pool.query(`
            SELECT id
            FROM items
            WHERE enabled = TRUE
        `);

        for (const item of items) {
            await ejecutarMonitoreoItem(item.id);
        }
    } catch (error) {
        console.error("❌ Error en ejecutarMonitoreo general:", error);
    }
};

module.exports = {
    ejecutarMonitoreo,
    ejecutarMonitoreoItem
};
