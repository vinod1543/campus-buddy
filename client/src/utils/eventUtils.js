// Event utility functions and constants

export const eventTypes = ['technical', 'cultural', 'sports', 'academic', 'clubs', 'volunteering']

export const getEventTypeEmoji = (type) => {
  const emojis = {
    technical: '🔧',
    cultural: '🎭',
    sports: '⚽',
    academic: '📚',
    clubs: '🎪',
    volunteering: '🤝'
  }
  return emojis[type] || '📅'
}

export const formatEventDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const getEventTypeDisplayName = (type) => {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

export const getEventTypeBadgeText = (type) => {
  return `${getEventTypeEmoji(type)} ${getEventTypeDisplayName(type)}`
}
