const MEDICAL_SPECIALTY_ALIASES: Record<string, string> = {
  CosmeticSurgery: 'PlasticSurgery',
  'Medical-aesthetics': 'Dermatology',
  'medical-aesthetics': 'Dermatology',
  'Medical Aesthetics': 'Dermatology',
  MedicalAesthetics: 'Dermatology',
  Neurology: 'Neurologic',
};

const MEDICAL_SPECIALTY_ENUM = new Set<string>([
  'Anesthesia',
  'Dermatology',
  'DermatologicSurgery',
  'Neurologic',
  'PlasticSurgery',
]);

const MEDICAL_SPECIALTY_URL_PREFIX = 'https://schema.org/';

function normalizeMedicalSpecialtyString(value: string): string | undefined {
  const normalizedInput = value.trim();
  const aliasTarget = MEDICAL_SPECIALTY_ALIASES[normalizedInput] ?? normalizedInput;
  const candidate = aliasTarget.replace(MEDICAL_SPECIALTY_URL_PREFIX, '');

  return MEDICAL_SPECIALTY_ENUM.has(candidate) ? candidate : undefined;
}

function collectMedicalSpecialtyValues(value: unknown, sink: Set<string>) {
  if (Array.isArray(value)) {
    value.forEach((entry) => collectMedicalSpecialtyNode(entry, sink));
  } else if (isRecord(value)) {
    Object.entries(value).forEach(([key, child]) => {
      if (key === 'medicalSpecialty') {
        collectMedicalSpecialtyNode(child, sink);
      } else {
        collectMedicalSpecialtyValues(child, sink);
      }
    });
  }
}

function collectMedicalSpecialtyNode(value: unknown, sink: Set<string>) {
  if (typeof value === 'string') {
    sink.add(value);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry) => collectMedicalSpecialtyNode(entry, sink));
    return;
  }

  if (isRecord(value) && value['@type'] === 'MedicalSpecialty' && typeof value.name === 'string') {
    sink.add(value.name);
  }
}

export function getInvalidMedicalSpecialties(value: unknown): string[] {
  const seen = new Set<string>();
  collectMedicalSpecialtyValues(value, seen);

  return Array.from(seen).filter(
    (item) => normalizeMedicalSpecialtyString(item) === undefined,
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeMedicalSpecialty(value: unknown): unknown {
  if (typeof value === 'string') {
    return normalizeMedicalSpecialtyString(value);
  }

  if (Array.isArray(value)) {
    const seen = new Set<string>();
    const normalized: unknown[] = [];

    for (const item of value) {
      const next = normalizeMedicalSpecialty(item);
      if (next === undefined) continue;

      if (typeof next === 'string') {
        if (seen.has(next)) continue;
        seen.add(next);
      }

      normalized.push(next);
    }

    if (normalized.length === 0) {
      return undefined;
    }

    return normalized;
  }

  if (isRecord(value)) {
    if (value['@type'] === 'MedicalSpecialty' && typeof value.name === 'string') {
      return normalizeMedicalSpecialty(value.name);
    }

    return sanitizeJsonLd(value);
  }

  return value;
}

export function sanitizeJsonLd(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitizeJsonLd).filter((item) => item !== undefined);
  }

  if (!isRecord(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).flatMap(([key, child]) => {
      const sanitized =
        key === 'medicalSpecialty' ? normalizeMedicalSpecialty(child) : sanitizeJsonLd(child);

      return sanitized === undefined ? [] : [[key, sanitized]];
    }),
  );
}

export function stringifyJsonLd(data: unknown): string {
  return (JSON.stringify(sanitizeJsonLd(data)) ?? '{}').replace(/</g, '\\u003c');
}
