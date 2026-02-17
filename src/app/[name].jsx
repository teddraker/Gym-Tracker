import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator, FlatList, Image } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatName } from '../../utils/getFormattedName';
import { getDifficultyColor } from '../../utils/getDifficultyColor';
import NewSetInput from '../components/newSetInput';
import { getWorkoutSets, getExerciseDetail } from '../services/workoutService';

export default function ExerciseDetailScreen() {
    const params = useLocalSearchParams();
    const [isExpanded, setIsExpanded] = useState(false);
    const [showSetInput, setShowSetInput] = useState(false);
    const [sets, setSets] = useState([]);

    const { data, isLoading, error } = useQuery({
        queryKey: ['exercise', params.name],
        queryFn: () => getExerciseDetail(params.name),
    });

    const exercise = data?.exercises?.[0];
    console.log(exercise);
    // Fetch saved workout sets for this exercise
    useEffect(() => {
        if (exercise?.name) {
            getWorkoutSets(exercise.name)
                .then(savedSets => {
                    setSets(savedSets.map(set => ({
                        weight: set.weight,
                        reps: set.reps,
                        notes: set.notes,
                        timestamp: set.createdAt,
                    })));
                })
                .catch(err => console.log('No saved sets found:', err));
        }
    }, [exercise?.name]);

    const difficultyColor = getDifficultyColor(exercise?.difficulty);

    const handleAddSet = (newSet) => {
        setSets([...sets, newSet]);
    };

    // Loading State
    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    // Error or Not Found State
    if (!exercise || error) {
        return (
            <SafeAreaView style={styles.centered}>
                <Text style={styles.notFound}>Exercise not found</Text>
            </SafeAreaView>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: exercise.name }} />
            
            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* 1. Header Card: Name and Primary Info */}
                <View style={styles.mainCard}>
                    <View style={styles.titleRow}>
                        <Text style={styles.title}>{formatName(exercise.name)}</Text>
                        {exercise.difficulty && (
                            <View style={[styles.difficultyBadge, { backgroundColor:difficultyColor.bg }]}>
                                <Text style={[styles.difficultyText,{color:difficultyColor.text}]}>{exercise.difficulty}</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.muscleSection}>
                        <Text style={styles.label}>Target Muscle</Text>
                        <Text style={styles.muscleValue}>{formatName(exercise.muscle)}</Text>
                    </View>
                </View>

                {/* 2. Exercise GIF/Image */}
                {exercise.gifUrl && (
                    <View style={styles.gifCard}>
                        <Image 
                            source={{ uri: exercise.gifUrl }}
                            style={styles.exerciseGif}
                            resizeMode="contain"
                        />
                    </View>
                )}

                {/* 3. Equipment Section: Cards within a Card */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Equipment Needed</Text>
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false} 
                        contentContainerStyle={styles.equipmentGrid}
                    >
                        {exercise.equipments && exercise.equipments.length > 0 ? (
                            exercise.equipments.map((equip, index) => (
                                <View key={index} style={styles.innerCard}>
                                    <Text style={styles.innerCardText}>{formatName(equip)}</Text>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.noneText}>No specific equipment needed</Text>
                        )}
                    </ScrollView>
                </View>

                {/* 3. Instructions Section */}
                {exercise.instructions && (
                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>Instructions</Text>
                        <Text 
                            style={styles.instructionsText}
                            numberOfLines={isExpanded ? undefined : 5}
                        >
                            {exercise.instructions}
                        </Text>
                        
                        <Pressable 
                            onPress={() => setIsExpanded(!isExpanded)}
                            style={styles.expandButton}
                        >
                            <Text style={styles.expandButtonText}>
                                {isExpanded ? 'Show Less' : 'Read Full Instructions'}
                            </Text>
                        </Pressable>
                    </View>
                )}

                <View style={styles.sectionCard}>
                    <View style={styles.setHeaderRow}>
                        <Text style={styles.sectionTitle}>Logged Sets</Text>
                        <Pressable
                            style={styles.addSetButton}
                            onPress={() => setShowSetInput(true)}
                        >
                            <Text style={styles.addSetButtonText}>+ Add Set</Text>
                        </Pressable>
                    </View>

                    {sets.length > 0 ? (
                        <FlatList
                            scrollEnabled={false}
                            data={sets}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={({ item, index }) => (
                                <View style={styles.setCard}>
                                    <View style={styles.setInfo}>
                                        <View style={styles.setRow}>
                                            <Text style={styles.setLabel}>Set {index + 1}</Text>
                                            <Text style={styles.setTime}>
                                                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Text>
                                        </View>
                                        <View style={styles.setStats}>
                                            <View style={styles.statItem}>
                                                <Text style={styles.statLabel}>Weight</Text>
                                                <Text style={styles.statValue}>{item.weight} kg</Text>
                                            </View>
                                            <View style={styles.statItem}>
                                                <Text style={styles.statLabel}>Reps</Text>
                                                <Text style={styles.statValue}>{item.reps}</Text>
                                            </View>
                                        </View>
                                        {item.notes && (
                                            <Text style={styles.setNotes}>{item.notes}</Text>
                                        )}
                                    </View>
                                    <Pressable
                                        onPress={() => setSets(sets.filter((_, i) => i !== index))}
                                        style={styles.deleteButton}
                                    >
                                        <Text style={styles.deleteButtonText}>×</Text>
                                    </Pressable>
                                </View>
                            )}
                            ItemSeparatorComponent={() => <View style={styles.setSeparator} />}
                        />
                    ) : (
                        <Text style={styles.noSetsText}>No sets logged yet. Tap "Add Set" to get started!</Text>
                    )}
                </View>
            </ScrollView>

            <NewSetInput
                isVisible={showSetInput}
                onClose={() => setShowSetInput(false)}
                onAddSet={handleAddSet}
                exerciseName={formatName(exercise?.name)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7', // Light gray background
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        gap: 16,
    },
    // Main Header Card Style
    mainCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: '#1C1C1E',
        flex: 1,
        marginRight: 10,
    },
    difficultyBadge: {
        backgroundColor: '#E5E5EA',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        justifyContent: 'center',
        maxHeight: 32,
    },
    difficultyText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#8E8E93',
        textTransform: 'uppercase',
    },
    muscleSection: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#C6C6C8',
        paddingTop: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8E8E93',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    muscleValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#007AFF', // Action color (blue)
        textTransform: 'capitalize',
    },
    // GIF Card Styles
    gifCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 16,
        alignItems: 'center',
        overflow: 'hidden',
    },
    exerciseGif: {
        width: '100%',
        height: 280,
        borderRadius: 16,
    },
    // Generic Section Card
    sectionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1C1C1E',
        marginBottom: 16,
    },
    // Inner Card (Equipment) Styles
    equipmentGrid: {
        gap: 12,
        paddingRight: 8,
    },
    innerCard: {
        backgroundColor: '#F8F8F8', // Slightly off-white for contrast
        borderRadius: 16,
        padding: 16,
        minWidth: 110,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
    innerCardText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3A3A3C',
        textAlign: 'center',
        textTransform: 'capitalize',
    },
    iconPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E5E5EA',
        marginBottom: 8,
    },
    // Instructions Styling
    instructionsText: {
        fontSize: 16,
        lineHeight: 24,
        color: '#48484A',
    },
    expandButton: {
        marginTop: 12,
        paddingVertical: 4,
    },
    expandButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#007AFF',
    },
    loadingText: {
        marginTop: 12,
        color: '#8E8E93',
    },
    notFound: {
        fontSize: 18,
        color: '#8E8E93',
    },
    noneText: {
        color: '#C7C7CC',
        fontStyle: 'italic',
    },
    // Sets Section Styles
    setHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    addSetButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    addSetButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    setCard: {
        backgroundColor: '#F8F8F8',
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
    setInfo: {
        flex: 1,
    },
    setRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    setLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1C1C1E',
    },
    setTime: {
        fontSize: 12,
        color: '#8E8E93',
    },
    setStats: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 8,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#8E8E93',
        fontWeight: '500',
    },
    statValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#007AFF',
    },
    setNotes: {
        fontSize: 12,
        color: '#48484A',
        fontStyle: 'italic',
        marginTop: 4,
    },
    setSeparator: {
        height: 8,
    },
    deleteButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FF3B30',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    deleteButtonText: {
        fontSize: 20,
        color: '#fff',
        fontWeight: '300',
        lineHeight: 32,
    },
    noSetsText: {
        fontSize: 14,
        color: '#8E8E93',
        textAlign: 'center',
        paddingVertical: 20,
        fontStyle: 'italic',
    },
});