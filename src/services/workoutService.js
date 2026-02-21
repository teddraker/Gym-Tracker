// src/services/workoutService.js
import cacheManager, { cachedFetch, invalidateCache } from './cacheManager';

// Reads from EXPO_PUBLIC_API_URL in root .env
// Local dev: http://192.168.1.36:3000/api
// Production: https://your-app.onrender.com/api
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.36:3000/api';
console.log('API_BASE_URL:', API_BASE_URL);

// Cache TTLs (in milliseconds)
const CACHE_TTL = {
  EXERCISES: 10 * 60 * 1000,      // 10 minutes - exercises don't change often
  CUSTOM_EXERCISES: 2 * 60 * 1000, // 2 minutes - might add new ones
  DAY_ROUTINES: 1 * 60 * 1000,     // 1 minute - changes more frequently
  WORKOUT_SETS: 30 * 1000,         // 30 seconds - real-time data
  PROFILE: 5 * 60 * 1000,          // 5 minutes
};

// ==================== WORKOUT SETS ====================

export const saveWorkoutSet = async (exerciseName, weight, reps, notes, userId, day, rpe) => {
  try {
    const response = await fetch(`${API_BASE_URL}/workoutSets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        exerciseName,
        weight,
        reps,
        notes,
        userId,
        day,
        rpe,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save workout set');
    }

    const data = await response.json();
    
    // Invalidate related caches
    invalidateCache(new RegExp(`workoutSets.*${exerciseName}`));
    invalidateCache(new RegExp(`user.*${userId}.*workoutSets`));
    invalidateCache(new RegExp(`history.*${exerciseName}`));
    
    return data;
  } catch (error) {
    console.error('Error saving workout set:', error);
    throw error;
  }
};

export const getWorkoutSets = async (exerciseName) => {
  try {
    const url = `${API_BASE_URL}/workoutSets/${encodeURIComponent(exerciseName)}`;
    return await cachedFetch(url, {}, CACHE_TTL.WORKOUT_SETS);
  } catch (error) {
    console.error('Error fetching workout sets:', error);
    throw error;
  }
};

export const getUserWorkoutSets = async (userId) => {
  try {
    const url = `${API_BASE_URL}/user/${userId}/workoutSets`;
    return await cachedFetch(url, {}, CACHE_TTL.WORKOUT_SETS);
  } catch (error) {
    console.error('Error fetching user workout sets:', error);
    throw error;
  }
};

// ==================== DAY ROUTINES ====================

export const getDayRoutine = async (userId, day) => {
  try {
    const url = `${API_BASE_URL}/dayRoutines/${userId}/${day.toLowerCase()}`;
    return await cachedFetch(url, {}, CACHE_TTL.DAY_ROUTINES);
  } catch (error) {
    console.error('Error fetching day routine:', error);
    throw error;
  }
};

export const getAllDayRoutines = async (userId) => {
  try {
    const url = `${API_BASE_URL}/dayRoutines/${userId}`;
    return await cachedFetch(url, {}, CACHE_TTL.DAY_ROUTINES);
  } catch (error) {
    console.error('Error fetching day routines:', error);
    throw error;
  }
};

export const addExerciseToDay = async (userId, day, exercise) => {
  try {
    const response = await fetch(`${API_BASE_URL}/dayRoutines/${userId}/${day.toLowerCase()}/exercises`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ exercise }),
    });

    if (!response.ok) {
      throw new Error('Failed to add exercise to day');
    }

    const data = await response.json();
    
    // Invalidate day routine caches
    invalidateCache(new RegExp(`dayRoutines.*${userId}`));
    
    return data;
  } catch (error) {
    console.error('Error adding exercise to day:', error);
    throw error;
  }
};

export const removeExerciseFromDay = async (userId, day, exerciseName) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/dayRoutines/${userId}/${day.toLowerCase()}/exercises/${encodeURIComponent(exerciseName)}`,
      { method: 'DELETE' }
    );

    if (!response.ok) {
      throw new Error('Failed to remove exercise from day');
    }

    const data = await response.json();
    
    // Invalidate day routine caches
    invalidateCache(new RegExp(`dayRoutines.*${userId}`));
    
    return data;
  } catch (error) {
    console.error('Error removing exercise from day:', error);
    throw error;
  }
};

export const updateExerciseDays = async (userId, exerciseName, selectedDays, exercise) => {
  try {
    // NEW: Single batch request instead of 7-14 sequential requests
    const response = await fetch(`${API_BASE_URL}/dayRoutines/${userId}/batch-update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        exerciseName,
        selectedDays,
        exercise,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update exercise days');
    }

    const data = await response.json();
    
    // Invalidate all day routine caches for this user
    invalidateCache(new RegExp(`dayRoutines.*${userId}`));
    
    return data;
  } catch (error) {
    console.error('Error updating exercise days:', error);
    throw error;
  }
};

export const getExerciseDays = async (userId, exerciseName) => {
  try {
    const allRoutines = await getAllDayRoutines(userId);
    const days = [];

    for (const routine of allRoutines) {
      const hasExercise = routine.exercises?.some(
        e => e.name.toLowerCase() === exerciseName.toLowerCase()
      );
      if (hasExercise) {
        days.push(routine.day);
      }
    }

    return days;
  } catch (error) {
    console.error('Error getting exercise days:', error);
    return [];
  }
};

// ==================== CUSTOM EXERCISES ====================

export const getCustomExercises = async () => {
  try {
    const url = `${API_BASE_URL}/customExercises`;
    return await cachedFetch(url, {}, CACHE_TTL.CUSTOM_EXERCISES);
  } catch (error) {
    console.error('Error fetching custom exercises:', error);
    throw error;
  }
};

export const createCustomExercise = async (exercise) => {
  try {
    const response = await fetch(`${API_BASE_URL}/customExercises`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(exercise),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create custom exercise');
    }

    const data = await response.json();
    
    // Invalidate custom exercise caches
    invalidateCache(new RegExp('customExercises'));
    invalidateCache(new RegExp('exercises')); // Also clear general exercise caches
    
    return data;
  } catch (error) {
    console.error('Error creating custom exercise:', error);
    throw error;
  }
};

// ==================== EXERCISE ORDER ====================

export const updateExerciseOrder = async (userId, day, exercises) => {
  try {
    const response = await fetch(`${API_BASE_URL}/dayRoutines/${userId}/${day}/order`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ exercises }),
    });

    if (!response.ok) {
      throw new Error('Failed to update exercise order');
    }

    const data = await response.json();
    
    // Invalidate day routine caches
    invalidateCache(new RegExp(`dayRoutines.*${userId}`));
    
    return data;
  } catch (error) {
    console.error('Error updating exercise order:', error);
    throw error;
  }
};

export const deleteCustomExercise = async (exerciseId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/customExercises/${exerciseId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete custom exercise');
    }

    const data = await response.json();
    
    // Invalidate custom exercise caches
    invalidateCache(new RegExp('customExercises'));
    invalidateCache(new RegExp('exercises'));
    
    return data;
  } catch (error) {
    console.error('Error deleting custom exercise:', error);
    throw error;
  }
};

// ==================== PROGRESS MONITORING ====================

export const getExerciseHistory = async (exerciseName, userId = 'default_user', limit = 10) => {
  try {
    const url = `${API_BASE_URL}/history/${encodeURIComponent(exerciseName)}?userId=${userId}&limit=${limit}`;
    return await cachedFetch(url, {}, CACHE_TTL.WORKOUT_SETS);
  } catch (error) {
    console.error('Error fetching exercise history:', error);
    throw error;
  }
};

export const getWorkoutConsistency = async (userId = 'default_user', days = 90) => {
  try {
    const url = `${API_BASE_URL}/user/${userId}/consistency?days=${days}`;
    return await cachedFetch(url, {}, CACHE_TTL.WORKOUT_SETS);
  } catch (error) {
    console.error('Error fetching workout consistency:', error);
    throw error;
  }
};

export const getMuscleSplit = async (userId, days = 30) => {
  try {
    const url = `${API_BASE_URL}/user/${userId}/muscle-split?days=${days}`;
    return await cachedFetch(url, {}, CACHE_TTL.WORKOUT_SETS);
  } catch (error) {
    console.error('Error fetching muscle split:', error);
    throw error;
  }
};

// Profile and Body Composition APIs
export const getUserProfile = async (userId) => {
  try {
    const url = `${API_BASE_URL}/profile/${userId}`;
    return await cachedFetch(url, {}, CACHE_TTL.PROFILE);
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
};

export const saveUserProfile = async (profileData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      throw new Error('Failed to save profile');
    }

    const data = await response.json();
    
    // Invalidate profile caches
    invalidateCache(new RegExp(`profile.*${profileData.userId}`));
    
    return data;
  } catch (error) {
    console.error('Error saving profile:', error);
    throw error;
  }
};

export const getBodyCompositionHistory = async (userId, limit = 50) => {
  try {
    const url = `${API_BASE_URL}/profile/${userId}/history?limit=${limit}`;
    return await cachedFetch(url, {}, CACHE_TTL.PROFILE);
  } catch (error) {
    console.error('Error fetching body composition history:', error);
    throw error;
  }
};

export const addBodyCompositionRecord = async (recordData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/profile/history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(recordData),
    });

    if (!response.ok) {
      throw new Error('Failed to add body composition record');
    }

    const data = await response.json();
    
    // Invalidate history caches
    invalidateCache(new RegExp(`profile.*${recordData.userId}.*history`));
    
    return data;
  } catch (error) {
    console.error('Error adding body composition record:', error);
    throw error;
  }
};

// ==================== EXERCISE SEARCH ====================

export const searchExercises = async (query) => {
  try {
    const url = `${API_BASE_URL}/exercises/search/${encodeURIComponent(query)}`;
    // Short cache for search results
    return await cachedFetch(url, {}, CACHE_TTL.EXERCISES);
  } catch (error) {
    console.error('Error searching exercises:', error);
    throw error;
  }
};

export const getAllExercises = async () => {
  try {
    const url = `${API_BASE_URL}/exercises/all`;
    return await cachedFetch(url, {}, CACHE_TTL.EXERCISES);
  } catch (error) {
    console.error('Error fetching all exercises:', error);
    throw error;
  }
};

export const getExerciseDetail = async (name) => {
  try {
    const url = `${API_BASE_URL}/exercises/${encodeURIComponent(name)}`;
    const exercise = await cachedFetch(url, {}, CACHE_TTL.EXERCISES);
    // Wrap in same shape as GraphQL response for compatibility
    return { exercises: [exercise] };
  } catch (error) {
    console.error('Error fetching exercise detail:', error);
    throw error;
  }
};

// ==================== AI RECOMMENDATIONS ====================

export const getAIRecommendations = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/ai/recommend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error('Failed to get AI recommendations');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting AI recommendations:', error);
    throw error;
  }
};

export const getCachedRecommendations = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/ai/recommend/${userId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch cached recommendations');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching cached recommendations:', error);
    throw error;
  }
};
