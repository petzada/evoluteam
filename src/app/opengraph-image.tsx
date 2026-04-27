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
          background: '#0F172A',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              background: '#1E293B',
              borderRadius: 12,
              fontSize: 32,
              fontWeight: 800,
              letterSpacing: -2,
            }}
          >
            <span style={{ display: 'flex', color: '#FFFFFF' }}>e</span>
            <span style={{ display: 'flex', color: '#F09469' }}>t</span>
          </div>
          <div style={{ display: 'flex', fontSize: 32, fontWeight: 500, color: '#64748B' }}>
            evolu.team
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              display: 'flex',
              fontSize: 96,
              fontWeight: 800,
              letterSpacing: -4,
              lineHeight: 1,
            }}
          >
            <span style={{ display: 'flex', color: '#FFFFFF' }}>Evolu</span>
            <span style={{ display: 'flex', color: '#F09469' }}>team</span>
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 40,
              fontWeight: 400,
              color: '#CBD5E1',
              letterSpacing: -1,
              lineHeight: 1.2,
              maxWidth: 900,
            }}
          >
            Gestão de pessoas para times que evoluem.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', width: 48, height: 4, background: '#F09469' }} />
          <div style={{ display: 'flex', fontSize: 24, color: '#64748B', fontWeight: 500 }}>
            Avaliações · Feedback · PDI · Recrutamento
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
