// =========================================================
// IMPORTS
// =========================================================

const express = require('express'); // Importación de framework.
const router = express.Router(); // Es un miniservidor para las rutas relacionadas con teams.
const db = require('../config/db'); // Importa la conexion con la base de datos.
const auth = require(`../middleware/auth`); // Importa la autentificación.
const role = require(`../middleware/role`); // Verificación del rol.

// ==========================================================
// POST DARLE AL USUARIO ROLES.
// ==========================================================

// Se debe autentificar un usuario.
// Solo un directivo puede darle roles a un usuario del su club.
router.post('/',auth, role([`directivo`]), async(req,res)=>{

    // Datos recibidos por el usuario.
    const{id_user, id_rol}=req.body;
    // Coger el id del directivo.
    const directorId = req.user.id_user;

    // Verificación de los datos
    if (!id_user || !id_rol) {

        return res.status(400).json({
            error: 'id_user and id_rol are required'
        });

    }

    try{

        // Obtenemos el id_club del directivo
        const [director] = await db.promise().query(
            `Select id_club From users Where id_user = ?`,
            [directorId]
        );

        // Vemos si el usuario existe.
        const [userResult] = await db.promise().query(
            'SELECT id_user FROM users WHERE id_user = ?',
            [id_user]
        );

        // Si no existe salte el error.
        if(userResult.length===0){ 

            return res.status(400).json({
                error: 'User not found'
            }); 

        }

        // Comparamos los clubes entre el directivo y el usuario.
        if(director[0].id_club === userResult[0].id_club){

            return res.status(403).json({
                error: 'You can only manage users from your club'
            });
            
        }

        // Comprobar si el rol existe.
        const [rolResult] = await db.promise().query(
            'SELECT id_rol FROM rol WHERE id_rol = ?',
            [id_rol]
        );

        // Verificación de si existe.
        if(rolResult.length === 0){

            return res.status(404).json({
                error: 'Role not found'
            });

        }

        // Insertar relacion
        await db.promise().query(
            'INSERT INTO user_rol (id_user, id_rol) VALUES (?, ?)',
            [id_user, id_rol]
        );

        res.status(201).json({
            message: 'Global role assigned to user successfully'
        });

    // Manejo de errores.
    } catch (error){
        console.error(error);

        // Error de duplicación, en caso de que el usuario tenga el rol.
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