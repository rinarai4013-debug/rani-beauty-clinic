import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  useCurrentFrame,
  spring,
  useVideoConfig,
  Img,
} from "remotion";
import { BRAND } from "../brand";
import { FadeInText, GoldShimmerText } from "../components/AnimatedText";
import {
  NavyBackground,
  GoldParticles,
  GoldDivider,
  LogoWatermark,
} from "../components/Background";

interface BeforeAfterRevealProps {
  treatmentName: string;
  subtitle: string;
  beforeImageSrc?: string;
  afterImageSrc?: string;
  resultText: string;
  ctaText?: string;
}

export const BeforeAfterReveal: React.FC<BeforeAfterRevealProps> = ({
  treatmentName,
  subtitle,
  beforeImageSrc,
  afterImageSrc,
  resultText,
  ctaText = "Book Your Free Consultation",
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();

  // Phase 1: Title (0-60)
  // Phase 2: Before side (60-150)
  // Phase 3: Golden wipe reveal (150-240)
  // Phase 4: Result text + CTA (240-end)

  const wipeProgress = interpolate(frame, [150, 240], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const beforeOpacity = interpolate(frame, [60, 75], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const resultOpacity = spring({
    frame: frame - 250,
    fps,
    config: { damping: 20, mass: 0.5 },
  });

  return (
    <AbsoluteFill>
      <NavyBackground>
        <GoldParticles count={10} />

        {/* Phase 1: Title */}
        <Sequence from={0} durationInFrames={90}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
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
            />
            <GoldShimmerText
              text={treatmentName}
              fontSize={52}
              delay={10}
              style={{ marginTop: 16 }}
            />
            <GoldDivider width="30%" delay={25} />
            <FadeInText
              text="Real Results. No Filter."
              fontSize={24}
              color={BRAND.colors.cream}
              fontFamily={BRAND.fonts.body}
              fontWeight={300}
              delay={35}
              style={{ marginTop: 8 }}
            />
          </div>
        </Sequence>

        {/* Phase 2-3: Before/After with golden wipe */}
        {frame >= 60 && (
          <div
            style={{
              position: "absolute",
              top: 120,
              left: 60,
              right: 60,
              bottom: 250,
              opacity: beforeOpacity,
              borderRadius: 16,
              overflow: "hidden",
              border: `1px solid rgba(201, 169, 110, 0.3)`,
            }}
          >
            {/* Before side - placeholder gradient */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: beforeImageSrc
                  ? undefined
                  : `linear-gradient(135deg, #2a3a4a 0%, #1a2a3a 100%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {beforeImageSrc ? (
                <Img src={beforeImageSrc} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div
                  style={{
                    fontFamily: BRAND.fonts.body,
                    fontSize: 48,
                    color: "rgba(201, 169, 110, 0.2)",
                    fontWeight: 300,
                  }}
                >
                  BEFORE
                </div>
              )}
            </div>

            {/* After side - revealed by wipe */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                clipPath: `inset(0 ${(1 - wipeProgress) * 100}% 0 0)`,
                background: afterImageSrc
                  ? undefined
                  : `linear-gradient(135deg, #3a4a5a 0%, #2a3a4a 100%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {afterImageSrc ? (
                <Img src={afterImageSrc} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div
                  style={{
                    fontFamily: BRAND.fonts.body,
                    fontSize: 48,
                    color: "rgba(201, 169, 110, 0.4)",
                    fontWeight: 300,
                  }}
                >
                  AFTER
                </div>
              )}
            </div>

            {/* Golden wipe line */}
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${wipeProgress * 100}%`,
                width: 4,
                background: `linear-gradient(180deg, transparent 0%, ${BRAND.colors.gold} 20%, ${BRAND.colors.goldLight} 50%, ${BRAND.colors.gold} 80%, transparent 100%)`,
                boxShadow: `0 0 20px ${BRAND.colors.gold}, 0 0 40px rgba(201, 169, 110, 0.3)`,
                opacity: wipeProgress > 0 && wipeProgress < 1 ? 1 : 0,
              }}
            />

            {/* Before/After labels */}
            <div
              style={{
                position: "absolute",
                bottom: 16,
                left: 20,
                fontFamily: BRAND.fonts.body,
                fontSize: 14,
                color: BRAND.colors.goldLight,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                opacity: 0.6,
              }}
            >
              Before
            </div>
            <div
              style={{
                position: "absolute",
                bottom: 16,
                right: 20,
                fontFamily: BRAND.fonts.body,
                fontSize: 14,
                color: BRAND.colors.gold,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                opacity: wipeProgress > 0.8 ? 0.8 : 0,
              }}
            >
              After
            </div>
          </div>
        )}

        {/* Phase 4: Result text + CTA */}
        <div
          style={{
            position: "absolute",
            bottom: 80,
            left: 0,
            right: 0,
            textAlign: "center",
            opacity: resultOpacity,
          }}
        >
          <div
            style={{
              fontFamily: BRAND.fonts.headline,
              fontSize: 28,
              color: BRAND.colors.cream,
              fontWeight: 400,
              fontStyle: "italic",
              marginBottom: 24,
            }}
          >
            {resultText}
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
