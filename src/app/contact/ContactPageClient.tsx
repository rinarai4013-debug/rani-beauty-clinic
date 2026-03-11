"use client";

import { useState, FormEvent } from "react";
import { MapPin, Phone, Clock, Mail, CheckCircle } from "lucide-react";
import Hero from "@/components/sections/Hero";
import SectionLabel from "@/components/ui/SectionLabel";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { clinicInfo } from "@/data/clinic-info";

const serviceOptions = [
  "Laser Hair Removal",
  "HydraFacial",
  "RF Microneedling",
  "Botox & Dysport",
  "Dermal Fillers",
  "Chemical Peels",
  "IPL Photofacial",
  "GLP-1 Weight Management",
  "Hormone Therapy",
  "IV Vitamin Therapy",
  "NAD+ Therapy",
  "Peptide Therapy",
  "Other / Not Sure",
];

interface FormData {
  name: string;
  email: string;
  phone: string;
  service: string;
  preferredDate: string;
  message: string;
  honeypot: string;
}

export default function ContactPageClient() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    service: "",
    preferredDate: "",
    message: "",
    honeypot: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Something went wrong. Please try again.");
      }

      setIsSubmitted(true);
      setFormData({
        name: "",
        email: "",
        phone: "",
        service: "",
        preferredDate: "",
        message: "",
        honeypot: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyles =
    "w-full rounded-lg border border-rani-border bg-white px-4 py-3 font-body text-sm text-rani-text placeholder:text-rani-muted/50 focus:border-rani-gold focus:outline-none focus:ring-2 focus:ring-rani-gold/20 transition-colors";

  const labelStyles = "block font-body text-sm font-semibold text-rani-navy mb-1.5";

  return (
    <>
      {/* Hero */}
      <Hero
        label="GET IN TOUCH"
        title="Contact Us"
        subtitle="Have questions about our treatments? Ready to book a consultation? We\u2019d love to hear from you."
        dark={false}
      />

      {/* Contact Form + Info Section */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            {/* Left: Contact Form */}
            <FadeInOnScroll direction="left">
              <div>
                <SectionLabel label="SEND US A MESSAGE" className="!items-start" />
                <h2 className="mt-6 font-body text-3xl font-bold text-rani-navy md:text-4xl">
                  Book a Consultation
                </h2>
                <p className="mt-4 font-body text-base text-rani-muted">
                  Fill out the form below and our team will get back to you within
                  24 hours. For immediate assistance, call us at{" "}
                  <a
                    href={clinicInfo.phoneTel}
                    className="font-semibold text-rani-navy hover:text-rani-gold transition-colors"
                  >
                    {clinicInfo.phone}
                  </a>
                  .
                </p>

                {isSubmitted ? (
                  <div className="mt-8 rounded-xl border border-green-200 bg-green-50 p-8 text-center">
                    <CheckCircle size={48} className="mx-auto text-green-500" />
                    <h3 className="mt-4 font-body text-xl font-bold text-rani-navy">
                      Thank You!
                    </h3>
                    <p className="mt-2 font-body text-base text-rani-muted">
                      Your message has been sent successfully. Our team will contact
                      you within 24 hours to confirm your consultation.
                    </p>
                    <div className="mt-6">
                      <Button onClick={() => setIsSubmitted(false)}>
                        Send Another Message
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                    {/* Honeypot field - hidden from users, catches bots */}
                    <div className="absolute -left-[9999px] opacity-0" aria-hidden="true">
                      <label htmlFor="honeypot">
                        Do not fill this out
                        <input
                          type="text"
                          id="honeypot"
                          name="honeypot"
                          value={formData.honeypot}
                          onChange={handleChange}
                          tabIndex={-1}
                          autoComplete="off"
                        />
                      </label>
                    </div>

                    {/* Name */}
                    <div>
                      <label htmlFor="name" className={labelStyles}>
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your full name"
                        className={inputStyles}
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor="email" className={labelStyles}>
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="your@email.com"
                        className={inputStyles}
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label htmlFor="phone" className={labelStyles}>
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="(425) 555-0000"
                        className={inputStyles}
                      />
                    </div>

                    {/* Service Interest */}
                    <div>
                      <label htmlFor="service" className={labelStyles}>
                        Service Interest <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="service"
                        name="service"
                        required
                        value={formData.service}
                        onChange={handleChange}
                        className={inputStyles}
                      >
                        <option value="">Select a service...</option>
                        {serviceOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Preferred Date */}
                    <div>
                      <label htmlFor="preferredDate" className={labelStyles}>
                        Preferred Date
                      </label>
                      <input
                        type="date"
                        id="preferredDate"
                        name="preferredDate"
                        value={formData.preferredDate}
                        onChange={handleChange}
                        className={inputStyles}
                      />
                    </div>

                    {/* Message */}
                    <div>
                      <label htmlFor="message" className={labelStyles}>
                        Message
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        rows={4}
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Tell us about your goals or any questions you have..."
                        className={inputStyles + " resize-vertical"}
                      />
                    </div>

                    {/* Error message */}
                    {error && (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                        <p className="font-body text-sm text-red-600">{error}</p>
                      </div>
                    )}

                    {/* Submit */}
                    <Button
                      type="submit"
                      className="!w-full !bg-rani-gold !text-rani-navy hover:!bg-rani-gold-light"
                    >
                      {isSubmitting ? "Sending..." : "Request Consultation"}
                    </Button>
                  </form>
                )}
              </div>
            </FadeInOnScroll>

            {/* Right: Contact Info + Map */}
            <FadeInOnScroll direction="right">
              <div className="space-y-8">
                {/* Contact Info Card */}
                <div className="rounded-xl border border-rani-border bg-rani-cream p-8">
                  <h3 className="font-body text-xl font-bold text-rani-navy">
                    Clinic Information
                  </h3>

                  <div className="mt-6 space-y-5">
                    <div className="flex items-start gap-4">
                      <MapPin className="mt-1 shrink-0 text-rani-gold" size={20} />
                      <div>
                        <p className="font-body text-sm font-semibold text-rani-navy">
                          Address
                        </p>
                        <p className="font-body text-sm text-rani-text">
                          {clinicInfo.address.full}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <Phone className="mt-1 shrink-0 text-rani-gold" size={20} />
                      <div>
                        <p className="font-body text-sm font-semibold text-rani-navy">
                          Phone
                        </p>
                        <a
                          href={clinicInfo.phoneTel}
                          className="font-body text-sm text-rani-text hover:text-rani-navy transition-colors"
                        >
                          {clinicInfo.phone}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <Mail className="mt-1 shrink-0 text-rani-gold" size={20} />
                      <div>
                        <p className="font-body text-sm font-semibold text-rani-navy">
                          Email
                        </p>
                        <a
                          href={`mailto:${clinicInfo.email}`}
                          className="font-body text-sm text-rani-text hover:text-rani-navy transition-colors"
                        >
                          {clinicInfo.email}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <Clock className="mt-1 shrink-0 text-rani-gold" size={20} />
                      <div>
                        <p className="font-body text-sm font-semibold text-rani-navy">
                          Hours
                        </p>
                        <p className="font-body text-sm text-rani-text">
                          {clinicInfo.hours.days}
                        </p>
                        <p className="font-body text-sm text-rani-text">
                          {clinicInfo.hours.time}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Badge icon="check">Wheelchair Accessible</Badge>
                    <Badge icon="check">Free Parking</Badge>
                    <Badge icon="shield">HSA Accepted</Badge>
                  </div>
                </div>

                {/* Google Maps Embed */}
                <div className="h-[350px] overflow-hidden rounded-xl border border-rani-border shadow-sm">
                  <iframe
                    src={clinicInfo.googleMapsEmbed}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Rani Beauty Clinic Location"
                  />
                </div>

                {/* Get Directions Button */}
                <Button
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(clinicInfo.address.full)}`}
                  icon
                  className="!w-full"
                >
                  Get Directions
                </Button>
              </div>
            </FadeInOnScroll>
          </div>
        </div>
      </section>
    </>
  );
}
