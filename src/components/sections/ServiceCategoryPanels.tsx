"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";
import SectionLabel from "@/components/ui/SectionLabel";

const categories = [
  {
    title: "Face & Skin",
    description: "HydraFacial, Chemical Peels, Laser Facials & more",
    image: "/images/services/face-skin-cover.jpg",
    href: "/services",
    count: 8,
  },
  {
    title: "Injectables",
    description: "Botox, Dysport & Dermal Fillers",
    image: "/images/services/injectables-cover.jpg",
    href: "/services/botox-dysport",
    count: 6,
  },
  {
    title: "Body & Laser",
    description: "Laser Hair Removal, Sofwave, RF Microneedling",
    image: "/images/services/laserhairremovals/fullbodylaser.jpeg",
    href: "/services/laser-hair-removal",
    count: 5,
  },
  {
    title: "Medical Wellness",
    description: "GLP-1, Peptides, Hormones, NAD+ & Vitamin Injections",
    image: "/images/services/wellness/glp1-1.jpg",
    href: "/wellness",
    count: 6,
  },
];

export default function ServiceCategoryPanels() {
  return (
    <section className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <FadeInOnScroll>
          <SectionLabel label="TREATMENT CATEGORIES" />
          <h2 className="mt-6 text-center font-body text-3xl font-bold text-rani-navy md:text-4xl">
            Explore Our Services
          </h2>
        </FadeInOnScroll>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((cat, i) => (
            <FadeInOnScroll key={cat.title} delay={i * 0.1}>
              <Link href={cat.href} className="group block">
                <div className="relative aspect-[3/4] overflow-hidden rounded-xl">
                  <Image
                    src={cat.image}
                    alt={cat.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  {/* Dark gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-rani-navy via-rani-navy/40 to-transparent" />

                  {/* Content overlay */}
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <span className="mb-2 inline-block rounded-full bg-rani-gold/90 px-3 py-1 font-body text-xs font-semibold text-rani-navy">
                      {cat.count} Treatments
                    </span>
                    <h3 className="font-heading text-2xl font-bold text-white">
                      {cat.title}
                    </h3>
                    <p className="mt-1 font-body text-sm text-gray-300">
                      {cat.description}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 font-body text-sm font-semibold text-rani-gold transition-all group-hover:gap-2">
                      Explore
                      <ArrowRight
                        size={14}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </span>
                  </div>
                </div>
              </Link>
            </FadeInOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
