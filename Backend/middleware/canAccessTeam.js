// ==================================================
// FUNCIONALIDAD DE ESTE MIDDLEWARE
// ==================================================

/*
    Decide si un usuario puede acceder a un equipo según:
        Si es DIRECTIVO -> mismo club.
        Si es ENTRENADOR -> si esta asignado a ese equipo.
        Si no -> Denegar acceso.
*/


const db = require('../config/db');

// async sirve para al coger datos de otro sitio, como puede tardar que el programa no avance sin ello.
module.exports = async (req,res, next) =>{

    const id_team = req.params.id; // Equipo solicitado.
    const userId = req.user.id_user; // El id del usuario identificado.
    const roles = req.user.roles; // Y el rol que tiene.

    try{

        // Esto nos permite ver en la base de datos si el equipo existe. Y si existe guardamos los datos.
        const [teamRows] = await db.promise().query('SELECT id_team, id_club FROM teams WHERE id_team = ?',[id_team]);

        if (teamRows.length === 0) {

            return res.status(404).json({ 

                error: 'Team not found' 

            });

        }

        const team = teamRows[0];

        // roles tiene los roles del usuario por tanto si tiene "Directivo" hace lo siguiente
        if (roles.includes('directivo')) {

            // Recoge el club del directivo.
            const [userClub] = await db.promise().query(

                'SELECT id_club FROM users WHERE id_user = ?',
                [userId]

            );

            // Si el club no existe o el club del usuario y del equipo no coinciden salta el error.
            if (userClub.length === 0 || userClub[0].id_club !== team.id_club) {

                return res.status(403).json({

                error: 'Access denied to this team'
                
                });
            }

            // Si llega hasta aqui sin errores, el team declarado pasa a ser el req.team guardando los datos
            req.team = team;
            return next();

        }
        
        // Si es un entrenador tiene que estar asignado al equipo.
        if (roles.includes('entrenador')) {

            //Guarda los datos de la consulta
            const [assigned] = await db.promise().query(

                // Comprueba si un usuario tiene el rol de entrenador en un equipo.
                `
                SELECT 1
                FROM user_team ut
                JOIN rol r ON ut.id_rol = r.id_rol
                WHERE ut.id_user = ?
                AND ut.id_team = ?
                AND r.rol = 'entrenador'
                `,
                [userId, id_team]

            );

            // Si no existe no tiene acceso
            if (assigned.length === 0) {

                return res.status(403).json({

                error: 'Access denied to this team'
                
                });
            }

            // Si se cumple la condicion guarda la informacion de un equipo.
            req.team = team;
            return next();
        }

        // Si no tiene permisos 
        return res.status(403).json({

            error: 'Access denied'

        });

    }catch (error){

        console.error(error);
        res.status(500).json({
            
            error:'Server error'
        
        });
    }
}