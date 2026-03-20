export interface SideEffectsPage {
  slug: string;
  treatment: string;
  serviceSlug: string;
  basePath: "services" | "wellness";
  metaTitle: string;
  metaDescription: string;
  heroDescription: string;
  commonSideEffects: {
    effect: string;
    duration: string;
    severity: "mild" | "moderate";
    management: string;
  }[];
  rareSideEffects: string[];
  whenToSeekHelp: string[];
  preventionTips: string[];
  faqs: { question: string; answer: string }[];
}

export const sideEffectsPages: SideEffectsPage[] = [
  {
    slug: "botox-side-effects",
    treatment: "Botox & Dysport",
    serviceSlug: "botox-dysport",
    basePath: "services",
    metaTitle: "Botox Side Effects | What to Expect After Treatment",
    metaDescription:
      "Learn about common Botox and Dysport side effects, how long they last, and when to contact your provider. Physician-supervised care at Rani Beauty Clinic in Renton, WA.",
    heroDescription:
      "Botox and Dysport are FDA-approved neuromodulators with a well-established safety profile. Side effects are typically mild and resolve within days. At Rani Beauty Clinic, all injectable treatments are performed under the supervision of Dr. Alexander Landfield, Board-Certified Neurologist, ensuring the highest standard of patient safety.",
    commonSideEffects: [
      {
        effect: "Injection site redness",
        duration: "1–4 hours",
        severity: "mild",
        management:
          "Apply a cold compress for 10–15 minutes. Avoid rubbing or massaging the treated area.",
      },
      {
        effect: "Minor bruising at injection sites",
        duration: "3–7 days",
        severity: "mild",
        management:
          "Apply arnica gel or cream to the area. Avoid blood-thinning medications and supplements (aspirin, ibuprofen, fish oil, vitamin E) for 48 hours prior to treatment.",
      },
      {
        effect: "Mild headache",
        duration: "24–48 hours",
        severity: "mild",
        management:
          "Take acetaminophen (Tylenol) as needed. Stay hydrated and rest. Headaches are more common after first-time treatments.",
      },
      {
        effect: "Localized swelling",
        duration: "1–3 days",
        severity: "mild",
        management:
          "Intermittent cold compresses for the first 24 hours. Keep the head elevated. Swelling is typically minimal and resolves quickly.",
      },
      {
        effect: "Temporary tenderness at injection points",
        duration: "1–2 days",
        severity: "mild",
        management:
          "Avoid touching or pressing on treated areas. The tenderness resolves on its own without intervention.",
      },
    ],
    rareSideEffects: [
      "Eyelid drooping (ptosis) — occurs in fewer than 1% of patients and resolves in 2–4 weeks",
      "Asymmetric results requiring a follow-up adjustment",
      "Flu-like symptoms within the first 24 hours",
      "Temporary heaviness in the forehead region",
      "Dry eyes or excessive tearing (when treating the eye area)",
    ],
    whenToSeekHelp: [
      "Difficulty swallowing, speaking, or breathing (seek emergency care immediately)",
      "Vision changes including double vision or blurred vision",
      "Significant eyelid drooping that affects daily activities",
      "Signs of allergic reaction: hives, widespread rash, or facial swelling beyond the treated area",
      "Muscle weakness in areas away from the injection site",
    ],
    preventionTips: [
      "Avoid blood-thinning medications and supplements for 48 hours before treatment (consult your prescribing physician before stopping any medication)",
      "Do not rub, massage, or apply pressure to treated areas for 4 hours post-treatment",
      "Remain upright for at least 4 hours after injections — do not lie flat or bend forward",
      "Avoid strenuous exercise, saunas, and hot tubs for 24 hours after treatment",
      "Disclose all medications, supplements, and medical conditions during your consultation",
      "Choose a provider with advanced neurotoxin training — Rani Beauty Clinic operates under the medical direction of a Board-Certified Neurologist",
    ],
    faqs: [
      {
        question: "Does Botox hurt during injection?",
        answer:
          "Most patients describe Botox injections as a brief pinch or slight sting lasting 1–2 seconds per injection point. The needles used are ultra-fine (30–32 gauge), and the procedure typically takes 10–15 minutes with minimal discomfort. At Rani Beauty Clinic, topical numbing cream or ice can be applied before treatment for patients who are sensitive to needles.",
      },
      {
        question: "How long does Botox bruising last?",
        answer:
          "Bruising from Botox injections typically resolves within 3–7 days. The likelihood of bruising can be minimized by avoiding aspirin, ibuprofen, fish oil, vitamin E, and alcohol for 48 hours before treatment. Applying arnica gel after the procedure can also help reduce bruising. Most patients experience little to no visible bruising.",
      },
      {
        question: "Can Botox cause headaches?",
        answer:
          "Mild headaches can occur after Botox treatment, particularly in first-time patients, and typically resolve within 24–48 hours. Acetaminophen (Tylenol) and adequate hydration usually provide relief. Notably, Botox is also FDA-approved to treat chronic migraines, and many patients report fewer headaches after regular neuromodulator treatments.",
      },
      {
        question: "What happens if Botox migrates to the wrong area?",
        answer:
          "Botox migration is uncommon when administered by experienced providers using proper technique. If it occurs, the most common effect is temporary eyelid drooping (ptosis), which resolves within 2–4 weeks. To minimize this risk, patients should avoid rubbing the treated area for 4 hours and remain upright after treatment. At Rani Beauty Clinic, all neuromodulator treatments are overseen by Dr. Alexander Landfield, Board-Certified Neurologist.",
      },
      {
        question: "Are Botox side effects different from Dysport side effects?",
        answer:
          "Botox (onabotulinumtoxinA) and Dysport (abobotulinumtoxinA) share the same class of active ingredient and have similar side effect profiles. Both may cause temporary redness, swelling, bruising, and mild headache. Dysport tends to diffuse slightly more, which can be advantageous for larger treatment areas like the forehead but requires precise dosing. Your provider will recommend the best option based on your anatomy and treatment goals.",
      },
    ],
  },
  {
    slug: "laser-hair-removal-side-effects",
    treatment: "Laser Hair Removal",
    serviceSlug: "laser-hair-removal",
    basePath: "services",
    metaTitle: "Laser Hair Removal Side Effects | What to Know",
    metaDescription:
      "Understand laser hair removal side effects including redness, swelling, and skin sensitivity. Expert guidance from Rani Beauty Clinic in Renton, WA.",
    heroDescription:
      "Laser hair removal is a safe and effective method for long-term hair reduction when performed by trained clinicians using appropriate technology. Side effects are generally mild and temporary. Rani Beauty Clinic uses advanced laser systems with multiple wavelengths to safely treat all skin types under physician supervision.",
    commonSideEffects: [
      {
        effect: "Redness and mild swelling (perifollicular edema)",
        duration: "2–24 hours",
        severity: "mild",
        management:
          "Apply a cold compress or aloe vera gel to soothe the treated area. Redness resembling a mild sunburn is a normal response indicating effective follicle targeting.",
      },
      {
        effect: "Skin sensitivity and warmth",
        duration: "1–3 hours",
        severity: "mild",
        management:
          "Avoid hot water, direct sun, and fragranced products on the treated area for 24 hours. Wear loose, breathable clothing over treated skin.",
      },
      {
        effect: "Temporary skin darkening (hyperpigmentation)",
        duration: "1–4 weeks",
        severity: "moderate",
        management:
          "Apply broad-spectrum SPF 30+ sunscreen daily. Avoid sun exposure and tanning for at least 2 weeks before and after treatment. Pigmentation changes typically resolve without intervention.",
      },
      {
        effect: "Mild follicular bumps",
        duration: "1–3 days",
        severity: "mild",
        management:
          "These small bumps around hair follicles are a normal response. Apply a gentle moisturizer and avoid picking or scratching the area.",
      },
    ],
    rareSideEffects: [
      "Blistering or crusting — more common when skin is tanned or settings are too aggressive",
      "Temporary skin lightening (hypopigmentation) — more common in darker skin tones",
      "Paradoxical hypertrichosis (increased hair growth) — rare, typically on the face or neck",
      "Scarring — extremely rare with proper laser settings and technique",
      "Infection — rare; maintain clean, moisturized skin post-treatment",
    ],
    whenToSeekHelp: [
      "Blistering, open wounds, or crusting that does not improve within 48 hours",
      "Signs of infection: increasing redness, pus, warmth, or fever",
      "Significant skin color changes that persist beyond 4 weeks",
      "Burns or intense pain that continues after the first 24 hours",
      "Any reaction that seems unusual or worsening over time",
    ],
    preventionTips: [
      "Avoid sun exposure, tanning beds, and self-tanners for at least 2 weeks before treatment",
      "Shave (do not wax or pluck) the treatment area 24 hours prior to your session",
      "Discontinue retinoids and exfoliating acids 5–7 days before laser treatment",
      "Disclose all medications, especially photosensitizing drugs (doxycycline, isotretinoin)",
      "Ensure your provider selects the appropriate wavelength and settings for your skin type",
      "Apply SPF 30+ sunscreen daily between sessions to reduce pigmentation risk",
    ],
    faqs: [
      {
        question: "Can laser hair removal cause burns?",
        answer:
          "Burns from laser hair removal are uncommon when treatment is performed by trained clinicians using the correct settings for a patient's skin type and hair color. Risk factors include recent sun exposure, tanned skin, and use of photosensitizing medications. At Rani Beauty Clinic, a skin type assessment is performed before every session, and laser parameters are adjusted accordingly to maximize safety.",
      },
      {
        question: "Is laser hair removal safe for dark skin?",
        answer:
          "Laser hair removal is safe for all skin types when the appropriate laser technology is used. Nd:YAG 1064nm lasers are specifically designed for darker skin tones (Fitzpatrick IV–VI) because the longer wavelength bypasses melanin in the skin to target the hair follicle directly. Rani Beauty Clinic uses multi-wavelength laser systems to safely and effectively treat patients of all skin types.",
      },
      {
        question: "How long does redness last after laser hair removal?",
        answer:
          "Mild redness and slight swelling around the treated hair follicles typically resolve within 2–24 hours. The reaction is similar to a mild sunburn and indicates that the laser effectively targeted the follicles. Applying a cold compress and aloe-based gel can help reduce redness. If redness persists beyond 48 hours, contact the clinic.",
      },
      {
        question: "Does laser hair removal cause ingrown hairs?",
        answer:
          "Laser hair removal actually reduces ingrown hairs over time by destroying the hair follicle, preventing the hair from growing back and curling under the skin. During the shedding phase (1–3 weeks after treatment), some patients may notice temporary bumps that can resemble ingrown hairs, but these resolve as treated hairs are expelled from the follicles.",
      },
      {
        question: "Can laser hair removal cause permanent skin damage?",
        answer:
          "Permanent skin damage from laser hair removal is extremely rare when the procedure is performed by qualified professionals using FDA-cleared devices with appropriate settings. Temporary side effects such as redness, swelling, and pigmentation changes are common and resolve on their own. Rani Beauty Clinic operates under physician supervision with advanced laser systems calibrated for each patient's skin type.",
      },
    ],
  },
  {
    slug: "hydrafacial-side-effects",
    treatment: "HydraFacial",
    serviceSlug: "hydrafacial",
    basePath: "services",
    metaTitle: "HydraFacial Side Effects | What to Expect",
    metaDescription:
      "Learn about HydraFacial side effects, skin reactions, and recovery. Minimal downtime facial treatment at Rani Beauty Clinic in Renton, WA.",
    heroDescription:
      "The HydraFacial is one of the gentlest professional facial treatments available, combining cleansing, extraction, and hydration in a single session. Side effects are minimal and the treatment is suitable for nearly all skin types. Rani Beauty Clinic offers physician-supervised HydraFacial treatments customized to each patient's skin concerns.",
    commonSideEffects: [
      {
        effect: "Mild redness and flushing",
        duration: "30 minutes to 2 hours",
        severity: "mild",
        management:
          "No treatment is typically needed. Redness fades quickly and most patients return to normal activities immediately. A soothing serum is applied at the end of the treatment.",
      },
      {
        effect: "Slight skin tightness",
        duration: "1–4 hours",
        severity: "mild",
        management:
          "Apply a gentle, hydrating moisturizer. The tightness is a normal response to deep cleansing and exfoliation and resolves as the skin rehydrates.",
      },
      {
        effect: "Minor tingling during treatment",
        duration: "During procedure only",
        severity: "mild",
        management:
          "Tingling is a normal sensation caused by the exfoliating acids and suction. Inform your clinician if discomfort exceeds a mild level so settings can be adjusted.",
      },
    ],
    rareSideEffects: [
      "Breakout or purging — existing congestion may surface in the days following treatment",
      "Allergic reaction to serums or boosters used during the procedure",
      "Temporary increase in skin sensitivity",
      "Minor bruising from the suction device (typically in patients on blood thinners)",
    ],
    whenToSeekHelp: [
      "Persistent redness, swelling, or irritation lasting more than 24 hours",
      "Signs of allergic reaction: hives, itching, or rash spreading beyond the treated area",
      "Blistering or open sores on the treated skin",
      "Unusual pain or burning sensation after the treatment",
    ],
    preventionTips: [
      "Inform your clinician of any product allergies or skin sensitivities before treatment",
      "Avoid retinoids, chemical exfoliants, and physical scrubs for 48 hours before and after",
      "Apply SPF 30+ sunscreen after treatment, as freshly exfoliated skin is more photosensitive",
      "Stay hydrated before and after the procedure to support skin recovery",
      "Avoid waxing, laser treatments, or chemical peels within 2 weeks of a HydraFacial",
    ],
    faqs: [
      {
        question: "Does HydraFacial cause breakouts?",
        answer:
          "Some patients experience minor breakouts in the 1–3 days following a HydraFacial. This is known as a purging response, where the deep extraction brings existing congestion to the surface. Purging is temporary and typically resolves within a few days, leaving the skin clearer than before. It is more common in patients with oily or acne-prone skin.",
      },
      {
        question: "Is HydraFacial safe for sensitive skin?",
        answer:
          "The HydraFacial is considered one of the safest professional facials for sensitive skin. The vortex suction technology is gentler than manual extractions, and the treatment can be customized with calming serums and boosters. At Rani Beauty Clinic, clinicians adjust the intensity and serum selection based on each patient's skin type and sensitivity level.",
      },
      {
        question: "How long does redness last after a HydraFacial?",
        answer:
          "Redness from a HydraFacial is typically very mild and resolves within 30 minutes to 2 hours. Most patients have no visible redness and can return to work or social activities immediately after the treatment. The HydraFacial is often called a lunchtime facial due to its minimal downtime.",
      },
      {
        question: "Can you wear makeup after a HydraFacial?",
        answer:
          "It is recommended to wait at least 6 hours before applying makeup after a HydraFacial to allow the skin to fully absorb the serums and recover from exfoliation. Mineral-based makeup is preferred when resuming application. The freshly treated skin benefits most from remaining product-free for the remainder of the treatment day.",
      },
      {
        question: "Are there any long-term side effects of HydraFacial?",
        answer:
          "There are no known long-term adverse effects from HydraFacial treatments. The procedure is non-invasive and does not damage the skin barrier when performed at appropriate intervals (typically every 4–6 weeks). Regular HydraFacial treatments can improve skin texture, reduce pore congestion, and enhance overall skin health over time.",
      },
    ],
  },
  {
    slug: "rf-microneedling-side-effects",
    treatment: "RF Microneedling",
    serviceSlug: "rf-microneedling",
    basePath: "services",
    metaTitle: "RF Microneedling Side Effects | Recovery Guide",
    metaDescription:
      "RF microneedling side effects, recovery timeline, and aftercare tips. Learn what to expect from radiofrequency microneedling at Rani Beauty Clinic, Renton, WA.",
    heroDescription:
      "RF microneedling combines traditional microneedling with radiofrequency energy to stimulate collagen production and improve skin texture. While the treatment is more intensive than a standard facial, side effects are predictable and manageable. Rani Beauty Clinic performs all RF microneedling procedures under physician supervision with advanced technology calibrated for each patient's skin type and goals.",
    commonSideEffects: [
      {
        effect: "Redness (erythema)",
        duration: "1–3 days",
        severity: "moderate",
        management:
          "Apply a gentle, fragrance-free moisturizer and avoid direct sun. Redness resembles a moderate sunburn and progressively fades. Mineral sunscreen (SPF 30+) should be applied when going outdoors.",
      },
      {
        effect: "Swelling, especially around the eyes and cheeks",
        duration: "1–3 days",
        severity: "moderate",
        management:
          "Use a cold compress intermittently for the first 24 hours. Sleep with the head slightly elevated to reduce fluid retention. Swelling typically peaks on day 1 and resolves by day 3.",
      },
      {
        effect: "Skin dryness and flaking",
        duration: "3–7 days",
        severity: "mild",
        management:
          "Keep the skin well-moisturized with a hyaluronic acid serum or barrier repair cream. Do not pick or peel flaking skin, as this can cause scarring or hyperpigmentation.",
      },
      {
        effect: "Pin-point bleeding during treatment",
        duration: "During procedure only",
        severity: "mild",
        management:
          "Minor bleeding from the micro-channels is normal and stops within minutes. Post-procedure, the skin is cleaned and soothing products are applied by the clinician.",
      },
      {
        effect: "Skin sensitivity and warmth",
        duration: "1–2 days",
        severity: "mild",
        management:
          "Avoid hot water, active skincare ingredients (retinol, vitamin C, AHAs), and direct sun for 3–5 days. Treat the skin gently with minimal products.",
      },
    ],
    rareSideEffects: [
      "Post-inflammatory hyperpigmentation — more common in darker skin tones (Fitzpatrick IV–VI)",
      "Grid marks or track marks from the needles — typically fade within 1–2 weeks",
      "Infection — rare when post-care instructions are followed",
      "Prolonged redness lasting beyond 5 days",
      "Scarring — extremely rare with proper technique and aftercare",
    ],
    whenToSeekHelp: [
      "Redness, swelling, or pain that worsens after day 3 instead of improving",
      "Signs of infection: increasing warmth, pus, spreading redness, or fever",
      "Persistent grid or track marks that have not faded after 2 weeks",
      "Significant skin color changes (darkening or lightening) lasting beyond 4 weeks",
      "Blistering or open wounds in the treated area",
    ],
    preventionTips: [
      "Discontinue retinoids, AHAs, BHAs, and exfoliating products 5–7 days before treatment",
      "Avoid sun exposure and tanning for 2 weeks prior to treatment to reduce pigmentation risk",
      "Disclose any history of cold sores — antiviral medication may be prescribed prophylactically",
      "Follow all post-care instructions: keep skin clean, moisturized, and protected from sun",
      "Avoid makeup for at least 24 hours after treatment to prevent clogging micro-channels",
      "Do not exercise or sweat heavily for 24–48 hours post-treatment",
    ],
    faqs: [
      {
        question: "How painful is RF microneedling?",
        answer:
          "RF microneedling is generally well-tolerated with the application of topical numbing cream (applied 30–45 minutes before the procedure). Most patients describe the sensation as a warm, prickly feeling rather than sharp pain. Discomfort varies by treatment area, with the forehead and jawline being more sensitive. At Rani Beauty Clinic, numbing protocols are tailored to each patient's comfort level.",
      },
      {
        question: "How long does it take to recover from RF microneedling?",
        answer:
          "Most patients experience 2–3 days of visible redness and swelling, with complete social recovery by day 3–5. Skin may continue to feel slightly dry or sensitive for up to a week as the healing process stimulates new collagen production. Full results develop over 4–6 weeks as collagen remodeling occurs beneath the surface.",
      },
      {
        question: "Can RF microneedling cause scarring?",
        answer:
          "Scarring from RF microneedling is extremely rare when the procedure is performed by trained clinicians using FDA-cleared devices at appropriate settings. The micro-channels created during treatment are designed to heal completely and actually stimulate the skin's natural repair process. Patients with a history of keloid scarring should disclose this during consultation.",
      },
      {
        question: "Is RF microneedling safe for dark skin tones?",
        answer:
          "RF microneedling is generally safer for darker skin tones (Fitzpatrick IV–VI) than many laser treatments because the radiofrequency energy targets the deeper dermis rather than melanin in the epidermis. However, there is a slightly elevated risk of post-inflammatory hyperpigmentation. At Rani Beauty Clinic, treatment settings are carefully calibrated for each patient's skin type, and pre-treatment skin prep may be recommended.",
      },
      {
        question: "What should I avoid after RF microneedling?",
        answer:
          "For the first 24–48 hours, avoid makeup, active skincare (retinol, vitamin C, AHAs/BHAs), strenuous exercise, hot showers, saunas, and swimming pools. For the first week, avoid direct sun exposure and apply SPF 30+ sunscreen daily. Do not pick or peel flaking skin. Resume normal skincare gradually after 5–7 days or as directed by your clinician.",
      },
    ],
  },
  {
    slug: "dermal-fillers-side-effects",
    treatment: "Dermal Fillers",
    serviceSlug: "dermal-fillers",
    basePath: "services",
    metaTitle: "Dermal Filler Side Effects | Safety & Recovery",
    metaDescription:
      "Understand dermal filler side effects, swelling timeline, and when to seek help. Expert injectors at Rani Beauty Clinic in Renton, WA.",
    heroDescription:
      "Dermal fillers are FDA-approved injectable treatments used to restore volume, smooth wrinkles, and enhance facial contours. Side effects are generally mild and temporary when administered by experienced providers. At Rani Beauty Clinic, all filler treatments are performed under the medical direction of Dr. Alexander Landfield, Board-Certified Neurologist, with a focus on natural-looking results and patient safety.",
    commonSideEffects: [
      {
        effect: "Swelling at injection sites",
        duration: "2–7 days",
        severity: "moderate",
        management:
          "Apply cold compresses intermittently for the first 48 hours. Swelling is most pronounced in the first 24–48 hours and gradually subsides. Lip filler swelling may take up to 2 weeks to fully resolve.",
      },
      {
        effect: "Bruising",
        duration: "5–10 days",
        severity: "moderate",
        management:
          "Apply arnica gel to affected areas. Avoid blood-thinning medications and supplements for 48 hours before treatment. Bruising can be concealed with makeup after 24 hours.",
      },
      {
        effect: "Redness at injection points",
        duration: "1–3 days",
        severity: "mild",
        management:
          "No treatment typically needed. Redness resolves on its own. Avoid touching or massaging the area unless instructed by your provider.",
      },
      {
        effect: "Tenderness and soreness",
        duration: "3–7 days",
        severity: "mild",
        management:
          "Acetaminophen (Tylenol) can be taken for discomfort. Avoid pressing on the treated area. Tenderness is normal and indicates the filler is settling.",
      },
      {
        effect: "Firmness or lumpiness in the treated area",
        duration: "1–4 weeks",
        severity: "mild",
        management:
          "Minor irregularities often smooth out as the filler integrates with the tissue. Your provider may recommend gentle massage in specific cases. Do not self-massage without instruction.",
      },
    ],
    rareSideEffects: [
      "Vascular occlusion — a serious complication where filler blocks a blood vessel (requires immediate treatment with hyaluronidase)",
      "Tyndall effect — a bluish discoloration when filler is placed too superficially",
      "Granulomas — small inflammatory nodules that may develop weeks to months after treatment",
      "Asymmetry requiring a follow-up adjustment",
      "Infection at the injection site",
      "Delayed hypersensitivity reaction",
    ],
    whenToSeekHelp: [
      "Severe or increasing pain that does not respond to acetaminophen",
      "Skin blanching (whitening), dusky discoloration, or mottled appearance near the injection site — this may indicate vascular compromise and requires urgent medical attention",
      "Vision changes or eye pain after any facial filler treatment — seek emergency care immediately",
      "Signs of infection: worsening redness, warmth, pus, or fever",
      "Hard lumps or nodules that do not soften after 4 weeks",
      "Skin necrosis (tissue death) — darkening or blackening of the skin near injection sites",
    ],
    preventionTips: [
      "Choose a provider experienced in facial anatomy and vascular safety — Rani Beauty Clinic operates under Board-Certified physician supervision",
      "Avoid aspirin, ibuprofen, fish oil, vitamin E, and alcohol for 48 hours before treatment to reduce bruising risk",
      "Disclose all previous filler treatments, even those performed at other clinics",
      "Do not apply pressure to treated areas or sleep face-down for the first 2 nights",
      "Avoid dental procedures for 2 weeks after filler treatment to reduce infection risk",
      "Follow all post-treatment instructions provided by your injector",
    ],
    faqs: [
      {
        question: "How long does filler swelling last?",
        answer:
          "Swelling from dermal fillers typically peaks within 24–48 hours and subsides significantly by day 3–5. Full resolution may take 1–2 weeks, particularly for lip fillers, which tend to swell more than other areas. Cold compresses, head elevation while sleeping, and avoiding salty foods can help reduce swelling. Final results are best assessed 2–4 weeks after treatment.",
      },
      {
        question: "Can dermal fillers be dissolved if I don't like the results?",
        answer:
          "Hyaluronic acid (HA) fillers — the most commonly used type — can be dissolved with an enzyme called hyaluronidase. The dissolving agent breaks down the filler within 24–48 hours. Non-HA fillers (such as calcium hydroxylapatite) cannot be dissolved enzymatically. At Rani Beauty Clinic, hyaluronidase is always available on-site as a safety measure.",
      },
      {
        question: "Do fillers cause lumps under the skin?",
        answer:
          "Minor firmness or small lumps are common in the first 1–2 weeks as the filler settles into the tissue. These typically smooth out on their own. If lumps persist beyond 4 weeks, your provider may recommend gentle massage or, in some cases, hyaluronidase to dissolve localized irregularities. Choosing an experienced injector significantly reduces the risk of persistent lumps.",
      },
      {
        question: "What is the most dangerous side effect of dermal fillers?",
        answer:
          "The most serious complication is vascular occlusion, where filler inadvertently blocks a blood vessel. Warning signs include intense pain, skin blanching (whitening), or a dusky, mottled appearance. If untreated, this can lead to tissue necrosis. In extremely rare cases involving the eye area, vision impairment has been reported. Rani Beauty Clinic prioritizes vascular safety protocols, with hyaluronidase available on-site for immediate intervention.",
      },
      {
        question: "How soon can I wear makeup after fillers?",
        answer:
          "It is recommended to wait at least 12–24 hours before applying makeup to filler injection sites. This allows the micro-puncture wounds to close and reduces the risk of introducing bacteria. When resuming makeup, use clean brushes and avoid heavy pressure over treated areas. Mineral-based makeup is preferred for the first application.",
      },
    ],
  },
  {
    slug: "chemical-peels-side-effects",
    treatment: "Chemical Peels",
    serviceSlug: "chemical-peels",
    basePath: "services",
    metaTitle: "Chemical Peel Side Effects | What to Expect",
    metaDescription:
      "Chemical peel side effects, peeling timeline, and recovery tips. Safe, physician-supervised peels at Rani Beauty Clinic in Renton, WA.",
    heroDescription:
      "Chemical peels use controlled exfoliation to improve skin texture, tone, and clarity. Side effects vary based on the depth of the peel — superficial, medium, or deep. At Rani Beauty Clinic, chemical peels are performed under physician supervision with a thorough skin assessment to select the appropriate peel type and strength for each patient.",
    commonSideEffects: [
      {
        effect: "Redness and flushing",
        duration: "1–7 days (depends on peel depth)",
        severity: "moderate",
        management:
          "Apply a gentle, fragrance-free moisturizer and mineral sunscreen. Superficial peels may produce redness lasting only a few hours; medium-depth peels may cause redness for 5–7 days.",
      },
      {
        effect: "Peeling, flaking, and skin shedding",
        duration: "3–10 days",
        severity: "moderate",
        management:
          "Do not pick, pull, or peel flaking skin — this can cause scarring and hyperpigmentation. Allow dead skin to shed naturally. Keep the skin moisturized with a barrier repair cream.",
      },
      {
        effect: "Dryness and tightness",
        duration: "5–10 days",
        severity: "mild",
        management:
          "Apply hyaluronic acid serum followed by a rich moisturizer multiple times daily. Avoid active skincare ingredients until peeling is complete.",
      },
      {
        effect: "Mild stinging or burning sensation",
        duration: "During application and 1–4 hours after",
        severity: "mild",
        management:
          "A fan or cool compress can relieve discomfort during the procedure. Post-peel, the sensation resolves as the skin's pH normalizes. Notify your clinician if the burning becomes intense.",
      },
    ],
    rareSideEffects: [
      "Post-inflammatory hyperpigmentation — more common in darker skin tones and without adequate sun protection",
      "Hypopigmentation (lightening) — more common with deeper peels",
      "Scarring — rare with appropriate peel selection and aftercare",
      "Infection (bacterial, viral, or fungal) — risk increases with medium and deep peels",
      "Cold sore reactivation (herpes simplex) — patients with a history should take prophylactic antivirals",
    ],
    whenToSeekHelp: [
      "Severe swelling, blistering, or crusting that does not improve after 48 hours",
      "Signs of infection: increasing redness, warmth, pus, or fever",
      "Cold sore outbreak after the peel (contact the clinic for antiviral medication)",
      "Skin color changes that persist beyond 4–6 weeks",
      "Scarring or raised tissue developing in the treated area",
    ],
    preventionTips: [
      "Discontinue retinoids, AHAs, BHAs, and exfoliating products 5–7 days before the peel",
      "Avoid sun exposure and tanning for at least 2 weeks before treatment",
      "Disclose any history of cold sores so prophylactic antiviral medication can be prescribed",
      "Do not pick, scratch, or peel flaking skin — allow it to shed naturally",
      "Apply SPF 30+ mineral sunscreen daily during the peeling process and for 4 weeks after",
      "Stay hydrated and keep the skin well-moisturized throughout recovery",
    ],
    faqs: [
      {
        question: "How long does a chemical peel take to heal?",
        answer:
          "Healing time depends on the depth of the peel. Superficial peels (glycolic, lactic acid) typically heal within 1–3 days with minimal visible peeling. Medium-depth peels (TCA, VI Peel) involve 5–7 days of peeling and 7–10 days for full recovery. Deep peels require 10–14 days of recovery. At Rani Beauty Clinic, the peel type and depth are selected based on each patient's skin concerns, type, and tolerance.",
      },
      {
        question: "Do chemical peels cause permanent skin damage?",
        answer:
          "Chemical peels performed by trained clinicians at appropriate depths and concentrations do not cause permanent skin damage. In fact, peels are designed to promote skin renewal by removing damaged outer layers and stimulating collagen production. Risks increase when peels are performed too frequently, at inappropriate depths, or without proper aftercare. Physician supervision ensures safe peel selection.",
      },
      {
        question: "Can I wear makeup after a chemical peel?",
        answer:
          "Makeup should be avoided for at least 24–48 hours after a superficial peel and 5–7 days after a medium-depth peel, or until visible peeling has stopped. Applying makeup to actively peeling skin can irritate the new skin underneath and increase infection risk. When resuming, use clean mineral-based products and gentle application.",
      },
      {
        question: "Are chemical peels safe for dark skin?",
        answer:
          "Chemical peels can be safely performed on darker skin tones (Fitzpatrick IV–VI) with careful peel selection and preparation. Superficial peels with mandelic acid or lactic acid are preferred, as they carry a lower risk of post-inflammatory hyperpigmentation. Pre-treatment with melanin-inhibiting agents and strict sun protection post-treatment are essential. At Rani Beauty Clinic, peel protocols are customized for each patient's skin type.",
      },
      {
        question: "Why is my skin darker after a chemical peel?",
        answer:
          "Temporary darkening of treated skin is a normal part of the peeling process — the old, damaged skin darkens before it sheds to reveal the new skin underneath. This is different from post-inflammatory hyperpigmentation (PIH), which is a prolonged darkening that can occur when post-care instructions (especially sun protection) are not followed. If darkening persists beyond the peeling period, contact the clinic for evaluation.",
      },
    ],
  },
  {
    slug: "glp1-side-effects",
    treatment: "GLP-1 Weight Management",
    serviceSlug: "glp1-weight-management",
    basePath: "wellness",
    metaTitle: "GLP-1 Side Effects | Weight Loss Injection Guide",
    metaDescription:
      "Understand GLP-1 injection side effects for weight management including nausea, appetite changes, and digestive effects. Physician-supervised at Rani Beauty Clinic.",
    heroDescription:
      "GLP-1 receptor agonist injections are FDA-approved medications used for weight management under medical supervision. Side effects are most common during the initial dose escalation period and typically improve as the body adjusts. At Rani Beauty Clinic, GLP-1 weight management programs are medically supervised by Dr. Alexander Landfield, Board-Certified Neurologist, with individualized dosing protocols designed to minimize side effects.",
    commonSideEffects: [
      {
        effect: "Nausea",
        duration: "1–4 weeks (improves with continued use)",
        severity: "moderate",
        management:
          "Eat smaller, more frequent meals. Avoid fatty, greasy, or spicy foods. Stay hydrated. Nausea is most common during the initial dose escalation and typically subsides as the body adjusts to the medication.",
      },
      {
        effect: "Decreased appetite",
        duration: "Ongoing (therapeutic effect)",
        severity: "mild",
        management:
          "This is an intended effect of the medication. Focus on nutrient-dense foods to ensure adequate nutrition despite reduced hunger. Your provider will monitor nutritional status during check-ins.",
      },
      {
        effect: "Constipation or diarrhea",
        duration: "1–4 weeks",
        severity: "mild",
        management:
          "Increase water intake and dietary fiber. For constipation, a gentle over-the-counter stool softener may be used. For diarrhea, a bland diet (BRAT: bananas, rice, applesauce, toast) can help. Symptoms typically improve with continued use.",
      },
      {
        effect: "Injection site reactions (redness, itching, mild pain)",
        duration: "1–3 days",
        severity: "mild",
        management:
          "Rotate injection sites between the abdomen, thigh, and upper arm. Clean the site with an alcohol swab before injection. A cold compress can relieve localized discomfort.",
      },
      {
        effect: "Fatigue and dizziness",
        duration: "1–2 weeks",
        severity: "mild",
        management:
          "Stay well-hydrated and maintain adequate caloric intake. Avoid skipping meals entirely. Dizziness may occur as the body adjusts to reduced food intake and possible changes in blood sugar levels.",
      },
    ],
    rareSideEffects: [
      "Pancreatitis — severe, persistent abdominal pain radiating to the back (seek emergency care)",
      "Gallbladder disease — rapid weight loss can increase gallstone risk",
      "Gastroparesis (delayed stomach emptying) — persistent fullness, bloating, or vomiting",
      "Hypoglycemia — more common in patients also taking insulin or sulfonylureas",
      "Allergic reaction — hives, facial swelling, difficulty breathing",
      "Changes in heart rate",
    ],
    whenToSeekHelp: [
      "Severe, persistent abdominal pain that radiates to the back (possible pancreatitis — seek emergency care)",
      "Persistent vomiting that prevents keeping food or liquids down for more than 24 hours",
      "Signs of severe dehydration: dark urine, dizziness upon standing, rapid heartbeat",
      "Symptoms of gallbladder issues: sharp right-sided upper abdominal pain, especially after eating",
      "Allergic reaction: hives, swelling of the face/throat, difficulty breathing",
      "Symptoms of hypoglycemia: shakiness, sweating, confusion, rapid heartbeat",
    ],
    preventionTips: [
      "Follow the gradual dose escalation schedule prescribed by your provider — do not increase the dose faster than recommended",
      "Eat slowly and stop eating when comfortably satisfied rather than full",
      "Avoid large, high-fat meals, which can worsen nausea and gastrointestinal symptoms",
      "Stay hydrated — drink at least 64 ounces of water daily",
      "Attend all scheduled check-ins so your provider can adjust dosing and monitor for side effects",
      "Report any new or worsening symptoms promptly to your medical team",
    ],
    faqs: [
      {
        question: "How long does GLP-1 nausea last?",
        answer:
          "Nausea from GLP-1 injections is most common during the first 2–4 weeks of treatment, particularly during dose escalation phases. For most patients, nausea diminishes significantly as the body adjusts to the medication. Eating smaller, more frequent meals, avoiding fatty foods, and staying hydrated can help manage nausea. At Rani Beauty Clinic, dosing is gradually increased to minimize gastrointestinal side effects.",
      },
      {
        question: "Can GLP-1 injections cause hair loss?",
        answer:
          "Some patients report hair thinning during rapid weight loss, which is a condition called telogen effluvium. This is related to the weight loss itself rather than the GLP-1 medication directly. The hair thinning is typically temporary and resolves as weight stabilizes. Ensuring adequate protein intake (at least 60–80 grams daily) and proper nutrition can help minimize hair shedding during the weight loss phase.",
      },
      {
        question: "Is it safe to drink alcohol while taking GLP-1 medication?",
        answer:
          "Alcohol should be consumed in moderation or avoided while on GLP-1 medication. Alcohol can worsen nausea and gastrointestinal side effects, increase the risk of hypoglycemia (low blood sugar), and add empty calories that may counteract weight management goals. Patients should discuss alcohol consumption with their prescribing provider.",
      },
      {
        question: "What happens if I stop taking GLP-1 injections?",
        answer:
          "If GLP-1 medication is discontinued, appetite and hunger signals typically return to pre-treatment levels. Many patients may experience weight regain without continued lifestyle modifications. At Rani Beauty Clinic, the weight management program includes nutritional guidance and behavioral strategies to help patients maintain results if and when they transition off the medication.",
      },
      {
        question: "Do GLP-1 injections affect muscle mass?",
        answer:
          "Rapid weight loss from any method, including GLP-1 therapy, can result in some loss of lean muscle mass in addition to fat loss. This is why Rani Beauty Clinic's weight management program emphasizes adequate protein intake (at least 0.7–1 gram per pound of body weight) and regular resistance exercise to preserve muscle during the weight loss phase. Body composition is monitored throughout the program.",
      },
    ],
  },
  {
    slug: "sofwave-side-effects",
    treatment: "Sofwave",
    serviceSlug: "sofwave",
    basePath: "services",
    metaTitle: "Sofwave Side Effects | Skin Tightening Safety",
    metaDescription:
      "Learn about Sofwave skin tightening side effects, recovery time, and what to expect. Non-invasive treatment at Rani Beauty Clinic in Renton, WA.",
    heroDescription:
      "Sofwave is an FDA-cleared non-invasive skin tightening device that uses Synchronous Ultrasound Parallel Beam (SUPERB) technology to stimulate collagen production in the mid-dermis. Side effects are minimal compared to surgical alternatives. Rani Beauty Clinic offers Sofwave treatments under physician supervision for patients seeking non-surgical lifting and tightening of the face, neck, and body.",
    commonSideEffects: [
      {
        effect: "Redness and mild flushing",
        duration: "30 minutes to 4 hours",
        severity: "mild",
        management:
          "No treatment is typically necessary. Redness fades quickly and most patients can resume normal activities, including applying makeup, immediately after the session.",
      },
      {
        effect: "Mild tenderness in treated areas",
        duration: "1–3 days",
        severity: "mild",
        management:
          "Acetaminophen (Tylenol) can be taken if needed. Avoid firm pressure or massage on treated areas for 24 hours. Tenderness resolves on its own.",
      },
      {
        effect: "Temporary swelling",
        duration: "1–3 days",
        severity: "mild",
        management:
          "Apply a cold compress if desired. Swelling is typically subtle and resolves quickly. It may be more noticeable along the jawline and under the chin.",
      },
      {
        effect: "Warmth in the skin during and after treatment",
        duration: "1–2 hours",
        severity: "mild",
        management:
          "The warming sensation is from the ultrasound energy reaching the mid-dermis and is a normal part of the treatment process. It subsides shortly after the session ends.",
      },
    ],
    rareSideEffects: [
      "Temporary numbness or tingling in the treated area",
      "Mild bruising (uncommon)",
      "Temporary welts or raised areas along treatment lines — typically resolve within hours",
      "Nerve irritation — rare and temporary, resolving within days to weeks",
    ],
    whenToSeekHelp: [
      "Burns, blistering, or broken skin in the treated area",
      "Persistent pain that does not respond to over-the-counter pain relievers",
      "Numbness or tingling that persists beyond 2 weeks",
      "Signs of infection: increasing redness, warmth, swelling, or drainage",
      "Any reaction that seems unusual or is worsening over time",
    ],
    preventionTips: [
      "Arrive to your appointment with clean, product-free skin on the treatment area",
      "Disclose any active skin conditions, infections, or implants in the treatment area",
      "Communicate openly with your clinician about comfort level during the treatment — energy levels can be adjusted",
      "Apply SPF 30+ sunscreen daily after treatment, though no strict downtime is required",
      "Maintain realistic expectations — collagen remodeling results develop over 2–3 months",
    ],
    faqs: [
      {
        question: "How painful is Sofwave treatment?",
        answer:
          "Sofwave is designed with integrated cooling (Sofcool technology) that protects the skin surface and reduces discomfort. Most patients describe the sensation as a warm, pulsing feeling. Discomfort varies by treatment area, with bony areas (forehead, jawline) being more sensitive. No topical numbing is required for most patients, though it can be applied upon request. The procedure typically takes 30–45 minutes.",
      },
      {
        question: "Is there downtime after Sofwave?",
        answer:
          "Sofwave has minimal to no downtime. Most patients experience only mild redness lasting 30 minutes to a few hours. There is no peeling, bruising, or extended recovery period. Patients can return to work, apply makeup, and resume normal activities immediately after treatment. This makes Sofwave a popular option for patients who want skin tightening without the downtime of surgical procedures.",
      },
      {
        question: "How soon do you see results from Sofwave?",
        answer:
          "Some patients notice an initial tightening effect within the first few weeks, but the primary results develop gradually over 2–3 months as new collagen and elastin are produced in the treated tissue. Results continue to improve for up to 6 months. A single treatment session is typically sufficient, with results lasting 1–2 years depending on the individual's aging process and skin condition.",
      },
      {
        question: "Can Sofwave cause nerve damage?",
        answer:
          "Sofwave technology targets a specific depth in the mid-dermis (1.5mm) using parallel ultrasound beams, which is above the depth where major facial nerves are located. Temporary tingling or numbness has been reported in rare cases and resolves on its own within days to weeks. Permanent nerve damage from Sofwave has not been documented in clinical studies.",
      },
      {
        question: "Is Sofwave safe for all skin types?",
        answer:
          "Sofwave is FDA-cleared for all skin types (Fitzpatrick I–VI). Because the ultrasound energy bypasses the epidermis and targets the deeper dermis, it does not interact with melanin, making it a safe option for darker skin tones without the risk of hyperpigmentation associated with some laser treatments. This is one of Sofwave's key advantages over light-based skin tightening technologies.",
      },
    ],
  },
  {
    slug: "biorepeel-side-effects",
    treatment: "BioRePeel",
    serviceSlug: "biorepeel",
    basePath: "services",
    metaTitle: "BioRePeel Side Effects | What to Know",
    metaDescription:
      "BioRePeel side effects, recovery, and aftercare explained. Learn what to expect from this biostimulating peel at Rani Beauty Clinic in Renton, WA.",
    heroDescription:
      "BioRePeel is a biphasic TCA-based peel that combines exfoliation with biostimulation, delivering the benefits of a chemical peel with minimal downtime. Unlike traditional TCA peels, BioRePeel is designed to revitalize the skin without significant visible peeling. Rani Beauty Clinic offers BioRePeel treatments under physician supervision as part of customized skin rejuvenation protocols.",
    commonSideEffects: [
      {
        effect: "Mild redness and warmth",
        duration: "1–4 hours",
        severity: "mild",
        management:
          "No treatment is typically needed. The redness resolves quickly and most patients can resume normal activities immediately. A soothing moisturizer may be applied.",
      },
      {
        effect: "Slight tingling or stinging during application",
        duration: "During procedure (5–15 minutes)",
        severity: "mild",
        management:
          "The sensation is caused by the TCA and active acids working on the skin surface. It subsides quickly after the solution is neutralized or removed. Notify your clinician if discomfort is more than mild.",
      },
      {
        effect: "Light flaking or dryness",
        duration: "2–4 days",
        severity: "mild",
        management:
          "Apply a gentle moisturizer throughout the day. BioRePeel produces significantly less visible peeling than traditional chemical peels. Do not pick or scratch any flaking areas.",
      },
      {
        effect: "Temporary skin sensitivity",
        duration: "2–5 days",
        severity: "mild",
        management:
          "Avoid active skincare ingredients (retinol, AHAs, BHAs, vitamin C) for 3–5 days. Use gentle, fragrance-free products and apply SPF 30+ sunscreen daily.",
      },
    ],
    rareSideEffects: [
      "Post-inflammatory hyperpigmentation — more likely in darker skin tones without adequate sun protection",
      "Allergic reaction to the peel solution components",
      "Prolonged redness or irritation lasting beyond 48 hours",
      "Reactivation of cold sores (herpes simplex) in patients with a history",
    ],
    whenToSeekHelp: [
      "Redness, swelling, or irritation that worsens or persists beyond 48 hours",
      "Blistering, crusting, or open wounds in the treated area",
      "Signs of allergic reaction: hives, itching, or swelling beyond the treated area",
      "Cold sore outbreak after the peel",
      "Significant skin color changes persisting beyond 2 weeks",
    ],
    preventionTips: [
      "Discontinue retinoids and exfoliating products 3–5 days before treatment",
      "Avoid excessive sun exposure for at least 1 week before the peel",
      "Disclose any history of cold sores, skin allergies, or sensitivity to TCA",
      "Apply SPF 30+ sunscreen daily for at least 2 weeks after treatment",
      "Keep the skin well-hydrated with gentle moisturizers during the recovery period",
      "Avoid swimming pools, saunas, and heavy sweating for 24 hours after treatment",
    ],
    faqs: [
      {
        question: "Does BioRePeel cause visible peeling?",
        answer:
          "BioRePeel is specifically formulated to deliver exfoliation and biostimulation with minimal visible peeling. Unlike traditional TCA peels, most patients experience only light flaking or dryness for 2–4 days rather than dramatic shedding. The biphasic technology allows the active ingredients to work beneath the skin's surface, reducing the need for extensive surface peeling while still delivering skin renewal benefits.",
      },
      {
        question: "How long does redness last after BioRePeel?",
        answer:
          "Redness from BioRePeel is typically mild and resolves within 1–4 hours after the procedure. Most patients describe a slight pink flush similar to mild sun exposure. This minimal downtime makes BioRePeel suitable as a lunchtime treatment. If redness persists beyond 24 hours, contact the clinic.",
      },
      {
        question: "Can BioRePeel be combined with other treatments?",
        answer:
          "BioRePeel is often combined with other treatments such as microneedling, dermal fillers, or neuromodulators as part of a comprehensive skin rejuvenation plan. When combined with microneedling, the peel is typically applied after the needling procedure to enhance product penetration. Your provider at Rani Beauty Clinic will recommend safe timing and combinations based on your individual treatment plan.",
      },
      {
        question: "Is BioRePeel safe for acne-prone skin?",
        answer:
          "BioRePeel contains salicylic acid and other ingredients that are beneficial for acne-prone skin, helping to unclog pores and reduce congestion. It is generally well-tolerated by patients with active acne, though a purging response (temporary increase in breakouts) may occur in the first few days as congestion is brought to the surface. Patients with severe inflammatory acne should consult their provider before undergoing the treatment.",
      },
      {
        question: "How many BioRePeel sessions are recommended?",
        answer:
          "A series of 4–6 BioRePeel sessions spaced 7–14 days apart is typically recommended for optimal results. Maintenance treatments every 4–6 weeks can extend the benefits. Each session builds on the previous one, progressively improving skin texture, tone, and radiance. Your provider at Rani Beauty Clinic will design a treatment schedule based on your specific skin concerns and goals.",
      },
    ],
  },
  {
    slug: "nad-injection-side-effects",
    treatment: "NAD+ Injections",
    serviceSlug: "nad-injections",
    basePath: "wellness",
    metaTitle: "NAD+ Injection Side Effects | What to Expect",
    metaDescription:
      "Learn about NAD+ injection side effects, what to expect during treatment, and safety information. Physician-supervised wellness at Rani Beauty Clinic, Renton, WA.",
    heroDescription:
      "NAD+ (nicotinamide adenine dinucleotide) injections deliver this essential coenzyme directly into the muscle for cellular energy support, cognitive function, and overall wellness. Side effects are generally mild and well-tolerated. At Rani Beauty Clinic, all NAD+ injections are administered as intramuscular (IM) injections under the supervision of Dr. Alexander Landfield, Board-Certified Neurologist.",
    commonSideEffects: [
      {
        effect: "Injection site soreness or tenderness",
        duration: "1–3 days",
        severity: "mild",
        management:
          "Apply a warm compress to the injection site to promote absorption and reduce discomfort. Gentle movement of the injected muscle (e.g., walking if injected in the thigh) can help alleviate soreness.",
      },
      {
        effect: "Mild redness or bruising at the injection site",
        duration: "1–5 days",
        severity: "mild",
        management:
          "Apply arnica gel if bruising occurs. Rotate injection sites between sessions. Bruising is more common in patients taking blood-thinning medications or supplements.",
      },
      {
        effect: "Temporary warmth or flushing",
        duration: "15–60 minutes",
        severity: "mild",
        management:
          "A brief flushing sensation is a normal physiological response to NAD+ and typically resolves within an hour. Stay hydrated and rest if needed.",
      },
      {
        effect: "Mild nausea",
        duration: "30 minutes to 2 hours",
        severity: "mild",
        management:
          "Eat a light meal before your appointment. Stay hydrated. Nausea is generally mild and brief. If it persists, your provider may adjust the dosage or injection speed for future sessions.",
      },
    ],
    rareSideEffects: [
      "Headache following the injection — typically resolves with hydration and rest",
      "Fatigue or lightheadedness in the hours following treatment",
      "Allergic reaction to NAD+ or injection components (extremely rare)",
      "Muscle cramping near the injection site",
    ],
    whenToSeekHelp: [
      "Signs of allergic reaction: hives, swelling, difficulty breathing, or throat tightness",
      "Severe pain, increasing redness, or warmth at the injection site (possible infection)",
      "Persistent nausea or vomiting lasting more than 4 hours",
      "Chest tightness, palpitations, or shortness of breath after the injection",
      "Any severe or unexpected reaction following the treatment",
    ],
    preventionTips: [
      "Eat a light meal 1–2 hours before your appointment to reduce the likelihood of nausea",
      "Stay well-hydrated before and after the injection",
      "Inform your provider of any allergies, medications, or medical conditions",
      "Rotate injection sites between sessions to minimize soreness and tissue irritation",
      "Avoid strenuous exercise involving the injected muscle group for 24 hours",
      "Start with a lower dose if receiving NAD+ for the first time, and increase gradually based on tolerance",
    ],
    faqs: [
      {
        question: "Are NAD+ injections painful?",
        answer:
          "NAD+ IM injections involve a brief needle insertion into the muscle (typically the deltoid or gluteal muscle), which most patients describe as a quick pinch followed by mild pressure. The injection itself takes only a few seconds. Some patients experience temporary soreness at the injection site for 1–3 days, similar to the feeling after a vaccine. At Rani Beauty Clinic, experienced clinicians use proper technique to minimize discomfort.",
      },
      {
        question: "How often should you get NAD+ injections?",
        answer:
          "NAD+ injection frequency depends on individual goals and response. Common protocols include weekly injections for an initial loading phase (4–6 weeks), followed by maintenance injections every 2–4 weeks. Some patients benefit from monthly maintenance sessions. Your provider at Rani Beauty Clinic will recommend a personalized schedule based on your wellness goals, lifestyle, and response to treatment.",
      },
      {
        question: "Can NAD+ injections interact with medications?",
        answer:
          "NAD+ is a naturally occurring coenzyme in the body, and significant drug interactions are not commonly reported. However, patients should always disclose all current medications and supplements to their provider before beginning NAD+ therapy. Patients taking blood thinners may have an increased risk of injection site bruising. Rani Beauty Clinic conducts a thorough health assessment before initiating any wellness injection program.",
      },
      {
        question:
          "What is the difference between NAD+ injections and NAD+ IV therapy?",
        answer:
          "NAD+ IM injections deliver the coenzyme directly into the muscle, where it is absorbed gradually over several hours. The procedure takes only a few minutes and is performed as a quick office visit. IV therapy delivers NAD+ directly into the bloodstream over 1–4 hours, which may cause more intense flushing and nausea due to the rapid delivery. Rani Beauty Clinic offers IM injections as a convenient, well-tolerated alternative to IV administration.",
      },
      {
        question: "Who should not get NAD+ injections?",
        answer:
          "NAD+ injections may not be appropriate for patients who are pregnant or breastfeeding, have active infections or fever, or have known allergies to NAD+ or injection components. Patients with cancer, liver disease, or kidney disease should consult their primary care physician before starting NAD+ therapy. A comprehensive health screening is conducted at Rani Beauty Clinic before any wellness injection protocol is initiated.",
      },
    ],
  },
];
