const pool = require("../../config/database");

/*
==================================================
SINCRONIZAR TEMPLATE → HOST
==================================================
*/
const sincronizarTemplateConHost = async (templateId, hostId) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        /*
        ==========================================
        VALIDAR TEMPLATE
        ==========================================
        */
        const [templates] = await connection.query(
            `
            SELECT
                id,
                name,
                enabled
            FROM templates
            WHERE id = ?
            LIMIT 1
            `,
            [templateId]
        );

        if (templates.length === 0) {
            throw new Error("Template no encontrado");
        }

        /*
        ==========================================
        VALIDAR HOST
        ==========================================
        */
        const [hosts] = await connection.query(
            `
            SELECT
                id,
                name,
                enabled
            FROM hosts
            WHERE id = ?
            LIMIT 1
            `,
            [hostId]
        );

        if (hosts.length === 0) {
            throw new Error("Host no encontrado");
        }

        /*
        ==========================================
        VALIDAR ASOCIACIÓN
        ==========================================
        */
        const [association] = await connection.query(
            `
            SELECT id
            FROM host_templates
            WHERE
                host_id = ?
                AND template_id = ?
            LIMIT 1
            `,
            [hostId, templateId]
        );

        if (association.length === 0) {
            await connection.query(
                `
                INSERT INTO host_templates
                (
                    host_id,
                    template_id
                )
                VALUES (?, ?)
                `,
                [hostId, templateId]
            );
        }

        /*
        ==========================================
        OBTENER TEMPLATE ITEMS
        ==========================================
        */
        const [templateItems] = await connection.query(
            `
            SELECT
                id,
                name,
                key_name,
                type,
                data_type,
                unit,
                interval_seconds,
                enabled
            FROM template_items
            WHERE template_id = ?
            ORDER BY id ASC
            `,
            [templateId]
        );

        /*
        ==========================================
        PROCESAR CADA ITEM
        ==========================================
        */
        for (const templateItem of templateItems) {

            /*
            ======================================
            ¿YA EXISTE?
            ======================================
            */
            const [existingItems] = await connection.query(
                `
                SELECT
                    id,
                    name,
                    key_name,
                    type,
                    data_type,
                    unit,
                    interval_seconds,
                    enabled
                FROM items
                WHERE
                    host_id = ?
                    AND template_item_id = ?
                LIMIT 1
                `,
                [hostId, templateItem.id]
            );

            /*
            ======================================
            CREAR ITEM HEREDADO
            ======================================
            */
            if (existingItems.length === 0) {
                await connection.query(
                    `
                    INSERT INTO items
                    (
                        host_id,
                        name,
                        key_name,
                        type,
                        data_type,
                        unit,
                        interval_seconds,
                        enabled,
                        template_item_id,
                        inherited
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
                    `,
                    [
                        hostId,
                        templateItem.name,
                        templateItem.key_name,
                        templateItem.type,
                        templateItem.data_type,
                        templateItem.unit,
                        templateItem.interval_seconds,
                        templateItem.enabled,
                        templateItem.id
                    ]
                );

                console.log(`🆕 Item heredado creado: ${templateItem.name} → Host ${hostId}`);
            }
            /*
            ======================================
            ACTUALIZAR ITEM HEREDADO
            ======================================
            */
            else {
                const item = existingItems[0];

                await connection.query(
                    `
                    UPDATE items
                    SET
                        name = ?,
                        key_name = ?,
                        type = ?,
                        data_type = ?,
                        unit = ?,
                        interval_seconds = ?,
                        enabled = ?
                    WHERE id = ? AND inherited = 1
                    `,
                    [
                        templateItem.name,
                        templateItem.key_name,
                        templateItem.type,
                        templateItem.data_type,
                        templateItem.unit,
                        templateItem.interval_seconds,
                        templateItem.enabled,
                        item.id
                    ]
                );

                console.log(`🔄 Item heredado actualizado: ${templateItem.name}`);
            }
        }

        await connection.commit();

        return {
            success: true,
            templateId,
            hostId,
            itemsProcessed: templateItems.length
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = {
    sincronizarTemplateConHost
};
