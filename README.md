# Move37 Real-Time Polling API

A backend service for a real-time polling application built as part of the **Move37 Ventures Backend Developer Challenge**.  
This project demonstrates modern backend practices including **RESTful APIs**, **PostgreSQL with Prisma ORM**, and **WebSockets for live updates**.

## 🚀 Features

- **User Management**
  - User registration and authentication (JWT-based)
  - Complete CRUD operations for user profiles
  - Password management with secure hashing
  - Fetch user polls and voting history

- **Poll Management**
  - Create, read, update, and delete polls
  - Add, update, and delete poll options
  - Publish/unpublish polls
  - Pagination and filtering support

- **Real-Time Voting System**
  - Cast votes on poll options
  - Prevent duplicate voting
  - Real-time results via WebSocket updates
  - Vote retraction within time limits

- **Comprehensive API Documentation**
  - Interactive Swagger UI at `/api-docs`
  - Detailed request/response schemas
  - Authentication examples

- **Security & Reliability**
  - JWT authentication with protected routes
  - Input validation with Joi
  - CORS, Helmet, and rate limiting
  - Database connection health checks
  - Graceful shutdown handling

- **Real-Time WebSocket Support**
  - Live poll results broadcasting
  - Client subscription management
  - Connection statistics monitoring

---

## 🛠️ Tech Stack

- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Joi schema validation
- **Security**: Helmet, CORS, bcryptjs
- **Real-Time**: WebSocket (ws library)
- **Documentation**: Swagger with swagger-jsdoc
- **Logging**: Morgan HTTP logger
- **Development**: Nodemon for hot reloading

---

## 📂 Project Structure

```
move37-polling-api/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── src/
│   ├── app.js                 # Express application setup
│   ├── config/
│   │   ├── database.js        # Database configuration
│   │   └── websocket.js       # WebSocket configuration
│   ├── controllers/           # Route controllers
│   │   ├── userController.js
│   │   ├── pollController.js
│   │   └── voteController.js
│   ├── docs/
│   │   └── swagger.js         # Swagger documentation
│   ├── middlewares/
│   │   ├── auth.js            # Authentication middleware
│   │   ├── errorHandler.js    # Error handling
│   │   └── validations.js     # Validation middleware
│   ├── models/                # Database models
│   │   ├── BaseModel.js       # Base model class
│   │   ├── User.js
│   │   ├── Poll.js
│   │   ├── PollOption.js
│   │   ├── Vote.js
│   │   └── index.js
│   ├── routes/                # API routes
│   │   ├── userRoutes.js
│   │   ├── pollRoutes.js
│   │   └── voteRoutes.js
│   ├── services/              # Business logic
│   │   ├── userService.js
│   │   ├── pollService.js
│   │   ├── voteService.js
│   │   └── websocketService.js
│   └── validations/           # Validation schemas
│       ├── userValidation.js
│       └── pollValidation.js
├── server.js                  # Application entry point
├── package.json
└── README.md
```

---

## ⚙️ Setup & Installation

### 1. Clone the repository
```bash
https://github.com/samsmithKruz/move37.git
cd move37
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment configuration
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/move37db"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV=development
```
> Tip: The project auto-copies `.env.example` (if present) into `.env` after install via the `copy:env` script.

### 4. Database setup
```bash
# Run database migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate

# (Optional) Open Prisma Studio to explore data
npm run db:studio
```

### 5. Start the application
```bash
# Development mode with hot reload
npm run dev

# Production mode
npm start
```

The application will be available at `http://localhost:3000`

---

## 📖 API Documentation

### Interactive Documentation
Visit `/api-docs` in your browser for complete interactive API documentation with Swagger UI.

### Health Check
```http
GET /health
```
Returns server status and database connection health.

### WebSocket Statistics
```http
GET /api/websocket-stats
```
Returns real-time WebSocket connection statistics.

---

## 🔐 Authentication

All protected routes require JWT authentication. Include the token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### Authentication Endpoints:
- `POST /api/users` - User registration
- `POST /api/users/login` - User login (returns JWT token)

---

## 📡 WebSocket Integration

### Connecting to WebSocket
```javascript
const ws = new WebSocket('ws://localhost:3000');

ws.onopen = () => {
  // Subscribe to poll updates
  ws.send(JSON.stringify({
    type: 'subscribe_to_poll',
    pollId: 'your-poll-id'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Real-time update:', data);
};
```

### WebSocket Message Types
- `subscribe_to_poll` - Subscribe to poll updates
- `unsubscribe_from_poll` - Unsubscribe from poll
- `ping` - Heartbeat check (responds with `pong`)
- `poll_update` - Real-time vote updates

---

## 🗂️ API Endpoints

### Users (`/api/users`)
- `POST /` - Create new user
- `POST /login` - User login
- `GET /` - Get all users (protected)
- `GET /me` - Get current user profile
- `GET /:id` - Get user by ID
- `PUT /:id` - Update user
- `PATCH /:id/password` - Change password
- `DELETE /:id` - Delete user
- `GET /:id/polls` - Get user's polls
- `GET /:id/votes` - Get user's votes

### Polls (`/api/polls`)
- `GET /` - Get all published polls (public)
- `POST /` - Create new poll (protected)
- `GET /:id` - Get poll details (public)
- `GET /:id/results` - Get poll results (public)
- `PUT /:id` - Update poll (protected)
- `DELETE /:id` - Delete poll (protected)
- `PATCH /:id/publish` - Publish poll (protected)
- `PATCH /:id/unpublish` - Unpublish poll (protected)
- `GET /:id/has-voted` - Check if user voted (protected)
- `GET /:id/my-vote` - Get user's vote (protected)
- `GET /user/:userId` - Get user's polls (protected)
- `POST /:pollId/options` - Add poll option (protected)
- `GET /:pollId/options` - Get poll options (public)
- `GET /:pollId/options/:optionId` - Get specific option (public)
- `PUT /:pollId/options/:optionId` - Update option (protected)
- `DELETE /:pollId/options/:optionId` - Delete option (protected)
- `POST /:pollId/vote/:optionId` - Cast vote (protected)

### Votes (`/api/votes`)
- `POST /polls/:pollId` - Cast vote (protected)
- `GET /polls/:pollId/my-vote` - Get user's vote (protected)
- `GET /polls/:pollId/has-voted` - Check if voted (protected)
- `DELETE /:voteId` - Retract vote (protected)
- `GET /polls/:pollId` - Get poll votes (admin/creator)
- `GET /options/:optionId` - Get option votes (admin/creator)
- `GET /polls/:pollId/statistics` - Get voting statistics (admin/creator)

---


## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```


## 📊 Database Schema

The application uses PostgreSQL with the following relationships:
<img width="1424" height="906" alt="Untitled-dbdiagram-io-09-18-2025_07_53_PM" src="https://github.com/user-attachments/assets/3f6483ee-659e-4442-8bb1-387ca1285281" />

- **Users** → **Polls** (One-to-Many)
- **Polls** → **PollOptions** (One-to-Many) 
- **Users** ↔ **PollOptions** (Many-to-Many via Votes table)
- **Votes** table tracks user votes with unique constraints

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Samuel Benny**  
🔗 [LinkedIn](https://linkedin.com/in/smithkruz)  
💻 [GitHub](https://github.com/samsmithkruz)

---

## 🙏 Acknowledgments

- Move37 Ventures for the backend challenge opportunity
- Express.js team for the excellent web framework
- Prisma team for the fantastic ORM
- WebSocket community for real-time communication standards

---

## 📞 Support

For support, please open an issue in the GitHub repository or contact the development team.

---

*Built with ❤️ using Node.js, Express, PostgreSQL, and WebSockets*
