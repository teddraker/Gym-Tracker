import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { Stack } from 'expo-router';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAIRecommendations, getCachedRecommendations } from '../services/workoutService';

const USER_ID = 'default_user';

function TimeSince({ date }) {
  if (!date) return null;
  const now = new Date();
  const gen = new Date(date);
  const diffMs = now - gen;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  let text = '';
  if (diffMins < 1) text = 'Just now';
  else if (diffMins < 60) text = `${diffMins}m ago`;
  else if (diffHours < 24) text = `${diffHours}h ago`;
  else text = `${diffDays}d ago`;

  return <Text style={styles.generatedAt}>Generated {text}</Text>;
}

function SummaryCard({ summary }) {
  if (!summary) return null;
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryIcon}>🧠</Text>
      <Text style={styles.summaryText}>{summary}</Text>
    </View>
  );
}

function ProgressionSection({ tips }) {
  if (!tips || tips.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📈 Progression Tips</Text>
      {tips.map((tip, index) => (
        <View key={index} style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <View style={styles.exerciseBadge}>
              <Text style={styles.exerciseBadgeText}>{tip.exercise}</Text>
            </View>
          </View>
          {tip.currentLevel ? (
            <View style={styles.tipRow}>
              <Text style={styles.tipLabel}>Current:</Text>
              <Text style={styles.tipValue}>{tip.currentLevel}</Text>
            </View>
          ) : null}
          <View style={styles.tipRow}>
            <Text style={styles.tipLabel}>Next Step:</Text>
            <Text style={styles.tipRecommendation}>{tip.recommendation}</Text>
          </View>
          {tip.reasoning ? (
            <Text style={styles.tipReasoning}>{tip.reasoning}</Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

function WeakPointsSection({ weakPoints }) {
  if (!weakPoints || weakPoints.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>⚠️ Weak Points & Imbalances</Text>
      {weakPoints.map((wp, index) => (
        <View key={index} style={styles.weakPointCard}>
          <Text style={styles.weakPointArea}>{wp.area}</Text>
          <Text style={styles.weakPointExplanation}>{wp.explanation}</Text>
          <View style={styles.fixContainer}>
            <Text style={styles.fixLabel}>Fix:</Text>
            <Text style={styles.fixText}>{wp.fix}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function RoutineSuggestionsSection({ suggestions }) {
  if (!suggestions || suggestions.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🔄 Routine Suggestions</Text>
      {suggestions.map((s, index) => (
        <View key={index} style={styles.suggestionCard}>
          <Text style={styles.suggestionText}>{s.suggestion}</Text>
          <Text style={styles.suggestionReason}>{s.reason}</Text>
        </View>
      ))}
    </View>
  );
}

function RecoverySection({ tips }) {
  if (!tips || tips.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>😴 Recovery Tips</Text>
      {tips.map((tip, index) => (
        <View key={index} style={styles.recoveryItem}>
          <View style={styles.recoveryBullet} />
          <Text style={styles.recoveryText}>{tip}</Text>
        </View>
      ))}
    </View>
  );
}

function BodyCompSection({ advice }) {
  if (!advice) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🏋️ Body Composition</Text>
      <View style={styles.bodyCompCard}>
        <Text style={styles.bodyCompText}>{advice}</Text>
      </View>
    </View>
  );
}

function EmptyState({ onGenerate, isGenerating }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🤖</Text>
      <Text style={styles.emptyTitle}>AI Coach</Text>
      <Text style={styles.emptySubtitle}>
        Get personalized workout recommendations based on your profile, routines, and exercise history.
      </Text>
      <Pressable
        style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
        onPress={onGenerate}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <View style={styles.generatingRow}>
            <ActivityIndicator color="#FFFFFF" size="small" />
            <Text style={styles.generateButtonText}>Analyzing your data...</Text>
          </View>
        ) : (
          <Text style={styles.generateButtonText}>Generate Recommendations</Text>
        )}
      </Pressable>
    </View>
  );
}

export default function AICoachScreen() {
  const queryClient = useQueryClient();
  const [recommendations, setRecommendations] = useState(null);
  const [generatedAt, setGeneratedAt] = useState(null);

  // Fetch cached recommendations on mount
  const { data: cachedData, isLoading: isLoadingCached } = useQuery({
    queryKey: ['aiRecommendations', USER_ID],
    queryFn: () => getCachedRecommendations(USER_ID),
  });

  useEffect(() => {
    if (cachedData?.cached && cachedData?.recommendations) {
      setRecommendations(cachedData.recommendations);
      setGeneratedAt(cachedData.generatedAt);
    }
  }, [cachedData]);

  // Generate new recommendations
  const generateMutation = useMutation({
    mutationFn: () => getAIRecommendations(USER_ID),
    onSuccess: (data) => {
      if (data?.recommendations) {
        setRecommendations(data.recommendations);
        setGeneratedAt(data.generatedAt);
        queryClient.invalidateQueries(['aiRecommendations', USER_ID]);
      }
    },
    onError: (error) => {
      console.error('Failed to generate recommendations:', error);
    },
  });

  const handleGenerate = () => {
    generateMutation.mutate();
  };

  const isGenerating = generateMutation.isPending;

  if (isLoadingCached) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'AI Coach' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'AI Coach' }} />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isGenerating}
            onRefresh={handleGenerate}
            tintColor="#007AFF"
          />
        }
      >
        {!recommendations ? (
          <EmptyState onGenerate={handleGenerate} isGenerating={isGenerating} />
        ) : (
          <>
            {/* Header with regenerate */}
            <View style={styles.header}>
              <View>
                <Text style={styles.headerTitle}>Your AI Analysis</Text>
                <TimeSince date={generatedAt} />
              </View>
              <Pressable
                style={[styles.refreshButton, isGenerating && styles.refreshButtonDisabled]}
                onPress={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <ActivityIndicator color="#007AFF" size="small" />
                ) : (
                  <Text style={styles.refreshButtonText}>↻ Refresh</Text>
                )}
              </Pressable>
            </View>

            {/* Error message */}
            {generateMutation.isError && (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>
                  Failed to generate new recommendations. Pull down to retry.
                </Text>
              </View>
            )}

            {/* Summary */}
            <SummaryCard summary={recommendations.summary} />

            {/* Progression Tips */}
            <ProgressionSection tips={recommendations.progressionTips} />

            {/* Weak Points */}
            <WeakPointsSection weakPoints={recommendations.weakPoints} />

            {/* Routine Suggestions */}
            <RoutineSuggestionsSection suggestions={recommendations.routineSuggestions} />

            {/* Recovery */}
            <RecoverySection tips={recommendations.recoveryTips} />

            {/* Body Composition */}
            <BodyCompSection advice={recommendations.bodyCompositionAdvice} />

            <View style={styles.bottomPadding} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  generatedAt: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
  refreshButton: {
    backgroundColor: '#E8F0FE',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  refreshButtonDisabled: {
    opacity: 0.6,
  },
  refreshButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#007AFF',
  },

  // Error
  errorCard: {
    backgroundColor: '#FFF0F0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFD0D0',
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '500',
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 72,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A1A2E',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    fontWeight: '500',
  },
  generateButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    width: '100%',
    alignItems: 'center',
  },
  generateButtonDisabled: {
    opacity: 0.7,
  },
  generateButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  generatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  // Summary
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  summaryIcon: {
    fontSize: 28,
  },
  summaryText: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A2E',
    lineHeight: 23,
    fontWeight: '500',
  },

  // Sections
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 12,
  },

  // Progression Tips
  tipCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  tipHeader: {
    marginBottom: 10,
  },
  exerciseBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  exerciseBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2E7D32',
  },
  tipRow: {
    marginBottom: 6,
  },
  tipLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  tipValue: {
    fontSize: 14,
    color: '#3C3C43',
    lineHeight: 20,
  },
  tipRecommendation: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '600',
    lineHeight: 22,
  },
  tipReasoning: {
    fontSize: 13,
    color: '#8E8E93',
    fontStyle: 'italic',
    marginTop: 6,
    lineHeight: 19,
  },

  // Weak Points
  weakPointCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  weakPointArea: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 6,
  },
  weakPointExplanation: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 10,
  },
  fixContainer: {
    backgroundColor: '#FFF8F0',
    borderRadius: 8,
    padding: 10,
  },
  fixLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF9500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  fixText: {
    fontSize: 14,
    color: '#1A1A2E',
    lineHeight: 20,
    fontWeight: '500',
  },

  // Routine Suggestions
  suggestionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  suggestionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 6,
    lineHeight: 22,
  },
  suggestionReason: {
    fontSize: 13,
    color: '#8E8E93',
    lineHeight: 19,
  },

  // Recovery
  recoveryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  recoveryBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#5856D6',
    marginTop: 6,
  },
  recoveryText: {
    flex: 1,
    fontSize: 14,
    color: '#3C3C43',
    lineHeight: 20,
  },

  // Body Composition
  bodyCompCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  bodyCompText: {
    fontSize: 15,
    color: '#1A1A2E',
    lineHeight: 23,
    fontWeight: '500',
  },

  bottomPadding: {
    height: 40,
  },
});
