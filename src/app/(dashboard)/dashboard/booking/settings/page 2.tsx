'use client';

import { useState } from 'react';
import { DEFAULT_SCHEDULING_CONFIG, DEFAULT_PROVIDERS, DEFAULT_ROOMS } from '@/lib/booking/availability';

export default function BookingSettingsPage() {
  const [config, setConfig] = useState(DEFAULT_SCHEDULING_CONFIG);
  const [providers] = useState(DEFAULT_PROVIDERS);
  const [rooms] = useState(DEFAULT_ROOMS);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F1D2C] font-[family-name:var(--font-heading)]">
          Booking Settings
        </h1>
        <p className="text-sm text-[#6B7280]">
          Configure scheduling rules, clinic hours, rooms, and provider settings
        </p>
      </div>

      {/* General Settings */}
      <SettingsSection title="General Scheduling Rules">
        <SettingRow label="Advance Booking Limit" description="Maximum days clients can book ahead">
          <select
            value={config.advanceBookingDays}
            onChange={e => setConfig(prev => ({ ...prev, advanceBookingDays: Number(e.target.value) }))}
            className="px-4 py-2 rounded-xl border border-[#E8E4DF] text-sm"
          >
            <option value={30}>30 days</option>
            <option value={60}>60 days</option>
            <option value={90}>90 days (3 months)</option>
            <option value={180}>180 days (6 months)</option>
          </select>
        </SettingRow>

        <SettingRow label="Same-Day Booking" description="Allow clients to book appointments for today">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.sameDayBookingEnabled}
              onChange={e => setConfig(prev => ({ ...prev, sameDayBookingEnabled: e.target.checked }))}
              className="rounded text-[#C9A96E] focus:ring-[#C9A96E]"
            />
            <span className="text-sm">Enabled</span>
          </label>
        </SettingRow>

        <SettingRow label="Same-Day Cutoff" description="Latest time for same-day bookings">
          <input
            type="time"
            value={config.sameDayBookingCutoff}
            onChange={e => setConfig(prev => ({ ...prev, sameDayBookingCutoff: e.target.value }))}
            className="px-4 py-2 rounded-xl border border-[#E8E4DF] text-sm"
          />
        </SettingRow>

        <SettingRow label="Emergency Slots Per Day" description="Reserved for urgent appointments">
          <input
            type="number"
            value={config.emergencySlotsPerDay}
            min={0}
            max={5}
            onChange={e => setConfig(prev => ({ ...prev, emergencySlotsPerDay: Number(e.target.value) }))}
            className="w-20 px-4 py-2 rounded-xl border border-[#E8E4DF] text-sm"
          />
        </SettingRow>

        <SettingRow label="Default Prep Time" description="Minutes before each appointment">
          <input
            type="number"
            value={config.defaultPrepTime}
            min={0}
            max={30}
            onChange={e => setConfig(prev => ({ ...prev, defaultPrepTime: Number(e.target.value) }))}
            className="w-20 px-4 py-2 rounded-xl border border-[#E8E4DF] text-sm"
          />
          <span className="text-sm text-[#6B7280] ml-2">minutes</span>
        </SettingRow>

        <SettingRow label="Default Cleanup Time" description="Minutes after each appointment">
          <input
            type="number"
            value={config.defaultCleanupTime}
            min={0}
            max={30}
            onChange={e => setConfig(prev => ({ ...prev, defaultCleanupTime: Number(e.target.value) }))}
            className="w-20 px-4 py-2 rounded-xl border border-[#E8E4DF] text-sm"
          />
          <span className="text-sm text-[#6B7280] ml-2">minutes</span>
        </SettingRow>
      </SettingsSection>

      {/* Treatment Rooms */}
      <SettingsSection title="Treatment Rooms">
        {rooms.map(room => (
          <div key={room.id} className="flex items-center justify-between py-3 border-b border-[#F8F6F1] last:border-0">
            <div>
              <p className="font-medium text-[#0F1D2C]">{room.name}</p>
              <p className="text-xs text-[#6B7280]">Equipment: {room.equipment.join(', ')}</p>
              <p className="text-xs text-[#6B7280]">{room.compatibleServices.length} compatible services</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              room.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {room.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        ))}
      </SettingsSection>

      {/* Providers */}
      <SettingsSection title="Provider Schedules">
        {providers.map(provider => (
          <div key={provider.providerId} className="py-4 border-b border-[#F8F6F1] last:border-0">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-medium text-[#0F1D2C]">{provider.providerName}</p>
                <p className="text-xs text-[#6B7280] capitalize">{provider.role.replace('-', ' ')}</p>
              </div>
              <p className="text-sm text-[#6B7280]">Max {provider.maxDailyAppointments} apt/day</p>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const).map(day => {
                const schedule = provider.workingHours[day];
                return (
                  <div key={day} className={`text-center p-2 rounded-lg text-xs ${
                    schedule?.isAvailable ? 'bg-[#C9A96E]/10' : 'bg-gray-50'
                  }`}>
                    <p className="font-medium text-[#0F1D2C] capitalize">{day.slice(0, 3)}</p>
                    {schedule?.isAvailable ? (
                      <p className="text-[#6B7280]">{schedule.start}-{schedule.end}</p>
                    ) : (
                      <p className="text-gray-400">Off</p>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-[#6B7280] mt-2">
              Lunch: {provider.lunchBreak.start} - {provider.lunchBreak.end}
              &middot; {provider.qualifiedServices.length} services
            </p>
          </div>
        ))}
      </SettingsSection>

      {/* Clinic Hours */}
      <SettingsSection title="Clinic Hours">
        <div className="grid grid-cols-7 gap-3">
          {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const).map(day => {
            const schedule = config.clinicHours[day];
            return (
              <div key={day} className={`p-3 rounded-xl border text-center ${
                schedule?.isAvailable ? 'border-[#C9A96E] bg-[#C9A96E]/5' : 'border-[#E8E4DF]'
              }`}>
                <p className="font-medium text-sm text-[#0F1D2C] capitalize mb-2">{day}</p>
                {schedule?.isAvailable ? (
                  <div className="space-y-1">
                    <input
                      type="time"
                      value={schedule.start}
                      className="w-full text-xs px-2 py-1 rounded border border-[#E8E4DF]"
                      readOnly
                    />
                    <input
                      type="time"
                      value={schedule.end}
                      className="w-full text-xs px-2 py-1 rounded border border-[#E8E4DF]"
                      readOnly
                    />
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">Closed</p>
                )}
              </div>
            );
          })}
        </div>
      </SettingsSection>

      {/* Save button */}
      <div className="flex justify-end">
        <button className="px-8 py-3 rounded-xl bg-[#C9A96E] text-white font-bold hover:bg-[#b89558] transition-colors">
          Save Settings
        </button>
      </div>
    </div>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E8E4DF] p-6">
      <h2 className="text-lg font-semibold text-[#0F1D2C] font-[family-name:var(--font-heading)] mb-6">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function SettingRow({ label, description, children }: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#F8F6F1] last:border-0">
      <div>
        <p className="font-medium text-sm text-[#0F1D2C]">{label}</p>
        <p className="text-xs text-[#6B7280]">{description}</p>
      </div>
      <div className="flex items-center">{children}</div>
    </div>
  );
}
