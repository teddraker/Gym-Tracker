import { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  Pressable, 
  Modal, 
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform 
} from 'react-native';
import { searchExercises, getAllExercises, addExerciseToDay } from '../services/workoutService';
import { formatName } from '../../utils/getFormattedName';
import { getDifficultyColor } from '../../utils/getDifficultyColor';
import CreateExerciseModal from './CreateExerciseModal';

export default function ExerciseSearchModal({ 
  isVisible, 
  onClose, 
  dayId, 
  userId, 
  onExerciseAdded,
  existingExercises = []
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [exercises, setExercises] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setSearchQuery('');
      setExercises([]);
      setHasSearched(false);
    }
  }, [isVisible]);

  const loadDefaultExercises = async () => {
    setIsLoading(true);
    try {
      const results = await getAllExercises();
      setExercises(results);
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = useCallback(async () => {
    const query = searchQuery.trim();
    
    if (query.length === 0) {
      setExercises([]);
      setHasSearched(false);
      return;
    }

    if (query.length < 2) return;

    setIsLoading(true);
    setHasSearched(true);
    try {
      const results = await searchExercises(query);
      setExercises(results);
    } catch (error) {
      console.error('Error searching exercises:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  const isExerciseAlreadyAdded = (exerciseName) => {
    return existingExercises.some(
      e => e.name.toLowerCase() === exerciseName.toLowerCase()
    );
  };

  const handleAddExercise = async (exercise) => {
    if (isExerciseAlreadyAdded(exercise.name)) return;
    
    setIsAdding(exercise.name);
    try {
      await addExerciseToDay(userId, dayId, {
        name: exercise.name,
        muscle: exercise.muscle,
        equipments: exercise.equipments,
        difficulty: exercise.difficulty,
        instructions: exercise.instructions,
        type: exercise.type,
        isCustom: exercise.isCustom || false,
      });
      onExerciseAdded();
    } catch (error) {
      console.error('Error adding exercise:', error);
    } finally {
      setIsAdding(null);
    }
  };

  const handleExerciseCreated = (newExercise) => {
    handleAddExercise(newExercise);
  };

  const renderExerciseItem = ({ item }) => {
    const isAdded = isExerciseAlreadyAdded(item.name);
    const isCurrentlyAdding = isAdding === item.name;
    const difficultyColor = getDifficultyColor(item.difficulty);

    return (
      <Pressable 
        style={[styles.exerciseItem, isAdded && styles.exerciseItemDisabled]}
        onPress={() => !isAdded && handleAddExercise(item)}
        disabled={isAdded || isCurrentlyAdding}
      >
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseName}>{formatName(item.name)}</Text>
          <View style={styles.exerciseMeta}>
            <Text style={styles.muscleText}>{formatName(item.muscle)}</Text>
            {item.difficulty && (
              <View style={[styles.difficultyBadge, { backgroundColor: difficultyColor.bg }]}>
                <Text style={[styles.difficultyText, { color: difficultyColor.text }]}>
                  {item.difficulty}
                </Text>
              </View>
            )}
            {item.isCustom && (
              <View style={styles.customBadge}>
                <Text style={styles.customBadgeText}>Custom</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.addIndicator}>
          {isCurrentlyAdding ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : isAdded ? (
            <Text style={styles.addedText}>Added</Text>
          ) : (
            <Text style={styles.addText}>+</Text>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Cancel</Text>
          </Pressable>
          <Text style={styles.title}>Add Exercise</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search exercises..."
              placeholderTextColor="#8E8E93"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onBlur={handleSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <Pressable 
                style={styles.clearButton}
                onPress={() => setSearchQuery('')}
              >
                <Text style={styles.clearButtonText}>×</Text>
              </Pressable>
            )}
          </View>
        </View>

        <Pressable 
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.createButtonIcon}>+</Text>
          <Text style={styles.createButtonText}>Create Custom Exercise</Text>
        </Pressable>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : exercises.length === 0 && hasSearched ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No exercises found</Text>
            <Text style={styles.emptyStateText}>
              Try a different search or create a custom exercise
            </Text>
          </View>
        ) : (
          <FlatList
            data={exercises}
            keyExtractor={(item) => item._id || item.name}
            renderItem={renderExerciseItem}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            showsVerticalScrollIndicator={false}
          />
        )}

        <CreateExerciseModal
          isVisible={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onExerciseCreated={handleExerciseCreated}
          initialName={searchQuery}
        />
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
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '400',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  placeholder: {
    width: 60,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  searchInputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#E5E5EA',
    borderRadius: 12,
    padding: 12,
    paddingRight: 40,
    fontSize: 16,
    color: '#1C1C1E',
  },
  clearButton: {
    position: 'absolute',
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#8E8E93',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '400',
    lineHeight: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  createButtonIcon: {
    fontSize: 24,
    color: '#007AFF',
    fontWeight: '300',
  },
  createButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
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
  listContent: {
    padding: 16,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
  },
  exerciseItemDisabled: {
    opacity: 0.6,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
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
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  customBadge: {
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  customBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
  },
  addIndicator: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addText: {
    fontSize: 28,
    color: '#007AFF',
    fontWeight: '300',
    lineHeight: 30,
  },
  addedText: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '600',
  },
  separator: {
    height: 8,
  },
});
