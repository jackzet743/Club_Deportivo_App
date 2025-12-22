const express = require('express'); //Importación de libreria.
const router = express.Router(); //Es un miniservidor para las rutas relacionadas con teams.
const db = require('../config/db'); //  Importa la conexion con la base de datos.


router.get('/',(req, res)=>{ //Define una ruta.
    const sql = 'SELECT * FROM teams';

    db.query(sql,(err, results)=> { //err por si falla y results para las filas de la db.
        //Error en consola tipo 500.
        if(err){
            console.error(err);
            return res.status(500).json({error:'Database error'});
        }
        //Devuelve todo en formato JSON.
        res.json(results);
    });
});

module.exports = router; //Se puede exportar a otros archivos.