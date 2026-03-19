import {
  Brain,
  Zap,
  Heart,
  Clock,
} from "lucide-react";
import CSSFadeIn from "@/components/animations/CSSFadeIn";

const whyRani = [
  {
    icon: Brain,
    title: "Neurologist-Led",
    description: "Medical director oversight on all treatments",
  },
  {
    icon: Zap,
    title: "Proven Technology",
    description: "Candela GentleMax Pro Plus & Cutera Secret Pro",
  },
  {
    icon: Heart,
    title: "Full Spectrum",
    description: "Aesthetics + medical wellness under one roof",
  },
  {
    icon: Clock,
    title: "Open 7 Days",
    description: "Convenient scheduling for every lifestyle",
  },
];

export default function WhyRaniCards() {
  return (
    <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
      {whyRani.map((item, i) => (
        <CSSFadeIn key={item.title} delay={i * 100} className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
            <item.icon size={28} className="text-rani-gold" />
          </div>
          <h3 className="mt-4 font-body text-lg font-bold text-rani-navy">
            {item.title}
          </h3>
          <p className="mt-2 font-body text-sm text-rani-muted">
            {item.description}
          </p>
        </CSSFadeIn>
      ))}
    </div>
  );
}
