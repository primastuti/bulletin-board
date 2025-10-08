// src/app.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');

dotenv.config();

// === Load environment variables ===
const { MONGO_URI, FRONTEND_URL, SESSION_SECRET } = process.env;

const app = express();

// === Middleware ===
app.use(express.json());
app.use(
  cors({
    origin: FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// === Session setup (for Passport) ===
app.use(
  session({
    secret: SESSION_SECRET || 'secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: MONGO_URI }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

// === Passport setup ===
require('./config/passport'); // <--- penting: inisialisasi strategi Google + Facebook
app.use(passport.initialize());
app.use(passport.session());

// === Routes ===
const postsRouter = require('./routes/posts');
const authRouter = require('./routes/auth'); // <-- tambahkan router auth di sini

app.use('/api/posts', postsRouter);
app.use('/auth', authRouter); // <-- aktifkan route auth (Google + Facebook)

// === Test route for current user ===
app.get('/api/users/me', (req, res) => {
  res.json({ user: req.user || null });
});

// === Root route ===
app.get('/', (req, res) => {
  res.json({ message: 'Backend running with MongoDB, Google & Facebook Auth!' });
});

// === MongoDB connection ===
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

module.exports = app;
