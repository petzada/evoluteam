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
          background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
          borderRadius: 40,
          color: '#FFFFFF',
          fontSize: 120,
          fontWeight: 800,
          letterSpacing: -4,
          fontFamily: 'sans-serif',
        }}
      >
        E
      </div>
    ),
    { ...size },
  );
}
