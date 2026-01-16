// ===============================================================
// IMPORTS 
// ===============================================================

const express = require('express'); //Importación de libreria.
const router = express.Router(); //Es un miniservidor para las rutas relacionadas con teams.
const db = require('../config/db'); //  Importa la conexion con la base de datos.

// ==================================================================
// POST CREAR CLUB
// ==================================================================

// Posiblemente al crear club tengamos que crear a un usuario que sea el directivo del club
router.post('/', async (req, res)=>{ //Usamos funciones asincronas para poder hacer promesas await 
    
    // Datos requeridos para crear un club. req.body viene dado por el usuario.
    const{ 
        name_club,
        city,
        postal_code,
        discipline,
        telef,
        email
    } = req.body;

    // Tiene que rellenar todos los campos.
    if (!name_club || !city || !postal_code || !discipline || !telef || !email) { 

        return res.status(400).json({
            error: 'All fields are required'
        });

    }

    // Se abre la conexión con la base de datos.
    const connection = await db.promise().getConnection();

    try{

        // O se guarda todo o no se guarda ninguna tabla.
        await connection.beginTransaction();

        // Consulta de insert y guardamos en un array los resultados.
        const [clubresult] = await connection.query( 
            `INSERT INTO club (name_club, city, postal_code, discipline)
            VALUES (?, ?, ?, ?)`,
            [name_club, city, postal_code, discipline]
        );

        // Necesitamos coger el id del club para en la tabla de contacto del club insertar todo.
        const clubId = clubresult.insertId; 

        // Inserccion de los contactos.
        await connection.query( 
            `INSERT INTO club_contact (id_club, telef, email)
            VALUES (?, ?, ?)`,
            [clubId, telef, email]
        );

        // Si llegamos hasta aqui se comitean los cambios en la BD.
        await connection.commit();

        res.status(201).json({
            message : 'Club created succesfully',
            id_club : clubId
        });

    // Manejo de errores.
    }catch (error){ 

        // Se hace rollback si salio algo mal.
        await connection.rollback();
        console.error(error);

        res.status(500).json({
            error: 'Error creating club'
        });

    // Por último se cierra la conexión.
    }finally {
        
        connection.release(); 

    }
});

// =======================================================================================
// GET DE LISTAR CLUBS
// =======================================================================================

// Es una petición sencilla, debemos hacer que solo lo pueda ver el administrador del sistema como mucho.
router.get('/', async( req, res)=>{ 

    try{

        // Rows es una array de objetos, cada uno es un club y añade tambíen el contacto de los mismos.
        const [rows] = await db.promise().query(`
            SELECT c.id_club,c.name_club,c.city,c.postal_code,c.discipline,cc.telef,cc.email 
            FROM club c LEFT JOIN club_contact cc ON c.id_club = cc.id_club;
            `);

        // Devuelve todo de forma limpia.
        const clubs = rows.map(row =>({
            id_club: row.id_club,
            name_club: row.name_club,
            city: row.city,
            postal_code: row.postal_code,
            discipline: row.discipline,
            contact: {
                telef: row.telef,
                email: row.email
            }
        }));

        //Devuelve la respuesta de la base de datos sin exponerlo. En forma de json.
        res.json(clubs);

    // Manejo de errores.
    }catch(error){

        console.error(error);

        res.status(500).json({
            error: 'Error fetching clubs'
        });
    }
})



module.exports = router; //Se puede exportar a otros archivos.