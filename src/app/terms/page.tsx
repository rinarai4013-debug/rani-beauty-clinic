import { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, AlertTriangle } from "lucide-react";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import { clinicInfo } from "@/data/clinic-info";

export const metadata: Metadata = {
  title: "Terms of Service | Rani Beauty Clinic",
  description:
    "Read the terms of service for Rani Beauty Clinic in Renton, WA. Understand your rights and responsibilities when using our aesthetic and medical wellness services.",
  openGraph: {
    title: "Terms of Service | Rani Beauty Clinic",
    description:
      "Read the terms of service for Rani Beauty Clinic in Renton, WA. Understand your rights and responsibilities when using our aesthetic and medical wellness services.",
    type: "website",
    url: `${clinicInfo.website}/terms`,
  },
};

export default function TermsPage() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="bg-rani-cream pt-28 pb-4">
        <div className="mx-auto max-w-7xl px-6">
          <nav aria-label="Breadcrumb" className="font-body text-sm text-rani-muted">
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/" className="hover:text-rani-navy transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <ChevronRight size={14} className="text-rani-muted/50" />
              </li>
              <li>
                <span className="text-rani-navy font-semibold">Terms of Service</span>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Header */}
      <section className="bg-rani-cream pb-12">
        <div className="mx-auto max-w-4xl px-6">
          <FadeInOnScroll>
            <h1 className="font-heading text-4xl font-bold text-rani-navy md:text-5xl">
              Terms of Service
            </h1>
            <p className="mt-4 font-body text-rani-muted">
              Last updated: March 2026
            </p>
          </FadeInOnScroll>

          {/* Attorney Review Notice */}
          <FadeInOnScroll delay={0.2}>
            <div className="mt-6 rounded-lg border-2 border-amber-400 bg-amber-50 p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle size={22} className="mt-0.5 shrink-0 text-amber-600" />
                <div>
                  <p className="font-body font-semibold text-amber-800">
                    Attorney Review Required
                  </p>
                  <p className="mt-1 font-body text-sm text-amber-700">
                    [NOTE: Have an attorney review these terms of service before publishing to
                    ensure compliance with all applicable federal, state, and local laws, including
                    Washington State consumer protection statutes and healthcare regulations.]
                  </p>
                </div>
              </div>
            </div>
          </FadeInOnScroll>
        </div>
      </section>

      {/* Content */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="space-y-12">
            {/* Introduction */}
            <FadeInOnScroll>
              <div>
                <p className="font-body text-base leading-relaxed text-rani-text">
                  Welcome to Rani Beauty Clinic. These Terms of Service (&quot;Terms&quot;) govern your use
                  of our website located at{" "}
                  <Link href="/" className="text-rani-navy underline hover:no-underline">
                    {clinicInfo.website}
                  </Link>{" "}
                  and the aesthetic and medical wellness services provided at our clinic located at{" "}
                  {clinicInfo.address.full}. By accessing our website, scheduling an appointment,
                  or receiving any of our services, you agree to be bound by these Terms. If you do
                  not agree to these Terms, please do not use our website or services.
                </p>
              </div>
            </FadeInOnScroll>

            {/* Section 1 */}
            <FadeInOnScroll>
              <div>
                <h2 className="font-body text-2xl font-bold text-rani-navy">
                  1. Acceptance of Terms
                </h2>
                <div className="mt-1 h-0.5 w-10 bg-rani-gold" />
                <p className="mt-4 font-body text-base leading-relaxed text-rani-text">
                  By using the Rani Beauty Clinic website, scheduling an appointment, or receiving
                  any services from our clinic, you acknowledge that you have read, understood, and
                  agree to be bound by these Terms of Service, our{" "}
                  <Link
                    href="/privacy-policy"
                    className="text-rani-navy underline hover:no-underline"
                  >
                    Privacy Policy
                  </Link>
                  , and any additional agreements or policies referenced herein. We reserve the
                  right to modify these Terms at any time. Changes will be effective immediately
                  upon posting to our website. Your continued use of our website or services after
                  any modifications constitutes your acceptance of the revised Terms. It is your
                  responsibility to review these Terms periodically for updates.
                </p>
              </div>
            </FadeInOnScroll>

            {/* Section 2 */}
            <FadeInOnScroll>
              <div>
                <h2 className="font-body text-2xl font-bold text-rani-navy">
                  2. Description of Services
                </h2>
                <div className="mt-1 h-0.5 w-10 bg-rani-gold" />
                <p className="mt-4 font-body text-base leading-relaxed text-rani-text">
                  Rani Beauty Clinic is a medical spa that provides aesthetic treatments and medical
                  wellness services under the supervision of our Medical Director, Dr. Alexander
                  Landfield, a board-certified neurologist. Our services include but are not limited
                  to: laser hair removal, HydraFacial MD treatments, RF microneedling, BioRePeel,
                  Botox and Dysport injections, dermal fillers, chemical peels, red light therapy,
                  laser acne facials, AI-powered skin analysis, GLP-1 weight management (including
                  Semaglutide and Tirzepatide), peptide therapy, NAD+ injections, vitamin
                  injections, hormone therapy, and comprehensive blood work.
                </p>
                <p className="mt-4 font-body text-base leading-relaxed text-rani-text">
                  All medical treatments and procedures are performed by licensed, trained clinicians
                  under the supervision of Dr. Landfield. The specific services available may change
                  from time to time, and not all services may be appropriate for all individuals.
                  Eligibility for specific treatments will be determined during your consultation
                  based on your medical history, current health status, and treatment goals.
                </p>
              </div>
            </FadeInOnScroll>

            {/* Section 3 */}
            <FadeInOnScroll>
              <div>
                <h2 className="font-body text-2xl font-bold text-rani-navy">
                  3. Appointments and Cancellations
                </h2>
                <div className="mt-1 h-0.5 w-10 bg-rani-gold" />

                <h3 className="mt-6 font-body text-lg font-semibold text-rani-navy">
                  Scheduling
                </h3>
                <p className="mt-2 font-body text-base leading-relaxed text-rani-text">
                  Appointments may be scheduled by calling our clinic at {clinicInfo.phone}, through
                  our online booking system, or in person at our clinic. All appointments are
                  subject to availability. Scheduling an appointment constitutes your agreement to
                  these Terms of Service.
                </p>

                <h3 className="mt-6 font-body text-lg font-semibold text-rani-navy">
                  Cancellation Policy
                </h3>
                <p className="mt-2 font-body text-base leading-relaxed text-rani-text">
                  We understand that schedules change. We request that you provide at least 24
                  hours&apos; notice if you need to cancel or reschedule your appointment. Cancellations
                  made with less than 24 hours&apos; notice may be subject to a cancellation fee. The
                  specific cancellation fee amount will be communicated to you at the time of
                  booking. Repeated no-shows or late cancellations may result in a requirement to
                  provide a deposit for future appointments or, in extreme cases, the inability to
                  schedule future appointments.
                </p>

                <h3 className="mt-6 font-body text-lg font-semibold text-rani-navy">
                  Late Arrivals
                </h3>
                <p className="mt-2 font-body text-base leading-relaxed text-rani-text">
                  We strive to stay on schedule for all of our clients. If you arrive more than 15
                  minutes late for your scheduled appointment, we may need to reschedule your
                  appointment to avoid impacting other clients&apos; appointment times. Late arrivals
                  may result in a shortened treatment session, with no reduction in the service fee.
                </p>
              </div>
            </FadeInOnScroll>

            {/* Section 4 */}
            <FadeInOnScroll>
              <div>
                <h2 className="font-body text-2xl font-bold text-rani-navy">
                  4. Payment Terms
                </h2>
                <div className="mt-1 h-0.5 w-10 bg-rani-gold" />
                <p className="mt-4 font-body text-base leading-relaxed text-rani-text">
                  Payment for services is due at the time of service unless other arrangements have
                  been made in advance. We accept major credit cards, debit cards, and other payment
                  methods as posted at our clinic. Prices for services are subject to change without
                  notice, although we will make reasonable efforts to communicate price changes in
                  advance.
                </p>
                <p className="mt-4 font-body text-base leading-relaxed text-rani-text">
                  Certain services, including packages and treatment series, may require advance
                  payment. Package purchases are non-refundable but may be transferable under
                  certain conditions at our discretion. Promotional pricing, discounts, and special
                  offers are subject to their own specific terms and conditions and may not be
                  combined with other offers unless explicitly stated.
                </p>
                <p className="mt-4 font-body text-base leading-relaxed text-rani-text">
                  Our services are generally not covered by health insurance. It is your
                  responsibility to determine whether your insurance provider offers any coverage
                  or reimbursement for the services you receive. We do not submit claims to
                  insurance companies on your behalf, but we can provide you with documentation of
                  services rendered upon request.
                </p>
              </div>
            </FadeInOnScroll>

            {/* Section 5 */}
            <FadeInOnScroll>
              <div>
                <h2 className="font-body text-2xl font-bold text-rani-navy">
                  5. Informed Consent and Medical Disclaimer
                </h2>
                <div className="mt-1 h-0.5 w-10 bg-rani-gold" />
                <p className="mt-4 font-body text-base leading-relaxed text-rani-text">
                  Before receiving any medical treatment or procedure at Rani Beauty Clinic, you
                  will be required to sign an informed consent form that describes the treatment,
                  its expected benefits, potential risks and side effects, alternative treatment
                  options, and what to expect during and after the procedure. It is your
                  responsibility to read the informed consent form carefully, ask questions, and
                  ensure you understand the information provided before signing.
                </p>
                <p className="mt-4 font-body text-base leading-relaxed text-rani-text">
                  You acknowledge and understand that all medical and aesthetic treatments carry
                  inherent risks, and that results may vary from person to person. The information
                  provided on our website, social media, marketing materials, or during
                  consultations is intended for general informational purposes only and should not
                  be considered a substitute for professional medical advice, diagnosis, or
                  treatment. Always consult with a qualified healthcare provider regarding any
                  medical conditions or concerns.
                </p>
                <p className="mt-4 font-body text-base leading-relaxed text-rani-text">
                  You are responsible for providing accurate and complete information about your
                  medical history, current medications, allergies, and any other health conditions
                  that may affect your treatment. Failure to disclose relevant medical information
                  may result in complications or adverse outcomes for which Rani Beauty Clinic
                  cannot be held responsible. You agree to follow all pre-treatment and
                  post-treatment instructions provided by our clinical team.
                </p>
              </div>
            </FadeInOnScroll>

            {/* Section 6 */}
            <FadeInOnScroll>
              <div>
                <h2 className="font-body text-2xl font-bold text-rani-navy">
                  6. Refund Policy
                </h2>
                <div className="mt-1 h-0.5 w-10 bg-rani-gold" />
                <p className="mt-4 font-body text-base leading-relaxed text-rani-text">
                  Due to the nature of medical and aesthetic services, refunds are generally not
                  available for services already rendered. If you are dissatisfied with a treatment
                  or experience an adverse outcome, we encourage you to contact us promptly so we
                  can address your concerns and determine an appropriate course of action. In some
                  cases, we may offer complimentary follow-up treatments, service credits, or other
                  accommodations at our discretion.
                </p>
                <p className="mt-4 font-body text-base leading-relaxed text-rani-text">
                  Refunds for prepaid packages or treatment series will be evaluated on a
                  case-by-case basis. Any refund provided will be calculated based on the number of
                  sessions used at the individual session price, rather than the discounted package
                  price. Products that have been opened or used cannot be returned or refunded.
                </p>
              </div>
            </FadeInOnScroll>

            {/* Section 7 */}
            <FadeInOnScroll>
              <div>
                <h2 className="font-body text-2xl font-bold text-rani-navy">
                  7. Limitation of Liability
                </h2>
                <div className="mt-1 h-0.5 w-10 bg-rani-gold" />
                <p className="mt-4 font-body text-base leading-relaxed text-rani-text">
                  To the fullest extent permitted by applicable law, Rani Beauty Clinic, its
                  owners, officers, employees, contractors, and Medical Director shall not be liable
                  for any indirect, incidental, special, consequential, or punitive damages arising
                  out of or related to your use of our website, your receipt of any services, or
                  your reliance on any information provided by our clinic, regardless of the cause
                  of action or the theory of liability.
                </p>
                <p className="mt-4 font-body text-base leading-relaxed text-rani-text">
                  Our total cumulative liability to you for any and all claims arising out of or
                  related to our services shall not exceed the total amount you paid to Rani Beauty
                  Clinic for the specific service giving rise to the claim. This limitation of
                  liability applies to the fullest extent permitted by law and shall survive the
                  termination of these Terms.
                </p>
                <p className="mt-4 font-body text-base leading-relaxed text-rani-text">
                  Nothing in these Terms is intended to limit or exclude liability that cannot be
                  limited or excluded under applicable law, including liability for gross negligence,
                  willful misconduct, or any other liability that cannot be lawfully excluded.
                </p>
              </div>
            </FadeInOnScroll>

            {/* Section 8 */}
            <FadeInOnScroll>
              <div>
                <h2 className="font-body text-2xl font-bold text-rani-navy">
                  8. Indemnification
                </h2>
                <div className="mt-1 h-0.5 w-10 bg-rani-gold" />
                <p className="mt-4 font-body text-base leading-relaxed text-rani-text">
                  You agree to indemnify, defend, and hold harmless Rani Beauty Clinic, its
                  owners, officers, employees, contractors, and Medical Director from and against
                  any and all claims, liabilities, damages, losses, costs, and expenses (including
                  reasonable attorneys&apos; fees) arising out of or related to: your breach of these
                  Terms, your misuse of our website or services, your provision of inaccurate or
                  incomplete medical information, or your violation of any applicable law or
                  regulation.
                </p>
              </div>
            </FadeInOnScroll>

            {/* Section 9 */}
            <FadeInOnScroll>
              <div>
                <h2 className="font-body text-2xl font-bold text-rani-navy">
                  9. Intellectual Property
                </h2>
                <div className="mt-1 h-0.5 w-10 bg-rani-gold" />
                <p className="mt-4 font-body text-base leading-relaxed text-rani-text">
                  All content on the Rani Beauty Clinic website, including but not limited to text,
                  images, graphics, logos, icons, photographs, videos, and software, is the property
                  of Rani Beauty Clinic or its content suppliers and is protected by United States
                  and international copyright, trademark, and other intellectual property laws. You
                  may not reproduce, distribute, modify, display, perform, or otherwise use any
                  content from our website without our prior written consent.
                </p>
                <p className="mt-4 font-body text-base leading-relaxed text-rani-text">
                  The Rani Beauty Clinic name, logo, and all related marks are trademarks of Rani
                  Beauty Clinic. You may not use these marks without our prior written permission.
                  Any unauthorized use of our intellectual property may violate applicable laws and
                  may result in legal action.
                </p>
              </div>
            </FadeInOnScroll>

            {/* Section 10 */}
            <FadeInOnScroll>
              <div>
                <h2 className="font-body text-2xl font-bold text-rani-navy">
                  10. Website Use and Disclaimers
                </h2>
                <div className="mt-1 h-0.5 w-10 bg-rani-gold" />
                <p className="mt-4 font-body text-base leading-relaxed text-rani-text">
                  Our website is provided on an &quot;as is&quot; and &quot;as available&quot; basis without warranties
                  of any kind, either express or implied. We do not warrant that our website will be
                  uninterrupted, error-free, or free of viruses or other harmful components. We
                  reserve the right to modify, suspend, or discontinue any aspect of our website at
                  any time without notice.
                </p>
                <p className="mt-4 font-body text-base leading-relaxed text-rani-text">
                  The information on our website, including descriptions of treatments, before and
                  after photographs, and testimonials, is provided for general informational
                  purposes only. Before and after photographs represent individual results and are
                  not a guarantee of outcomes. Testimonials reflect the personal experiences of
                  individual clients and may not be representative of the results others may
                  achieve.
                </p>
              </div>
            </FadeInOnScroll>

            {/* Section 11 */}
            <FadeInOnScroll>
              <div>
                <h2 className="font-body text-2xl font-bold text-rani-navy">
                  11. Governing Law and Dispute Resolution
                </h2>
                <div className="mt-1 h-0.5 w-10 bg-rani-gold" />
                <p className="mt-4 font-body text-base leading-relaxed text-rani-text">
                  These Terms of Service shall be governed by and construed in accordance with the
                  laws of the State of Washington, without regard to its conflict of law principles.
                  Any dispute, claim, or controversy arising out of or relating to these Terms, our
                  website, or our services shall be resolved exclusively in the state or federal
                  courts located in King County, Washington, and you consent to the personal
                  jurisdiction and venue of such courts.
                </p>
                <p className="mt-4 font-body text-base leading-relaxed text-rani-text">
                  Before initiating any formal legal proceedings, we encourage you to contact us
                  directly to attempt to resolve any disputes informally. We are committed to
                  addressing your concerns in good faith and finding a mutually agreeable
                  resolution whenever possible.
                </p>
              </div>
            </FadeInOnScroll>

            {/* Section 12 */}
            <FadeInOnScroll>
              <div>
                <h2 className="font-body text-2xl font-bold text-rani-navy">
                  12. Severability
                </h2>
                <div className="mt-1 h-0.5 w-10 bg-rani-gold" />
                <p className="mt-4 font-body text-base leading-relaxed text-rani-text">
                  If any provision of these Terms is found to be invalid, illegal, or unenforceable
                  by a court of competent jurisdiction, the remaining provisions shall continue in
                  full force and effect. The invalid or unenforceable provision shall be modified to
                  the minimum extent necessary to make it valid and enforceable while preserving the
                  original intent of the parties.
                </p>
              </div>
            </FadeInOnScroll>

            {/* Section 13 */}
            <FadeInOnScroll>
              <div>
                <h2 className="font-body text-2xl font-bold text-rani-navy">
                  13. Entire Agreement
                </h2>
                <div className="mt-1 h-0.5 w-10 bg-rani-gold" />
                <p className="mt-4 font-body text-base leading-relaxed text-rani-text">
                  These Terms, together with our{" "}
                  <Link
                    href="/privacy-policy"
                    className="text-rani-navy underline hover:no-underline"
                  >
                    Privacy Policy
                  </Link>{" "}
                  and any informed consent forms or agreements signed at our clinic, constitute the
                  entire agreement between you and Rani Beauty Clinic regarding your use of our
                  website and services. These Terms supersede all prior or contemporaneous
                  communications, proposals, and agreements, whether oral or written, between you
                  and Rani Beauty Clinic.
                </p>
              </div>
            </FadeInOnScroll>

            {/* Section 14 */}
            <FadeInOnScroll>
              <div>
                <h2 className="font-body text-2xl font-bold text-rani-navy">
                  14. Contact Information
                </h2>
                <div className="mt-1 h-0.5 w-10 bg-rani-gold" />
                <p className="mt-4 font-body text-base leading-relaxed text-rani-text">
                  If you have any questions or concerns about these Terms of Service, please
                  contact us:
                </p>
                <div className="mt-4 rounded-lg bg-rani-cream p-6 font-body text-rani-text">
                  <p className="font-semibold text-rani-navy">{clinicInfo.name}</p>
                  <p className="mt-2">{clinicInfo.address.full}</p>
                  <p className="mt-1">
                    Phone:{" "}
                    <a
                      href={clinicInfo.phoneTel}
                      className="text-rani-navy underline hover:no-underline"
                    >
                      {clinicInfo.phone}
                    </a>
                  </p>
                  <p className="mt-1">
                    Email:{" "}
                    <a
                      href={`mailto:${clinicInfo.email}`}
                      className="text-rani-navy underline hover:no-underline"
                    >
                      {clinicInfo.email}
                    </a>
                  </p>
                </div>
              </div>
            </FadeInOnScroll>
          </div>
        </div>
      </section>
    </>
  );
}
