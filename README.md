# Altar Creation App

A React-based application for creating and managing digital altars with a Node.js/Express backend and MySQL database.

## Project Structure

```
project2/
├── backend/           # Node.js/Express backend
│   ├── config/       # Database configuration
│   ├── routes/       # API routes
│   ├── server.js     # Main server file
│   └── database.sql  # Database schema
└── my-app/           # React frontend
    ├── src/
    │   ├── components/
    │   └── services/ # API service functions
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up MySQL database:**
   - Open MySQL and run the schema from `database.sql`
   - Or use the command: `mysql -u root -p < database.sql`

4. **Environment Setup:**
   - Copy `env.example` to `.env` in the backend directory
   - Update the `.env` file with your database credentials and other settings
   - See `ENVIRONMENT_SETUP.md` for detailed instructions

5. **Start the backend server:**
   ```bash
   npm run dev
   ```
   The server will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd my-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   - Copy `env.example` to `.env` in the frontend directory
   - Update the `.env` file with your API URL and other settings
   - See `ENVIRONMENT_SETUP.md` for detailed instructions

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   The app will run on `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login

### Altar Management
- `POST /api/altar/save` - Save altar configuration
- `GET /api/altar/user/:userId` - Get user's altars
- `GET /api/altar/:altarId` - Get specific altar
- `PUT /api/altar/:altarId` - Update altar
- `DELETE /api/altar/:altarId` - Delete altar

## Features

- User authentication (signup/login)
- JWT token-based authentication
- Altar creation and management
- Secure password hashing
- MySQL database storage
- RESTful API design
- Environment-based configuration
- Email notifications
- Contact form functionality

## Technologies Used

### Backend
- Node.js
- Express.js
- MySQL2
- bcryptjs (password hashing)
- jsonwebtoken (JWT)
- cors (Cross-Origin Resource Sharing)

### Frontend
- React
- React Router DOM
- Fetch API for HTTP requests
- Local Storage for token management

## Development

- Backend runs on port 5000
- Frontend runs on port 5173
- CORS is configured to allow frontend-backend communication
- JWT tokens are stored in localStorage for authentication 