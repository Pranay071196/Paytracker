import { normalizeEmail, normalizePhoneNumber } from './LoginScreen'

describe('normalizeEmail', () => {
  it('trims and lowercases the email address', () => {
    expect(normalizeEmail('  User@Example.COM ')).toBe('user@example.com')
  })
})

describe('normalizePhoneNumber', () => {
  it('formats a 10-digit Indian mobile number to E.164', () => {
    expect(normalizePhoneNumber('98765 43210')).toBe('+919876543210')
  })

  it('preserves an existing international phone number', () => {
    expect(normalizePhoneNumber('+919876543210')).toBe('+919876543210')
  })
})
