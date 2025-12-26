const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const jwtConfig = require('../config/jwt');


const router = express.Router();

router.post('/login', (req, res)=>{

    const { email, password }=req.body;

    //Validación básica
    if (!email || !password) {
        return res.status(400).json({
            error: 'Email and password are required'
        });
    }

    const sql = `
        SELECT id_user,email, passwrd_hash
        FROM users
        WHERE email =?`;

    db.query(sql, [email], async(err, results)=>{

        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (results.length === 0) {
            return res.status(401).json({
                error: 'Invalid credentials'
            });
        }

        const user = results[0];

        //Comparar password
        const match = await bcrypt.compare(password, user.passwrd_hash);

        if(!match){
            return res.status(401).json({
                error: 'Invalid credentials'
            });
        }
        const roleSql = `
            SELECT r.rol
            FROM user_rol ur
            JOIN rol r ON ur.id_rol = r.id_rol
            WHERE ur.id_user = ?
            `;

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

        res.json({
            message: 'Login successful',
            token
        });

    });

});
module.exports = router