export const getDifficultyColor = (difficulty) => {
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
