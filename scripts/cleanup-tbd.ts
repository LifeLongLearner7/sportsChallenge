import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Starting cleanup of orphaned TBD matches...");
  
  const { data: tbdMatches, error: fetchErr } = await supabase
    .from('matches')
    .select('id')
    .eq('team_a', 'TBD')
    .eq('team_b', 'TBD');
    
  if (fetchErr) {
    console.error("Fetch error:", fetchErr);
    return;
  }
  
  if (!tbdMatches || tbdMatches.length === 0) {
    console.log("No TBD matches found. Database is clean.");
    return;
  }
  
  console.log(`Found ${tbdMatches.length} total TBD matches... checking for orphans...`);
  
  const { data: extFix, error: extErr } = await supabase
    .from('external_fixtures')
    .select('match_id');
    
  if (extErr) {
    console.error("Ext fetch error:", extErr);
    return;
  }
  
  const linkedIds = new Set(extFix?.map(e => e.match_id));

  const orphanedIds = tbdMatches.filter(m => !linkedIds.has(m.id)).map(m => m.id);
  
  console.log(`Found ${orphanedIds.length} orphaned TBD matches (unlinked).`);
  
  if (orphanedIds.length > 0) {
    // Delete them
    const { error: delErr } = await supabase
      .from('matches')
      .delete()
      .in('id', orphanedIds);
      
    if (delErr) {
       console.error("Error deleting orphans:", delErr);
    } else {
       console.log("SUCCESS: Deleted orphans successfully!");
    }
  }
}
run();
