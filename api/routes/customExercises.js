const express = require('express');
const { connectDB } = require('../db/mongodb');
const { ObjectId } = require('mongodb');

const router = express.Router();

// GET: Fetch all custom exercises
router.get('/customExercises', async (req, res) => {
  try {
    const db = await connectDB();
    const { name, muscle, type, difficulty } = req.query;
    
    const filter = {};
    if (name) filter.name = { $regex: name, $options: 'i' };
    if (muscle) filter.muscle = { $regex: muscle, $options: 'i' };
    if (type) filter.type = { $regex: type, $options: 'i' };
    if (difficulty) filter.difficulty = { $regex: difficulty, $options: 'i' };
    
    const exercises = await db.collection('customExercises')
      .find(filter)
      .sort({ name: 1 })
      .toArray();
    
    const transformedExercises = exercises.map(exercise => ({
      _id: exercise._id.toString(),
      name: exercise.name,
      muscle: exercise.muscle,
      equipments: exercise.equipments || [],
      difficulty: exercise.difficulty,
      instructions: exercise.instructions,
      type: exercise.type,
      isCustom: true,
    }));
    
    res.json(transformedExercises);
  } catch (error) {
    console.error('Error fetching custom exercises:', error);
    res.status(500).json({ error: 'Failed to fetch custom exercises' });
  }
});

// GET: Fetch single custom exercise by name
router.get('/customExercises/:name', async (req, res) => {
  try {
    const db = await connectDB();
    const exercise = await db.collection('customExercises')
      .findOne({ name: { $regex: `^${req.params.name}$`, $options: 'i' } });
    
    if (!exercise) {
      return res.status(404).json({ error: 'Custom exercise not found' });
    }
    
    res.json({
      _id: exercise._id.toString(),
      name: exercise.name,
      muscle: exercise.muscle,
      equipments: exercise.equipments || [],
      difficulty: exercise.difficulty,
      instructions: exercise.instructions,
      type: exercise.type,
      isCustom: true,
    });
  } catch (error) {
    console.error('Error fetching custom exercise:', error);
    res.status(500).json({ error: 'Failed to fetch custom exercise' });
  }
});

// POST: Create a new custom exercise
router.post('/customExercises', async (req, res) => {
  try {
    const db = await connectDB();
    const { name, muscle, equipments, difficulty, instructions, type } = req.body;
    
    if (!name || !muscle) {
      return res.status(400).json({ error: 'Name and muscle are required' });
    }
    
    const existingExercise = await db.collection('customExercises')
      .findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
    
    if (existingExercise) {
      return res.status(409).json({ error: 'Exercise with this name already exists' });
    }
    
    const customExercise = {
      name,
      muscle: muscle.toLowerCase(),
      equipments: equipments || [],
      difficulty: difficulty || 'beginner',
      instructions: instructions || '',
      type: type || 'strength',
      createdAt: new Date(),
    };
    
    const result = await db.collection('customExercises').insertOne(customExercise);
    
    res.status(201).json({
      _id: result.insertedId.toString(),
      ...customExercise,
      isCustom: true,
    });
  } catch (error) {
    console.error('Error creating custom exercise:', error);
    res.status(500).json({ error: 'Failed to create custom exercise' });
  }
});

// PUT: Update a custom exercise
router.put('/customExercises/:id', async (req, res) => {
  try {
    const db = await connectDB();
    const { name, muscle, equipments, difficulty, instructions, type } = req.body;
    
    const updateData = { updatedAt: new Date() };
    if (name) updateData.name = name;
    if (muscle) updateData.muscle = muscle.toLowerCase();
    if (equipments) updateData.equipments = equipments;
    if (difficulty) updateData.difficulty = difficulty;
    if (instructions !== undefined) updateData.instructions = instructions;
    if (type) updateData.type = type;
    
    const result = await db.collection('customExercises').findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    
    if (!result) {
      return res.status(404).json({ error: 'Custom exercise not found' });
    }
    
    res.json({
      _id: result._id.toString(),
      name: result.name,
      muscle: result.muscle,
      equipments: result.equipments || [],
      difficulty: result.difficulty,
      instructions: result.instructions,
      type: result.type,
      isCustom: true,
    });
  } catch (error) {
    console.error('Error updating custom exercise:', error);
    res.status(500).json({ error: 'Failed to update custom exercise' });
  }
});

// DELETE: Delete a custom exercise
router.delete('/customExercises/:id', async (req, res) => {
  try {
    const db = await connectDB();
    const result = await db.collection('customExercises').deleteOne({
      _id: new ObjectId(req.params.id)
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Custom exercise not found' });
    }
    
    res.json({ message: 'Custom exercise deleted successfully' });
  } catch (error) {
    console.error('Error deleting custom exercise:', error);
    res.status(500).json({ error: 'Failed to delete custom exercise' });
  }
});

module.exports = router;
