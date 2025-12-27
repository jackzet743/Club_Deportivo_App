const express = require('express'); //Importación de libreria.
const router = express.Router(); //Es un miniservidor para las rutas relacionadas con teams.
const db = require('../config/db'); //  Importa la conexion con la base de datos.
const auth = require('../middleware/auth');
const role = require('../middleware/role');

router.get('/', auth, (req, res) => {
    const { club } = req.query;

    let sql = `
        SELECT id_team, category, id_club
        FROM teams
    `;

    const params = [];

    if (club) {
        sql += ' WHERE id_club = ?';
        params.push(club);
    }

    db.query(sql, params, (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }

        res.json(rows);
    });
});

router.get('/:id/users', auth, async (req, res) => {
    const id_team = req.params.id;

    try {
    // 1️⃣ Obtener equipo
    const [team] = await db.promise().query(
        'SELECT id_team, category, id_club FROM teams WHERE id_team = ?',
        [id_team]
    );

    if (team.length === 0) {
        return res.status(404).json({ error: 'Team not found' });
    }

    // 2️⃣ Obtener club del usuario autenticado
    const [userClub] = await db.promise().query(
        'SELECT id_club FROM users WHERE id_user = ?',
        [req.user.id_user]
    );

    if (team[0].id_club !== userClub[0].id_club) {
        return res.status(403).json({
            error: 'Access denied to this team'
        });
    }

    // 3️⃣ Obtener usuarios del equipo con roles
    const [users] = await db.promise().query(
        `
        SELECT 
            u.id_user,
            CONCAT(u.user_name, ' ', u.surename1) AS name,
            r.rol
        FROM user_team ut
        JOIN users u ON ut.id_user = u.id_user
        JOIN rol r ON ut.id_rol = r.id_rol
        WHERE ut.id_team = ?
        `,
        [id_team]
    );

    res.json({
        team: {
            id_team: team[0].id_team,
            category: team[0].category
        },
        users
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});


router.post('/', auth, role(['directivo']), async(req, res)=>{ //se pide autentificarse y que el token the identificación tenga el rol de directivo para poder crear equipos.
    const {category} = req.body;
    const id_user = req.user.id_user; //Le pedimos a la base de datos a la base de datos, no al usuario 
    if(!category){
        return res.status(400).json({
        error: "Category is required"
        });
    }

    try{//Consulta

        const [users] = await db.promise().query(
            'SELECT id_club FROM users WHERE id_user = ?',
            [id_user]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }


        const id_club= users[0].id_club;

        const sql=`
        INSERT INTO teams (id_club, category)
        VALUES (?, ?)`;


        const [result]= await db.promise().query(sql, [id_club, category]);
        
        //Respuesta por el servidor
        res.status(201).json({
            message: "Team created succesfully",
            id_team: result.insertId
        });

    }catch(error){
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