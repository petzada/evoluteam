import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0F172A',
          borderRadius: 40,
          fontSize: 108,
          fontWeight: 800,
          letterSpacing: -8,
          fontFamily: 'sans-serif',
        }}
      >
        <span style={{ display: 'flex', color: '#FFFFFF' }}>e</span>
        <span style={{ display: 'flex', color: '#3B82F6' }}>t</span>
      </div>
    ),
    { ...size },
  );
}
