export const formatCurrency = (value: number): string => {
  return `${value.toFixed(2)} MAD`;
};

export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatTime = (time: string): string => {
  return time;
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
}; 