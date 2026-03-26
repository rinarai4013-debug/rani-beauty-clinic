'use client';

import { useEffect, useState } from 'react';
import { User, Mail, Phone, MapPin, Shield, Bell, Heart } from 'lucide-react';

interface ProfileData {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  preferredContact: string;
  emergencyContact?: string;
  allergies?: string[];
  medications?: string[];
  medicalNotes?: string;
  communicationPreferences: {
    emailAppointmentReminders: boolean;
    smsAppointmentReminders: boolean;
    marketingEmails: boolean;
    marketingSms: boolean;
  };
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/patient/profile');
        const data = await res.json();
        setProfile(data.profile);
      } catch (e) {
        console.error('Failed to load profile:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded-lg" />
        <div className="h-64 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl text-rani-navy">Profile</h1>
        <p className="text-sm text-rani-muted mt-1">
          Your personal information and preferences.
        </p>
      </div>

      {/* Personal info */}
      <div className="rounded-2xl border border-rani-border bg-white p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-rani-navy to-rani-navy-light flex items-center justify-center">
            <span className="text-xl font-heading font-bold text-rani-gold">
              {profile.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="font-heading text-xl text-rani-navy">{profile.name}</h2>
            <p className="text-sm text-rani-muted">Rani Beauty Clinic Patient</p>
          </div>
        </div>

        <div className="space-y-4">
          <ProfileField icon={Mail} label="Email" value={profile.email} />
          {profile.phone && (
            <ProfileField icon={Phone} label="Phone" value={profile.phone} />
          )}
          {profile.address && (
            <ProfileField icon={MapPin} label="Address" value={profile.address} />
          )}
          {profile.dateOfBirth && (
            <ProfileField
              icon={User}
              label="Date of Birth"
              value={new Date(profile.dateOfBirth).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            />
          )}
        </div>

        <p className="mt-5 text-xs text-rani-muted">
          To update your personal information, please contact the front desk.
        </p>
      </div>

      {/* Communication preferences */}
      <div className="rounded-2xl border border-rani-border bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-rani-gold" />
          <h2 className="font-heading text-base text-rani-navy">
            Communication Preferences
          </h2>
        </div>
        <div className="space-y-3">
          <PrefRow
            label="Email appointment reminders"
            enabled={profile.communicationPreferences.emailAppointmentReminders}
          />
          <PrefRow
            label="SMS appointment reminders"
            enabled={profile.communicationPreferences.smsAppointmentReminders}
          />
          <PrefRow
            label="Marketing emails (specials & updates)"
            enabled={profile.communicationPreferences.marketingEmails}
          />
          <PrefRow
            label="Marketing SMS"
            enabled={profile.communicationPreferences.marketingSms}
          />
        </div>
        <p className="mt-4 text-xs text-rani-muted">
          To change preferences, please contact us or speak with your provider.
        </p>
      </div>

      {/* Medical summary */}
      <div className="rounded-2xl border border-rani-border bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-rani-gold" />
          <h2 className="font-heading text-base text-rani-navy">
            Medical Summary
          </h2>
        </div>

        {profile.allergies && profile.allergies.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-rani-muted uppercase tracking-wider mb-2">
              Allergies
            </p>
            <div className="flex flex-wrap gap-2">
              {profile.allergies.map((a, i) => (
                <span
                  key={i}
                  className="rounded-full bg-red-50 border border-red-200 px-3 py-1 text-xs text-red-700"
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {profile.medications && profile.medications.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-rani-muted uppercase tracking-wider mb-2">
              Current Medications
            </p>
            <div className="flex flex-wrap gap-2">
              {profile.medications.map((m, i) => (
                <span
                  key={i}
                  className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs text-blue-700"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}

        {profile.medicalNotes && (
          <div>
            <p className="text-xs font-medium text-rani-muted uppercase tracking-wider mb-2">
              Notes
            </p>
            <p className="text-sm text-rani-text leading-relaxed">
              {profile.medicalNotes}
            </p>
          </div>
        )}

        {!profile.allergies?.length && !profile.medications?.length && !profile.medicalNotes && (
          <p className="text-sm text-rani-muted">No medical information on file.</p>
        )}

        <p className="mt-4 text-xs text-rani-muted">
          <Heart className="inline h-3 w-3 text-red-400 mr-1" />
          This information is read-only and secured per HIPAA guidelines.
        </p>
      </div>
    </div>
  );
}

function ProfileField({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4.5 w-4.5 text-rani-gold mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs text-rani-muted">{label}</p>
        <p className="text-sm text-rani-text">{value}</p>
      </div>
    </div>
  );
}

function PrefRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-rani-text">{label}</span>
      <span
        className={`text-xs font-medium ${
          enabled ? 'text-emerald-600' : 'text-rani-muted'
        }`}
      >
        {enabled ? 'On' : 'Off'}
      </span>
    </div>
  );
}
