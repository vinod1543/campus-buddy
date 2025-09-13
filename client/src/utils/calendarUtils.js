// Google Calendar direct integration utility

/**
 * Formats date for Google Calendar URLs
 * @param {string|Date} date - Date to format
 * @returns {string} - Formatted date string for Google Calendar URLs
 */
export const formatCalendarDate = (date) => {
  const d = new Date(date)
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

/**
 * Generates Google Calendar URL for direct calendar integration
 * @param {Object} event - Event object with title, description, startAt, endAt, venue
 * @returns {string} - Google Calendar URL
 */
export const generateGoogleCalendarUrl = (event) => {
  const startTime = formatCalendarDate(event.startAt)
  const endTime = event.endAt ? formatCalendarDate(event.endAt) : formatCalendarDate(new Date(new Date(event.startAt).getTime() + 2 * 60 * 60 * 1000)) // Default 2 hours
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${startTime}/${endTime}`,
    details: `${event.description || 'Campus event'}\n\nOrganized by: ${event.organizer || 'Campus Event Buddy'}\n\nRegistered via Campus Event Buddy`,
    location: event.venue || 'TBD',
    sprop: 'website:campusbuddy.com'
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
