const jwt = require("jsonwebtoken");

const verificarToken = (req, res, next) => {
    try {
        const authorization = req.headers.authorization;

        if (!authorization) {
            return res.status(401).json({
                success: false,
                message: "Token requerido"
            });
        }

        const partes = authorization.split(" ");

        if (
            partes.length !== 2 ||
            partes[0] !== "Bearer"
        ) {
            return res.status(401).json({
                success: false,
                message: "Formato de token inválido"
            });
        }

        const token = partes[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Token inválido o expirado"
        });
    }
};

module.exports = {
    verificarToken
};
