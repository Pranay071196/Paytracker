import { useRef, useState, useCallback, useEffect } from 'react'

const SWIPE_THRESHOLD = 80
const TRANSITION_DURATION = 250

const styles = {
  wrapper: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 'inherit',
  },
  content: {
    position: 'relative',
    zIndex: 2,
    background: 'inherit',
    transition: `transform ${TRANSITION_DURATION}ms cubic-bezier(0.32, 0.72, 0, 1)`,
    touchAction: 'pan-y',
    userSelect: 'none',
  },
  actions: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'stretch',
    zIndex: 1,
    paddingLeft: 24,
  },
  actionBtn: {
    border: 'none',
    color: '#fff',
    fontWeight: 700,
    fontSize: '0.8rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: '0 18px',
    minWidth: 72,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
    outline: 'none',
    WebkitTapHighlightColor: 'transparent',
  },
}

const actionColors = {
  delete: { bg: '#dc2626' },
  edit: { bg: '#2563eb' },
  pay: { bg: '#059669' },
  view: { bg: '#1a5f4a' },
  archive: { bg: '#6b7280' },
}

const actionIcons = {
  delete: '🗑',
  edit: '✏️',
  pay: '💳',
  view: '👁',
  archive: '📦',
}

const actionLabels = {
  delete: 'Delete',
  edit: 'Edit',
  pay: 'Pay',
  view: 'View',
  archive: 'Archive',
}

let activeSwipeId = null

export default function SwipeableCard({
  children,
  actions = [],
  id,
  className = '',
  style = {},
  onSwipeStart,
  onSwipeEnd,
}) {
  const contentRef = useRef(null)
  const [translateX, setTranslateX] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const startX = useRef(0)
  const currentX = useRef(0)
  const swipeId = useRef(SwipeableCard._nextId++)

  const actionWidth = actions.length * 72 + 24

  const resetSwipe = useCallback(() => {
    setTranslateX(0)
    setIsOpen(false)
    if (activeSwipeId === swipeId.current) activeSwipeId = null
  }, [])

  const openSwipe = useCallback(() => {
    setTranslateX(-actionWidth)
    setIsOpen(true)
    activeSwipeId = swipeId.current
  }, [actionWidth])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isOpen && contentRef.current && !contentRef.current.contains(e.target)) {
        resetSwipe()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside, { passive: true })
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isOpen, resetSwipe])

  useEffect(() => {
    if (isOpen && activeSwipeId !== swipeId.current) {
      resetSwipe()
    }
  }, [isOpen, resetSwipe])

  const handleStart = useCallback((clientX) => {
    if (activeSwipeId !== null && activeSwipeId !== swipeId.current) return
    startX.current = clientX
    currentX.current = clientX
    setIsDragging(true)
    onSwipeStart?.()
  }, [onSwipeStart])

  const handleMove = useCallback((clientX) => {
    if (!isDragging) return
    currentX.current = clientX
    const diff = startX.current - clientX
    const newTranslate = Math.max(-actionWidth, Math.min(0, diff))
    setTranslateX(newTranslate)
  }, [isDragging, actionWidth])

  const handleEnd = useCallback(() => {
    if (!isDragging) return
    setIsDragging(false)
    const diff = startX.current - currentX.current
    if (diff > SWIPE_THRESHOLD) {
      openSwipe()
    } else if (diff < -SWIPE_THRESHOLD / 2 && isOpen) {
      resetSwipe()
    } else if (isOpen) {
      openSwipe()
    } else {
      resetSwipe()
    }
    onSwipeEnd?.()
  }, [isDragging, isOpen, openSwipe, resetSwipe, onSwipeEnd])

  const onTouchStart = useCallback((e) => {
    handleStart(e.touches[0].clientX)
  }, [handleStart])

  const onTouchMove = useCallback((e) => {
    handleMove(e.touches[0].clientX)
  }, [handleMove])

  const onTouchEnd = useCallback(() => {
    handleEnd()
  }, [handleEnd])

  const onMouseDown = useCallback((e) => {
    if (e.button !== 0) return
    handleStart(e.clientX)
  }, [handleStart])

  const onMouseMove = useCallback((e) => {
    handleMove(e.clientX)
  }, [handleMove])

  const onMouseUp = useCallback(() => {
    handleEnd()
  }, [handleEnd])

  const onActionClick = useCallback(async (action) => {
    if (action.handler) {
      await action.handler()
    }
    resetSwipe()
  }, [resetSwipe])

  return (
    <div
      className={className}
      style={{ ...styles.wrapper, ...style, borderRadius: undefined }}
      ref={contentRef}
    >
      <div
        style={{
          ...styles.actions,
          width: actionWidth,
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
      >
        {actions.map((action, i) => {
          const color = actionColors[action.type]?.bg || '#6b7280'
          return (
            <button
              key={action.type || i}
              style={{
                ...styles.actionBtn,
                background: color,
                borderRadius: i === actions.length - 1 ? '0 18px 18px 0' : '0',
              }}
              onClick={() => onActionClick(action)}
              aria-label={actionLabels[action.type] || action.type}
            >
              <span style={{ fontSize: '1.2rem' }}>{actionIcons[action.type] || '•'}</span>
              <span>{actionLabels[action.type] || action.type}</span>
            </button>
          )
        })}
      </div>

      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={isDragging ? onMouseMove : undefined}
        onMouseUp={onMouseUp}
        onMouseLeave={isDragging ? onMouseUp : undefined}
        style={{
          ...styles.content,
          transform: `translateX(${translateX}px)`,
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      >
        {children}
      </div>
    </div>
  )
}

SwipeableCard._nextId = 1
