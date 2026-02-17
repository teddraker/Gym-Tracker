import { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  Pressable, 
  Modal, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { saveWorkoutSet } from '../services/workoutService';

export default function NewSetInput({ isVisible, onClose, onAddSet, exerciseName, day = null }) {
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!weight || !reps) return;

    const newSet = {
      weight: parseFloat(weight),
      reps: parseInt(reps, 10),
      notes: notes.trim(),
      timestamp: new Date().toISOString(),
    };

    setIsSubmitting(true);
    
    try {
      await saveWorkoutSet(
        exerciseName,
        newSet.weight,
        newSet.reps,
        newSet.notes,
        'default_user',
        day
      );
      
      onAddSet(newSet);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error saving set:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setWeight('');
    setReps('');
    setNotes('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Log New Set</Text>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </Pressable>
          </View>

          <Text style={styles.exerciseName}>{exerciseName}</Text>

          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                keyboardType="decimal-pad"
                value={weight}
                onChangeText={setWeight}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Reps</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                keyboardType="number-pad"
                value={reps}
                onChangeText={setReps}
              />
            </View>
          </View>

          <View style={styles.notesGroup}>
            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Add notes..."
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
            />
          </View>

          <Pressable 
            style={[
              styles.submitButton, 
              (!weight || !reps || isSubmitting) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!weight || !reps || isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Saving...' : 'Add Set'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 22,
    color: '#8E8E93',
    fontWeight: '300',
    lineHeight: 24,
  },
  exerciseName: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  inputGroup: {
    flex: 1,
  },
  notesGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  notesInput: {
    fontSize: 15,
    fontWeight: '400',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#B4D4FF',
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
});
