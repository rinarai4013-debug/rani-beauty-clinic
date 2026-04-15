// @vitest-environment node
/**
 * Integration tests for Public Mutation routes:
 *   POST /api/simulation/generate  (rate-limited, JSON body)
 *   POST /api/photo/upload         (rate-limited, FormData body)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildPostRequest,
  expectServerError,
  expectBadRequest,
} from './helpers';

// ---------------------------------------------------------------------------
// Shared mutable mock refs (hoisted vi.mock pattern)
// ---------------------------------------------------------------------------

const mockRateLimit = vi.fn();
const mockGetClientIP = vi.fn();
const mockRateLimitResponse = vi.fn();
const mockGenerateAISimulation = vi.fn();
const mockWithSentry = vi.fn();
const mockSharp = vi.fn();

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
  getClientIP: (...args: unknown[]) => mockGetClientIP(...args),
  rateLimitResponse: (...args: unknown[]) => mockRateLimitResponse(...args),
  RATE_LIMITS: {
    FORM: { limit: 5, windowMs: 60000 },
    AI: { limit: 10, windowMs: 60000 },
    VIEW: { limit: 30, windowMs: 60000 },
    BOOKING: { limit: 15, windowMs: 60000 },
    WEBHOOK: { limit: 100, windowMs: 60000 },
  },
}));

vi.mock('@/lib/photo-simulation/ai-simulation', () => ({
  generateAISimulation: (...args: unknown[]) => mockGenerateAISimulation(...args),
}));
const mockGenerateTrajectoryScenario = vi.fn();

vi.mock('@/lib/photo-simulation/trajectory-scenarios', () => ({
  generateTrajectoryScenario: (...args: unknown[]) => mockGenerateTrajectoryScenario(...args),
}));


vi.mock('@/lib/sentry-utils', () => ({
  withSentry: (_name: string, handler: () => Promise<unknown>) => handler(),
  captureCheckoutEvent: vi.fn(),
  captureWebhookEvent: vi.fn(),
  captureAgentExecution: vi.fn(),
  captureAuthEvent: vi.fn(),
}));

vi.mock('sharp', () => ({
  default: (...args: unknown[]) => mockSharp(...args),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionFromRequest: vi.fn().mockResolvedValue({ userId: 'u1', role: 'ceo', username: 'test' }),
}));

// ---------------------------------------------------------------------------
// Imports (after all vi.mock calls)
// ---------------------------------------------------------------------------

import { POST as simulationPOST } from '@/app/api/simulation/generate/route';
import { POST as photoUploadPOST } from '@/app/api/photo/upload/route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setupRateLimitAllow() {
  mockRateLimit.mockReturnValue({ allowed: true, resetIn: 0 });
  mockGetClientIP.mockReturnValue('127.0.0.1');
}

function setupRateLimitDeny() {
  mockRateLimit.mockReturnValue({ allowed: false, resetIn: 30000 });
  mockGetClientIP.mockReturnValue('127.0.0.1');
  mockRateLimitResponse.mockReturnValue(
    new Response(
      JSON.stringify({ error: 'Too many requests. Please try again later.' }),
      {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': '30' },
      },
    ),
  );
}

function buildSimulationRequest(body: unknown) {
  return buildPostRequest('/api/simulation/generate', body);
}

function buildPhotoUploadRequest(file?: File) {
  const formData = new FormData();
  if (file) {
    formData.append('file', file);
  }

  return new Request('http://localhost:3000/api/photo/upload', {
    method: 'POST',
    body: formData,
    headers: { 'x-forwarded-for': '127.0.0.1' },
  });
}

const validSimulationBody = {
  imageBase64: 'data:image/jpeg;base64,/9j/fake-base64-data',
  treatmentPresets: ['HydraFacial'],
  intensity: 0.5,
  timeframe: '3-months',
};

// ==========================================================================
// POST /api/simulation/generate
// ==========================================================================

describe('POST /api/simulation/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupRateLimitAllow();
    mockGenerateAISimulation.mockResolvedValue({
      imageUrl: 'data:image/jpeg;base64,result',
      confidence: 0.85,
      timeframe: '3-months',
      treatments: ['HydraFacial'],
    });
  });

  it('should return 429 when rate limited', async () => {
    setupRateLimitDeny();
    const req = buildSimulationRequest(validSimulationBody);
    const response = await simulationPOST(req as any);

    expect(response.status).toBe(429);
  });

  it('should return 400 for invalid JSON body', async () => {
    const req = new Request('http://localhost:3000/api/simulation/generate', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
      body: 'not-valid-json{{{',
    });
    const response = await simulationPOST(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it('should return 400 for missing required fields', async () => {
    const req = buildSimulationRequest({ imageBase64: '' });
    const response = await simulationPOST(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it('should return 400 when treatmentPresets is empty', async () => {
    const req = buildSimulationRequest({
      ...validSimulationBody,
      treatmentPresets: [],
    });
    const response = await simulationPOST(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it('should return 400 when intensity is out of range', async () => {
    const req = buildSimulationRequest({
      ...validSimulationBody,
      intensity: 2.0,
    });
    const response = await simulationPOST(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it('should return 200 with simulation result on valid request', async () => {
    const req = buildSimulationRequest(validSimulationBody);
    const response = await simulationPOST(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('imageUrl');
    expect(data).toHaveProperty('confidence');
    expect(data).toHaveProperty('timeframe');
    expect(data).toHaveProperty('treatments');
  });

  it('should call generateAISimulation with correct params', async () => {
    const req = buildSimulationRequest(validSimulationBody);
    await simulationPOST(req as any);

    expect(mockGenerateAISimulation).toHaveBeenCalledWith({
      photoBase64: validSimulationBody.imageBase64,
      treatments: validSimulationBody.treatmentPresets,
      intensity: validSimulationBody.intensity,
      timeframe: validSimulationBody.timeframe,
    });
  });

  it('should return 500 when simulation engine fails', async () => {
    mockGenerateAISimulation.mockRejectedValue(new Error('AI engine timeout'));
    const req = buildSimulationRequest(validSimulationBody);
    const response = await simulationPOST(req as any);
    await expectServerError(response);
  });
});

// ==========================================================================
// POST /api/photo/upload
// ==========================================================================

describe('POST /api/photo/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupRateLimitAllow();

    // Mock sharp chain: sharp(buffer).resize().jpeg().toBuffer()
    const sharpChain = {
      metadata: vi.fn().mockResolvedValue({ width: 800, height: 600, format: 'jpeg' }),
      resize: vi.fn().mockReturnThis(),
      jpeg: vi.fn().mockReturnThis(),
      toBuffer: vi.fn().mockResolvedValue(Buffer.from('processed-image-data')),
    };
    mockSharp.mockReturnValue(sharpChain);
  });

  it('should return 429 when rate limited', async () => {
    setupRateLimitDeny();
    const file = new File([new Uint8Array(100)], 'photo.jpg', { type: 'image/jpeg' });
    const req = buildPhotoUploadRequest(file);
    const response = await photoUploadPOST(req as any);

    expect(response.status).toBe(429);
  });

  it('should return 400 when no file is provided', async () => {
    const req = buildPhotoUploadRequest(); // no file
    const response = await photoUploadPOST(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it('should return 400 for invalid file type', async () => {
    const file = new File(['text content'], 'doc.txt', { type: 'text/plain' });
    const req = buildPhotoUploadRequest(file);
    const response = await photoUploadPOST(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid file type');
  });

  it('should return 200 with image data for valid JPEG', async () => {
    const imageData = new Uint8Array(1000);
    const file = new File([imageData], 'photo.jpg', { type: 'image/jpeg' });
    const req = buildPhotoUploadRequest(file);
    const response = await photoUploadPOST(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('imageBase64');
    expect(data).toHaveProperty('originalName', 'photo.jpg');
    expect(data).toHaveProperty('originalSize');
    expect(data).toHaveProperty('processedSize');
  });

  it('should return 200 for PNG files', async () => {
    const imageData = new Uint8Array(500);
    const file = new File([imageData], 'photo.png', { type: 'image/png' });
    const req = buildPhotoUploadRequest(file);
    const response = await photoUploadPOST(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('imageBase64');
  });

  it('should handle PDF files without sharp processing', async () => {
    const pdfData = new Uint8Array(500);
    const file = new File([pdfData], 'document.pdf', { type: 'application/pdf' });
    const req = buildPhotoUploadRequest(file);
    const response = await photoUploadPOST(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('imageBase64');
    expect(data.imageBase64).toContain('data:application/pdf;base64,');
    expect(data).toHaveProperty('isPdf', true);
    // Sharp should NOT be called for PDFs
    expect(mockSharp).not.toHaveBeenCalled();
  });

  it('should return 500 when sharp processing fails', async () => {
    const sharpChain = {
      metadata: vi.fn().mockRejectedValue(new Error('Corrupt image data')),
      resize: vi.fn().mockReturnThis(),
      jpeg: vi.fn().mockReturnThis(),
      toBuffer: vi.fn().mockRejectedValue(new Error('Corrupt image data')),
    };
    mockSharp.mockReturnValue(sharpChain);

    const imageData = new Uint8Array(500);
    const file = new File([imageData], 'photo.jpg', { type: 'image/jpeg' });
    const req = buildPhotoUploadRequest(file);
    const response = await photoUploadPOST(req as any);
    await expectServerError(response);
  });
});

// ==========================================================================
// POST /api/simulation/generate — scenario extension (additive tests)
// ==========================================================================

describe('POST /api/simulation/generate — scenario params', () => {
  const MOCK_TRAJECTORY_SCENARIO = {
    serviceKey: 'botox',
    displayName: 'Botox / Neuromodulator',
    isVisual: true,
    withTreatment: [
      { timeframe: '1m', improvementScore: 75, confidenceLevel: 0.55, label: 'Initial improvements emerging' },
      { timeframe: '3m', improvementScore: 80, confidenceLevel: 0.70, label: 'Visible treatment response' },
      { timeframe: '6m', improvementScore: 72, confidenceLevel: 0.80, label: 'Progressive results evident' },
      { timeframe: '12m', improvementScore: 55, confidenceLevel: 0.75, label: 'Sustained outcome at 12 months' },
    ],
    withoutTreatment: [
      { timeframe: '1m', improvementScore: 50, confidenceLevel: 0.55, label: 'Baseline maintained' },
      { timeframe: '3m', improvementScore: 47, confidenceLevel: 0.70, label: 'Early natural changes continue' },
      { timeframe: '6m', improvementScore: 43, confidenceLevel: 0.80, label: 'Untreated progression' },
      { timeframe: '12m', improvementScore: 38, confidenceLevel: 0.75, label: 'Cumulative untreated change' },
    ],
    assumptions: ['Patient follows recommended treatment protocol'],
    disclaimer: 'Illustrative simulation, not a diagnosis or guaranteed outcome. Individual results vary.',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    setupRateLimitAllow();
    mockGenerateAISimulation.mockResolvedValue({
      imageUrl: 'data:image/jpeg;base64,result',
      confidence: 0.85,
      timeframe: '3-months',
      treatments: ['HydraFacial'],
    });
    mockGenerateTrajectoryScenario.mockReturnValue(MOCK_TRAJECTORY_SCENARIO);
  });

  it('accepts optional serviceKey and returns scenario fields', async () => {
    const req = buildSimulationRequest({
      ...validSimulationBody,
      serviceKey: 'botox',
    });
    const response = await simulationPOST(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    // Existing contract intact
    expect(data).toHaveProperty('imageUrl');
    expect(data).toHaveProperty('confidence');
    expect(data).toHaveProperty('timeframe');
    expect(data).toHaveProperty('treatments');
    // Additive scenario fields
    expect(data).toHaveProperty('scenarios');
    expect(data.scenarios).toHaveProperty('withTreatment');
    expect(data.scenarios).toHaveProperty('withoutTreatment');
    expect(data).toHaveProperty('timeline');
    expect(data).toHaveProperty('assumptions');
    expect(Array.isArray(data.scenarios.withTreatment)).toBe(true);
    expect(data.scenarios.withTreatment.length).toBe(4);
  });

  it('backward compat: old payload without serviceKey returns no scenario fields', async () => {
    const req = buildSimulationRequest(validSimulationBody);
    const response = await simulationPOST(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    // Existing fields present
    expect(data).toHaveProperty('imageUrl');
    expect(data).toHaveProperty('confidence');
    // No scenario fields injected
    expect(data.scenarios).toBeUndefined();
    expect(data.timeline).toBeUndefined();
    expect(data.assumptions).toBeUndefined();
  });

  it('malformed scenario: invalid timeframe value returns 400', async () => {
    const req = buildSimulationRequest({
      ...validSimulationBody,
      timeframe: 'not-a-valid-timeframe',
    });
    const response = await simulationPOST(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it('accepts 12-months as a valid timeframe', async () => {
    const req = buildSimulationRequest({
      ...validSimulationBody,
      timeframe: '12-months',
    });
    const response = await simulationPOST(req as any);
    expect(response.status).toBe(200);
  });

  it('rate-limit behavior unchanged with new scenario params', async () => {
    setupRateLimitDeny();
    const req = buildSimulationRequest({ ...validSimulationBody, serviceKey: 'botox' });
    const response = await simulationPOST(req as any);
    expect(response.status).toBe(429);
  });
});
