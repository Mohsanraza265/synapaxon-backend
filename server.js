// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const passport = require('./config/passport');
const config = require('./config/config');
const connectDB = require('./config/db');
const errorHandler = require('./utils/errorHandler');
const resetLimitIa = require('./utils/resetAiUsage');


// Import routes
const authRoutes = require('./routes/auth');
const questionRoutes = require('./routes/questions');
const testRoutes = require('./routes/tests');
const uploadRoutes = require('./routes/uploads');
const studentQuestionRoutes = require('./routes/studentQuestions');
const apiAiRoutes = require('./routes/aiRoutes')
const app = express();

// Connect to database
connectDB();

// Middleware
const corsOptions = {
  origin: [
    'https://synapaxon-frontend.onrender.com',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8000',
    'https://synapaxon.com',
    'https://synapaxon-backend.onrender.com',
    'https://synapaxon-frontend-main.vercel.app',
    'https://synapaxon-backend-main.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false, // Importante para Vercel
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(passport.initialize());
require('./config/passport'); // Load Passport configuration

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/student-questions', studentQuestionRoutes);
app.use('/api/ai',apiAiRoutes)
app.use(errorHandler);

const PORT = config.PORT || 9000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app; // For testing purposes