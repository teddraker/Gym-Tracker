const express = require('express');
const { connectDB } = require('../db/mongodb');

const router = express.Router();

// Helper function to calculate 1RM using Epley formula
const calculate1RM = (weight, reps) => {
  if (!weight || !reps || reps === 0) return 0;
  return Math.round(weight * (1 + reps / 30));
};

// Helper function to calculate volume
const calculateVolume = (weight, reps) => {
  if (!weight || !reps) return 0;
  return weight * reps;
};

// POST: Save a new workout set
router.post('/workoutSets', async (req, res) => {
  try {
    const db = await connectDB();
    const { exerciseName, weight, reps, notes, userId, day, rpe } = req.body;
    
    // Calculate metrics
    const volume = calculateVolume(parseFloat(weight), parseInt(reps));
    const estimated1RM = calculate1RM(parseFloat(weight), parseInt(reps));
    
    const workoutSet = {
      exerciseName,
      weight: parseFloat(weight),
      reps: parseInt(reps),
      notes,
      userId,
      day,
      rpe: rpe ? parseInt(rpe) : null, // Rate of Perceived Exertion (1-10)
      volume, // Weight × Reps
      estimated1RM, // Epley formula: Weight × (1 + Reps/30)
      createdAt: new Date(),
    };
    
    const result = await db.collection('workoutSets').insertOne(workoutSet);
    res.status(201).json({ 
      _id: result.insertedId, 
      ...workoutSet 
    });
  } catch (error) {
    console.error('Error saving workout set:', error);
    res.status(500).json({ error: 'Failed to save workout set' });
  }
});

// GET: Fetch all workout sets for an exercise
router.get('/workoutSets/:exerciseName', async (req, res) => {
  try {
    const db = await connectDB();
    const sets = await db.collection('workoutSets')
      .find({ exerciseName: req.params.exerciseName })
      .sort({ createdAt: -1 })
      .toArray();
    
    res.json(sets);
  } catch (error) {
    console.error('Error fetching workout sets:', error);
    res.status(500).json({ error: 'Failed to fetch workout sets' });
  }
});

// GET: Fetch all workout sets for a user
router.get('/user/:userId/workoutSets', async (req, res) => {
  try {
    const db = await connectDB();
    const sets = await db.collection('workoutSets')
      .find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .toArray();
    
    res.json(sets);
  } catch (error) {
    console.error('Error fetching user workout sets:', error);
    res.status(500).json({ error: 'Failed to fetch workout sets' });
  }
});

// GET: Fetch exercise history with progress metrics
router.get('/history/:exerciseName', async (req, res) => {
  try {
    const db = await connectDB();
    const { exerciseName } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const userId = req.query.userId || 'default_user';
    
    const decodedName = decodeURIComponent(exerciseName);
    console.log('Searching for exercise:', decodedName, 'userId:', userId);
    
    // Use case-insensitive regex search
    const sets = await db.collection('workoutSets')
      .find({ 
        exerciseName: { $regex: new RegExp(`^${decodedName}$`, 'i') },
        userId 
      })
      .sort({ createdAt: -1 })
      .limit(limit * 10) // Get more sets to group by session
      .toArray();
    
    console.log('Found sets:', sets.length);
    
    // Group sets by date (session)
    const sessionMap = new Map();
    sets.forEach(set => {
      const dateKey = new Date(set.createdAt).toDateString();
      if (!sessionMap.has(dateKey)) {
        sessionMap.set(dateKey, {
          date: set.createdAt,
          sets: [],
          maxWeight: 0,
          totalVolume: 0,
          max1RM: 0,
          avgRPE: 0,
        });
      }
      
      const session = sessionMap.get(dateKey);
      session.sets.push(set);
      session.maxWeight = Math.max(session.maxWeight, set.weight);
      session.totalVolume += set.volume;
      session.max1RM = Math.max(session.max1RM, set.estimated1RM);
      
      if (set.rpe) {
        session.avgRPE = (session.avgRPE * (session.sets.length - 1) + set.rpe) / session.sets.length;
      }
    });
    
    // Convert to array and limit sessions
    const sessions = Array.from(sessionMap.values())
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);
    
    res.json({
      exerciseName: decodeURIComponent(exerciseName),
      sessions,
      totalSessions: sessions.length,
    });
  } catch (error) {
    console.error('Error fetching exercise history:', error);
    res.status(500).json({ error: 'Failed to fetch exercise history' });
  }
});

// GET: Fetch workout consistency data (for heatmap)
router.get('/user/:userId/consistency', async (req, res) => {
  try {
    const db = await connectDB();
    const { userId } = req.params;
    const days = parseInt(req.query.days) || 90; // Default 90 days
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const sets = await db.collection('workoutSets')
      .find({ 
        userId,
        createdAt: { $gte: startDate }
      })
      .toArray();
    
    // Group by date
    const workoutDays = new Map();
    sets.forEach(set => {
      const dateKey = new Date(set.createdAt).toISOString().split('T')[0];
      if (!workoutDays.has(dateKey)) {
        workoutDays.set(dateKey, {
          date: dateKey,
          setCount: 0,
          exercises: new Set(),
        });
      }
      const day = workoutDays.get(dateKey);
      day.setCount++;
      day.exercises.add(set.exerciseName);
    });
    
    // Convert to array
    const consistency = Array.from(workoutDays.values()).map(day => ({
      date: day.date,
      setCount: day.setCount,
      exerciseCount: day.exercises.size,
    }));
    
    res.json(consistency);
  } catch (error) {
    console.error('Error fetching consistency data:', error);
    res.status(500).json({ error: 'Failed to fetch consistency data' });
  }
});

// GET: Fetch muscle split breakdown
router.get('/user/:userId/muscle-split', async (req, res) => {
  try {
    const db = await connectDB();
    const { userId } = req.params;
    const days = parseInt(req.query.days) || 30; // Default 30 days
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get all sets in the time period
    const sets = await db.collection('workoutSets')
      .find({ 
        userId,
        createdAt: { $gte: startDate }
      })
      .toArray();
    
    // Get exercise details to map to muscle groups
    const exerciseNames = [...new Set(sets.map(s => s.exerciseName))];
    const routines = await db.collection('dayRoutines')
      .find({ userId })
      .toArray();
    
    // Build exercise to muscle map
    const exerciseToMuscle = new Map();
    routines.forEach(routine => {
      routine.exercises?.forEach(ex => {
        exerciseToMuscle.set(ex.name, ex.muscle);
      });
    });
    
    // Count sets per muscle group
    const muscleSets = new Map();
    sets.forEach(set => {
      const muscle = exerciseToMuscle.get(set.exerciseName) || 'Unknown';
      muscleSets.set(muscle, (muscleSets.get(muscle) || 0) + 1);
    });
    
    // Convert to array and calculate percentages
    const totalSets = sets.length;
    const breakdown = Array.from(muscleSets.entries()).map(([muscle, count]) => ({
      muscle,
      sets: count,
      percentage: Math.round((count / totalSets) * 100),
    })).sort((a, b) => b.sets - a.sets);
    
    res.json({
      breakdown,
      totalSets,
      period: `${days} days`,
    });
  } catch (error) {
    console.error('Error fetching muscle split:', error);
    res.status(500).json({ error: 'Failed to fetch muscle split' });
  }
});

module.exports = router;
