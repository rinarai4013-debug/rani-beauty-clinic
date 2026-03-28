import React from "react";
import { Composition } from "remotion";
import { TreatmentPricingCard } from "./videos/TreatmentPricingCard";
import { ReviewSocialProof } from "./videos/ReviewSocialProof";
import { BeforeAfterReveal } from "./videos/BeforeAfterReveal";
import { ComparisonChart } from "./videos/ComparisonChart";
import { WellnessMenu } from "./videos/WellnessMenu";

// 9:16 Reels format
const REEL_WIDTH = 1080;
const REEL_HEIGHT = 1920;
const FPS = 30;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* ===== #6: Laser Hair Removal Pricing Card ===== */}
      <Composition
        id="LaserPricingCard"
        component={TreatmentPricingCard}
        durationInFrames={20 * FPS}
        fps={FPS}
        width={REEL_WIDTH}
        height={REEL_HEIGHT}
        defaultProps={{
          title: "Laser Hair Removal",
          subtitle: "The Gold Standard • Candela GentleMax Pro Plus",
          items: [
            { name: "Upper Lip", price: "$79", time: "5 min" },
            { name: "Underarms", price: "$149", time: "10 min" },
            { name: "Full Brazilian", price: "$225", time: "20 min" },
            { name: "Full Face", price: "$275", time: "25 min" },
            { name: "Half Legs", price: "$225", time: "23 min" },
            { name: "Full Legs", price: "$375", time: "43 min" },
            { name: "Full Arms", price: "$375", time: "28 min" },
            { name: "Full Body", price: "$1,199", time: "105 min", note: "Best value" },
          ],
          highlight: "Full Body",
          ctaText: "Book Your Free Consultation",
        }}
      />

      {/* ===== HydraFacial Pricing ===== */}
      <Composition
        id="HydraFacialPricing"
        component={TreatmentPricingCard}
        durationInFrames={18 * FPS}
        fps={FPS}
        width={REEL_WIDTH}
        height={REEL_HEIGHT}
        defaultProps={{
          title: "HydraFacial",
          subtitle: "30 Minutes to Glass Skin",
          items: [
            { name: "Express Facial", price: "$99", time: "60 min" },
            { name: "Signature HydraFacial", price: "$225", time: "60 min", note: "Members: $199" },
            { name: "Back HydraFacial", price: "$325", time: "45 min" },
            { name: "Keravive Scalp", price: "$575", time: "60 min" },
            { name: "Dermaplaning Add-On", price: "+$49", time: "15 min" },
            { name: "Neck & Décolleté", price: "+$125", time: "15 min" },
          ],
          highlight: "Signature HydraFacial",
          ctaText: "Glow Starts Here",
        }}
      />

      {/* ===== Sofwave Pricing ===== */}
      <Composition
        id="SofwavePricing"
        component={TreatmentPricingCard}
        durationInFrames={18 * FPS}
        fps={FPS}
        width={REEL_WIDTH}
        height={REEL_HEIGHT}
        defaultProps={{
          title: "Sofwave",
          subtitle: "Non-Surgical Skin Tightening • FDA-Cleared",
          items: [
            { name: "Brow Lift", price: "$1,150", time: "30 min" },
            { name: "Lower Face", price: "$2,250", time: "45 min" },
            { name: "Neck / Submental", price: "$1,750", time: "45 min" },
            { name: "Full Face", price: "$2,250", time: "60 min" },
            { name: "Full Face + Neck", price: "$3,999", time: "90 min", note: "Complete rejuvenation" },
          ],
          highlight: "Full Face + Neck",
          ctaText: "Lift Without Surgery",
        }}
      />

      {/* ===== RF Microneedling Pricing ===== */}
      <Composition
        id="RFMicroneedlingPricing"
        component={TreatmentPricingCard}
        durationInFrames={18 * FPS}
        fps={FPS}
        width={REEL_WIDTH}
        height={REEL_HEIGHT}
        defaultProps={{
          title: "RF Microneedling",
          subtitle: "Rebuild From Within • Cutera Secret",
          items: [
            { name: "Full Face", price: "$750", time: "90 min" },
            { name: "Full Face & Neck", price: "$1,100", time: "90 min" },
            { name: "Arms", price: "$495", time: "120 min" },
            { name: "Abdomen (small)", price: "$595", time: "120 min" },
            { name: "Buttocks", price: "$695", time: "120 min" },
            { name: "Abdomen (large)", price: "$1,100", time: "120 min" },
            { name: "Legs", price: "$1,500", time: "120 min" },
          ],
          ctaText: "Stimulate Your Collagen",
        }}
      />

      {/* ===== Chemical Peels Pricing ===== */}
      <Composition
        id="ChemicalPeelsPricing"
        component={TreatmentPricingCard}
        durationInFrames={18 * FPS}
        fps={FPS}
        width={REEL_WIDTH}
        height={REEL_HEIGHT}
        defaultProps={{
          title: "Chemical Peels",
          subtitle: "Medical-Grade Skin Resurfacing",
          items: [
            { name: "VI Peel (any variant)", price: "$325", time: "30 min" },
            { name: "BioRePeel Face", price: "$350", time: "60 min" },
            { name: "BioRePeel Face & Neck", price: "$450", time: "60 min" },
            { name: "BioRePeel Intimate Area", price: "$425", time: "60 min" },
            { name: "BioRePeel Back", price: "$575", time: "60 min" },
            { name: "PRX T33 Face", price: "$475", time: "60 min" },
          ],
          ctaText: "Reveal Your Best Skin",
        }}
      />

      {/* ===== GLP-1 Pricing ===== */}
      <Composition
        id="GLP1Pricing"
        component={TreatmentPricingCard}
        durationInFrames={20 * FPS}
        fps={FPS}
        width={REEL_WIDTH}
        height={REEL_HEIGHT}
        defaultProps={{
          title: "GLP-1 Weight Management",
          subtitle: "Physician-Supervised • Real Clinic, Real Results",
          items: [
            { name: "Semaglutide (Month 1)", price: "$349/mo", note: "0.25mg/wk starting dose" },
            { name: "Semaglutide (Month 3+)", price: "$449/mo", note: "1.0mg/wk" },
            { name: "Tirzepatide (Month 1)", price: "$449/mo", note: "2.5mg/wk starting dose" },
            { name: "Tirzepatide (Month 3+)", price: "$549/mo", note: "7.5mg/wk" },
            { name: "Liraglutide (Starter)", price: "$249/mo" },
            { name: "Transform Package", price: "$1,199", note: "3mo Semaglutide + labs + consults — Most Popular" },
          ],
          highlight: "Transform Package",
          ctaText: "Free Weight Loss Consultation",
        }}
      />

      {/* ===== #25: Review Social Proof ===== */}
      <Composition
        id="ReviewSocialProof"
        component={ReviewSocialProof}
        durationInFrames={25 * FPS}
        fps={FPS}
        width={REEL_WIDTH}
        height={REEL_HEIGHT}
        defaultProps={{
          reviews: [
            {
              name: "Sarah M.",
              text: "I was so nervous about laser hair removal, but the Candela GentleMax Pro Plus made it completely pain-free. I actually fell asleep during my session!",
              treatment: "Laser Hair Removal",
              rating: 5,
            },
            {
              name: "Jennifer L.",
              text: "Having a board-certified neurologist administer my Botox makes all the difference. My results look completely natural. Friends keep telling me I look refreshed.",
              treatment: "Botox",
              rating: 5,
            },
            {
              name: "Marcus T.",
              text: "Years of acne left me with deep scarring. After my RF microneedling series, the texture of my skin has improved dramatically. I finally feel comfortable.",
              treatment: "RF Microneedling",
              rating: 5,
            },
            {
              name: "Angela R.",
              text: "The GLP-1 weight management program has been truly life-changing. I've lost 40 pounds and gained a whole new outlook on my health.",
              treatment: "GLP-1 Program",
              rating: 5,
            },
          ],
        }}
      />

      {/* ===== #24: Before/After — HydraFacial ===== */}
      <Composition
        id="BeforeAfterHydraFacial"
        component={BeforeAfterReveal}
        durationInFrames={15 * FPS}
        fps={FPS}
        width={REEL_WIDTH}
        height={REEL_HEIGHT}
        defaultProps={{
          treatmentName: "HydraFacial",
          subtitle: "The 30-Minute Glow",
          resultText: "One session. Zero downtime. Instant glow.",
          ctaText: "Signature HydraFacial — $225",
        }}
      />

      {/* ===== Before/After — RF Microneedling ===== */}
      <Composition
        id="BeforeAfterRFMicro"
        component={BeforeAfterReveal}
        durationInFrames={15 * FPS}
        fps={FPS}
        width={REEL_WIDTH}
        height={REEL_HEIGHT}
        defaultProps={{
          treatmentName: "RF Microneedling",
          subtitle: "Acne Scar Reduction",
          resultText: "Rebuild your skin's texture from within.",
          ctaText: "Full Face — $750",
        }}
      />

      {/* ===== #31: Botox vs Dysport Comparison ===== */}
      <Composition
        id="BotoxVsDysport"
        component={ComparisonChart}
        durationInFrames={25 * FPS}
        fps={FPS}
        width={REEL_WIDTH}
        height={REEL_HEIGHT}
        defaultProps={{
          title: "Botox vs Dysport",
          optionAName: "Botox",
          optionBName: "Dysport",
          rows: [
            { label: "Onset", optionA: "5–7 days", optionB: "2–3 days" },
            { label: "Spread", optionA: "Precise", optionB: "Wider diffusion" },
            { label: "Best For", optionA: "Fine lines", optionB: "Larger areas" },
            { label: "Duration", optionA: "3–4 months", optionB: "3–4 months" },
            { label: "Units Needed", optionA: "Standard", optionB: "2.5–3x more" },
            { label: "Natural Look", optionA: "Excellent", optionB: "Excellent" },
          ],
          conclusion:
            "Both are neurotoxins. The difference is in the details — and your injector's expertise.",
        }}
      />

      {/* ===== HydraFacial vs Regular Facial ===== */}
      <Composition
        id="HydraFacialVsRegular"
        component={ComparisonChart}
        durationInFrames={25 * FPS}
        fps={FPS}
        width={REEL_WIDTH}
        height={REEL_HEIGHT}
        defaultProps={{
          title: "HydraFacial vs Spa Facial",
          optionAName: "HydraFacial",
          optionBName: "Spa Facial",
          rows: [
            { label: "Technology", optionA: "Vortex suction", optionB: "Manual" },
            { label: "Extraction", optionA: "Painless, deep", optionB: "Surface only" },
            { label: "Serums", optionA: "Medical-grade", optionB: "Cosmetic" },
            { label: "Results", optionA: "Immediate glow", optionB: "Temporary" },
            { label: "Downtime", optionA: "Zero", optionB: "Zero" },
            { label: "Customizable", optionA: "Fully", optionB: "Limited" },
          ],
          conclusion:
            "Relaxation vs results. Why settle for one?",
          ctaText: "Signature HydraFacial — $225",
        }}
      />

      {/* ===== #18: Wellness Injection Menu ===== */}
      <Composition
        id="WellnessInjectionMenu"
        component={WellnessMenu}
        durationInFrames={15 * FPS}
        fps={FPS}
        width={REEL_WIDTH}
        height={REEL_HEIGHT}
        defaultProps={{
          items: [
            { name: "B12", benefit: "Energy", price: "$35", icon: "⚡" },
            { name: "Vitamin D3", benefit: "Immunity", price: "$50", icon: "☀️" },
            { name: "Glutathione", benefit: "Glow", price: "$100", icon: "✨" },
            { name: "NAD+", benefit: "Cellular Youth", price: "$150", icon: "🧬" },
          ],
        }}
      />

      {/* ===== Full Wellness Menu ===== */}
      <Composition
        id="WellnessFullMenu"
        component={WellnessMenu}
        durationInFrames={18 * FPS}
        fps={FPS}
        width={REEL_WIDTH}
        height={REEL_HEIGHT}
        defaultProps={{
          title: "Elevate Your Wellness",
          items: [
            { name: "B12", benefit: "Energy & Focus", price: "$35", icon: "⚡" },
            { name: "D3", benefit: "Immune Support", price: "$50", icon: "☀️" },
            { name: "Tri-Immune", benefit: "Triple Defense", price: "$75", icon: "🛡️" },
            { name: "Glutathione", benefit: "Radiance", price: "$100", icon: "✨" },
          ],
          ctaText: "No Appointment Needed",
        }}
      />
    </>
  );
};
