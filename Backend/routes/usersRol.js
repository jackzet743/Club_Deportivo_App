const express = require('express'); //Importación de libreria.
const router = express.Router(); //Es un miniservidor para las rutas relacionadas con teams.
const db = require('../config/db'); //  Importa la conexion con la base de datos.

router.post('/', async(req,res)=>{

    const{id_user, id_rol}=req.body;

    if (!id_user || !id_rol) {
        return res.status(400).json({
            error: 'id_user and id_rol are required'
        });
    }

    try{
        const [userResult] = await db.promise().query(
            'SELECT id_user FROM users WHERE id_user = ?',
            [id_user]
        );

        if(userResult.length===0){
            return res.status(400).json({
                error: 'User not found'
            });
        }
        //Comprobar si el rol existe.
        const [rolResult] = await db.promise().query(
            'SELECT id_rol FROM rol WHERE id_rol = ?',
            [id_rol]
        );

        if(rolResult.length === 0){
            return res.status(404).json({
                error: 'Role not found'
            });
        }

        //Insertar relacion
        await db.promise().query(
            'INSERT INTO user_rol (id_user, id_rol) VALUES (?, ?)',
            [id_user, id_rol]
        );

        res.status(201).json({
            message: 'Global role assigned to user successfully'
        });

    } catch (error){
        console.error(error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                error: 'User already has this role'
            });
        }

        res.status(500).json({
            error: 'Error assigning role'
        });
    }
});


module.exports= router;