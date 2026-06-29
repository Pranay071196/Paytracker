# Mobile UI Enhancement Plan for Paytracker

## Goals
- Make every screen feel native on mobile (smooth transitions, proper spacing, safe areas)
- Standardise padding/margin across all pages
- Add entrance/exit animations for screens, modals, and lists
- Improve touch targets and feedback
- Add safe-area insets for notch phones

---

## 1. Global Improvements (`pages.css`)

### 1.1 Safe Area Insets (notch phones)
```css
:root {
  --sat: env(safe-area-inset-top, 0px);
  --sar: env(safe-area-inset-right, 0px);
  --sab: env(safe-area-inset-bottom, 0px);
  --sal: env(safe-area-inset-left, 0px);
}

.app-wrapper {
  padding-top: var(--sat);
  padding-bottom: var(--sab);
  padding-left: var(--sal);
  padding-right: var(--sar);
}
```

### 1.2 Smooth Scrolling
```css
html {
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}
```

### 1.3 Page transitions (shared across all route pages)
```css
.page-dashboard,
.page-participant,
.page-collections,
.page-reconcile,
.page-settings {
  animation: fadeSlideUp 0.35s ease-out;
}

@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### 1.4 Improved tap highlights
```css
* {
  -webkit-tap-highlight-color: transparent;
}

button, a, .clickable {
  touch-action: manipulation;
}
```

### 1.5 Consistent card-based layout standard
Standardise the page structure to:
```css
.page-screen {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
```

### 1.6 Safe area bottom padding for footer
```css
.page-dashboard,
.page-participant,
.page-collections,
.page-reconcile,
.page-settings {
  padding-bottom: calc(100px + var(--sab, 0px));
}
```

---

## 2. Landing Page

### 2.1 Full-height hero with better spacing
- Reduce top padding from `24px` to `20px` on mobile
- Add `padding-top: calc(24px + var(--sat))` for notch
- Increase gap between sections for thumb reach

### 2.2 Stat cards animation
- Add `animation: fadeSlideUp` with staggered delays:
  - card 1: `0.1s`
  - card 2: `0.2s`
  - card 3: `0.3s`

### 2.3 CTA buttons
- Make buttons full-width on mobile (already done)
- Add `active` state scale transform: `transform: scale(0.97)` on press
- Increase bottom margin for thumb zone

### 2.4 Spacing audit
| Element | Current | Change to |
|---------|---------|-----------|
| `.page.landing-page` padding | `24px` | `20px` |
| `.stats-card` margin-top | `32px` | `28px` |
| `.section` margin-top | `48px` | `36px` |
| `.actions` margin-top | `36px` | `28px` |

---

## 3. Login & Code Verification Screens

### 3.1 Card entrance animation
```css
.card {
  animation: cardEnter 0.4s ease-out;
}

@keyframes cardEnter {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(12px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
```

### 3.2 Better spacing on small screens
| Element | Current | Change to (mobile) |
|---------|---------|--------------------|
| `.screen` padding | `20px` | `16px` |
| `.card-header` padding | `32px 28px 24px` | `28px 24px 20px` |
| `.input-panel` padding | `0 28px 28px` | `0 24px 24px` |
| `.footer` padding | `26px 28px 32px` | `20px 24px calc(24px + var(--sab))` |
| `.input-row` grid-template-columns | `96px minmax(0, 1fr)` | Keep (good) |

### 3.3 Input focus improvements
```css
.input:focus,
.form-input:focus {
  border-color: #14b8a6;
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.15);
  outline: none;
}
```

### 3.4 Code Verification Screen
- PIN cells: increase touch target with `min-height: 60px`
- Add `@media (max-width: 380px)` to reduce pin cell gap from `12px` to `8px`
- Animate the "Resend" button: disable + countdown visual

### 3.5 Bottom button area
- Ensure buttons are in the thumb-friendly zone (bottom of screen)
- Add extra bottom padding for safe area on verification screen

---

## 4. Role Selection

### 4.1 Card option animation
```css
.card-role {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-role:active {
  transform: scale(0.98);
}
```

### 4.2 Spacing audit
| Element | Current | Change to |
|---------|---------|-----------|
| `.screen-alt` padding | `24px` | `20px` |
| `.content-alt` padding | `30px 28px 24px` | `24px 22px 20px` |
| `.card-role` padding | `22px 20px` | `18px 16px` (on <400px) |
| `.continue` button margin | `24px` | `16px` (bottom: calc(16px + var(--sab))) |

### 4.3 Staggered entrance for the two role cards
```css
.card-role:nth-child(1) { animation-delay: 0.1s; }
.card-role:nth-child(2) { animation-delay: 0.2s; }
```

---

## 5. Organiser Dashboard

### 5.1 Page entrance animation
- Already covered by global `.page-dashboard` animation

### 5.2 Summary card improvements
```css
.summary-card {
  transition: all 0.3s ease;
}

.amount {
  font-size: clamp(2rem, 8vw, 3rem); /* Responsive font size */
}
```

### 5.3 Actions grid — improve for small screens
- At `max-width: 400px`: reduce grid to `repeat(2, 1fr)` (2x2 instead of 4x1)
- At `max-width: 320px`: keep 2 columns but smaller icons

```css
@media (max-width: 400px) {
  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

### 5.4 Action cards — press feedback
```css
.action-card:active {
  transform: scale(0.95);
  transition: transform 0.15s;
}
```

### 5.5 Status pills — better touch layout
- Current: 3 pills in a row with `padding: 16px 14px`
- Change to: `padding: 14px 10px` on small screens
- Keep as-is on larger screens

### 5.6 Spacing audit
| Element | Current | Change to |
|---------|---------|-----------|
| `.page-dashboard` padding | `28px 18px 20px` | `24px 16px` |
| `.panel` padding | `26px 22px` | `22px 18px` |
| `.header-dash` gap | `18px` | `14px` |
| `.summary-card` padding | `24px` | `20px` |
| `.status-pill` padding | `16px 14px` | `12px 10px` (on <400px) |
| `.actions-grid` gap | `12px` | `10px` |
| `.action-card` padding | `16px 0` | `14px 0` |

### 5.7 Recent collections list
- Add `active` state to recent items: `transform: scale(0.98)`
- Add `gap` between items: already `12px`, good

---

## 6. Participant Dashboard

### 6.1 Pending card — accent animation
```css
.pending-card {
  transition: all 0.3s ease;
}

.pending-amount {
  font-size: clamp(2rem, 7vw, 2.5rem);
}
```

### 6.2 Collection items — swipe-like feedback
```css
.collection-item:active {
  transform: scale(0.98);
  background: rgba(15, 23, 42, 0.6);
}
```

### 6.3 Spacing audit
| Element | Current | Change to |
|---------|---------|-----------|
| `.page-participant` padding | `28px 18px 100px` | `24px 16px calc(100px + var(--sab))` |
| `.panel-participant` padding | `26px 22px` | `22px 18px` |
| `.pending-card` padding | `22px` | `18px` |
| `.collection-item` padding | `16px` | `14px 12px` |

---

## 7. Create Collection (Modal)

### 7.1 Slide-up modal animation (native feel)
```css
.modal-card {
  animation: slideUp 0.35s cubic-bezier(0.32, 0.72, 0, 1);
  transform-origin: bottom center;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(100%) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
```

### 7.2 Overlay fade
```css
.modal-screen {
  animation: fadeIn 0.25s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

### 7.3 Align modal to bottom on mobile
Instead of centered, the modal should come from the bottom on mobile:
```css
@media (max-width: 640px) {
  .modal-screen {
    align-items: flex-end;
    padding: 0;
  }

  .modal-card {
    width: 100%;
    border-radius: 36px 36px 0 0;
    max-height: 92vh;
    max-height: calc(92vh - var(--sat, 0px));
  }
}
```

### 7.4 Category grid — better small-screen layout
- Current: always 3 columns
- On `max-width: 380px`: reduce gap from `12px` to `8px`

### 7.5 Spacing audit
| Element | Current | Change to (mobile) |
|---------|---------|--------------------|
| `.modal-card` padding | - | Full-width on <640px, rounded-top corners |
| `.modal-header` padding | `24px 28px 20px` | `20px 22px 16px` |
| `.modal-content` padding | `28px` | `22px` |
| `.modal-footer` padding | `24px 28px` | `20px 22px calc(20px + var(--sab))` |
| `.form-group` margin-bottom | `28px` | `22px` |
| `.category-btn` padding | `14px 12px` | `12px 10px` |

### 7.6 Close button — bigger touch target
```css
.close-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### 7.7 Participants list — add removal animation
```css
.participant-tag {
  animation: tagIn 0.25s ease;
}

@keyframes tagIn {
  from {
    opacity: 0;
    transform: translateX(-12px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

---

## 8. All Collections

### 8.1 Collection cards — staggered entrance
```css
.collection-card {
  animation: fadeSlideUp 0.35s ease-out both;
}

.collection-card:nth-child(1) { animation-delay: 0.05s; }
.collection-card:nth-child(2) { animation-delay: 0.1s; }
.collection-card:nth-child(3) { animation-delay: 0.15s; }
/* etc for up to ~10 cards */
```

### 8.2 Filter tabs — horizontal scroll polish
- Add `scroll-snap-type: x mandatory` for snap scrolling
- Add `gap` between tabs: already `12px`, good
- Add `padding: 0 2px` for overscroll indicator

### 8.3 Delete button visibility on mobile
- Currently: `.delete-btn { opacity: 0 }` — hidden until hover
- On mobile (no hover): always show or show on long-press
- Change to:
  ```css
  @media (max-width: 640px) {
    .collection-card .delete-btn {
      opacity: 0.6;
    }
  }
  ```

### 8.4 Spacing audit
| Element | Current | Change to |
|---------|---------|-----------|
| `.page-collections` padding | `28px 18px 100px` | `24px 16px calc(100px + var(--sab))` |
| `.panel-collections` padding | `26px 22px` | `22px 18px` |
| `.collection-card` padding | `18px` | `16px` |
| `.collections-grid` gap | `16px` | `14px` |

---

## 9. Reconcile Page

### 9.1 Upload zone — active state
```css
.upload-zone:active {
  transform: scale(0.98);
  border-color: #14b8a6;
}
```

### 9.2 Spacing audit
| Element | Current | Change to |
|---------|---------|-----------|
| `.page-reconcile` padding | `28px 18px 100px` | `24px 16px calc(100px + var(--sab))` |
| `.panel-reconcile` padding | `26px 22px` | `22px 18px` |
| `.upload-zone` padding | `40px 24px` | `32px 18px` |
| `.reconcile-item` padding | `18px` | `16px` |

---

## 10. Settings Page

### 10.1 Settings items — active press state
```css
.settings-item:active {
  opacity: 0.7;
  transform: translateX(4px);
}
```

### 10.2 Spacing audit
| Element | Current | Change to |
|---------|---------|-----------|
| `.page-settings` padding | `28px 18px 100px` | `24px 16px calc(100px + var(--sab))` |
| `.panel-settings` padding | `26px 22px` | `22px 18px` |
| `.settings-item` padding | `18px 0` | `16px 0` |
| `.settings-header` gap | `16px` | `14px` |

---

## 11. Header & Footer

### 11.1 Header scroll behavior
```css
.app-header {
  transition: transform 0.3s ease, background-color 0.3s ease;
}

.app-header.header-hidden {
  transform: translateY(-100%);
}
```
(Implement scroll-down-to-hide via JS in a follow-up)

### 11.2 Bottom nav active indicator animation
```css
.footer-item.active {
  animation: navActive 0.3s ease;
}

@keyframes navActive {
  0% { transform: scale(1); }
  50% { transform: scale(0.92); }
  100% { transform: scale(1); }
}

.footer-item:active {
  transform: scale(0.92);
}
```

### 11.3 Footer spacing
| Element | Current | Change to |
|---------|---------|-----------|
| `.app-footer` padding | `12px 20px 24px` | `10px 16px calc(16px + var(--sab))` |
| `.footer-item` padding | `12px 8px` | `10px 6px` |
| `.footer-content` gap | `10px` | `8px` |

### 11.4 Header spacing
| Element | Current | Change to |
|---------|---------|-----------|
| `.app-header` padding | `12px 20px` | `10px 16px` |
| `.simple-header` padding | `12px 20px` | `10px 16px` |
| `.header-btn.icon-btn` size | `40px` | `44px` (better touch target) |

---

## 12. Accessibility & Touch

### 12.1 Minimum touch targets
```css
/* Ensure all interactive elements are at least 44x44 */
.header-btn.icon-btn,
.close-btn,
.add-btn,
.footer-item,
.category-btn,
.action-card,
.delete-btn {
  min-width: 44px;
  min-height: 44px;
}
```

### 12.2 Active/disabled states
- All buttons should have a visible `:active` state (scale down or opacity)
- Disabled buttons: `opacity: 0.5; cursor: not-allowed;`

### 12.3 Font scaling
- Use `clamp()` for key font sizes so they scale down on very small screens:
  | Element | Current | Change to |
  |---------|---------|-----------|
  | `.title-dash`, `.title-p` | `2rem` | `clamp(1.5rem, 5vw, 2rem)` |
  | `.collections-header h1` | `2rem` | `clamp(1.5rem, 5vw, 2rem)` |
  | `.panel-reconcile h1` | `2rem` | `clamp(1.5rem, 5vw, 2rem)` |
  | `.amount` | `3rem` | `clamp(2rem, 8vw, 3rem)` |

---

## 13. Implementation Order

| Phase | Items | Effort |
|-------|-------|--------|
| **1. Spacing & safe areas** | All spacing changes from sections 2–11 | ~2h |
| **2. Page transitions** | `fadeSlideUp` keyframe + apply to all pages | ~30min |
| **3. Modal slide-up** | Bottom-aligned modal on mobile + slideUp animation | ~45min |
| **4. Card/button press states** | `:active` transforms on all interactive elements | ~30min |
| **5. List animations** | Staggered entrance for collection cards, recent items, participant tags | ~30min |
| **6. Touch target audit** | Ensure 44x44 minimum for all interactive elements | ~20min |
| **7. Footer active animation** | Bounce animation on nav item active | ~15min |
| **8. Font scaling** | Replace fixed font sizes with `clamp()` | ~15min |
| **Total** | | **~5h** |

---

## 14. Files to change

| File | Changes |
|------|---------|
| `src/pages.css` | All spacing adjustments, new keyframes, safe area vars, media queries, `:active` states, font scaling |
| `src/App.js` | Add `html { scroll-behavior: smooth }` (already global, verify) |
| `src/index.css` | Add CSS custom properties for safe area, -webkit-overflow-scrolling |

---

## 15. Swipeable Cards (new feature)

### 15.1 New component: `src/SwipeableCard.js`

A reusable wrapper that lets users swipe left to reveal action buttons on any card/list item.

**Touch mechanics:**
- Swipe left ≥ 80px → snap open, revealing action buttons
- Swipe right or tap outside → snap closed
- Only one card open at a time (auto-closes others)
- Works with touch and mouse drag

**Configurable actions per card type:**

| Screen | List item | Actions |
|--------|-----------|---------|
| Organiser Dashboard | Recent collection | Delete, View |
| Participant Dashboard | Due collection | Pay, View |
| All Collections | Collection card | Edit, Delete |

**Visual design:**
- Actions slide in from the right as colored buttons (red=delete, blue=edit, green=pay)
- Each button has an icon + label
- Smooth `cubic-bezier` transition (250ms)
- Content has `grab` cursor during drag

### 15.2 CSS additions for swipeable cards

```css
.recent-item:active,
.collection-card:active,
.collection-item:active {
  transform: scale(0.98);
  transition: transform 0.15s;
}
```

### 15.3 Files changed

| File | Change |
|------|--------|
| `src/SwipeableCard.js` | **New** — touch/swipe handler component |
| `src/OrganiserDashboard.js` | Import SwipeableCard, wrap recent items with Delete/View actions |
| `src/ParticipantDashboard.js` | Import SwipeableCard, wrap collection items with Pay/View actions |
| `src/AllCollections.js` | Import SwipeableCard, wrap collection cards with Edit/Delete actions (removed old `button.delete-btn`) |
| `src/pages.css` | Added `:active` scale transforms for cards |

---

## 13. (revised) Implementation Order

| Phase | Items | Effort |
|-------|-------|--------|
| **1. Spacing & safe areas** | All spacing changes from sections 2–11 | ~2h |
| **2. Page transitions** | `fadeSlideUp` keyframe + apply to all pages | ~30min |
| **3. Modal slide-up** | Bottom-aligned modal on mobile + slideUp animation | ~45min |
| **4. Swipeable cards** | SwipeableCard component + integration in 3 pages | ~1.5h |
| **5. Card/button press states** | `:active` transforms on all interactive elements | ~30min |
| **6. List animations** | Staggered entrance for collection cards, recent items, participant tags | ~30min |
| **7. Touch target audit** | Ensure 44x44 minimum for all interactive elements | ~20min |
| **8. Footer active animation** | Bounce animation on nav item active | ~15min |
| **9. Font scaling** | Replace fixed font sizes with `clamp()` | ~15min |
| **Total** | | **~6.5h** |
