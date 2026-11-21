import { ImageResponse } from "next/og";

const size = { width: 1200, height: 630 };

/**
 * Generated default social share image, served at /og. Used whenever no share
 * image is set in the SEO manager or on the page/project/service itself.
 */
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "radial-gradient(circle at 80% 40%, #22300a 0%, #080A08 60%)",
          color: "#fff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", fontSize: 40, fontWeight: 800 }}>
          <span style={{ color: "#D7FF28", marginRight: 10 }}>/</span>JOBITHLAL
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 92, fontWeight: 800, lineHeight: 0.95, letterSpacing: -3 }}>
          <span>STOP THE SCROLL.</span>
          <span>MAKE AN IMPACT.</span>
          <span style={{ color: "#D7FF28" }}>DRIVE RESULTS.</span>
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#B5BBB5", letterSpacing: 4 }}>
          SOCIAL MEDIA REELS · MOTION GRAPHICS · WEBSITE DEVELOPMENT — DOHA, QATAR
        </div>
      </div>
    ),
    { ...size, headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800" } },
  );
}
