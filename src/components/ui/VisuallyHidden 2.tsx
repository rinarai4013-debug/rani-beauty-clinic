import { type ReactNode } from "react";

/**
 * VisuallyHidden - renders content that is invisible to sighted users
 * but remains accessible to screen readers.
 *
 * Uses the standard sr-only technique: positioned off-screen via clip-path
 * while preserving the element in the accessibility tree.
 *
 * Usage:
 *   <VisuallyHidden>Descriptive text for screen readers</VisuallyHidden>
 *   <button><SearchIcon /><VisuallyHidden>Search</VisuallyHidden></button>
 */
interface VisuallyHiddenProps {
  children: ReactNode;
  as?: "span" | "div" | "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "label";
}

export default function VisuallyHidden({ children, as: Tag = "span" }: VisuallyHiddenProps) {
  return (
    <Tag
      className="sr-only"
      style={{
        position: "absolute",
        width: "1px",
        height: "1px",
        padding: 0,
        margin: "-1px",
        overflow: "hidden",
        clip: "rect(0, 0, 0, 0)",
        whiteSpace: "nowrap",
        borderWidth: 0,
      }}
    >
      {children}
    </Tag>
  );
}
