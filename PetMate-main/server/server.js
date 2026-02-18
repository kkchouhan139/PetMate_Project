const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const jwt = require('jsonwebtoken');
const logger = require('./utils/logger');
const User = require('./models/User');
const Pet = require('./models/Pet');
const Match = require('./models/Match');
const Chat = require('./models/Chat');
const Report = require('./models/Report');
const OTP = require('./models/OTP');
const PasswordReset = require('./models/PasswordReset');

dotenv.config();

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

const requiredEnv = ['JWT_SECRET', 'MONGODB_URI'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length && process.env.NODE_ENV === 'production') {
  console.error(`Missing required env vars: ${missingEnv.join(', ')}`);
  process.exit(1);
}

const allowedOrigins = [
  process.env.CLIENT_URL,
  ...(process.env.CLIENT_URLS ? process.env.CLIENT_URLS.split(',').map((o) => o.trim()) : [])
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
};

const helmetConfig = process.env.NODE_ENV === 'production'
  ? {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", 'https:', 'data:'],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          connectSrc: ["'self'", 'https:', 'ws:', 'wss:', ...allowedOrigins],
          fontSrc: ["'self'", 'https:', 'data:'],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          frameAncestors: ["'none'"]
        }
      }
    }
  : {};

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins.length ? allowedOrigins : ["https://petmateproject.vercel.app"],
    methods: ["GET", "POST"]
  }
});
app.get("/", (req, res) => {
  res.send("🚀 PetMate Backend is running");
});

// Middleware
app.use(cors(corsOptions));
app.use(helmet(helmetConfig));
app.use(mongoSanitize());
app.use(hpp());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});

const actionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false
});

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false
});

// Routes
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/users', actionLimiter, require('./routes/users'));
app.use('/api/pets', actionLimiter, require('./routes/pets'));
app.use('/api/matches', actionLimiter, require('./routes/matches'));
app.use('/api/jobs', actionLimiter, require('./routes/jobs'));
app.use('/api/chat', chatLimiter, require('./routes/chat'));
app.use('/api/reports', actionLimiter, require('./routes/reports'));
app.use('/api/admin', actionLimiter, require('./routes/admin'));

// Socket.io for real-time chat
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token
      || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token || !process.env.JWT_SECRET) {
      return next(new Error('Unauthorized'));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    if (!user || user.isBanned || user.deletedAt) {
      return next(new Error('Unauthorized'));
    }
    socket.user = user;
    return next();
  } catch (error) {
    return next(new Error('Unauthorized'));
  }
});

io.on('connection', (socket) => {
  logger.info('User connected', socket.id);
  
  socket.on('join-chat', async (chatId) => {
    try {
      if (!socket.user) return;
      const chat = await Chat.findById(chatId).select('participants');
      if (!chat) return;
      const isParticipant = chat.participants.some((p) => p.toString() === socket.user._id.toString());
      if (!isParticipant) return;
      socket.join(chatId);
    } catch (error) {
      // Ignore invalid join attempts
    }
  });
  
  socket.on('send-message', (data) => {
    if (socket.rooms.has(data.chatId)) {
      socket.to(data.chatId).emit('receive-message', data);
    }
  });
  
  socket.on('disconnect', () => {
    logger.info('User disconnected', socket.id);
  });
});

const purgeDeletedUsers = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return;
    }
    const now = new Date();
    const usersToDelete = await User.find({
      deletedAt: { $lte: now }
    }).select('_id email');

    if (usersToDelete.length === 0) {
      return;
    }

    const userIds = usersToDelete.map((u) => u._id);
    const emails = usersToDelete.map((u) => u.email);
    const pets = await Pet.find({ owner: { $in: userIds } }).select('_id');
    const petIds = pets.map((p) => p._id);

    await Promise.all([
      Pet.deleteMany({ owner: { $in: userIds } }),
      Match.deleteMany({ $or: [{ pet1: { $in: petIds } }, { pet2: { $in: petIds } }] }),
      Chat.deleteMany({ participants: { $in: userIds } }),
      Report.deleteMany({ $or: [{ reporter: { $in: userIds } }, { reportedUser: { $in: userIds } }, { reportedPet: { $in: petIds } }] }),
      OTP.deleteMany({ email: { $in: emails } }),
      PasswordReset.deleteMany({ email: { $in: emails } })
    ]);

    await User.deleteMany({ _id: { $in: userIds } });
  } catch (error) {
    logger.error('Purge deleted users error', error?.message || error);
  }
};

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/petmate-matches')
  .then(() => {
    logger.info('MongoDB connected');
    // Run purge job once on startup and every 12 hours
    purgeDeletedUsers();
    setInterval(purgeDeletedUsers, 12 * 60 * 60 * 1000);
  })
  .catch(err => logger.error('MongoDB connection error', err?.message || err));

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  if (err && err.name === 'MulterError') {
    return res.status(400).json({ message: err.message });
  }
  if (err && err.message === 'Only image files are allowed') {
    return res.status(400).json({ message: err.message });
  }
  const status = err.statusCode || 500;
  const message = status >= 500 ? 'Server error' : err.message;
  res.status(status).json({ message });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

