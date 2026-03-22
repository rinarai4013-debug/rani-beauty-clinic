'use client';

import { motion } from 'framer-motion';
import { Shield, Sparkles, Star } from 'lucide-react';

interface StepProps {
  formData: Record<string, any>;
  onUpdate: (field: string, value: any) => void;
  errors: Record<string, string>;
}

const valueProps = [
  {
    icon: Shield,
    title: 'Physician-Supervised Care',
    description: 'Every treatment overseen by our board-certified medical team',
  },
  {
    icon: Sparkles,
    title: 'Personalized Treatment Plans',
    description: 'Custom protocols designed around your unique skin goals',
  },
  {
    icon: Star,
    title: '4.9 Stars \u00B7 200+ Reviews',
    description: 'Trusted by hundreds of clients across the Greater Seattle area',
  },
];

export default function Step1Welcome({ onUpdate }: StepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="flex flex-col items-center text-center px-4 py-8 md:py-12"
    >
      {/* Decorative accent */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="w-16 h-[2px] bg-[#C9A96E] mb-8"
      />

      {/* Heading */}
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="font-heading text-3xl md:text-4xl lg:text-5xl text-[#0F1D2C] leading-tight mb-4"
      >
        Your Transformation
        <br />
        Starts Here
      </motion.h1>

      {/* Subtext */}
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="font-body text-base md:text-lg text-[#0F1D2C]/70 max-w-xl mb-12"
      >
        Take 3 minutes to tell us about your goals &mdash; we&apos;ll craft a
        personalized treatment roadmap just for you.
      </motion.p>

      {/* Value Props */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl mb-12">
        {valueProps.map((prop, index) => (
          <motion.div
            key={prop.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.12, duration: 0.5 }}
            className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-[#F8F6F1] border border-[#C9A96E]/20"
          >
            <div className="w-12 h-12 rounded-full bg-[#C9A96E]/10 flex items-center justify-center">
              <prop.icon className="w-5 h-5 text-[#C9A96E]" />
            </div>
            <h3 className="font-heading text-sm md:text-base text-[#0F1D2C] font-semibold">
              {prop.title}
            </h3>
            <p className="font-body text-xs md:text-sm text-[#0F1D2C]/60 leading-relaxed">
              {prop.description}
            </p>
          </motion.div>
        ))}
      </div>

      {/* CTA Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, duration: 0.4 }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => onUpdate('started', true)}
        className="font-body font-medium text-base md:text-lg px-10 py-4 rounded-full bg-[#0F1D2C] text-white hover:bg-[#1A2A3C] transition-colors shadow-lg shadow-[#0F1D2C]/20"
      >
        Begin Your Journey
      </motion.button>

      {/* Privacy note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.4 }}
        className="font-body text-xs text-[#0F1D2C]/40 mt-6"
      >
        Your information is kept private and secure. HIPAA-compliant.
      </motion.p>
    </motion.div>
  );
}
