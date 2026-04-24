'use client';

import React, { useCallback, useRef, useState } from 'react';
import { Camera, X, Upload } from 'lucide-react';

interface PhotoUploadZoneProps {
  photos: File[];
  onPhotosChange: (_photos: File[]) => void;
  maxPhotos?: number;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png'];
const MAX_DIMENSION = 1200;

/**
 * Resize an image file client-side using canvas.
 * Max width 1200px, maintains aspect ratio.
 */
async function resizeImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
        resolve(file);
        return;
      }

      // Scale down maintaining aspect ratio
      if (width > height) {
        height = Math.round((height * MAX_DIMENSION) / width);
        width = MAX_DIMENSION;
      } else {
        width = Math.round((width * MAX_DIMENSION) / height);
        height = MAX_DIMENSION;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

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
        0.9,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

export default function PhotoUploadZone({
  photos,
  onPhotosChange,
  maxPhotos = 3,
}: PhotoUploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      setError(null);
      const fileArray = Array.from(files);

      // Validate count
      const remaining = maxPhotos - photos.length;
      if (remaining <= 0) {
        setError(`Maximum ${maxPhotos} photos allowed`);
        return;
      }

      const toProcess = fileArray.slice(0, remaining);
      const validFiles: File[] = [];

      for (const file of toProcess) {
        // Type validation
        if (!ACCEPTED_TYPES.includes(file.type)) {
          setError('Only JPEG and PNG images are accepted');
          continue;
        }

        // Size validation
        if (file.size > MAX_FILE_SIZE) {
          setError('Maximum file size is 10MB');
          continue;
        }

        try {
          const resized = await resizeImage(file);
          validFiles.push(resized);
        } catch {
          setError('Failed to process image');
        }
      }

      if (validFiles.length > 0) {
        const newPhotos = [...photos, ...validFiles];
        onPhotosChange(newPhotos);

        // Generate previews for new files
        const newPreviews = await Promise.all(
          validFiles.map(
            (f) =>
              new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.readAsDataURL(f);
              }),
          ),
        );
        setPreviews((prev) => [...prev, ...newPreviews]);
      }
    },
    [photos, onPhotosChange, maxPhotos],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files);
      }
      // Reset input so same file can be selected again
      e.target.value = '';
    },
    [processFiles],
  );

  const removePhoto = useCallback(
    (index: number) => {
      const newPhotos = photos.filter((_, i) => i !== index);
      onPhotosChange(newPhotos);
      setPreviews((prev) => prev.filter((_, i) => i !== index));
    },
    [photos, onPhotosChange],
  );

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      {photos.length < maxPhotos && (
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            relative cursor-pointer rounded-xl border-2 border-dashed p-8
            transition-all duration-200 text-center
            ${
              isDragging
                ? 'border-[#C9A96E] bg-[#C9A96E]/5 scale-[1.02]'
                : 'border-[#0F1D2C]/20 bg-[#F8F6F1]/50 hover:border-[#C9A96E]/60 hover:bg-[#F8F6F1]'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            multiple
            onChange={handleFileInput}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-3">
            <div
              className={`
                rounded-full p-4 transition-colors
                ${isDragging ? 'bg-[#C9A96E]/20' : 'bg-[#0F1D2C]/5'}
              `}
            >
              {isDragging ? (
                <Upload className="h-8 w-8 text-[#C9A96E]" />
              ) : (
                <Camera className="h-8 w-8 text-[#0F1D2C]/40" />
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-[#0F1D2C]">
                {isDragging ? 'Drop your photo here' : 'Drag & drop your photo'}
              </p>
              <p className="mt-1 text-xs text-[#0F1D2C]/50">
                or click to browse &middot; JPEG or PNG &middot; Max 10MB
              </p>
            </div>

            <p className="text-xs text-[#0F1D2C]/30">
              {photos.length}/{maxPhotos} photos
            </p>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* Thumbnail previews */}
      {previews.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {previews.map((preview, index) => (
            <div
              key={index}
              className="relative group rounded-lg overflow-hidden border border-[#0F1D2C]/10 shadow-sm"
            >
              <img
                src={preview}
                alt={`Upload ${index + 1}`}
                className="h-24 w-24 object-cover"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removePhoto(index);
                }}
                className="
                  absolute top-1 right-1 rounded-full bg-[#0F1D2C]/70
                  p-1 text-white opacity-0 group-hover:opacity-100
                  transition-opacity hover:bg-[#0F1D2C]
                "
                aria-label="Remove photo"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
