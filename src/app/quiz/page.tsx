import type { Metadata } from "next";
import SkinQuiz from "@/components/sections/SkinQuiz";

export const metadata: Metadata = {
  title: "Find Your Perfect Treatment | Skin Quiz",
  description:
    "Take our personalized skin concern quiz to discover the best treatments for your goals, skin type, and budget. Get a tailored 3-tier recommendation in under 2 minutes.",
  alternates: {
    canonical: "https://www.ranibeautyclinic.com/quiz",
  },
  openGraph: {
    title: "Find Your Perfect Treatment | Skin Quiz",
    description:
      "Take our personalized skin concern quiz to discover the best treatments for your goals, skin type, and budget.",
    url: "https://www.ranibeautyclinic.com/quiz",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Rani Beauty Clinic — Find Your Perfect Treatment",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Find Your Perfect Treatment | Skin Quiz",
    description:
      "Take our personalized skin concern quiz to discover the best treatments for your goals, skin type, and budget.",
  },
};

export default function QuizPage() {
  return (
    <>
      <h1 className="sr-only">Find Your Perfect Treatment — Skin Quiz</h1>
      <SkinQuiz />
    </>
  );
}
