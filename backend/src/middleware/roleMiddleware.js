const permitirRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Usuario no autenticado"
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "No tienes permisos para esta operación"
            });
        }

        next();
    };
};

module.exports = {
    permitirRoles
};
