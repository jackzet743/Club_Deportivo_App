// ============================================
// MIDDLEWARE DE CONTROL DE ROLES
// ============================================

//Recibe un array de los roles permitidos.
module.exports = function roleMiddleware (allowedRoles = []) {

    return (req, res, next) => {

    // Comprueba si auth ya puso al usuario, sino tiene lo bloquea
    if (!req.user || !req.user.roles) {

        return res.status(403).json({
        error: 'No roles found'
        });

    }

    //.some lo que hace es ver si al menos tiene 1 de los roles permitidos.
    const hasPermission = req.user.roles.some(role =>
        allowedRoles.includes(role)
    );

    //Si no tiene los permisos bloqueado.
    if (!hasPermission) {

        return res.status(403).json({
        error: 'Forbidden: insufficient permissions'
        });

    }

    next(); // ✔ tiene permiso
    
    };
};
