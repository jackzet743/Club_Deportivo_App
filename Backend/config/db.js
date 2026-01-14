const mysql = require('mysql2'); //Importa la libreria de MySQL.

// ======================================
// CREACIÓN DEL POOL
// ======================================

const pool = mysql.createPool({

    host: 'localhost', // Servidor DB
    user: 'root', // Usuario
    password:'Carlosmoya2002', // Contraseña
    database: 'Sports_club_app', // Nombre de la base de datos
    waitForConnections: true, // Espera conexiones
    connectionLimit: 10, // Máximo 10 conexiones activas
    queueLimit: 0 // Cola ilimitada.

});

// ====================================================
// TEST DE CONEXIÓN
// ====================================================

pool.getConnection((err, connection)=>{

    if(err){

        console.error('Error connecting to MySQL:', err);
        return;

    }

    console.log('Connected to MySQL');
    connection.release(); // Devuelve la conexión al pool, los reutiliza

});

// ===============================================
// EXPORTACIÓN
// ===============================================

module.exports = pool; // Permite utilizar pool por otros archivos como en el app.js
