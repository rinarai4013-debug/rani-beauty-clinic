'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, Upload, User, Sun, Lightbulb, Lock } from 'lucide-react';

interface StepProps {
  formData: Record<string, any>;
  onUpdate: (field: string, value: any) => void;
  errors: Record<string, string>;
}

const MAX_PHOTOS = 3;
const MAX_WIDTH = 1200;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png'];

function resizeImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      if (img.width <= MAX_WIDTH) {
        resolve(file);
        return;
      }

      const scale = MAX_WIDTH / img.width;
      const canvas = document.createElement('canvas');
      canvas.width = MAX_WIDTH;
      canvas.height = Math.round(img.height * scale);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const resized = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          });
          resolve(resized);
        },
        file.type,
        0.9
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

export default function Step7PhotoUpload({
  formData,
  onUpdate,
  errors,
}: StepProps) {
  const photos: File[] = formData.photos || [];
  const [previews, setPreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate previews from photos
  useEffect(() => {
    const urls = photos.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos.length]);

  const addPhotos = useCallback(
    async (files: FileList | File[]) => {
      const incoming = Array.from(files).filter((f) =>
        ACCEPTED_TYPES.includes(f.type)
      );
      if (incoming.length === 0) return;

      const remaining = MAX_PHOTOS - photos.length;
      const toProcess = incoming.slice(0, remaining);
      if (toProcess.length === 0) return;

      setProcessing(true);
      try {
        const resized = await Promise.all(toProcess.map(resizeImage));
        onUpdate('photos', [...photos, ...resized]);
      } catch {
        // Silently fail resize — use originals
        onUpdate('photos', [...photos, ...toProcess]);
      } finally {
        setProcessing(false);
      }
    },
    [photos, onUpdate]
  );

  const removePhoto = useCallback(
    (index: number) => {
      const updated = photos.filter((_, i) => i !== index);
      onUpdate('photos', updated);
    },
    [photos, onUpdate]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files) {
        addPhotos(e.dataTransfer.files);
      }
    },
    [addPhotos]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        addPhotos(e.target.files);
      }
      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [addPhotos]
  );

  const tips = [
    { icon: <User className="w-4 h-4" />, text: 'Neutral expression' },
    { icon: <Sun className="w-4 h-4" />, text: 'Even lighting' },
    { icon: <Lightbulb className="w-4 h-4" />, text: 'Face forward' },
  ];

  return (
    <div className="space-y-8">
      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h2 className="font-heading text-2xl md:text-3xl text-[#0F1D2C] mb-2">
          Share a Photo (Optional)
        </h2>
        <p className="font-body text-sm text-[#0F1D2C]/60 max-w-md mx-auto">
          Photos help us create an even more accurate treatment plan. You can
          skip this step.
        </p>
      </motion.div>

      {/* Upload Zone */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        {photos.length < MAX_PHOTOS && (
          <div
            role="button"
            tabIndex={0}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            className={`
              relative flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed
              cursor-pointer transition-all duration-300
              ${
                isDragging
                  ? 'border-[#C9A96E] bg-[#C9A96E]/10 scale-[1.01]'
                  : 'border-[#0F1D2C]/15 bg-[#F8F6F1] hover:border-[#C9A96E]/50 hover:bg-[#C9A96E]/5'
              }
            `}
          >
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors duration-300 ${
                isDragging
                  ? 'bg-[#C9A96E]/20 text-[#C9A96E]'
                  : 'bg-[#0F1D2C]/5 text-[#0F1D2C]/40'
              }`}
            >
              {processing ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                >
                  <Upload className="w-6 h-6" />
                </motion.div>
              ) : (
                <Camera className="w-6 h-6" />
              )}
            </div>
            <div className="text-center">
              <p className="font-body text-sm font-medium text-[#0F1D2C]/70">
                {processing
                  ? 'Processing...'
                  : isDragging
                    ? 'Drop your photo here'
                    : 'Click to browse or drag and drop'}
              </p>
              <p className="font-body text-xs text-[#0F1D2C]/40 mt-1">
                JPG or PNG, up to {MAX_PHOTOS} photos
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              aria-label="Upload photos"
            />
          </div>
        )}

        {/* Photo Count */}
        {photos.length > 0 && (
          <p className="font-body text-xs text-[#0F1D2C]/50 text-center mt-2">
            {photos.length} of {MAX_PHOTOS} photos added
          </p>
        )}
      </motion.div>

      {/* Preview Thumbnails */}
      <AnimatePresence mode="popLayout">
        {previews.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="grid grid-cols-3 gap-4"
          >
            {previews.map((url, i) => (
              <motion.div
                key={`photo-${i}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className="relative aspect-square rounded-2xl overflow-hidden group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Uploaded photo ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removePhoto(i);
                  }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center
                    opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-500"
                  aria-label={`Remove photo ${i + 1}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Face Positioning Tips */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="flex flex-wrap items-center justify-center gap-4"
      >
        {tips.map((tip, i) => (
          <motion.div
            key={tip.text}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + i * 0.08, duration: 0.3 }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#F8F6F1] border border-[#0F1D2C]/10"
          >
            <span className="text-[#C9A96E]">{tip.icon}</span>
            <span className="font-body text-xs text-[#0F1D2C]/70">
              {tip.text}
            </span>
          </motion.div>
        ))}
      </motion.div>

      {/* Privacy Note */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="flex items-center gap-3 p-4 rounded-xl bg-[#0F1D2C]/5 border border-[#0F1D2C]/10"
      >
        <Lock className="w-4 h-4 text-[#C9A96E] shrink-0" />
        <p className="font-body text-xs text-[#0F1D2C]/60">
          Your photos are encrypted and visible only to your treatment team
        </p>
      </motion.div>
    </div>
  );
}
