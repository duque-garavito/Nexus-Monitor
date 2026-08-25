const pool = require("../../config/database");
const { ejecutarMonitoreoItem } = require("./monitoringEngine");

const scheduler = new Map();
let schedulerRunning = false;

/*
==================================================
OBTENER ITEMS ACTIVOS
==================================================
*/
const obtenerItems = async () => {
    const [items] = await pool.query(`
        SELECT
            items.id,
            items.interval_seconds,
            items.enabled,
            hosts.enabled AS host_enabled
        FROM items
        INNER JOIN hosts
            ON hosts.id = items.host_id
        WHERE
            items.enabled = TRUE
            AND hosts.enabled = TRUE
    `);
    return items;
};

/*
==================================================
ACTUALIZAR SCHEDULER
==================================================
*/
const sincronizarItems = async () => {
    const items = await obtenerItems();
    const idsActuales = new Set();

    for (const item of items) {
        idsActuales.add(item.id);

        if (!scheduler.has(item.id)) {
            scheduler.set(item.id, {
                nextRun: Date.now(),
                interval: item.interval_seconds * 1000,
                running: false
            });
            console.log(`📅 Item ${item.id} agregado al Scheduler`);
        } else {
            scheduler.get(item.id).interval = item.interval_seconds * 1000;
        }
    }

    /*
    ==============================================
    ELIMINAR ITEMS QUE YA NO ESTÁN ACTIVOS
    ==============================================
    */
    for (const id of scheduler.keys()) {
        if (!idsActuales.has(id)) {
            scheduler.delete(id);
            console.log(`🗑️ Item ${id} eliminado del Scheduler`);
        }
    }
};

/*
==================================================
EJECUTAR ITEMS PENDIENTES (SIN TRASLAPOS)
==================================================
*/
const ejecutarPendientes = async () => {
    const ahora = Date.now();

    for (const [itemId, data] of scheduler) {
        if (ahora >= data.nextRun && !data.running) {
            console.log(`⏱️ Ejecutando Item ${itemId}`);
            data.running = true;

            try {
                await ejecutarMonitoreoItem(itemId);
            } catch (error) {
                console.error(`❌ Error Item ${itemId}:`, error);
            } finally {
                data.running = false;
                data.nextRun = Date.now() + data.interval;
            }
        }
    }
};

/*
==================================================
INICIAR SCHEDULER
==================================================
*/
const iniciarScheduler = async () => {
    if (schedulerRunning) {
        console.log("⚠️ Scheduler ya está ejecutándose");
        return;
    }

    schedulerRunning = true;
    console.log("🚀 NEXUS Scheduler iniciado");

    /*
    ==============================================
    CARGAR ITEMS INICIALMENTE
    ==============================================
    */
    await sincronizarItems();

    /*
    ==============================================
    LOOP PRINCIPAL (Cada segundo)
    ==============================================
    */
    setInterval(async () => {
        try {
            await sincronizarItems();
            await ejecutarPendientes();
        } catch (error) {
            console.error("❌ Error Scheduler:", error);
        }
    }, 1000);
};

module.exports = {
    iniciarScheduler
};
