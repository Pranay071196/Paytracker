import { supabase } from '../supabaseClient'

export async function createOrFetchProfile(authUser, options = {}) {
  if (!authUser) return null

  let { data: existing } = await supabase
    .from('profiles')
    .select('*')
    .eq('auth_user_id', authUser.id)
    .maybeSingle()

  if (!existing && options.phone) {
    const { data: byPhone } = await supabase
      .from('profiles')
      .select('*')
      .eq('phone', options.phone)
      .maybeSingle()

    if (byPhone) {
      const { data, error } = await supabase
        .from('profiles')
        .update({ auth_user_id: authUser.id })
        .eq('id', byPhone.id)
        .select()
        .maybeSingle()

      if (!error && data) existing = data
    }
  }

  if (existing) {
    const updates = {}
    if (authUser.email) updates.email = authUser.email
    if (options.phone) updates.phone = options.phone
    if (options.role) updates.role = options.role
    if (options.full_name) updates.full_name = options.full_name

    if (Object.keys(updates).length > 0) {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', existing.id)
        .select()
        .maybeSingle()
      if (error) throw error
      if (!data) throw new Error('Failed to update profile')
      return data
    }
    return existing
  }

  const profile = {
    auth_user_id: authUser.id,
    email: authUser.email || options.email || null,
    phone: options.phone || null,
    role: options.role || 'participant',
    full_name: options.full_name || authUser.email?.split('@')[0] || 'User',
  }

  const { data, error } = await supabase
    .from('profiles')
    .insert(profile)
    .select()
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('Failed to create profile')
  return data
}

export async function fetchCollectionsForOrganiser(profileId) {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('organiser_profile_id', profileId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function fetchParticipantCollections(profileId) {
  const { data, error } = await supabase
    .from('collection_participants')
    .select(`
      *,
      collection:collections (*)
    `)
    .eq('participant_profile_id', profileId)

  if (error) throw error
  if (!data) return []

  const organiserIds = [...new Set(data.map(cp => cp.collection?.organiser_profile_id).filter(Boolean))]
  let upiMap = {}

  if (organiserIds.length > 0) {
    const { data: organisers } = await supabase
      .from('profiles')
      .select('id, upi_id, full_name')
      .in('id', organiserIds)

    if (organisers) {
      organisers.forEach(o => { upiMap[o.id] = { upi_id: o.upi_id, full_name: o.full_name } })
    }
  }

  return data.map(cp => ({
    ...cp,
    organiser_upi: cp.collection?.organiser_profile_id ? upiMap[cp.collection.organiser_profile_id] : null,
  }))
}

export async function updateProfileUpiId(profileId, upiId) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ upi_id: upiId || null })
    .eq('id', profileId)
    .select()
    .maybeSingle()

  if (error) throw error
  return data
}

export async function updateProfileName(profileId, fullName) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ full_name: fullName || null })
    .eq('id', profileId)
    .select()
    .maybeSingle()

  if (error) throw error
  return data
}

export async function createCollectionWithParticipants(
  organiserProfileId,
  { title, category, targetAmount, collectionDate, participantPhones }
) {
  const { data: collection, error: collError } = await supabase
    .from('collections')
    .insert({
      organiser_profile_id: organiserProfileId,
      title,
      category,
      target_amount: targetAmount,
      collection_date: collectionDate || new Date().toISOString().split('T')[0],
    })
    .select()
    .maybeSingle()

  if (collError) throw collError
  if (!collection) throw new Error('Failed to create collection')

  const amountDue = Math.ceil(targetAmount / participantPhones.length)
  const participantRecords = []

  for (const phone of participantPhones) {
    let { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', phone)
      .maybeSingle()

    if (!profile) {
      const { data: newProfile, error: profError } = await supabase
        .from('profiles')
        .insert({
          phone,
          role: 'participant',
          full_name: phone,
        })
        .select()
        .maybeSingle()

      if (profError) throw profError
      if (!newProfile) throw new Error(`Failed to create profile for ${phone}`)
      profile = newProfile
    }

    participantRecords.push({
      collection_id: collection.id,
      participant_profile_id: profile.id,
      participant_phone: phone,
      amount_due: amountDue,
      amount_paid: 0,
      status: 'pending',
    })
  }

  const { data: participants, error: partError } = await supabase
    .from('collection_participants')
    .insert(participantRecords)
    .select()

  if (partError) throw partError

  return { collection, participants }
}

export async function deleteCollectionFromSupabase(collectionId) {
  const { error } = await supabase
    .from('collections')
    .delete()
    .eq('id', collectionId)

  if (error) throw error
}

export function mapSupabaseCollection(collection, participants) {
  const totalPaid = participants
    ? participants.reduce((sum, p) => sum + (Number(p.amount_paid) || 0), 0)
    : 0
  const paidCount = participants
    ? participants.filter(p => p.status === 'paid').length
    : 0
  return {
    id: collection.id,
    title: collection.title,
    date: new Date(collection.collection_date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
    }),
    category: collection.category,
    amount: Number(collection.target_amount),
    participants: participants
      ? participants.map(p => p.participant_phone)
      : [],
    collected: totalPaid,
    paid: paidCount,
    pending: Number(collection.target_amount) - totalPaid,
  }
}
