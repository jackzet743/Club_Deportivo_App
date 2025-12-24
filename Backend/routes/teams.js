const express = require('express'); //Importación de libreria.
const router = express.Router(); //Es un miniservidor para las rutas relacionadas con teams.
const db = require('../config/db'); //  Importa la conexion con la base de datos.
const auth= require('../middleware/auth');

router.get('/',auth,(req,res)=>{

    const {club, team } = req.query;

    let sql = `
        SELECT
            t.id_team,
            t.category,
            t.id_club,

            u.id_user,
            u.user_name,
            u.surename1,

            r.rol AS team_role

        FROM teams t
        LEFT JOIN user_team ut ON t.id_team = ut.id_team
        LEFT JOIN users u ON ut.id_user = u.id_user
        LEFT JOIN rol r ON ut.id_rol = r.id_rol
    `;

    const conditions = [];
    const params = [];


    if(club){
        conditions.push(' t.id_club=?');
        params.push(club);
    }

    if(team){
        conditions.push( ' t.id_team = ?');
        params.push(team);
    }

    if(conditions.length >0 ){
        sql += ` WHERE ` + conditions.join(' AND ');
    }

    db.query(sql,params,(err,rows)=>{
        if(err){
            console.error(err);
            return res.status(500).json ({error:'Error Database'});
        }

        if (team && rows.length === 0) {
            return res.status(404).json({
            error: 'Team not found'
            });
        }

        const teamsMap = {};

        rows.forEach(row =>{
            // Crear equipo si no existe
            if (!teamsMap[row.id_team]) {
                teamsMap[row.id_team] = {
                    id_team: row.id_team,
                    category: row.category,
                    id_club: row.id_club,
                    users: []
                };
            }

            // Añadir usuario si existe
            if (row.id_user) {
                teamsMap[row.id_team].users.push({
                    id_user: row.id_user,
                    user_name: row.user_name,
                    surename1: row.surename1,
                    role: row.team_role
                });
            }
        });
        res.json(Object.values(teamsMap));
    });

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


/*
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
*/