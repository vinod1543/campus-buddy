import { Link } from 'react-router-dom'

const HomePage = () => {
  return (
    <div className="container">
      {/* Hero Section */}
      <section className="text-center" style={{ padding: '4rem 0' }}>
        <h1 className="text-3xl font-bold mb-4">
          Never Miss Another Campus Event! 🎉
        </h1>
        <p className="text-lg text-gray mb-4" style={{ maxWidth: '600px', margin: '0 auto' }}>
          Discover amazing events happening around campus, register with one click, 
          and get friendly reminders so you never miss out on the fun.
        </p>
        <div className="flex gap-4" style={{ justifyContent: 'center', marginTop: '2rem' }}>
          <Link to="/events" className="btn btn-primary btn-lg">
            Explore Events 🎪
          </Link>
          <Link to="/register" className="btn btn-secondary btn-lg">
            Join Campus Buddy
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '3rem 0' }}>
        <h2 className="text-2xl font-bold text-center mb-4">
          Why Students Love Campus Buddy
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
          <div className="card text-center">
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
            <h3 className="card-title">Easy Discovery</h3>
            <p className="text-gray">
              Find events by type, date, or search for exactly what interests you. 
              No more missing out because you didn't know it was happening!
            </p>
          </div>
          
          <div className="card text-center">
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
            <h3 className="card-title">Smart Reminders</h3>
            <p className="text-gray">
              Get friendly email reminders before your events. We'll make sure 
              you're prepared and never double-book yourself.
            </p>
          </div>
          
          <div className="card text-center">
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎯</div>
            <h3 className="card-title">One-Click Registration</h3>
            <p className="text-gray">
              Register for events instantly and keep track of everything in your 
              personal events dashboard. Simple and stress-free!
            </p>
          </div>
        </div>
      </section>

      {/* Event Types Section */}
      <section style={{ padding: '3rem 0' }}>
        <h2 className="text-2xl font-bold text-center mb-4">
          Find Your Perfect Event Type
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
          <div className="event-card technical">
            <h4 className="font-semibold mb-2">🔧 Technical</h4>
            <p className="text-sm text-gray">Hackathons, workshops, coding competitions</p>
          </div>
          
          <div className="event-card cultural">
            <h4 className="font-semibold mb-2">🎭 Cultural</h4>
            <p className="text-sm text-gray">Festivals, performances, art exhibitions</p>
          </div>
          
          <div className="event-card sports">
            <h4 className="font-semibold mb-2">⚽ Sports</h4>
            <p className="text-sm text-gray">Tournaments, matches, fitness activities</p>
          </div>
          
          <div className="event-card academic">
            <h4 className="font-semibold mb-2">📚 Academic</h4>
            <p className="text-sm text-gray">Seminars, conferences, guest lectures</p>
          </div>
          
          <div className="event-card club">
            <h4 className="font-semibold mb-2">🎪 Club</h4>
            <p className="text-sm text-gray">Club meetings, social gatherings</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center" style={{ padding: '3rem 0', backgroundColor: 'var(--neutral-white)', borderRadius: 'var(--radius-lg)', margin: '2rem 0' }}>
        <h2 className="text-2xl font-bold mb-4">
          Ready to Get Started? 🚀
        </h2>
        <p className="text-gray mb-4">
          Join hundreds of students who never miss the events they care about.
        </p>
        <Link to="/events" className="btn btn-primary btn-lg">
          Browse Events Now
        </Link>
      </section>
    </div>
  )
}

export default HomePage
