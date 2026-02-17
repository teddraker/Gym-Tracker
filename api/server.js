require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const cors = require('cors');
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

// Routes
app.use('/api', workoutSetsRouter);
app.use('/api', dayRoutinesRouter);
app.use('/api', customExercisesRouter);
app.use('/api', exercisesRouter);
app.use('/api', profileRouter);
app.use('/api', aiRecommendRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Start server (0.0.0.0 needed for cloud deployment)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
