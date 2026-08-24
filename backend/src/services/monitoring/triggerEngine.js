const pool = require("../../config/database");

const evaluarTriggers = async (itemId, valor) => {
    try {
        const [triggers] = await pool.query(
            `
            SELECT *
            FROM triggers
            WHERE item_id = ?
            AND enabled = TRUE
            `,
            [itemId]
        );

        for (const trigger of triggers) {
            let problema = false;

            switch (trigger.operator) {
                case ">":
                    problema = valor > trigger.threshold;
                    break;
                case "<":
                    problema = valor < trigger.threshold;
                    break;
                case ">=":
                    problema = valor >= trigger.threshold;
                    break;
                case "<=":
                    problema = valor <= trigger.threshold;
                    break;
                case "=":
                    problema = valor === trigger.threshold;
                    break;
                case "!=":
                    problema = valor !== trigger.threshold;
                    break;
            }

            await procesarEstadoTrigger(
                trigger,
                problema
            );
        }
    } catch (error) {
        console.error("Error evaluando triggers:", error);
    }
};

const procesarEstadoTrigger = async (
    trigger,
    problema
) => {
    /*
    ==========================================
    CASO 1
    Trigger estaba OK y ahora hay problema
    ==========================================
    */
    if (
        problema &&
        trigger.current_state === "OK"
    ) {
        await pool.query(
            `
            UPDATE triggers
            SET current_state = 'PROBLEM'
            WHERE id = ?
            `,
            [trigger.id]
        );

        await pool.query(
            `
            INSERT INTO alerts
            (
                trigger_id,
                item_id,
                status,
                severity,
                message
            )
            VALUES (?, ?, 'problem', ?, ?)
            `,
            [
                trigger.id,
                trigger.item_id,
                trigger.severity,
                trigger.name
            ]
        );

        console.log(
            `🔴 PROBLEM: ${trigger.name}`
        );
        return;
    }

    /*
    ==========================================
    CASO 2
    Trigger estaba en problema y se recuperó
    ==========================================
    */
    if (
        !problema &&
        trigger.current_state === "PROBLEM"
    ) {
        await pool.query(
            `
            UPDATE triggers
            SET current_state = 'OK'
            WHERE id = ?
            `,
            [trigger.id]
        );

        await pool.query(
            `
            UPDATE alerts
            SET
                status = 'resolved',
                resolved_at = CURRENT_TIMESTAMP
            WHERE
                trigger_id = ?
                AND status = 'problem'
            `,
            [trigger.id]
        );

        console.log(
            `🟢 RESOLVED: ${trigger.name}`
        );
    }
};

module.exports = {
    evaluarTriggers
};
