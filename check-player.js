const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://kzlnxnfwwfgqmqcvdyox.supabase.co',
  'sb_publishable_dkMZFsIqNHgsqg6qeSL74w_ztExNlD3'
);

(async () => {
  try {
    // 1. Trova Matteo Giustini in profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .ilike('full_name', '%matteo%');

    console.log('Profili Matteo trovati:', profiles?.length || 0);

    if (profiles && profiles.length > 0) {
      for (const profile of profiles) {
        console.log(`\nProfilo: ${profile.full_name} (ID: ${profile.id})`);

        // 2. Trova assegnazione squadra
        const { data: assignments } = await supabase
          .from('championship_team_players')
          .select('team_id, status, joined_at')
          .eq('user_id', profile.id)
          .eq('status', 'active');

        if (assignments && assignments.length > 0) {
          for (const a of assignments) {
            const { data: team } = await supabase
              .from('championship_teams')
              .select('name, series, group_code, championship_id')
              .eq('id', a.team_id)
              .single();

            const { data: championship } = await supabase
              .from('championships')
              .select('name')
              .eq('id', team.championship_id)
              .single();

            console.log(`  Campionato: ${championship.name}`);
            console.log(`  Squadra: ${team.name}`);
            console.log(`  Serie: ${team.series}`);
            console.log(`  Girone: ${team.group_code}`);
            console.log(`  Dal: ${a.joined_at}`);
          }
        } else {
          console.log('  Non assegnato a nessuna squadra');
        }
      }
    }
  } catch (err) {
    console.error('Errore:', err.message);
  }
  process.exit(0);
})();
