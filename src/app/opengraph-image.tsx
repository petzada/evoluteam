import { ImageResponse } from 'next/og';

export const alt = 'Evoluteam — Gestão de pessoas para times que evoluem';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 80,
          background: 'linear-gradient(135deg, #0A0A0A 0%, #1F1F1F 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
              borderRadius: 16,
              color: '#FFFFFF',
              fontSize: 48,
              fontWeight: 800,
              letterSpacing: -2,
            }}
          >
            E
          </div>
          <div style={{ display: 'flex', fontSize: 36, fontWeight: 600, color: '#A3A3A3' }}>
            evolu.team
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              display: 'flex',
              fontSize: 96,
              fontWeight: 800,
              color: '#FFFFFF',
              letterSpacing: -4,
              lineHeight: 1,
            }}
          >
            Evoluteam
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 40,
              fontWeight: 400,
              color: '#D4D4D4',
              letterSpacing: -1,
              lineHeight: 1.2,
              maxWidth: 900,
            }}
          >
            Gestão de pessoas para times que evoluem.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', width: 48, height: 4, background: '#F97316' }} />
          <div style={{ display: 'flex', fontSize: 24, color: '#737373', fontWeight: 500 }}>
            Avaliações · Feedback · PDI · Recrutamento
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
