export const AURA_PDF_TEXT_FALLBACK_PREFIX = '[[AURA_PDF_TEXT_FALLBACK]]';

export type AuraPdfTextFallbackPayload = {
  name: string;
  text: string;
};

const MAX_NAME_CHARS = 160;
const MAX_TEXT_CHARS = 7000;

function normalizePayload(payload: AuraPdfTextFallbackPayload): AuraPdfTextFallbackPayload | null {
  const name = payload.name.trim().slice(0, MAX_NAME_CHARS);
  const text = payload.text.trim().slice(0, MAX_TEXT_CHARS);
  if (!text) return null;
  return {
    name: name || 'aura-handout.pdf',
    text,
  };
}

export function serializeAuraPdfTextFallback(
  payload: AuraPdfTextFallbackPayload
): string | null {
  const normalized = normalizePayload(payload);
  if (!normalized) return null;
  return `${AURA_PDF_TEXT_FALLBACK_PREFIX}${JSON.stringify(normalized)}`;
}

export function parseAuraPdfTextFallbackMarkers(
  clinicalNotes: string | undefined
): {
  markers: AuraPdfTextFallbackPayload[];
  cleanedNotes: string | undefined;
} {
  if (!clinicalNotes || !clinicalNotes.trim()) {
    return { markers: [], cleanedNotes: undefined };
  }

  const markers: AuraPdfTextFallbackPayload[] = [];
  const cleanedLines: string[] = [];

  for (const line of clinicalNotes.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith(AURA_PDF_TEXT_FALLBACK_PREFIX)) {
      cleanedLines.push(line);
      continue;
    }

    const rawJson = trimmed.slice(AURA_PDF_TEXT_FALLBACK_PREFIX.length);
    try {
      const parsed = JSON.parse(rawJson) as Partial<AuraPdfTextFallbackPayload>;
      const normalized = normalizePayload({
        name: typeof parsed.name === 'string' ? parsed.name : '',
        text: typeof parsed.text === 'string' ? parsed.text : '',
      });
      if (normalized) markers.push(normalized);
    } catch {
      // Ignore malformed marker lines; they are removed from notes either way.
    }
  }

  const cleaned = cleanedLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  return {
    markers,
    cleanedNotes: cleaned || undefined,
  };
}
