import { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  Pressable, 
  Modal, 
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { createCustomExercise } from '../services/workoutService';

const MUSCLE_GROUPS = [
  'abdominals', 'abductors', 'adductors', 'biceps', 'calves', 
  'chest', 'forearms', 'glutes', 'hamstrings', 'lats', 
  'lower_back', 'middle_back', 'neck', 'quadriceps', 'shoulders', 'traps', 'triceps'
];

const DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'expert'];

const EXERCISE_TYPES = ['cardio', 'olympic_weightlifting', 'plyometrics', 'powerlifting', 'strength', 'stretching', 'strongman'];

export default function CreateExerciseModal({ isVisible, onClose, onExerciseCreated, initialName = '' }) {
  const [name, setName] = useState(initialName);
  const [muscle, setMuscle] = useState('');
  const [difficulty, setDifficulty] = useState('beginner');
  const [type, setType] = useState('strength');
  const [equipment, setEquipment] = useState('');
  const [instructions, setInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setName('');
    setMuscle('');
    setDifficulty('beginner');
    setType('strength');
    setEquipment('');
    setInstructions('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter an exercise name');
      return;
    }
    if (!muscle) {
      Alert.alert('Error', 'Please select a target muscle');
      return;
    }

    setIsSubmitting(true);
    try {
      const newExercise = await createCustomExercise({
        name: name.trim(),
        muscle,
        difficulty,
        type,
        equipments: equipment.trim() ? [equipment.trim()] : [],
        instructions: instructions.trim(),
      });
      
      onExerciseCreated(newExercise);
      handleClose();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create exercise');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatLabel = (text) => {
    return text.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <Pressable onPress={handleClose} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
          <Text style={styles.title}>Create Exercise</Text>
          <Pressable 
            onPress={handleSubmit} 
            style={styles.saveButton}
            disabled={isSubmitting}
          >
            <Text style={[styles.saveButtonText, isSubmitting && styles.saveButtonTextDisabled]}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Text>
          </Pressable>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Exercise Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Dumbbell Curl"
              placeholderTextColor="#8E8E93"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Target Muscle *</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.optionsContainer}
            >
              {MUSCLE_GROUPS.map((m) => (
                <Pressable
                  key={m}
                  style={[styles.optionChip, muscle === m && styles.optionChipSelected]}
                  onPress={() => setMuscle(m)}
                >
                  <Text style={[styles.optionChipText, muscle === m && styles.optionChipTextSelected]}>
                    {formatLabel(m)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Difficulty</Text>
            <View style={styles.optionsRow}>
              {DIFFICULTY_LEVELS.map((d) => (
                <Pressable
                  key={d}
                  style={[styles.optionChip, styles.optionChipFlex, difficulty === d && styles.optionChipSelected]}
                  onPress={() => setDifficulty(d)}
                >
                  <Text style={[styles.optionChipText, difficulty === d && styles.optionChipTextSelected]}>
                    {formatLabel(d)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Exercise Type</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.optionsContainer}
            >
              {EXERCISE_TYPES.map((t) => (
                <Pressable
                  key={t}
                  style={[styles.optionChip, type === t && styles.optionChipSelected]}
                  onPress={() => setType(t)}
                >
                  <Text style={[styles.optionChipText, type === t && styles.optionChipTextSelected]}>
                    {formatLabel(t)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Equipment (optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Dumbbell, Barbell, Cable"
              placeholderTextColor="#8E8E93"
              value={equipment}
              onChangeText={setEquipment}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Instructions (optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="How to perform this exercise..."
              placeholderTextColor="#8E8E93"
              value={instructions}
              onChangeText={setInstructions}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  cancelButton: {
    padding: 4,
  },
  cancelButtonText: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '400',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  saveButton: {
    padding: 4,
  },
  saveButtonText: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: '#C7C7CC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1C1C1E',
  },
  textArea: {
    minHeight: 100,
  },
  optionsContainer: {
    gap: 8,
    paddingRight: 16,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  optionChipFlex: {
    flex: 1,
    alignItems: 'center',
  },
  optionChipSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  optionChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  optionChipTextSelected: {
    color: '#FFFFFF',
  },
});
