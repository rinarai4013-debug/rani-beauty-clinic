'use client';

import { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  CalendarDays,
  Sparkles,
  Heart,
  Pencil,
  Save,
  Loader2,
  Check,
} from 'lucide-react';

interface PatientProfile {
  name: string;
  email: string;
  phone: string;
  status: string;
  memberSince: string;
  skinConcerns: string[];
  treatmentInterests: string[];
  preferredContact: string;
}

const CONTACT_OPTIONS = ['email', 'phone', 'sms'] as const;

export default function ProfilePage() {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editPhone, setEditPhone] = useState('');
  const [editContact, setEditContact] = useState('');

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/patient/profile');
        if (!res.ok) throw new Error('Failed to load profile');
        const data = await res.json();
        setProfile(data.profile);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  function startEditing() {
    if (!profile) return;
    setEditPhone(profile.phone);
    setEditContact(profile.preferredContact);
    setEditing(true);
    setSaved(false);
  }

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    try {
      const res = await fetch('/api/patient/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: editPhone, preferredContact: editContact }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setProfile({ ...profile, phone: editPhone, preferredContact: editContact });
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError('Could not save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-rani-gold-accessible" />
        <p className="text-sm text-rani-navy/60">Loading your profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-rani-navy">My Profile</h1>
        <p className="text-sm text-rani-navy/60 mt-1">
          Your personal information and preferences
        </p>
      </div>

      {/* Profile Card */}
      <div className="rounded-xl border border-rani-navy/10 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rani-gold/10 text-rani-gold-accessible">
              <User className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-rani-navy">{profile.name}</h2>
              <span className="inline-block mt-1 rounded-full bg-rani-gold/10 px-2.5 py-0.5 text-xs font-medium text-rani-gold-accessible capitalize">
                {profile.status}
              </span>
            </div>
          </div>
          {!editing && (
            <button
              onClick={startEditing}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rani-navy/15 px-3 py-1.5 text-sm text-rani-navy/70 transition-colors hover:bg-rani-navy/5"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
          )}
        </div>

        <div className="mt-6 grid gap-4">
          {/* Email */}
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-rani-navy/40" />
            <div>
              <p className="text-xs text-rani-navy/50">Email</p>
              <p className="text-sm text-rani-navy">{profile.email}</p>
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-rani-navy/40" />
            <div className="flex-1">
              <p className="text-xs text-rani-navy/50">Phone</p>
              {editing ? (
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="mt-0.5 w-full max-w-xs rounded-md border border-rani-navy/20 px-3 py-1.5 text-sm text-rani-navy focus:border-rani-gold focus:outline-none focus:ring-1 focus:ring-rani-gold"
                />
              ) : (
                <p className="text-sm text-rani-navy">{profile.phone}</p>
              )}
            </div>
          </div>

          {/* Member Since */}
          <div className="flex items-center gap-3">
            <CalendarDays className="h-4 w-4 text-rani-navy/40" />
            <div>
              <p className="text-xs text-rani-navy/50">Member Since</p>
              <p className="text-sm text-rani-navy">{profile.memberSince}</p>
            </div>
          </div>

          {/* Preferred Contact */}
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-rani-navy/40" />
            <div className="flex-1">
              <p className="text-xs text-rani-navy/50">Preferred Contact</p>
              {editing ? (
                <div className="mt-1 flex gap-2">
                  {CONTACT_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setEditContact(opt)}
                      className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                        editContact === opt
                          ? 'bg-rani-gold text-white'
                          : 'bg-rani-navy/5 text-rani-navy/60 hover:bg-rani-navy/10'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-rani-navy capitalize">{profile.preferredContact}</p>
              )}
            </div>
          </div>
        </div>

        {/* Save / Cancel */}
        {editing && (
          <div className="mt-6 flex items-center gap-3 border-t border-rani-navy/10 pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-rani-gold px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-rani-gold/90 disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-lg px-4 py-2 text-sm text-rani-navy/60 transition-colors hover:bg-rani-navy/5"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Saved Confirmation */}
        {saved && (
          <div className="mt-4 flex items-center gap-2 text-sm text-emerald-600">
            <Check className="h-4 w-4" />
            Changes saved successfully
          </div>
        )}
      </div>

      {/* Skin Concerns */}
      <div className="rounded-xl border border-rani-navy/10 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-rani-gold-accessible" />
          <h3 className="text-base font-medium text-rani-navy">Skin Concerns</h3>
        </div>
        {profile.skinConcerns.length === 0 ? (
          <p className="text-sm text-rani-navy/40">No skin concerns recorded</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {profile.skinConcerns.map((concern) => (
              <span
                key={concern}
                className="rounded-full bg-rani-gold/10 px-3 py-1 text-xs font-medium text-rani-gold-accessible"
              >
                {concern}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Treatment Interests */}
      <div className="rounded-xl border border-rani-navy/10 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="h-5 w-5 text-rani-gold-accessible" />
          <h3 className="text-base font-medium text-rani-navy">Treatment Interests</h3>
        </div>
        {profile.treatmentInterests.length === 0 ? (
          <p className="text-sm text-rani-navy/40">No treatment interests recorded</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {profile.treatmentInterests.map((interest) => (
              <span
                key={interest}
                className="rounded-full bg-rani-navy/5 px-3 py-1 text-xs font-medium text-rani-navy/70"
              >
                {interest}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
