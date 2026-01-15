// =====================================================================
// IMPORTS
// =====================================================================

const express = require('express'); // Importación deL framework.
const router = express.Router(); // Es un miniservidor para las rutas relacionadas con teams.
const db = require('../config/db'); //  Importa la conexion con la base de datos.
const auth = require('../middleware/auth'); // Importa el middleware de autentificación. 
const role = require('../middleware/role'); // Importa el middleware de obtencion de roles. 
const canAccessTeam = require('../middleware/canAccessTeam'); // Importa el middleware de entrada a ver equipos.

// ======================================================================
// GET /teams
// ======================================================================

// Es una ruta protegida por auth. Solo pueden entrar los usuarios logueados.
router.get('/', auth, (req, res) => {

    // Esto es para obtener el club del que pertenece el equipo, si viene.
    const { club } = req.query;

    // Con esta query dinámica, por ahora podemos obtener todos los equipos.
    let sql = `
        SELECT id_team, category, id_club
        FROM teams
    `;

    // Esto es para añadir ? a la consulta sql.
    const params = [];

    // Esto le añade al query un filtro de el club.
    if (club) {

        sql += ' WHERE id_club = ?';
        params.push(club);

    }

    // Realización de la consulta normal.
    db.query(sql, params, (err, rows) => {

        if (err) {

            console.error(err);
            return res.status(500).json({ error: 'Database error' });

        }
        // Devuelve en respuesta un json. rows es la respuesta que el servidor hace.
        res.json(rows);

    });
});

// ===================================================================
// GET /:id/users
// ===================================================================

// Este GET es la consulta que filtra para ver un equipo de un club.
// directivo -> verá todos los de su club
// entrenador -> verá solo a los que pertenece.
// auth -> validará si el token de acceso es correcto.
// canAccessTeam -> Regula los accesos de los usuarios.
// async porque hasta que no se complete no se puede ejecutar.
router.get('/:id/users', auth,role([`directivo`,`entrenador`]), canAccessTeam, async (req, res) => {

    // req.params.id -> proviene de GET /teams/5/users -> req.params ={ id:5} -> req.params.id = 5.
    const id_team = req.params.id;
    
    // Consulta que obtiene los usuarios del equipo y sus roles. Y guarda los datos
    // Es await y promise para que no bloque el servidor.
    const [users] = await db.promise().query(`
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

    // req.team viene del middleware de canAccessTeam.js y genera esta respuesta.
    res.json({
        team: {
            id_team: req.team.id_team,
            category: req.team.category
        },
        users
    });
});

// ===============================================================================
// POST CREACIÓN EQUIPOS
// ===============================================================================

// Controlado por la autentificación y porque solo los directivos pueden hacer equipos.
router.post('/', auth, role(['directivo']), async(req, res)=>{ 

    const {category} = req.body; // Esto se pide al usuario que lo introduzca.
    const id_user = req.user.id_user; // Proviene de auth y se le pide el id del usuario autentificado.
    
    // Necesitamos indicar la categoria del equipo.
    if(!category){

        return res.status(400).json({
        error: "Category is required"
        });

    }

    try{

        // En esta consulta tratamos de encontrar y guardar el club del usuario identificado y directivo.
        const [users] = await db.promise().query(
            'SELECT id_club FROM users WHERE id_user = ?',
            [id_user]
        );

        // Esto es en caso de que no se haya encontrado el club del usuario
        if (users.length === 0) {

            return res.status(404).json({ error: 'User not found' });

        }

        // Coge al primer club al que pertenece y lo guarda en la constante.
        const id_club= users[0].id_club;

        // Consulta de insercción del equipo y su categoria con el club al que pertenece.
        const sql=`
        INSERT INTO teams (id_club, category)
        VALUES (?, ?)
        `;

        // Aqui se ejecuta la inserción, usando los ? obtenidos de los middleware no de la base de datos.
        const [result]= await db.promise().query(sql, [id_club, category]);
        
        //Respuesta por el servidor
        res.status(201).json({
            message: "Team created succesfully",
            id_team: result.insertId
        });

    // Gestión de errores
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

// ===============================================================
// DELETE /:id/users/:id_user
// ===============================================================

// El director puede quitar usuarios de los equipos, los entrenadores no.
// Se autentifica con auth
// Se ve si puede acceder al equipo canAccessTeam.js.
// async porque hasta que no se complete no se puede ejecutar.
router.delete(
    '/:id/users/:id_user',
    auth, role(['directivo']), // Revisar y preguntar.
    canAccessTeam,
    async (req, res)=>{

        // req.params.id -> DELETE teams/1/users/4
        const id_team = req.params.id; // 1
        const id_user = req.params.id_user; // 4

        try{
            //Comprobar que la relación entre el equipo y el usuario existe.
            const [rows] = await db.promise().query(`
                Select 1
                From user_team
                Where id_team = ? AND id_user = ?
                `,
                [id_team, id_user]
            );

            // Si no existe la relacion sale este error
            if(rows.length === 0){

                return res.status(404).json({
                    error: "User not assigned to this team"
                });

            }

            //Borrar relación para que no de fallo el delete.
            await db.promise().query(`
                Delete from user_team
                Where id_team = ? and id_user = ?
                `,
                [id_team, id_user]
            );
            
            // Mensaje de control
            res.json({
                message: 'User removed from team successfully'
            });

        // Control de errores.
        }catch(error){
            console.error(error);
            res.status(500).json({error: `Server error`});

        }
    }
)


module.exports = router; //Se puede exportar a otros archivos.


