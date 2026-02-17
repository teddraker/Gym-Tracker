const express = require('express');
const { connectDB } = require('../db/mongodb');
const Groq = require('groq-sdk');

const router = express.Router();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Helper: Build the prompt from user data
function buildPrompt(profile, routines, recentSets, muscleSplit) {
  let prompt = `You are an expert fitness coach and sports scientist. Based on the following user data, provide personalized workout recommendations. Be specific with numbers (weights, reps, sets). Be practical and actionable.\n\n`;

  // Profile section
  prompt += `**USER PROFILE:**\n`;
  if (profile) {
    if (profile.age) prompt += `- Age: ${profile.age}\n`;
    if (profile.gender) prompt += `- Gender: ${profile.gender}\n`;
    if (profile.weight) prompt += `- Weight: ${profile.weight} kg\n`;
    if (profile.height) prompt += `- Height: ${profile.height} cm\n`;
    if (profile.bmi) prompt += `- BMI: ${profile.bmi}\n`;
    if (profile.bodyFatPercentage) prompt += `- Body Fat: ${profile.bodyFatPercentage}%\n`;
    if (profile.muscleMass) prompt += `- Muscle Mass: ${profile.muscleMass} kg\n`;
    if (profile.fatMass) prompt += `- Fat Mass: ${profile.fatMass} kg\n`;
    if (profile.goalWeight) prompt += `- Goal Weight: ${profile.goalWeight} kg\n`;
    if (profile.waist) prompt += `- Waist: ${profile.waist} cm\n`;
    if (profile.chest) prompt += `- Chest: ${profile.chest} cm\n`;
    if (profile.arms) prompt += `- Arms: ${profile.arms} cm\n`;
    if (profile.thighs) prompt += `- Thighs: ${profile.thighs} cm\n`;
    if (profile.notes) prompt += `- User Notes: ${profile.notes}\n`;
  } else {
    prompt += `- No profile data available\n`;
  }

  // Weekly routine section
  prompt += `\n**WEEKLY ROUTINE:**\n`;
  if (routines && routines.length > 0) {
    const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const sorted = [...routines].sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));
    
    for (const routine of sorted) {
      if (routine.exercises && routine.exercises.length > 0) {
        const exercises = routine.exercises.map(e => {
          let str = e.name;
          if (e.muscle) str += ` (${e.muscle})`;
          return str;
        }).join(', ');
        prompt += `- ${routine.day.charAt(0).toUpperCase() + routine.day.slice(1)}: ${exercises}\n`;
      } else {
        prompt += `- ${routine.day.charAt(0).toUpperCase() + routine.day.slice(1)}: Rest day\n`;
      }
    }
  } else {
    prompt += `- No routines configured yet\n`;
  }

  // Recent workout history
  prompt += `\n**RECENT WORKOUT HISTORY (last 7 days):**\n`;
  if (recentSets && recentSets.length > 0) {
    // Group by exercise
    const exerciseMap = new Map();
    recentSets.forEach(set => {
      if (!exerciseMap.has(set.exerciseName)) {
        exerciseMap.set(set.exerciseName, []);
      }
      exerciseMap.get(set.exerciseName).push(set);
    });

    for (const [exerciseName, sets] of exerciseMap) {
      // Sort by date descending
      sets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Group by session (date)
      const sessionMap = new Map();
      sets.forEach(s => {
        const dateKey = new Date(s.createdAt).toISOString().split('T')[0];
        if (!sessionMap.has(dateKey)) {
          sessionMap.set(dateKey, []);
        }
        sessionMap.get(dateKey).push(s);
      });

      const sessions = Array.from(sessionMap.entries()).slice(0, 3); // Last 3 sessions (reduced from 5)
      prompt += `\n  ${exerciseName}:\n`;
      
      for (const [date, sessionSets] of sessions) {
        const setsInfo = sessionSets.map(s => {
          let info = `${s.weight}kg x ${s.reps}`;
          if (s.rpe) info += ` @RPE${s.rpe}`;
          return info;
        }).join(', ');
        
        const maxWeight = Math.max(...sessionSets.map(s => s.weight));
        const max1RM = Math.max(...sessionSets.map(s => s.estimated1RM || 0));
        const totalVolume = sessionSets.reduce((sum, s) => sum + (s.volume || 0), 0);
        
        prompt += `    ${date}: ${setsInfo} | Max: ${maxWeight}kg | Est 1RM: ${max1RM}kg | Volume: ${totalVolume}kg\n`;
      }
    }
  } else {
    prompt += `- No workout data recorded yet\n`;
  }

  // Muscle split
  if (muscleSplit && muscleSplit.breakdown && muscleSplit.breakdown.length > 0) {
    prompt += `\n**MUSCLE SPLIT (last 30 days):**\n`;
    muscleSplit.breakdown.forEach(m => {
      prompt += `- ${m.muscle}: ${m.sets} sets (${m.percentage}%)\n`;
    });
    prompt += `- Total sets: ${muscleSplit.totalSets}\n`;
  }

  prompt += `\nBased on ALL the above data, provide your recommendations in the following JSON format. Be very specific and personalized — reference the user's actual numbers, exercises, and progress. Do NOT give generic advice.

Respond ONLY with valid JSON in this exact structure:
{
  "summary": "A 2-3 sentence overall assessment of the user's training",
  "progressionTips": [
    {
      "exercise": "Exercise Name",
      "currentLevel": "Brief description of where they are",
      "recommendation": "Specific next-session recommendation with exact weights/reps",
      "reasoning": "Why this progression makes sense"
    }
  ],
  "weakPoints": [
    {
      "area": "The weak point or imbalance",
      "explanation": "Why this is a concern",
      "fix": "Specific actionable fix"
    }
  ],
  "routineSuggestions": [
    {
      "suggestion": "Specific routine change",
      "reason": "Why this change would help"
    }
  ],
  "recoveryTips": [
    "Specific recovery recommendation based on their volume/frequency"
  ],
  "bodyCompositionAdvice": "Personalized advice based on their body metrics and goals (2-3 sentences)"
}`;

  return prompt;
}

// POST: Get AI recommendations
router.post('/ai/recommend', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: 'Groq API key not configured' });
    }

    const db = await connectDB();

    // Fetch all data in parallel
    // Use 7 days instead of 30 to reduce prompt size and avoid rate limits
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [profile, routines, recentSets, muscleSplitRaw] = await Promise.all([
      // 1. User profile
      db.collection('profiles').findOne({ userId }),
      
      // 2. Day routines
      db.collection('dayRoutines').find({ userId }).toArray(),
      
      // 3. Recent workout sets (last 7 days only - reduced from 30)
      db.collection('workoutSets')
        .find({ userId, createdAt: { $gte: sevenDaysAgo } })
        .sort({ createdAt: -1 })
        .limit(100)
        .toArray(),
      
      // 4. For muscle split calculation (still use 30 days for better overview)
      db.collection('workoutSets')
        .find({ userId, createdAt: { $gte: thirtyDaysAgo } })
        .toArray(),
    ]);

    // Calculate muscle split from raw data
    const exerciseToMuscle = new Map();
    if (routines) {
      routines.forEach(routine => {
        routine.exercises?.forEach(ex => {
          exerciseToMuscle.set(ex.name, ex.muscle);
        });
      });
    }

    const muscleSets = new Map();
    muscleSplitRaw.forEach(set => {
      const muscle = exerciseToMuscle.get(set.exerciseName) || 'Unknown';
      muscleSets.set(muscle, (muscleSets.get(muscle) || 0) + 1);
    });

    const totalSets = muscleSplitRaw.length;
    const breakdown = Array.from(muscleSets.entries()).map(([muscle, count]) => ({
      muscle,
      sets: count,
      percentage: totalSets > 0 ? Math.round((count / totalSets) * 100) : 0,
    })).sort((a, b) => b.sets - a.sets);

    const muscleSplit = { breakdown, totalSets };

    // Build the prompt
    const prompt = buildPrompt(profile, routines, recentSets, muscleSplit);

    // Call Groq API with Llama model
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 0.9,
    });

    const text = completion.choices[0]?.message?.content || '';

    // Parse JSON from the response
    let recommendations;
    try {
      // Try to extract JSON from the response (handle markdown code blocks)
      let jsonStr = text;
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }
      recommendations = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', parseError);
      console.log('Raw response:', text);
      // Return the raw text as a fallback
      recommendations = {
        summary: text,
        progressionTips: [],
        weakPoints: [],
        routineSuggestions: [],
        recoveryTips: [],
        bodyCompositionAdvice: '',
      };
    }

    // Optionally cache the recommendation
    await db.collection('aiRecommendations').updateOne(
      { userId },
      {
        $set: {
          userId,
          recommendations,
          generatedAt: new Date(),
          dataSnapshot: {
            hasProfile: !!profile,
            routineCount: routines?.length || 0,
            recentSetCount: recentSets?.length || 0,
          },
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );

    res.json({
      success: true,
      recommendations,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error generating AI recommendations:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

// GET: Fetch cached recommendation
router.get('/ai/recommend/:userId', async (req, res) => {
  try {
    const db = await connectDB();
    const { userId } = req.params;

    const cached = await db.collection('aiRecommendations').findOne({ userId });

    if (!cached) {
      return res.json({ cached: false, recommendations: null });
    }

    res.json({
      cached: true,
      recommendations: cached.recommendations,
      generatedAt: cached.generatedAt,
      dataSnapshot: cached.dataSnapshot,
    });
  } catch (error) {
    console.error('Error fetching cached recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

module.exports = router;
