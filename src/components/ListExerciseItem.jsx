import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Link } from 'expo-router';

export default function ListExerciseItem({ item }) {
  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
        return { bg: '#D1FAE5', text: '#065F46' };
      case 'intermediate':
        return { bg: '#FEF3C7', text: '#92400E' };
      case 'expert':
        return { bg: '#FEE2E2', text: '#991B1B' };
      default:
        return { bg: '#E5E5EA', text: '#8E8E93' };
    }
  };

  const formatName = (name) => {
    if (!name) return '';
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const difficultyColor = getDifficultyColor(item.difficulty);

  return (
    <Link href={`/${item.name}`} asChild>
      <Pressable style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={2}>
            {formatName(item.name)}
          </Text>
          <View style={[styles.difficultyBadge, { backgroundColor: difficultyColor.bg }]}>
            <Text style={[styles.difficultyText, { color: difficultyColor.text }]}>
              {item.difficulty}
            </Text>
          </View>
        </View>
        
        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Muscle</Text>
            <Text style={styles.detailValue}>{formatName(item.muscle)}</Text>
          </View>
          
          {item.equipments && item.equipments.length > 0 && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Equipment</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                {item.equipments.map(formatName).join(', ')}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    flex: 1,
    marginRight: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  details: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
    width: 80,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#48484A',
    flex: 1,
    textTransform: 'capitalize',
  },
});
