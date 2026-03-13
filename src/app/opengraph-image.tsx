import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt =
  "Rani Beauty Clinic — Premier Medspa & Wellness in Renton, WA";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #1B2A4A 0%, #2A3F6A 50%, #1B2A4A 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Decorative gold line at top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(90deg, transparent, #C9A96E, transparent)",
          }}
        />

        {/* Gold R monogram */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            border: "2px solid #C9A96E",
            marginBottom: "24px",
          }}
        >
          <span
            style={{
              fontSize: "40px",
              fontWeight: 700,
              color: "#C9A96E",
            }}
          >
            R
          </span>
        </div>

        {/* Clinic name */}
        <h1
          style={{
            fontSize: "52px",
            fontWeight: 700,
            color: "#FFFFFF",
            margin: 0,
            letterSpacing: "2px",
          }}
        >
          RANI BEAUTY CLINIC
        </h1>

        {/* Tagline */}
        <p
          style={{
            fontSize: "22px",
            color: "#C9A96E",
            margin: "16px 0 0 0",
            letterSpacing: "4px",
            textTransform: "uppercase",
          }}
        >
          Your Skin. Your Wellness. Our Expertise.
        </p>

        {/* Divider */}
        <div
          style={{
            width: "60px",
            height: "1px",
            background: "#C9A96E",
            margin: "28px 0",
          }}
        />

        {/* Services */}
        <p
          style={{
            fontSize: "16px",
            color: "rgba(255, 255, 255, 0.7)",
            margin: 0,
            letterSpacing: "3px",
            textTransform: "uppercase",
          }}
        >
          Laser &bull; HydraFacial &bull; Botox &bull; Fillers &bull; Wellness
        </p>

        {/* Location */}
        <p
          style={{
            fontSize: "14px",
            color: "rgba(255, 255, 255, 0.5)",
            margin: "20px 0 0 0",
            letterSpacing: "2px",
          }}
        >
          RENTON, WA &bull; PHYSICIAN-SUPERVISED
        </p>

        {/* Bottom gold line */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(90deg, transparent, #C9A96E, transparent)",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
