const express = require("express");
const { login } = require("../services/auth/authService");

const router = express.Router();

router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Usuario y contraseña son obligatorios"
            });
        }

        const result = await login(username, password);

        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error("Error de login:", error.message);
        res.status(401).json({
            success: false,
            message: "Usuario o contraseña incorrectos"
        });
    }
});

module.exports = router;
