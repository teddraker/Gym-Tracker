const express = require('express');
const router = express.Router();
const { connectDB } = require('../db/mongodb');

// POST: Save or update user profile with body composition
router.post('/profile', async (req, res) => {
  try {
    const db = await connectDB();
    const { 
      userId, 
      weight, 
      height, 
      fatMass, 
      muscleMass,
      bodyFatPercentage,
      bmi,
      waist,
      chest,
      arms,
      thighs,
      age,
      gender,
      goalWeight,
      notes,
      customFields
    } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Calculate BMI if not provided
    let calculatedBMI = bmi;
    if (!calculatedBMI && weight && height) {
      const heightInMeters = height / 100;
      calculatedBMI = parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));
    }

    // Calculate body fat percentage if not provided
    let calculatedBFP = bodyFatPercentage;
    if (!calculatedBFP && fatMass && weight) {
      calculatedBFP = parseFloat(((fatMass / weight) * 100).toFixed(1));
    }

    const profileData = {
      userId,
      weight: weight ? parseFloat(weight) : null,
      height: height ? parseFloat(height) : null,
      fatMass: fatMass ? parseFloat(fatMass) : null,
      muscleMass: muscleMass ? parseFloat(muscleMass) : null,
      bodyFatPercentage: calculatedBFP,
      bmi: calculatedBMI,
      waist: waist ? parseFloat(waist) : null,
      chest: chest ? parseFloat(chest) : null,
      arms: arms ? parseFloat(arms) : null,
      thighs: thighs ? parseFloat(thighs) : null,
      age: age ? parseInt(age) : null,
      gender: gender || null,
      goalWeight: goalWeight ? parseFloat(goalWeight) : null,
      notes: notes || '',
      customFields: customFields || [],
      updatedAt: new Date(),
    };

    // Upsert: update if exists, insert if not
    const result = await db.collection('profiles').updateOne(
      { userId },
      { 
        $set: profileData,
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true }
    );

    res.json({ 
      success: true, 
      message: 'Profile updated successfully',
      profile: profileData
    });
  } catch (error) {
    console.error('Error saving profile:', error);
    res.status(500).json({ error: 'Failed to save profile' });
  }
});

// GET: Fetch user profile
router.get('/profile/:userId', async (req, res) => {
  try {
    const db = await connectDB();
    const { userId } = req.params;

    const profile = await db.collection('profiles').findOne({ userId });

    if (!profile) {
      return res.json({ 
        userId,
        weight: null,
        height: null,
        fatMass: null,
        muscleMass: null,
        bodyFatPercentage: null,
        bmi: null,
        waist: null,
        chest: null,
        arms: null,
        thighs: null,
        age: null,
        gender: null,
        goalWeight: null,
        notes: '',
        customFields: []
      });
    }

    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// GET: Fetch body composition history
router.get('/profile/:userId/history', async (req, res) => {
  try {
    const db = await connectDB();
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const history = await db.collection('bodyCompositionHistory')
      .find({ userId })
      .sort({ recordedAt: -1 })
      .limit(limit)
      .toArray();

    res.json(history);
  } catch (error) {
    console.error('Error fetching body composition history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// POST: Add body composition record to history
router.post('/profile/history', async (req, res) => {
  try {
    const db = await connectDB();
    const { 
      userId, 
      weight, 
      fatMass, 
      muscleMass,
      bodyFatPercentage,
      notes
    } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const record = {
      userId,
      weight: weight ? parseFloat(weight) : null,
      fatMass: fatMass ? parseFloat(fatMass) : null,
      muscleMass: muscleMass ? parseFloat(muscleMass) : null,
      bodyFatPercentage: bodyFatPercentage ? parseFloat(bodyFatPercentage) : null,
      notes: notes || '',
      recordedAt: new Date(),
    };

    const result = await db.collection('bodyCompositionHistory').insertOne(record);

    res.json({ 
      success: true, 
      message: 'Body composition record added',
      record: { ...record, _id: result.insertedId }
    });
  } catch (error) {
    console.error('Error adding body composition record:', error);
    res.status(500).json({ error: 'Failed to add record' });
  }
});

module.exports = router;
