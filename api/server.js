require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const cors = require('cors');
const { performanceMiddleware } = require('./utils/performanceMonitor');
const workoutSetsRouter = require('./routes/workoutSets');
const dayRoutinesRouter = require('./routes/dayRoutines');
const customExercisesRouter = require('./routes/customExercises');
const exercisesRouter = require('./routes/exercises');
const profileRouter = require('./routes/profile');
const aiRecommendRouter = require('./routes/aiRecommend');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Performance monitoring (logs request duration)
if (process.env.NODE_ENV !== 'production') {
  app.use(performanceMiddleware);
}

// Routes
app.use('/api', workoutSetsRouter);
app.use('/api', dayRoutinesRouter);
app.use('/api', customExercisesRouter);
app.use('/api', exercisesRouter);
app.use('/api', profileRouter);
app.use('/api', aiRecommendRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Performance stats endpoint
app.get('/api/stats', async (req, res) => {
  const { connectDB } = require('./db/mongodb');
  try {
    const db = await connectDB();
    
    // Get collection stats
    const collections = ['workoutSets', 'dayRoutines', 'customExercises', 'profiles'];
    const stats = {};
    
    for (const collName of collections) {
      const count = await db.collection(collName).countDocuments();
      const indexes = await db.collection(collName).indexes();
      stats[collName] = {
        documents: count,
        indexes: indexes.length,
        indexNames: indexes.map(idx => idx.name)
      };
    }
    
    res.json({
      status: 'OK',
      database: 'connected',
      collections: stats,
      serverTime: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      error: error.message 
    });
  }
});

// Start server (0.0.0.0 needed for cloud deployment)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
