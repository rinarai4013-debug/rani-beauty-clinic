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
  LogoWatermark,
} from "../components/Background";

interface Review {
  name: string;
  text: string;
  treatment: string;
  rating: number;
}

interface ReviewSocialProofProps {
  reviews: Review[];
  overallRating?: string;
  reviewCount?: string;
}

const StarRow: React.FC<{ count: number; delay: number; size?: number }> = ({
  count,
  delay,
  size = 28,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div style={{ display: "flex", gap: 4 }}>
      {Array.from({ length: count }).map((_, i) => {
        const starOpacity = spring({
          frame: frame - delay - i * 3,
          fps,
          config: { damping: 15, mass: 0.3 },
        });
        const starScale = interpolate(
          spring({
            frame: frame - delay - i * 3,
            fps,
            config: { damping: 12, mass: 0.3 },
          }),
          [0, 1],
          [0.3, 1]
        );

        return (
          <div
            key={i}
            style={{
              opacity: starOpacity,
              transform: `scale(${starScale})`,
              fontSize: size,
              color: BRAND.colors.gold,
            }}
          >
            ★
          </div>
        );
      })}
    </div>
  );
};

const ReviewCard: React.FC<{
  review: Review;
  startFrame: number;
  endFrame: number;
}> = ({ review, startFrame, endFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 20, mass: 0.5 },
  });

  const exit = interpolate(frame, [endFrame - 15, endFrame], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const opacity = Math.min(enter, exit);
  const translateY = interpolate(enter, [0, 1], [60, 0]);

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        background: "rgba(201, 169, 110, 0.08)",
        border: `1px solid rgba(201, 169, 110, 0.2)`,
        borderRadius: 20,
        padding: "40px 48px",
        maxWidth: 800,
        width: "85%",
      }}
    >
      <StarRow count={review.rating} delay={startFrame + 5} />
      <div
        style={{
          fontFamily: BRAND.fonts.body,
          fontSize: 26,
          lineHeight: 1.6,
          color: BRAND.colors.cream,
          marginTop: 20,
          fontWeight: 300,
          fontStyle: "italic",
        }}
      >
        "{review.text.length > 150
          ? review.text.slice(0, 150) + "..."
          : review.text}"
      </div>
      <div
        style={{
          marginTop: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: BRAND.fonts.headline,
              fontSize: 24,
              color: BRAND.colors.gold,
              fontWeight: 700,
            }}
          >
            {review.name}
          </div>
          <div
            style={{
              fontFamily: BRAND.fonts.body,
              fontSize: 16,
              color: BRAND.colors.goldLight,
              opacity: 0.5,
              marginTop: 4,
            }}
          >
            Verified Patient
          </div>
        </div>
        <div
          style={{
            fontFamily: BRAND.fonts.body,
            fontSize: 16,
            color: BRAND.colors.goldLight,
            opacity: 0.6,
            padding: "6px 16px",
            border: `1px solid rgba(201, 169, 110, 0.3)`,
            borderRadius: 20,
          }}
        >
          {review.treatment}
        </div>
      </div>
    </div>
  );
};

export const ReviewSocialProof: React.FC<ReviewSocialProofProps> = ({
  reviews,
  overallRating = BRAND.clinic.rating,
  reviewCount = BRAND.clinic.reviewCount,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const cardDuration = Math.floor(
    (durationInFrames - 120) / reviews.length
  );

  // Big rating number animation
  const ratingScale = spring({
    frame,
    fps,
    config: { damping: 12, mass: 0.8 },
  });

  const showRating = frame < 90;
  const ratingOpacity = showRating
    ? interpolate(frame, [0, 15, 75, 90], [0, 1, 1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  return (
    <AbsoluteFill>
      <NavyBackground>
        <GoldParticles count={12} />

        {/* Opening: Big Rating */}
        {showRating && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              opacity: ratingOpacity,
            }}
          >
            <div
              style={{
                fontFamily: BRAND.fonts.headline,
                fontSize: 180,
                fontWeight: 700,
                color: BRAND.colors.gold,
                transform: `scale(${ratingScale})`,
                lineHeight: 1,
              }}
            >
              {overallRating}
            </div>
            <StarRow count={5} delay={10} size={40} />
            <div
              style={{
                fontFamily: BRAND.fonts.body,
                fontSize: 24,
                color: BRAND.colors.cream,
                marginTop: 20,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                fontWeight: 300,
              }}
            >
              {reviewCount} Verified Reviews
            </div>
          </div>
        )}

        {/* Review Cards */}
        {reviews.map((review, i) => {
          const start = 90 + i * cardDuration;
          const end = start + cardDuration;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ReviewCard review={review} startFrame={start} endFrame={end} />
            </div>
          );
        })}

        {/* Closing CTA */}
        <Sequence from={durationInFrames - 90}>
          <div
            style={{
              position: "absolute",
              bottom: 80,
              left: 0,
              right: 0,
              textAlign: "center",
            }}
          >
            <FadeInText
              text="Seattle's Highest-Rated Medspa"
              fontSize={32}
              color={BRAND.colors.cream}
              fontFamily={BRAND.fonts.headline}
            />
            <FadeInText
              text={BRAND.clinic.website}
              fontSize={20}
              color={BRAND.colors.goldLight}
              fontFamily={BRAND.fonts.body}
              fontWeight={300}
              delay={15}
              style={{ marginTop: 16, opacity: 0.6 }}
            />
          </div>
        </Sequence>

        <LogoWatermark />
      </NavyBackground>
    </AbsoluteFill>
  );
};
