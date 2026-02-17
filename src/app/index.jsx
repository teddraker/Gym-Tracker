import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router'; // Changed from Link to useRouter
import { useQuery } from '@tanstack/react-query';
import { getAllDayRoutines } from '../services/workoutService';

const DAYS = [
  { id: 'monday', name: 'Monday', shortName: 'Mon', color: '#FF6B6B' },
  { id: 'tuesday', name: 'Tuesday', shortName: 'Tue', color: '#4ECDC4' },
  { id: 'wednesday', name: 'Wednesday', shortName: 'Wed', color: '#45B7D1' },
  { id: 'thursday', name: 'Thursday', shortName: 'Thu', color: '#96CEB4' },
  { id: 'friday', name: 'Friday', shortName: 'Fri', color: '#FFEAA7' },
  { id: 'saturday', name: 'Saturday', shortName: 'Sat', color: '#DDA0DD' },
  { id: 'sunday', name: 'Sunday', shortName: 'Sun', color: '#98D8C8' },
];

const USER_ID = 'default_user';

export default function DaySelectionScreen() {
  const router = useRouter(); // Initialize the router hook

  const { data: routines } = useQuery({
    queryKey: ['dayRoutines', USER_ID],
    queryFn: () => getAllDayRoutines(USER_ID),
  });

  const getExerciseCount = (dayId) => {
    if (!routines) return 0;
    const routine = routines.find(r => r.day === dayId);
    return routine?.exercises?.length || 0;
  };

  const getTodayId = () => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[new Date().getDay()];
  };

  const todayId = getTodayId();

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome Back!</Text>
          <Text style={styles.subtitle}>Select a day to view or log your workout</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Pressable 
            style={styles.actionButton}
            onPress={() => router.push('/progress')}
          >
            <View style={styles.actionButtonContent}>
              <Text style={styles.actionButtonIcon}>📊</Text>
              <View style={styles.actionButtonText}>
                <Text style={styles.actionButtonTitle}>Progress Monitor</Text>
                <Text style={styles.actionButtonSubtitle}>Track your fitness journey</Text>
              </View>
              <Text style={styles.actionButtonArrow}>›</Text>
            </View>
          </Pressable>

          <Pressable 
            style={styles.actionButton}
            onPress={() => router.push('/profile')}
          >
            <View style={styles.actionButtonContent}>
              <Text style={styles.actionButtonIcon}>👤</Text>
              <View style={styles.actionButtonText}>
                <Text style={styles.actionButtonTitle}>Profile</Text>
                <Text style={styles.actionButtonSubtitle}>Body composition & metrics</Text>
              </View>
              <Text style={styles.actionButtonArrow}>›</Text>
            </View>
          </Pressable>

          <Pressable 
            style={[styles.actionButton, styles.aiActionButton]}
            onPress={() => router.push('/aiCoach')}
          >
            <View style={styles.actionButtonContent}>
              <Text style={styles.actionButtonIcon}>🤖</Text>
              <View style={styles.actionButtonText}>
                <Text style={styles.actionButtonTitle}>AI Coach</Text>
                <Text style={styles.actionButtonSubtitle}>Personalized recommendations</Text>
              </View>
              <Text style={styles.actionButtonArrow}>›</Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.daysContainer}>
          {DAYS.map((day) => {
            const exerciseCount = getExerciseCount(day.id);
            const isToday = day.id === todayId;
            
            return (
              <Pressable 
                key={day.id}
                onPress={() => router.push(`/day/${day.id}`)}
                style={({ pressed }) => [
                  styles.dayCard,
                  isToday && styles.todayCard,
                  pressed && styles.dayCardPressed,
                ]}
              >
                {/* Icon Container */}
                <View style={[styles.dayIconContainer, { backgroundColor: day.color + '20' }]}>
                  <Text style={[styles.dayShortName, { color: day.color }]}>{day.shortName}</Text>
                </View>

                {/* Text Content */}
                <View style={styles.dayContent}>
                  <View style={styles.dayHeader}>
                    <Text style={styles.dayName}>{day.name}</Text>
                    {isToday && (
                      <View style={styles.todayBadge}>
                        <Text style={styles.todayBadgeText}>TODAY</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.exerciseCount}>
                    {exerciseCount} {exerciseCount === 1 ? 'exercise' : 'exercises'} scheduled
                  </Text>
                </View>

                {/* Chevron */}
                <View style={[styles.chevronContainer, { backgroundColor: day.color + '15' }]}>
                  <Text style={[styles.chevron, { color: day.color }]}>›</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 28,
    paddingTop: 12,
  },
  greeting: {
    fontSize: 34,
    fontWeight: '800',
    color: '#1A1A2E',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  quickActions: {
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  aiActionButton: {
    backgroundColor: '#5856D6',
    shadowColor: '#5856D6',
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  actionButtonIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  actionButtonText: {
    flex: 1,
  },
  actionButtonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  actionButtonSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  actionButtonArrow: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  daysContainer: {
    gap: 14,
  },
  dayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  dayCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  todayCard: {
    borderWidth: 2,
    borderColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOpacity: 0.15,
  },
  dayIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayShortName: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dayContent: {
    flex: 1,
    paddingHorizontal: 14,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  dayName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  todayBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  todayBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  exerciseCount: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  chevronContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevron: {
    fontSize: 24,
    fontWeight: '600',
  },
});