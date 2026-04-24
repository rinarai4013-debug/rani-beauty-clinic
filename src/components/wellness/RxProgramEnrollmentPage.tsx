import Link from "next/link";
import { notFound } from "next/navigation";
import { clinicInfo } from "@/data/clinic-info";
import { getRxProgram, type RxProgramSlug } from "@/lib/rx-programs";

interface RxProgramEnrollmentPageProps {
  slug: RxProgramSlug;
}

export default function RxProgramEnrollmentPage({
  slug,
}: RxProgramEnrollmentPageProps) {
  const program = getRxProgram(slug);

  if (!program) {
    notFound();
  }

  const intakeFormUrl = process.env[program.intakeFormEnvKey];
  const intakeHref = intakeFormUrl || `/contact?service=${encodeURIComponent(program.label)}`;

  return (
    <main className="min-h-screen bg-[#0F1D2C] text-white">
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <p className="text-[#C9A96E] uppercase tracking-widest text-xs sm:text-sm font-semibold">
          Rx Program Enrollment
        </p>
        <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-serif font-bold">
          {program.label} Enrollment
        </h1>
        <p className="mt-5 text-white/80 max-w-3xl leading-relaxed">
          Complete your intake to begin provider review. Once submitted, your
          enrollment is routed to our clinical team for consult scheduling,
          prescription decisioning, and monthly billing setup.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <a
            href={intakeHref}
            target={intakeFormUrl ? "_blank" : undefined}
            rel={intakeFormUrl ? "noopener noreferrer" : undefined}
            className="inline-flex items-center justify-center px-8 py-3 rounded-lg bg-[#C9A96E] text-[#0F1D2C] font-semibold hover:bg-[#C9A96E]/90 transition-colors"
          >
            Start Intake Form
          </a>
          {program.parentPath && (
            <Link
              href={program.parentPath}
              className="inline-flex items-center justify-center px-8 py-3 rounded-lg border border-white/30 text-white font-semibold hover:bg-white/5 transition-colors"
            >
              Back to Program Page
            </Link>
          )}
        </div>

        {!intakeFormUrl && (
          <p className="mt-4 text-sm text-white/70">
            Intake form URL is not configured yet. Use the contact option above
            or call {clinicInfo.phoneDisplay}.
          </p>
        )}
      </section>
    </main>
  );
}
