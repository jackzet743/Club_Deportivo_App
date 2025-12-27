# Sports Club Management API

REST API for managing sports clubs, teams and users in a multi-club environment.

This backend project is developed using Node.js, Express and MySQL.  
Authentication is implemented with JWT and authorization is based on user roles
(directivo, entrenador, jugador).

---

## Technologies

- Node.js
- Express
- MySQL
- JWT (Authentication & Authorization)
- bcrypt (Password hashing)

---

## Installation

```bash
git clone   https://github.com/jackzet743/Club_Deportivo_App.git
cd Backend
npm install
node app.js


## Authentification

This API uses JWT authentication.

To access protected routes, include the token in the request headers:

Authorization: Bearer <JWT_TOKEN>


## Roles

directivo → full management permissions

entrenador → team-related permissions

jugador → read-only access


## API Endpoints

POST /auth/login

    Authenticate a user and receive a JWT token.

    {
    "email": "user@email.com",
    "password": "password123"
    }


POST /clubs

    🔐 Authentication required
    👤 Role: directivo

    Create a new sports club.

    {
    "name_club": "Club Hockey Madrid",
    "city": "Madrid",
    "postal_code": "28001",
    "discipline": "Hockey Patines"
    }


POST /teams

    🔐 Authentication required
    👤 Role: directivo

    Create a team inside the authenticated user's club.

    {
    "category": "Senior A"
    }


GET /teams

    🔐 Authentication required

    Retrieve teams.
    Optional query parameters:

    club → filter by club ID


POST /users

    Create a new user.
    {
    "id_club": 1,
    "user_name": "Carlos",
    "surename1": "Sánchez",
    "DNI": "12345678A",
    "email": "carlos@email.com",
    "password": "password123",
    "birth_date": "2001-05-10"
    }


POST /user_team

    🔐 Authentication required
    👤 Role: directivo

    Assign a user to a team with a specific role.

    {
    "id_user": 12,
    "id_team": 3,
    "id_rol": 2
    }


Error Handling

    The API returns standard HTTP status codes:

    400 → Bad request or validation error

    401 → Unauthorized

    403 → Forbidden

    404 → Resource not found

    500 → Internal server error


Project Status

✔ JWT authentication
✔ Role-based authorization
✔ Clubs and teams management
✔ User-team relationships

🚧 GET /teams/:id/users (in progress)