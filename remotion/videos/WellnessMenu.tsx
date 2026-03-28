import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  useCurrentFrame,
  spring,
  useVideoConfig,
} from "remotion";
import { BRAND } from "../brand";
import { FadeInText, GoldShimmerText } from "../components/AnimatedText";
import {
  NavyBackground,
  GoldParticles,
  GoldDivider,
  LogoWatermark,
} from "../components/Background";

interface WellnessItem {
  name: string;
  benefit: string;
  price: string;
  icon: string;
}

interface WellnessMenuProps {
  title?: string;
  items: WellnessItem[];
  ctaText?: string;
}

const WellnessCard: React.FC<{
  item: WellnessItem;
  index: number;
  total: number;
}> = ({ item, index, total }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardDelay = 60 + index * 20;
  const enterProgress = spring({
    frame: frame - cardDelay,
    fps,
    config: { damping: 15, mass: 0.4 },
  });

  const scale = interpolate(enterProgress, [0, 1], [0.8, 1]);
  const opacity = enterProgress;

  // Glow pulse
  const glowIntensity = interpolate(
    Math.sin((frame - cardDelay) * 0.08),
    [-1, 1],
    [0.05, 0.15]
  );

  return (
    <div
      style={{
        opacity,
        transform: `scale(${scale})`,
        background: `rgba(201, 169, 110, ${glowIntensity})`,
        border: `1px solid rgba(201, 169, 110, 0.25)`,
        borderRadius: 20,
        padding: "32px 28px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 12,
        flex: 1,
        minWidth: 0,
      }}
    >
      {/* Icon */}
      <div style={{ fontSize: 48 }}>{item.icon}</div>

      {/* Name */}
      <div
        style={{
          fontFamily: BRAND.fonts.headline,
          fontSize: 24,
          color: BRAND.colors.gold,
          fontWeight: 700,
          lineHeight: 1.2,
        }}
      >
        {item.name}
      </div>

      {/* Benefit */}
      <div
        style={{
          fontFamily: BRAND.fonts.body,
          fontSize: 18,
          color: BRAND.colors.cream,
          fontWeight: 300,
          lineHeight: 1.4,
          opacity: 0.8,
        }}
      >
        {item.benefit}
      </div>

      {/* Price */}
      <div
        style={{
          marginTop: "auto",
          fontFamily: BRAND.fonts.headline,
          fontSize: 32,
          color: BRAND.colors.goldLight,
          fontWeight: 700,
        }}
      >
        {item.price}
      </div>
    </div>
  );
};

export const WellnessMenu: React.FC<WellnessMenuProps> = ({
  title = "Your Optimization Menu",
  items,
  ctaText = "Walk-ins Welcome • Book Today",
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const ctaDelay = 60 + items.length * 20 + 30;
  const ctaOpacity = spring({
    frame: frame - ctaDelay,
    fps,
    config: { damping: 15 },
  });

  return (
    <AbsoluteFill>
      <NavyBackground>
        <GoldParticles count={15} />

        {/* Header */}
        <div
          style={{
            position: "absolute",
            top: 70,
            left: 0,
            right: 0,
            textAlign: "center",
          }}
        >
          <FadeInText
            text="Wellness Injections"
            fontSize={16}
            color={BRAND.colors.goldLight}
            fontFamily={BRAND.fonts.body}
            fontWeight={300}
            letterSpacing="0.15em"
            textTransform="uppercase"
          />
          <GoldShimmerText
            text={title}
            fontSize={48}
            delay={10}
            style={{ marginTop: 12 }}
          />
          <GoldDivider width="30%" delay={25} />
        </div>

        {/* Cards Grid */}
        <div
          style={{
            position: "absolute",
            top: 260,
            left: 50,
            right: 50,
            bottom: 200,
            display: "flex",
            gap: 20,
            alignItems: "stretch",
          }}
        >
          {items.map((item, i) => (
            <WellnessCard
              key={i}
              item={item}
              index={i}
              total={items.length}
            />
          ))}
        </div>

        {/* CTA */}
        <div
          style={{
            position: "absolute",
            bottom: 80,
            left: 0,
            right: 0,
            textAlign: "center",
            opacity: ctaOpacity,
          }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "14px 40px",
              background: `linear-gradient(135deg, ${BRAND.colors.gold}, ${BRAND.colors.goldLight})`,
              borderRadius: 50,
              fontFamily: BRAND.fonts.body,
              fontSize: 20,
              fontWeight: 600,
              color: BRAND.colors.navy,
            }}
          >
            {ctaText}
          </div>
          <div
            style={{
              marginTop: 12,
              fontFamily: BRAND.fonts.body,
              fontSize: 16,
              color: BRAND.colors.goldLight,
              opacity: 0.4,
            }}
          >
            {BRAND.clinic.phone} • {BRAND.clinic.hours}
          </div>
        </div>

        <LogoWatermark />
      </NavyBackground>
    </AbsoluteFill>
  );
};
