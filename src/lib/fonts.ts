import localFont from "next/font/local";

/**
 * Self-hosted font configuration using Next.js built-in font optimization.
 *
 * Next.js automatically downloads Google Fonts at build time and serves
 * them from the same domain - eliminating render-blocking external
 * requests and improving LCP / CLS.
 *
 * Fonts are loaded with `display: "swap"` so text is visible immediately
 * while the font files load, and only the Latin subset plus required
 * weights are included to minimize total download size.
 *
 * CSS variable names match the existing Tailwind configuration in
 * `tailwind.config.ts` (fontFamily.heading / fontFamily.body).
 */

export const montserrat = localFont({
  src: [
    {
      path: "../assets/fonts/Montserrat/Montserrat-Regular-Static.ttf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-body",
  display: "swap",
});

export const montserratHeading = localFont({
  src: [
    {
      path: "../assets/fonts/Montserrat/Montserrat-Regular-Static.ttf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-heading",
  display: "swap",
});

/**
 * Combined CSS variable class string for the <html> element.
 * Apply this to ensure both heading and body font CSS variables are set.
 *
 * @example
 * ```tsx
 * <html lang="en" className={fontVariables}>
 * ```
 */
export const fontVariables = `${montserrat.variable} ${montserratHeading.variable}`;
