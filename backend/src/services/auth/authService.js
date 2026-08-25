const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../../config/database");

const login = async (username, password) => {
    const [users] = await pool.query(
        `
        SELECT
            id,
            username,
            password,
            full_name,
            role,
            enabled
        FROM users
        WHERE username = ?
        LIMIT 1
        `,
        [username]
    );

    if (users.length === 0) {
        throw new Error("Credenciales inválidas");
    }

    const user = users[0];

    if (!user.enabled) {
        throw new Error("Usuario deshabilitado");
    }

    const passwordCorrect = await bcrypt.compare(
        password,
        user.password
    );

    if (!passwordCorrect) {
        throw new Error("Credenciales inválidas");
    }

    const token = jwt.sign(
        {
            userId: user.id,
            username: user.username,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "8h"
        }
    );

    return {
        token,
        user: {
            id: user.id,
            username: user.username,
            full_name: user.full_name,
            role: user.role
        }
    };
};

module.exports = {
    login
};
