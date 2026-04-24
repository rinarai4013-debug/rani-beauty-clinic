'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import PhotoUploadZone from './PhotoUploadZone';
import FaceFrameGuide from './FaceFrameGuide';
import SimulationCanvas from './SimulationCanvas';
import TreatmentEffectSelector from './TreatmentEffectSelector';
import SimulationDisclaimer from './SimulationDisclaimer';
import { Sparkles } from 'lucide-react';

interface PhotoSimulationProps {
  mode: 'full' | 'upload-only' | 'view-only';
  initialPhotos?: string[];
}

/**
 * Main photo simulation orchestrator.
 * Composes upload, canvas, treatment selector, and disclaimer
 * based on the selected mode.
 */
export default function PhotoSimulation({
  mode,
  initialPhotos,
}: PhotoSimulationProps) {
  const [photos, setPhotos] = useState<File[]>([]);
  const [selectedPresets, setSelectedPresets] = useState<string[]>([]);
  const [intensity, setIntensity] = useState(0.7);

  // Active photo is the first uploaded or initial photo
  const activePhoto: File | string | null =
    photos.length > 0 ? photos[0] : initialPhotos?.[0] ?? null;

  const handleTogglePreset = useCallback((preset: string) => {
    setSelectedPresets((prev) =>
      prev.includes(preset)
        ? prev.filter((p) => p !== preset)
        : [...prev, preset],
    );
  }, []);

  // upload-only mode: just the upload zone with face frame guide
  if (mode === 'upload-only') {
    return (
      <div className="space-y-4">
        <div className="relative">
          {photos.length === 0 && <FaceFrameGuide />}
          <PhotoUploadZone
            photos={photos}
            onPhotosChange={setPhotos}
            maxPhotos={3}
          />
        </div>
      </div>
    );
  }

  // view-only mode: just the simulation canvas with a pre-loaded photo
  if (mode === 'view-only') {
    if (!activePhoto) {
      return (
        <div className="flex items-center justify-center h-48 bg-[#F8F6F1] rounded-xl">
          <p className="text-sm text-[#0F1D2C]/40">No photo available</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <SimulationCanvas
          photo={activePhoto}
          selectedPresets={selectedPresets}
          intensity={intensity}
        />
        <TreatmentEffectSelector
          selectedPresets={selectedPresets}
          onToggle={handleTogglePreset}
          intensity={intensity}
          onIntensityChange={setIntensity}
        />
        <SimulationDisclaimer />
      </div>
    );
  }

  // full mode: complete experience
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-[#C9A96E]/10 p-2.5">
          <Sparkles className="h-5 w-5 text-rani-gold-accessible" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[#0F1D2C]">
            Treatment Visualization
          </h3>
          <p className="text-sm text-[#0F1D2C]/50">
            See a preview of your potential results
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left / Top: Photo area */}
        <div className="space-y-4">
          {!activePhoto ? (
            <div className="relative min-h-[300px]">
              <FaceFrameGuide />
              <PhotoUploadZone
                photos={photos}
                onPhotosChange={setPhotos}
                maxPhotos={3}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <SimulationCanvas
                photo={activePhoto}
                selectedPresets={selectedPresets}
                intensity={intensity}
              />

              {/* Photo selector if multiple */}
              {photos.length > 1 && (
                <div className="flex gap-2 justify-center">
                  {photos.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        // Move selected photo to front
                        const reordered = [p, ...photos.filter((_, j) => j !== i)];
                        setPhotos(reordered);
                      }}
                      className={`
                        h-12 w-12 rounded-lg overflow-hidden border-2 transition-all
                        ${i === 0 ? 'border-[#C9A96E] shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}
                      `}
                    >
                      <PhotoThumb file={p} />
                    </button>
                  ))}
                </div>
              )}

              {/* Upload more / change photo */}
              {photos.length < 3 && (
                <PhotoUploadZone
                  photos={photos}
                  onPhotosChange={setPhotos}
                  maxPhotos={3}
                />
              )}
            </div>
          )}
        </div>

        {/* Right / Bottom: Controls */}
        <div className="space-y-5">
          <TreatmentEffectSelector
            selectedPresets={selectedPresets}
            onToggle={handleTogglePreset}
            intensity={intensity}
            onIntensityChange={setIntensity}
          />
          <SimulationDisclaimer />
        </div>
      </div>
    </div>
  );
}

/** Small thumbnail component for multi-photo selector */
function PhotoThumb({ file }: { file: File }) {
  const [src, setSrc] = React.useState<string>('');

  React.useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!src) return <div className="h-full w-full bg-[#F8F6F1]" />;
  return (
    <Image
      src={src}
      alt="Uploaded photo thumbnail preview"
      width={48}
      height={48}
      unoptimized
      className="h-full w-full object-cover"
    />
  );
}
