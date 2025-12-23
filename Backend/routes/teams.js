const express = require('express'); //Importación de libreria.
const router = express.Router(); //Es un miniservidor para las rutas relacionadas con teams.
const db = require('../config/db'); //  Importa la conexion con la base de datos.


router.get('/',(req, res)=>{ //Define una ruta.
    const {id_club}=req.query;//Lee parametros de la query.

    if (id_club) {
        //vemos si el club existe.
        const clubSql = 'SELECT id_club FROM club WHERE id_club = ?';

        db.query(clubSql, [id_club], (err, clubResult) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Database error' });
            }

            // 2️⃣ Si el club no existe
            if (clubResult.length === 0) {
                return res.status(404).json({
                    error: 'Club not found'
                });
            }

            // 3️⃣ Si existe, buscar equipos
            const teamsSql = 'SELECT * FROM teams WHERE id_club = ?';

            db.query(teamsSql, [id_club], (err, teamsResult) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Database error' });
                }

                res.json(teamsResult);
            });
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