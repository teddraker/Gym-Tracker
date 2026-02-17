const express = require('express');
const { connectDB } = require('../db/mongodb');
const { ObjectId } = require('mongodb');

const router = express.Router();

// GET: Fetch all day routines for a user
router.get('/dayRoutines/:userId', async (req, res) => {
  try {
    const db = await connectDB();
    const routines = await db.collection('dayRoutines')
      .find({ userId: req.params.userId })
      .toArray();
    
    res.json(routines);
  } catch (error) {
    console.error('Error fetching day routines:', error);
    res.status(500).json({ error: 'Failed to fetch day routines' });
  }
});

// GET: Fetch routine for a specific day
router.get('/dayRoutines/:userId/:day', async (req, res) => {
  try {
    const db = await connectDB();
    const routine = await db.collection('dayRoutines')
      .findOne({ 
        userId: req.params.userId,
        day: req.params.day.toLowerCase()
      });
    
    if (!routine) {
      return res.json({ 
        userId: req.params.userId, 
        day: req.params.day.toLowerCase(), 
        exercises: [] 
      });
    }
    
    res.json(routine);
  } catch (error) {
    console.error('Error fetching day routine:', error);
    res.status(500).json({ error: 'Failed to fetch day routine' });
  }
});

// POST: Add exercise to a day routine
router.post('/dayRoutines/:userId/:day/exercises', async (req, res) => {
  try {
    const db = await connectDB();
    const { exercise } = req.body;
    const day = req.params.day.toLowerCase();
    const userId = req.params.userId;
    
    const result = await db.collection('dayRoutines').updateOne(
      { userId, day },
      { 
        $push: { exercises: exercise },
        $setOnInsert: { createdAt: new Date() },
        $set: { updatedAt: new Date() }
      },
      { upsert: true }
    );
    
    const updatedRoutine = await db.collection('dayRoutines')
      .findOne({ userId, day });
    
    res.status(201).json(updatedRoutine);
  } catch (error) {
    console.error('Error adding exercise to day routine:', error);
    res.status(500).json({ error: 'Failed to add exercise to day routine' });
  }
});

// DELETE: Remove exercise from a day routine
router.delete('/dayRoutines/:userId/:day/exercises/:exerciseName', async (req, res) => {
  try {
    const db = await connectDB();
    const day = req.params.day.toLowerCase();
    const userId = req.params.userId;
    const exerciseName = decodeURIComponent(req.params.exerciseName);
    
    await db.collection('dayRoutines').updateOne(
      { userId, day },
      { 
        $pull: { exercises: { name: exerciseName } },
        $set: { updatedAt: new Date() }
      }
    );
    
    const updatedRoutine = await db.collection('dayRoutines')
      .findOne({ userId, day });
    
    res.json(updatedRoutine || { userId, day, exercises: [] });
  } catch (error) {
    console.error('Error removing exercise from day routine:', error);
    res.status(500).json({ error: 'Failed to remove exercise from day routine' });
  }
});

// PUT: Update exercise order for a day routine
router.put('/dayRoutines/:userId/:day/order', async (req, res) => {
  try {
    const db = await connectDB();
    const day = req.params.day.toLowerCase();
    const userId = req.params.userId;
    const { exercises } = req.body;
    
    if (!exercises || !Array.isArray(exercises)) {
      return res.status(400).json({ error: 'Invalid exercises array' });
    }
    
    const result = await db.collection('dayRoutines').updateOne(
      { userId, day },
      { 
        $set: { 
          exercises: exercises,
          updatedAt: new Date() 
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Day routine not found' });
    }
    
    const updatedRoutine = await db.collection('dayRoutines')
      .findOne({ userId, day });
    
    res.json(updatedRoutine);
  } catch (error) {
    console.error('Error updating exercise order:', error);
    res.status(500).json({ error: 'Failed to update exercise order' });
  }
});

module.exports = router;
