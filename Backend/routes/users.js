const express = require('express'); //Importación de libreria.
const router = express.Router(); //Es un miniservidor para las rutas relacionadas con teams.
const db = require('../config/db'); //  Importa la conexion con la base de datos.
const bcrypt = require('bcrypt');

router.post('/', async(req, res) =>{
    const {
        id_club,
        user_name,
        surename1,
        surename2,
        DNI,
        email,
        telef,
        birth_date,
        password
    }=req.body;

    if(!id_club || !user_name || !surename1 || !DNI || !birth_date || !password){
        return res.status(400).json({
            error: 'All fields are required'
        });
    }

    try{
        //Comprobamos si el club existe.
        const [clubresult]= await db.promise().query(
            'Select id_club From club where id_club = ?',
            [id_club]
        );

        if(clubresult.length === 0){
            return res.status(400).json({
                error: 'Club not found'
            });
        }

        //Calculamos si es menor de edad.
        const birth = new Date(birth_date);
        const age = new Date().getFullYear()- birth.getFullYear();
        const is_minor = age < 18 ;

        //Hash the contraseña
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);


        //Insertar usuario
        const [result] = await db.promise().query(
            `INSERT INTO users
            (id_club, user_name, surename1, surename2, DNI, email, telef, birth_date, is_minor, passwrd_hash)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id_club,
                user_name,
                surename1,
                surename2 || null,
                DNI,
                email || null,
                telef || null,
                birth_date,
                is_minor,
                passwordHash
            ]
        );
        res.status(201).json({
            message: 'User created succesfully',
            id_user: result.insertId
        })


    }catch{
        console.error(error);

        //Errores con UNIQUE
        if(error.code === 'ER_DUP_ENTRY'){
            return res.status(400).json({
                error: 'User already exist (gmail, DNI or phone'
            });
        }

        res.status(500).json({
            error: "Error creating user"
        });
    }
})

router.get('/', (req, res) => {
    const { club, team, role } = req.query; // Leer los parámetros

    let sql = `
        SELECT
            u.id_user,
            u.user_name,
            u.surename1,
            u.surename2,
            u.email,
            u.id_club,
            r.rol AS global_role,
            t.id_team,
            t.category AS team_category,
            rt.rol AS team_role
        FROM users u
        LEFT JOIN user_rol ur ON u.id_user = ur.id_user
        LEFT JOIN rol r ON ur.id_rol = r.id_rol
        LEFT JOIN user_team ut ON u.id_user = ut.id_user
        LEFT JOIN teams t ON ut.id_team = t.id_team
        LEFT JOIN rol rt ON ut.id_rol = rt.id_rol
        WHERE 1=1
    `;

    const params = [];

    // Filtro por club
    if (club) {
        sql += ' AND u.id_club = ?';
        params.push(club);
    }

    // Filtro por equipo
    if (team) {
        sql += ' AND t.id_team = ?';
        params.push(team);
    }

    // Filtro por rol
    if (role) {
        sql += `
            AND (
                r.rol = ? OR (rt.rol = ? AND t.id_club = u.id_club)
            )
        `;
        params.push(role, role);
    }

    db.query(sql, params, (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }

        const usersMap = {};

        rows.forEach(row => {
            if (!usersMap[row.id_user]) {
                usersMap[row.id_user] = {
                    id_user: row.id_user,
                    user_name: row.user_name,
                    surename1: row.surename1,
                    surename2: row.surename2,
                    email: row.email,
                    id_club: row.id_club,
                    global_roles: [],
                    teams: []
                };
            }

            // Solo agregar global_role si coincide con el filtro de rol (si se pasó)
            if (row.global_role && (!role || row.global_role === role)) {
                if (!usersMap[row.id_user].global_roles.includes(row.global_role)) {
                    usersMap[row.id_user].global_roles.push(row.global_role);
                }
            }

            // Solo agregar equipos si coincide con filtro de rol (si se pasó)
            if (row.id_team && (!role || row.team_role === role)) {
                const exists = usersMap[row.id_user].teams.some(t => t.id_team === row.id_team);
                if (!exists) {
                    usersMap[row.id_user].teams.push({
                        id_team: row.id_team,
                        category: row.team_category,
                        role: row.team_role
                    });
                }
            }
        });

        // Eliminar usuarios que no tengan roles ni equipos cuando se filtró por rol
        let users = Object.values(usersMap);
        if (role) {
            users = users.filter(u => u.global_roles.length > 0 || u.teams.length > 0);
        }

        res.json(users);
    });
});

module.exports = router;


    /*
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
            const usersSql = `
                SELECT 
                    id_user,
                    id_club,
                    user_name,
                    surename1,
                    surename2,
                    DNI,
                    email,
                    telef,
                    birth_date,
                    is_minor
                FROM users
                WHERE id_club = ?
            `;

            db.query(usersSql, [id_club],(err, userResults)=>{
                if(err){
                    console.error(err);
                    return res.status(500).json({error:'Database error'});
                }

                res.json(userResults);
            });
        });
    }else{
        const usersSql = `
                SELECT 
                    id_user,
                    id_club,
                    user_name,
                    surename1,
                    surename2,
                    DNI,
                    email,
                    telef,
                    birth_date,
                    is_minor
                FROM users
            `;
        db.query(usersSql, [id_club], (err, usersResult) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Database error' });
                }

                res.json(usersResult);
        });
    }
        
});
module.exports= router;*/



