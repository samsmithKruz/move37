# Move37 Real-Time Polling API

A backend service for a real-time polling application built as part of the **Move37 Ventures Backend Developer Challenge**.  
This project demonstrates modern backend practices including **RESTful APIs**, **PostgreSQL with Prisma ORM**, and **WebSockets for live updates**.



## 🚀 Features

- **User Management**
  - Sign up, login (JWT-based authentication)
  - Update profile, change password, delete account
  - Fetch user with polls and votes

- **Poll Management**
  - Create, update, delete, and fetch polls
  - Add poll options
  - Publish/unpublish polls

- **Voting System**
  - Cast votes on poll options
  - Retrieve poll results
  - Real-time vote updates via WebSockets

- **API Documentation**
  - Integrated Swagger UI (`/api-docs`)

---

## 🛠️ Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/) with [Express.js](https://expressjs.com/)  
- **Database**: [PostgreSQL](https://www.postgresql.org/)  
- **ORM**: [Prisma](https://www.prisma.io/)  
- **Authentication**: JWT (JSON Web Token)  
- **Validation**: [Joi](https://joi.dev/)  
- **Security**: Helmet, CORS, Bcrypt  
- **Real-Time**: [ws](https://github.com/websockets/ws) WebSocket server  
- **Documentation**: Swagger (swagger-jsdoc + swagger-ui-express)  

---

## 📂 Project Structure

```bash
.
├── nodemon.json
├── package.json
├── prisma/               # Prisma schema and migrations
│   ├── schema.prisma
│   └── migrations/
├── server.js             # Entry point
├── src/
│   ├── app.js            # Express app configuration
│   ├── config/           # DB + WebSocket setup
│   ├── controllers/      # Request handlers
│   ├── docs/             # Swagger configuration
│   ├── middlewares/      # Auth, validation, error handling
│   ├── models/           # Database models (Prisma wrappers/BaseModel)
│   ├── routes/           # API route definitions
│   ├── services/         # Business logic
│   └── utils/            # Helpers, constants
└── tests/                # Unit and integration tests
````

---

## ⚙️ Setup & Installation

### 1️⃣ Clone the repository

```bash
git clone https://github.com/<your-username>/move37-polling-api.git
cd move37-polling-api
```

### 2️⃣ Install dependencies

```bash
npm install
```

### 3️⃣ Setup environment variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/move37db"
JWT_SECRET="your_jwt_secret"
JWT_EXPIRES_IN="7d"
PORT=3000
```

> Tip: The project auto-copies `.env.example` (if present) into `.env` after install via the `copy:env` script.

### 4️⃣ Database setup

Run Prisma migrations and generate client:

```bash
npm run db:migrate
npm run db:generate
```

(Optional) Open Prisma Studio to explore the DB:

```bash
npm run db:studio
```

### 5️⃣ Start the server

Development (with nodemon):

```bash
npm run dev
```

Production:

```bash
npm start
```

The API should now be running at:
👉 `http://localhost:3000`

Swagger Docs available at:
👉 `http://localhost:3000/api-docs`


## 🔑 Authentication

All protected routes use **JWT Bearer Tokens**.

* On successful signup/login, the API returns a token.
* Include it in requests as:

```http
Authorization: Bearer <your_token_here>
```


## 📡 WebSockets

The WebSocket server runs alongside Express.
Clients can connect and subscribe to polls for **real-time vote updates**:

```js
const socket = new WebSocket("ws://localhost:3000");

socket.onopen = () => {
  socket.send(JSON.stringify({ type: "subscribe", pollId: "123" }));
};

socket.onmessage = (event) => {
  console.log("Live update:", JSON.parse(event.data));
};
```


## 🧪 Testing

Tests are organized under the `tests/` folder (unit + integration).
Run tests (once implemented) with:

```bash
npm test
```


## 📖 API Endpoints

### Users

* `POST /users` – Create user (sign up)
* `POST /users/login` – Login and get JWT
* `GET /users` – Get all users (auth required)
* `GET /users/{id}` – Get user by ID
* `PUT /users/{id}` – Update user (auth required)
* `PATCH /users/{id}/password` – Change password
* `DELETE /users/{id}` – Delete user
* `GET /users/{id}/polls` – Get user with polls
* `GET /users/{id}/votes` – Get user with votes

### Polls

* `POST /polls` – Create a poll
* `GET /polls` – List polls
* `GET /polls/{id}` – Get poll details
* `PUT /polls/{id}` – Update poll
* `DELETE /polls/{id}` – Delete poll
* `POST /polls/{id}/options` – Add options to poll

### Votes

* `POST /votes` – Cast a vote
* `GET /votes` – List votes (admin/debug)
* `GET /polls/{id}/results` – Get poll results (real-time via WS)

---

## 📝 License

This project is licensed under the [MIT License](LICENSE).



## 👤 Author

**Samuel Benny**  
🔗 [LinkedIn](https://linkedin.com/in/smithkruz)  
💻 [GitHub](https://github.com/samsmithkruz)
