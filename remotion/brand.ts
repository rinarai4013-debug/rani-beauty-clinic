// Rani Beauty Clinic — Brand Tokens for Remotion

export const BRAND = {
  colors: {
    navy: "#0F1D2C",
    gold: "#C9A96E",
    goldLight: "#F3D6BE",
    cream: "#FAF8F5",
    creamDark: "#F8F6F1",
    white: "#FFFFFF",
    blush: "#F5E6E0",
    success: "#2D6A4F",
  },
  fonts: {
    headline: "Playfair Display",
    body: "Montserrat",
  },
  logo: {
    text: "RANI BEAUTY CLINIC",
    tagline: "Advanced Aesthetic Medicine",
  },
  clinic: {
    phone: "(425) 539-4440",
    address: "401 Olympia Ave NE, Suite 101, Renton, WA 98056",
    website: "ranibeautyclinic.com",
    rating: "4.9",
    reviewCount: "127+",
    hours: "Open 7 Days • 10AM–7PM",
  },
} as const;

export const DURATIONS = {
  reel15: 15 * 30, // 15 seconds at 30fps
  reel20: 20 * 30,
  reel25: 25 * 30,
  reel30: 30 * 30,
  story15: 15 * 30,
} as const;
