import { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, AlertTriangle } from "lucide-react";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import { clinicInfo } from "@/data/clinic-info";

export const metadata: Metadata = {
  title: "Privacy Policy | Rani Beauty Clinic",
  description:
    "Read the privacy policy of Rani Beauty Clinic in Renton, WA. Learn how we collect, use, and protect your personal and health information.",
  openGraph: {
    title: "Privacy Policy | Rani Beauty Clinic",
    description:
      "Read the privacy policy of Rani Beauty Clinic in Renton, WA. Learn how we collect, use, and protect your personal and health information.",
    type: "website",
    url: `${clinicInfo.website}/privacy-policy`,
  },
};

export default function PrivacyPolicyPage() {
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
                <span className="text-rani-navy font-semibold">Privacy Policy</span>
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
              Privacy Policy
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
                    [NOTE: Have an attorney review this privacy policy before publishing to ensure
                    compliance with all applicable federal, state, and local laws, including HIPAA,
                    the Washington Consumer Privacy Act, and other relevant regulations.]
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
                  Rani Beauty Clinic (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting the
                  privacy and security of your personal information. This Privacy Policy describes
                  how we collect, use, disclose, and safeguard your information when you visit our
                  clinic located at {clinicInfo.address.full}, use our website at{" "}
                  <Link href="/" className="text-rani-navy underline hover:no-underline">
                    {clinicInfo.website}
                  </Link>
                  , or engage with our services. By accessing our website or using our services,
                  you acknowledge that you have read and understand this Privacy Policy.
                </p>
              </div>
            </FadeInOnScroll>

            {/* Section 1 */}
            <FadeInOnScroll>
              <div>
                <h2 className="font-body text-2xl font-bold text-rani-navy">
                  1. Information We Collect
                </h2>
                <div className="mt-1 h-0.5 w-10 bg-rani-gold" />

                <h3 className="mt-6 font-body text-lg font-semibold text-rani-navy">
                  Personal Information
                </h3>
                <p className="mt-2 font-body text-base leading-relaxed text-rani-text">
                  When you schedule an appointment, register as a patient, or otherwise interact
                  with our clinic, we may collect personal information including but not limited to:
                  your full name, date of birth, mailing address, email address, telephone number,
                  emergency contact information, government-issued identification, and payment
                  information such as credit or debit card details.
                </p>

                <h3 className="mt-6 font-body text-lg font-semibold text-rani-navy">
                  Health and Medical Information
                </h3>
                <p className="mt-2 font-body text-base leading-relaxed text-rani-text">
                  As a medical spa operating under physician supervision, we collect health-related
                  information necessary for the safe and effective delivery of our services. This
                  may include your medical history, current medications, allergies, prior
                  treatments, skin type assessments, photographs taken for treatment planning and
                  progress tracking, laboratory results from blood work performed in our clinic,
                  treatment records, and other clinical data related to your care. This information
                  is considered Protected Health Information (PHI) under the Health Insurance
                  Portability and Accountability Act (HIPAA) and is subject to additional
                  protections as described in Section 3 of this policy.
                </p>

                <h3 className="mt-6 font-body text-lg font-semibold text-rani-navy">
                  Automatically Collected Information
                </h3>
                <p className="mt-2 font-body text-base leading-relaxed text-rani-text">
                  When you visit our website, we may automatically collect certain technical
                  information, including your IP address, browser type and version, operating
                  system, referring URL, pages viewed, time spent on pages, and other browsing
                  behavior data. This information is collected through cookies, web beacons, and
                  similar tracking technologies as described in Section 5 of this policy.
                </p>
              </div>
            </FadeInOnScroll>

            {/* Section 2 */}
            <FadeInOnScroll>
              <div>
                <h2 className="font-body text-2xl font-bold text-rani-navy">
                  2. How We Use Your Information
                </h2>
                <div className="mt-1 h-0.5 w-10 bg-rani-gold" />
                <p className="mt-4 font-body text-base leading-relaxed text-rani-text">
                  We use the information we collect for the following purposes:
                </p>
                <ul className="mt-4 space-y-3 font-body text-base leading-relaxed text-rani-text">
                  <li className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rani-gold" />
                    <span>
                      <strong>Treatment and Care:</strong> To provide, manage, and improve the
                      aesthetic and medical wellness services you receive, including treatment
                      planning, clinical decision-making, follow-up care, and maintaining accurate
                      medical records.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rani-gold" />
                    <span>
                      <strong>Appointment Management:</strong> To schedule, confirm, reschedule, or
                      cancel appointments and to send appointment reminders via email, text message,
                      or telephone.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rani-gold" />
                    <span>
                      <strong>Payment Processing:</strong> To process payments for services rendered,
                      manage billing records, and handle refunds or adjustments when applicable.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rani-gold" />
                    <span>
                      <strong>Communication:</strong> To respond to your inquiries, provide
                      information about our services, send promotional materials and newsletters
                      (with your consent), and communicate important updates about our clinic or your
                      care.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rani-gold" />
                    <span>
                      <strong>Legal Compliance:</strong> To comply with applicable laws, regulations,
                      and legal processes, including healthcare regulations, tax reporting
                      requirements, and law enforcement requests.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rani-gold" />
                    <span>
                      <strong>Quality Improvement:</strong> To analyze trends, monitor the
                      effectiveness of treatments, improve our services, and enhance the overall
                      patient experience.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rani-gold" />
                    <span>
                      <strong>Website Optimization:</strong> To analyze website usage patterns,
                      improve website functionality, and personalize your online experience.
                    </span>
                  </li>
                </ul>
              </div>
            </FadeInOnScroll>

            {/* Section 3 */}
            <FadeInOnScroll>
              <div>
                <h2 className="font-body text-2xl font-bold text-rani-navy">
                  3. HIPAA Notice and Protected Health Information
                </h2>
                <div className="mt-1 h-0.5 w-10 bg-rani-gold" />
                <p className="mt-4 font-body text-base leading-relaxed text-rani-text">
                  As a medical spa that provides services under the supervision of our Medical
                  Director, Dr. Alexander Landfield, Rani Beauty Clinic may be subject to the
                  Health Insurance Portability and Accountability Act (HIPAA). We are committed to
                  protecting your Protected Health Information (PHI) in accordance with HIPAA
                  requirements and the HIPAA Privacy Rule.
                </p>
                <p className="mt-4 font-body text-base leading-relaxed text-rani-text">
                  Your PHI will only be used or disclosed for purposes of treatment, payment, and
                  healthcare operations, or as otherwise permitted or required by law. We maintain
                  physical, electronic, and procedural safeguards to protect your PHI from
                  unauthorized access, use, or disclosure. You have the right to request a copy of
                  our full Notice of Privacy Practices, which provides detailed information about
                  how your PHI may be used and disclosed and your rights regarding your health
                  information.
                </p>
                <p className="mt-4 font-body text-base leading-relaxed text-rani-text">
                  Your rights under HIPAA include the right to access and receive a copy of your
                  health records, the right to request corrections to your health information, the
                  right to request restrictions on certain uses and disclosures of your PHI, the
                  right to receive confidential communications, the right to receive an accounting
                  of certain disclosures of your PHI, and the right to file a complaint if you
                  believe your privacy rights have been violated. To exercise any of these rights
                  or to request a copy of our Notice of Privacy Practices, please contact our
                  Privacy Officer using the contact information provided at the end of this policy.
                </p>
              </div>
            </FadeInOnScroll>

            {/* Section 4 */}
            <FadeInOnScroll>
              <div>
                <h2 className="font-body text-2xl font-bold text-rani-navy">
                  4. Disclosure of Your Information
                </h2>
                <div className="mt-1 h-0.5 w-10 bg-rani-gold" />
                <p className="mt-4 font-body text-base leading-relaxed text-rani-text">
                  We do not sell, rent, or trade your personal information to third parties for
                  marketing purposes. We may share your information in the following circumstances:
                </p>
                <ul className="mt-4 space-y-3 font-body text-base leading-relaxed text-rani-text">
                  <li className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rani-gold" />
                    <span>
                      <strong>Service Providers:</strong> We may share information with trusted
                      third-party service providers who assist us in operating our clinic and
                      website, processing payments, sending communications, or performing other
                      business functions on our behalf. These providers are contractually obligated
                      to protect your information and use it only for the purposes for which it was
                      disclosed.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rani-gold" />
                    <span>
                      <strong>Legal Requirements:</strong> We may disclose your information when
                      required by law, court order, subpoena, or other legal process, or when we
                      believe disclosure is necessary to protect our rights, your safety, or the
                      safety of others.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rani-gold" />
                    <span>
                      <strong>Business Transfers:</strong> In the event of a merger, acquisition,
                      reorganization, or sale of assets, your information may be transferred as part
                      of that transaction. We will notify you of any such change in ownership or
                      control of your personal information.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rani-gold" />
                    <span>
                      <strong>With Your Consent:</strong> We may share your information for purposes
                      not covered by this policy with your explicit consent.
                    </span>
                  </li>
                </ul>
              </div>
            </FadeInOnScroll>

            {/* Section 5 */}
            <FadeInOnScroll>
              <div>
                <h2 className="font-body text-2xl font-bold text-rani-navy">
                  5. Cookies and Tracking Technologies
                </h2>
                <div className="mt-1 h-0.5 w-10 bg-rani-gold" />
                <p className="mt-4 font-body text-base leading-relaxed text-rani-text">
                  Our website uses cookies and similar tracking technologies to enhance your
                  browsing experience, analyze website traffic, and understand how visitors interact
                  with our site. Cookies are small text files stored on your device when you visit a
                  website.
                </p>
                <p className="mt-4 font-body text-base leading-relaxed text-rani-text">
                  We use the following types of cookies: essential cookies that are necessary for the
                  website to function properly, performance cookies that help us understand how
                  visitors use our website by collecting anonymous statistical data, and marketing
                  cookies that may be used to deliver relevant advertisements and track the
                  effectiveness of our marketing campaigns.
                </p>
                <p className="mt-4 font-body text-base leading-relaxed text-rani-text">
                  You can manage your cookie preferences through your browser settings. Most
                  browsers allow you to refuse cookies, delete existing cookies, or be notified when
                  a cookie is set. Please note that disabling certain cookies may affect the
                  functionality of our website. We may also use third-party analytics services, such
                  as Google Analytics, which use cookies and similar technologies to collect and
                  analyze information about website usage. You can learn more about Google&apos;s privacy
                  practices and opt out of Google Analytics tracking by visiting Google&apos;s privacy
                  policy page.
                </p>
              </div>
            </FadeInOnScroll>

            {/* Section 6 */}
            <FadeInOnScroll>
              <div>
                <h2 className="font-body text-2xl font-bold text-rani-navy">
                  6. Third-Party Services
                </h2>
                <div className="mt-1 h-0.5 w-10 bg-rani-gold" />
                <p className="mt-4 font-body text-base leading-relaxed text-rani-text">
                  Our website and services may integrate with or link to third-party services,
                  including but not limited to online scheduling platforms, payment processors,
                  social media platforms, review platforms, email marketing services, and analytics
                  providers. These third-party services have their own privacy policies and data
                  collection practices, and we encourage you to review their respective privacy
                  policies. We are not responsible for the privacy practices or content of any
                  third-party websites or services.
                </p>
                <p className="mt-4 font-body text-base leading-relaxed text-rani-text">
                  When you interact with third-party services through our website (for example, by
                  using an online booking system or submitting a payment), the information you
                  provide may be collected by both us and the third-party service provider. We
                  select our third-party partners carefully and require them to maintain appropriate
                  security measures, but we cannot guarantee the security of information transmitted
                  to or stored by third-party services.
                </p>
              </div>
            </FadeInOnScroll>

            {/* Section 7 */}
            <FadeInOnScroll>
              <div>
                <h2 className="font-body text-2xl font-bold text-rani-navy">
                  7. Data Security
                </h2>
                <div className="mt-1 h-0.5 w-10 bg-rani-gold" />
                <p className="mt-4 font-body text-base leading-relaxed text-rani-text">
                  We implement reasonable and appropriate physical, technical, and administrative
                  safeguards to protect your personal information and health data from unauthorized
                  access, use, alteration, disclosure, or destruction. These measures include but
                  are not limited to: encryption of sensitive data in transit and at rest, secure
                  access controls and authentication procedures, regular security assessments and
                  updates, employee training on data protection and HIPAA compliance, secure disposal
                  of documents and records containing personal information, and physical security
                  measures at our clinic to protect paper records and electronic systems.
                </p>
                <p className="mt-4 font-body text-base leading-relaxed text-rani-text">
                  While we strive to protect your information, no method of electronic transmission
                  or storage is completely secure. We cannot guarantee the absolute security of your
                  information, but we are committed to maintaining industry-standard protections and
                  promptly addressing any security incidents that may occur.
                </p>
              </div>
            </FadeInOnScroll>

            {/* Section 8 */}
            <FadeInOnScroll>
              <div>
                <h2 className="font-body text-2xl font-bold text-rani-navy">
                  8. Your Rights and Choices
                </h2>
                <div className="mt-1 h-0.5 w-10 bg-rani-gold" />
                <p className="mt-4 font-body text-base leading-relaxed text-rani-text">
                  Depending on your location and applicable law, you may have certain rights
                  regarding your personal information:
                </p>
                <ul className="mt-4 space-y-3 font-body text-base leading-relaxed text-rani-text">
                  <li className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rani-gold" />
                    <span>
                      <strong>Access:</strong> You may request access to the personal information we
                      hold about you.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rani-gold" />
                    <span>
                      <strong>Correction:</strong> You may request that we correct inaccurate or
                      incomplete personal information.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rani-gold" />
                    <span>
                      <strong>Deletion:</strong> You may request the deletion of your personal
                      information, subject to certain legal exceptions and retention requirements.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rani-gold" />
                    <span>
                      <strong>Opt-Out:</strong> You may opt out of receiving promotional
                      communications from us at any time by following the unsubscribe instructions in
                      our emails or by contacting us directly.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rani-gold" />
                    <span>
                      <strong>Data Portability:</strong> Where applicable, you may request a copy of
                      your personal information in a structured, commonly used, and machine-readable
                      format.
                    </span>
                  </li>
                </ul>
                <p className="mt-4 font-body text-base leading-relaxed text-rani-text">
                  Please note that certain information may be exempt from such requests under
                  applicable law, and we may need to retain certain information for legal or
                  legitimate business purposes. We will respond to your request within the time
                  frame required by applicable law.
                </p>
              </div>
            </FadeInOnScroll>

            {/* Section 9 */}
            <FadeInOnScroll>
              <div>
                <h2 className="font-body text-2xl font-bold text-rani-navy">
                  9. Children&apos;s Privacy
                </h2>
                <div className="mt-1 h-0.5 w-10 bg-rani-gold" />
                <p className="mt-4 font-body text-base leading-relaxed text-rani-text">
                  Our services are not directed to individuals under the age of 18. We do not
                  knowingly collect personal information from children under 18 without parental or
                  guardian consent. If a minor receives treatment at our clinic, a parent or legal
                  guardian must provide consent and their personal information may be collected as
                  part of the treatment process. If we become aware that we have collected personal
                  information from a child under 18 without appropriate consent, we will take steps
                  to delete such information promptly.
                </p>
              </div>
            </FadeInOnScroll>

            {/* Section 10 */}
            <FadeInOnScroll>
              <div>
                <h2 className="font-body text-2xl font-bold text-rani-navy">
                  10. Changes to This Privacy Policy
                </h2>
                <div className="mt-1 h-0.5 w-10 bg-rani-gold" />
                <p className="mt-4 font-body text-base leading-relaxed text-rani-text">
                  We reserve the right to update or modify this Privacy Policy at any time. When we
                  make changes, we will revise the &quot;Last updated&quot; date at the top of this page. We
                  encourage you to review this Privacy Policy periodically to stay informed about
                  how we are protecting your information. Your continued use of our website or
                  services after any changes to this Privacy Policy constitutes your acceptance of
                  those changes.
                </p>
              </div>
            </FadeInOnScroll>

            {/* Section 11 */}
            <FadeInOnScroll>
              <div>
                <h2 className="font-body text-2xl font-bold text-rani-navy">
                  11. Contact Information
                </h2>
                <div className="mt-1 h-0.5 w-10 bg-rani-gold" />
                <p className="mt-4 font-body text-base leading-relaxed text-rani-text">
                  If you have any questions, concerns, or requests regarding this Privacy Policy or
                  our data practices, please contact us:
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
                <p className="mt-4 font-body text-base leading-relaxed text-rani-text">
                  For HIPAA-related inquiries or to exercise your rights regarding your Protected
                  Health Information, please contact our Privacy Officer at the address or phone
                  number listed above and request to speak with the Privacy Officer.
                </p>
              </div>
            </FadeInOnScroll>
          </div>
        </div>
      </section>
    </>
  );
}
