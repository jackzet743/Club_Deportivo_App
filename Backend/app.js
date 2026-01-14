// ==================================================
// IMPORTACIONES
// ==================================================

const express = require('express'); // Importa la libreria express, Framework que genera el servidor.
const db = require('./config/db'); //  Importa la conexion con la base de datos, MySQL.

// RUTAS

const clubsRoutes = require('./routes/clubs'); 
const teamsRoutes = require('./routes/teams');
const usersRoutes = require('./routes/users');
const usersRolRoutes = require('./routes/usersRol');
const usersTeamsRoutes= require('./routes/usersTeams');
const authRoutes = require('./routes/auth');


// ====================================================
// CONFIGURACIÓN
// ====================================================

const app = express(); // Convierte esto en mi servidor.
const PORT = 3000; // Puerto donde se escucha el servidor.

// ====================================================
// MIDDLEWARE GLOBALES
// ====================================================

app.use(express.json()); // Permite entender json al servidor.

// RUTAS

app.use('/clubs', clubsRoutes); // /clubs/...
app.use('/teams', teamsRoutes); // /teams/...
app.use('/users', usersRoutes); // /users/...
app.use('/user_Rol', usersRolRoutes); // /user_rol/...
app.use('/user_team', usersTeamsRoutes); // /user_team/...
app.use('/auth', authRoutes); // /auth/...

// RUTA RAÍZ
app.get('/', (req, res) => {
    res.send('Backend running');
});

// =================================================
// ARRANQUE DEL SERVIDOR
// =================================================

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
