const express = require('express'); //Importación de libreria.
const router = express.Router(); //Es un miniservidor para las rutas relacionadas con teams.
const db = require('../config/db'); //  Importa la conexion con la base de datos.

router.post('/', async (req, res)=>{ //Usamos funciones asincronas para poder hacer promesas await 
    const{ //Datos del club
        name_club,
        city,
        postal_code,
        discipline,
        telef,
        email
    } = req.body;
    if (!name_club || !city || !postal_code || !discipline || !telef || !email) { //Tiene que enviar todo esto.
        return res.status(400).json({
            error: 'All fields are required'
        });
    }


    const connection = await db.promise().getConnection(); //Se usa el pool de db.js y promise para los await y get para pillar la conexión.

    try{
        await connection.beginTransaction();//Esto es para guardar todo o no guardar nada

        const [clubresult] = await connection.query( //Insertar en la tabla club 
            `INSERT INTO club (name_club, city, postal_code, discipline)
            VALUES (?, ?, ?, ?)`,
            [name_club, city, postal_code, discipline]
        );

        const clubId = clubresult.insertId; //coger el id del club creado para insertar con ese id en club_contacto

        await connection.query( //Insertar el contacto.
            `INSERT INTO club_contact (id_club, telef, email)
            VALUES (?, ?, ?)`,
            [clubId, telef, email]
        );

        await connection.commit(); //Confirmarlo.

        res.status(201).json({
            message : 'Club created succesfully',
            id_club : clubId
        });

    }catch (error){ //manejo de errores
        await connection.rollback();
        console.error(error);

        res.status(500).json({
            error: 'Error creating club'
        });
    }finally { //liberar la conexion.
        connection.release();
    }
});


module.exports = router; //Se puede exportar a otros archivos.