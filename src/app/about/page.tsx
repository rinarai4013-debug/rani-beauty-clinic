import type { Metadata } from "next";
import AboutPageClient from "./AboutPageClient";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Rani Beauty Clinic — a woman-owned, physician-supervised medspa in Renton, WA. Meet our Medical Director Dr. Alexander Landfield, board-certified neurologist, and our expert team.",
};

export default function AboutPage() {
  return <AboutPageClient />;
}
