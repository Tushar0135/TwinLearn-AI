export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const formatDateTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getDifficultyColor = (difficulty) => {
  switch (difficulty) {
    case 'Beginner':
      return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900';
    case 'Intermediate':
      return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900';
    case 'Advanced':
      return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900';
    default:
      return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900';
  }
};

export const getStatusColor = (status) => {
  switch (status) {
    case 'Completed':
      return 'text-green-600 dark:text-green-400';
    case 'In Progress':
      return 'text-blue-600 dark:text-blue-400';
    case 'Not Started':
      return 'text-gray-600 dark:text-gray-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
};

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  return password.length >= 6;
};

export const truncate = (text, length) => {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

export const calculateReadTime = (text) => {
  const wordsPerMinute = 200;
  const words = text.split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
};

export const getInitials = (name) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};
