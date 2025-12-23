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

router.get('/',(req,res)=>{
    const {id_club}=req.query; //Leer la query.

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


module.exports= router;