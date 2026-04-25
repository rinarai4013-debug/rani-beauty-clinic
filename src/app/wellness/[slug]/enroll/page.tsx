import { notFound } from "next/navigation";
import RxProgramEnrollmentPage from "@/components/wellness/RxProgramEnrollmentPage";
import { type RxProgramSlug, getRxProgram } from "@/lib/rx-programs";

const STATIC_ENROLL_SLUGS = [
  "glp1-weight-management",
  "nad-injections",
] as const satisfies ReadonlyArray<RxProgramSlug>;

export const dynamicParams = false;

export function generateStaticParams() {
  return STATIC_ENROLL_SLUGS.map((slug) => ({ slug }));
}

export default function WellnessEnrollPage({
  params,
}: {
  params: { slug: string };
}) {
  const program = getRxProgram(params.slug);
  if (!program) {
    notFound();
  }

  return <RxProgramEnrollmentPage slug={program.slug} />;
}
