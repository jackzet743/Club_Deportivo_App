// =============================================================
// IMPORTS
// =============================================================

const express = require('express'); //Importación de framework.
const router = express.Router(); //Es un miniservidor para las rutas relacionadas con teams.
const db = require('../config/db'); //  Importa la conexion con la base de datos.
const bcrypt = require('bcrypt'); // Importación de la encriptación.

// ===================================================================
// POST CREAR USUARIO
// ===================================================================

router.post('/', async(req, res) =>{

    // Se reciben los siguientes datos por parte del usuario.
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
    }=req.body; // Se guardan aqui.

    // Validación de los campos obligatorios.
    if(!id_club || !user_name || !surename1 || !DNI || !birth_date || !password || !email || !telef) {
        return res.status(400).json({
            error: 'All fields are required'
        });
    }

    try{

        // Comprobamos si el club existe. En un futuro dependiendo de como se introduzca el usaurio 
        // habrá que ver esto mejor.
        const [club]= await db.promise().query(
            'Select id_club From club where id_club = ?',
            [id_club]
        );

        // Validación si no existe el club.
        if(club.length === 0){

            return res.status(400).json({
                error: 'Club not found'
            });

        }

        //Calculamos si es menor de edad.
        const birth = new Date(birth_date);
        const age = new Date().getFullYear()- birth.getFullYear();
        const is_minor = age < 18 ;

        // Aquí se encripta la contraseña para no guardarla claramente.
        const passwordHash = await bcrypt.hash(password, 10);


        //Insertar usuario y se guarda para la validación.
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

        // Validación del insert.
        res.status(201).json({
            message: 'User created succesfully',
            id_user: result.insertId
        })

    // Manejo de errores.
    }catch(error){

        console.error(error);

        //Errores con UNIQUE, del dni o email.
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

// =================================================================
// GET USERS CON FILTROS.
// =================================================================
router.get('/', async (req, res) => {

    // Lee la información de los filtros.
    const { club, team, role } = req.query; 

    try{

        // Consulta de sql.
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

    // Se guardan en este array los posbles datos que nos interesan.
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

        sql += `AND (r.rol = ? OR (rt.rol = ? AND t.id_club = u.id_club))`;
        params.push(role, role);

    }

    // Pedimos la consulta y la guardamos en el array.
    const [rows] = await db.promise().query(sql, params);

    // Se genera una biblioteca.
    const users = {};

    // Recorre cada fila que viene de la base de datos.
    rows.forEach(row => {

        // Si el usuario no existe todavía.
        if (!users[row.id_user]) {
            // Creamos un usuario Solo una vez con arrays vacios para roles y equipos.
            users[row.id_user] = {
                id_user: row.id_user,
                name: row.user_name,
                email: row.email,
                id_club: row.id_club,
                global_roles: [],
                teams: []
            };

        }

        // Si tiene rol global.
        if (row.global_role) {
            // Lo metemos en el array y así tiene varios roles.
            users[row.id_user].global_roles.push(row.global_role);

        }

        // Si pertenece a un equipo
        if (row.id_team) {
            // Lo añadimos a los teams y así puede estar en varios equipos.
            users[row.id_user].teams.push({
                id_team: row.id_team,
                category: row.category,
                role: row.team_role
            });

        }
    });

    // Lo transforma en un array y luego a json.
    res.json(Object.values(users));

    }catch (error){

        console.error(error);
        res.status(500).json({
            error: 'Error fetching users'
        });

    }
});
