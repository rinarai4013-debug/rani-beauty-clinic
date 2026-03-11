import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | Expert Insights & Skincare Tips",
  description:
    "Explore expert articles on aesthetic treatments, medical wellness, and skincare science from the physician-led team at Rani Beauty Clinic in Renton, WA.",
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
