'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus, AlertTriangle, CheckCircle, XCircle,
  Beaker, MessageCircle, Mail, Tag, DollarSign,
  ShoppingBag, ArrowLeft, Loader2, ChevronDown,
  ChevronUp, Copy, Check, FileText,
} from 'lucide-react';

/**
 * Intake Processing Page
 *
 * Form for entering raw patient data, real-time contraindication checking,
 * labs determination, Qualiphy quick-entry, welcome messages, tags, revenue.
 */

interface IntakeFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  height: string;
  weight: string;
  goalWeight: string;
  medicalHistory: string;
  currentMedications: string;
  allergies: string;
  previousGlp1Used: boolean;
  previousGlp1Medication: string;
  previousGlp1Duration: string;
  previousGlp1ReasonStopped: string;
  preferredMedication: string;
  referralSource: string;
  notes: string;
}

interface IntakeResult {
  status: string;
  patient: { name: string; email: string; phone: string; bmi: number; goalWeight: number | null };
  contraindications: {
    cleared: boolean;
    hardContraindications: string[];
    softContraindications: string[];
    warnings: string[];
    requiresProviderReview: boolean;
  };
  labs: { name: string; required: boolean; reason: string; validityDays: number }[];
  qualiphyBlock: Record<string, unknown>;
  messages: { sms: string; email: string };
  mangomintTags: { id: string; name: string; category: string }[];
  revenue: {
    monthlyEstimate: number;
    sixMonthEstimate: number;
    twelveMonthEstimate: number;
    tier: string;
    crossSellPotential: number;
  };
  crossSellOpportunities: { serviceName: string; price: number; reason: string; confidence: string }[];
  nextSteps: string[];
}

const INITIAL_FORM: IntakeFormData = {
  firstName: '', lastName: '', email: '', phone: '',
  dateOfBirth: '', gender: '', height: '', weight: '',
  goalWeight: '',
  medicalHistory: '', currentMedications: '', allergies: '',
  previousGlp1Used: false, previousGlp1Medication: '',
  previousGlp1Duration: '', previousGlp1ReasonStopped: '',
  preferredMedication: 'no_preference', referralSource: '', notes: '',
};

const MEDICAL_CONDITIONS = [
  'Medullary Thyroid Carcinoma', 'MEN2 Syndrome', 'Pancreatitis (Active)',
  'Pancreatitis (History)', 'Pregnancy', 'Breastfeeding', 'Type 1 Diabetes',
  'Type 2 Diabetes', 'Gastroparesis', 'Gallbladder Disease',
  'Renal Impairment', 'Hepatic Impairment', 'Diabetic Retinopathy',
  'Depression History', 'Eating Disorder History', 'Hypertension',
  'Heart Disease', 'Thyroid Disorder',
];

export default function IntakePage() {
  const [form, setForm] = useState<IntakeFormData>(INITIAL_FORM);
  const [result, setResult] = useState<IntakeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    contraindications: true, labs: true, qualiphy: false,
    messages: true, tags: true, revenue: true, crosssell: true,
  });
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const updateField = (field: keyof IntakeFormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleCondition = (condition: string) => {
    setSelectedConditions((prev) =>
      prev.includes(condition)
        ? prev.filter((c) => c !== condition)
        : [...prev, condition]
    );
  };

  const handleSubmit = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        height: form.height,
        weight: parseFloat(form.weight) || 0,
        goalWeight: form.goalWeight ? parseFloat(form.goalWeight) : undefined,
        medicalHistory: selectedConditions.length > 0
          ? selectedConditions
          : form.medicalHistory.split(',').map((s) => s.trim()).filter(Boolean),
        currentMedications: form.currentMedications.split(',').map((s) => s.trim()).filter(Boolean),
        allergies: form.allergies.split(',').map((s) => s.trim()).filter(Boolean),
        previousGlp1: form.previousGlp1Used
          ? {
              used: true,
              medication: form.previousGlp1Medication,
              duration: form.previousGlp1Duration,
              reason_stopped: form.previousGlp1ReasonStopped,
            }
          : { used: false },
        preferredMedication: form.preferredMedication === 'no_preference' ? undefined : form.preferredMedication,
        referralSource: form.referralSource || undefined,
        notes: form.notes || undefined,
      };

      const res = await fetch('/api/ops/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process intake');
      if (data.success) setResult(data.data);
      else throw new Error(data.error || 'Processing failed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [form, selectedConditions]);

  const SectionHeader = ({ title, sectionKey, icon: Icon, badge }: {
    title: string; sectionKey: string; icon: typeof CheckCircle; badge?: string;
  }) => (
    <button
      onClick={() => toggleSection(sectionKey)}
      className="flex items-center justify-between w-full py-2"
    >
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-medium text-white">{title}</span>
        {badge && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#C9A96E]/20 text-[#C9A96E]">
            {badge}
          </span>
        )}
      </div>
      {expandedSections[sectionKey] ? (
        <ChevronUp className="w-4 h-4 text-gray-500" />
      ) : (
        <ChevronDown className="w-4 h-4 text-gray-500" />
      )}
    </button>
  );

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <a
          href="/dashboard/ops"
          className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition"
        >
          <ArrowLeft className="w-4 h-4 text-gray-400" />
        </a>
        <div>
          <h1 className="text-xl sm:text-2xl font-heading text-white">
            /intake - New Patient Processing
          </h1>
          <p className="text-xs sm:text-sm font-body text-gray-400 mt-1">
            Enter patient data. System runs contraindication checks, determines labs, generates messages.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Form */}
        <div className="space-y-4">
          {/* Personal Info */}
          <div className="bg-[#0F1D2C] border border-gray-700/50 rounded-xl p-5">
            <h3 className="text-sm font-medium text-[#C9A96E] mb-4">Patient Information</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">First Name *</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:border-[#C9A96E] focus:outline-none"
                  placeholder="First name"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Last Name *</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:border-[#C9A96E] focus:outline-none"
                  placeholder="Last name"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:border-[#C9A96E] focus:outline-none"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Phone *</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:border-[#C9A96E] focus:outline-none"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => updateField('dateOfBirth', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-white focus:border-[#C9A96E] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Gender</label>
                <select
                  value={form.gender}
                  onChange={(e) => updateField('gender', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-white focus:border-[#C9A96E] focus:outline-none"
                >
                  <option value="">Select</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Clinical Data */}
          <div className="bg-[#0F1D2C] border border-gray-700/50 rounded-xl p-5">
            <h3 className="text-sm font-medium text-[#C9A96E] mb-4">Clinical Data</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Height *</label>
                <input
                  type="text"
                  value={form.height}
                  onChange={(e) => updateField('height', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:border-[#C9A96E] focus:outline-none"
                  placeholder={`5'6"`}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Weight (lbs) *</label>
                <input
                  type="number"
                  value={form.weight}
                  onChange={(e) => updateField('weight', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:border-[#C9A96E] focus:outline-none"
                  placeholder="200"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Goal Weight</label>
                <input
                  type="number"
                  value={form.goalWeight}
                  onChange={(e) => updateField('goalWeight', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:border-[#C9A96E] focus:outline-none"
                  placeholder="160"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs text-gray-500 mb-1">Preferred Medication</label>
              <select
                value={form.preferredMedication}
                onChange={(e) => updateField('preferredMedication', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-white focus:border-[#C9A96E] focus:outline-none"
              >
                <option value="no_preference">No Preference</option>
                <option value="semaglutide">Semaglutide</option>
                <option value="tirzepatide">Tirzepatide</option>
              </select>
            </div>
          </div>

          {/* Medical History */}
          <div className="bg-[#0F1D2C] border border-gray-700/50 rounded-xl p-5">
            <h3 className="text-sm font-medium text-[#C9A96E] mb-4">Medical History</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {MEDICAL_CONDITIONS.map((condition) => (
                <button
                  key={condition}
                  onClick={() => toggleCondition(condition)}
                  className={`px-2 py-1 rounded text-xs transition ${
                    selectedConditions.includes(condition)
                      ? condition.includes('Carcinoma') || condition.includes('MEN2') || condition.includes('Active') || condition.includes('Pregnancy') || condition.includes('Breastfeeding') || condition.includes('Type 1')
                        ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
                  }`}
                >
                  {condition}
                </button>
              ))}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Other Conditions (comma-separated)</label>
              <input
                type="text"
                value={form.medicalHistory}
                onChange={(e) => updateField('medicalHistory', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:border-[#C9A96E] focus:outline-none"
                placeholder="e.g., PCOS, Sleep Apnea"
              />
            </div>
            <div className="mt-3">
              <label className="block text-xs text-gray-500 mb-1">Current Medications</label>
              <input
                type="text"
                value={form.currentMedications}
                onChange={(e) => updateField('currentMedications', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:border-[#C9A96E] focus:outline-none"
                placeholder="e.g., Metformin, Lisinopril"
              />
            </div>
            <div className="mt-3">
              <label className="block text-xs text-gray-500 mb-1">Allergies</label>
              <input
                type="text"
                value={form.allergies}
                onChange={(e) => updateField('allergies', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:border-[#C9A96E] focus:outline-none"
                placeholder="e.g., Penicillin, Shellfish"
              />
            </div>
          </div>

          {/* Previous GLP-1 Experience */}
          <div className="bg-[#0F1D2C] border border-gray-700/50 rounded-xl p-5">
            <h3 className="text-sm font-medium text-[#C9A96E] mb-4">Previous GLP-1 Experience</h3>
            <label className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                checked={form.previousGlp1Used}
                onChange={(e) => updateField('previousGlp1Used', e.target.checked)}
                className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-[#C9A96E] focus:ring-[#C9A96E]"
              />
              <span className="text-sm text-gray-300">Patient has used GLP-1 medication before</span>
            </label>
            {form.previousGlp1Used && (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Medication</label>
                  <input
                    type="text"
                    value={form.previousGlp1Medication}
                    onChange={(e) => updateField('previousGlp1Medication', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:border-[#C9A96E] focus:outline-none"
                    placeholder="e.g., Ozempic"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Duration</label>
                  <input
                    type="text"
                    value={form.previousGlp1Duration}
                    onChange={(e) => updateField('previousGlp1Duration', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:border-[#C9A96E] focus:outline-none"
                    placeholder="e.g., 3 months"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Reason Stopped</label>
                  <input
                    type="text"
                    value={form.previousGlp1ReasonStopped}
                    onChange={(e) => updateField('previousGlp1ReasonStopped', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:border-[#C9A96E] focus:outline-none"
                    placeholder="e.g., Cost, side effects"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Notes + Referral */}
          <div className="bg-[#0F1D2C] border border-gray-700/50 rounded-xl p-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Referral Source</label>
                <select
                  value={form.referralSource}
                  onChange={(e) => updateField('referralSource', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-white focus:border-[#C9A96E] focus:outline-none"
                >
                  <option value="">Select</option>
                  <option value="google">Google Search</option>
                  <option value="instagram">Instagram</option>
                  <option value="referral">Patient Referral</option>
                  <option value="facebook">Facebook</option>
                  <option value="tiktok">TikTok</option>
                  <option value="yelp">Yelp</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Notes</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:border-[#C9A96E] focus:outline-none"
                  placeholder="Any additional notes"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            onClick={handleSubmit}
            disabled={loading || !form.firstName || !form.lastName || !form.email || !form.phone || !form.weight || !form.height}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-3 bg-gradient-to-r from-[#C9A96E] to-[#B8954E] text-[#0F1D2C] font-heading font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing Intake...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Process Intake
              </>
            )}
          </motion.button>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Right Column: Results */}
        <div className="space-y-4">
          {!result && !loading && (
            <div className="bg-[#0F1D2C] border border-gray-700/50 rounded-xl p-8 text-center">
              <FileText className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Enter patient data and click &quot;Process Intake&quot; to see results.</p>
              <p className="text-xs text-gray-600 mt-2">
                The system will check contraindications, determine required labs, generate welcome messages, and calculate revenue estimates.
              </p>
            </div>
          )}

          {result && (
            <>
              {/* Status Banner */}
              <div className={`p-4 rounded-xl border ${
                result.contraindications.cleared
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-red-500/10 border-red-500/30'
              }`}>
                <div className="flex items-center gap-2">
                  {result.contraindications.cleared ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                  <span className={`text-sm font-medium ${result.contraindications.cleared ? 'text-green-400' : 'text-red-400'}`}>
                    {result.status === 'ready_for_labs' ? 'Cleared for Labs' : 'Provider Review Required'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Patient: {result.patient.name} | BMI: {result.patient.bmi}
                </p>
              </div>

              {/* Contraindications */}
              <div className="bg-[#0F1D2C] border border-gray-700/50 rounded-xl p-4">
                <SectionHeader title="Contraindication Check" sectionKey="contraindications" icon={AlertTriangle}
                  badge={result.contraindications.hardContraindications.length > 0 ? 'FLAGS' : 'CLEAR'} />
                {expandedSections.contraindications && (
                  <div className="space-y-2 mt-2">
                    {result.contraindications.hardContraindications.length > 0 && (
                      <div className="p-2 bg-red-500/10 rounded-lg">
                        <p className="text-xs font-medium text-red-400 mb-1">Hard Contraindications (STOP)</p>
                        {result.contraindications.hardContraindications.map((c, i) => (
                          <p key={i} className="text-xs text-red-300">- {c.replace(/_/g, ' ')}</p>
                        ))}
                      </div>
                    )}
                    {result.contraindications.softContraindications.length > 0 && (
                      <div className="p-2 bg-amber-500/10 rounded-lg">
                        <p className="text-xs font-medium text-amber-400 mb-1">Soft Contraindications (Review)</p>
                        {result.contraindications.softContraindications.map((c, i) => (
                          <p key={i} className="text-xs text-amber-300">- {c.replace(/_/g, ' ')}</p>
                        ))}
                      </div>
                    )}
                    {result.contraindications.warnings.length > 0 && (
                      <div className="p-2 bg-blue-500/10 rounded-lg">
                        <p className="text-xs font-medium text-blue-400 mb-1">Warnings</p>
                        {result.contraindications.warnings.map((w, i) => (
                          <p key={i} className="text-xs text-blue-300">- {w}</p>
                        ))}
                      </div>
                    )}
                    {result.contraindications.cleared && result.contraindications.warnings.length === 0 && (
                      <p className="text-xs text-green-400">All clear - no contraindications detected.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Required Labs */}
              <div className="bg-[#0F1D2C] border border-gray-700/50 rounded-xl p-4">
                <SectionHeader title="Required Labs" sectionKey="labs" icon={Beaker} badge={`${result.labs.length}`} />
                {expandedSections.labs && (
                  <div className="mt-2 space-y-1">
                    {result.labs.map((lab, i) => (
                      <div key={i} className="flex items-center justify-between py-1 border-b border-gray-800 last:border-0">
                        <span className="text-xs text-white">{lab.name}</span>
                        <span className="text-[10px] text-gray-500">{lab.reason}</span>
                      </div>
                    ))}
                    <button
                      onClick={() => copyToClipboard(result.labs.map((l) => l.name).join(', '), 'labs')}
                      className="flex items-center gap-1 mt-2 text-xs text-[#C9A96E] hover:text-[#B8954E]"
                    >
                      {copiedField === 'labs' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedField === 'labs' ? 'Copied!' : 'Copy lab list'}
                    </button>
                  </div>
                )}
              </div>

              {/* Qualiphy Block */}
              <div className="bg-[#0F1D2C] border border-gray-700/50 rounded-xl p-4">
                <SectionHeader title="Qualiphy Quick-Entry" sectionKey="qualiphy" icon={FileText} />
                {expandedSections.qualiphy && (
                  <div className="mt-2">
                    <pre className="text-xs text-gray-300 bg-gray-900/50 rounded-lg p-3 overflow-x-auto">
                      {JSON.stringify(result.qualiphyBlock, null, 2)}
                    </pre>
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(result.qualiphyBlock, null, 2), 'qualiphy')}
                      className="flex items-center gap-1 mt-2 text-xs text-[#C9A96E] hover:text-[#B8954E]"
                    >
                      {copiedField === 'qualiphy' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedField === 'qualiphy' ? 'Copied!' : 'Copy block'}
                    </button>
                  </div>
                )}
              </div>

              {/* Welcome Messages */}
              <div className="bg-[#0F1D2C] border border-gray-700/50 rounded-xl p-4">
                <SectionHeader title="Welcome Messages" sectionKey="messages" icon={MessageCircle} />
                {expandedSections.messages && (
                  <div className="mt-2 space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-400">SMS</span>
                        <button
                          onClick={() => copyToClipboard(result.messages.sms, 'sms')}
                          className="text-xs text-[#C9A96E]"
                        >
                          {copiedField === 'sms' ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <div className="p-2 bg-green-500/5 border border-green-500/20 rounded-lg">
                        <p className="text-xs text-gray-300">{result.messages.sms}</p>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-400">Email</span>
                        <button
                          onClick={() => copyToClipboard(result.messages.email, 'email')}
                          className="text-xs text-[#C9A96E]"
                        >
                          {copiedField === 'email' ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <div className="p-2 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                        <p className="text-xs text-gray-300 whitespace-pre-wrap">{result.messages.email}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Mangomint Tags */}
              <div className="bg-[#0F1D2C] border border-gray-700/50 rounded-xl p-4">
                <SectionHeader title="Mangomint Tags" sectionKey="tags" icon={Tag} badge={`${result.mangomintTags.length}`} />
                {expandedSections.tags && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {result.mangomintTags.map((tag, i) => (
                      <span key={i} className="px-2 py-1 bg-[#C9A96E]/10 border border-[#C9A96E]/30 rounded text-xs text-[#C9A96E]">
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Revenue Estimate */}
              <div className="bg-[#0F1D2C] border border-gray-700/50 rounded-xl p-4">
                <SectionHeader title="Revenue Estimate" sectionKey="revenue" icon={DollarSign} />
                {expandedSections.revenue && (
                  <div className="mt-2 grid grid-cols-3 gap-3">
                    <div className="text-center p-2 bg-gray-800/50 rounded-lg">
                      <p className="text-lg font-bold text-[#C9A96E]">${result.revenue.monthlyEstimate}</p>
                      <p className="text-[10px] text-gray-500">Monthly</p>
                    </div>
                    <div className="text-center p-2 bg-gray-800/50 rounded-lg">
                      <p className="text-lg font-bold text-white">${result.revenue.sixMonthEstimate.toLocaleString()}</p>
                      <p className="text-[10px] text-gray-500">6-Month</p>
                    </div>
                    <div className="text-center p-2 bg-gray-800/50 rounded-lg">
                      <p className="text-lg font-bold text-white">${result.revenue.twelveMonthEstimate.toLocaleString()}</p>
                      <p className="text-[10px] text-gray-500">12-Month</p>
                    </div>
                    <div className="col-span-3 text-xs text-gray-500">
                      Tier: {result.revenue.tier} | Cross-sell potential: +${result.revenue.crossSellPotential}/yr
                    </div>
                  </div>
                )}
              </div>

              {/* Cross-sell Opportunities */}
              {result.crossSellOpportunities.length > 0 && (
                <div className="bg-[#0F1D2C] border border-gray-700/50 rounded-xl p-4">
                  <SectionHeader title="Cross-sell Opportunities" sectionKey="crosssell" icon={ShoppingBag} badge={`${result.crossSellOpportunities.length}`} />
                  {expandedSections.crosssell && (
                    <div className="mt-2 space-y-2">
                      {result.crossSellOpportunities.map((op, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
                          <div>
                            <p className="text-xs text-white">{op.serviceName}</p>
                            <p className="text-[10px] text-gray-500">{op.reason}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-medium text-[#C9A96E]">${op.price}</p>
                            <p className={`text-[10px] ${
                              op.confidence === 'high' ? 'text-green-400' : op.confidence === 'medium' ? 'text-amber-400' : 'text-gray-500'
                            }`}>
                              {op.confidence}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Next Steps */}
              <div className="bg-[#0F1D2C] border border-[#C9A96E]/30 rounded-xl p-4">
                <h4 className="text-sm font-medium text-[#C9A96E] mb-2">Next Steps</h4>
                <ol className="space-y-1">
                  {result.nextSteps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#C9A96E]/20 flex items-center justify-center text-[10px] font-bold text-[#C9A96E] flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-xs text-gray-300">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
