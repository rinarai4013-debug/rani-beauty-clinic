export interface Testimonial {
  id: number;
  name: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
  treatment: string;
  treatmentSlug: string;
  date: string;
  dateISO: string;
  location?: string;
  verified: boolean;
}

export const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Sarah M.",
    rating: 5,
    text: "I was so nervous about laser hair removal, but the Candela GentleMax Pro Plus made it completely pain-free. I actually fell asleep during my session! After just three treatments, I already see a dramatic reduction and my skin feels so smooth.",
    treatment: "Laser Hair Removal",
    treatmentSlug: "laser-hair-removal",
    date: "November 2025",
    dateISO: "2025-11-15",
    location: "Renton, WA",
    verified: true,
  },
  {
    id: 2,
    name: "Jennifer L.",
    rating: 5,
    text: "Having a board-certified neurologist administer my Botox makes all the difference. Dr. Landfield's understanding of facial anatomy is unmatched — my results look completely natural. Friends keep telling me I look refreshed, but nobody can pinpoint why.",
    treatment: "Botox",
    treatmentSlug: "botox-dysport",
    date: "December 2025",
    dateISO: "2025-12-10",
    location: "Bellevue, WA",
    verified: true,
  },
  {
    id: 3,
    name: "Priya K.",
    rating: 5,
    text: "I got a HydraFacial before my sister's wedding and the immediate glow was unreal. My makeup artist even asked what I had done because my skin looked so radiant. I'm now on a monthly plan and my complexion has never been better.",
    treatment: "HydraFacial",
    treatmentSlug: "hydrafacial",
    date: "October 2025",
    dateISO: "2025-10-20",
    location: "Kent, WA",
    verified: true,
  },
  {
    id: 4,
    name: "Marcus T.",
    rating: 5,
    text: "Years of acne left me with deep scarring that really affected my confidence. After my RF microneedling series at Rani Beauty Clinic, the texture of my skin has improved dramatically. I finally feel comfortable without trying to hide behind a beard.",
    treatment: "RF Microneedling",
    treatmentSlug: "rf-microneedling",
    date: "January 2026",
    dateISO: "2026-01-08",
    location: "Tukwila, WA",
    verified: true,
  },
  {
    id: 5,
    name: "Angela R.",
    rating: 5,
    text: "The GLP-1 weight management program has been truly life-changing. The medical team monitored me closely every step of the way, and I never felt like just a number. I've lost 40 pounds and gained a whole new outlook on my health.",
    treatment: "GLP-1 Weight Management",
    treatmentSlug: "glp1-weight-management",
    date: "February 2026",
    dateISO: "2026-02-14",
    location: "Auburn, WA",
    verified: true,
  },
  {
    id: 6,
    name: "Diana W.",
    rating: 5,
    text: "From the moment you walk in, the staff at Rani Beauty Clinic makes you feel like family. The clinic is gorgeous, everything is so clean and modern, and the team personally follows up after every visit. This is hands down the best medspa experience I've ever had.",
    treatment: "General Experience",
    treatmentSlug: "",
    date: "December 2025",
    dateISO: "2025-12-22",
    location: "Newcastle, WA",
    verified: true,
  },
];
