'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

interface IntakeData {
  // Personal
  firstName: string;
  lastName: string;
  dob: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  // Medical
  heightFt: string;
  heightIn: string;
  weight: string;
  conditions: string;
  medications: string;
  allergies: string;
  // History
  previousAttempts: string;
  priorGlp1: string;
  priorGlp1Details: string;
  eatingHabits: string;
  exerciseFrequency: string;
  // Goals
  targetWeight: string;
  timeline: string;
  motivation: string;
  // Consent
  consentMedProvider: boolean;
  consentSeparateFees: boolean;
  consentLabsRequired: boolean;
}

const INITIAL: IntakeData = {
  firstName: '', lastName: '', dob: '', address: '', city: '', state: 'WA', zip: '',
  phone: '', email: '',
  heightFt: '', heightIn: '', weight: '',
  conditions: '', medications: '', allergies: '',
  previousAttempts: '', priorGlp1: '', priorGlp1Details: '', eatingHabits: '', exerciseFrequency: '',
  targetWeight: '', timeline: '', motivation: '',
  consentMedProvider: false, consentSeparateFees: false, consentLabsRequired: false,
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2 className="font-heading text-2xl text-rani-navy mb-1">{title}</h2>
      <div className="w-12 h-0.5 bg-[#C9A96E] mb-6" />
      {children}
    </div>
  );
}

function Field({ label, children, span = 1 }: { label: string; children: React.ReactNode; span?: number }) {
  return (
    <div className={span === 2 ? 'sm:col-span-2' : ''}>
      <label className="block font-body text-sm font-medium text-rani-navy mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputClass =
  'w-full border border-rani-border rounded-lg px-4 py-3 font-body text-sm text-rani-text bg-white focus:outline-none focus:border-[#C9A96E] focus:ring-1 focus:ring-[#C9A96E]/30 transition-colors';
const selectClass = inputClass;
const textareaClass = inputClass + ' resize-none';

export default function GLP1IntakePage() {
  const [data, setData] = useState<IntakeData>(INITIAL);
  const [labFile, setLabFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState(0); // 0=form, 1=review, 2=done

  const set = (field: keyof IntakeData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const val = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setData((d) => ({ ...d, [field]: val }));
  };

  const bmi = useMemo(() => {
    const ft = parseFloat(data.heightFt);
    const inches = parseFloat(data.heightIn);
    const lbs = parseFloat(data.weight);
    if (!ft || !lbs) return null;
    const totalInches = ft * 12 + (inches || 0);
    const result = (lbs / (totalInches * totalInches)) * 703;
    return result > 0 && result < 100 ? result.toFixed(1) : null;
  }, [data.heightFt, data.heightIn, data.weight]);

  const bmiCategory = useMemo(() => {
    if (!bmi) return null;
    const val = parseFloat(bmi);
    if (val < 18.5) return { label: 'Underweight', color: 'text-yellow-600' };
    if (val < 25) return { label: 'Normal', color: 'text-rani-success' };
    if (val < 30) return { label: 'Overweight', color: 'text-yellow-600' };
    if (val < 35) return { label: 'Obese (Class I)', color: 'text-orange-600' };
    if (val < 40) return { label: 'Obese (Class II)', color: 'text-red-500' };
    return { label: 'Obese (Class III)', color: 'text-red-700' };
  }, [bmi]);

  const allConsentsChecked = data.consentMedProvider && data.consentSeparateFees && data.consentLabsRequired;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 0) {
      setStep(1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    // TODO: POST to /api/glp1/intake
    setStep(2);
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-rani-cream">
      {/* Header */}
      <div className="bg-rani-navy text-white py-12 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="font-body text-[#C9A96E] uppercase tracking-[0.15em] text-sm mb-3">Weight Management Program</p>
          <h1 className="font-heading text-3xl sm:text-4xl mb-3">Patient Intake Form</h1>
          <p className="font-body text-gray-300 max-w-lg mx-auto">
            Complete this form to begin your medical evaluation. All information is kept confidential and
            shared only with your prescribing provider.
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-8">
        <div className="flex items-center justify-between mb-2">
          {['Intake Form', 'Review', 'Submitted'].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-body font-bold ${
                  step >= i ? 'bg-[#C9A96E] text-rani-navy' : 'bg-rani-border text-rani-muted'
                }`}
              >
                {step > i ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span className={`font-body text-sm ${step >= i ? 'text-rani-navy font-medium' : 'text-rani-muted'}`}>
                {label}
              </span>
            </div>
          ))}
        </div>
        <div className="w-full bg-rani-border rounded-full h-1.5">
          <div
            className="bg-[#C9A96E] h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${((step + 1) / 3) * 100}%` }}
          />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {step === 2 ? (
          /* Success */
          <div className="bg-white rounded-2xl p-10 border border-rani-border shadow-sm text-center">
            <div className="w-16 h-16 bg-rani-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-rani-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="font-heading text-2xl text-rani-navy mb-3">Intake Submitted Successfully</h2>
            <p className="font-body text-rani-muted max-w-md mx-auto mb-6">
              Our team will review your information and schedule your medical evaluation.
              You will receive a confirmation email within 24 hours.
            </p>
            <Link
              href="/glp1"
              className="inline-block bg-rani-navy text-white px-6 py-3 rounded-lg font-body font-semibold text-sm hover:bg-rani-navy-light transition-colors"
            >
              Return to Program Page
            </Link>
          </div>
        ) : step === 1 ? (
          /* Review */
          <div className="bg-white rounded-2xl border border-rani-border shadow-sm overflow-hidden">
            <div className="bg-rani-navy px-8 py-5">
              <h2 className="font-heading text-xl text-white">Review Your Information</h2>
              <p className="font-body text-sm text-gray-400">Please verify everything is correct before submitting.</p>
            </div>
            <div className="p-8 space-y-8">
              {/* Personal */}
              <div>
                <h3 className="font-body font-bold text-rani-navy text-sm uppercase tracking-wider mb-3">Personal Information</h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 font-body text-sm">
                  <div><span className="text-rani-muted">Name:</span> <span className="text-rani-text">{data.firstName} {data.lastName}</span></div>
                  <div><span className="text-rani-muted">DOB:</span> <span className="text-rani-text">{data.dob}</span></div>
                  <div><span className="text-rani-muted">Phone:</span> <span className="text-rani-text">{data.phone}</span></div>
                  <div><span className="text-rani-muted">Email:</span> <span className="text-rani-text">{data.email}</span></div>
                  <div className="col-span-2"><span className="text-rani-muted">Address:</span> <span className="text-rani-text">{data.address}, {data.city}, {data.state} {data.zip}</span></div>
                </div>
              </div>
              {/* Medical */}
              <div>
                <h3 className="font-body font-bold text-rani-navy text-sm uppercase tracking-wider mb-3">Medical Information</h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 font-body text-sm">
                  <div><span className="text-rani-muted">Height:</span> <span className="text-rani-text">{data.heightFt}&apos;{data.heightIn}&quot;</span></div>
                  <div><span className="text-rani-muted">Weight:</span> <span className="text-rani-text">{data.weight} lbs</span></div>
                  <div><span className="text-rani-muted">BMI:</span> <span className="text-rani-text">{bmi || 'N/A'}</span></div>
                  <div><span className="text-rani-muted">Target Weight:</span> <span className="text-rani-text">{data.targetWeight} lbs</span></div>
                </div>
                {data.conditions && (
                  <p className="font-body text-sm mt-2"><span className="text-rani-muted">Conditions:</span> <span className="text-rani-text">{data.conditions}</span></p>
                )}
                {data.medications && (
                  <p className="font-body text-sm mt-1"><span className="text-rani-muted">Medications:</span> <span className="text-rani-text">{data.medications}</span></p>
                )}
              </div>
              {/* Labs */}
              <div>
                <h3 className="font-body font-bold text-rani-navy text-sm uppercase tracking-wider mb-3">Lab Results</h3>
                <p className="font-body text-sm text-rani-text">{labFile ? labFile.name : 'No file uploaded'}</p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => { setStep(0); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="flex-1 border border-rani-border text-rani-navy py-3 rounded-lg font-body font-semibold text-sm hover:bg-rani-cream transition-colors"
                >
                  Edit Information
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 bg-[#C9A96E] text-rani-navy py-3 rounded-lg font-body font-bold text-sm hover:bg-[#d4b67e] transition-colors"
                >
                  Submit Intake Form
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 sm:p-10 border border-rani-border shadow-sm">
            {/* Personal Info */}
            <Section title="Personal Information">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="First Name">
                  <input type="text" required value={data.firstName} onChange={set('firstName')} className={inputClass} />
                </Field>
                <Field label="Last Name">
                  <input type="text" required value={data.lastName} onChange={set('lastName')} className={inputClass} />
                </Field>
                <Field label="Date of Birth">
                  <input type="date" required value={data.dob} onChange={set('dob')} className={inputClass} />
                </Field>
                <Field label="Phone">
                  <input type="tel" required value={data.phone} onChange={set('phone')} className={inputClass} placeholder="(425) 555-0100" />
                </Field>
                <Field label="Email" span={2}>
                  <input type="email" required value={data.email} onChange={set('email')} className={inputClass} placeholder="you@email.com" />
                </Field>
                <Field label="Street Address" span={2}>
                  <input type="text" required value={data.address} onChange={set('address')} className={inputClass} />
                </Field>
                <Field label="City">
                  <input type="text" required value={data.city} onChange={set('city')} className={inputClass} placeholder="Renton" />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="State">
                    <select value={data.state} onChange={set('state')} className={selectClass}>
                      <option value="WA">WA</option>
                      <option value="OR">OR</option>
                      <option value="CA">CA</option>
                      <option value="ID">ID</option>
                    </select>
                  </Field>
                  <Field label="ZIP">
                    <input type="text" required value={data.zip} onChange={set('zip')} className={inputClass} placeholder="98056" />
                  </Field>
                </div>
              </div>
            </Section>

            {/* Medical Info */}
            <Section title="Medical Information">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Height (ft)">
                    <input type="number" required min="3" max="8" value={data.heightFt} onChange={set('heightFt')} className={inputClass} placeholder="5" />
                  </Field>
                  <Field label="Height (in)">
                    <input type="number" min="0" max="11" value={data.heightIn} onChange={set('heightIn')} className={inputClass} placeholder="6" />
                  </Field>
                </div>
                <div>
                  <Field label="Weight (lbs)">
                    <input type="number" required min="50" max="800" value={data.weight} onChange={set('weight')} className={inputClass} placeholder="200" />
                  </Field>
                </div>
              </div>

              {/* BMI Display */}
              {bmi && (
                <div className="mt-4 bg-rani-cream rounded-xl p-4 flex items-center gap-4">
                  <div>
                    <p className="font-body text-xs text-rani-muted uppercase tracking-wider">Calculated BMI</p>
                    <p className="font-heading text-3xl text-rani-navy">{bmi}</p>
                  </div>
                  <div>
                    <span className={`font-body font-semibold text-sm ${bmiCategory?.color}`}>
                      {bmiCategory?.label}
                    </span>
                    <p className="font-body text-xs text-rani-muted mt-0.5">
                      GLP-1 medications are typically prescribed for BMI 30+ or BMI 27+ with comorbidities.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                <Field label="Medical Conditions" span={2}>
                  <textarea
                    rows={3}
                    value={data.conditions}
                    onChange={set('conditions')}
                    className={textareaClass}
                    placeholder="List any medical conditions (diabetes, hypertension, PCOS, sleep apnea, etc.)"
                  />
                </Field>
                <Field label="Current Medications" span={2}>
                  <textarea
                    rows={3}
                    value={data.medications}
                    onChange={set('medications')}
                    className={textareaClass}
                    placeholder="List all current medications, supplements, and dosages"
                  />
                </Field>
                <Field label="Allergies" span={2}>
                  <textarea
                    rows={2}
                    value={data.allergies}
                    onChange={set('allergies')}
                    className={textareaClass}
                    placeholder="List any known allergies (medications, food, etc.)"
                  />
                </Field>
              </div>
            </Section>

            {/* History */}
            <Section title="Weight Loss History">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Previous Weight Loss Attempts" span={2}>
                  <textarea
                    rows={3}
                    value={data.previousAttempts}
                    onChange={set('previousAttempts')}
                    className={textareaClass}
                    placeholder="Describe any diets, programs, or medications you've tried"
                  />
                </Field>
                <Field label="Prior GLP-1 Use">
                  <select value={data.priorGlp1} onChange={set('priorGlp1')} className={selectClass}>
                    <option value="">Select...</option>
                    <option value="none">No prior use</option>
                    <option value="semaglutide">Semaglutide (Ozempic/Wegovy)</option>
                    <option value="tirzepatide">Tirzepatide (Mounjaro/Zepbound)</option>
                    <option value="liraglutide">Liraglutide (Saxenda)</option>
                    <option value="other">Other</option>
                  </select>
                </Field>
                {data.priorGlp1 && data.priorGlp1 !== 'none' && (
                  <Field label="Details (dose, duration, results)">
                    <input type="text" value={data.priorGlp1Details} onChange={set('priorGlp1Details')} className={inputClass} placeholder="e.g., Ozempic 0.5mg for 3 months, lost 15 lbs" />
                  </Field>
                )}
                <Field label="Eating Habits">
                  <select value={data.eatingHabits} onChange={set('eatingHabits')} className={selectClass}>
                    <option value="">Select...</option>
                    <option value="regular">Regular (3 meals/day)</option>
                    <option value="irregular">Irregular/skipping meals</option>
                    <option value="snacking">Frequent snacking</option>
                    <option value="binge">Binge eating tendencies</option>
                    <option value="emotional">Emotional eating</option>
                  </select>
                </Field>
                <Field label="Exercise Frequency">
                  <select value={data.exerciseFrequency} onChange={set('exerciseFrequency')} className={selectClass}>
                    <option value="">Select...</option>
                    <option value="none">None / Sedentary</option>
                    <option value="light">1-2x per week</option>
                    <option value="moderate">3-4x per week</option>
                    <option value="active">5+ per week</option>
                  </select>
                </Field>
              </div>
            </Section>

            {/* Lab Upload */}
            <Section title="Lab Results">
              <p className="font-body text-sm text-rani-muted mb-4">
                Upload recent lab results (within last 6 months). Required: CBC, CMP, A1C, Lipid Panel, Thyroid (TSH).
                If you do not have recent labs, we can arrange blood work for you.
              </p>
              <div className="border-2 border-dashed border-rani-border rounded-xl p-8 text-center hover:border-[#C9A96E] transition-colors">
                <svg className="w-10 h-10 text-rani-muted mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setLabFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="lab-upload"
                />
                <label htmlFor="lab-upload" className="cursor-pointer">
                  <span className="font-body text-sm text-[#C9A96E] font-semibold hover:underline">
                    Click to upload
                  </span>
                  <span className="font-body text-sm text-rani-muted"> or drag and drop</span>
                </label>
                <p className="font-body text-xs text-rani-muted mt-1">PDF, JPG, PNG up to 10MB</p>
                {labFile && (
                  <div className="mt-3 inline-flex items-center gap-2 bg-rani-cream px-3 py-1.5 rounded-lg">
                    <svg className="w-4 h-4 text-rani-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-body text-xs text-rani-text">{labFile.name}</span>
                  </div>
                )}
              </div>
            </Section>

            {/* Goals */}
            <Section title="Goals">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Target Weight (lbs)">
                  <input type="number" required min="80" max="500" value={data.targetWeight} onChange={set('targetWeight')} className={inputClass} placeholder="160" />
                </Field>
                <Field label="Timeline Expectations">
                  <select value={data.timeline} onChange={set('timeline')} className={selectClass}>
                    <option value="">Select...</option>
                    <option value="3mo">3 months</option>
                    <option value="6mo">6 months</option>
                    <option value="12mo">12 months</option>
                    <option value="noRush">No rush - sustainable progress</option>
                  </select>
                </Field>
                <Field label="What motivated you to start this program?" span={2}>
                  <textarea
                    rows={3}
                    required
                    value={data.motivation}
                    onChange={set('motivation')}
                    className={textareaClass}
                    placeholder="Tell us what's driving your decision to take this step..."
                  />
                </Field>
              </div>
            </Section>

            {/* Consent */}
            <Section title="Acknowledgments">
              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.consentMedProvider}
                    onChange={set('consentMedProvider')}
                    className="mt-1 w-4 h-4 rounded border-rani-border text-[#C9A96E] focus:ring-[#C9A96E]"
                  />
                  <span className="font-body text-sm text-rani-text">
                    I understand that medication is prescribed by an independent licensed medical provider through a telehealth
                    Good Faith Exam, and that not everyone qualifies for GLP-1 medication. Rani Beauty Clinic facilitates this process
                    but does not prescribe medications.
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.consentSeparateFees}
                    onChange={set('consentSeparateFees')}
                    className="mt-1 w-4 h-4 rounded border-rani-border text-[#C9A96E] focus:ring-[#C9A96E]"
                  />
                  <span className="font-body text-sm text-rani-text">
                    I understand that the program fee is separate from medication costs. Medication is purchased directly from
                    LillyDirect or my preferred pharmacy. Total monthly cost includes both the program fee and medication cost.
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.consentLabsRequired}
                    onChange={set('consentLabsRequired')}
                    className="mt-1 w-4 h-4 rounded border-rani-border text-[#C9A96E] focus:ring-[#C9A96E]"
                  />
                  <span className="font-body text-sm text-rani-text">
                    I understand that a medical evaluation is required, including recent lab work (CBC, CMP, A1C, Lipid Panel, TSH).
                    The information I have provided is accurate and complete to the best of my knowledge.
                  </span>
                </label>
              </div>
            </Section>

            <button
              type="submit"
              disabled={!allConsentsChecked}
              className={`w-full py-4 rounded-lg font-body font-bold text-lg transition-colors ${
                allConsentsChecked
                  ? 'bg-[#C9A96E] text-rani-navy hover:bg-[#d4b67e]'
                  : 'bg-rani-border text-rani-muted cursor-not-allowed'
              }`}
            >
              Review & Submit
            </button>
          </form>
        )}
      </div>

      {/* Confidentiality Note */}
      <div className="py-6 text-center">
        <p className="font-body text-xs text-rani-muted">
          Your information is confidential and protected. Rani Beauty Clinic (Anatomi LLC) &middot; 401 Olympia Ave NE #101, Renton, WA 98056
        </p>
      </div>
    </div>
  );
}
