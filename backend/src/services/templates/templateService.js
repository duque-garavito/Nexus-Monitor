const pool = require("../../config/database");

/*
==================================================
CREAR TEMPLATE
==================================================
*/
const crearTemplate = async ({
    name,
    description = null,
    type = "generic"
}) => {
    if (!name || !name.trim()) {
        throw new Error("El nombre del template es obligatorio");
    }

    const [result] = await pool.query(
        `
        INSERT INTO templates
        (
            name,
            description,
            type
        )
        VALUES (?, ?, ?)
        `,
        [
            name.trim(),
            description,
            type
        ]
    );

    return obtenerTemplatePorId(result.insertId);
};

/*
==================================================
LISTAR TEMPLATES
==================================================
*/
const obtenerTemplates = async () => {
    const [rows] = await pool.query(`
        SELECT
            t.id,
            t.name,
            t.description,
            t.type,
            t.enabled,
            t.created_at,
            t.updated_at,

            COUNT(DISTINCT ti.id) AS items_count,
            COUNT(DISTINCT ht.host_id) AS hosts_count

        FROM templates t

        LEFT JOIN template_items ti
            ON ti.template_id = t.id

        LEFT JOIN host_templates ht
            ON ht.template_id = t.id

        GROUP BY
            t.id

        ORDER BY
            t.name ASC
    `);

    return rows;
};

/*
==================================================
OBTENER TEMPLATE POR ID
==================================================
*/
const obtenerTemplatePorId = async (templateId) => {
    const [templates] = await pool.query(
        `
        SELECT
            id,
            name,
            description,
            type,
            enabled,
            created_at,
            updated_at
        FROM templates
        WHERE id = ?
        LIMIT 1
        `,
        [templateId]
    );

    if (templates.length === 0) {
        return null;
    }

    const template = templates[0];

    /*
    ==============================================
    ITEMS
    ==============================================
    */
    const [items] = await pool.query(
        `
        SELECT
            id,
            template_id,
            name,
            key_name,
            type,
            data_type,
            unit,
            interval_seconds,
            enabled,
            created_at
        FROM template_items
        WHERE template_id = ?
        ORDER BY id ASC
        `,
        [templateId]
    );

    /*
    ==============================================
    HOSTS
    ==============================================
    */
    const [hosts] = await pool.query(
        `
        SELECT
            h.id,
            h.name,
            h.hostname,
            h.ip,
            h.type,
            h.status,
            h.enabled

        FROM hosts h

        INNER JOIN host_templates ht
            ON ht.host_id = h.id

        WHERE ht.template_id = ?

        ORDER BY h.name ASC
        `,
        [templateId]
    );

    return {
        ...template,
        items,
        hosts
    };
};

/*
==================================================
ACTUALIZAR TEMPLATE
==================================================
*/
const actualizarTemplate = async (
    templateId,
    {
        name,
        description,
        type,
        enabled
    }
) => {
    const existente = await obtenerTemplatePorId(templateId);

    if (!existente) {
        throw new Error("Template no encontrado");
    }

    await pool.query(
        `
        UPDATE templates
        SET
            name = ?,
            description = ?,
            type = ?,
            enabled = ?
        WHERE id = ?
        `,
        [
            name?.trim() || existente.name,
            description ?? existente.description,
            type || existente.type,
            enabled ?? existente.enabled,
            templateId
        ]
    );

    return obtenerTemplatePorId(templateId);
};

/*
==================================================
ELIMINAR TEMPLATE
==================================================
*/
const eliminarTemplate = async (templateId) => {
    const existente = await obtenerTemplatePorId(templateId);

    if (!existente) {
        throw new Error("Template no encontrado");
    }

    await pool.query(
        `
        DELETE FROM templates
        WHERE id = ?
        `,
        [templateId]
    );

    return {
        success: true,
        message: "Template eliminado correctamente"
    };
};

/*
==================================================
TEMPLATE ITEMS: CREAR
==================================================
*/
const crearTemplateItem = async (templateId, data) => {
    const {
        name,
        key_name,
        type,
        data_type = "numeric",
        unit = null,
        interval_seconds = 60,
        enabled = true
    } = data;

    if (!name || !key_name || !type) {
        throw new Error("name, key_name y type son obligatorios");
    }

    const [template] = await pool.query(
        `
        SELECT id
        FROM templates
        WHERE id = ?
        LIMIT 1
        `,
        [templateId]
    );

    if (template.length === 0) {
        throw new Error("Template no encontrado");
    }

    const [result] = await pool.query(
        `
        INSERT INTO template_items
        (
            template_id,
            name,
            key_name,
            type,
            data_type,
            unit,
            interval_seconds,
            enabled
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            templateId,
            name.trim(),
            key_name.trim(),
            type,
            data_type,
            unit,
            interval_seconds,
            enabled
        ]
    );

    return obtenerTemplateItemPorId(result.insertId);
};

/*
==================================================
TEMPLATE ITEMS: OBTENER POR ID
==================================================
*/
const obtenerTemplateItemPorId = async (itemId) => {
    const [rows] = await pool.query(
        `
        SELECT
            ti.id,
            ti.template_id,
            ti.name,
            ti.key_name,
            ti.type,
            ti.data_type,
            ti.unit,
            ti.interval_seconds,
            ti.enabled,
            ti.created_at,
            t.name AS template_name

        FROM template_items ti

        INNER JOIN templates t
            ON t.id = ti.template_id

        WHERE ti.id = ?

        LIMIT 1
        `,
        [itemId]
    );

    return rows[0] || null;
};

/*
==================================================
TEMPLATE ITEMS: LISTAR POR TEMPLATE ID
==================================================
*/
const obtenerTemplateItems = async (templateId) => {
    const [rows] = await pool.query(
        `
        SELECT
            id,
            template_id,
            name,
            key_name,
            type,
            data_type,
            unit,
            interval_seconds,
            enabled,
            created_at

        FROM template_items

        WHERE template_id = ?

        ORDER BY id ASC
        `,
        [templateId]
    );

    return rows;
};

/*
==================================================
TEMPLATE ITEMS: ACTUALIZAR
==================================================
*/
const actualizarTemplateItem = async (itemId, data) => {
    const existente = await obtenerTemplateItemPorId(itemId);

    if (!existente) {
        throw new Error("Item de template no encontrado");
    }

    const {
        name = existente.name,
        key_name = existente.key_name,
        type = existente.type,
        data_type = existente.data_type,
        unit = existente.unit,
        interval_seconds = existente.interval_seconds,
        enabled = existente.enabled
    } = data;

    await pool.query(
        `
        UPDATE template_items

        SET
            name = ?,
            key_name = ?,
            type = ?,
            data_type = ?,
            unit = ?,
            interval_seconds = ?,
            enabled = ?

        WHERE id = ?
        `,
        [
            name,
            key_name,
            type,
            data_type,
            unit,
            interval_seconds,
            enabled,
            itemId
        ]
    );

    return obtenerTemplateItemPorId(itemId);
};

/*
==================================================
TEMPLATE ITEMS: ELIMINAR
==================================================
*/
const eliminarTemplateItem = async (itemId) => {
    const existente = await obtenerTemplateItemPorId(itemId);

    if (!existente) {
        throw new Error("Item de template no encontrado");
    }

    await pool.query(
        `
        DELETE FROM template_items
        WHERE id = ?
        `,
        [itemId]
    );

    return {
        success: true,
        message: "Item de template eliminado correctamente"
    };
};

/*
==================================================
TEMPLATE TRIGGERS: CREAR
==================================================
*/
const crearTemplateTrigger = async (templateId, data) => {
    const {
        template_item_id,
        name,
        operator,
        threshold = null,
        severity = "warning",
        enabled = true
    } = data;

    if (!template_item_id || !name || !operator) {
        throw new Error("template_item_id, name y operator son obligatorios");
    }

    const [item] = await pool.query(
        `
        SELECT id
        FROM template_items
        WHERE
            id = ?
            AND template_id = ?
        LIMIT 1
        `,
        [template_item_id, templateId]
    );

    if (item.length === 0) {
        throw new Error("El Item no pertenece al Template");
    }

    const [result] = await pool.query(
        `
        INSERT INTO template_triggers
        (
            template_id,
            template_item_id,
            name,
            operator,
            threshold,
            severity,
            enabled
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
            templateId,
            template_item_id,
            name,
            operator,
            threshold,
            severity,
            enabled
        ]
    );

    return obtenerTemplateTriggerPorId(result.insertId);
};

/*
==================================================
TEMPLATE TRIGGERS: OBTENER POR ID
==================================================
*/
const obtenerTemplateTriggerPorId = async (triggerId) => {
    const [rows] = await pool.query(
        `
        SELECT
            tt.id,
            tt.template_id,
            tt.template_item_id,
            tt.name,
            tt.operator,
            tt.threshold,
            tt.severity,
            tt.enabled,
            tt.created_at,

            ti.name AS item_name,
            ti.key_name

        FROM template_triggers tt

        INNER JOIN template_items ti
            ON ti.id = tt.template_item_id

        WHERE tt.id = ?

        LIMIT 1
        `,
        [triggerId]
    );

    return rows[0] || null;
};

/*
==================================================
TEMPLATE TRIGGERS: LISTAR POR TEMPLATE ID
==================================================
*/
const obtenerTemplateTriggers = async (templateId) => {
    const [rows] = await pool.query(
        `
        SELECT
            tt.id,
            tt.template_id,
            tt.template_item_id,
            tt.name,
            tt.operator,
            tt.threshold,
            tt.severity,
            tt.enabled,
            tt.created_at,

            ti.name AS item_name,
            ti.key_name

        FROM template_triggers tt

        INNER JOIN template_items ti
            ON ti.id = tt.template_item_id

        WHERE tt.template_id = ?

        ORDER BY tt.id ASC
        `,
        [templateId]
    );

    return rows;
};

module.exports = {
    // Templates
    crearTemplate,
    obtenerTemplates,
    obtenerTemplatePorId,
    actualizarTemplate,
    eliminarTemplate,

    // Template Items
    crearTemplateItem,
    obtenerTemplateItems,
    obtenerTemplateItemPorId,
    actualizarTemplateItem,
    eliminarTemplateItem,

    // Template Triggers
    crearTemplateTrigger,
    obtenerTemplateTriggers,
    obtenerTemplateTriggerPorId
};
