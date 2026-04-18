#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function formatUsd(value) {
  return currencyFormatter.format(value);
}

function loadConstObject(filePath, exportName) {
  const absPath = path.join(repoRoot, filePath);
  const source = fs.readFileSync(absPath, "utf8");
  const exportPattern = new RegExp(`export\\s+const\\s+${exportName}\\s*=`);

  if (!exportPattern.test(source)) {
    throw new Error(`Could not find export const ${exportName} in ${filePath}`);
  }

  const executableSource = `${source.replace(exportPattern, `const ${exportName} =`)}\nmodule.exports = { ${exportName} };`;
  const context = {
    module: { exports: {} },
    exports: {},
    require: () => {
      throw new Error(`Module imports are not supported when loading ${filePath}`);
    },
  };

  vm.runInNewContext(executableSource, context, { filename: absPath });
  return context.module.exports[exportName];
}

function extractDollarValues(text) {
  const source = String(text);
  const normalized = source.replaceAll(",", "");
  const values = new Set();

  for (const match of normalized.matchAll(/\$([\d]+(?:\.\d+)?)/g)) {
    const value = Number(match[1]);
    if (Number.isFinite(value)) {
      values.add(value);
    }
  }

  for (const match of normalized.matchAll(/(\$?[\d]+(?:\.\d+)?)\s*[–-]\s*(\$?[\d]+(?:\.\d+)?)/g)) {
    const startValue = Number(match[1].replace("$", ""));
    const endValue = Number(match[2].replace("$", ""));
    if (Number.isFinite(startValue)) values.add(startValue);
    if (Number.isFinite(endValue)) values.add(endValue);
  }

  return Array.from(values);
}

function getRangeFromPriceEntries(entries) {
  const allValues = entries.flatMap((entry) => extractDollarValues(entry.price));

  if (allValues.length === 0) {
    throw new Error("No numeric prices found while generating llms files.");
  }

  return {
    min: Math.min(...allValues),
    max: Math.max(...allValues),
  };
}

function findPrice(entries, matcher, fallbackLabel) {
  const entry = entries.find(matcher);
  if (!entry) {
    throw new Error(`Could not find pricing entry for ${fallbackLabel}`);
  }

  const values = extractDollarValues(entry.price);
  if (values.length === 0) {
    throw new Error(`Could not parse a dollar value for ${fallbackLabel}`);
  }

  return values[0];
}

function rangeLabel(min, max) {
  return min === max ? formatUsd(min) : `${formatUsd(min)} to ${formatUsd(max)}`;
}

function buildLlmsTxt({ clinicInfo, pricingData, keyPrices, ranges }) {
  return `# ${clinicInfo.name}\n\n> Physician-supervised medspa in ${clinicInfo.address.city}, ${clinicInfo.address.state} offering advanced aesthetic treatments and medical wellness programs under the supervision of ${clinicInfo.medicalDirector.name}, ${clinicInfo.medicalDirector.specialty}. Woman-owned. Open 7 days a week. Serving all of King County, Washington.\n\n## About\n\n${clinicInfo.name} is a physician-supervised medical aesthetics clinic located at ${clinicInfo.address.full}. Founded in ${clinicInfo.established}, the clinic is woman-owned and medically supervised. The clinic is rated ${clinicInfo.reviews.aggregateRating} stars on Google with ${clinicInfo.reviews.reviewCount}+ reviews and is open Monday through Sunday, 10 AM to 7 PM.\n\n## Contact\n\n- Phone: ${clinicInfo.phone}\n- Email: ${clinicInfo.email}\n- Website: ${clinicInfo.website}\n- Booking: ${clinicInfo.booking.url}\n- Address: ${clinicInfo.address.full}\n\n## Aesthetic Services\n\n- [Laser Hair Removal](${clinicInfo.website}/services/laser-hair-removal): Starts at ${formatUsd(keyPrices.lhrSmall)} for small areas and goes up to ${formatUsd(keyPrices.lhrFullBody)} for full body treatment using Candela GentleMax Pro Plus.\n- [HydraFacial MD](${clinicInfo.website}/services/hydrafacial): Current menu pricing ranges from ${formatUsd(keyPrices.hydrafacialExpress)} (Express Facial) to ${formatUsd(keyPrices.hydrafacialKeravive)} (Keravive Scalp).\n- [Chemical Peels](${clinicInfo.website}/services/chemical-peels): Pricing ranges from ${rangeLabel(ranges.chemicalPeels.min, ranges.chemicalPeels.max)} across VI Peel (${formatUsd(keyPrices.viPeel)}), BioRePeel options, PRX-T33, and Cosmelan (${formatUsd(keyPrices.cosmelan)}).\n- [RF Microneedling](${clinicInfo.website}/services/rf-microneedling): Current pricing ranges from ${rangeLabel(ranges.rfMicroneedling.min, ranges.rfMicroneedling.max)} per session depending on treatment area.\n- [Sofwave](${clinicInfo.website}/services/sofwave): Current pricing ranges from ${formatUsd(keyPrices.sofwaveBrow)} to ${formatUsd(keyPrices.sofwaveFullFaceNeck)} depending on treatment zones.\n\n## Medical Wellness Programs\n\n- [GLP-1 Weight Management](${clinicInfo.website}/wellness/glp1-weight-management): Physician-supervised medical weight loss program pricing ranges from ${formatUsd(keyPrices.glp1Min)} to ${formatUsd(keyPrices.glp1Max)} depending on medication and dose tier.\n- [NAD+ Injections](${clinicInfo.website}/wellness/nad-injections): Starts at ${formatUsd(keyPrices.nadShot)} per injection. Rani performs injections only, never IV infusions.\n- [Vitamin Injections](${clinicInfo.website}/wellness/vitamin-injections): Core injection pricing includes B12 at ${formatUsd(keyPrices.b12Shot)}, Lipo-B/Biotin at ${formatUsd(keyPrices.lipoBShot)}, and Glutathione at ${formatUsd(keyPrices.glutathioneShot)}.\n- [Hormone Therapy](${clinicInfo.website}/wellness/hormone-therapy): Core protocol pricing ranges from ${rangeLabel(ranges.hormoneCore.min, ranges.hormoneCore.max)} per month based on protocol.\n- [Blood Work](${clinicInfo.website}/wellness/blood-work): Typical panel pricing ranges from ${rangeLabel(ranges.labPanels.min, ranges.labPanels.max)}, with an in-clinic blood draw fee of ${formatUsd(keyPrices.bloodDrawFee)} per visit.\n\n## Key Differentiators\n\n1. ${clinicInfo.medicalDirector.specialty} (${clinicInfo.medicalDirector.name}) supervises all medical treatments\n2. Woman-owned medspa with luxury, clinically-assured brand experience\n3. Open 7 days a week (${clinicInfo.hours.formatted})\n4. Safe protocols for all skin types, including darker skin tones\n5. In-house blood work for wellness programs\n6. ${clinicInfo.reviews.aggregateRating}-star Google rating with ${clinicInfo.reviews.reviewCount}+ reviews\n\n## Areas Served\n\nRenton, Bellevue, Kent, Tukwila, Newcastle, Mercer Island, Auburn, Federal Way, Kirkland, Redmond, Issaquah, Sammamish, Burien, SeaTac, Covington, Maple Valley, Des Moines, Woodinville, Bothell, South Seattle, and all of King County, Washington.\n\n## Optional\n\n- [About Us](${clinicInfo.website}/about)\n- [All Services](${clinicInfo.website}/services)\n- [Medical Wellness](${clinicInfo.website}/wellness)\n- [Before & After Results](${clinicInfo.website}/results)\n- [Blog](${clinicInfo.website}/blog)\n- [Pricing](${clinicInfo.website}/pricing)\n- [Contact](${clinicInfo.website}/contact)\n- [Locations We Serve](${clinicInfo.website}/locations)\n- [Safety Standards](${clinicInfo.website}/safety)\n`;
}

function buildLlmsFullTxt({ clinicInfo, keyPrices, ranges }) {
  return `# ${clinicInfo.name} — Complete Knowledge Base\n\n> Auto-generated from canonical pricing and clinic identity sources. Last reviewed: ${clinicInfo.contentReviewDate}.\n\n## Business Identity\n\n- **Legal Name:** ${clinicInfo.name}\n- **Type:** Medical Aesthetics Clinic (Physician-Supervised Medspa)\n- **Founded:** ${clinicInfo.established}\n- **Ownership:** ${clinicInfo.ownership}\n- **Location:** ${clinicInfo.address.full}\n- **Phone:** ${clinicInfo.phone}\n- **Email:** ${clinicInfo.email}\n- **Website:** ${clinicInfo.website}\n- **Booking:** ${clinicInfo.booking.url}\n- **Hours:** ${clinicInfo.hours.days}, ${clinicInfo.hours.time}\n- **Google Rating:** ${clinicInfo.reviews.aggregateRating} stars (${clinicInfo.reviews.reviewCount}+ reviews)\n\n## Medical Director\n\n${clinicInfo.medicalDirector.name} is the clinic's ${clinicInfo.medicalDirector.title} and ${clinicInfo.medicalDirector.specialty}. Every medical treatment is physician-supervised, including neurotoxin injections, device-based aesthetics, and wellness protocols.\n\n## Canonical Pricing Anchors\n\n| Category | Canonical Price Signal |\n|---|---|\n| Laser Hair Removal | ${formatUsd(keyPrices.lhrSmall)} small area, up to ${formatUsd(keyPrices.lhrFullBody)} full body |\n| HydraFacial | ${formatUsd(keyPrices.hydrafacialExpress)} express, up to ${formatUsd(keyPrices.hydrafacialKeravive)} Keravive |\n| Chemical Peels | ${formatUsd(keyPrices.viPeel)} VI Peel, ${formatUsd(keyPrices.cosmelan)} Cosmelan |\n| Sofwave | ${formatUsd(keyPrices.sofwaveBrow)} brow lift, ${formatUsd(keyPrices.sofwaveFullFaceNeck)} full face + neck |\n| GLP-1 Program | ${formatUsd(keyPrices.glp1Min)} to ${formatUsd(keyPrices.glp1Max)} depending on medication + dose |\n| NAD+ Injection | ${formatUsd(keyPrices.nadShot)} per injection |\n| Vitamin B12 Injection | ${formatUsd(keyPrices.b12Shot)} per injection |\n| Blood Draw Fee | ${formatUsd(keyPrices.bloodDrawFee)} per visit |\n\n## Service Range Snapshot\n\n- **RF Microneedling:** ${rangeLabel(ranges.rfMicroneedling.min, ranges.rfMicroneedling.max)}\n- **Chemical Peels (all listed options):** ${rangeLabel(ranges.chemicalPeels.min, ranges.chemicalPeels.max)}\n- **Core Hormone Therapy Protocols:** ${rangeLabel(ranges.hormoneCore.min, ranges.hormoneCore.max)} monthly\n- **Lab Panel Pricing (excluding draw fee):** ${rangeLabel(ranges.labPanels.min, ranges.labPanels.max)}\n\n## Safety + Compliance Notes\n\n- Content is educational and does not replace individualized medical advice.\n- Treatments are physician-supervised under ${clinicInfo.medicalDirector.name}.\n- NAD+ and wellness vitamins are delivered as injections (not IV infusions).\n\n## Key Links\n\n- ${clinicInfo.website}/services\n- ${clinicInfo.website}/wellness\n- ${clinicInfo.website}/pricing\n- ${clinicInfo.website}/contact\n- ${clinicInfo.website}/locations\n`;
}

function writeIfChanged(targetPath, nextValue) {
  const absPath = path.join(repoRoot, targetPath);
  const normalized = nextValue.endsWith("\n") ? nextValue : `${nextValue}\n`;

  if (fs.existsSync(absPath)) {
    const current = fs.readFileSync(absPath, "utf8");
    if (current === normalized) {
      return false;
    }
  }

  fs.writeFileSync(absPath, normalized, "utf8");
  return true;
}

function buildOutputs() {
  const pricingData = loadConstObject("src/data/pricing.ts", "pricingData");
  const clinicInfo = loadConstObject("src/data/clinic-info.ts", "clinicInfo");

  const keyPrices = {
    lhrSmall: findPrice(pricingData.laserHairRemoval, (entry) => /Upper Lip/i.test(entry.name), "Laser Hair Removal - Upper Lip"),
    lhrFullBody: findPrice(pricingData.laserHairRemoval, (entry) => /Full Body/i.test(entry.name), "Laser Hair Removal - Full Body"),
    hydrafacialExpress: findPrice(pricingData.hydrafacial, (entry) => /Express Facial/i.test(entry.name), "HydraFacial - Express Facial"),
    hydrafacialKeravive: findPrice(pricingData.hydrafacial, (entry) => /Keravive/i.test(entry.name), "HydraFacial - Keravive"),
    viPeel: findPrice(pricingData.chemicalPeels, (entry) => /^VI Peel/i.test(entry.name), "VI Peel"),
    cosmelan: findPrice(pricingData.chemicalPeels, (entry) => /Cosmelan/i.test(entry.name), "Cosmelan"),
    sofwaveBrow: findPrice(pricingData.sofwave, (entry) => /Brow Lift/i.test(entry.name), "Sofwave Brow Lift"),
    sofwaveFullFaceNeck: findPrice(pricingData.sofwave, (entry) => /Full Face \+ Neck/i.test(entry.name), "Sofwave Full Face + Neck"),
    nadShot: findPrice(pricingData.peptides, (entry) => /NAD\+/i.test(entry.name), "NAD+ injection"),
    b12Shot: findPrice(pricingData.peptides, (entry) => /Vitamin B12/i.test(entry.name), "Vitamin B12 injection"),
    lipoBShot: findPrice(pricingData.peptides, (entry) => /Lipo-B/i.test(entry.name), "Lipo-B injection"),
    glutathioneShot: findPrice(pricingData.peptides, (entry) => /Glutathione/i.test(entry.name), "Glutathione injection"),
    bloodDrawFee: findPrice(pricingData.labs, (entry) => /Blood Draw Fee/i.test(entry.name), "Blood Draw Fee"),
  };

  const glp1Entries = [
    ...pricingData.glp1.semaglutide,
    ...pricingData.glp1.tirzepatide,
    ...pricingData.glp1.liraglutide.filter((entry) => !/bundle/i.test(entry.phase)),
  ];
  const glp1Range = getRangeFromPriceEntries(glp1Entries);

  const hormoneCoreEntries = pricingData.hormones.filter((entry) =>
    /HRT|TRT|Thyroid/i.test(entry.name)
  );
  const hormoneCoreRange = getRangeFromPriceEntries(hormoneCoreEntries);

  const labPanels = pricingData.labs.filter((entry) => !/Blood Draw Fee/i.test(entry.name));
  const labPanelRange = getRangeFromPriceEntries(labPanels);

  const ranges = {
    chemicalPeels: getRangeFromPriceEntries(pricingData.chemicalPeels),
    rfMicroneedling: getRangeFromPriceEntries(pricingData.rfMicroneedling),
    hormoneCore: hormoneCoreRange,
    labPanels: labPanelRange,
  };

  keyPrices.glp1Min = glp1Range.min;
  keyPrices.glp1Max = glp1Range.max;

  return {
    "public/llms.txt": buildLlmsTxt({ clinicInfo, pricingData, keyPrices, ranges }),
    "public/llms-full.txt": buildLlmsFullTxt({ clinicInfo, keyPrices, ranges }),
  };
}

function run() {
  const checkMode = process.argv.includes("--check");
  const outputs = buildOutputs();
  const changedFiles = [];
  const staleFiles = [];

  for (const [targetPath, content] of Object.entries(outputs)) {
    const absPath = path.join(repoRoot, targetPath);
    const normalized = content.endsWith("\n") ? content : `${content}\n`;
    const current = fs.existsSync(absPath) ? fs.readFileSync(absPath, "utf8") : "";

    if (checkMode) {
      if (current !== normalized) {
        staleFiles.push(targetPath);
      }
      continue;
    }

    const changed = writeIfChanged(targetPath, normalized);
    if (changed) {
      changedFiles.push(targetPath);
    }
  }

  if (checkMode) {
    if (staleFiles.length > 0) {
      console.error(`llms file drift detected: ${staleFiles.join(", ")}`);
      console.error("Run: npm run seo:generate-llms");
      process.exit(1);
    }
    console.log("llms files are in sync with canonical data.");
    return;
  }

  if (changedFiles.length === 0) {
    console.log("No llms file changes required.");
    return;
  }

  console.log(`Updated ${changedFiles.length} file(s): ${changedFiles.join(", ")}`);
}

run();
