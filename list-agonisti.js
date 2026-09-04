const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://kzlnxnfwwfgqmqcvdyox.supabase.co',
  'sb_publishable_dkMZFsIqNHgsqg6qeSL74w_ztExNlD3'
);

(async () => {
  try {
    // Recupera tutti gli agonisti
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('role', 'agonista')
      .order('full_name');

    console.log(`Agonisti trovati: ${profiles?.length || 0}\n`);

    if (profiles && profiles.length > 0) {
      for (const profile of profiles) {
        // Cerca assegnazione squadra
        const { data: assignments } = await supabase
          .from('championship_team_players')
          .select('team_id')
          .eq('user_id', profile.id)
          .eq('status', 'active');

        let teamInfo = 'Non assegnato';
        if (assignments && assignments.length > 0) {
          const { data: team } = await supabase
            .from('championship_teams')
            .select('name')
            .eq('id', assignments[0].team_id)
            .single();
          teamInfo = team?.name || 'Squadra sconosciuta';
        }

        console.log(`${profile.full_name.padEnd(30)} -> ${teamInfo}`);
      }
    }
  } catch (err) {
    console.error('Errore:', err.message);
  }
  process.exit(0);
})();
