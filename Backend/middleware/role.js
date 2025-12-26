module.exports = function (allowedRoles = []) {
    return (req, res, next) => {

    // auth middleware debe haber puesto req.user
    if (!req.user || !req.user.roles) {
        return res.status(403).json({
        error: 'No roles found'
        });
    }

    const hasRole = req.user.roles.some(role =>
        allowedRoles.includes(role)
    );

    if (!hasRole) {
        return res.status(403).json({
        error: 'Forbidden: insufficient permissions'
        });
    }

    next(); // ✔ tiene permiso
    };
};
