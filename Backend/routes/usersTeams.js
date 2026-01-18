// ========================================================
// IMPORTS
// ========================================================

const express = require('express'); // Importación de libreria.
const router = express.Router(); // Es un miniservidor para las rutas relacionadas con teams.
const db = require('../config/db'); // Importa la conexion con la base de datos.
const auth = require('../middleware/auth'); // Importa el archivo donde los usuarios se autentifican.
const role = require('../middleware/role'); // Importa el archivo donde se explica el rol que requiere para una petición

// ======================================================
// POST ASIGNAR USUARIOS A EQUIPOS CON ROLES.
// ======================================================

// Solo el directivo autentificado puede realizar la petición.
router.post('/', auth, role(['directivo']), async (req, res) => {

    // Datos pedidos al director para añadir usuarios a los equipos.
    const { id_user, id_team, roles } = req.body;

    // Validación de los datos.
    if (!id_user || !id_team || !Array.isArray(roles) || roles.length === 0) {

        return res.status(400).json({
            error: 'id_user, id_team and roles[] are required'
        });

    }

    try {

        // Club del directivo
        const [director] = await db.promise().query(
            'SELECT id_club FROM users WHERE id_user = ?',
            [req.user.id_user]
        );

        // Se guarda el club del directivo.
        const id_club = director[0].id_club;

        // Verificar equipo pertenece a su club.
        const [team] = await db.promise().query(
            'SELECT id_team FROM teams WHERE id_team = ? AND id_club = ?',
            [id_team, id_club]
        );

        // Validación de lo anterior.
        if (team.length === 0) {

            return res.status(404).json({ 
                error: 'Team not found' 
            });

        }

        // Verificar usuario existe y su validación
        const [user] = await db.promise().query(
            'SELECT id_user FROM users WHERE id_user = ?',
            [id_user]
        );

        if (user.length === 0) {

            return res.status(404).json({ error: 
                'User not found' 
            });

        }


        // Asignar roles
        let assigned = [];
        let skipped = [];

        // Nos movemos en el array de roles.
        for (const id_rol of roles) {

            // Comprobar que el rol existe y validarlo
            const [rol] = await db.promise().query(
                'SELECT id_rol FROM rol WHERE id_rol = ?',
                [id_rol]
            );

            if (rol.length === 0) {

                skipped.push(id_rol);
                continue;

            }

            try {

                // Se añade el usuario al equipo con ese rol.
                await db.promise().query(
                    `INSERT INTO user_team (id_user, id_team, id_rol)
                    VALUES (?,?,?)`,
                    [id_user, id_team, id_rol]
                );

                // Y se añade a los asignados.
                assigned.push(id_rol);

            } catch (err) {

                // Si ya esta dupliacdo ese rol pues salta el error.
                if (err.code === 'ER_DUP_ENTRY') {

                    skipped.push(id_rol);

                } else {

                    throw err;
                    
                }
            }
        }

        res.status(201).json({
            message: 'Roles processed',
            assigned_roles: assigned,
            skipped_roles: skipped
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Error assigning roles'
        });
    }
});

module.exports= router;