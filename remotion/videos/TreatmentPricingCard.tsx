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

interface PricingItem {
  name: string;
  price: string;
  time?: string;
  note?: string;
}

interface TreatmentPricingCardProps {
  title: string;
  subtitle: string;
  items: PricingItem[];
  ctaText?: string;
  highlight?: string;
}

const PricingRow: React.FC<{
  item: PricingItem;
  index: number;
  isHighlight?: boolean;
}> = ({ item, index, isHighlight }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const delay = 60 + index * 8;

  const opacity = spring({
    frame: frame - delay,
    fps,
    config: { damping: 20, mass: 0.4 },
  });

  const translateX = interpolate(
    spring({ frame: frame - delay, fps, config: { damping: 20, mass: 0.4 } }),
    [0, 1],
    [40, 0]
  );

  return (
    <div
      style={{
        opacity,
        transform: `translateX(${translateX}px)`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "14px 0",
        borderBottom: `1px solid rgba(201, 169, 110, 0.15)`,
      }}
    >
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontFamily: BRAND.fonts.body,
            fontSize: 28,
            fontWeight: isHighlight ? 600 : 400,
            color: isHighlight ? BRAND.colors.gold : BRAND.colors.cream,
            letterSpacing: "0.02em",
          }}
        >
          {item.name}
        </div>
        {item.note && (
          <div
            style={{
              fontFamily: BRAND.fonts.body,
              fontSize: 16,
              color: BRAND.colors.goldLight,
              opacity: 0.6,
              marginTop: 4,
            }}
          >
            {item.note}
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        {item.time && (
          <div
            style={{
              fontFamily: BRAND.fonts.body,
              fontSize: 18,
              color: BRAND.colors.goldLight,
              opacity: 0.4,
            }}
          >
            {item.time}
          </div>
        )}
        <div
          style={{
            fontFamily: BRAND.fonts.headline,
            fontSize: 32,
            fontWeight: 700,
            color: BRAND.colors.gold,
            minWidth: 100,
            textAlign: "right",
          }}
        >
          {item.price}
        </div>
      </div>
    </div>
  );
};

export const TreatmentPricingCard: React.FC<TreatmentPricingCardProps> = ({
  title,
  subtitle,
  items,
  ctaText = "Book Your Free Consultation",
  highlight,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const ctaOpacity = spring({
    frame: frame - (80 + items.length * 8),
    fps,
    config: { damping: 15 },
  });

  const ctaScale = interpolate(
    spring({
      frame: frame - (80 + items.length * 8),
      fps,
      config: { damping: 15 },
    }),
    [0, 1],
    [0.9, 1]
  );

  return (
    <AbsoluteFill>
      <NavyBackground>
        <GoldParticles count={15} />

        {/* Header */}
        <div
          style={{
            position: "absolute",
            top: 80,
            left: 0,
            right: 0,
            textAlign: "center",
          }}
        >
          <FadeInText
            text={subtitle}
            fontSize={18}
            color={BRAND.colors.goldLight}
            fontFamily={BRAND.fonts.body}
            fontWeight={300}
            letterSpacing="0.15em"
            textTransform="uppercase"
            style={{ marginBottom: 16 }}
          />
          <GoldShimmerText text={title} fontSize={56} delay={10} />
          <Sequence from={20}>
            <GoldDivider width="40%" />
          </Sequence>
        </div>

        {/* Pricing List */}
        <div
          style={{
            position: "absolute",
            top: 280,
            left: 80,
            right: 80,
            bottom: 220,
            overflowY: "hidden",
          }}
        >
          {items.map((item, i) => (
            <PricingRow
              key={i}
              item={item}
              index={i}
              isHighlight={item.name === highlight}
            />
          ))}
        </div>

        {/* CTA */}
        <div
          style={{
            position: "absolute",
            bottom: 100,
            left: 0,
            right: 0,
            textAlign: "center",
            opacity: ctaOpacity,
            transform: `scale(${ctaScale})`,
          }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "18px 48px",
              background: `linear-gradient(135deg, ${BRAND.colors.gold}, ${BRAND.colors.goldLight})`,
              borderRadius: 50,
              fontFamily: BRAND.fonts.body,
              fontSize: 22,
              fontWeight: 600,
              color: BRAND.colors.navy,
              letterSpacing: "0.05em",
            }}
          >
            {ctaText}
          </div>
          <div
            style={{
              marginTop: 16,
              fontFamily: BRAND.fonts.body,
              fontSize: 16,
              color: BRAND.colors.goldLight,
              opacity: 0.5,
            }}
          >
            {BRAND.clinic.website} • {BRAND.clinic.phone}
          </div>
        </div>

        <LogoWatermark />
      </NavyBackground>
    </AbsoluteFill>
  );
};
