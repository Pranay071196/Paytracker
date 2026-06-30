import { useRef } from 'react'
import './SwipeableCard.css'

export default function SwipeableCard({ children, id, actions = [] }) {
  const cardRef = useRef(null)
  const startX = useRef(0)
  const translateX = useRef(0)
  const isDragging = useRef(false)

  const LABEL_WIDTH = 80

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX
    isDragging.current = true
  }

  const handleTouchMove = (e) => {
    if (!isDragging.current) return
    const currentX = e.touches[0].clientX
    const diff = currentX - startX.current
    const maxSwipe = -(actions.length * LABEL_WIDTH)
    translateX.current = Math.max(maxSwipe, Math.min(0, diff))
    if (cardRef.current) {
      cardRef.current.style.transform = `translateX(${translateX.current}px)`
    }
  }

  const handleTouchEnd = () => {
    isDragging.current = false
    const actionIndex = Math.round(Math.abs(translateX.current) / LABEL_WIDTH)
    if (actionIndex > 0 && actionIndex <= actions.length) {
      const action = actions[actionIndex - 1]
      if (action) action.handler()
    }
    if (cardRef.current) {
      cardRef.current.style.transform = ''
      cardRef.current.style.transition = ''
    }
    translateX.current = 0
  }

  return (
    <div className="swipeable-card-container" style={{ position: 'relative', overflow: 'hidden', borderRadius: 'inherit' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          zIndex: 1,
        }}
      >
        {actions.map((action, i) => {
          const colors = { view: '#3b82f6', edit: '#3b82f6', delete: '#ef4444', pay: '#059669' }
          const icons = { view: '👁', edit: '✏️', delete: '🗑', pay: '💳' }
          return (
            <button
              key={action.type + i}
              onClick={action.handler}
              style={{
                width: LABEL_WIDTH,
                background: (colors)[action.type] || '#6b7280',
                color: '#fff',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
              }}
              aria-label={action.type}
            >
              {(icons)[action.type] || '•'}
            </button>
          )
        })}
      </div>
      <div
        ref={cardRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ position: 'relative', zIndex: 2, background: 'inherit', transition: isDragging.current ? 'none' : 'transform 0.3s ease' }}
      >
        {children}
      </div>
    </div>
  )
}
