import { supabase } from '../supabaseClient'

export async function createGroup(organiserProfileId, { name, whatsappGroupName, whatsappGroupLink }) {
  const { data, error } = await supabase
    .from('groups')
    .insert({
      organiser_profile_id: organiserProfileId,
      name,
      whatsapp_group_name: whatsappGroupName || null,
      whatsapp_group_link: whatsappGroupLink || null,
    })
    .select()
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('Failed to create group')

  const { data: organiserProfile } = await supabase
    .from('profiles')
    .select('phone, full_name')
    .eq('id', organiserProfileId)
    .maybeSingle()

  if (organiserProfile) {
    await supabase
      .from('group_members')
      .insert({
        group_id: data.id,
        participant_profile_id: organiserProfileId,
        phone: organiserProfile.phone || '',
        name: organiserProfile.full_name || 'Organiser',
      })
  }

  return data
}

export async function fetchGroupsForOrganiser(organiserProfileId) {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('organiser_profile_id', organiserProfileId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function fetchGroupByInviteCode(inviteCode) {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('invite_code', inviteCode)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const { data: organiserProfile } = await supabase
    .from('profiles')
    .select('full_name, phone')
    .eq('id', data.organiser_profile_id)
    .maybeSingle()

  return { ...data, organiser: organiserProfile || null }
}

export async function fetchGroupById(groupId) {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .maybeSingle()

  if (error) throw error
  return data || null
}

export async function joinGroup(inviteCode, participantProfileId, phone, name) {
  const group = await fetchGroupByInviteCode(inviteCode)
  if (!group) throw new Error('Invalid invite link')

  const { data: existing } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', group.id)
    .eq('participant_profile_id', participantProfileId)
    .maybeSingle()

  if (existing) return group

  const { error } = await supabase
    .from('group_members')
    .insert({
      group_id: group.id,
      participant_profile_id: participantProfileId,
      phone,
      name: name || null,
    })

  if (error) throw error
  return group
}

export async function fetchGroupMembers(groupId) {
  const { data, error } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', groupId)
    .order('joined_at', { ascending: true })

  if (error) throw error
  return data || []
}

export async function fetchGroupsForParticipant(participantProfileId) {
  const { data, error } = await supabase
    .from('group_members')
    .select(`
      *,
      group:group_id (*)
    `)
    .eq('participant_profile_id', participantProfileId)

  if (error) throw error
  return data || []
}

export async function deleteGroupFromSupabase(groupId) {
  const { error } = await supabase
    .from('groups')
    .delete()
    .eq('id', groupId)

  if (error) throw error
}

export async function updateGroupMemberName(memberId, name) {
  const { data, error } = await supabase
    .from('group_members')
    .update({ name })
    .eq('id', memberId)
    .select()
    .maybeSingle()

  if (error) throw error
  return data
}
