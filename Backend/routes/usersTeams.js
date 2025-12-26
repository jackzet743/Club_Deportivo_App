const express = require('express'); //Importación de libreria.
const router = express.Router(); //Es un miniservidor para las rutas relacionadas con teams.
const db = require('../config/db'); //  Importa la conexion con la base de datos.
const auth = require('../middleware/auth');
const role = require('../middleware/role');

router.post('/', auth, role(['directivo']), async(req, res)=>{
    const {id_user, id_team, id_rol} = req.body;

    if(!id_user || !id_team || !id_rol){
        return res.status(400).json({
            error: 'id_user, id_team and id_rol are required'
        })
    }


    try{
        //Comprobación de usuario.
        const [director] = await db.promise().query(
            'Select id_club from users where id_user = ?',
            [req.user.id_user] //Se pide desde la base de datos y no desde la api.
        );

        const id_club = director[0].id_club;

        const [team] = await db.promise().query(`
            SELECT id_team FROM teams WHERE id_team = ? AND id_club = ?`,
            [id_team, id_club]
        );

        if(team.length === 0){
            return res.status(404).json({error:'Team not found'});
        }
        
        const [user] = await db.promise().query(
            'Select id_user from users where id_user = ?',
            [id_user]
        );

        if(user.length === 0){
            return res.status(404).json({error:'User not found'});
        }

        const [resultRol] = await db.promise().query(
            'Select id_rol from rol where id_rol = ?',
            [id_rol]
        );

        if(resultRol.length === 0){
            return res.status(404).json({error: 'Role not found'});
        }

        //Sentar las relaciones
        await db.promise().query(
            `Insert into user_team (id_user, id_team, id_rol)
            values (?,?,?)`,
            [id_user,id_team,id_rol]
        );

        res.status(201).json({
            message: 'User assigned to team successfully'
        });

    }catch (error){
        

        if(error.code === 'ER_DUP_ENTRY'){
            return res.status(400).json({
                error: 'User already assigned to this team'
            })
        }
        console.error(error);

        res.status(500).json({
            error: 'Error assigning user to team'
        });
    }

});

module.exports= router;