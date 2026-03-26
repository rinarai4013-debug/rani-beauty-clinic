// Local Citation Content - Rani Beauty Clinic
// NAP consistency is critical. Use citationTemplate as the single source of truth.

export interface LocalCitation {
  platform: string;
  url: string;
  businessName: string;
  address: string;
  phone: string;
  website: string;
  categories: string[];
  description150: string;
  description300: string;
  description500: string;
  keywords: string[];
}

export const citationTemplate: LocalCitation = {
  platform: "",
  url: "",
  businessName: "Rani Beauty Clinic",
  address: "401 Olympia Ave NE #101, Renton, WA 98056",
  phone: "(425) 539-4440",
  website: "https://www.ranibeautyclinic.com",
  categories: [
    "Medical Spa",
    "Beauty Salon",
    "Skin Care Clinic",
    "Day Spa",
    "Cosmetic Skin Care Service",
    "Wellness Center",
  ],
  description150:
    "Rani Beauty Clinic is a physician-supervised medical spa in Renton, WA offering Botox, fillers, laser treatments, HydraFacials, and wellness IM injections.",
  description300:
    "Rani Beauty Clinic is a luxury, physician-supervised medical spa located in Renton, WA. Under the direction of board-certified neurologist Dr. Alexander Landfield, we offer Botox, dermal fillers, laser skin treatments, HydraFacials, Sofwave skin tightening, RF microneedling, chemical peels, GLP-1 weight management, NAD+ IM injections, and red light therapy. We combine clinical excellence with a luxury experience.",
  description500:
    "Rani Beauty Clinic is a luxury, physician-supervised medical spa in Renton, Washington. Our Medical Director, Dr. Alexander Landfield, is a board-certified neurologist who oversees all treatment protocols to ensure the highest standards of safety and clinical excellence. We offer a comprehensive menu of aesthetic and wellness services including Botox, dermal fillers, advanced laser treatments, HydraFacials, Sofwave non-invasive skin tightening, RF microneedling, chemical peels, GLP-1 medically supervised weight management, NAD+ and vitamin IM injections, and red light therapy. Every treatment is customized to the individual patient through thorough consultations and personalized care plans. Open Monday through Friday 9am to 6pm and Saturday 10am to 4pm.",
  keywords: [
    "medical spa Renton WA",
    "Botox Renton",
    "dermal fillers Renton",
    "HydraFacial Renton",
    "laser skin treatment Renton",
    "medspa near me",
    "Sofwave skin tightening",
    "RF microneedling Renton",
    "chemical peels Renton",
    "GLP-1 weight loss Renton",
    "NAD+ injections Renton",
    "red light therapy Renton",
    "physician-supervised medspa",
    "luxury medspa Renton WA",
    "anti-aging treatments Renton",
  ],
};

export const directoryList: {
  name: string;
  url: string;
  priority: "high" | "medium" | "low";
  notes: string;
}[] = [
  {
    name: "Google Business Profile",
    url: "https://business.google.com",
    priority: "high",
    notes:
      "Primary listing. Claim and verify. Add all services, photos, hours, and enable messaging. Post weekly using gbp-posts.ts content.",
  },
  {
    name: "Yelp",
    url: "https://biz.yelp.com",
    priority: "high",
    notes:
      "Claim listing. Add high-quality photos, complete all business attributes, and respond to every review within 24 hours.",
  },
  {
    name: "Bing Places",
    url: "https://www.bingplaces.com",
    priority: "high",
    notes:
      "Can import directly from Google Business Profile. Verify NAP matches exactly. Add photos and categories.",
  },
  {
    name: "Apple Maps",
    url: "https://mapsconnect.apple.com",
    priority: "high",
    notes:
      "Claim via Apple Business Connect. Add photos, hours, and ensure address pin is accurate on the map.",
  },
  {
    name: "Healthgrades",
    url: "https://www.healthgrades.com",
    priority: "high",
    notes:
      "Claim Dr. Landfield's provider profile. Link to clinic. Add specialties, credentials, and board certifications.",
  },
  {
    name: "RealSelf",
    url: "https://www.realself.com",
    priority: "high",
    notes:
      "Create provider profile. Add before/after photos, answer community questions, and list all aesthetic services.",
  },
  {
    name: "Zocdoc",
    url: "https://www.zocdoc.com",
    priority: "high",
    notes:
      "List Dr. Landfield and clinic. Enable online booking. Add insurance info if applicable and complete provider bio.",
  },
  {
    name: "Facebook",
    url: "https://www.facebook.com/business",
    priority: "high",
    notes:
      "Create or claim business page. NAP must match exactly. Add services, hours, photos, and enable reviews and messaging.",
  },
  {
    name: "Vitals",
    url: "https://www.vitals.com",
    priority: "medium",
    notes:
      "Claim Dr. Landfield's profile. Add clinic affiliation, specialties, and ensure contact info matches NAP exactly.",
  },
  {
    name: "WebMD",
    url: "https://doctor.webmd.com",
    priority: "medium",
    notes:
      "Claim physician directory listing. Add credentials, specialties, and link to clinic website.",
  },
  {
    name: "Better Business Bureau (BBB)",
    url: "https://www.bbb.org",
    priority: "medium",
    notes:
      "Apply for accreditation. Complete business profile with NAP, services, and hours. Respond to any complaints promptly.",
  },
  {
    name: "Yellow Pages",
    url: "https://www.yellowpages.com",
    priority: "medium",
    notes:
      "Claim or create listing. Add categories: Medical Spa, Skin Care, Day Spa. Ensure NAP consistency.",
  },
  {
    name: "Manta",
    url: "https://www.manta.com",
    priority: "medium",
    notes:
      "Create free business profile. Add business description, categories, hours, and ensure NAP matches.",
  },
  {
    name: "MapQuest",
    url: "https://www.mapquest.com",
    priority: "medium",
    notes:
      "Add or claim listing via Yext or directly. Verify map pin accuracy and NAP consistency.",
  },
  {
    name: "Foursquare",
    url: "https://business.foursquare.com",
    priority: "medium",
    notes:
      "Claim venue. Add categories, hours, photos, and tips. Foursquare data feeds many other apps and directories.",
  },
  {
    name: "CitySearch",
    url: "https://www.citysearch.com",
    priority: "low",
    notes:
      "Create listing with NAP, description, and categories. Lower traffic but contributes to citation consistency.",
  },
  {
    name: "Superpages",
    url: "https://www.superpages.com",
    priority: "low",
    notes:
      "Add or claim business listing. Include full NAP, categories, and business description.",
  },
  {
    name: "Hotfrog",
    url: "https://www.hotfrog.com",
    priority: "low",
    notes:
      "Create free profile. Add business description, keywords, and NAP. Good for citation diversity.",
  },
  {
    name: "Brownbook",
    url: "https://www.brownbook.net",
    priority: "low",
    notes:
      "Free global business listing. Add NAP, website, categories, and a short description.",
  },
  {
    name: "EZLocal",
    url: "https://www.ezlocal.com",
    priority: "low",
    notes:
      "Submit free listing with NAP, description, and categories. Simple directory for citation building.",
  },
  {
    name: "ShowMeLocal",
    url: "https://www.showmelocal.com",
    priority: "low",
    notes:
      "Create free listing. Add NAP, business hours, description, and service categories.",
  },
  {
    name: "USCity.net",
    url: "https://www.uscity.net",
    priority: "low",
    notes:
      "Add business to Renton, WA directory. Include NAP, description, and link to website.",
  },
  {
    name: "Merchant Circle",
    url: "https://www.merchantcircle.com",
    priority: "low",
    notes:
      "Create free profile. Add NAP, services, photos, and business description. Enables customer reviews.",
  },
  {
    name: "Local.com",
    url: "https://www.local.com",
    priority: "low",
    notes:
      "Submit business listing with NAP and categories. Feeds data to several smaller local directories.",
  },
  {
    name: "DexKnows",
    url: "https://www.dexknows.com",
    priority: "low",
    notes:
      "Add or claim listing. Include full NAP, business categories, and description. Part of the Thryv network.",
  },
];
