'use client';

import { motion } from 'framer-motion';

interface StepProps {
  formData: Record<string, any>;
  onUpdate: (field: string, value: any) => void;
  errors: Record<string, string>;
}

interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  hint?: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  delay?: number;
}

function FormField({
  label,
  name,
  type = 'text',
  placeholder,
  hint,
  value,
  error,
  onChange,
  delay = 0,
}: FormFieldProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="flex flex-col gap-1.5"
    >
      <label
        htmlFor={name}
        className="font-body text-sm font-medium text-[#0F1D2C]"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={`
          w-full px-4 py-3 rounded-xl bg-[#F8F6F1] border font-body text-sm text-[#0F1D2C]
          placeholder:text-[#0F1D2C]/30 transition-all duration-200 outline-none
          ${
            error
              ? 'border-red-400 focus:ring-2 focus:ring-red-200'
              : 'border-[#C9A96E]/20 focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20'
          }
        `}
      />
      {error && (
        <p className="font-body text-xs text-red-500 mt-0.5">{error}</p>
      )}
      {hint && !error && (
        <p className="font-body text-xs text-[#0F1D2C]/40">{hint}</p>
      )}
    </motion.div>
  );
}

export default function Step2PersonalInfo({
  formData,
  onUpdate,
  errors,
}: StepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="px-4 py-8 md:py-12 max-w-xl mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-10">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="font-heading text-2xl md:text-3xl text-[#0F1D2C] mb-2"
        >
          Let&apos;s Get to Know You
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="font-body text-sm text-[#0F1D2C]/60"
        >
          So we can personalize your experience
        </motion.p>
      </div>

      {/* Form */}
      <div className="space-y-5">
        {/* Name row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField
            label="First Name"
            name="firstName"
            placeholder="First name"
            value={formData.firstName}
            error={errors.firstName}
            onChange={(v) => onUpdate('firstName', v)}
            delay={0.15}
          />
          <FormField
            label="Last Name"
            name="lastName"
            placeholder="Last name"
            value={formData.lastName}
            error={errors.lastName}
            onChange={(v) => onUpdate('lastName', v)}
            delay={0.2}
          />
        </div>

        <FormField
          label="Email Address"
          name="email"
          type="email"
          placeholder="your@email.com"
          hint="We'll send your personalized treatment plan here"
          value={formData.email}
          error={errors.email}
          onChange={(v) => onUpdate('email', v)}
          delay={0.25}
        />

        <FormField
          label="Phone Number"
          name="phone"
          type="tel"
          placeholder="(425) 555-1234"
          hint="For appointment reminders only - we never spam"
          value={formData.phone}
          error={errors.phone}
          onChange={(v) => onUpdate('phone', v)}
          delay={0.3}
        />

        <FormField
          label="Date of Birth"
          name="dob"
          type="date"
          hint="Helps us recommend age-appropriate treatments"
          value={formData.dob}
          error={errors.dob}
          onChange={(v) => onUpdate('dob', v)}
          delay={0.35}
        />
      </div>

      {/* Privacy reassurance */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="mt-8 flex items-start gap-2 p-4 rounded-xl bg-[#C9A96E]/5 border border-[#C9A96E]/10"
      >
        <svg
          className="w-4 h-4 text-rani-gold-accessible mt-0.5 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <p className="font-body text-xs text-[#0F1D2C]/50 leading-relaxed">
          Your information is encrypted and protected under HIPAA guidelines.
          We&apos;ll never share your details with third parties.
        </p>
      </motion.div>
    </motion.div>
  );
}
