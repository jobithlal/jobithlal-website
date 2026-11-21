import { ImageResponse } from "next/og";

export const alt = "JOBITHLAL — Stop the scroll. Make an impact. Drive results.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default social share image (replaced per page/project by admin uploads in Phase 7). */
export default function OgImage() {
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
    size,
  );
}
