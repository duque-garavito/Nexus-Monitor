const express = require("express");
const pool = require("../config/database");

const router = express.Router();

/*
========================================
GET - Obtener todos los hosts
========================================
*/
router.get("/", async (req, res) => {
  try {
    const [hosts] = await pool.query(
      "SELECT * FROM hosts ORDER BY id DESC"
    );
    res.json({
      success: true,
      data: hosts
    });
  } catch (error) {
    console.error("Error al obtener hosts:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener los hosts de la base de datos"
    });
  }
});

/*
========================================
GET - Obtener un host por ID
========================================
*/
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [hosts] = await pool.query(
      "SELECT * FROM hosts WHERE id = ?",
      [id]
    );

    if (hosts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Host no encontrado"
      });
    }

    res.json({
      success: true,
      data: hosts[0]
    });
  } catch (error) {
    console.error(`Error al obtener host ${id}:`, error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el host de la base de datos"
    });
  }
});

/*
========================================
POST - Crear un nuevo host
========================================
*/
router.post("/", async (req, res) => {
  const { name, hostname, ip, type, status, enabled } = req.body;

  // Validación básica
  if (!name || !ip) {
    return res.status(400).json({
      success: false,
      message: "El nombre (name) y la dirección IP (ip) son obligatorios"
    });
  }

  const hostType = type || "other";
  const hostStatus = status || "unknown";
  const isEnabled = enabled !== undefined ? enabled : true;

  try {
    const [result] = await pool.query(
      "INSERT INTO hosts (name, hostname, ip, type, status, enabled) VALUES (?, ?, ?, ?, ?, ?)",
      [name, hostname || name, ip, hostType, hostStatus, isEnabled]
    );

    res.status(201).json({
      success: true,
      message: "Host creado exitosamente",
      data: {
        id: result.insertId,
        name,
        hostname: hostname || name,
        ip,
        type: hostType,
        status: hostStatus,
        enabled: isEnabled
      }
    });
  } catch (error) {
    console.error("Error al crear host:", error);
    res.status(500).json({
      success: false,
      message: "Error al guardar el host en la base de datos"
    });
  }
});

/*
========================================
PUT - Actualizar un host existente
========================================
*/
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, hostname, ip, type, status, enabled } = req.body;

  try {
    const [existing] = await pool.query(
      "SELECT * FROM hosts WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Host no encontrado"
      });
    }

    const updatedName = name !== undefined ? name : existing[0].name;
    const updatedHostname = hostname !== undefined ? hostname : existing[0].hostname;
    const updatedIp = ip !== undefined ? ip : existing[0].ip;
    const updatedType = type !== undefined ? type : existing[0].type;
    const updatedStatus = status !== undefined ? status : existing[0].status;
    const updatedEnabled = enabled !== undefined ? enabled : existing[0].enabled;

    await pool.query(
      "UPDATE hosts SET name = ?, hostname = ?, ip = ?, type = ?, status = ?, enabled = ? WHERE id = ?",
      [updatedName, updatedHostname, updatedIp, updatedType, updatedStatus, updatedEnabled, id]
    );

    res.json({
      success: true,
      message: "Host actualizado exitosamente",
      data: {
        id: parseInt(id),
        name: updatedName,
        hostname: updatedHostname,
        ip: updatedIp,
        type: updatedType,
        status: updatedStatus,
        enabled: updatedEnabled
      }
    });
  } catch (error) {
    console.error(`Error al actualizar host ${id}:`, error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar el host en la base de datos"
    });
  }
});

/*
========================================
DELETE - Eliminar un host
========================================
*/
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [existing] = await pool.query(
      "SELECT * FROM hosts WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Host no encontrado"
      });
    }

    await pool.query("DELETE FROM hosts WHERE id = ?", [id]);

    res.json({
      success: true,
      message: `Host con ID ${id} eliminado exitosamente`
    });
  } catch (error) {
    console.error(`Error al eliminar host ${id}:`, error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar el host de la base de datos"
    });
  }
});

module.exports = router;
