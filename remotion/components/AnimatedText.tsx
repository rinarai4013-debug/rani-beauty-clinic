import React from "react";
import {
  interpolate,
  useCurrentFrame,
  spring,
  useVideoConfig,
} from "remotion";
import { BRAND } from "../brand";

interface AnimatedTextProps {
  text: string;
  delay?: number;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  fontWeight?: number;
  letterSpacing?: string;
  textTransform?: "uppercase" | "none" | "capitalize";
  style?: React.CSSProperties;
}

export const FadeInText: React.FC<AnimatedTextProps> = ({
  text,
  delay = 0,
  fontSize = 48,
  color = BRAND.colors.white,
  fontFamily = BRAND.fonts.headline,
  fontWeight = 700,
  letterSpacing = "-0.02em",
  textTransform = "none",
  style = {},
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = spring({
    frame: frame - delay,
    fps,
    config: { damping: 20, mass: 0.5 },
  });

  const translateY = interpolate(
    spring({ frame: frame - delay, fps, config: { damping: 20, mass: 0.5 } }),
    [0, 1],
    [30, 0]
  );

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        fontSize,
        color,
        fontFamily,
        fontWeight,
        letterSpacing,
        textTransform,
        ...style,
      }}
    >
      {text}
    </div>
  );
};

export const GoldShimmerText: React.FC<AnimatedTextProps> = ({
  text,
  delay = 0,
  fontSize = 64,
  fontFamily = BRAND.fonts.headline,
  fontWeight = 700,
  style = {},
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = spring({
    frame: frame - delay,
    fps,
    config: { damping: 20, mass: 0.5 },
  });

  const shimmerPosition = interpolate(frame, [0, 90], [-100, 200], {
    extrapolateRight: "extend",
  });

  return (
    <div
      style={{
        opacity,
        fontSize,
        fontFamily,
        fontWeight,
        background: `linear-gradient(90deg, ${BRAND.colors.gold} 0%, ${BRAND.colors.goldLight} ${shimmerPosition}%, ${BRAND.colors.gold} 100%)`,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        ...style,
      }}
    >
      {text}
    </div>
  );
};

export const TypewriterText: React.FC<AnimatedTextProps> = ({
  text,
  delay = 0,
  fontSize = 24,
  color = BRAND.colors.cream,
  fontFamily = BRAND.fonts.body,
  fontWeight = 400,
  style = {},
}) => {
  const frame = useCurrentFrame();
  const charsToShow = Math.min(
    text.length,
    Math.floor((frame - delay) / 1.5)
  );

  if (frame < delay) return null;

  return (
    <div
      style={{
        fontSize,
        color,
        fontFamily,
        fontWeight,
        letterSpacing: "0.05em",
        ...style,
      }}
    >
      {text.slice(0, charsToShow)}
      <span
        style={{
          opacity: frame % 15 < 8 ? 1 : 0,
          color: BRAND.colors.gold,
        }}
      >
        |
      </span>
    </div>
  );
};
