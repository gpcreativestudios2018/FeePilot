/* Generates https://fee-pilot.vercel.app/opengraph-image.png automatically */
import { ImageResponse } from 'next/og';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'linear-gradient(135deg, #0ea5e9 0%, #22d3ee 35%, #a78bfa 100%)',
          fontSize: 72,
          fontWeight: 800,
          color: 'white',
          letterSpacing: -1,
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
        }}
      >
        Fee&nbsp;Pilot
      </div>
    ),
    {
      ...size,
    }
  );
}
