import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { BRAND } from "../brand";

export const NavyBackground: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div
    style={{
      width: "100%",
      height: "100%",
      background: `radial-gradient(ellipse at 30% 20%, #1a2d40 0%, ${BRAND.colors.navy} 70%)`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      position: "relative",
    }}
  >
    {children}
  </div>
);

export const GoldParticles: React.FC<{ count?: number }> = ({
  count = 20,
}) => {
  const frame = useCurrentFrame();

  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const x = ((i * 137.5) % 100);
        const startY = ((i * 73.7) % 100);
        const speed = 0.3 + (i % 5) * 0.15;
        const size = 2 + (i % 4) * 1.5;
        const y = (startY + frame * speed) % 120 - 10;
        const opacity = interpolate(
          Math.sin(frame * 0.05 + i),
          [-1, 1],
          [0.1, 0.6]
        );

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: size,
              height: size,
              borderRadius: "50%",
              background: BRAND.colors.gold,
              opacity,
              filter: "blur(0.5px)",
            }}
          />
        );
      })}
    </>
  );
};

export const GoldDivider: React.FC<{
  width?: string;
  delay?: number;
}> = ({ width = "60%", delay = 0 }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame - delay, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width,
        height: 2,
        background: `linear-gradient(90deg, transparent 0%, ${BRAND.colors.gold} 50%, transparent 100%)`,
        opacity: progress,
        transform: `scaleX(${progress})`,
        margin: "20px auto",
      }}
    />
  );
};

export const LogoWatermark: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 30], [0, 0.15], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 40,
        right: 40,
        opacity,
        fontFamily: BRAND.fonts.headline,
        fontSize: 14,
        color: BRAND.colors.gold,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
      }}
    >
      {BRAND.logo.text}
    </div>
  );
};
