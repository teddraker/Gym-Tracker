// src/services/workoutService.js

// Reads from EXPO_PUBLIC_API_URL in root .env
// Local dev: http://192.168.1.36:3000/api
// Production: https://your-app.onrender.com/api
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.36:3000/api';
console.log('API_BASE_URL:', API_BASE_URL);

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
        rpe, // Rate of Perceived Exertion (1-10)
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save workout set');
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving workout set:', error);
    throw error;
  }
};

export const getWorkoutSets = async (exerciseName) => {
  try {
    const response = await fetch(`${API_BASE_URL}/workoutSets/${encodeURIComponent(exerciseName)}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch workout sets');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching workout sets:', error);
    throw error;
  }
};

export const getUserWorkoutSets = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/${userId}/workoutSets`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch user workout sets');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user workout sets:', error);
    throw error;
  }
};

// ==================== DAY ROUTINES ====================

export const getDayRoutine = async (userId, day) => {
  try {
    const response = await fetch(`${API_BASE_URL}/dayRoutines/${userId}/${day.toLowerCase()}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch day routine');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching day routine:', error);
    throw error;
  }
};

export const getAllDayRoutines = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/dayRoutines/${userId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch day routines');
    }

    return await response.json();
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

    return await response.json();
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

    return await response.json();
  } catch (error) {
    console.error('Error removing exercise from day:', error);
    throw error;
  }
};

export const updateExerciseDays = async (userId, exerciseName, selectedDays, exercise) => {
  try {
    const allDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const results = [];

    for (const day of allDays) {
      const shouldHaveExercise = selectedDays.includes(day);
      const currentRoutine = await getDayRoutine(userId, day);
      const hasExercise = currentRoutine?.exercises?.some(
        e => e.name.toLowerCase() === exerciseName.toLowerCase()
      );

      if (shouldHaveExercise && !hasExercise) {
        await addExerciseToDay(userId, day, exercise);
        results.push({ day, action: 'added' });
      } else if (!shouldHaveExercise && hasExercise) {
        await removeExerciseFromDay(userId, day, exerciseName);
        results.push({ day, action: 'removed' });
      }
    }

    return results;
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
    const response = await fetch(`${API_BASE_URL}/customExercises`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch custom exercises');
    }

    return await response.json();
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

    return await response.json();
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

    return await response.json();
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

    return await response.json();
  } catch (error) {
    console.error('Error deleting custom exercise:', error);
    throw error;
  }
};

// ==================== PROGRESS MONITORING ====================

export const getExerciseHistory = async (exerciseName, userId = 'default_user', limit = 10) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/history/${encodeURIComponent(exerciseName)}?userId=${userId}&limit=${limit}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch exercise history');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching exercise history:', error);
    throw error;
  }
};

export const getWorkoutConsistency = async (userId = 'default_user', days = 90) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/user/${userId}/consistency?days=${days}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch workout consistency');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching workout consistency:', error);
    throw error;
  }
};

export const getMuscleSplit = async (userId, days = 30) => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/${userId}/muscle-split?days=${days}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch muscle split');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching muscle split:', error);
    throw error;
  }
};

// Profile and Body Composition APIs
export const getUserProfile = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/profile/${userId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }

    return await response.json();
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

    return await response.json();
  } catch (error) {
    console.error('Error saving profile:', error);
    throw error;
  }
};

export const getBodyCompositionHistory = async (userId, limit = 50) => {
  try {
    const response = await fetch(`${API_BASE_URL}/profile/${userId}/history?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch body composition history');
    }

    return await response.json();
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

    return await response.json();
  } catch (error) {
    console.error('Error adding body composition record:', error);
    throw error;
  }
};

// ==================== EXERCISE SEARCH ====================

export const searchExercises = async (query) => {
  try {
    const response = await fetch(`${API_BASE_URL}/exercises/search/${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      throw new Error('Failed to search exercises');
    }

    return await response.json();
  } catch (error) {
    console.error('Error searching exercises:', error);
    throw error;
  }
};

export const getAllExercises = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/exercises/all`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch all exercises');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching all exercises:', error);
    throw error;
  }
};

export const getExerciseDetail = async (name) => {
  try {
    const response = await fetch(`${API_BASE_URL}/exercises/${encodeURIComponent(name)}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch exercise detail');
    }

    const exercise = await response.json();
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
