"use client";

import Image from "next/image";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  if (process.env.NODE_ENV === "development") {
    console.error("Global error:", error);
  }

  return (
    <html lang="en">
      <head>
        <title>Something Went Wrong | Rani Beauty Clinic</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "#F8F6F1",
          fontFamily:
            "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          color: "#0F1D2C",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "2rem 1.5rem",
            maxWidth: "480px",
            width: "100%",
          }}
        >
          {/* Logo */}
          <Image
            src="/logo/rani-logo.png"
            alt="Rani Beauty Clinic"
            width={160}
            height={48}
            style={{
              width: "160px",
              height: "auto",
              marginBottom: "2rem",
            }}
          />

          {/* Decorative divider */}
          <div
            style={{
              width: "60px",
              height: "2px",
              backgroundColor: "#C9A96E",
              margin: "0 auto 2rem",
            }}
          />

          <h1
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "1.75rem",
              fontWeight: 700,
              marginBottom: "0.75rem",
              color: "#0F1D2C",
            }}
          >
            Something Unexpected Happened
          </h1>

          <p
            style={{
              fontSize: "0.95rem",
              lineHeight: 1.6,
              color: "#6B7280",
              marginBottom: "2rem",
            }}
          >
            We apologize for the inconvenience. Please try refreshing the page
            or return to our homepage.
          </p>

          {/* Action buttons */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              alignItems: "center",
            }}
          >
            <button
              onClick={() => reset()}
              style={{
                backgroundColor: "#C9A96E",
                color: "#0F1D2C",
                border: "none",
                borderRadius: "8px",
                padding: "0.75rem 2rem",
                fontSize: "0.85rem",
                fontWeight: 600,
                fontFamily: "'Montserrat', sans-serif",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                cursor: "pointer",
                width: "100%",
                maxWidth: "280px",
              }}
            >
              Refresh Page
            </button>

            <a
              href="/"
              style={{
                color: "#0F1D2C",
                border: "2px solid #0F1D2C",
                borderRadius: "8px",
                padding: "0.75rem 2rem",
                fontSize: "0.85rem",
                fontWeight: 600,
                fontFamily: "'Montserrat', sans-serif",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                textDecoration: "none",
                display: "block",
                width: "100%",
                maxWidth: "280px",
                boxSizing: "border-box",
              }}
            >
              Return Home
            </a>
          </div>

          {/* Contact info */}
          <div
            style={{
              marginTop: "2.5rem",
              paddingTop: "1.5rem",
              borderTop: "1px solid #E5E7EB",
            }}
          >
            <p
              style={{
                fontSize: "0.8rem",
                color: "#6B7280",
                marginBottom: "0.25rem",
              }}
            >
              Need urgent help?
            </p>
            <a
              href="tel:+14255394440"
              style={{
                fontSize: "0.95rem",
                fontWeight: 600,
                color: "#0F1D2C",
                textDecoration: "none",
              }}
            >
              (425) 539-4440
            </a>
          </div>

          {/* Dev error details */}
          {process.env.NODE_ENV === "development" && (
            <div
              style={{
                marginTop: "2rem",
                padding: "1rem",
                backgroundColor: "#FEF2F2",
                borderRadius: "8px",
                textAlign: "left",
                fontSize: "0.75rem",
                color: "#991B1B",
                wordBreak: "break-word",
              }}
            >
              <strong>Dev Error:</strong> {error.message}
              {error.digest && (
                <div style={{ marginTop: "0.5rem" }}>
                  <strong>Digest:</strong> {error.digest}
                </div>
              )}
            </div>
          )}
        </div>
      </body>
    </html>
  );
}
