import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDayRoutine, removeExerciseFromDay, updateExerciseOrder } from '../../services/workoutService';
import { formatName } from '../../../utils/getFormattedName';
import { getDifficultyColor } from '../../../utils/getDifficultyColor';
import ExerciseSearchModal from '../../components/ExerciseSearchModal';
import ExerciseLogModal from '../../components/ExerciseLogModal';

const DAYS_CONFIG = {
  monday: { name: 'Monday', color: '#FF6B6B' },
  tuesday: { name: 'Tuesday', color: '#4ECDC4' },
  wednesday: { name: 'Wednesday', color: '#45B7D1' },
  thursday: { name: 'Thursday', color: '#96CEB4' },
  friday: { name: 'Friday', color: '#FFEAA7' },
  saturday: { name: 'Saturday', color: '#DDA0DD' },
  sunday: { name: 'Sunday', color: '#98D8C8' },
};

const USER_ID = 'default_user';

export default function DayDetailScreen() {
  const { dayId } = useLocalSearchParams();
  const queryClient = useQueryClient();
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [showLogModal, setShowLogModal] = useState(false);

  const dayConfig = DAYS_CONFIG[dayId] || { name: dayId, color: '#007AFF' };

  const { data: routine, isLoading, error } = useQuery({
    queryKey: ['dayRoutine', USER_ID, dayId],
    queryFn: () => getDayRoutine(USER_ID, dayId),
  });

  const removeMutation = useMutation({
    mutationFn: (exerciseName) => removeExerciseFromDay(USER_ID, dayId, exerciseName),
    onSuccess: () => {
      queryClient.invalidateQueries(['dayRoutine', USER_ID, dayId]);
      queryClient.invalidateQueries(['dayRoutines', USER_ID]);
    },
  });

  const handleRemoveExercise = (exerciseName) => {
    Alert.alert(
      'Remove Exercise',
      `Are you sure you want to remove "${formatName(exerciseName)}" from ${dayConfig.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => removeMutation.mutate(exerciseName)
        },
      ]
    );
  };

  const handleLogExercise = (exercise) => {
    setSelectedExercise(exercise);
    setShowLogModal(true);
  };

  const handleExerciseAdded = () => {
    queryClient.invalidateQueries(['dayRoutine', USER_ID, dayId]);
    queryClient.invalidateQueries(['dayRoutines', USER_ID]);
  };

  const moveExercise = async (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= exercises.length) return;
    
    const newExercises = [...exercises];
    const [movedExercise] = newExercises.splice(fromIndex, 1);
    newExercises.splice(toIndex, 0, movedExercise);

    // Optimistically update the UI
    queryClient.setQueryData(['dayRoutine', USER_ID, dayId], (old) => ({
      ...old,
      exercises: newExercises,
    }));

    // Save the new order to the backend
    try {
      await updateExerciseOrder(USER_ID, dayId, newExercises);
    } catch (error) {
      console.error('Failed to update exercise order:', error);
      // Revert on error
      queryClient.invalidateQueries(['dayRoutine', USER_ID, dayId]);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load routine</Text>
      </View>
    );
  }

  const exercises = routine?.exercises || [];

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: dayConfig.name,
          headerStyle: { backgroundColor: '#F2F2F7' },
        }} 
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.headerCard, { borderLeftColor: dayConfig.color }]}>
          <Text style={styles.dayTitle}>{dayConfig.name}</Text>
          <Text style={styles.exerciseCount}>
            {exercises.length} {exercises.length === 1 ? 'exercise' : 'exercises'} planned
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Exercises</Text>
          <Pressable 
            style={styles.addButton}
            onPress={() => setShowAddExercise(true)}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </Pressable>
        </View>

        {exercises.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No exercises yet</Text>
            <Text style={styles.emptyStateText}>
              Tap "Add" to add exercises to your {dayConfig.name} routine
            </Text>
          </View>
        ) : (
          <View style={styles.exercisesList}>
            {exercises.map((exercise, index) => {
              const difficultyColor = getDifficultyColor(exercise.difficulty);
              return (
                <View key={`${exercise.name}-${index}`} style={styles.exerciseCard}>
                  <View style={styles.reorderButtons}>
                    <Pressable 
                      style={[styles.reorderButton, index === 0 && styles.reorderButtonDisabled]}
                      onPress={() => moveExercise(index, index - 1)}
                      disabled={index === 0}
                    >
                      <Text style={[styles.reorderButtonText, index === 0 && styles.reorderButtonTextDisabled]}>▲</Text>
                    </Pressable>
                    <Pressable 
                      style={[styles.reorderButton, index === exercises.length - 1 && styles.reorderButtonDisabled]}
                      onPress={() => moveExercise(index, index + 1)}
                      disabled={index === exercises.length - 1}
                    >
                      <Text style={[styles.reorderButtonText, index === exercises.length - 1 && styles.reorderButtonTextDisabled]}>▼</Text>
                    </Pressable>
                  </View>
                  
                  <Pressable 
                    style={styles.exerciseContent}
                    onPress={() => handleLogExercise(exercise)}
                  >
                    <View style={styles.exerciseHeader}>
                      <View style={styles.exerciseInfo}>
                        <Text style={styles.exerciseName}>{formatName(exercise.name)}</Text>
                        <View style={styles.exerciseMeta}>
                          <Text style={styles.muscleText}>{formatName(exercise.muscle)}</Text>
                          {exercise.difficulty && (
                            <View style={[styles.difficultyBadge, { backgroundColor: difficultyColor.bg }]}>
                              <Text style={[styles.difficultyText, { color: difficultyColor.text }]}>
                                {exercise.difficulty}
                              </Text>
                            </View>
                          )}
                          {exercise.isCustom && (
                            <View style={styles.customBadge}>
                              <Text style={styles.customBadgeText}>Custom</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.exerciseActions}>
                      <Pressable 
                        style={styles.logButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleLogExercise(exercise);
                        }}
                      >
                        <Text style={styles.logButtonText}>Log Sets</Text>
                      </Pressable>
                      <Pressable 
                        style={styles.removeButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleRemoveExercise(exercise.name);
                        }}
                      >
                        <Text style={styles.removeButtonText}>×</Text>
                      </Pressable>
                    </View>
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <ExerciseSearchModal
        isVisible={showAddExercise}
        onClose={() => setShowAddExercise(false)}
        dayId={dayId}
        userId={USER_ID}
        onExerciseAdded={handleExerciseAdded}
        existingExercises={exercises}
      />

      <ExerciseLogModal
        isVisible={showLogModal}
        onClose={() => {
          setShowLogModal(false);
          setSelectedExercise(null);
        }}
        exercise={selectedExercise}
        dayId={dayId}
        userId={USER_ID}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderLeftWidth: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  dayTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  exerciseCount: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  exercisesList: {
    gap: 12,
  },
  exerciseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  reorderButtons: {
    backgroundColor: '#F8F8F8',
    paddingHorizontal: 8,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  reorderButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  reorderButtonDisabled: {
    backgroundColor: '#F8F8F8',
    borderColor: '#F0F0F0',
  },
  reorderButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  reorderButtonTextDisabled: {
    color: '#C7C7CC',
  },
  exerciseContent: {
    flex: 1,
    padding: 16,
  },
  exerciseHeader: {
    marginBottom: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 6,
  },
  exerciseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  muscleText: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  customBadge: {
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  customBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
  },
  exerciseActions: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
    paddingTop: 12,
  },
  logButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  logButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  removeButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 24,
    color: '#FF3B30',
    fontWeight: '300',
    lineHeight: 26,
  },
});
