import { parseCSV, validateUTR, findMatches } from './reconcileHelpers'

describe('parseCSV', () => {
  it('parses a standard bank CSV with date, description, amount columns', () => {
    const csv = `Date,Description,Amount\n01/04/2025,Payment for supplies,1500.00\n02/04/2025,Refund order #123,250.00`
    const result = parseCSV(csv)
    expect(result).toHaveLength(2)
    expect(result[0].date).toBe('2025-04-01')
    expect(result[0].description).toBe('Payment for supplies')
    expect(result[0].amount).toBe(1500)
    expect(result[1].amount).toBe(250)
  })

  it('parses debit/credit columns and uses the non-zero value', () => {
    const csv = `Date,Narration,Debit,Credit\n01/04/2025,Transaction A,1000,\n02/04/2025,Transaction B,,500`
    const result = parseCSV(csv)
    expect(result).toHaveLength(2)
    expect(result[0].amount).toBe(1000)
    expect(result[1].amount).toBe(500)
  })

  it('extracts UTR when column is present', () => {
    const csv = `Date,Description,Amount,UTR\n01/04/2025,Payment,1500,ABC123456789`
    const result = parseCSV(csv)
    expect(result[0].utr).toBe('ABC123456789')
  })

  it('handles quoted fields containing commas', () => {
    const csv = `Date,Description,Amount\n01/04/2025,"Payment, for supplies",1500`
    const result = parseCSV(csv)
    expect(result).toHaveLength(1)
    expect(result[0].description).toBe('Payment, for supplies')
  })

  it('returns empty array for empty input', () => {
    expect(parseCSV('')).toEqual([])
    expect(parseCSV('Date,Amount\n')).toEqual([])
  })

  it('handles YYYY/MM/DD date format', () => {
    const csv = `Date,Amount\n2025/04/01,1000`
    const result = parseCSV(csv)
    expect(result[0].date).toBe('2025-04-01')
  })

  it('strips currency symbols from amount', () => {
    const csv = `Date,Description,Amount\n01/04/2025,Payment,"₹1,500.00"`
    const result = parseCSV(csv)
    expect(result[0].amount).toBe(1500)
  })
})

describe('validateUTR', () => {
  it('accepts a 12-character alphanumeric UTR', () => {
    expect(validateUTR('ABC123456789')).toEqual({ valid: true })
  })

  it('accepts a 16-character UTR', () => {
    expect(validateUTR('ABCD1234EFGH5678')).toEqual({ valid: true })
  })

  it('rejects empty UTR', () => {
    const r1 = validateUTR('')
    expect(r1.valid).toBe(false)
    expect(r1.reason).toContain('required')

    const r2 = validateUTR(null)
    expect(r2.valid).toBe(false)
  })

  it('rejects UTR shorter than 12 characters', () => {
    expect(validateUTR('ABC123').valid).toBe(false)
  })

  it('rejects UTR longer than 16 characters', () => {
    expect(validateUTR('ABCD1234EFGH56789').valid).toBe(false)
  })

  it('rejects UTR with special characters', () => {
    expect(validateUTR('ABC-1234-5678').valid).toBe(false)
  })

  it('trims whitespace and converts to uppercase', () => {
    // Validation itself doesn't transform, but it cleans for comparison
    expect(validateUTR('  abc123456789  ').valid).toBe(true)
  })
})

describe('findMatches', () => {
  const transactions = [
    { date: '2025-04-01', description: 'Payment', amount: 1000, utr: 'UTR123456789', sender_name: 'Rajesh Kumar' },
    { date: '2025-04-02', description: 'Transfer', amount: 500, utr: '', sender_name: 'Priya' },
  ]
  const participants = [
    { id: 1, participant_name: 'Rajesh Kumar', amount_due: 1000, status: 'pending', utr: '' },
    { id: 2, participant_name: 'Priya Sharma', amount_due: 500, status: 'pending', utr: '' },
  ]

  it('matches by UTR with 100% confidence', () => {
    const results = findMatches(transactions, participants)
    const match = results.find(m => m.transaction.utr === 'UTR123456789')
    expect(match).toBeDefined()
    expect(match.confidence).toBe(100)
    expect(match.matched_by).toBe('utr')
  })

  it('matches by amount + name similarity when UTR is absent', () => {
    const txns = [
      { date: '2025-04-01', description: 'Transfer', amount: 500, utr: '', sender_name: 'Priya Sharma' },
    ]
    const results = findMatches(txns, participants)
    expect(results.length).toBeGreaterThan(0)
    const match = results[0]
    expect(match.participant.id).toBe(2)
    expect(match.confidence).toBeGreaterThanOrEqual(50)
  })

  it('skips already-paid participants', () => {
    const paidParticipants = [
      { id: 1, participant_name: 'Rajesh Kumar', amount_due: 1000, status: 'paid', utr: 'UTR123456789' },
    ]
    const results = findMatches(transactions, paidParticipants)
    const rajeshMatch = results.filter(m => m.participant.id === 1)
    expect(rajeshMatch).toHaveLength(0)
  })

  it('returns empty array when no match is found', () => {
    const results = findMatches(
      [{ date: '2025-04-01', description: 'Unknown', amount: 99999, utr: '', sender_name: '' }],
      participants
    )
    expect(results).toHaveLength(0)
  })

  it('respects useUTROnly option', () => {
    const results = findMatches(
      [{ date: '2025-04-01', description: 'Test', amount: 1000, utr: 'NONEXISTENT', sender_name: '' }],
      [{ id: 1, participant_name: 'Someone', amount_due: 1000, status: 'pending', utr: '' }],
      { useUTROnly: true }
    )
    expect(results).toHaveLength(0)
  })
})
