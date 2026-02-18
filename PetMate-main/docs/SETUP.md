# PetMate - Setup Instructions

## Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Git

## Backend Setup

1. Navigate to server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update .env with your configurations:
- MongoDB connection string
- JWT secret key
- Cloudinary credentials (for image uploads)

5. Start the server:
```bash
npm run dev
```

## Frontend Setup

1. Navigate to client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

## Features Implemented

### ✅ MVP Core Features
- User registration/login with JWT authentication
- User profiles with location and contact preferences
- Pet profiles with comprehensive details
- Basic project structure for search & filtering
- Match/Interest system foundation
- Chat system models
- Safety features (verification, reporting)

### 🚧 Next Steps
1. Complete pet registration form
2. Implement search & filtering
3. Build match/interest system
4. Create chat interface
5. Add image upload functionality
6. Implement admin panel

### 📁 Project Structure
```
petmate/
├── client/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   └── utils/
├── server/          # Node.js backend
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── controllers/
└── docs/           # Documentation
```

## API Endpoints

### Authentication
- POST /api/auth/register - User registration
- POST /api/auth/login - User login

### Users
- GET /api/users/profile - Get user profile
- PUT /api/users/profile - Update user profile

### Pets
- POST /api/pets - Create pet profile
- GET /api/pets - Get all pets (with filters)
- GET /api/pets/:id - Get specific pet
- PUT /api/pets/:id - Update pet profile

### Matches
- POST /api/matches/interest - Send interest
- GET /api/matches - Get user matches
- PUT /api/matches/:id - Accept/reject interest

### Chat
- GET /api/chat - Get user chats
- POST /api/chat/message - Send message
