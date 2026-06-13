import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RADIUS_METERS = 200
const ACTIVE_WINDOW_MINUTES = 5
const PAIR_COOLDOWN_MINUTES = 30

function meters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const r = 6_371_000
  const toRad = (v: number) => (v * Math.PI) / 180
  const dLat = toRad(bLat - aLat)
  const dLng = toRad(bLng - aLng)
  const lat1 = toRad(aLat)
  const lat2 = toRad(bLat)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * r * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const since = new Date(Date.now() - ACTIVE_WINDOW_MINUTES * 60_000).toISOString()
  const { data: players, error } = await supabase
    .from('player_locations')
    .select('*')
    .gte('updated_at', since)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  let created = 0
  const rows = players ?? []
  for (let i = 0; i < rows.length; i += 1) {
    for (let j = i + 1; j < rows.length; j += 1) {
      const a = rows[i]
      const b = rows[j]
      if (a.user_id === b.user_id) continue

      const distance = meters(a.latitude, a.longitude, b.latitude, b.longitude)
      if (distance > RADIUS_METERS) continue

      const cooldownSince = new Date(Date.now() - PAIR_COOLDOWN_MINUTES * 60_000).toISOString()
      const { data: recent } = await supabase
        .from('crossing_events')
        .select('id')
        .or(`and(player_a.eq.${a.user_id},player_b.eq.${b.user_id}),and(player_a.eq.${b.user_id},player_b.eq.${a.user_id})`)
        .gte('created_at', cooldownSince)
        .limit(1)

      if (recent && recent.length > 0) continue

      const { error: insertError } = await supabase.from('crossing_events').insert({
        player_a: a.user_id,
        player_b: b.user_id,
        player_a_snapshot: a,
        player_b_snapshot: b,
        distance_meters: Math.round(distance),
        status: 'pending',
      })
      if (!insertError) created += 1
    }
  }

  return Response.json({ scanned: rows.length, created })
})
