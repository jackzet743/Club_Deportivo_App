// =============================================================
// REQUERIMIENTOS Y LIBRERIAS
// =============================================================


const express = require('express'); // Framework express
const bcrypt = require('bcrypt'); // Libreria de encriptación
const jwt = require('jsonwebtoken'); // Libreria de tokens
const db = require('../config/db'); // Conexion a la base de datos
const jwtConfig = require('../config/jwt'); // Conexión a la configuración de contraseñas.

// Creación de una variable router con framework express.
const router = express.Router();

// ===========================================================
// CREACION DE LA PRIMERA PETICION POST, LOGIN DE USUARIO
// ===========================================================

// Aqui se indica el endpoint de la peticion.
router.post('/login', (req, res) =>{

    // Se reciben los datos del POST, es decir los que indique el usuario.
    const { email, password } = req.body;

    //Validación básica, de los valores guardados anteriormente.
    if (!email || !password) {

        return res.status(400).json({
            error: 'Email and password are required'
        });

    }

    // Se buscara al usuario que tenga este gmail. Consulta Sql.
    const userSql = `
        SELECT id_user,email, passwrd_hash
        FROM users
        WHERE email =?
    `;

    // Hace la query de userSql usando el gmail obtenido antes.
    // Al ser una función que tarda se usa async, cuando termine la consulta, ejecuta la función.
    // err = Error si falla
    // results = resultado de la SQL.
    db.query(userSql, [email], async(err, results)=>{

        if (err) {

            console.error(err);
            return res.status(500).json({ 
                error: 'Database error' 
            });

        }

        // Si no existe el usuario
        if (results.length === 0) {

            return res.status(401).json({
                error: 'Invalid credentials'
            });

        }

        // Guarda el primer usuario que coincida.
        const user = results[0];

        //Comparar password
        const isValidPassword = await bcrypt.compare(
            password, 
            user.passwrd_hash
        );

        // Si es falso devuelve el error.
        if(!isValidPassword){

            return res.status(401).json({
                error: 'Invalid credentials'
            });

        }

        // Con esta consulta sql se consigue el rol del usuario.
        const roleSql = `
            SELECT r.rol
            FROM user_rol ur
            JOIN rol r ON ur.id_rol = r.id_rol
            WHERE ur.id_user = ?
        `;

        // Se guardan los roles tras la consulta, usando la consulta y sobre el usuario ya autentificado
        // user.id_user = coge el id del usuario que tiene este gmail y contraseña.
        const [roles] = await db.promise().query(roleSql, [user.id_user]);


        //Crear token
        const token = jwt.sign(
            {
                id_user: user.id_user,
                email: user.email,
                id_club: user.id_club,
                roles: roles.map(r => r.rol)
            },
            jwtConfig.secret,
            { expiresIn: jwtConfig.expiresIn }
        );

        // Devuelve el token.
        res.json({
            message: 'Login successful',
            token
        });

    });

});
module.exports = router