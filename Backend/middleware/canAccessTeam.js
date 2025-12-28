const db = require('../config/db');

module.exports = async (req,res, next) =>{
    const id_team = req.params.id;
    const userId = req.user.id_user;
    const roles = req.user.roles;

    try{

        //To see if the team exists.
        const [teamRows] = await db.promise().query('SELECT id_team, id_club FROM teams WHERE id_team = ?',[id_team]);
        if (teamRows.length === 0) {
            return res.status(404).json({ error: 'Team not found' });
        }

        const team = teamRows[0];

        //View if the directive is from the same club.
        if (roles.includes('directivo')) {
            const [userClub] = await db.promise().query(
                'SELECT id_club FROM users WHERE id_user = ?',
                [userId]
            );

            if (userClub.length === 0 || userClub[0].id_club !== team.id_club) {
                return res.status(403).json({
                error: 'Access denied to this team'
                });
            }

            req.team = team;
            return next();
        }
        
        //View if the trainer is assign.
        if (roles.includes('entrenador')) {
            const [assigned] = await db.promise().query(
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

            if (assigned.length === 0) {
                return res.status(403).json({
                error: 'Access denied to this team'
                });
            }

            req.team = team;
            return next();
        }

        return res.status(403).json({
            error: 'Access denied'
        });

    }catch (error){
        console.error(error);
        res.status(500).json({error:'Server error'});
    }
}