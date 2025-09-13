import { generateGoogleCalendarUrl } from '../utils/calendarUtils'

const AddToCalendar = ({ event, className = '', buttonStyle = 'primary' }) => {
  const handleGoogleCalendarClick = () => {
    const googleUrl = generateGoogleCalendarUrl(event)
    window.open(googleUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <button
      className={`btn btn-${buttonStyle} ${className}`}
      onClick={handleGoogleCalendarClick}
      type="button"
      title="Add to Google Calendar"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        whiteSpace: 'nowrap'
      }}
    >
      <span>📅</span>
      <span className="calendar-text">
        <span className="desktop-text">Add to Google Calendar</span>
        <span className="mobile-text">Add to Calendar</span>
      </span>
      
      <style jsx>{`
        .desktop-text {
          display: inline;
        }
        
        .mobile-text {
          display: none;
        }
        
        @media (max-width: 480px) {
          .desktop-text {
            display: none;
          }
          
          .mobile-text {
            display: inline;
          }
        }
      `}</style>
    </button>
  )
}

export default AddToCalendar
