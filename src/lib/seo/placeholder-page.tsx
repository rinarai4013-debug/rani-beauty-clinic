import type { Metadata } from "next";

/**
 * Shared metadata for public placeholder routes that should never compete for indexation.
 * These routes currently have no meaningful HTML, so we explicitly keep them out of search
 * until they are fully implemented or redirected.
 */
export const placeholderNoindexMetadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function PlaceholderPage() {
  return null;
}
