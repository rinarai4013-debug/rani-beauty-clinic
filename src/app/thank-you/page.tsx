import { Metadata } from "next";
import Link from "next/link";
import { CheckCircle, Phone, MapPin, Calendar } from "lucide-react";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import Button from "@/components/ui/Button";
import { clinicInfo } from "@/data/clinic-info";

export const metadata: Metadata = {
  title: "Thank You | Rani Beauty Clinic",
  description:
    "Thank you for reaching out! Our team will contact you within 2 minutes with a personalized booking link.",
  robots: { index: false, follow: false },
};

export default function ThankYouPage() {
  return (
    <section className="min-h-screen bg-rani-cream flex items-center">
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <FadeInOnScroll>
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle size={40} className="text-green-600" />
          </div>

          <h1 className="mt-8 font-heading text-3xl font-bold text-rani-navy md:text-4xl">
            Thank You!
          </h1>

          <p className="mt-4 font-body text-lg text-rani-text">
            We've received your information. One of our aesthetic specialists
            will text you within <strong>2 minutes</strong> with a personalized
            booking link.
          </p>

          <div className="mt-8 rounded-xl border border-rani-border bg-white p-6">
            <h2 className="font-body text-lg font-bold text-rani-navy">
              What Happens Next
            </h2>
            <ul className="mt-4 space-y-3 text-left">
              <li className="flex items-start gap-3">
                <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rani-gold/20 font-body text-xs font-bold text-rani-navy">
                  1
                </span>
                <span className="font-body text-sm text-rani-text">
                  Our team reviews your information and prepares personalized
                  recommendations
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rani-gold/20 font-body text-xs font-bold text-rani-navy">
                  2
                </span>
                <span className="font-body text-sm text-rani-text">
                  You'll receive a text message with your booking link within
                  minutes
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rani-gold/20 font-body text-xs font-bold text-rani-navy">
                  3
                </span>
                <span className="font-body text-sm text-rani-text">
                  Choose your preferred date and time — we're open 7 days a week
                </span>
              </li>
            </ul>
          </div>

          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button
              href={clinicInfo.booking.url}
              className="!bg-rani-gold !text-rani-navy hover:!bg-rani-gold-light"
            >
              Book Online Now
            </Button>
            <Button variant="secondary" href={clinicInfo.phoneTel}>
              <Phone size={16} />
              {clinicInfo.phone}
            </Button>
          </div>

          <div className="mt-8 flex flex-col items-center gap-2 text-center">
            <div className="flex items-center gap-2 font-body text-sm text-rani-muted">
              <MapPin size={14} className="text-rani-gold" />
              {clinicInfo.address.full}
            </div>
            <div className="flex items-center gap-2 font-body text-sm text-rani-muted">
              <Calendar size={14} className="text-rani-gold" />
              {clinicInfo.hours.formatted}
            </div>
          </div>

          <p className="mt-8 font-body text-xs text-rani-muted">
            Didn't receive a text?{" "}
            <Link
              href="/contact"
              className="text-rani-navy underline hover:text-rani-gold"
            >
              Contact us
            </Link>{" "}
            or call{" "}
            <a
              href={clinicInfo.phoneTel}
              className="text-rani-navy underline hover:text-rani-gold"
            >
              {clinicInfo.phone}
            </a>
          </p>
        </FadeInOnScroll>
      </div>
    </section>
  );
}
