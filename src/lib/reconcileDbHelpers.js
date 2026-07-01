import { supabase } from '../supabaseClient'

/**
 * Mark a participant as paid — sets status='paid', paid_at=now(), and optional utr/amount_paid.
 * @param {number} participantId - collection_participants row id
 * @param {{ utr?: string, amount_paid?: number }} options
 * @returns {Promise<object>} the updated row
 */
export async function markAsPaid(participantId, options = {}) {
  const updates = {
    status: 'paid',
    paid_at: new Date().toISOString(),
  }
  if (options.utr) updates.utr = options.utr
  if (options.amount_paid) updates.amount_paid = options.amount_paid

  const { data, error } = await supabase
    .from('collection_participants')
    .update(updates)
    .eq('id', participantId)
    .select()
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * Mark a participant as 'in_review' — used when participant claims payment.
 * @param {number} participantId
 * @param {string} [utr]
 * @returns {Promise<object>}
 */
export async function markAsInReview(participantId, utr) {
  const updates = { status: 'in_review' }
  if (utr) updates.utr = utr

  const { data, error } = await supabase
    .from('collection_participants')
    .update(updates)
    .eq('id', participantId)
    .select()
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * Fetch all reconciliation transactions for a collection.
 * @param {number} collectionId
 * @returns {Promise<Array>}
 */
export async function fetchReconciliationTransactions(collectionId) {
  const { data, error } = await supabase
    .from('reconciliation_transactions')
    .select('*')
    .eq('collection_id', collectionId)
    .order('transaction_date', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Bulk insert parsed bank transactions into reconciliation_transactions.
 * @param {number} collectionId
 * @param {Array<{date, description, amount, utr?, sender_name?, sender_account?, raw?}>} transactions
 * @returns {Promise<Array>}
 */
export async function insertReconciliationTransactions(collectionId, transactions) {
  const rows = transactions.map(t => ({
    collection_id: collectionId,
    transaction_date: t.date,
    description: t.description || '',
    amount: t.amount,
    utr: t.utr || null,
    sender_name: t.sender_name || null,
    sender_account: t.sender_account || null,
    raw_line: t.raw || '',
  }))

  const { data, error } = await supabase
    .from('reconciliation_transactions')
    .insert(rows)
    .select()

  if (error) throw error
  return data || []
}

/**
 * Fetch pending matches for a collection with joined transaction + participant data.
 * @param {number} collectionId
 * @returns {Promise<Array>}
 */
export async function fetchPendingMatches(collectionId) {
  const { data, error } = await supabase
    .from('reconciliation_matches')
    .select(`
      *,
      transaction:reconciliation_transactions (*),
      participant:collection_participants (*)
    `)
    .eq('status', 'pending')

  if (error) throw error
  return data || []
}

/**
 * Confirm a match — sets match status='confirmed' and marks participant as paid.
 * @param {number} matchId
 */
export async function confirmMatch(matchId) {
  const { data: match, error: fetchError } = await supabase
    .from('reconciliation_matches')
    .select('*, participant:collection_participants(*)')
    .eq('id', matchId)
    .single()

  if (fetchError) throw fetchError
  if (!match) throw new Error('Match not found')

  const { error: updateError } = await supabase
    .from('reconciliation_matches')
    .update({ status: 'confirmed' })
    .eq('id', matchId)

  if (updateError) throw updateError

  // Mark the participant as paid
  const { error: paidError } = await supabase
    .from('collection_participants')
    .update({
      status: 'paid',
      utr: match.transaction?.utr || match.participant?.utr,
      paid_at: new Date().toISOString(),
    })
    .eq('id', match.participant_id)

  if (paidError) throw paidError
}

/**
 * Reject a match.
 * @param {number} matchId
 */
export async function rejectMatch(matchId) {
  const { error } = await supabase
    .from('reconciliation_matches')
    .update({ status: 'rejected' })
    .eq('id', matchId)

  if (error) throw error
}

/**
 * Update just the UTR on a participant.
 * @param {number} participantId
 * @param {string} utr
 * @returns {Promise<object>}
 */
export async function updateParticipantUtr(participantId, utr) {
  const { data, error } = await supabase
    .from('collection_participants')
    .update({ utr })
    .eq('id', participantId)
    .select()
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * Fetch participants for reconciliation (pending, in_review, or paid) with UTR info.
 * @param {number} collectionId
 * @returns {Promise<Array>}
 */
export async function fetchParticipantsForReconciliation(collectionId) {
  const { data, error } = await supabase
    .from('collection_participants')
    .select('*')
    .eq('collection_id', collectionId)
    .in('status', ['pending', 'in_review', 'paid'])

  if (error) throw error
  return data || []
}
