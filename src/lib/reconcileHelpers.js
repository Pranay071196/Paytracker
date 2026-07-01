/**
 * reconcileHelpers.js — pure logic: CSV parser, UTR validator, and matching engine.
 * No supabase dependency. All functions are deterministic pure functions.
 */

/**
 * Parse a CSV string into an array of transaction objects.
 * Detects column headers by common names (date, description, amount/debit/credit, utr).
 *
 * @param {string} csvText — raw CSV content
 * @returns {Array<{date: string, description: string, amount: number, utr: string, sender_name: string, sender_account: string, raw: string}>}
 */
export function parseCSV(csvText) {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
  const dateIdx = findColumnIndex(headers, ['date', 'transaction date', 'txn date', 'posting date', 'value date'])
  const descIdx = findColumnIndex(headers, ['description', 'narration', 'particulars', 'transaction details', 'remarks'])
  const debitIdx = findColumnIndex(headers, ['debit', 'withdrawal', 'dr', 'amount dr', 'debit amount'])
  const creditIdx = findColumnIndex(headers, ['credit', 'deposit', 'cr', 'amount cr', 'credit amount'])
  const amountIdx = findColumnIndex(headers, ['amount', 'transaction amount', 'txn amount', 'value'])
  const utrIdx = findColumnIndex(headers, ['utr', 'utr no', 'utr number', 'cheque no', 'ref no', 'reference', 'transaction id', 'txn id'])
  const nameIdx = findColumnIndex(headers, ['sender', 'beneficiary', 'payer name', 'payee', 'party', 'counterparty', 'name'])
  const accountIdx = findColumnIndex(headers, ['account', 'account no', 'sender account', 'beneficiary account'])

  const transactions = []

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i])
    if (cols.length < 2) continue

    const date = dateIdx >= 0 ? cols[dateIdx]?.trim() : ''
    const description = descIdx >= 0 ? cols[descIdx]?.trim() : ''
    const raw = lines[i]

    // Determine amount — prefer explicit amount column, then debit/credit
    let amount = 0
    if (amountIdx >= 0) {
      amount = parseAmount(cols[amountIdx])
    } else {
      const debit = debitIdx >= 0 ? parseAmount(cols[debitIdx]) : 0
      const credit = creditIdx >= 0 ? parseAmount(cols[creditIdx]) : 0
      amount = credit || debit
    }

    const utr = utrIdx >= 0 ? cols[utrIdx]?.trim() : ''
    const senderName = nameIdx >= 0 ? cols[nameIdx]?.trim() : ''
    const senderAccount = accountIdx >= 0 ? cols[accountIdx]?.trim() : ''

    if (!date) continue

    transactions.push({
      date: normalizeDate(date),
      description,
      amount: Math.abs(amount),
      utr,
      sender_name: senderName,
      sender_account: senderAccount,
      raw,
    })
  }

  return transactions
}

/**
 * Find column index from a list of acceptable header names (case-insensitive already).
 */
function findColumnIndex(headers, candidates) {
  for (const c of candidates) {
    const idx = headers.indexOf(c)
    if (idx >= 0) return idx
  }
  return -1
}

/**
 * Parse a single CSV line respecting quoted fields (RFC 4180).
 */
function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

/**
 * Parse a numeric amount from a string, stripping currency symbols.
 */
function parseAmount(str) {
  if (!str) return 0
  const cleaned = str.replace(/[₹$€,]/g, '').trim()
  return parseFloat(cleaned) || 0
}

/**
 * Normalize various date formats to YYYY-MM-DD.
 * Supports: DD/MM/YYYY, DD-MM-YYYY, DD/MM/YY, YYYY/MM/DD, YYYY-MM-DD.
 */
function normalizeDate(dateStr) {
  if (!dateStr) return ''
  const trimmed = dateStr.trim()

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed

  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = trimmed.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/)
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`

  // DD/MM/YY
  const dmy2 = trimmed.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{2})$/)
  if (dmy2) return `20${dmy2[3]}-${dmy2[2]}-${dmy2[1]}`

  // YYYY/MM/DD
  const ymd = trimmed.match(/^(\d{4})[\/\-](\d{2})[\/\-](\d{2})$/)
  if (ymd) return `${ymd[1]}-${ymd[2]}-${ymd[3]}`

  return trimmed
}

/**
 * Validate a UTR number — must be 12-16 alphanumeric characters.
 * @param {string} utr
 * @returns {{ valid: boolean, reason?: string }}
 */
export function validateUTR(utr) {
  if (!utr || !utr.trim()) {
    return { valid: false, reason: 'UTR is required' }
  }
  const cleaned = utr.trim().toUpperCase()
  if (cleaned.length < 12 || cleaned.length > 16) {
    return { valid: false, reason: 'UTR must be 12-16 characters' }
  }
  if (!/^[A-Z0-9]+$/.test(cleaned)) {
    return { valid: false, reason: 'UTR must be alphanumeric (letters and numbers only)' }
  }
  return { valid: true }
}

/**
 * Matching engine — find best matches between bank transactions and participants.
 *
 * Strategy:
 *  1. Exact UTR match → 100% confidence (always picked first).
 *  2. Amount proximity (within tolerance) + name similarity scoring.
 *  3. Only returns candidates above a minimum threshold.
 *
 * @param {Array} transactions — parsed bank transactions from parseCSV
 * @param {Array} participants — collection participants with {id, participant_name, amount_due, status, utr}
 * @param {{ amountTolerance?: number, nameSimilarityThreshold?: number, useUTROnly?: boolean }} options
 * @returns {Array<{ transaction: object, participant: object, confidence: number, matched_by: string }>}
 */
export function findMatches(transactions, participants, options = {}) {
  const {
    amountTolerance = 0.01,
    nameSimilarityThreshold = 0.6,
    useUTROnly = false,
  } = options

  const matches = []

  for (const txn of transactions) {
    let bestMatch = null
    let bestScore = 0

    for (const participant of participants) {
      // Skip already-paid participants
      if (participant.status === 'paid') continue

      let score = 0

      // UTR match gives highest confidence — exact match = 100%
      if (txn.utr && participant.utr && txn.utr.toUpperCase() === participant.utr.toUpperCase()) {
        score = 1.0
        bestMatch = participant
        bestScore = score
        break
      }

      // Amount proximity
      const amountDiff = Math.abs(Number(txn.amount) - Number(participant.amount_due))
      if (amountDiff <= amountTolerance) {
        score += 0.5
      } else if (amountDiff <= Math.max(Number(participant.amount_due) * 0.05, 5)) {
        score += 0.2
      }

      // Name similarity (if sender name is available from CSV)
      if (txn.sender_name && participant.participant_name) {
        const sim = stringSimilarity(txn.sender_name, participant.participant_name)
        score += sim * 0.4
      }

      if (score > bestScore) {
        bestScore = score
        bestMatch = participant
      }
    }

    if (bestMatch && (useUTROnly ? bestScore >= 1.0 : bestScore >= 0.3)) {
      matches.push({
        transaction: txn,
        participant: bestMatch,
        confidence: Math.round(bestScore * 100),
        matched_by: bestScore >= 1.0 ? 'utr' : bestScore >= 0.7 ? 'high' : 'auto',
      })
    }
  }

  return matches
}

/**
 * Dice coefficient on character bigrams for string similarity (0.0 – 1.0).
 */
function stringSimilarity(a, b) {
  if (!a || !b) return 0
  const s1 = a.toLowerCase().trim()
  const s2 = b.toLowerCase().trim()
  if (s1 === s2) return 1
  if (s1.length < 2 || s2.length < 2) return 0

  const bigrams = new Map()
  for (let i = 0; i < s1.length - 1; i++) {
    const bg = s1.substring(i, i + 2)
    bigrams.set(bg, (bigrams.get(bg) || 0) + 1)
  }

  let intersectionSize = 0
  for (let i = 0; i < s2.length - 1; i++) {
    const bg = s2.substring(i, i + 2)
    const count = bigrams.get(bg) || 0
    if (count > 0) {
      bigrams.set(bg, count - 1)
      intersectionSize++
    }
  }

  return (2.0 * intersectionSize) / (s1.length - 1 + s2.length - 1)
}
