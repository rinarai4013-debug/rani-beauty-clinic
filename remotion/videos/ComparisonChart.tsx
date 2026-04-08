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

interface ComparisonRow {
  label: string;
  optionA: string;
  optionB: string;
}

interface ComparisonChartProps extends Record<string, unknown> {
  title: string;
  optionAName: string;
  optionBName: string;
  rows: ComparisonRow[];
  conclusion: string;
  ctaText?: string;
}

const TableRow: React.FC<{
  row: ComparisonRow;
  index: number;
}> = ({ row, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const delay = 90 + index * 12;

  const opacity = spring({
    frame: frame - delay,
    fps,
    config: { damping: 20, mass: 0.4 },
  });

  const translateY = interpolate(
    spring({ frame: frame - delay, fps, config: { damping: 20, mass: 0.4 } }),
    [0, 1],
    [20, 0]
  );

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        padding: "16px 0",
        borderBottom: `1px solid rgba(201, 169, 110, 0.1)`,
      }}
    >
      <div
        style={{
          fontFamily: BRAND.fonts.body,
          fontSize: 22,
          color: BRAND.colors.goldLight,
          fontWeight: 500,
          paddingLeft: 16,
        }}
      >
        {row.label}
      </div>
      <div
        style={{
          fontFamily: BRAND.fonts.body,
          fontSize: 22,
          color: BRAND.colors.cream,
          fontWeight: 400,
          textAlign: "center",
        }}
      >
        {row.optionA}
      </div>
      <div
        style={{
          fontFamily: BRAND.fonts.body,
          fontSize: 22,
          color: BRAND.colors.cream,
          fontWeight: 400,
          textAlign: "center",
        }}
      >
        {row.optionB}
      </div>
    </div>
  );
};

export const ComparisonChart: React.FC<ComparisonChartProps> = ({
  title,
  optionAName,
  optionBName,
  rows,
  conclusion,
  ctaText = "Free Consultation — We'll Help You Choose",
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const headerOpacity = spring({
    frame: frame - 60,
    fps,
    config: { damping: 15, mass: 0.5 },
  });

  const conclusionDelay = 90 + rows.length * 12 + 20;
  const conclusionOpacity = spring({
    frame: frame - conclusionDelay,
    fps,
    config: { damping: 15, mass: 0.5 },
  });

  return (
    <AbsoluteFill>
      <NavyBackground>
        <GoldParticles count={10} />

        {/* Title */}
        <div
          style={{
            position: "absolute",
            top: 60,
            left: 0,
            right: 0,
            textAlign: "center",
          }}
        >
          <FadeInText
            text="Treatment Comparison"
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
          <GoldDivider width="35%" delay={25} />
        </div>

        {/* Column Headers */}
        <div
          style={{
            position: "absolute",
            top: 240,
            left: 60,
            right: 60,
            opacity: headerOpacity,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              paddingBottom: 16,
              borderBottom: `2px solid ${BRAND.colors.gold}`,
            }}
          >
            <div />
            <div
              style={{
                fontFamily: BRAND.fonts.headline,
                fontSize: 28,
                color: BRAND.colors.gold,
                fontWeight: 700,
                textAlign: "center",
              }}
            >
              {optionAName}
            </div>
            <div
              style={{
                fontFamily: BRAND.fonts.headline,
                fontSize: 28,
                color: BRAND.colors.gold,
                fontWeight: 700,
                textAlign: "center",
              }}
            >
              {optionBName}
            </div>
          </div>

          {/* Rows */}
          {rows.map((row, i) => (
            <TableRow key={i} row={row} index={i} />
          ))}
        </div>

        {/* Conclusion + CTA */}
        <div
          style={{
            position: "absolute",
            bottom: 80,
            left: 0,
            right: 0,
            textAlign: "center",
            opacity: conclusionOpacity,
          }}
        >
          <div
            style={{
              fontFamily: BRAND.fonts.headline,
              fontSize: 26,
              color: BRAND.colors.cream,
              fontWeight: 400,
              fontStyle: "italic",
              marginBottom: 24,
              padding: "0 80px",
            }}
          >
            {conclusion}
          </div>
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
        </div>

        <LogoWatermark />
      </NavyBackground>
    </AbsoluteFill>
  );
};
