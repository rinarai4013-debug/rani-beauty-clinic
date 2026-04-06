'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Sparkles, Shield, Clock, CreditCard, Star, ChevronRight, Phone, CheckCircle } from 'lucide-react';
import { clinicInfo } from '@/data/clinic-info';

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

const SERVICES = [
  { name: 'Botox & Fillers', price: 'From $300', desc: 'Wrinkle relaxation and volume restoration for a naturally refreshed look', icon: '\u{1F489}', href: '/services/botox-dysport' },
  { name: 'HydraFacial', price: '$249', desc: 'Deep-cleansing, hydrating facial for instant glow and clarity', icon: '\u2728', href: '/services/hydrafacial' },
  { name: 'Sofwave', price: 'From $2,750', desc: 'Non-invasive ultrasound skin tightening and lifting', icon: '\u{1F52C}', href: '/services/sofwave' },
  { name: 'RF Microneedling', price: 'From $495', desc: 'Collagen stimulation for acne scars, texture, and tightening', icon: '\u{1F3AF}', href: '/services/rf-microneedling' },
  { name: 'Laser Hair Removal', price: 'Packages from $800', desc: 'Permanent hair reduction for all skin tones', icon: '\u26A1', href: '/services/laser-hair-removal' },
  { name: 'GLP-1 Weight Loss', price: '$399-599/mo', desc: 'Physician-supervised medical weight loss program', icon: '\u{1F4AA}', href: '/wellness/glp1-weight-management' },
];

const TRUST_POINTS = [
  { icon: Shield, label: 'Physician-Supervised', desc: 'Every treatment overseen by our medical director' },
  { icon: Clock, label: 'Free Consultations', desc: 'Complimentary assessment with personalized plan' },
  { icon: CreditCard, label: 'Flexible Financing', desc: 'Payment plans with instant approval' },
  { icon: Star, label: 'HSA/FSA Accepted', desc: 'Use pre-tax dollars for eligible treatments' },
];

export default function GetStartedPage() {
  return (
    <div className="min-h-screen bg-rani-cream">
      <section className="relative bg-gradient-to-br from-rani-navy via-[#162A3D] to-rani-navy overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-96 h-96 bg-rani-gold rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-rani-gold rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-28 text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp} className="flex items-center justify-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-rani-gold" />
              <span className="text-xs font-body font-semibold uppercase tracking-[0.2em] text-rani-gold">Rani Beauty Clinic</span>
              <Sparkles className="w-5 h-5 text-rani-gold" />
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl font-heading text-white leading-tight mb-6">
              Your Transformation<br /><span className="text-rani-gold">Starts Here</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="text-lg md:text-xl font-body text-white/70 max-w-2xl mx-auto mb-4">
              Complimentary AI-Powered Skin Analysis · Personalized Treatment Plan · No Obligation
            </motion.p>
            <motion.p variants={fadeUp} className="text-sm font-body text-white/50 mb-10">
              2-minute assessment · Results in 24 hours · Physician-supervised care
            </motion.p>
            <motion.div variants={fadeUp}>
              <Link href={clinicInfo.consultation.url}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-rani-gold hover:bg-[#B8963D] text-rani-navy font-body font-bold text-lg px-10 py-4 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
                Start Your Free Assessment <ChevronRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
        <div className="bg-white/5 backdrop-blur border-t border-white/10">
          <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-center justify-center gap-6 md:gap-10 text-sm font-body text-white/60">
            <span className="flex items-center gap-1"><Star className="w-4 h-4 text-rani-gold fill-rani-gold" /> 4.9 on Google</span>
            <span>2,181+ Clients</span><span>Physician-Supervised</span><span>Renton, WA</span>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-14">
          <motion.p variants={fadeUp} className="text-xs font-body font-semibold uppercase tracking-[0.2em] text-rani-gold mb-3">How It Works</motion.p>
          <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-heading text-rani-navy">Three Simple Steps</motion.h2>
        </motion.div>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { num: '01', title: 'Tell Us About Your Goals', desc: 'Complete our 2-minute AI-powered skin assessment. Share your concerns, goals, and treatment preferences.' },
            { num: '02', title: 'We Design Your Plan', desc: 'Our AI Treatment Architect analyzes your intake and creates a personalized treatment roadmap with pricing and timeline.' },
            { num: '03', title: 'See Your Transformation', desc: "Review your custom plan, explore financing options, and book your first appointment when you're ready." },
          ].map((step, i) => (
            <motion.div key={i} variants={fadeUp} className="relative bg-white rounded-2xl p-8 shadow-sm border border-rani-border hover:shadow-md transition-shadow">
              <span className="text-5xl font-heading text-rani-gold/20 absolute top-4 right-6">{step.num}</span>
              <div className="w-12 h-12 bg-rani-gold/10 rounded-xl flex items-center justify-center mb-5">
                <span className="text-2xl font-heading text-rani-gold">{step.num}</span>
              </div>
              <h3 className="text-lg font-heading text-rani-navy mb-3">{step.title}</h3>
              <p className="text-sm font-body text-rani-muted leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-14">
            <motion.p variants={fadeUp} className="text-xs font-body font-semibold uppercase tracking-[0.2em] text-rani-gold mb-3">Our Services</motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-heading text-rani-navy">Medical-Grade Aesthetic Treatments</motion.h2>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((svc, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Link href={svc.href} className="block bg-rani-cream/50 rounded-2xl p-6 border border-rani-border hover:border-rani-gold/30 hover:shadow-md transition-all group">
                  <span className="text-3xl mb-4 block">{svc.icon}</span>
                  <h3 className="text-base font-heading text-rani-navy mb-1 group-hover:text-rani-gold transition-colors">{svc.name}</h3>
                  <p className="text-sm font-body font-semibold text-rani-gold mb-2">{svc.price}</p>
                  <p className="text-xs font-body text-rani-muted leading-relaxed">{svc.desc}</p>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {TRUST_POINTS.map((tp, i) => (
            <motion.div key={i} variants={fadeUp} className="text-center p-6">
              <tp.icon className="w-10 h-10 text-rani-gold mx-auto mb-4" />
              <h3 className="text-sm font-heading text-rani-navy mb-2">{tp.label}</h3>
              <p className="text-xs font-body text-rani-muted">{tp.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="bg-gradient-to-r from-rani-navy to-[#1A2F44] py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.h2 variants={fadeUp} className="text-2xl md:text-3xl font-heading text-white mb-4">
              Treatments from <span className="text-rani-gold">$89/month</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-base font-body text-white/60 mb-2">
              0% APR financing through PatientFi &amp; Cherry · Instant approval · No hard credit check
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-6 mt-6">
              {['Afterpay', 'Cherry', 'PatientFi', 'HSA/FSA'].map((method) => (
                <span key={method} className="text-sm font-body text-white/40 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-rani-gold" /> {method}
                </span>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
          <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-heading text-rani-navy mb-4">Ready to Glow?</motion.h2>
          <motion.p variants={fadeUp} className="text-base font-body text-rani-muted mb-8 max-w-lg mx-auto">
            Start your free AI-powered skin assessment and receive a personalized treatment plan within 24 hours.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={clinicInfo.consultation.url}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-rani-gold hover:bg-[#B8963D] text-rani-navy font-body font-bold text-lg px-10 py-4 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
              Start Your Free Assessment <ChevronRight className="w-5 h-5" />
            </Link>
            <a href="tel:+14255394440" className="inline-flex items-center gap-2 text-rani-navy font-body font-medium hover:text-rani-gold transition-colors">
              <Phone className="w-4 h-4" /> Or call (425) 539-4440
            </a>
          </motion.div>
        </motion.div>
      </section>

      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-rani-border p-3 sm:hidden z-50">
        <Link href={clinicInfo.consultation.url}
          target="_blank" rel="noopener noreferrer"
          className="block w-full bg-rani-gold text-rani-navy font-body font-bold text-center py-3.5 rounded-full">
          Start Your Free Assessment
        </Link>
      </div>
    </div>
  );
}
