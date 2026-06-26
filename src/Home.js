import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'

const options = [
  { id: 'sports', label: 'Sports Team' },
  { id: 'study', label: 'Study Group' },
  { id: 'community', label: 'Community Event' },
  { id: 'music', label: 'Music Jam' },
]

export default function Home() {
  const [selected, setSelected] = useState(null)
  const navigate = useNavigate()

  return (
    <div className="home-page container">
      <div className="home-card">
        <h1>What would you like to do?</h1>
        {!selected ? (
          <>
            <p>Select an option to continue:</p>
            <div className="options-grid">
              {options.map((option) => (
                <button
                  key={option.id}
                  className="option-card"
                  onClick={() => setSelected(option)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <p>
              You selected <strong>{selected.label}</strong>. Would you like to
              organise or participate?
            </p>
            <div className="action-row">
              <button
                className="button primary"
                onClick={() => navigate('/organize', { state: { option: selected } })}
              >
                Organise
              </button>
              <button
                className="button"
                onClick={() => navigate('/participate', { state: { option: selected } })}
              >
                Participate
              </button>
            </div>
            <button className="button secondary" onClick={() => setSelected(null)}>
              Choose another option
            </button>
          </>
        )}
        <div className="home-footer">
          <button className="button secondary" onClick={() => supabase.auth.signOut()}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
