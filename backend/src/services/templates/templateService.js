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

module.exports = {
    crearTemplate,
    obtenerTemplates,
    obtenerTemplatePorId,
    actualizarTemplate,
    eliminarTemplate
};
