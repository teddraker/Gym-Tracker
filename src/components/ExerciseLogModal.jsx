import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  Pressable, 
  Modal, 
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { saveWorkoutSet, getWorkoutSets, getExerciseDays, updateExerciseDays } from '../services/workoutService';
import { formatName } from '../../utils/getFormattedName';
import DaySelector from './DaySelector';

export default function ExerciseLogModal({ isVisible, onClose, exercise, dayId, userId }) {
  const queryClient = useQueryClient();
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [notes, setNotes] = useState('');
  const [rpe, setRpe] = useState('');
  const [sets, setSets] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDays, setSelectedDays] = useState([]);
  const [isLoadingDays, setIsLoadingDays] = useState(false);
  const [isSavingDays, setIsSavingDays] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isInstructionsExpanded, setIsInstructionsExpanded] = useState(false);

  useEffect(() => {
    if (isVisible && exercise?.name) {
      loadSets();
      loadExerciseDays();
    }
  }, [isVisible, exercise?.name]);

  const loadSets = async () => {
    try {
      const savedSets = await getWorkoutSets(exercise.name);
      const todaySets = savedSets.filter(set => {
        const setDate = new Date(set.createdAt).toDateString();
        const today = new Date().toDateString();
        return setDate === today;
      });
      setSets(todaySets.map(set => ({
        weight: set.weight,
        reps: set.reps,
        notes: set.notes,
        timestamp: set.createdAt,
      })));
    } catch (error) {
      console.log('No saved sets found:', error);
      setSets([]);
    }
  };

  const loadExerciseDays = async () => {
    setIsLoadingDays(true);
    try {
      const days = await getExerciseDays(userId, exercise.name);
      setSelectedDays(days);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error loading exercise days:', error);
    } finally {
      setIsLoadingDays(false);
    }
  };

  const handleDaysChange = (newDays) => {
    setSelectedDays(newDays);
    setHasUnsavedChanges(true);
  };

  const handleSaveDays = async () => {
    setIsSavingDays(true);
    try {
      await updateExerciseDays(userId, exercise.name, selectedDays, exercise);
      setHasUnsavedChanges(false);
      
      // Invalidate all day routine queries to refresh the home page and day pages
      queryClient.invalidateQueries(['dayRoutines', userId]);
      queryClient.invalidateQueries(['dayRoutine']);
      
      Alert.alert('Success', 'Exercise schedule updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update exercise schedule');
    } finally {
      setIsSavingDays(false);
    }
  };

  const handleAddSet = async () => {
    if (!weight || !reps) {
      Alert.alert('Error', 'Please enter weight and reps');
      return;
    }

    setIsSubmitting(true);
    try {
      const newSet = await saveWorkoutSet(
        exercise.name,
        weight,
        reps,
        notes,
        userId,
        dayId,
        rpe || null
      );

      setSets([...sets, {
        weight: newSet.weight,
        reps: newSet.reps,
        notes: newSet.notes,
        rpe: newSet.rpe,
        volume: newSet.volume,
        estimated1RM: newSet.estimated1RM,
        timestamp: newSet.createdAt,
      }]);

      setWeight('');
      setReps('');
      setNotes('');
      setRpe('');
      
      Alert.alert('Success', 'Set logged successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to log set');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes to the exercise schedule. Do you want to save them?',
        [
          { text: 'Discard', style: 'destructive', onPress: () => {
            setWeight('');
            setReps('');
            setNotes('');
            setHasUnsavedChanges(false);
            onClose();
          }},
          { text: 'Cancel', style: 'cancel' },
          { text: 'Save', onPress: async () => {
            await handleSaveDays();
            setWeight('');
            setReps('');
            setNotes('');
            onClose();
          }},
        ]
      );
    } else {
      setWeight('');
      setReps('');
      setNotes('');
      onClose();
    }
  };

  if (!exercise) return null;

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Done</Text>
          </Pressable>
          <Text style={styles.title}>Exercise Details</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.exerciseHeader}>
            <Text style={styles.exerciseName}>{formatName(exercise.name)}</Text>
            <Text style={styles.muscleText}>{formatName(exercise.muscle)}</Text>
          </View>

          <View style={styles.dayScheduleSection}>
            {isLoadingDays ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.loadingText}>Loading schedule...</Text>
              </View>
            ) : (
              <>
                <DaySelector
                  selectedDays={selectedDays}
                  onDaysChange={handleDaysChange}
                  disabled={isSavingDays}
                />
                {hasUnsavedChanges && (
                  <Pressable 
                    style={[styles.saveDaysButton, isSavingDays && styles.saveDaysButtonDisabled]}
                    onPress={handleSaveDays}
                    disabled={isSavingDays}
                  >
                    <Text style={styles.saveDaysButtonText}>
                      {isSavingDays ? 'Saving...' : 'Save Schedule'}
                    </Text>
                  </Pressable>
                )}
              </>
            )}
          </View>

          {exercise.instructions && (
            <View style={styles.instructionsSection}>
              <Text style={styles.sectionTitle}>Instructions</Text>
              <Text 
                style={styles.instructionsText}
                numberOfLines={isInstructionsExpanded ? undefined : 3}
              >
                {exercise.instructions}
              </Text>
              <Pressable 
                onPress={() => setIsInstructionsExpanded(!isInstructionsExpanded)}
                style={styles.expandButton}
              >
                <Text style={styles.expandButtonText}>
                  {isInstructionsExpanded ? 'Show Less' : 'Read More'}
                </Text>
              </Pressable>
            </View>
          )}

          <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>Add New Set</Text>
          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#C7C7CC"
                keyboardType="decimal-pad"
                value={weight}
                onChangeText={setWeight}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Reps</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#C7C7CC"
                keyboardType="number-pad"
                value={reps}
                onChangeText={setReps}
              />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>RPE (1-10, optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Rate difficulty"
              placeholderTextColor="#C7C7CC"
              keyboardType="number-pad"
              value={rpe}
              onChangeText={(text) => {
                const num = parseInt(text);
                if (text === '' || (num >= 1 && num <= 10)) {
                  setRpe(text);
                }
              }}
              maxLength={2}
            />
          </View>
          <View style={styles.notesGroup}>
            <Text style={styles.inputLabel}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Add notes..."
              placeholderTextColor="#C7C7CC"
              multiline
              value={notes}
              onChangeText={setNotes}
            />
          </View>
          <Pressable 
            style={[styles.addButton, (!weight || !reps || isSubmitting) && styles.addButtonDisabled]}
            onPress={handleAddSet}
            disabled={!weight || !reps || isSubmitting}
          >
            <Text style={styles.addButtonText}>
              {isSubmitting ? 'Adding...' : 'Add Set'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.setsSection}>
          <Text style={styles.sectionTitle}>Today's Sets ({sets.length})</Text>
          {sets.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No sets logged today</Text>
            </View>
          ) : (
            <View style={styles.setsList}>
              {sets.map((item, index) => (
                <View key={index}>
                  <View style={styles.setCard}>
                    <View style={styles.setNumber}>
                      <Text style={styles.setNumberText}>{index + 1}</Text>
                    </View>
                    <View style={styles.setDetails}>
                      <View style={styles.setStats}>
                        <View style={styles.statItem}>
                          <Text style={styles.statValue}>{item.weight}</Text>
                          <Text style={styles.statLabel}>kg</Text>
                        </View>
                        <Text style={styles.statDivider}>×</Text>
                        <View style={styles.statItem}>
                          <Text style={styles.statValue}>{item.reps}</Text>
                          <Text style={styles.statLabel}>reps</Text>
                        </View>
                      </View>
                      {item.notes && (
                        <Text style={styles.setNotes}>{item.notes}</Text>
                      )}
                    </View>
                    <Text style={styles.setTime}>
                      {new Date(item.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Text>
                  </View>
                  {index < sets.length - 1 && <View style={styles.setSeparator} />}
                </View>
              ))}
            </View>
          )}
        </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '600',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  placeholder: {
    width: 50,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  exerciseHeader: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    alignItems: 'center',
  },
  exerciseName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
    textAlign: 'center',
  },
  muscleText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  dayScheduleSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  saveDaysButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  saveDaysButtonDisabled: {
    backgroundColor: '#B4D4FF',
  },
  saveDaysButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  instructionsSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 16,
  },
  instructionsText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#48484A',
    marginBottom: 8,
  },
  expandButton: {
    paddingVertical: 4,
  },
  expandButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  inputSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  inputGroup: {
    flex: 1,
  },
  notesGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 14,
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  notesInput: {
    fontSize: 15,
    fontWeight: '400',
    textAlign: 'left',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#B4D4FF',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  setsSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 15,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  setsList: {
    paddingBottom: 16,
  },
  setCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
  },
  setNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  setNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  setDetails: {
    flex: 1,
  },
  setStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
  },
  statDivider: {
    fontSize: 16,
    color: '#C7C7CC',
    marginHorizontal: 6,
  },
  setNotes: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
    fontStyle: 'italic',
  },
  setTime: {
    fontSize: 12,
    color: '#C7C7CC',
    fontWeight: '500',
  },
  setSeparator: {
    height: 8,
  },
});
