const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

// =======================================================
// MIDDLEWARE DE AUTENTICACIÓN
// =======================================================

module.exports  = (req, res, next) =>{

    // Esto lee el header de autentificación, en nuestro caso Bearer [Codigo de la contraseña].
    const authHeader = req.headers.authorization;

    //Si no existe -> No hay token.
    if(!authHeader){

        return res.status(401).json({
            error: 'No token provided'
        });

    }
    
    // Aqui se extra el token y se verifica el formato.
    // Formato:
    // Authorization: Bearer eyJhakbfie
    const token = authHeader.startsWith('Bearer ') 
        ? authHeader.split(' ')[1]  // Nos quedamos solo con el token  
        : authHeader; // Por si viene sin el "Bearer"

    try{

        // Verificamos el token
        const decoded = jwt.verify(token, jwtConfig.secret);

        // Cogemos al usuario verificado y decodificado.
        req.user = decoded;

        // Se continua.
        next();

        /* Gracias al token nos podemos identificar y actuar para pedir al servidor información 
        o darsela y obtener información de usuarios por ejemplo que se guardara en el req.user */
        // req.user.id_user -> Id del usuario.
        // req.user.roles -> Roles del usuario.
        // req.user.email -> Correo del usuario.

    }catch (error){

        return res.status(401).json({
            error: 'Invalid or expired token'
        });

    }
}