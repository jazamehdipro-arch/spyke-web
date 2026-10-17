import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

async function sendExpoPush(token: string, title: string, body: string, data: Record<string, unknown>) {
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: token,
      sound: 'default',
      title,
      body,
      data,
      channelId: 'crossings',
    }),
  })
}

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: events, error } = await supabase
    .from('crossing_events')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(50)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  let sent = 0
  for (const event of events ?? []) {
    const userIds = [event.player_a, event.player_b]
    const { data: tokens } = await supabase
      .from('device_push_tokens')
      .select('user_id, expo_push_token')
      .in('user_id', userIds)

    for (const token of tokens ?? []) {
      const other = token.user_id === event.player_a ? event.player_b_snapshot : event.player_a_snapshot
      await sendExpoPush(
        token.expo_push_token,
        'Nouveau croisement',
        `${other.creature_name} est passe pres de toi.`,
        { type: 'crossing', crossingId: event.id },
      )
      sent += 1
    }

    await supabase.from('crossing_events').update({ status: 'queued' }).eq('id', event.id)
  }

  return Response.json({ sent })
})
