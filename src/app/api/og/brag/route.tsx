import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { AVATARS } from '@/lib/constants';

export const runtime = 'edge';

// We fetch Google Inter font down locally if we want it, but for simplicity we rely on system font or load from URL.
// Actually, next/og uses Satori which supports Google Fonts natively via standard URL loading if configured.

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Secure input parameters extraction
    const streak = searchParams.get('s') || '0';
    const beatAi = searchParams.get('a') || '0';
    const avatarId = searchParams.get('av') || 'neural_ace';
    const rawName = searchParams.get('name') || 'Strategist';
    
    // Sanitize string inputs (limit length to prevent overflow/abuse)
    const name = rawName.slice(0, 20).replace(/[^a-zA-Z0-9_\- ]/g, '');

    // Identify avatar paths securely (we map from internal constants, not user string)
    const secureAvatar = AVATARS.find(a => a.id === avatarId) || AVATARS[0];
    const avatarPath = secureAvatar.path || '/assets/avatars/neural_ace.png';
    const aiAvatarPath = '/assets/avatars/mr_predicto_v2.png';

    // Must use absolute URLs in Edge / Satori
    const baseUrl = 'https://sports-challenge.vercel.app';
    const avatarUrl = new URL(avatarPath, baseUrl).toString();
    const aiUrl = new URL(aiAvatarPath, baseUrl).toString();

    // Convert strings to safe integers for logic
    const sCount = Math.max(0, parseInt(streak) || 0);

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0A0A0A',
            backgroundImage: 'linear-gradient(to bottom right, #0A0A0A, #111116)',
            padding: '40px',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Cyberpunk accent ring structure */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '1200px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(129,236,255,0.05) 0%, rgba(0,0,0,0) 70%)',
          }} />

          {/* Heading */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '80px' }}>
            <h1 style={{
              fontSize: 64,
              fontWeight: 900,
              color: '#ffffff',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              margin: 0,
            }}>
              {name}'s Predictive Record
            </h1>
            <p style={{
              fontSize: 32,
              color: '#81ecff',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              margin: '10px 0 0 0',
            }}>
              SportsChallenge • Global Matrix
            </p>
          </div>

          <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', padding: '0 80px', alignItems: 'center' }}>
            {/* Player Side */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
              <img
                src={avatarUrl}
                alt="Player Avatar"
                width={250}
                height={250}
                style={{
                  objectFit: 'cover',
                  border: '8px solid rgba(129,236,255,0.2)',
                  borderRadius: '125px'
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: 24, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800, marginTop: '20px' }}>Winning Streak</span>
                <span style={{ fontSize: sCount >= 3 ? 96 : 80, color: sCount >= 3 ? '#f97316' : '#ffffff', fontWeight: 900, margin: 0, lineHeight: 1 }}>
                  {sCount}
                </span>
              </div>
            </div>

            {/* VS Graphic */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
               <h2 style={{ fontSize: 100, fontWeight: 900, color: 'rgba(255,255,255,0.1)', fontStyle: 'italic', margin: 0 }}>VS</h2>
            </div>

            {/* AI Side */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
              <img
                src={aiUrl}
                alt="AI Avatar"
                width={250}
                height={250}
                style={{
                  objectFit: 'cover',
                  border: '8px solid rgba(255,107,152,0.2)',
                  borderRadius: '125px'
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: 24, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800, marginTop: '20px' }}>AI Outfoxed</span>
                <span style={{ fontSize: 80, color: '#ffe792', fontWeight: 900, margin: 0, lineHeight: 1 }}>
                  {beatAi}
                </span>
              </div>
            </div>
          </div>
          
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error("OG Image generation failed:", error);
    return new Response('Failed to generate image', { status: 500 });
  }
}
