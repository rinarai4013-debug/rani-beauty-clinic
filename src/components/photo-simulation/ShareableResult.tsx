'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  Share2,
  Phone,
  Globe,
  ArrowRight,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────

interface DetectedConcern {
  name: string;
  severity: number;
  area?: string;
}

interface ServiceRecommendation {
  name: string;
  description?: string;
  price?: string;
}

interface ShareableResultProps {
  originalPhoto: File;
  simulatedPhoto: string; // base64 or URL
  clientName: string;
  concerns: DetectedConcern[];
  recommendations: ServiceRecommendation[];
  skinScore: { current: number; projected: number };
}

// ─── Component ─────────────────────────────────────────────────────────

export default function ShareableResult({
  originalPhoto,
  simulatedPhoto,
  clientName,
  concerns,
  recommendations,
  skinScore,
}: ShareableResultProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [originalUrl, setOriginalUrl] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  // Convert File to object URL for display
  useEffect(() => {
    const url = URL.createObjectURL(originalPhoto);
    setOriginalUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [originalPhoto]);

  const topRecommendations = recommendations.slice(0, 3);
  const scoreImprovement = skinScore.projected - skinScore.current;

  // ─── Download as Image ─────────────────────────────────────────────

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;
    setIsDownloading(true);
    setShareError(null);

    try {
      // Dynamic import of html2canvas to keep bundle small
      const html2canvas = (await import('html2canvas')).default;

      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#F8F6F1',
        logging: false,
      });

      const link = document.createElement('a');
      link.download = `rani-beauty-simulation-${clientName.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('[ShareableResult] Download error:', error);
      setShareError('Could not generate image. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  }, [clientName]);

  // ─── Share ─────────────────────────────────────────────────────────

  const handleShare = useCallback(async () => {
    setShareError(null);

    // Try Web Share API first (mobile)
    if (navigator.share && cardRef.current) {
      try {
        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(cardRef.current, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#F8F6F1',
          logging: false,
        });

        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, 'image/png'),
        );

        if (blob) {
          const file = new File([blob], 'rani-beauty-simulation.png', {
            type: 'image/png',
          });

          await navigator.share({
            title: 'My Treatment Simulation - Rani Beauty Clinic',
            text: `Check out my projected treatment results from Rani Beauty Clinic! Skin score: ${skinScore.current} → ${skinScore.projected}`,
            files: [file],
          });
          return;
        }
      } catch (error) {
        // If share was cancelled or failed, fall through to copy link
        if ((error as Error).name === 'AbortError') return;
        console.warn('[ShareableResult] Web Share failed, falling back to copy link');
      }
    }

    // Fallback: copy clinic URL to clipboard
    try {
      await navigator.clipboard.writeText(
        'https://www.ranibeautyclinic.com/photo-simulation?ref=share',
      );
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    } catch {
      setShareError('Could not copy link. Please copy manually: ranibeautyclinic.com');
    }
  }, [skinScore]);

  return (
    <div className="space-y-4">
      {/* Branded Card */}
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-2xl overflow-hidden border border-[#0F1D2C]/10 bg-[#F8F6F1] shadow-lg max-w-2xl mx-auto"
      >
        {/* Header */}
        <div className="bg-[#0F1D2C] px-6 py-4 flex items-center justify-between">
          <div>
            <h2
              className="text-xl font-bold text-white tracking-wide"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Rani Beauty Clinic
            </h2>
            <p className="text-[#C9A96E] text-xs font-medium tracking-widest uppercase mt-0.5">
              Luxury Medical Aesthetics
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#C9A96E] flex items-center justify-center">
            <span
              className="text-[#0F1D2C] text-lg font-bold"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              R
            </span>
          </div>
        </div>

        {/* Client Name */}
        <div className="px-6 py-3 border-b border-[#0F1D2C]/5">
          <p className="text-sm text-[#0F1D2C]/60">
            Personalized simulation for
          </p>
          <p
            className="text-lg font-semibold text-[#0F1D2C]"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            {clientName}
          </p>
        </div>

        {/* Before / After Side-by-Side */}
        <div className="grid grid-cols-2 gap-0.5 bg-[#0F1D2C]/5">
          <div className="relative bg-white">
            <div className="absolute top-3 left-3 bg-[#0F1D2C]/70 text-white text-xs font-semibold px-3 py-1 rounded-full z-10 backdrop-blur-sm">
              Before
            </div>
            {originalUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={originalUrl}
                alt="Original photo"
                className="w-full aspect-square object-cover"
              />
            ) : (
              <div className="w-full aspect-square bg-[#F8F6F1] animate-pulse" />
            )}
          </div>
          <div className="relative bg-white">
            <div className="absolute top-3 left-3 bg-[#C9A96E] text-white text-xs font-semibold px-3 py-1 rounded-full z-10">
              After
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={simulatedPhoto}
              alt="Simulated result"
              className="w-full aspect-square object-cover"
            />
          </div>
        </div>

        {/* Skin Health Score */}
        <div className="px-6 py-4 border-b border-[#0F1D2C]/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#0F1D2C]/50 uppercase tracking-wider font-semibold mb-1">
                Skin Health Score
              </p>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-[#0F1D2C]">
                  {skinScore.current}
                </span>
                <ArrowRight className="w-5 h-5 text-[#C9A96E]" />
                <span className="text-2xl font-bold text-[#C9A96E]">
                  {skinScore.projected}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-green-50 text-green-700 text-sm font-bold px-3 py-1.5 rounded-full">
                +{scoreImprovement} pts
              </div>
              <p className="text-xs text-[#0F1D2C]/40 mt-1">projected improvement</p>
            </div>
          </div>

          {/* Score bar */}
          <div className="mt-3 h-2 bg-[#0F1D2C]/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: `${skinScore.current}%` }}
              animate={{ width: `${skinScore.projected}%` }}
              transition={{ delay: 0.5, duration: 1.2, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-[#0F1D2C] via-[#C9A96E] to-[#C9A96E]"
            />
          </div>
        </div>

        {/* Top 3 Recommendations */}
        <div className="px-6 py-4 border-b border-[#0F1D2C]/5">
          <p className="text-xs text-[#0F1D2C]/50 uppercase tracking-wider font-semibold mb-3">
            Recommended Treatments
          </p>
          <div className="space-y-2.5">
            {topRecommendations.map((rec, i) => (
              <div
                key={rec.name}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-[#C9A96E]/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#C9A96E]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0F1D2C]">{rec.name}</p>
                    {rec.description && (
                      <p className="text-xs text-[#0F1D2C]/50">{rec.description}</p>
                    )}
                  </div>
                </div>
                {rec.price && (
                  <span className="text-sm font-medium text-[#C9A96E]">{rec.price}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Book CTA */}
        <div className="px-6 py-4 bg-[#0F1D2C]/[0.02] border-b border-[#0F1D2C]/5">
          <a
            href="https://www.ranibeautyclinic.com/book"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-[#C9A96E] hover:bg-[#B8944D] text-white text-center py-3 rounded-xl font-semibold text-sm transition-colors"
          >
            Book Your Consultation
          </a>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#0F1D2C] text-center">
          <div className="flex items-center justify-center gap-4 text-xs text-white/60">
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3" />
              (425) 539-4440
            </span>
            <span className="text-white/30">|</span>
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3" />
              ranibeautyclinic.com
            </span>
          </div>
          <p className="text-[10px] text-white/30 mt-2 italic">
            Illustrative visualization - results may vary. Not a guarantee of treatment outcomes.
          </p>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-3 max-w-2xl mx-auto">
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="flex-1 flex items-center justify-center gap-2 bg-[#0F1D2C] hover:bg-[#1A2D3F] text-white py-3 px-5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isDownloading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Download as Image
            </>
          )}
        </button>

        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-[#F8F6F1] text-[#0F1D2C] border border-[#0F1D2C]/15 py-3 px-5 rounded-xl font-semibold text-sm transition-colors"
        >
          {linkCopied ? (
            <>
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-green-600">Link Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              Share
            </>
          )}
        </button>
      </div>

      {/* Error state */}
      {shareError && (
        <p className="text-sm text-red-500 text-center">{shareError}</p>
      )}
    </div>
  );
}
