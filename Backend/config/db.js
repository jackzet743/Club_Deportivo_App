const mysql = require('mysql2'); //Importa la libreria de MySQL.


//Es para hacer la conexion rapida.
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password:'Carlosmoya2002',
    database: 'Sports_club_app'
});

//Intenta abrir la conexión
pool.getConnection((err, connection)=>{
    if(err){
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL');
    connection.release(); //Devuelve la conexión al pool, los reutiliza
});

module.exports = pool; //permite utilizar pool por otros archivos como en el app.js
