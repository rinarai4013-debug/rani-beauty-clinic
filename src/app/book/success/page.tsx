import { Metadata } from "next";
import { CheckCircle } from "lucide-react";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import Button from "@/components/ui/Button";
import ReviewCTA from "@/components/conversion/ReviewCTA";
import { clinicInfo } from "@/data/clinic-info";

export const metadata: Metadata = {
  title: "Booking Confirmed | Rani Beauty Clinic",
  description:
    "Your appointment at Rani Beauty Clinic has been confirmed. We look forward to seeing you.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function BookingSuccessPage() {
  return (
    <section className="min-h-screen bg-rani-cream flex items-center">
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <FadeInOnScroll>
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle size={40} className="text-green-600" />
          </div>

          <h1 className="mt-8 font-heading text-3xl font-bold text-rani-navy md:text-4xl">
            Booking Confirmed
          </h1>

          <p className="mt-4 font-body text-lg text-rani-text">
            Your appointment at Rani Beauty Clinic has been confirmed. You&apos;ll
            receive a confirmation text and email shortly with all the details.
          </p>

          <div className="mt-8 rounded-xl border border-rani-border bg-white p-6">
            <h2 className="font-body text-lg font-bold text-rani-navy">
              Before Your Visit
            </h2>
            <ul className="mt-4 space-y-3 text-left">
              <li className="flex items-start gap-3">
                <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rani-gold/20 font-body text-xs font-bold text-rani-navy">
                  1
                </span>
                <span className="font-body text-sm text-rani-text">
                  Arrive 10 minutes early to complete any intake forms
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rani-gold/20 font-body text-xs font-bold text-rani-navy">
                  2
                </span>
                <span className="font-body text-sm text-rani-text">
                  Come with a clean face — no makeup or heavy moisturizers for
                  skin treatments
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rani-gold/20 font-body text-xs font-bold text-rani-navy">
                  3
                </span>
                <span className="font-body text-sm text-rani-text">
                  Bring a list of any medications or skincare products you
                  currently use
                </span>
              </li>
            </ul>
          </div>

          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button
              href="/"
              className="!bg-rani-gold !text-rani-navy hover:!bg-rani-gold-light"
            >
              Return Home
            </Button>
            <Button variant="secondary" href={clinicInfo.phoneTel}>
              Questions? Call Us
            </Button>
          </div>

          {/* Google Review CTA */}
          <div className="mt-10">
            <ReviewCTA location="booking_success_page" />
          </div>
        </FadeInOnScroll>
      </div>
    </section>
  );
}
