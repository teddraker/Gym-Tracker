const express = require('express');
const { connectDB } = require('../db/mongodb');

const router = express.Router();

const EXERCISEDB_BASE = 'https://www.exercisedb.dev/api/v1';

// In-memory cache for ExerciseDB API responses
const exerciseDBCache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function getCached(key) {
  const cached = exerciseDBCache.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }
  exerciseDBCache.delete(key);
  return null;
}

function setCache(key, data, ttl = CACHE_TTL) {
  exerciseDBCache.set(key, {
    data,
    expiresAt: Date.now() + ttl
  });
}

// Helper: Transform ExerciseDB response to our app's format
function transformExerciseDB(exercise) {
  return {
    _id: exercise.exerciseId || exercise.name.replace(/\s+/g, '_').toLowerCase(),
    name: exercise.name,
    muscle: exercise.targetMuscles?.[0] || '',
    equipments: exercise.equipments || [],
    difficulty: null,
    instructions: Array.isArray(exercise.instructions) ? exercise.instructions.join(' ') : (exercise.instructions || ''),
    type: exercise.bodyParts?.[0] || 'strength',
    gifUrl: exercise.gifUrl || null,
    secondaryMuscles: exercise.secondaryMuscles || [],
    bodyParts: exercise.bodyParts || [],
    isCustom: false,
  };
}

// Helper: Transform custom exercise from MongoDB
function transformCustomExercise(exercise) {
  return {
    _id: exercise._id.toString(),
    name: exercise.name,
    muscle: exercise.muscle,
    equipments: exercise.equipments || [],
    difficulty: exercise.difficulty,
    instructions: exercise.instructions,
    type: exercise.type,
    isCustom: true,
  };
}

// GET: Search exercises using ExerciseDB fuzzy search + custom exercises
// NOTE: This route MUST come before /exercises/:name to avoid route conflicts
router.get('/exercises/search/:query', async (req, res) => {
  try {
    const query = req.params.query;
    const cacheKey = `search:${query}`;

    // Check cache first
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // ExerciseDB fuzzy search (searches name, muscles, equipment, body parts)
    const exerciseDBPromise = fetch(
      `${EXERCISEDB_BASE}/exercises/search?q=${encodeURIComponent(query)}&limit=25&offset=0`
    ).then(r => r.ok ? r.json() : { data: [] })
      .catch(() => ({ data: [] }));

    // Custom exercises from MongoDB
    const db = await connectDB();
    const customPromise = db.collection('customExercises')
      .find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { muscle: { $regex: query, $options: 'i' } },
        ]
      })
      .toArray();

    const [exerciseDBResult, customExercises] = await Promise.all([exerciseDBPromise, customPromise]);

    const transformedAPI = (exerciseDBResult.data || []).map(transformExerciseDB);
    const transformedCustom = customExercises.map(transformCustomExercise);

    // Custom first, then API, deduplicate by name
    const all = [...transformedCustom, ...transformedAPI];
    const unique = all.filter((exercise, index, self) =>
      index === self.findIndex(e => e.name.toLowerCase() === exercise.name.toLowerCase())
    );

    // Cache the result
    setCache(cacheKey, unique);

    res.json(unique);
  } catch (error) {
    console.error('Error searching exercises:', error);
    res.status(500).json({ error: 'Failed to search exercises' });
  }
});

// GET: All exercises (ExerciseDB + custom combined)
// NOTE: This route MUST come before /exercises/:name to avoid route conflicts
router.get('/exercises/all', async (req, res) => {
  try {
    const exerciseDBPromise = fetch(
      `${EXERCISEDB_BASE}/exercises?limit=25&offset=0&sortBy=name&sortOrder=asc`
    ).then(r => r.ok ? r.json() : { data: [] })
      .catch(() => ({ data: [] }));

    const db = await connectDB();
    const customPromise = db.collection('customExercises')
      .find({}).sort({ name: 1 }).toArray();

    const [exerciseDBResult, customExercises] = await Promise.all([exerciseDBPromise, customPromise]);

    const transformedAPI = (exerciseDBResult.data || []).map(transformExerciseDB);
    const transformedCustom = customExercises.map(transformCustomExercise);

    const all = [...transformedCustom, ...transformedAPI];
    res.json(all);
  } catch (error) {
    console.error('Error fetching all exercises:', error);
    res.status(500).json({ error: 'Failed to fetch exercises' });
  }
});

// GET: Filter exercises by query params
router.get('/exercises', async (req, res) => {
  try {
    const { name, muscle, type, difficulty } = req.query;

    // Build ExerciseDB filter URL
    const params = new URLSearchParams({ limit: '25', offset: '0' });
    if (name) params.set('search', name);
    if (muscle) params.set('muscles', muscle);
    if (type) params.set('bodyParts', type);

    const response = await fetch(`${EXERCISEDB_BASE}/exercises/filter?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`ExerciseDB responded with status: ${response.status}`);
    }

    const result = await response.json();
    res.json((result.data || []).map(transformExerciseDB));
  } catch (error) {
    console.error('Error fetching exercises:', error);
    res.status(500).json({ error: 'Failed to fetch exercises' });
  }
});

// GET: Single exercise by name
// NOTE: This parameterized route must come AFTER specific routes
router.get('/exercises/:name', async (req, res) => {
  try {
    const name = req.params.name;

    // Search ExerciseDB for the exercise by name
    const response = await fetch(
      `${EXERCISEDB_BASE}/exercises/search?q=${encodeURIComponent(name)}&limit=5&offset=0`
    );

    if (response.ok) {
      const result = await response.json();
      const exercises = result.data || [];

      // Try exact match first, then take first result
      const exactMatch = exercises.find(
        e => e.name.toLowerCase() === name.toLowerCase()
      );
      const exercise = exactMatch || exercises[0];

      if (exercise) {
        return res.json(transformExerciseDB(exercise));
      }
    }

    // Fallback: check custom exercises in MongoDB
    const db = await connectDB();
    const customExercise = await db.collection('customExercises')
      .findOne({ name: { $regex: `^${name}$`, $options: 'i' } });

    if (customExercise) {
      return res.json(transformCustomExercise(customExercise));
    }

    // Fallback: partial match in custom exercises
    const partialMatch = await db.collection('customExercises')
      .findOne({ name: { $regex: name, $options: 'i' } });

    if (partialMatch) {
      return res.json(transformCustomExercise(partialMatch));
    }

    res.status(404).json({ error: 'Exercise not found' });
  } catch (error) {
    console.error('Error fetching exercise:', error);
    res.status(500).json({ error: 'Failed to fetch exercise' });
  }
});

module.exports = router;
