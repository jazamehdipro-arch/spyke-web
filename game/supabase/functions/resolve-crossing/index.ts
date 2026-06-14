import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type ResolveBody = {
  crossingId: string
  mode?: 'auto' | 'accepted' | 'ignored'
}

function autoResolve(a: any, b: any) {
  const aPower = Number(a.level ?? 1) + Math.random() * 6
  const bPower = Number(b.level ?? 1) + Math.random() * 6
  return {
    winner: aPower >= bPower ? a.user_id : b.user_id,
    loser: aPower >= bPower ? b.user_id : a.user_id,
    method: 'async_ai_copy',
    rewardCoins: 4,
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return Response.json({ error: 'POST required' }, { status: 405 })

  const body = await req.json() as ResolveBody
  if (!body.crossingId) return Response.json({ error: 'crossingId required' }, { status: 400 })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: event, error } = await supabase
    .from('crossing_events')
    .select('*')
    .eq('id', body.crossingId)
    .single()

  if (error || !event) return Response.json({ error: error?.message ?? 'not found' }, { status: 404 })
  if (event.status === 'resolved') return Response.json({ crossing: event })

  const resolution = body.mode === 'ignored'
    ? autoResolve(event.player_a_snapshot, event.player_b_snapshot)
    : { method: body.mode ?? 'accepted', rewardCoins: 0 }

  const { data: updated, error: updateError } = await supabase
    .from('crossing_events')
    .update({ status: 'resolved', resolution, resolved_at: new Date().toISOString() })
    .eq('id', body.crossingId)
    .select('*')
    .single()

  if (updateError) return Response.json({ error: updateError.message }, { status: 500 })
  return Response.json({ crossing: updated })
})
