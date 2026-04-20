export type MarketingPlanKey = "halo" | "glow" | "elite";

export interface MembershipPlanCopy {
  name: string;
  tagline: string;
  monthlyPrice: number;
}

export interface MembershipPageTierCopy {
  name: string;
  price: number;
  badge?: string;
  features: string[];
  highlight: boolean;
}

export interface MembershipFaqCopy {
  question: string;
  answer: string;
}

export interface PricingMembershipTierCopy {
  name: string;
  price: string;
  annualValue: string;
  savings: string;
  features: string[];
  target: string;
  popular?: boolean;
}

export const MEMBERSHIP_PLAN_COPY: Record<MarketingPlanKey, MembershipPlanCopy> = {
  halo: {
    name: "Halo",
    tagline: "Your glow-up starts here",
    monthlyPrice: 149,
  },
  glow: {
    name: "Glow",
    tagline: "Elevate your transformation journey",
    monthlyPrice: 249,
  },
  elite: {
    name: "Elite",
    tagline: "The ultimate Rani experience",
    monthlyPrice: 449,
  },
};

export const MEMBERSHIP_PAGE_COPY = {
  tiers: [
    {
      name: "Glow Starter",
      price: 149,
      features: [
        "1 HydraFacial per month",
        "10% off all services",
        "Priority booking",
        "Free AI skin analysis",
      ],
      highlight: false,
    },
    {
      name: "Glow Plus",
      price: 299,
      badge: "Most Popular",
      features: [
        "1 HydraFacial + 1 Chemical Peel per month",
        "15% off all services",
        "Priority booking",
        "Free AI skin analysis",
        "Complimentary birthday treatment",
        "VIP event access",
      ],
      highlight: true,
    },
    {
      name: "Glow VIP",
      price: 499,
      features: [
        "2 treatments per month (HydraFacial, Peel, or RF Micro)",
        "20% off all services",
        "Same-day booking",
        "Free AI skin analysis",
        "Complimentary birthday treatment",
        "VIP event access",
        "Dedicated treatment coordinator",
        "Complimentary Rx skincare consultation",
      ],
      highlight: false,
    },
  ] as MembershipPageTierCopy[],
  faqs: [
    {
      question: "Can I cancel my membership at any time?",
      answer:
        "Yes. Our memberships are month-to-month with no long-term contracts. We ask for 30 days written notice to cancel, and any unused benefits from the current billing cycle remain available until the end of that period.",
    },
    {
      question: "Can I share my membership with family members?",
      answer:
        "Membership benefits are tied to the individual member. However, your discount on services can be used when purchasing gift cards for loved ones.",
    },
    {
      question: "What happens if I miss my monthly treatment?",
      answer:
        "Unused treatments roll over for one month. So if you miss December, you can use two treatments in January. After that, unused sessions expire.",
    },
    {
      question: "Can I upgrade or downgrade my tier?",
      answer:
        "Absolutely. Tier changes take effect at the start of your next billing cycle. Just let our front desk know or send us an email.",
    },
    {
      question: "Do I pay the consultation deposit as a member?",
      answer:
        "No. Members skip the $150 consultation deposit entirely. This is one of the many perks of being part of The Glow Membership.",
    },
    {
      question: "Is there a sign-up fee?",
      answer:
        "There is no sign-up fee. Your first monthly payment is all you need to get started.",
    },
  ] as MembershipFaqCopy[],
  roi: {
    averageTreatmentCost: 250,
    featuredTierName: "Glow Plus",
    featuredTierMonthlyPrice: 299,
  },
};

export const PRICING_MEMBERSHIP_COPY = {
  name: "Angel Glow Up Membership",
  signupBonus: "$50 off VI Peel or 20% off Toxin",
  comingSoon: false,
  tiers: [
    {
      name: "HALO",
      price: "$199/mo",
      annualValue: "$2,388",
      savings: "~$600/year",
      features: [
        "Monthly Skin Scan",
        "Express Facial",
        "LHR Small Facial Area (upper lip, chin, or sideburns)",
        "10% off all services & retail",
        "Priority Booking (3 days early)",
      ],
      target: "New clients wanting facial care + hair removal",
    },
    {
      name: "GLOW",
      price: "$349/mo",
      annualValue: "$4,188",
      savings: "~$2,000/year",
      popular: true,
      features: [
        "Everything in HALO plus:",
        "Upgrade to Signature Hydrafacial",
        "Body Laser Hair Removal - 1 area (Underarms or Brazilian)",
        "15% off all services & retail",
        "Priority Booking (1 week early)",
        "Monthly Skin Scan",
      ],
      target: "Regular clients serious about skincare routine",
    },
    {
      name: "ELITE AURA",
      price: "$549/mo",
      annualValue: "$6,588",
      savings: "~$3,600/year",
      features: [
        "Everything in GLOW plus:",
        "2nd Body Laser Area (Brazilian or Underarms + Full Legs or Full Arms)",
        "Quarterly Advanced Treatment (Microneedling, Peel, or LED)",
        "20% off all services & retail",
        "VIP Booking (2 weeks early)",
        "Monthly Skin Scan",
      ],
      target: "High-spenders committed to results",
    },
  ] as PricingMembershipTierCopy[],
  faqs: [
    {
      q: "Can I upgrade my tier?",
      a: "Yes, anytime. Billing is prorated to your new tier.",
    },
    {
      q: "Is there a contract?",
      a: "No contracts. Cancel anytime with 30 days notice.",
    },
    {
      q: "When do my monthly services reset?",
      a: "On your billing date each month. Unused services roll over for up to 2 months (3 months for Elite Aura).",
    },
    {
      q: "Can I share my membership?",
      a: "Memberships are non-transferable and tied to your account.",
    },
  ] as { q: string; a: string }[],
};
