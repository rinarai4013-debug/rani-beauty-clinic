export interface PreparationPage {
  slug: string;
  treatment: string;
  serviceSlug: string;
  basePath: "services" | "wellness";
  metaTitle: string;
  metaDescription: string;
  heroDescription: string;
  weeksBeforeSteps: string[];
  dayBeforeSteps: string[];
  dayOfSteps: string[];
  whatToBring: string[];
  whatToWear: string[];
  faqs: { question: string; answer: string }[];
}

export const preparationPages: PreparationPage[] = [
  {
    slug: "laser-hair-removal-preparation",
    treatment: "Laser Hair Removal",
    serviceSlug: "laser-hair-removal",
    basePath: "services",
    metaTitle: "How to Prepare for Laser Hair Removal | Pre-Treatment Guide",
    metaDescription: "Laser hair removal prep guide: shaving instructions, medications to avoid, and what to expect at your appointment. Rani Clinic.",
    heroDescription: "Proper preparation ensures the safest, most effective laser hair removal results. Follow this guide from Rani Beauty Clinic to get ready for your session with the Candela GentleMax Pro Plus.",
    weeksBeforeSteps: [
      "Avoid sun exposure and tanning beds for at least 2 weeks before treatment — tanned skin increases burn risk",
      "Discontinue self-tanners and spray tans at least 2 weeks prior",
      "Stop waxing, plucking, threading, and using depilatory creams — the laser needs the hair follicle intact",
      "Shaving is permitted (and required) — it removes surface hair while leaving the follicle for the laser to target",
      "Discontinue retinoids (tretinoin, adapalene) on the treatment area for 5–7 days before",
      "Inform your clinician of any medications you take, especially photosensitizing drugs (antibiotics like doxycycline, Accutane, etc.)",
    ],
    dayBeforeSteps: [
      "Shave the treatment area 24 hours before your appointment (not the same day — slight stubble helps the clinician see where to treat)",
      "Do NOT apply lotions, deodorant, perfume, or any products to the treatment area",
      "Avoid caffeine if you're anxiety-prone (it can increase sensitivity)",
      "Get a good night's sleep — rested skin responds better to treatment",
    ],
    dayOfSteps: [
      "Arrive with clean, product-free skin on the treatment area",
      "Wear comfortable, loose-fitting clothing that provides easy access to the treatment area",
      "Your clinician will assess your skin type using the Fitzpatrick scale and select the optimal wavelength",
      "Protective laser eyewear will be provided for your safety",
      "The treatment takes 15–60 minutes depending on the area size",
    ],
    whatToBring: [
      "A list of current medications and supplements",
      "Comfortable loose clothing for the treatment area",
      "Questions about your treatment plan",
    ],
    whatToWear: [
      "Underarm treatment: Wear a loose tank top or button-up shirt",
      "Bikini area: Wear loose-fitting pants or a skirt, and comfortable cotton underwear",
      "Legs: Wear shorts or loose pants you can roll up easily",
      "Face: Come without makeup on the treatment area",
    ],
    faqs: [
      { question: "Should I shave before laser hair removal?", answer: "Yes — shave the treatment area 24 hours before your appointment. This removes surface hair while leaving the hair follicle intact below the skin for the laser to target. Do NOT wax, pluck, or thread, as these methods remove the follicle entirely and make the laser ineffective." },
      { question: "Can I use deodorant before underarm laser hair removal?", answer: "No. Arrive with clean, product-free skin on the treatment area. Deodorant, lotions, perfumes, and other products can interfere with the laser and increase the risk of skin reactions. You can reapply deodorant after your session once the clinician gives you the all-clear." },
      { question: "Do I need to avoid the sun before laser hair removal?", answer: "Yes — avoid direct sun exposure and tanning for at least 2 weeks before your laser hair removal session. Tanned skin has more melanin near the surface, which increases the risk of burns and pigmentation changes. This applies to both natural sun tanning and artificial tanning (beds, spray tans). Use SPF 30+ daily on the treatment area." },
      { question: "What medications should I stop before laser hair removal?", answer: "Inform your clinician about all medications you take. Photosensitizing medications — including certain antibiotics (doxycycline, tetracycline), Accutane (isotretinoin), and some blood pressure medications — may need to be paused before treatment. Never stop prescribed medications without consulting your prescribing physician first." },
      { question: "How long does a laser hair removal session take?", answer: "Session length depends on the treatment area. Small areas like the upper lip take under 10 minutes. Underarms take about 15 minutes. Bikini area takes 20–30 minutes. Full legs take 45–60 minutes. Full body sessions may take 90+ minutes. Your clinician will give you an accurate estimate during your consultation." },
    ],
  },
  {
    slug: "botox-preparation",
    treatment: "Botox & Dysport",
    serviceSlug: "botox-dysport",
    basePath: "services",
    metaTitle: "How to Prepare for Botox | Pre-Treatment Guide",
    metaDescription: "Botox prep guide: medications to avoid, skincare adjustments, what to expect, and bruising prevention tips. Rani Beauty Clinic.",
    heroDescription: "Proper preparation before your Botox or Dysport treatment minimizes bruising and helps you achieve the most natural-looking results. Follow this neurologist-approved guide from Rani Beauty Clinic.",
    weeksBeforeSteps: [
      "Stop taking blood-thinning supplements 7 days before: fish oil, vitamin E, ginkgo biloba, garlic supplements, St. John's Wort",
      "Avoid aspirin and ibuprofen (Advil, Motrin) for 7 days — use acetaminophen (Tylenol) instead if you need pain relief",
      "Discuss any blood-thinning prescription medications (warfarin, Eliquis, Xarelto) with Dr. Landfield — do NOT stop these without medical advice",
      "Avoid alcohol for at least 24–48 hours before your appointment (increases bruising risk)",
      "Start taking arnica supplements 3–5 days before to help prevent bruising (optional but recommended)",
    ],
    dayBeforeSteps: [
      "No alcohol the night before your appointment",
      "Stay well-hydrated — drink plenty of water",
      "Get adequate sleep — stress and fatigue can increase pain sensitivity",
      "Review your treatment goals: which areas do you want treated? Bring photos if helpful",
    ],
    dayOfSteps: [
      "Arrive with a clean face — no makeup on the treatment area if possible",
      "Your clinician will discuss your goals, mark injection points, and review the treatment plan",
      "The procedure takes 10–20 minutes for most areas",
      "Ice or topical numbing cream may be applied for comfort (usually not necessary)",
      "Dr. Landfield supervises all neurotoxin treatments for precise, safe placement",
    ],
    whatToBring: [
      "List of current medications and supplements",
      "Photos of your desired results (optional but helpful for communication)",
      "Questions about specific treatment areas",
    ],
    whatToWear: [
      "Comfortable clothing — Botox is a quick procedure",
      "Come with minimal or no eye makeup if treating crow's feet or forehead",
      "Hair pulled back from the forehead if treating forehead or frown lines",
    ],
    faqs: [
      { question: "What should I stop taking before Botox?", answer: "Stop blood-thinning supplements 7 days before: fish oil, vitamin E, ginkgo biloba, garlic supplements. Avoid aspirin and ibuprofen for 7 days (use Tylenol instead). Avoid alcohol for 24–48 hours before. Do NOT stop prescription blood thinners without medical advice — discuss with Dr. Landfield first." },
      { question: "Should I avoid alcohol before Botox?", answer: "Yes — avoid alcohol for at least 24–48 hours before your Botox appointment. Alcohol is a blood thinner and vasodilator, which significantly increases the risk and severity of bruising at injection sites. Staying well-hydrated with water instead helps your skin respond better to treatment." },
      { question: "Does Botox hurt?", answer: "Most patients describe Botox as feeling like a small pinch. The needles used are extremely fine (30–32 gauge), and the injections are very quick. Dr. Landfield's neurological expertise ensures precise placement with minimal discomfort. Ice or topical numbing cream can be applied for patients who are particularly sensitive, though most patients don't need it." },
      { question: "How long does a Botox appointment take?", answer: "A typical Botox appointment takes 15–30 minutes total, including consultation, marking, and injections. The actual injection process takes only 10–15 minutes. If this is your first visit, allow 30–45 minutes so Dr. Landfield can assess your facial anatomy and discuss your goals in detail." },
      { question: "Is it better to get Botox from a neurologist?", answer: "Yes — Botox (botulinum toxin) is a neurotoxin, and neurologists have the deepest understanding of how it works at the neuromuscular junction. Dr. Landfield's board-certified neurology background provides expertise in facial nerve anatomy, muscle dynamics, and precise dosing that exceeds typical aesthetic injector training. This translates to more natural results and enhanced safety." },
    ],
  },
  {
    slug: "hydrafacial-preparation",
    treatment: "HydraFacial MD",
    serviceSlug: "hydrafacial",
    basePath: "services",
    metaTitle: "How to Prepare for a HydraFacial | Pre-Treatment Tips",
    metaDescription: "How to prepare for your HydraFacial: skincare adjustments, what to do before your appointment, and how to get the best results. Expert tips from Rani Beauty Clinic.",
    heroDescription: "HydraFacial requires minimal preparation, but a few simple steps will help you get the most out of your treatment. Follow this guide for the best possible results.",
    weeksBeforeSteps: [
      "Discontinue retinoids (tretinoin, adapalene, retinol) 3–5 days before if you have sensitive skin",
      "Avoid aggressive chemical peels or laser treatments for 2 weeks before your HydraFacial",
      "If you have an active cold sore, contact us to reschedule (treatment can trigger a flare-up)",
    ],
    dayBeforeSteps: [
      "Avoid excessive sun exposure — come to your appointment without a fresh sunburn",
      "Skip harsh exfoliants the night before (AHAs, BHAs, physical scrubs)",
      "Stay hydrated — well-hydrated skin responds better to HydraFacial",
    ],
    dayOfSteps: [
      "Arrive with a clean face — remove all makeup, sunscreen, and skincare products",
      "If you can't arrive bare-faced, our team will cleanse your skin before treatment",
      "No special clothing requirements — HydraFacial treats the face, neck, and decolletage",
      "Treatment takes 30–60 minutes depending on the package selected",
    ],
    whatToBring: [
      "Information about your current skincare routine",
      "Questions about which HydraFacial boosters might benefit you",
      "Any specific skin concerns you'd like to address",
    ],
    whatToWear: [
      "Comfortable clothing with an open neckline if you're including neck or decolletage treatment",
      "Avoid turtlenecks or high collars",
      "Bring a hat or sunscreen for after your appointment",
    ],
    faqs: [
      { question: "Do I need to come with no makeup for a HydraFacial?", answer: "Ideally, yes — arrive with a clean, bare face for the best results. However, if you're coming from work or an event, our team will thoroughly cleanse your skin as the first step of the HydraFacial process. The treatment includes a deep cleansing step, so any remaining makeup will be removed." },
      { question: "Can I get a HydraFacial if I have acne?", answer: "Yes — HydraFacial is actually beneficial for acne-prone skin. The treatment includes extraction that clears clogged pores and removes impurities without the irritation of manual extractions. Your clinician can customize the treatment with acne-targeting boosters and serums. However, if you have severe cystic acne or open wounds, consult with our team first." },
      { question: "What's the best time to get a HydraFacial?", answer: "HydraFacial is great any time because there's no downtime. Popular timing includes: before a special event (2–3 days prior for maximum glow), monthly as part of a maintenance routine, or as a recovery treatment after summer sun exposure. Many patients schedule their HydraFacial during lunch breaks since you can return to activities immediately." },
    ],
  },
  {
    slug: "glp1-preparation",
    treatment: "GLP-1 Weight Management",
    serviceSlug: "glp1-weight-management",
    basePath: "wellness",
    metaTitle: "How to Prepare for GLP-1 | Pre-Treatment Guide",
    metaDescription: "Starting GLP-1 weight management? Preparation guide: required blood work, dietary changes, and what to expect. Rani Beauty Clinic.",
    heroDescription: "Starting a GLP-1 weight management program is a transformative decision. This guide covers everything you need to know before your first injection, including required blood work, dietary preparation, and what to expect.",
    weeksBeforeSteps: [
      "Complete your comprehensive blood panel at Rani Beauty Clinic (or bring recent lab results from the past 30 days)",
      "Blood work includes: Complete metabolic panel, lipid panel, A1C, thyroid function, kidney and liver function",
      "Begin tracking your current eating habits — a food diary helps Dr. Landfield create your personalized plan",
      "Start reducing processed foods and increasing protein intake to prepare your body for appetite changes",
      "Assess your current exercise routine — even light walking counts",
      "Discuss any current medications with Dr. Landfield, especially diabetes medications or insulin",
    ],
    dayBeforeSteps: [
      "Stay well-hydrated — aim for 8+ glasses of water",
      "Eat a normal, balanced meal — don't fast or crash diet",
      "Prepare your kitchen: stock up on lean proteins, vegetables, and low-fat foods",
      "Consider removing trigger foods from your home to support your new eating patterns",
      "Write down questions for Dr. Landfield about your program",
    ],
    dayOfSteps: [
      "Eat a light meal before your appointment to reduce initial nausea risk",
      "Wear comfortable clothing that allows easy access to your abdomen or upper arm for injection",
      "Dr. Landfield will review your blood work, discuss your weight history, and establish your starting dose",
      "Your first injection will be administered at the clinic so we can monitor for any immediate reactions",
      "You'll receive detailed instructions for managing side effects and optimizing your results",
    ],
    whatToBring: [
      "Complete list of all medications and supplements",
      "Recent blood work results if done elsewhere (past 30 days)",
      "Your weight loss history and any previous programs you've tried",
      "List of any food allergies or dietary restrictions",
      "Insurance card (for eligible wellness services)",
    ],
    whatToWear: [
      "Comfortable clothing that allows access to abdomen, upper arm, or thigh for injection",
      "Avoid tight waistbands on injection day",
    ],
    faqs: [
      { question: "Do I need blood work before starting GLP-1?", answer: "Yes — comprehensive blood work is required before starting any GLP-1 weight management program at Rani Beauty Clinic. This establishes your baseline metabolic profile and screens for conditions that may affect your treatment. Blood work is conveniently performed in-house at our Renton clinic. Panels include complete metabolic panel, A1C, lipid panel, thyroid function, kidney function, and liver function." },
      { question: "How do I qualify for GLP-1 weight management?", answer: "GLP-1 medications are appropriate for adults with a BMI of 30 or higher, or a BMI of 27 or higher with at least one weight-related health condition (such as type 2 diabetes, high blood pressure, or high cholesterol). During your consultation, Dr. Landfield will evaluate your complete health profile to determine if GLP-1 therapy is right for you." },
      { question: "What's the difference between Semaglutide and Tirzepatide?", answer: "Both are GLP-1 receptor agonists, but they work slightly differently. Semaglutide (Ozempic/Wegovy) targets the GLP-1 receptor and typically produces 10–15% body weight loss. Tirzepatide (Mounjaro/Zepbound) targets both GLP-1 and GIP receptors and clinical trials show up to 20–25% body weight loss. Dr. Landfield will recommend the best option based on your health profile, goals, and insurance coverage." },
      { question: "How much does GLP-1 weight management cost?", answer: "GLP-1 weight management programs at Rani Beauty Clinic cost $399–$599 per month. This includes the medication, physician supervision by Dr. Landfield, comprehensive blood work, and monthly monitoring appointments. The exact cost depends on the medication (Semaglutide vs Tirzepatide) and your dose." },
    ],
  },
  {
    slug: "rf-microneedling-preparation",
    treatment: "RF Microneedling",
    serviceSlug: "rf-microneedling",
    basePath: "services",
    metaTitle: "How to Prepare for RF Microneedling | Pre-Treatment Guide",
    metaDescription: "RF microneedling preparation guide: skincare to stop, sun avoidance, medications to discuss, and what to expect at your appointment. Expert tips from Rani Beauty Clinic.",
    heroDescription: "Proper preparation for RF microneedling ensures optimal results and faster recovery. Follow this guide to get your skin ready for treatment.",
    weeksBeforeSteps: [
      "Discontinue retinoids (tretinoin, retinol) 5–7 days before treatment",
      "Stop blood-thinning supplements (fish oil, vitamin E) 7 days before",
      "Avoid direct sun exposure and tanning for 2 weeks before treatment",
      "Do not use self-tanners or spray tans for 2 weeks prior",
      "Discontinue AHAs, BHAs, and exfoliating products 3–5 days before",
      "If you have a history of cold sores, ask about antiviral medication (Valtrex) to take prophylactically",
    ],
    dayBeforeSteps: [
      "Do not apply retinoids, acids, or active skincare products",
      "Avoid alcohol for 24 hours before treatment",
      "Stay well-hydrated",
      "Get adequate sleep — your body heals faster when well-rested",
    ],
    dayOfSteps: [
      "Arrive with a clean, bare face — no makeup, sunscreen, or products",
      "Topical numbing cream will be applied 30–45 minutes before treatment",
      "Treatment takes 30–60 minutes depending on the area",
      "Plan for mild redness and swelling afterward — like a moderate sunburn",
    ],
    whatToBring: [
      "List of current medications and skincare products",
      "Sunglasses and a hat for after treatment (your skin will be sensitive)",
      "A gentle moisturizer for post-treatment care",
    ],
    whatToWear: [
      "Comfortable clothing you don't mind getting slightly messy (numbing cream residue)",
      "Button-up or zip-up top if treating the face/neck (avoid pulling clothing over treated skin)",
      "Bring a scarf or hat for sun protection on the way home",
    ],
    faqs: [
      { question: "Does RF microneedling hurt?", answer: "Topical numbing cream is applied 30–45 minutes before treatment to minimize discomfort. Most patients describe the sensation as mild prickling with warmth from the radiofrequency energy. Comfort levels vary by treatment area — forehead and temples may be more sensitive than cheeks. Most patients tolerate the treatment well." },
      { question: "How long before a special event should I schedule RF microneedling?", answer: "Allow at least 2–3 weeks before any special event. Redness and swelling last 2–5 days, and mild peeling may occur on days 3–5. Your skin will look its best starting around day 7–10, with continued improvement over the following months as collagen rebuilds." },
      { question: "Can I get RF microneedling if I have acne?", answer: "RF microneedling is excellent for active acne and acne scarring. However, if you have severe inflammatory acne with pustules or cysts, treatment may need to wait until the active breakout subsides. Mild to moderate acne and all types of acne scars (ice pick, boxcar, rolling) respond well to RF microneedling." },
    ],
  },
  {
    slug: "dermal-fillers-preparation",
    treatment: "Dermal Fillers",
    serviceSlug: "dermal-fillers",
    basePath: "services",
    metaTitle: "How to Prepare for Dermal Fillers | Pre-Treatment Tips",
    metaDescription: "How to prepare for dermal filler injections: supplements to stop, bruising prevention, what to expect at your appointment. Neurologist-supervised care at Rani Beauty Clinic.",
    heroDescription: "Smart preparation before your dermal filler appointment minimizes bruising and helps you achieve the most natural, beautiful results. Follow this neurologist-approved guide.",
    weeksBeforeSteps: [
      "Stop blood-thinning supplements 7 days before: fish oil, vitamin E, ginkgo biloba, garlic supplements",
      "Avoid aspirin and ibuprofen for 7 days before (use Tylenol if needed)",
      "Start arnica supplements 3–5 days before to minimize bruising (optional but recommended)",
      "Discuss any prescription blood thinners with Dr. Landfield before your appointment",
      "If you have a history of cold sores and are getting lip filler, request a Valtrex prescription",
    ],
    dayBeforeSteps: [
      "Avoid alcohol for at least 24 hours before your appointment",
      "Stay well-hydrated — HA fillers work best when your body is hydrated",
      "Plan your social calendar — you may have bruising or swelling for up to 7–14 days",
      "Gather reference photos of your desired results to discuss with your clinician",
    ],
    dayOfSteps: [
      "Arrive with a clean face — minimal or no makeup",
      "Your clinician will discuss goals, take photos, and mark injection points",
      "Numbing cream or dental nerve blocks may be used for comfort (especially for lip filler)",
      "Treatment takes 15–45 minutes depending on the areas treated",
      "You can bring a friend for moral support if it's your first time",
    ],
    whatToBring: [
      "Reference photos of your desired results",
      "List of medications and supplements",
      "Questions about specific filler products and areas",
    ],
    whatToWear: [
      "Comfortable clothing — the procedure is quick",
      "Come with minimal makeup on the treatment area",
      "Bring sunglasses and a hat if you're concerned about post-treatment appearance",
    ],
    faqs: [
      { question: "Which filler is best for lips?", answer: "For lip enhancement, hyaluronic acid fillers from the Juvederm and Restylane families are most commonly used. Products like Juvederm Ultra XC and Restylane Kysse are specifically designed for lips — they provide natural movement and a soft, hydrated result. During your consultation, your clinician will recommend the optimal product based on your lip anatomy and desired outcome." },
      { question: "How painful are lip filler injections?", answer: "Most modern fillers contain lidocaine (a built-in numbing agent) that activates as the filler is injected. Additionally, dental nerve blocks or topical numbing cream can be applied before treatment. Most patients rate lip filler discomfort as 3–5 out of 10. The entire lip injection process takes about 15–20 minutes." },
      { question: "How do I avoid bruising from fillers?", answer: "Stop blood thinners (fish oil, vitamin E, aspirin, ibuprofen) 7 days before. Avoid alcohol 24 hours before. Start arnica supplements 3–5 days before. After treatment, apply cold compresses and continue arnica. Avoid strenuous exercise for 24–48 hours. Even with precautions, some bruising is common — it typically resolves within 7–14 days." },
    ],
  },
  {
    slug: "chemical-peels-preparation",
    treatment: "Chemical Peels",
    serviceSlug: "chemical-peels",
    basePath: "services",
    metaTitle: "How to Prepare for a Chemical Peel | Guide",
    metaDescription: "Chemical peel prep: skincare products to stop, sun avoidance timeline, and what to expect at your appointment. Rani Beauty Clinic.",
    heroDescription: "Proper skin preparation before a chemical peel optimizes penetration, improves results, and reduces the risk of complications. Follow this guide to get the best possible outcome from your peel.",
    weeksBeforeSteps: [
      "Your clinician may recommend a pre-peel skincare regimen (retinoids, hydroquinone) 2–4 weeks before for enhanced results",
      "Discontinue retinoids 5–7 days before your peel",
      "Stop using AHAs, BHAs, and exfoliating products 3–5 days before",
      "Avoid waxing, threading, or depilatory creams on the treatment area for 1 week",
      "Avoid direct sun exposure and use SPF 30+ daily for 2 weeks before",
      "If you have a history of cold sores, request prophylactic antiviral medication",
    ],
    dayBeforeSteps: [
      "Use only a gentle cleanser and moisturizer — no active ingredients",
      "Avoid shaving the treatment area",
      "Stay hydrated and get adequate rest",
    ],
    dayOfSteps: [
      "Arrive with a clean, bare face — no makeup, sunscreen, or products",
      "Your clinician will assess your skin and confirm the appropriate peel type and strength",
      "Treatment takes 15–30 minutes depending on the peel type",
      "You may feel tingling, warmth, or mild stinging during application — this is normal",
    ],
    whatToBring: [
      "List of all skincare products you currently use",
      "Information about any prescription skincare (tretinoin, hydroquinone)",
      "SPF 50+ sunscreen and a wide-brimmed hat for after your appointment",
    ],
    whatToWear: [
      "Button-up shirt or zip-up top (avoid pulling clothing over treated skin)",
      "Bring a hat and sunglasses for sun protection on the way home",
    ],
    faqs: [
      { question: "Should I stop retinol before a chemical peel?", answer: "Yes — discontinue retinoids (prescription tretinoin and over-the-counter retinol) 5–7 days before your chemical peel. Retinoids increase skin sensitivity and cell turnover, which can cause the peel to penetrate too deeply and increase the risk of irritation, redness, or peeling complications." },
      { question: "Which chemical peel is right for me?", answer: "The best peel depends on your skin concerns and goals. BioRePeel ($495) is excellent for first-timers — minimal peeling with great rejuvenation. VI Peel ($395) targets hyperpigmentation, acne scarring, and fine lines with more noticeable peeling. PRX-T33 ($495) is a biorevitalization peel that improves skin quality without visible peeling. Your clinician will recommend the best option during your consultation." },
      { question: "Can I get a chemical peel if I have dark skin?", answer: "Yes, but peel selection is important. Certain peels carry higher risk of post-inflammatory hyperpigmentation (PIH) in darker skin types. The VI Peel and BioRePeel are generally safe for all skin types including Fitzpatrick IV–VI when administered by experienced clinicians. Pre-treatment with brightening agents and strict post-peel sun protection are essential for darker skin tones." },
    ],
  },
  {
    slug: "sofwave-preparation",
    treatment: "Sofwave",
    serviceSlug: "sofwave",
    basePath: "services",
    metaTitle: "How to Prepare for Sofwave | Pre-Treatment Guide",
    metaDescription: "Sofwave skin tightening preparation: what to do before your ultrasound treatment, skincare adjustments, and what to expect. Expert guide from Rani Beauty Clinic.",
    heroDescription: "Sofwave requires minimal preparation compared to other skin tightening treatments. Follow these simple steps to ensure the best possible results from your SUPERB ultrasound session.",
    weeksBeforeSteps: [
      "No major skincare changes needed — continue your regular routine",
      "Avoid excessive sun exposure for 1 week before treatment",
      "If you recently had Botox, wait at least 2 weeks before Sofwave treatment",
      "If you recently had fillers, wait at least 2–4 weeks before Sofwave",
    ],
    dayBeforeSteps: [
      "Continue your regular skincare routine",
      "Stay well-hydrated",
      "Avoid excessive alcohol consumption",
    ],
    dayOfSteps: [
      "Arrive with a clean face — remove all makeup and skincare products",
      "No numbing cream is needed — Sofwave has integrated cooling for comfort",
      "Treatment takes 30–45 minutes for full face",
      "You can return to all normal activities immediately after",
    ],
    whatToBring: [
      "Sunscreen for after your appointment",
      "Questions about combining Sofwave with other treatments",
    ],
    whatToWear: [
      "Comfortable clothing — no special requirements",
      "Come with a clean face or be prepared for makeup removal",
    ],
    faqs: [
      { question: "Do I need numbing cream before Sofwave?", answer: "No — Sofwave has an integrated cooling system (Sofcool) that makes the treatment comfortable without topical numbing cream. Most patients describe the sensation as warm with brief moments of intensity. This is one of Sofwave's advantages over other skin tightening technologies." },
      { question: "Can I combine Sofwave with other treatments?", answer: "Yes — Sofwave pairs well with many treatments. Popular combinations include Sofwave + Botox (same day — Botox first), Sofwave + HydraFacial (same day or within the same week), and Sofwave + RF microneedling (space 4+ weeks apart). Your clinician will recommend the optimal combination plan for your goals." },
      { question: "How much does Sofwave cost?", answer: "Sofwave treatments at Rani Beauty Clinic range from $2,750 to $4,500, depending on the treatment areas. Full face treatment is the most popular option. The investment reflects that most patients need only one session — making Sofwave cost-effective compared to treatments requiring multiple sessions." },
    ],
  },
];
