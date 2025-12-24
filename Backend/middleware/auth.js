const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

module.exports  = (req, res, next) =>{

    const authHeader = req.headers.authorization;

    if(!authHeader){
        return res.status(401).json({
            error: 'No token provided'
        });
    }
    // Si el header tiene "Bearer <token>", tomamos el segundo valor; si no, usamos todo
    const token = authHeader.startsWith('Bearer ') 
        ? authHeader.split(' ')[1] 
        : authHeader;

    try{
        const decoded = jwt.verify(token, jwtConfig.secret);
        req.user = decoded;
        next();
    }catch (error){
        return res.status(401).json({
            error: 'Invalid or expired token'
        });
    }
}