const express = require('express'); //Importa la libreria express
const db = require('./config/db'); //  Importa la conexion con la base de datos.
const teamsRoutes = require('./routes/teams');

const app = express(); //Convierte esto en mi servidor. Cuelga de la constante APP.
const PORT = 3000;//Puerto donde se escucha el servidor.

app.use(express.json());//Permite entender json al servidor.
app.use('/teams', teamsRoutes); //Permite usar el router de teams.

//Genera una respuesta a una petición y respuesta.
app.get('/', (req, res) => {
    res.send('Backend running');
});


//Arranca el servidor y empieza a escuchar peticiones por el puerto 3000
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
