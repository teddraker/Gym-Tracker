const { connectDB } = require('./mongodb');

/**
 * Setup all database indexes for optimal query performance
 * Run this once after deployment or when collections are created
 */
async function setupIndexes() {
  try {
    const db = await connectDB();
    console.log('Setting up database indexes...');

    // ============ WORKOUT SETS INDEXES ============
    // Most common query: find sets by userId and exerciseName
    await db.collection('workoutSets').createIndex(
      { userId: 1, exerciseName: 1, createdAt: -1 },
      { name: 'userId_exerciseName_createdAt' }
    );
    
    // Query for user's all workout sets
    await db.collection('workoutSets').createIndex(
      { userId: 1, createdAt: -1 },
      { name: 'userId_createdAt' }
    );
    
    // Query for exercise history
    await db.collection('workoutSets').createIndex(
      { exerciseName: 1, userId: 1, createdAt: -1 },
      { name: 'exerciseName_userId_createdAt' }
    );
    
    // Consistency queries (date range)
    await db.collection('workoutSets').createIndex(
      { userId: 1, createdAt: 1 },
      { name: 'userId_createdAt_asc' }
    );

    console.log('✓ Workout sets indexes created');

    // ============ DAY ROUTINES INDEXES ============
    // Most common query: find routine by userId and day
    await db.collection('dayRoutines').createIndex(
      { userId: 1, day: 1 },
      { name: 'userId_day', unique: true }
    );
    
    // Query all routines for a user
    await db.collection('dayRoutines').createIndex(
      { userId: 1 },
      { name: 'userId' }
    );

    console.log('✓ Day routines indexes created');

    // ============ CUSTOM EXERCISES INDEXES ============
    // Search by name (case-insensitive)
    await db.collection('customExercises').createIndex(
      { name: 1 },
      { name: 'name', collation: { locale: 'en', strength: 2 } }
    );
    
    // Search by muscle
    await db.collection('customExercises').createIndex(
      { muscle: 1 },
      { name: 'muscle' }
    );
    
    // Text search for name and muscle
    await db.collection('customExercises').createIndex(
      { name: 'text', muscle: 'text' },
      { name: 'text_search' }
    );

    console.log('✓ Custom exercises indexes created');

    // ============ PROFILES INDEXES ============
    await db.collection('profiles').createIndex(
      { userId: 1 },
      { name: 'userId', unique: true }
    );

    console.log('✓ Profiles indexes created');

    // ============ BODY COMPOSITION HISTORY INDEXES ============
    await db.collection('bodyCompositionHistory').createIndex(
      { userId: 1, recordedAt: -1 },
      { name: 'userId_recordedAt' }
    );

    console.log('✓ Body composition history indexes created');

    // ============ VERIFY INDEXES ============
    console.log('\n=== VERIFICATION ===');
    const collections = ['workoutSets', 'dayRoutines', 'customExercises', 'profiles', 'bodyCompositionHistory'];
    
    for (const collName of collections) {
      const indexes = await db.collection(collName).indexes();
      console.log(`\n${collName}:`);
      indexes.forEach(idx => {
        console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
      });
    }

    console.log('\n✅ All indexes created successfully!');
    console.log('Database is now optimized for fast queries.');
    
  } catch (error) {
    console.error('❌ Error setting up indexes:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  setupIndexes();
}

module.exports = { setupIndexes };
