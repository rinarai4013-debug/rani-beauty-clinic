import { MapPin, Phone, Clock, CheckCircle } from "lucide-react";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import SectionLabel from "@/components/ui/SectionLabel";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { clinicInfo } from "@/data/clinic-info";

export default function MapSection() {
  return (
    <section className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          {/* Info side */}
          <FadeInOnScroll direction="left">
            <div>
              <SectionLabel label="VISIT US" className="!items-start" />
              <h2 className="mt-6 font-body text-3xl font-bold text-rani-navy md:text-4xl">
                Find Our Clinic
              </h2>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-4">
                  <MapPin className="mt-1 shrink-0 text-rani-gold" size={20} />
                  <p className="font-body text-rani-text">
                    {clinicInfo.address.full}
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <Phone className="mt-1 shrink-0 text-rani-gold" size={20} />
                  <a
                    href={clinicInfo.phoneTel}
                    className="font-body text-rani-text hover:text-rani-navy transition-colors"
                  >
                    {clinicInfo.phone}
                  </a>
                </div>
                <div className="flex items-start gap-4">
                  <Clock className="mt-1 shrink-0 text-rani-gold" size={20} />
                  <div className="font-body text-rani-text">
                    <p>{clinicInfo.hours.days}</p>
                    <p>{clinicInfo.hours.time}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Badge icon="check">Wheelchair Accessible</Badge>
                <Badge icon="check">Free Parking</Badge>
                <Badge icon="clock">Open 7 Days</Badge>
              </div>

              <div className="mt-8">
                <Button
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(clinicInfo.address.full)}`}
                  icon
                >
                  Get Directions
                </Button>
              </div>
            </div>
          </FadeInOnScroll>

          {/* Map */}
          <FadeInOnScroll direction="right">
            <div className="h-[400px] overflow-hidden rounded-xl border border-rani-border shadow-sm">
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
          </FadeInOnScroll>
        </div>
      </div>
    </section>
  );
}
