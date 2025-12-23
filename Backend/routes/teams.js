const express = require('express'); //Importación de libreria.
const router = express.Router(); //Es un miniservidor para las rutas relacionadas con teams.
const db = require('../config/db'); //  Importa la conexion con la base de datos.


router.get('/',(req, res)=>{ //Define una ruta.
    const {id_club}=req.query;//Lee parametros de la query.

    if (id_club) {
        
        const sql = 'SELECT * FROM teams WHERE id_club = ?';

        db.query(sql, [id_club], (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(results);
        });

    } else {
        
        const sql = 'SELECT * FROM teams';

        db.query(sql, (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(results);
        });
    }
});

router.post('/', async(req, res)=>{
    const{id_club, category}=req.body; //coge los datos del cliente

    if(!id_club || !category){
        return res.status(400).json({ //Control de que se pongan los datos
            error: 'id_club and category required'
        });
    }

    try{//Consulta
        const [result]= await db.promise().query(` 
            INSERT INTO teams (id_club, category)
            VALUES (?, ?)`, [id_club, category]
        );
        //Respuesta por el servidor
        res.status(201).json({
            message: "Team created succesfully",
            id_team: result.insertId
        });

    }catch{
        console.error(error);

        if(error.code === 'ER_NO_REFERENCES_ROW_2'){
            return res.status(400).json({
                error: 'Club does not exist'
            });
        }
    
        res.status(500).json({
            error: 'Error creating team'
        });
    }

})

module.exports = router; //Se puede exportar a otros archivos.