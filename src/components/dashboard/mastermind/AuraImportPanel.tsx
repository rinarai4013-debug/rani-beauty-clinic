'use client';

/**
 * AuraImportPanel — Hexagon Aura 3D Scanner Import UI
 *
 * Allows importing Aura device scans into a Mastermind session.
 * Shows available scans, auto-suggests matches, and displays
 * imported scan images in a diagnostic grid.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { MastermindSession } from '@/types/mastermind';
import { convertPdfFirstPageToJpeg, extractPdfTextSummary } from '@/lib/client/pdf-image';
import { serializeAuraPdfTextFallback } from '@/lib/mastermind/aura-pdf-fallback';

// ── TYPES ──

interface AvailableScan {
  name: string;
  date: string;
  imageCount: number;
}

interface ImportedScanImages {
  front?: string;
  brownAreas?: string;
  redAreas?: string;
  wrinkles?: string;
  pores?: string;
  smoothness?: string;
  overview?: string;
  distancesFront?: string;
  distancesRight?: string;
  anglesLeft?: string;
  anglesRight?: string;
}

interface ImportResult {
  scan: {
    patientName: string;
    scanDate: string;
    imageKeys: string[];
    expressionKeys: string[];
    handoutPdfPath: string | null;
  };
  scanResult: any;
  session: {
    id: string;
    phase: string;
    updatedAt: string;
  };
}

async function parseJsonResponse(
  response: Response,
): Promise<{ json: Record<string, unknown> | null; text: string }> {
  const text = await response.text().catch(() => '');
  if (!text) return { json: null, text: '' };
  try {
    const parsed = JSON.parse(text) as unknown;
    if (parsed && typeof parsed === 'object') {
      return { json: parsed as Record<string, unknown>, text };
    }
  } catch {
    // non-JSON response
  }
  return { json: null, text };
}

const AUTH_SESSION_ERROR_PATTERN =
  /\b(?:unauthorized|not authenticated|session expired|dashboard session expired|please sign in again|sign in again)\b/i;
const ACCESS_DENIED_ERROR_PATTERN =
  /\b(?:forbidden|access denied|insufficient permissions?|permission denied)\b/i;
const DOWNSTREAM_RETRY_DELAYS_MS = [250, 500, 900, 1400, 2200] as const;
// Vercel rejects oversized multipart requests before route code executes.
const MAX_DIRECT_PDF_UPLOAD_BYTES = 4 * 1024 * 1024;

function isAuthSessionError(message: string | null | undefined): boolean {
  if (!message) return false;
  return AUTH_SESSION_ERROR_PATTERN.test(message);
}

function isAccessDeniedError(message: string | null | undefined): boolean {
  if (!message) return false;
  return ACCESS_DENIED_ERROR_PATTERN.test(message);
}

function getApiErrorMessage(
  response: Response,
  parsed: { json: Record<string, unknown> | null; text: string },
  fallback: string,
): string {
  const payloadError = parsed.json && typeof parsed.json.error === 'string'
    ? parsed.json.error.trim()
    : '';
  const payloadMessage = parsed.json && typeof parsed.json.message === 'string'
    ? parsed.json.message.trim()
    : '';

  if (payloadError) return payloadError;
  if (payloadMessage) return payloadMessage;
  if (response.status === 401) return 'Your dashboard session expired. Please sign in again.';
  if (response.status === 403) return 'You do not have permission for this action.';
  if (response.status === 413) return 'Upload is too large. Please retry with a smaller PDF.';
  if (response.status >= 500) return 'Server is temporarily unavailable. Please retry in a moment.';
  if (parsed.text) return parsed.text.slice(0, 220);
  return fallback;
}

function shouldRetryDownstream(status: number, message: string): boolean {
  if (status === 404 || status === 425 || status === 429 || status === 500 || status === 502 || status === 503 || status === 504) {
    return true;
  }
  return /session not found|not yet available|still processing|initializing|temporary|please retry/i.test(
    message,
  );
}

// ── PROPS ──

interface AuraImportPanelProps {
  session: MastermindSession;
  onImportComplete?: (result: ImportResult) => void;
}

// ── COMPONENT ──

export default function AuraImportPanel({ session, onImportComplete }: AuraImportPanelProps) {
  // State
  const [availableScans, setAvailableScans] = useState<AvailableScan[]>([]);
  const [loadingScans, setLoadingScans] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [showSelector, setShowSelector] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importedImages, setImportedImages] = useState<ImportedScanImages | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; label: string } | null>(null);
  const [fileUploading, setFileUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convert an image file to a JPEG data URL client-side
  const fileToDataUrl = useCallback(async (file: File): Promise<string> => {
    // For images: load into canvas, resize if needed, compress to JPEG.
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        const MAX = 1200;
        let w = img.width;
        let h = img.height;
        if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas context unavailable')); return; }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }, []);

  const handlePdfUpload = useCallback(
    async (file: File) => {
      const postJsonWithRetry = async (
        url: string,
        body: Record<string, unknown>,
        fallbackMessage: string,
      ): Promise<{
        response: Response;
        parsed: { json: Record<string, unknown> | null; text: string };
        message: string;
      }> => {
        let lastResponse: Response | null = null;
        let lastParsed: { json: Record<string, unknown> | null; text: string } = {
          json: null,
          text: '',
        };
        let lastMessage = fallbackMessage;

        for (let attempt = 0; attempt < DOWNSTREAM_RETRY_DELAYS_MS.length; attempt += 1) {
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify(body),
          });
          const parsed = await parseJsonResponse(response);
          const message = getApiErrorMessage(response, parsed, fallbackMessage);
          lastResponse = response;
          lastParsed = parsed;
          lastMessage = message;

          if (response.ok || response.status === 401 || response.status === 403) {
            return { response, parsed, message };
          }

          if (!shouldRetryDownstream(response.status, message) || attempt === DOWNSTREAM_RETRY_DELAYS_MS.length - 1) {
            return { response, parsed, message };
          }

          await new Promise((resolve) => window.setTimeout(resolve, DOWNSTREAM_RETRY_DELAYS_MS[attempt]));
        }

        return {
          response: lastResponse || new Response('', { status: 500 }),
          parsed: lastParsed,
          message: lastMessage,
        };
      };

      const runClientSidePdfFallback = async (): Promise<{
        scanResult: unknown;
        warning: string | null;
      }> => {
        const intakeData =
          (session.intakeData && typeof session.intakeData === 'object'
            ? (session.intakeData as Record<string, unknown>)
            : {}) as Record<string, unknown>;
        const existingClinicalNotes =
          typeof intakeData.clinicalNotes === 'string' ? intakeData.clinicalNotes.trim() : '';

        let pdfTextSummary = '';
        let extractionWarning: string | null = null;
        try {
          pdfTextSummary = await extractPdfTextSummary(file, { maxPages: 4, maxChars: 6500 });
        } catch {
          extractionWarning = 'Aura PDF text extraction was limited. Using intake-based scan fallback.';
        }

        const markerLine = pdfTextSummary
          ? serializeAuraPdfTextFallback({ name: file.name || 'aura-handout.pdf', text: pdfTextSummary })
          : null;
        const fallbackNotes = [
          existingClinicalNotes,
          `Aura PDF fallback captured client-side (${file.name}, ${(file.size / (1024 * 1024)).toFixed(1)} MB).`,
          markerLine || '',
          extractionWarning || '',
        ]
          .filter(Boolean)
          .join('\n\n');

        const intakePatchResult = await postJsonWithRetry(
          `/api/mastermind/sessions/${session.id}`,
          {
            action: {
              type: 'SET_INTAKE',
              data: {
                ...intakeData,
                clinicalNotes: fallbackNotes,
              },
            },
          },
          'Failed to save Aura fallback notes to session.',
        );
        if (!intakePatchResult.response.ok) {
          throw new Error(intakePatchResult.message);
        }

        let sourcePhotoUrl: string | null = null;
        try {
          const jpegPreview = await convertPdfFirstPageToJpeg(file, {
            maxDimension: 1200,
            quality: 0.76,
            maxBytes: 420 * 1024,
          });
          sourcePhotoUrl = await fileToDataUrl(jpegPreview);
        } catch {
          sourcePhotoUrl = null;
        }

        if (sourcePhotoUrl) {
          const photoPatchResult = await postJsonWithRetry(
            `/api/mastermind/sessions/${session.id}`,
            {
              action: { type: 'SET_SOURCE_PHOTO', url: sourcePhotoUrl },
            },
            'Failed to save Aura preview image to session.',
          );
          if (!photoPatchResult.response.ok) {
            throw new Error(photoPatchResult.message);
          }
        }

        const scanPayload: Record<string, unknown> = { sessionId: session.id };
        if (sourcePhotoUrl) scanPayload.sourcePhotoUrl = sourcePhotoUrl;
        const scanResult = await postJsonWithRetry(
          '/api/mastermind/scan',
          scanPayload,
          'Scan generation failed after Aura PDF fallback.',
        );
        if (!scanResult.response.ok) {
          throw new Error(scanResult.message);
        }

        const scanJson = (scanResult.parsed.json || {}) as {
          success?: boolean;
          data?: unknown;
          error?: string;
          message?: string;
        };
        if (scanJson.success === false) {
          throw new Error(
            (typeof scanJson.error === 'string' && scanJson.error) ||
              (typeof scanJson.message === 'string' && scanJson.message) ||
              'Scan generation failed after Aura PDF fallback.',
          );
        }

        return {
          scanResult: scanJson.data ?? scanJson,
          warning: extractionWarning,
        };
      };

      let importedSessionId = session.id;
      let importedPhase = 'scan_complete';
      let importedScanResult: unknown = null;

      const requiresClientFallback = file.size > MAX_DIRECT_PDF_UPLOAD_BYTES;
      if (requiresClientFallback) {
        const fallbackResult = await runClientSidePdfFallback();
        importedScanResult = fallbackResult.scanResult;
      } else {
        const body = new FormData();
        body.set('sessionId', session.id);
        body.set('aura', file);

        const pdfRes = await fetch('/api/mastermind/aura-import/pdf', {
          method: 'POST',
          body,
        });
        const parsedPdf = await parseJsonResponse(pdfRes);
        let directFallbackUsed = false;
        if (!pdfRes.ok) {
          const failureMessage =
            (parsedPdf.json && typeof parsedPdf.json.error === 'string' && parsedPdf.json.error) ||
            parsedPdf.text ||
            'Failed to process Aura PDF.';
          if (
            pdfRes.status === 413 ||
            /request entity too large|function_payload_too_large/i.test(failureMessage)
          ) {
            const fallbackResult = await runClientSidePdfFallback();
            importedScanResult = fallbackResult.scanResult;
            directFallbackUsed = true;
          } else {
            const message =
              (parsedPdf.json && typeof parsedPdf.json.error === 'string' && parsedPdf.json.error) ||
              parsedPdf.text ||
              'Failed to process Aura PDF.';
            throw new Error(message);
          }
        }
        if (!directFallbackUsed) {
          const payload = (parsedPdf.json || {}) as {
            success?: boolean;
            data?: {
              sessionId?: string;
              phase?: string;
              scanResult?: unknown;
              warning?: string | null;
            };
            error?: string;
          };
          if (!payload.success) {
            throw new Error(payload.error || 'Failed to process Aura PDF.');
          }
          importedSessionId = payload.data?.sessionId || session.id;
          importedPhase = payload.data?.phase || 'scan_complete';
          importedScanResult = payload.data?.scanResult ?? null;
        }
      }

      onImportComplete?.({
        scan: {
          patientName: session.patientName || 'Patient',
          scanDate: new Date().toISOString(),
          imageKeys: [],
          expressionKeys: [],
          handoutPdfPath: file.name,
        },
        scanResult: importedScanResult,
        session: {
          id: importedSessionId,
          phase: importedPhase,
          updatedAt: new Date().toISOString(),
        },
      });

      // After PDF scan import, generate the treatment plan and simulation explicitly.
      // This prevents "imported but no simulation" gaps.
      const planResult = await postJsonWithRetry(
        '/api/mastermind/plan',
        { sessionId: importedSessionId },
        'Plan generation failed after Aura import.',
      );
      if (!planResult.response.ok) {
        throw new Error(planResult.message);
      }

      const simulateResult = await postJsonWithRetry(
        '/api/mastermind/simulate',
        { sessionId: importedSessionId },
        'Simulation generation failed after Aura import.',
      );
      if (!simulateResult.response.ok) {
        throw new Error(simulateResult.message);
      }
    },
    [fileToDataUrl, onImportComplete, session.id, session.intakeData, session.patientName]
  );

  // Handle file upload — process client-side then run AI scan
  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const isPdf =
        file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf');
      const isValid = file.type.startsWith('image/') || isPdf;
      if (!isValid) return;
      setFileUploading(true);
      setImportError(null);
      try {
        if (isPdf) {
          // PDF-first path: parse + score on server so the flow does not depend on client PDF renderer support.
          await handlePdfUpload(file);
          return;
        }

        // Image path: convert to JPEG data URL client-side.
        const dataUrl = await fileToDataUrl(file);
        if (!dataUrl) throw new Error('Failed to process image file');

        // Step 2: Save photo to session
        const saveRes = await fetch(`/api/mastermind/sessions/${session.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: { type: 'SET_SOURCE_PHOTO', url: dataUrl } }),
        });
        if (!saveRes.ok) throw new Error('Failed to save photo to session');

        // Step 3: Run the AI scan with the uploaded photo
        console.log('[AuraImport] Running AI scan...');
        const scanRes = await fetch('/api/mastermind/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: session.id, sourcePhotoUrl: dataUrl }),
        });
        if (!scanRes.ok) {
          const errText = await scanRes.text().catch(() => '');
          throw new Error(`AI scan failed (${scanRes.status}): ${errText.slice(0, 200)}`);
        }
        const scanJson = await scanRes.json();
        console.log('[AuraImport] AI scan complete:', scanJson.success);

        // Step 4: Auto-trigger simulation so projections populate
        console.log('[AuraImport] Triggering simulation...');
        const simRes = await fetch('/api/mastermind/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: session.id }),
        });
        if (!simRes.ok) console.warn('[AuraImport] Simulation trigger failed:', simRes.status);

        if (scanJson.success !== false) {
          onImportComplete?.({
            scan: {
              patientName: session.patientName || 'Patient',
              scanDate: new Date().toISOString(),
              imageKeys: ['front'],
              expressionKeys: [],
              handoutPdfPath: null,
            },
            scanResult: scanJson.data || scanJson,
            session: { id: session.id, phase: 'scan_complete', updatedAt: new Date().toISOString() },
          });
        } else {
          setImportError(scanJson.error || 'AI scan failed after photo upload');
        }
      } catch (err) {
        console.error('File upload scan failed:', err);
        setImportError(err instanceof Error ? err.message : 'Failed to upload and analyze. Please try again.');
      } finally {
        setFileUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [session.id, session.patientName, onImportComplete, fileToDataUrl, handlePdfUpload]
  );

  // Determine if we already have a device scan imported
  const hasExistingScan = !!session.auraScanResult && !!session.sourcePhotoUrl;

  // Auto-suggest: find scans matching the patient name
  const suggestedScans = useMemo(() => {
    if (!session.patientName || availableScans.length === 0) return [];
    const name = session.patientName.toLowerCase();
    return availableScans.filter((s) => {
      const scanName = s.name.toLowerCase();
      return (
        scanName.includes(name) ||
        name.includes(scanName) ||
        scanName.split(' ')[0] === name.split(' ')[0]
      );
    });
  }, [session.patientName, availableScans]);

  const otherScans = useMemo(() => {
    const suggestedNames = new Set(suggestedScans.map((s) => `${s.name}_${s.date}`));
    return availableScans.filter((s) => !suggestedNames.has(`${s.name}_${s.date}`));
  }, [availableScans, suggestedScans]);

  // Fetch available scans from the device
  const fetchAvailableScans = useCallback(async () => {
    setLoadingScans(true);
    setScanError(null);
    try {
      const res = await fetch('/api/mastermind/aura-import');
      const parsed = await parseJsonResponse(res);
      const json = (parsed.json || {}) as { success?: boolean; data?: AvailableScan[]; error?: string };
      if (res.ok && json.success) {
        setAvailableScans(Array.isArray(json.data) ? json.data : []);
      } else {
        setScanError(
          json.error ||
            parsed.text ||
            (res.status === 401
              ? 'Your dashboard session expired. Please sign in again.'
              : 'Failed to list scans'),
        );
      }
    } catch {
      setScanError('Could not connect to Aura scanner');
    } finally {
      setLoadingScans(false);
    }
  }, []);

  // Import a specific scan
  const handleImport = useCallback(
    async (scan: AvailableScan) => {
      setImporting(true);
      setImportError(null);
      setShowSelector(false);

      try {
        const res = await fetch('/api/mastermind/aura-import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: session.id,
            patientName: scan.name,
            scanDate: scan.date,
          }),
        });
        const parsed = await parseJsonResponse(res);
        const json = (parsed.json || {}) as {
          success?: boolean;
          data?: ImportResult;
          error?: string;
        };

        if (res.ok && json.success && json.data) {
          setImportResult(json.data);

          // Store imported images from the session's source photo
          // The API stores images in the scan result; the front is the sourcePhotoUrl
          const imageKeys = json.data.scan.imageKeys as string[];
          const images: ImportedScanImages = {};

          // The images are stored in the session — we need to fetch the session
          // to get the actual base64 data. For the import panel display,
          // we use the sourcePhotoUrl (front) and note available keys.
          if (imageKeys.includes('front')) {
            images.front = session.sourcePhotoUrl || undefined;
          }

          setImportedImages(images);
          onImportComplete?.(json.data);
        } else {
          setImportError(
            json.error ||
              parsed.text ||
              (res.status === 401
                ? 'Your dashboard session expired. Please sign in again.'
                : 'Import failed'),
          );
        }
      } catch {
        setImportError('Import request failed — check server logs');
      } finally {
        setImporting(false);
      }
    },
    [session.id, session.sourcePhotoUrl, onImportComplete]
  );

  // Import latest scan for this patient
  const handleImportLatest = useCallback(async () => {
    setImporting(true);
    setImportError(null);

    try {
      const res = await fetch('/api/mastermind/aura-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          patientName: session.patientName,
        }),
      });
      const parsed = await parseJsonResponse(res);
      const json = (parsed.json || {}) as {
        success?: boolean;
        data?: ImportResult;
        error?: string;
      };

      if (res.ok && json.success && json.data) {
        setImportResult(json.data);
        onImportComplete?.(json.data);
      } else {
        setImportError(
          json.error ||
            parsed.text ||
            (res.status === 401
              ? 'Your dashboard session expired. Please sign in again.'
              : 'Import failed'),
        );
      }
    } catch {
      setImportError('Import request failed');
    } finally {
      setImporting(false);
    }
  }, [session.id, session.patientName, onImportComplete]);

  // Open scan selector
  const handleOpenSelector = useCallback(() => {
    setShowSelector(true);
    fetchAvailableScans();
  }, [fetchAvailableScans]);

  // Format date for display
  const formatDate = (isoDate: string) => {
    try {
      return new Date(isoDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoDate;
    }
  };

  // ── LOADING STATE ──

  if (importing || fileUploading) {
    return (
      <div className="rounded-xl border border-[#C9A96E]/30 bg-gradient-to-br from-[#0F1D2C] to-[#1A2D40] p-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          {/* Animated scanner icon */}
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-full border-2 border-[#C9A96E]/30 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-2 border-[#C9A96E]/60 flex items-center justify-center animate-pulse">
                <svg className="w-8 h-8 text-[#C9A96E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
              </div>
            </div>
            {/* Scanning line animation */}
            <div className="absolute inset-0 w-20 h-20 rounded-full overflow-hidden">
              <div className="h-0.5 bg-gradient-to-r from-transparent via-[#C9A96E] to-transparent animate-scan" />
            </div>
          </div>
          <h3 className="font-display text-lg font-semibold text-[#F8F6F1] mb-2">
            {fileUploading ? 'Processing & Analyzing Scan...' : 'Importing Aura 3D Scan Data...'}
          </h3>
          <p className="font-body text-sm text-[#F8F6F1]/60 max-w-xs">
            {fileUploading
              ? 'AI is analyzing skin concerns, mapping facial zones, and calculating your Aura Score.'
              : 'Analyzing medical-grade imaging with AI. This typically takes 15-30 seconds.'}
          </p>
          {/* Progress dots */}
          <div className="flex gap-1.5 mt-4">
            <div className="w-2 h-2 rounded-full bg-[#C9A96E] animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-[#C9A96E] animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-[#C9A96E] animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

  // ── SUCCESS STATE ──

  if (importResult) {
    const scanData = importResult.scan;
    const analysisKeys = scanData.imageKeys.filter(
      (k) => !['front', 'overview'].includes(k)
    );

    return (
      <div className="rounded-xl border border-[#C9A96E]/30 bg-gradient-to-br from-[#0F1D2C] to-[#1A2D40] p-6 space-y-5">
        {/* Header with success badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-[#F8F6F1]">
                Aura 3D Scan Imported
              </h3>
              <p className="font-body text-xs text-[#F8F6F1]/50">
                {scanData.patientName} &middot; {formatDate(scanData.scanDate)} &middot; {scanData.imageKeys.length} images
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setImportResult(null);
              setImportedImages(null);
              handleOpenSelector();
            }}
            className="font-body text-xs text-[#C9A96E] hover:text-[#C9A96E]/80 transition-colors"
          >
            Re-import
          </button>
        </div>

        {/* Aura Score badge (if available) */}
        {importResult.scanResult?.auraScore && (
          <div className="flex items-center gap-3 bg-[#F8F6F1]/5 rounded-lg p-3">
            <div className="w-14 h-14 rounded-full border-2 border-[#C9A96E] flex items-center justify-center flex-shrink-0">
              <span className="font-display text-xl font-bold text-[#C9A96E]">
                {importResult.scanResult.auraScore.overall}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-sm font-semibold text-[#F8F6F1]">
                  Aura Score: {importResult.scanResult.auraScore.grade}
                </span>
                <span className="font-body text-xs text-[#F8F6F1]/40">
                  {importResult.scanResult.auraScore.label}
                </span>
              </div>
              <p className="font-body text-xs text-[#F8F6F1]/50 mt-0.5">
                Skin Age: {importResult.scanResult.auraScore.skinAge} &middot;
                {importResult.scanResult.auraScore.skinAgeDelta > 0
                  ? ` +${importResult.scanResult.auraScore.skinAgeDelta} years`
                  : ` ${importResult.scanResult.auraScore.skinAgeDelta} years`}
              </p>
            </div>
          </div>
        )}

        {/* Image Grid — Analysis Views */}
        <div className="space-y-3">
          <h4 className="font-body text-xs font-semibold text-[#F8F6F1]/70 uppercase tracking-wide">
            Scanner Analysis Layers
          </h4>

          {/* Analysis images in a 2x3 grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { key: 'brownAreas', label: 'Hyperpigmentation', color: '#8B6914' },
              { key: 'redAreas', label: 'Redness/Vascular', color: '#DC2626' },
              { key: 'wrinkles', label: 'Wrinkles', color: '#65A30D' },
              { key: 'pores', label: 'Pores', color: '#7C3AED' },
              { key: 'smoothness', label: 'Texture Mesh', color: '#0EA5E9' },
              { key: 'overview', label: 'Overview', color: '#C9A96E' },
            ].map(({ key, label, color }) => {
              const hasImage = scanData.imageKeys.includes(key);
              return (
                <button
                  key={key}
                  disabled={!hasImage}
                  onClick={() => {
                    if (hasImage) {
                      setLightboxImage({ src: key, label });
                    }
                  }}
                  className={`relative aspect-[4/3] rounded-lg overflow-hidden border transition-all ${
                    hasImage
                      ? 'border-[#C9A96E]/30 hover:border-[#C9A96E]/60 cursor-pointer group'
                      : 'border-[#F8F6F1]/10 opacity-40 cursor-not-allowed'
                  }`}
                >
                  {/* Placeholder background */}
                  <div className="absolute inset-0 bg-[#0F1D2C] flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#F8F6F1]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                  </div>
                  {/* Label */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="font-body text-[10px] font-medium text-[#F8F6F1] truncate">
                        {label}
                      </span>
                    </div>
                  </div>
                  {/* Hover overlay */}
                  {hasImage && (
                    <div className="absolute inset-0 bg-[#C9A96E]/0 group-hover:bg-[#C9A96E]/10 transition-colors flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#F8F6F1] opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Measurements row */}
        {(scanData.imageKeys.includes('distancesFront') ||
          scanData.imageKeys.includes('anglesLeft')) && (
          <div className="space-y-2">
            <h4 className="font-body text-xs font-semibold text-[#F8F6F1]/70 uppercase tracking-wide">
              Facial Measurements
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'distancesFront', label: 'Distances (Front)' },
                { key: 'distancesRight', label: 'Distances (Right)' },
                { key: 'anglesLeft', label: 'Angles (Left)' },
                { key: 'anglesRight', label: 'Angles (Right)' },
              ]
                .filter(({ key }) => scanData.imageKeys.includes(key))
                .map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setLightboxImage({ src: key, label })}
                    className="relative aspect-[4/3] rounded-lg overflow-hidden border border-[#C9A96E]/20 hover:border-[#C9A96E]/50 transition-all cursor-pointer group bg-[#0F1D2C]"
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-6 h-6 text-[#C9A96E]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                      </svg>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                      <span className="font-body text-[10px] font-medium text-[#F8F6F1]">
                        {label}
                      </span>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Handout PDF link */}
        {scanData.handoutPdfPath && (
          <div className="flex items-center gap-2 bg-[#F8F6F1]/5 rounded-lg px-3 py-2">
            <svg className="w-4 h-4 text-[#C9A96E] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <span className="font-body text-xs text-[#F8F6F1]/70 truncate">
              Handout PDF saved
            </span>
          </div>
        )}

        {/* Lightbox Modal */}
        {lightboxImage && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightboxImage(null)}
          >
            <div className="relative max-w-4xl max-h-[90vh] w-full">
              <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-10">
                <span className="font-display text-sm font-semibold text-[#F8F6F1] bg-black/50 rounded-lg px-3 py-1">
                  {lightboxImage.label}
                </span>
                <button
                  onClick={() => setLightboxImage(null)}
                  className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-[#F8F6F1] hover:bg-black/70 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="rounded-xl overflow-hidden border-2 border-[#C9A96E]/30 bg-[#0F1D2C] flex items-center justify-center min-h-[300px]">
                <p className="font-body text-sm text-[#F8F6F1]/40">
                  {lightboxImage.label} — Full resolution view
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── DEFAULT STATE — Import Button ──

  return (
    <div className="rounded-xl border border-[#C9A96E]/20 bg-gradient-to-br from-[#0F1D2C] to-[#1A2D40] p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#C9A96E]/10 flex items-center justify-center">
          <svg className="w-5 h-5 text-[#C9A96E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
          </svg>
        </div>
        <div>
          <h3 className="font-display text-base font-semibold text-[#F8F6F1]">
            Aura 3D Scanner
          </h3>
          <p className="font-body text-xs text-[#F8F6F1]/50">
            Import medical-grade 3D imaging data
          </p>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,application/pdf,.pdf"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Import buttons */}
      <div className="space-y-2">
        {/* Upload from files */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-[#C9A96E] to-[#B8964E] text-[#0F1D2C] font-body text-sm font-semibold hover:from-[#D4B87E] hover:to-[#C9A96E] transition-all shadow-lg shadow-[#C9A96E]/20"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          Upload Scan Photo
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[#F8F6F1]/10" />
          <span className="font-body text-[10px] text-[#F8F6F1]/30 uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-[#F8F6F1]/10" />
        </div>

        {/* Import from device */}
        <button
          onClick={handleOpenSelector}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#C9A96E]/30 text-[#C9A96E] font-body text-xs font-medium hover:bg-[#C9A96E]/10 transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
          </svg>
          Import from Aura 3D Scanner
        </button>

        {session.patientName && (
          <button
            onClick={handleImportLatest}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-[#F8F6F1]/10 text-[#F8F6F1]/50 font-body text-xs hover:bg-[#F8F6F1]/5 transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            Auto-find latest scan for {session.patientName}
          </button>
        )}
      </div>

      {/* Error display */}
      {importError && (
        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <div className="space-y-2">
            <p className="font-body text-xs text-red-300">{importError}</p>
            {isAuthSessionError(importError) ? (
              <Link
                href="/dashboard/login"
                className="inline-flex items-center justify-center rounded-lg bg-[#C9A96E] px-3 py-1 text-xs font-semibold text-[#0F1D2C] hover:bg-[#d7bc84] transition-colors"
              >
                Sign in again
              </Link>
            ) : null}
          </div>
        </div>
      )}

      {/* Scan Selector Modal */}
      {showSelector && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setShowSelector(false)}>
          <div
            className="bg-[#0F1D2C] border border-[#C9A96E]/30 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between p-4 border-b border-[#F8F6F1]/10">
              <h3 className="font-display text-lg font-semibold text-[#F8F6F1]">
                Select Aura Scan
              </h3>
              <button
                onClick={() => setShowSelector(false)}
                className="w-8 h-8 rounded-full hover:bg-[#F8F6F1]/10 flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5 text-[#F8F6F1]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scan list */}
            <div className="overflow-y-auto max-h-[60vh] p-4 space-y-4">
              {loadingScans && (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-[#C9A96E] border-t-transparent rounded-full animate-spin" />
                  <span className="font-body text-sm text-[#F8F6F1]/50 ml-3">Scanning for available data...</span>
                </div>
              )}

              {scanError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <p className="font-body text-xs text-red-300">{scanError}</p>
                  {isAuthSessionError(scanError) ? (
                    <Link
                      href="/dashboard/login"
                      className="mt-2 inline-flex items-center justify-center rounded-lg bg-[#C9A96E] px-3 py-1 text-xs font-semibold text-[#0F1D2C] hover:bg-[#d7bc84] transition-colors"
                    >
                      Sign in again
                    </Link>
                  ) : null}
                  <p className="font-body text-[10px] text-red-300/50 mt-1">
                    Ensure the Aura scanner app has been used and scan data exists on this machine.
                  </p>
                </div>
              )}

              {!loadingScans && !scanError && availableScans.length === 0 && (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-[#F8F6F1]/20 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                  </svg>
                  <p className="font-body text-sm text-[#F8F6F1]/40">No scans found</p>
                  <p className="font-body text-xs text-[#F8F6F1]/25 mt-1">
                    Complete a scan in the Aura app first
                  </p>
                </div>
              )}

              {/* Suggested matches */}
              {suggestedScans.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-body text-xs font-semibold text-[#C9A96E] uppercase tracking-wide flex items-center gap-1.5">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                    Suggested Match
                  </h4>
                  {suggestedScans.map((scan) => (
                    <ScanCard
                      key={`${scan.name}_${scan.date}`}
                      scan={scan}
                      isMatch
                      onSelect={() => handleImport(scan)}
                    />
                  ))}
                </div>
              )}

              {/* Other scans */}
              {otherScans.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-body text-xs font-semibold text-[#F8F6F1]/50 uppercase tracking-wide">
                    {suggestedScans.length > 0 ? 'Other Scans' : 'Available Scans'}
                  </h4>
                  {otherScans.map((scan) => (
                    <ScanCard
                      key={`${scan.name}_${scan.date}`}
                      scan={scan}
                      isMatch={false}
                      onSelect={() => handleImport(scan)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Inline styles for scan animation */}
      <style jsx>{`
        @keyframes scan {
          0% { transform: translateY(0); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(80px); opacity: 0; }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

// ── SUBCOMPONENT: Scan Card ──

function ScanCard({
  scan,
  isMatch,
  onSelect,
}: {
  scan: AvailableScan;
  isMatch: boolean;
  onSelect: () => void;
}) {
  const formatDate = (isoDate: string) => {
    try {
      return new Date(isoDate).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoDate;
    }
  };

  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left ${
        isMatch
          ? 'border-[#C9A96E]/40 bg-[#C9A96E]/5 hover:bg-[#C9A96E]/10 hover:border-[#C9A96E]/60'
          : 'border-[#F8F6F1]/10 hover:bg-[#F8F6F1]/5 hover:border-[#F8F6F1]/20'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isMatch ? 'bg-[#C9A96E]/20' : 'bg-[#F8F6F1]/5'
          }`}
        >
          <svg
            className={`w-4 h-4 ${isMatch ? 'text-[#C9A96E]' : 'text-[#F8F6F1]/40'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </div>
        <div>
          <p className={`font-body text-sm font-medium ${isMatch ? 'text-[#F8F6F1]' : 'text-[#F8F6F1]/80'}`}>
            {scan.name}
          </p>
          <p className="font-body text-xs text-[#F8F6F1]/40">
            {formatDate(scan.date)} &middot; {scan.imageCount} images
          </p>
        </div>
      </div>
      <svg className="w-4 h-4 text-[#F8F6F1]/30 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    </button>
  );
}
