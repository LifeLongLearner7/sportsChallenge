import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const AI_USER_ID = "00000000-0000-0000-0000-000000000001";

async function updateAiAvatar() {
  console.log('Updating Mr. Predicto avatar...');
  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: 'mr_predicto' })
    .eq('id', AI_USER_ID);

  if (error) {
    console.error('Update failed:', error);
  } else {
    console.log('Mr. Predicto avatar updated successfully!');
  }
}

updateAiAvatar();
