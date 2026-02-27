const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Routes
const patientsRouter = require('./routes/patients');
const authRouter = require('./routes/auth');

app.use('/api/patients', patientsRouter);
app.use('/api/auth', authRouter);

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'MediVision Backend API Running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      patients: '/api/patients'
    }
  });
});

// MongoDB Connection
const connectWithRetry = (retries = 5, delayMs = 5000) => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error('❌ MONGO_URI is not set in environment variables');
    process.exit(1);
  }

  const connectOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  };

  const attemptConnection = (remainingRetries) => {
    mongoose.connect(mongoUri, connectOptions)
      .then(() => {
        console.log('✅ MongoDB connected successfully');

        // Start server
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
          console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
      })
      .catch((err) => {
        console.error('❌ MongoDB connection error:', err.message);

        if (remainingRetries <= 0) {
          console.error('❌ All MongoDB connection retries exhausted. Exiting.');
          console.log('💡 Make sure MongoDB is running and accessible from this application.');
          process.exit(1);
        }

        console.log(`⏳ Retrying MongoDB connection in ${delayMs / 1000} seconds... (${remainingRetries} retries left)`);
        setTimeout(() => attemptConnection(remainingRetries - 1), delayMs);
      });
  };

  attemptConnection(retries);
};

connectWithRetry();
// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});
