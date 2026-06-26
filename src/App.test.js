import { render } from '@testing-library/react'
import App, { getPostAuthRedirectPath } from './App'

describe('getPostAuthRedirectPath', () => {
  it('routes users from auth screens to role selection after sign-in', () => {
    expect(getPostAuthRedirectPath('/login', { access_token: 'token' })).toBe('/select-role')
    expect(getPostAuthRedirectPath('/verify-code', { access_token: 'token' })).toBe('/select-role')
  })

  it('keeps logged-in users on home for other routes', () => {
    expect(getPostAuthRedirectPath('/home', { access_token: 'token' })).toBe('/home')
  })
})

test('renders', () => {
  render(<App />)
})
