import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Cangday | Modern Perfumery';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#120D0A',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#F5EFE6',
        }}
      >
        <div
          style={{
            fontSize: 120,
            fontFamily: 'serif',
            fontWeight: 'bold',
            marginBottom: 20,
          }}
        >
          C
        </div>
        <div
          style={{
            fontSize: 56,
            fontFamily: 'sans-serif',
            letterSpacing: 10,
            textTransform: 'uppercase',
            color: '#C9A24B',
          }}
        >
          Cangday
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
