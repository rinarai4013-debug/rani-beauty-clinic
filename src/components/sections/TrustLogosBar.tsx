"use client";

import { motion } from "framer-motion";
import { Shield, Award, Clock, Star, Heart } from "lucide-react";

const trustItems = [
  { icon: Shield, text: "Neurologist-Supervised" },
  { icon: Award, text: "Woman-Owned" },
  { icon: Star, text: "4.9 Google Rating" },
  { icon: Clock, text: "Open 7 Days" },
  { icon: Heart, text: "HSA / FSA Accepted" },
];

export default function TrustLogosBar() {
  return (
    <section className="border-y border-rani-border bg-white py-6">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4"
        >
          {trustItems.map((item) => (
            <div
              key={item.text}
              className="flex items-center gap-2 text-rani-navy/70"
            >
              <item.icon size={18} className="text-rani-gold" />
              <span className="font-body text-sm font-medium whitespace-nowrap">
                {item.text}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
