import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE environment variables in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Fixed UUID for Mr. Predicto
const AI_USER_ID = '00000000-0000-0000-0000-000000000001';

async function initializeAI() {
  console.log('🤖 Initializing "Mr. Predicto" AI Strategist...');

  // 1. Ensure Auth User exists
  console.log('🔑 Syncing Neural Core identity with Auth system...');
  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(AI_USER_ID);

  if (userError || !userData.user) {
    console.log('✨ Creating new internal identity for AI...');
    const { error: createError } = await supabase.auth.admin.createUser({
      id: AI_USER_ID,
      email: 'ai-core@neural-link.internal',
      password: 'neural-link-restricted-access-' + Math.random().toString(36),
      email_confirm: true,
      user_metadata: { is_ai: true, screen_name: 'Mr. Predicto' }
    });

    if (createError) {
      console.error('❌ Failed to create system user:', createError.message);
      // If we can't create with a specific ID, let's try to get any existing user with that email or just proceed to profile
    }
  } else {
    console.log('📡 Neural identity verified.');
  }

  // 2. Create or Update Profile
  console.log('👤 Synchronizing AI Profile...');
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: AI_USER_ID,
      screen_name: 'Mr. Predicto',
      avatar_url: '/assets/avatars/mr_predicto.png',
      avatar_id: 'mr_predicto',
      is_ai: true,
      points: 0,
      accuracy: 0,
      matches_predicted: 0
    }, { onConflict: 'id' });

  if (profileError) {
    console.error('❌ Failed to create AI profile:', profileError.message);
    return;
  }
  
  console.log('✅ AI Profile "Mr. Predicto" synchronized.');

  // 3. Historical Backfill
  console.log('📂 Scanning historical matches for backfill...');
  const { data: matches, error: matchesError } = await supabase
    .from('matches')
    .select('id, ai_prediction, match_time')
    .not('ai_prediction', 'is', null);

  if (matchesError) {
    console.error('❌ Failed to fetch matches:', matchesError.message);
    return;
  }

  console.log(`📊 Found ${matches.length} matches with AI insights.`);

  const predictions = matches.map(match => ({
    user_id: AI_USER_ID,
    match_id: match.id,
    prediction: match.ai_prediction,
    created_at: match.match_time
  }));

  if (predictions.length > 0) {
    const { error: predError } = await supabase
      .from('predictions')
      .upsert(predictions, { onConflict: 'user_id,match_id' });

    if (predError) {
      console.error('❌ Failed to backfill predictions:', predError.message);
    } else {
      console.log(`✅ Backfilled ${predictions.length} predictions for Mr. Predicto.`);
    }
  }

  console.log('🏁 Neural link established. Mr. Predicto is now active.');
}

initializeAI();
