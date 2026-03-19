import type { Metadata } from "next";
import SkinQuiz from "@/components/sections/SkinQuiz";

export const metadata: Metadata = {
  title: "Find Your Perfect Treatment | Skin Quiz",
  description:
    "Take our personalized skin concern quiz to discover the best treatments for your goals, skin type, and budget. Get a tailored 3-tier recommendation in under 2 minutes.",
  openGraph: {
    title: "Find Your Perfect Treatment | Skin Quiz",
    description:
      "Take our personalized skin concern quiz to discover the best treatments for your goals, skin type, and budget.",
    url: "https://www.ranibeautyclinic.com/quiz",
  },
};

export default function QuizPage() {
  return <SkinQuiz />;
}
