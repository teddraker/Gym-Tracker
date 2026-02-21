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


app.post('/api/setup-database-indexes', async (req, res) => {
  if(process.env.SETUP_COMPLETED === 'true') {
    return res.status(410).json({error : 'Setup already completed'});
  }
  try {
    // Security: Check for a secret key
    const secret = req.headers['x-setup-secret'];
    if (secret !== process.env.SETUP_SECRET) {
      return res.status(403).json({ 
        error: 'Forbidden: Invalid setup secret' 
      });
    }

    const { connectDB } = require('./db/mongodb');
    const db = await connectDB();
    
    console.log('🔧 Starting database index setup...');
    
    // WORKOUT SETS INDEXES
    await db.collection('workoutSets').createIndex(
      { userId: 1, exerciseName: 1, createdAt: -1 },
      { name: 'userId_exerciseName_createdAt' }
    );
    console.log('✓ workoutSets: userId_exerciseName_createdAt');
    
    await db.collection('workoutSets').createIndex(
      { userId: 1, createdAt: -1 },
      { name: 'userId_createdAt' }
    );
    console.log('✓ workoutSets: userId_createdAt');
    
    await db.collection('workoutSets').createIndex(
      { exerciseName: 1, userId: 1, createdAt: -1 },
      { name: 'exerciseName_userId_createdAt' }
    );
    console.log('✓ workoutSets: exerciseName_userId_createdAt');
    
    await db.collection('workoutSets').createIndex(
      { userId: 1, createdAt: 1 },
      { name: 'userId_createdAt_asc' }
    );
    console.log('✓ workoutSets: userId_createdAt_asc');

    // DAY ROUTINES INDEXES
    await db.collection('dayRoutines').createIndex(
      { userId: 1, day: 1 },
      { name: 'userId_day', unique: true }
    );
    console.log('✓ dayRoutines: userId_day (unique)');
    
    await db.collection('dayRoutines').createIndex(
      { userId: 1 },
      { name: 'userId' }
    );
    console.log('✓ dayRoutines: userId');

    // CUSTOM EXERCISES INDEXES
    await db.collection('customExercises').createIndex(
      { name: 1 },
      { name: 'name', collation: { locale: 'en', strength: 2 } }
    );
    console.log('✓ customExercises: name (collation)');
    
    await db.collection('customExercises').createIndex(
      { muscle: 1 },
      { name: 'muscle' }
    );
    console.log('✓ customExercises: muscle');
    
    await db.collection('customExercises').createIndex(
      { name: 'text', muscle: 'text' },
      { name: 'text_search' }
    );
    console.log('✓ customExercises: text_search');

    // PROFILES INDEXES
    await db.collection('profiles').createIndex(
      { userId: 1 },
      { name: 'userId', unique: true }
    );
    console.log('✓ profiles: userId (unique)');

    // BODY COMPOSITION HISTORY INDEXES
    await db.collection('bodyCompositionHistory').createIndex(
      { userId: 1, recordedAt: -1 },
      { name: 'userId_recordedAt' }
    );
    console.log('✓ bodyCompositionHistory: userId_recordedAt');

    console.log('✅ All indexes created successfully!');

    res.json({
      success: true,
      message: 'Database indexes created successfully!',
      indexes: {
        workoutSets: 4,
        dayRoutines: 2,
        customExercises: 3,
        profiles: 1,
        bodyCompositionHistory: 1,
        total: 11
      }
    });

  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start server (0.0.0.0 needed for cloud deployment)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
