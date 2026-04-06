'use client';

/**
 * Error boundary for patient plan pages.
 * Catches any unhandled errors and shows a recovery UI
 * instead of a blank screen.
 */

export default function PatientPlanError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{
        background: 'linear-gradient(180deg, #0F1D2C 0%, #1a2d3f 50%, #0F1D2C 100%)',
      }}
    >
      <div
        className="w-full max-w-md text-center p-8 rounded-2xl"
        style={{ backgroundColor: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)' }}
      >
        <h1
          className="text-2xl font-bold mb-3"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#C9A96E' }}
        >
          RANI BEAUTY CLINIC
        </h1>
        <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.5)', letterSpacing: '2px' }}>
          MEDICAL AESTHETICS & WELLNESS
        </p>

        <div className="mb-6">
          <p className="text-base mb-2" style={{ color: 'rgba(255,255,255,0.9)' }}>
            We&apos;re having trouble loading your treatment plan.
          </p>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            This is usually temporary. Please try again or contact us for assistance.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="w-full py-3 rounded-xl font-semibold text-sm tracking-wide"
            style={{ backgroundColor: '#C9A96E', color: '#fff' }}
          >
            Try Again
          </button>
          <a
            href="tel:+14255394440"
            className="w-full py-3 rounded-xl font-semibold text-sm tracking-wide text-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)' }}
          >
            Call (425) 539-4440
          </a>
          <a
            href="https://ranibeautyclinic.com"
            className="text-xs mt-2"
            style={{ color: '#C9A96E' }}
          >
            Visit Rani Beauty Clinic
          </a>
        </div>
      </div>
    </div>
  );
}
