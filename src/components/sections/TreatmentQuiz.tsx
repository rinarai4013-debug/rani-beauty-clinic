"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Sparkles, CheckCircle } from "lucide-react";

interface QuizOption {
  label: string;
  value: string;
}

interface QuizStep {
  question: string;
  options: QuizOption[];
}

const quizSteps: QuizStep[] = [
  {
    question: "What\u2019s your primary goal?",
    options: [
      { label: "Smoother, Glowing Skin", value: "glowing-skin" },
      { label: "Reduce Fine Lines & Wrinkles", value: "anti-aging" },
      { label: "Body Contouring & Hair Removal", value: "body-contouring" },
      { label: "Optimize Health & Wellness", value: "health-wellness" },
    ],
  },
  {
    question: "What\u2019s your experience with aesthetic treatments?",
    options: [
      { label: "First timer \u2014 I\u2019m brand new", value: "first-timer" },
      { label: "I\u2019ve had a few treatments before", value: "some-experience" },
      { label: "I\u2019m a regular \u2014 looking for what\u2019s next", value: "experienced" },
    ],
  },
  {
    question: "What\u2019s your ideal timeline for results?",
    options: [
      { label: "I want immediate results", value: "immediate" },
      { label: "I\u2019m happy to build results over time", value: "gradual" },
      { label: "I want a long-term maintenance plan", value: "long-term" },
    ],
  },
];

const TOTAL_STEPS = quizSteps.length + 1; // +1 for contact form

const fadeSlide = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

export default function TreatmentQuiz() {
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState("");

  const progress = ((currentStep + 1) / TOTAL_STEPS) * 100;
  const isContactStep = currentStep === quizSteps.length;

  const handleOptionSelect = (value: string) => {
    setAnswers((prev) => ({ ...prev, [currentStep]: value }));
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim()) {
      setError("Please fill in your name and email.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    const payload = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      quizAnswers: {
        primaryGoal:
          quizSteps[0].options.find((o) => o.value === answers[0])?.label || "",
        experience:
          quizSteps[1].options.find((o) => o.value === answers[1])?.label || "",
        timeline:
          quizSteps[2].options.find((o) => o.value === answers[2])?.label || "",
      },
      source: "treatment-quiz",
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Submission failed");
      }

      setIsComplete(true);

      setTimeout(() => {
        window.open(
          "https://form.typeform.com/to/rani-consultation",
          "_blank"
        );
      }, 3000);
    } catch {
      setError(
        "Something went wrong. Please try again or contact us directly."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Intro Screen ──
  if (!quizStarted) {
    return (
      <section className="relative overflow-hidden bg-rani-navy py-24 sm:py-32">
        {/* Decorative gradient blobs */}
        <div className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-rani-gold/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -right-40 h-[400px] w-[400px] rounded-full bg-rani-gold/5 blur-3xl" />

        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-rani-gold/30 bg-rani-gold/10 px-4 py-1.5 text-sm font-medium tracking-wide text-rani-gold">
              <Sparkles className="h-4 w-4" />
              Personalized For You
            </span>

            <h2 className="mt-6 font-heading text-4xl font-bold leading-tight text-white sm:text-5xl">
              Find Your Perfect{" "}
              <span className="text-rani-gold">Treatment</span>
            </h2>

            <p className="mx-auto mt-5 max-w-xl font-body text-lg leading-relaxed text-white/70">
              Answer a few quick questions and we&apos;ll create a personalized
              treatment plan tailored to your goals, experience, and timeline.
            </p>

            <button
              onClick={() => setQuizStarted(true)}
              className="group mt-10 inline-flex items-center gap-3 rounded-full bg-rani-gold px-8 py-4 font-body text-base font-semibold text-rani-navy shadow-lg shadow-rani-gold/20 transition-all duration-300 hover:bg-white hover:shadow-xl hover:shadow-rani-gold/30"
            >
              Start Your Treatment Journey
              <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </motion.div>
        </div>
      </section>
    );
  }

  // ── Success Screen ──
  if (isComplete) {
    return (
      <section className="relative overflow-hidden bg-rani-navy py-24 sm:py-32">
        <div className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-rani-gold/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -right-40 h-[400px] w-[400px] rounded-full bg-rani-gold/5 blur-3xl" />

        <div className="relative mx-auto max-w-2xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="rounded-2xl border border-rani-gold/20 bg-white/5 p-10 backdrop-blur-sm sm:p-14"
          >
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-rani-gold/20">
              <CheckCircle className="h-10 w-10 text-rani-gold" />
            </div>

            <h2 className="font-heading text-3xl font-bold text-white sm:text-4xl">
              You&apos;re All Set!
            </h2>

            <p className="mx-auto mt-4 max-w-md font-body text-lg leading-relaxed text-white/70">
              Thank you, {name.split(" ")[0]}! Your personalized treatment plan
              is on its way to{" "}
              <span className="text-rani-gold">{email}</span>. We&apos;re also
              opening our consultation booking page for you.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <a
                href="https://form.typeform.com/to/rani-consultation"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-rani-gold px-7 py-3 font-body text-sm font-semibold text-rani-navy transition-all duration-300 hover:bg-white"
              >
                Book Your Consultation
                <ArrowRight className="h-4 w-4" />
              </a>

              <button
                onClick={() => {
                  setQuizStarted(false);
                  setCurrentStep(0);
                  setAnswers({});
                  setName("");
                  setEmail("");
                  setPhone("");
                  setIsComplete(false);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-7 py-3 font-body text-sm font-medium text-white/60 transition-all duration-300 hover:border-white/40 hover:text-white"
              >
                Retake Quiz
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  // ── Quiz Steps ──
  return (
    <section className="relative overflow-hidden bg-rani-navy py-24 sm:py-32">
      {/* Decorative gradient blobs */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-rani-gold/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[400px] w-[400px] rounded-full bg-rani-gold/5 blur-3xl" />

      <div className="relative mx-auto max-w-2xl px-4">
        {/* Progress Bar */}
        <div className="mb-10">
          <div className="mb-3 flex items-center justify-between font-body text-sm text-white/50">
            <span>
              Step {currentStep + 1} of {TOTAL_STEPS}
            </span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-rani-gold"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            />
          </div>
        </div>

        {/* Quiz Card */}
        <div className="min-h-[420px] rounded-2xl border border-rani-gold/20 bg-white/5 p-8 backdrop-blur-sm sm:p-10">
          <AnimatePresence mode="wait">
            {!isContactStep ? (
              // ── Question Steps ──
              <motion.div
                key={`step-${currentStep}`}
                variants={fadeSlide}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.35, ease: "easeInOut" }}
              >
                <h3 className="font-heading text-2xl font-bold leading-snug text-white sm:text-3xl">
                  {quizSteps[currentStep].question}
                </h3>

                <div className="mt-8 grid gap-4">
                  {quizSteps[currentStep].options.map((option) => {
                    const isSelected = answers[currentStep] === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => handleOptionSelect(option.value)}
                        className={`group relative w-full rounded-xl border-2 px-6 py-5 text-left font-body text-base font-medium transition-all duration-300 ${
                          isSelected
                            ? "border-rani-gold bg-rani-gold/15 text-rani-gold shadow-lg shadow-rani-gold/10"
                            : "border-white/10 bg-white/5 text-white/80 hover:border-rani-gold/40 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <span
                            className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                              isSelected
                                ? "border-rani-gold bg-rani-gold"
                                : "border-white/30 group-hover:border-rani-gold/50"
                            }`}
                          >
                            {isSelected && (
                              <motion.svg
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 400,
                                  damping: 15,
                                }}
                                className="h-3 w-3 text-rani-navy"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={3}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </motion.svg>
                            )}
                          </span>
                          {option.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              // ── Contact Form Step ──
              <motion.div
                key="contact-step"
                variants={fadeSlide}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.35, ease: "easeInOut" }}
              >
                <h3 className="font-heading text-2xl font-bold leading-snug text-white sm:text-3xl">
                  Almost there!
                </h3>
                <p className="mt-2 font-body text-base text-white/60">
                  Enter your details to get your personalized treatment plan:
                </p>

                <div className="mt-8 space-y-5">
                  {/* Name */}
                  <div>
                    <label
                      htmlFor="quiz-name"
                      className="mb-2 block font-body text-sm font-medium text-white/70"
                    >
                      Full Name <span className="text-rani-gold">*</span>
                    </label>
                    <input
                      id="quiz-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Smith"
                      className="w-full rounded-xl border-2 border-white/10 bg-white/5 px-5 py-3.5 font-body text-base text-white placeholder-white/30 outline-none transition-all duration-300 focus:border-rani-gold focus:bg-white/10 focus:ring-0"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="quiz-email"
                      className="mb-2 block font-body text-sm font-medium text-white/70"
                    >
                      Email Address <span className="text-rani-gold">*</span>
                    </label>
                    <input
                      id="quiz-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane@example.com"
                      className="w-full rounded-xl border-2 border-white/10 bg-white/5 px-5 py-3.5 font-body text-base text-white placeholder-white/30 outline-none transition-all duration-300 focus:border-rani-gold focus:bg-white/10 focus:ring-0"
                    />
                  </div>

                  {/* Phone (optional) */}
                  <div>
                    <label
                      htmlFor="quiz-phone"
                      className="mb-2 block font-body text-sm font-medium text-white/70"
                    >
                      Phone Number{" "}
                      <span className="text-white/40">(optional)</span>
                    </label>
                    <input
                      id="quiz-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(555) 123-4567"
                      className="w-full rounded-xl border-2 border-white/10 bg-white/5 px-5 py-3.5 font-body text-base text-white placeholder-white/30 outline-none transition-all duration-300 focus:border-rani-gold focus:bg-white/10 focus:ring-0"
                    />
                  </div>

                  {/* Error Message */}
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="font-body text-sm text-red-400"
                    >
                      {error}
                    </motion.p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="mt-10 flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className={`inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 font-body text-sm font-medium transition-all duration-300 ${
                currentStep === 0
                  ? "cursor-not-allowed text-white/20"
                  : "text-white/60 hover:border-white/40 hover:text-white"
              }`}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            {isContactStep ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="group inline-flex items-center gap-2 rounded-full bg-rani-gold px-8 py-3 font-body text-sm font-semibold text-rani-navy shadow-lg shadow-rani-gold/20 transition-all duration-300 hover:bg-white hover:shadow-xl hover:shadow-rani-gold/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    Get My Treatment Plan
                    <Sparkles className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!answers[currentStep]}
                className={`group inline-flex items-center gap-2 rounded-full px-8 py-3 font-body text-sm font-semibold shadow-lg transition-all duration-300 ${
                  answers[currentStep]
                    ? "bg-rani-gold text-rani-navy shadow-rani-gold/20 hover:bg-white hover:shadow-xl hover:shadow-rani-gold/30"
                    : "cursor-not-allowed bg-white/10 text-white/30 shadow-none"
                }`}
              >
                Next
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
