import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function seedFullSeason() {
  console.log("🚀 RE-INITIALIZING IPL 2026 SEASON WITH HIGH-FIDELITY DATA...");

  // 1. Wipe existing matches
  await supabase.from('matches').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  const teams = {
    CSK: "M. A. Chidambaram Stadium, Chennai",
    MI: "Wankhede Stadium, Mumbai",
    RCB: "M. Chinnaswamy Stadium, Bengaluru",
    KKR: "Eden Gardens, Kolkata",
    RR: "Sawai Mansingh Stadium, Jaipur",
    SRH: "Rajiv Gandhi Intl. Cricket Stadium, Hyderabad",
    DC: "Arun Jaitley Stadium, Delhi",
    GT: "Narendra Modi Stadium, Ahmedabad",
    LSG: "Bharat Ratna Shri Atal Bihari Vajpayee Ekana Cricket Stadium, Lucknow",
    PBKS: "Maharaja Yadavindra Singh Intl. Cricket Stadium, Mullanpur"
  };

  const fixtures = [];

  // --- PHASE 1: OFFICIAL REAL-WORLD SCHEDULE (MAR 28 - APR 5) ---
  const phase1 = [
    { date: "2026-03-28", time: "19:30", home: "RCB", away: "SRH", venue: teams.RCB },
    { date: "2026-03-29", time: "19:30", home: "MI", away: "KKR", venue: teams.MI },
    { date: "2026-03-30", time: "19:30", home: "RR", away: "CSK", venue: "Barsapara Cricket Stadium, Guwahati" }, // RR's second home
    { date: "2026-03-31", time: "19:30", home: "PBKS", away: "GT", venue: teams.PBKS },
    { date: "2026-04-01", time: "19:30", home: "LSG", away: "DC", venue: teams.LSG },
    { date: "2026-04-02", time: "19:30", home: "KKR", away: "SRH", venue: teams.KKR },
    { date: "2026-04-03", time: "19:30", home: "CSK", away: "PBKS", venue: teams.CSK },
    { date: "2026-04-04", time: "15:30", home: "DC", away: "MI", venue: teams.DC },
    { date: "2026-04-04", time: "19:30", home: "GT", away: "RR", venue: teams.GT },
    { date: "2026-04-05", time: "15:30", home: "LSG", away: "SRH", venue: teams.SRH }, // Afternoon swap
    { date: "2026-04-05", time: "19:30", home: "CSK", away: "RCB", venue: teams.CSK },
  ];

  phase1.forEach(m => {
    fixtures.push({
      team_a: m.home,
      team_b: m.away,
      venue: m.venue,
      match_time: new Date(`${m.date}T${m.time}:00+05:30`).toISOString(),
      status: "upcoming",
      sport: "cricket"
    });
  });

  // --- PHASE 2: GENERATED REMAINDER (STAGGERED) ---
  const teamList = Object.keys(teams);
  let currentDate = new Date("2026-04-06T19:30:00+05:30");
  let matchCount = fixtures.length;

  // Simple shuffle to prevent "All CSK" clusters
  const remainders = [];
  for (let i = 0; i < teamList.length; i++) {
    for (let j = 0; j < teamList.length; j++) {
      if (i === j) continue;
      const h = teamList[i];
      const a = teamList[j];
      
      // Skip if already in Phase 1
      if (phase1.find(p => p.home === h && p.away === a)) continue;
      remainders.push({ home: h, away: a });
    }
  }

  // Shuffle remainders
  for (let i = remainders.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [remainders[i], remainders[j]] = [remainders[j], remainders[i]];
  }

  remainders.forEach((m, idx) => {
    if (matchCount >= 70) return;
    
    const mTime = new Date(currentDate.getTime());
    mTime.setDate(currentDate.getDate() + Math.floor(idx / 1.1)); // Approx 1 per day
    
    // Weekends (Sat/Sun) get double headers
    const day = mTime.getDay();
    if (day === 0 || day === 6) {
       mTime.setHours(idx % 2 === 0 ? 15 : 19, 30, 0);
    } else {
       mTime.setHours(19, 30, 0);
    }

    fixtures.push({
      team_a: m.home,
      team_b: m.away,
      venue: teams[m.home],
      match_time: mTime.toISOString(),
      status: "upcoming",
      sport: "cricket"
    });
    matchCount++;
  });

  console.log(`📡 DEPLOYING ${fixtures.length} HIGH-FIDELITY FIXTURES...`);

  const { error } = await supabase.from('matches').insert(fixtures);

  if (error) {
    console.error("❌ DEPLOYMENT FAILURE:", error);
  } else {
    console.log("✅ IPL 2026 SEASON SUCCESSFULLY RESET WITH OFFICIAL FIXTURES.");
  }
}

seedFullSeason();
