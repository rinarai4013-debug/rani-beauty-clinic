'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

type IncidentRecord = {
  id: string;
  fields: Record<string, unknown>;
};

type IncidentResponse = {
  incidents: IncidentRecord[];
  availableServices: string[];
  clientOptions: string[];
};

interface IncidentsClientProps {
  canEditMedicalDirectorFields: boolean;
}

const providerOptions = ['Rina', 'Mom', 'Team Member'] as const;

const fallbackServiceOptions = [
  'Signature HydraFacial',
  'Sofwave',
  'Laser Hair Removal',
  'Vitamin Injection',
  'VI Peel',
  'RF Microneedling',
  'GLP-1 Program',
] as const;

const incidentTypeOptions = [
  'side effect',
  'allergic reaction',
  'equipment malfunction',
  'protocol deviation',
  'other',
] as const;

const severityOptions = ['mild', 'moderate', 'severe', 'hospitalization'] as const;
const reviewStatusOptions = ['pending', 'reviewed', 'resolved'] as const;

type ProviderOption = (typeof providerOptions)[number];
type IncidentTypeOption = (typeof incidentTypeOptions)[number];
type SeverityOption = (typeof severityOptions)[number];
type ReviewStatusOption = (typeof reviewStatusOptions)[number];

type IncidentFormState = {
  clientName: string;
  servicesInvolved: string[];
  incidentDateTime: string;
  providerOnDuty: ProviderOption;
  incidentType: IncidentTypeOption;
  severity: SeverityOption;
  narrativeDescription: string;
  immediateActionTaken: string;
  followUpRequired: boolean;
  followUpNotes: string;
  photoAttachments: string;
  medicalDirectorReviewStatus: ReviewStatusOption;
  medicalDirectorNotes: string;
};

function getInitialFormState(): IncidentFormState {
  return {
    clientName: '',
    servicesInvolved: [],
    incidentDateTime: '',
    providerOnDuty: providerOptions[0],
    incidentType: incidentTypeOptions[0],
    severity: severityOptions[0],
    narrativeDescription: '',
    immediateActionTaken: '',
    followUpRequired: false,
    followUpNotes: '',
    photoAttachments: '',
    medicalDirectorReviewStatus: reviewStatusOptions[0],
    medicalDirectorNotes: '',
  };
}

function toDateInputValue(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export default function IncidentsClient({ canEditMedicalDirectorFields }: IncidentsClientProps) {
  const today = useMemo(() => new Date(), []);
  const ninetyDaysAgo = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 90);
    return date;
  }, []);

  const [startDate, setStartDate] = useState(toDateInputValue(ninetyDaysAgo));
  const [endDate, setEndDate] = useState(toDateInputValue(today));
  const [serviceTypeFilter, setServiceTypeFilter] = useState('');

  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [availableServices, setAvailableServices] = useState<string[]>([]);
  const [clientOptions, setClientOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedServiceOption, setSelectedServiceOption] = useState('');

  const [form, setForm] = useState<IncidentFormState>(getInitialFormState());

  async function loadIncidents() {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
      });
      if (serviceTypeFilter) params.set('serviceType', serviceTypeFilter);

      const res = await fetch(`/api/dashboard/incidents?${params.toString()}`);
      const data = (await res.json()) as IncidentResponse;

      if (!res.ok) {
        throw new Error((data as { error?: string }).error || 'failed to load incidents');
      }

      setIncidents(data.incidents || []);
      setAvailableServices(data.availableServices || []);
      setClientOptions(data.clientOptions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed to load incidents');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadIncidents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    try {
      if (form.servicesInvolved.length === 0) {
        throw new Error('add at least one service involved before submitting');
      }

      const photoAttachments = form.photoAttachments
        .split('\n')
        .map((value) => value.trim())
        .filter(Boolean);

      const res = await fetch('/api/dashboard/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          photoAttachments,
        }),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || 'failed to create incident');
      }

      setIsFormOpen(false);
      setForm(getInitialFormState());

      await loadIncidents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed to create incident');
    }
  }

  const serviceOptions = availableServices.length > 0 ? availableServices : [...fallbackServiceOptions];

  return (
    <main className="space-y-6">
      <section className="rounded-xl border border-rani-border bg-white p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold text-rani-navy">incident reporting</h1>
            <p className="mt-1 font-body text-sm text-rani-muted">
              internal adverse event and protocol incident tracking.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsFormOpen((prev) => !prev)}
            className="rounded-md bg-rani-navy px-4 py-2 font-body text-sm font-semibold text-white hover:bg-rani-navy-light"
          >
            {isFormOpen ? 'close form' : 'new incident report'}
          </button>
        </div>
      </section>

      {isFormOpen && (
        <section className="rounded-xl border border-rani-border bg-white p-4 sm:p-6">
          <h2 className="font-body text-lg font-bold text-rani-navy">new incident report</h2>

          <form className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={onSubmit}>
            <label className="flex flex-col gap-2">
              <span className="font-body text-xs font-semibold uppercase tracking-wide text-rani-muted">client name</span>
              <input
                list="incident-client-options"
                required
                value={form.clientName}
                onChange={(event) => setForm((prev) => ({ ...prev, clientName: event.target.value }))}
                className="rounded-md border border-rani-border px-3 py-2 text-sm"
                placeholder="start typing client name"
              />
              <datalist id="incident-client-options">
                {clientOptions.map((clientName) => (
                  <option key={clientName} value={clientName} />
                ))}
              </datalist>
            </label>

            <label className="flex flex-col gap-2">
              <span className="font-body text-xs font-semibold uppercase tracking-wide text-rani-muted">date and time</span>
              <input
                type="datetime-local"
                required
                value={form.incidentDateTime}
                onChange={(event) => setForm((prev) => ({ ...prev, incidentDateTime: event.target.value }))}
                className="rounded-md border border-rani-border px-3 py-2 text-sm"
              />
            </label>

            <div className="md:col-span-2 rounded-md border border-rani-border p-3">
              <p className="font-body text-xs font-semibold uppercase tracking-wide text-rani-muted">service(s) involved</p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                <select
                  value={selectedServiceOption}
                  onChange={(event) => setSelectedServiceOption(event.target.value)}
                  className="rounded-md border border-rani-border px-3 py-2 text-sm"
                >
                  <option value="">select service</option>
                  {serviceOptions.map((serviceName) => (
                    <option key={serviceName} value={serviceName}>
                      {serviceName}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="rounded-md border border-rani-border px-3 py-2 text-sm"
                  onClick={() => {
                    if (!selectedServiceOption) return;
                    setForm((prev) => {
                      if (prev.servicesInvolved.includes(selectedServiceOption)) return prev;
                      return { ...prev, servicesInvolved: [...prev.servicesInvolved, selectedServiceOption] };
                    });
                    setSelectedServiceOption('');
                  }}
                >
                  add service
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {form.servicesInvolved.map((serviceName) => (
                  <button
                    key={serviceName}
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        servicesInvolved: prev.servicesInvolved.filter((value) => value !== serviceName),
                      }))
                    }
                    className="rounded-full bg-rani-cream px-3 py-1 text-xs text-rani-navy"
                  >
                    {serviceName} ×
                  </button>
                ))}
              </div>
            </div>

            <label className="flex flex-col gap-2">
              <span className="font-body text-xs font-semibold uppercase tracking-wide text-rani-muted">provider on duty</span>
              <select
                value={form.providerOnDuty}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    providerOnDuty: event.target.value as ProviderOption,
                  }))
                }
                className="rounded-md border border-rani-border px-3 py-2 text-sm"
              >
                {providerOptions.map((provider) => (
                  <option key={provider} value={provider}>
                    {provider}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="font-body text-xs font-semibold uppercase tracking-wide text-rani-muted">incident type</span>
              <select
                value={form.incidentType}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    incidentType: event.target.value as IncidentTypeOption,
                  }))
                }
                className="rounded-md border border-rani-border px-3 py-2 text-sm"
              >
                {incidentTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="font-body text-xs font-semibold uppercase tracking-wide text-rani-muted">severity</span>
              <select
                value={form.severity}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    severity: event.target.value as SeverityOption,
                  }))
                }
                className="rounded-md border border-rani-border px-3 py-2 text-sm"
              >
                {severityOptions.map((severity) => (
                  <option key={severity} value={severity}>
                    {severity}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="font-body text-xs font-semibold uppercase tracking-wide text-rani-muted">follow-up required</span>
              <select
                value={form.followUpRequired ? 'yes' : 'no'}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, followUpRequired: event.target.value === 'yes' }))
                }
                className="rounded-md border border-rani-border px-3 py-2 text-sm"
              >
                <option value="no">no</option>
                <option value="yes">yes</option>
              </select>
            </label>

            <label className="md:col-span-2 flex flex-col gap-2">
              <span className="font-body text-xs font-semibold uppercase tracking-wide text-rani-muted">narrative description</span>
              <textarea
                required
                value={form.narrativeDescription}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, narrativeDescription: event.target.value }))
                }
                rows={4}
                className="rounded-md border border-rani-border px-3 py-2 text-sm"
              />
            </label>

            <label className="md:col-span-2 flex flex-col gap-2">
              <span className="font-body text-xs font-semibold uppercase tracking-wide text-rani-muted">immediate action taken</span>
              <textarea
                required
                value={form.immediateActionTaken}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, immediateActionTaken: event.target.value }))
                }
                rows={3}
                className="rounded-md border border-rani-border px-3 py-2 text-sm"
              />
            </label>

            <label className="md:col-span-2 flex flex-col gap-2">
              <span className="font-body text-xs font-semibold uppercase tracking-wide text-rani-muted">follow-up notes</span>
              <textarea
                value={form.followUpNotes}
                onChange={(event) => setForm((prev) => ({ ...prev, followUpNotes: event.target.value }))}
                rows={3}
                className="rounded-md border border-rani-border px-3 py-2 text-sm"
              />
            </label>

            <label className="md:col-span-2 flex flex-col gap-2">
              <span className="font-body text-xs font-semibold uppercase tracking-wide text-rani-muted">photo attachments (optional URLs, one per line)</span>
              <textarea
                value={form.photoAttachments}
                onChange={(event) => setForm((prev) => ({ ...prev, photoAttachments: event.target.value }))}
                rows={3}
                className="rounded-md border border-rani-border px-3 py-2 text-sm"
                placeholder="https://..."
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="font-body text-xs font-semibold uppercase tracking-wide text-rani-muted">medical director review status</span>
              <select
                value={form.medicalDirectorReviewStatus}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    medicalDirectorReviewStatus: event.target.value as ReviewStatusOption,
                  }))
                }
                disabled={!canEditMedicalDirectorFields}
                className="rounded-md border border-rani-border px-3 py-2 text-sm disabled:bg-rani-cream"
              >
                {reviewStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="font-body text-xs font-semibold uppercase tracking-wide text-rani-muted">medical director notes</span>
              <textarea
                value={form.medicalDirectorNotes}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, medicalDirectorNotes: event.target.value }))
                }
                disabled={!canEditMedicalDirectorFields}
                rows={3}
                className="rounded-md border border-rani-border px-3 py-2 text-sm disabled:bg-rani-cream"
              />
            </label>

            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                className="rounded-md bg-rani-gold px-4 py-2 font-body text-sm font-semibold text-rani-navy hover:bg-rani-gold-light"
              >
                submit incident
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="rounded-xl border border-rani-border bg-white p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4 md:items-end">
          <label className="flex flex-col gap-2">
            <span className="font-body text-xs font-semibold uppercase tracking-wide text-rani-muted">start date</span>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="rounded-md border border-rani-border px-3 py-2 text-sm"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="font-body text-xs font-semibold uppercase tracking-wide text-rani-muted">end date</span>
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="rounded-md border border-rani-border px-3 py-2 text-sm"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="font-body text-xs font-semibold uppercase tracking-wide text-rani-muted">service type</span>
            <select
              value={serviceTypeFilter}
              onChange={(event) => setServiceTypeFilter(event.target.value)}
              className="rounded-md border border-rani-border px-3 py-2 text-sm"
            >
              <option value="">all services</option>
              {serviceOptions.map((serviceName) => (
                <option key={serviceName} value={serviceName}>
                  {serviceName}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => void loadIncidents()}
            className="rounded-md border border-rani-border px-4 py-2 text-sm font-semibold text-rani-navy"
          >
            apply filters
          </button>
        </div>

        {error && <p className="mt-4 font-body text-sm text-red-600">{error}</p>}

        <div className="mt-6 space-y-3">
          {loading ? (
            <p className="font-body text-sm text-rani-muted">loading incidents...</p>
          ) : incidents.length === 0 ? (
            <p className="font-body text-sm text-rani-muted">no incidents found for this range.</p>
          ) : (
            incidents.map((incident) => {
              const fields = incident.fields;
              const services = String(fields['Services Involved'] || '-');
              const dateTime = String(fields['Incident Date/Time'] || '-');
              const type = String(fields['Incident Type'] || '-');
              const severity = String(fields['Severity'] || '-');
              const provider = String(fields['Provider on Duty'] || '-');
              const status = String(fields['Medical Director Review Status'] || 'pending');

              return (
                <article key={incident.id} className="rounded-lg border border-rani-border bg-rani-cream p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-body text-sm font-bold text-rani-navy">
                        {String(fields['Client Name'] || 'unknown client')}
                      </p>
                      <p className="mt-1 font-body text-xs text-rani-muted">{dateTime}</p>
                    </div>
                    <span className="inline-flex w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-rani-navy">
                      {status}
                    </span>
                  </div>

                  <dl className="mt-3 grid gap-2 text-xs text-rani-text sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <dt className="font-semibold text-rani-muted">services</dt>
                      <dd>{services}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-rani-muted">provider</dt>
                      <dd>{provider}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-rani-muted">incident type</dt>
                      <dd>{type}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-rani-muted">severity</dt>
                      <dd>{severity}</dd>
                    </div>
                  </dl>
                </article>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}
