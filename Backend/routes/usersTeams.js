const express = require('express'); //Importación de libreria.
const router = express.Router(); //Es un miniservidor para las rutas relacionadas con teams.
const db = require('../config/db'); //  Importa la conexion con la base de datos.

router.post('/', async(req, res)=>{
    const {id_user, id_team, id_rol} = req.body;

    if(!id_user || !id_team || !id_rol){
        return res.status(400).json({
            error: 'id_user, id_team and id_rol are required'
        })
    }

    const connection = await db.promise().getConnection();

    try{
        //Comprobación de usuario.
        const [resultUser] = await connection.query(
            'Select id_user, id_club from users where id_user = ?',
            [id_user]
        );

        if(resultUser.length === 0){
            await connection.rollback();
            return res.status(404).json({error:'User not found'});
        }
        //Comprobación de equipo
        const [resultTeam] = await connection.query(
            'Select id_team, id_club from teams where id_team = ?',
            [id_team]
        );

        if(resultTeam.length===0){
            await connection.rollback();
            return res.status(404).json({error:'Team not found'});
        }

        const [resultRol] = await connection.query(
            'Select id_rol from rol where id_rol = ?',
            [id_rol]
        );

        if(resultRol.length === 0){
            await connection.rollback();
            return res.status(404).json({error: 'Rol not found'});
        }

        //Tienen que ser del mismo club
        if(resultTeam[0].id_club !== resultUser[0].id_club){
            await connection.rollback();
            return res.status(404).json({
                error: 'User and team not from the same club'
            });
        }

        //Sentar las relaciones
        await connection.query(
            `Insert into user_team (id_user, id_team, id_rol)
            values (?,?,?)`,
            [id_user,id_team,id_rol]
        );

        await connection.commit();
        res.status(201).json({
            message: 'User assigned to team succesfully'
        });


    }catch (error){
        await connection.rollback();
        console.error(error);

        if(error.code === 'ER_DUP_ENTRY'){
            return res.status(400).json({
                error: 'User already assigned to this team'
            })
        }
        res.status(500).json({
            error: 'Error assigning user to team'
        });
    } finally{
        connection.release();
    }

});

module.exports= router;