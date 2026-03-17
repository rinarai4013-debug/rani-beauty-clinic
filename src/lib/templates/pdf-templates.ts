// Luxury PDF Templates for W2 Document Architect
// These generate branded HTML that n8n converts to PDF via Google Docs or Puppeteer

interface TreatmentRoadmapData {
  clientName: string;
  providerName: string;
  date: string;
  treatmentPlan: Array<{
    phase: number;
    title: string;
    treatments: string[];
    timeline: string;
    estimatedCost: number;
    notes?: string;
  }>;
  totalEstimate: number;
  goals: string[];
  financingOptions?: string;
  nextSteps: string;
}

interface AftercareData {
  clientName: string;
  providerName: string;
  treatmentDate: string;
  serviceName: string;
  serviceCategory: string;
  aftercareInstructions: string[];
  avoidList: string[];
  expectedTimeline: Array<{ day: string; expectation: string }>;
  emergencyContact: string;
  followUpDate?: string;
  products?: Array<{ name: string; usage: string }>;
}

const BRAND = {
  navy: '#0F1D2C',
  gold: '#C9A96E',
  cream: '#F8F6F1',
  muted: '#8B7E74',
  white: '#FFFFFF',
  font: "'Playfair Display', Georgia, serif",
  bodyFont: "'Montserrat', 'Helvetica Neue', Arial, sans-serif",
};

function header(title: string): string {
  return `
    <div style="background: linear-gradient(135deg, ${BRAND.navy} 0%, #1a2d42 100%); padding: 48px 40px 36px; text-align: center;">
      <div style="margin-bottom: 8px;">
        <span style="font-family: ${BRAND.font}; font-size: 28px; color: ${BRAND.gold}; letter-spacing: 3px;">RANI</span>
      </div>
      <div style="font-family: ${BRAND.bodyFont}; font-size: 10px; color: ${BRAND.gold}; letter-spacing: 4px; text-transform: uppercase; opacity: 0.8;">
        Beauty Clinic
      </div>
      <div style="width: 60px; height: 1px; background: ${BRAND.gold}; margin: 20px auto 16px;"></div>
      <div style="font-family: ${BRAND.font}; font-size: 18px; color: ${BRAND.white}; letter-spacing: 1px;">
        ${title}
      </div>
    </div>
  `;
}

function footer(): string {
  return `
    <div style="background: ${BRAND.navy}; padding: 24px 40px; text-align: center; margin-top: 40px;">
      <p style="font-family: ${BRAND.bodyFont}; font-size: 11px; color: ${BRAND.gold}; margin: 0 0 4px;">
        Rani Beauty Clinic &middot; 401 Olympia Ave NE #101, Renton, WA 98056
      </p>
      <p style="font-family: ${BRAND.bodyFont}; font-size: 11px; color: ${BRAND.muted}; margin: 0 0 4px;">
        (425) 271-7264 &middot; info@ranibeautyclinic.com &middot; ranibeautyclinic.com
      </p>
      <p style="font-family: ${BRAND.bodyFont}; font-size: 9px; color: ${BRAND.muted}; margin: 8px 0 0; opacity: 0.7;">
        This document is confidential and prepared exclusively for the named client.
      </p>
    </div>
  `;
}

export function generateTreatmentRoadmapHTML(data: TreatmentRoadmapData): string {
  const phaseRows = data.treatmentPlan.map(phase => `
    <div style="margin-bottom: 24px; page-break-inside: avoid;">
      <div style="display: flex; align-items: flex-start; gap: 16px;">
        <div style="width: 40px; height: 40px; background: ${BRAND.gold}; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          <span style="font-family: ${BRAND.font}; font-size: 18px; color: ${BRAND.white};">${phase.phase}</span>
        </div>
        <div style="flex: 1;">
          <h3 style="font-family: ${BRAND.font}; font-size: 16px; color: ${BRAND.navy}; margin: 0 0 6px;">
            ${phase.title}
          </h3>
          <p style="font-family: ${BRAND.bodyFont}; font-size: 11px; color: ${BRAND.gold}; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1px;">
            ${phase.timeline}
          </p>
          <div style="background: ${BRAND.cream}; border-radius: 8px; padding: 16px; border-left: 3px solid ${BRAND.gold};">
            <ul style="margin: 0; padding-left: 16px;">
              ${phase.treatments.map(t => `
                <li style="font-family: ${BRAND.bodyFont}; font-size: 13px; color: ${BRAND.navy}; margin-bottom: 6px; line-height: 1.5;">
                  ${t}
                </li>
              `).join('')}
            </ul>
            ${phase.notes ? `<p style="font-family: ${BRAND.bodyFont}; font-size: 11px; color: ${BRAND.muted}; margin: 12px 0 0; font-style: italic;">${phase.notes}</p>` : ''}
          </div>
          <p style="font-family: ${BRAND.bodyFont}; font-size: 12px; color: ${BRAND.navy}; margin: 12px 0 0; text-align: right;">
            Estimated: <strong>$${phase.estimatedCost.toLocaleString()}</strong>
          </p>
        </div>
      </div>
    </div>
  `).join('');

  const goalsHTML = data.goals.map(g => `
    <li style="font-family: ${BRAND.bodyFont}; font-size: 13px; color: ${BRAND.navy}; margin-bottom: 8px; line-height: 1.5;">
      ${g}
    </li>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Montserrat:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; background: ${BRAND.white}; }
      </style>
    </head>
    <body>
      ${header('Your Transformation Roadmap')}

      <div style="padding: 40px;">
        <!-- Client Info -->
        <div style="display: flex; justify-content: space-between; margin-bottom: 32px; padding-bottom: 16px; border-bottom: 1px solid #e5e1dc;">
          <div>
            <p style="font-family: ${BRAND.bodyFont}; font-size: 11px; color: ${BRAND.muted}; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 1px;">Prepared For</p>
            <p style="font-family: ${BRAND.font}; font-size: 20px; color: ${BRAND.navy}; margin: 0;">${data.clientName}</p>
          </div>
          <div style="text-align: right;">
            <p style="font-family: ${BRAND.bodyFont}; font-size: 11px; color: ${BRAND.muted}; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 1px;">Date</p>
            <p style="font-family: ${BRAND.bodyFont}; font-size: 14px; color: ${BRAND.navy}; margin: 0;">${data.date}</p>
            <p style="font-family: ${BRAND.bodyFont}; font-size: 11px; color: ${BRAND.muted}; margin: 4px 0 0;">by ${data.providerName}</p>
          </div>
        </div>

        <!-- Goals -->
        <div style="margin-bottom: 32px;">
          <h2 style="font-family: ${BRAND.font}; font-size: 16px; color: ${BRAND.gold}; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 2px;">
            Your Goals
          </h2>
          <ul style="margin: 0; padding-left: 20px;">
            ${goalsHTML}
          </ul>
        </div>

        <!-- Treatment Phases -->
        <div style="margin-bottom: 32px;">
          <h2 style="font-family: ${BRAND.font}; font-size: 16px; color: ${BRAND.gold}; margin: 0 0 24px; text-transform: uppercase; letter-spacing: 2px;">
            Your Treatment Journey
          </h2>
          ${phaseRows}
        </div>

        <!-- Investment Summary -->
        <div style="background: linear-gradient(135deg, ${BRAND.navy} 0%, #1a2d42 100%); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="font-family: ${BRAND.bodyFont}; font-size: 10px; color: ${BRAND.gold}; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 2px;">
            Total Investment
          </p>
          <p style="font-family: ${BRAND.font}; font-size: 32px; color: ${BRAND.white}; margin: 0;">
            $${data.totalEstimate.toLocaleString()}
          </p>
          ${data.financingOptions ? `
            <p style="font-family: ${BRAND.bodyFont}; font-size: 12px; color: ${BRAND.gold}; margin: 12px 0 0; opacity: 0.9;">
              ${data.financingOptions}
            </p>
          ` : ''}
        </div>

        <!-- Next Steps -->
        <div style="background: ${BRAND.cream}; border-radius: 12px; padding: 24px;">
          <h2 style="font-family: ${BRAND.font}; font-size: 14px; color: ${BRAND.navy}; margin: 0 0 12px;">
            Next Steps
          </h2>
          <p style="font-family: ${BRAND.bodyFont}; font-size: 13px; color: ${BRAND.navy}; margin: 0; line-height: 1.6;">
            ${data.nextSteps}
          </p>
        </div>
      </div>

      ${footer()}
    </body>
    </html>
  `;
}

export function generateAftercareHTML(data: AftercareData): string {
  const instructionsList = data.aftercareInstructions.map(inst => `
    <li style="font-family: ${BRAND.bodyFont}; font-size: 13px; color: ${BRAND.navy}; margin-bottom: 10px; line-height: 1.6; padding-left: 4px;">
      ${inst}
    </li>
  `).join('');

  const avoidList = data.avoidList.map(item => `
    <li style="font-family: ${BRAND.bodyFont}; font-size: 13px; color: #b91c1c; margin-bottom: 8px; line-height: 1.5;">
      ${item}
    </li>
  `).join('');

  const timelineRows = data.expectedTimeline.map(t => `
    <tr>
      <td style="padding: 10px 16px; font-family: ${BRAND.bodyFont}; font-size: 12px; color: ${BRAND.gold}; font-weight: 600; border-bottom: 1px solid #f0ebe4; white-space: nowrap;">
        ${t.day}
      </td>
      <td style="padding: 10px 16px; font-family: ${BRAND.bodyFont}; font-size: 12px; color: ${BRAND.navy}; border-bottom: 1px solid #f0ebe4; line-height: 1.5;">
        ${t.expectation}
      </td>
    </tr>
  `).join('');

  const productsHTML = data.products && data.products.length > 0 ? `
    <div style="margin-top: 24px;">
      <h2 style="font-family: ${BRAND.font}; font-size: 14px; color: ${BRAND.gold}; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 2px;">
        Recommended Products
      </h2>
      <div style="background: ${BRAND.cream}; border-radius: 12px; padding: 20px;">
        ${data.products.map(p => `
          <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e5e1dc;">
            <p style="font-family: ${BRAND.bodyFont}; font-size: 13px; color: ${BRAND.navy}; font-weight: 600; margin: 0 0 4px;">${p.name}</p>
            <p style="font-family: ${BRAND.bodyFont}; font-size: 12px; color: ${BRAND.muted}; margin: 0;">${p.usage}</p>
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Montserrat:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; background: ${BRAND.white}; }
      </style>
    </head>
    <body>
      ${header('Aftercare Guide')}

      <div style="padding: 40px;">
        <!-- Treatment Info -->
        <div style="display: flex; justify-content: space-between; margin-bottom: 32px; padding-bottom: 16px; border-bottom: 1px solid #e5e1dc;">
          <div>
            <p style="font-family: ${BRAND.bodyFont}; font-size: 11px; color: ${BRAND.muted}; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 1px;">Client</p>
            <p style="font-family: ${BRAND.font}; font-size: 18px; color: ${BRAND.navy}; margin: 0;">${data.clientName}</p>
          </div>
          <div style="text-align: right;">
            <p style="font-family: ${BRAND.bodyFont}; font-size: 11px; color: ${BRAND.muted}; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 1px;">Treatment</p>
            <p style="font-family: ${BRAND.font}; font-size: 16px; color: ${BRAND.navy}; margin: 0;">${data.serviceName}</p>
            <p style="font-family: ${BRAND.bodyFont}; font-size: 11px; color: ${BRAND.muted}; margin: 4px 0 0;">${data.treatmentDate} &middot; ${data.providerName}</p>
          </div>
        </div>

        <!-- Aftercare Instructions -->
        <div style="margin-bottom: 28px;">
          <h2 style="font-family: ${BRAND.font}; font-size: 16px; color: ${BRAND.gold}; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 2px;">
            Aftercare Instructions
          </h2>
          <ol style="margin: 0; padding-left: 20px; counter-reset: item;">
            ${instructionsList}
          </ol>
        </div>

        <!-- Avoid -->
        <div style="margin-bottom: 28px; background: #fef2f2; border-radius: 12px; padding: 20px; border-left: 4px solid #ef4444;">
          <h2 style="font-family: ${BRAND.font}; font-size: 14px; color: #b91c1c; margin: 0 0 12px;">
            Please Avoid
          </h2>
          <ul style="margin: 0; padding-left: 16px;">
            ${avoidList}
          </ul>
        </div>

        <!-- Expected Timeline -->
        <div style="margin-bottom: 28px;">
          <h2 style="font-family: ${BRAND.font}; font-size: 16px; color: ${BRAND.gold}; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 2px;">
            What to Expect
          </h2>
          <table style="width: 100%; border-collapse: collapse; background: ${BRAND.cream}; border-radius: 12px; overflow: hidden;">
            ${timelineRows}
          </table>
        </div>

        ${productsHTML}

        <!-- Emergency + Follow-Up -->
        <div style="display: flex; gap: 16px; margin-top: 28px;">
          <div style="flex: 1; background: ${BRAND.navy}; border-radius: 12px; padding: 20px; text-align: center;">
            <p style="font-family: ${BRAND.bodyFont}; font-size: 10px; color: ${BRAND.gold}; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 2px;">
              Questions or Concerns?
            </p>
            <p style="font-family: ${BRAND.font}; font-size: 16px; color: ${BRAND.white}; margin: 0;">
              ${data.emergencyContact}
            </p>
          </div>
          ${data.followUpDate ? `
            <div style="flex: 1; background: ${BRAND.cream}; border-radius: 12px; padding: 20px; text-align: center;">
              <p style="font-family: ${BRAND.bodyFont}; font-size: 10px; color: ${BRAND.gold}; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 2px;">
                Follow-Up Appointment
              </p>
              <p style="font-family: ${BRAND.font}; font-size: 16px; color: ${BRAND.navy}; margin: 0;">
                ${data.followUpDate}
              </p>
            </div>
          ` : ''}
        </div>
      </div>

      ${footer()}
    </body>
    </html>
  `;
}

export function generateConsultSummaryHTML(data: {
  clientName: string;
  providerName: string;
  consultDate: string;
  concerns: string[];
  recommendations: Array<{ service: string; description: string; price: number }>;
  totalEstimate: number;
  goodOption: { name: string; services: string[]; price: number };
  betterOption: { name: string; services: string[]; price: number };
  bestOption: { name: string; services: string[]; price: number };
  financingNote?: string;
  validUntil: string;
}): string {
  const tierCard = (tier: { name: string; services: string[]; price: number }, label: string, highlight: boolean) => `
    <div style="flex: 1; background: ${highlight ? `linear-gradient(135deg, ${BRAND.navy} 0%, #1a2d42 100%)` : BRAND.cream}; border-radius: 12px; padding: 24px; text-align: center; ${highlight ? `border: 2px solid ${BRAND.gold};` : ''}">
      <p style="font-family: ${BRAND.bodyFont}; font-size: 10px; color: ${highlight ? BRAND.gold : BRAND.muted}; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 2px;">
        ${label}
      </p>
      <p style="font-family: ${BRAND.font}; font-size: 15px; color: ${highlight ? BRAND.white : BRAND.navy}; margin: 0 0 16px;">
        ${tier.name}
      </p>
      ${tier.services.map(s => `
        <p style="font-family: ${BRAND.bodyFont}; font-size: 12px; color: ${highlight ? '#d1d5db' : BRAND.muted}; margin: 0 0 6px;">
          ${s}
        </p>
      `).join('')}
      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid ${highlight ? 'rgba(201,169,110,0.3)' : '#e5e1dc'};">
        <p style="font-family: ${BRAND.font}; font-size: 24px; color: ${highlight ? BRAND.gold : BRAND.navy}; margin: 0;">
          $${tier.price.toLocaleString()}
        </p>
      </div>
    </div>
  `;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Montserrat:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; background: ${BRAND.white}; }
      </style>
    </head>
    <body>
      ${header('Consultation Summary')}

      <div style="padding: 40px;">
        <!-- Client + Date -->
        <div style="display: flex; justify-content: space-between; margin-bottom: 32px; padding-bottom: 16px; border-bottom: 1px solid #e5e1dc;">
          <div>
            <p style="font-family: ${BRAND.bodyFont}; font-size: 11px; color: ${BRAND.muted}; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 1px;">Prepared For</p>
            <p style="font-family: ${BRAND.font}; font-size: 20px; color: ${BRAND.navy}; margin: 0;">${data.clientName}</p>
          </div>
          <div style="text-align: right;">
            <p style="font-family: ${BRAND.bodyFont}; font-size: 11px; color: ${BRAND.muted}; margin: 0 0 4px;">Consultation Date</p>
            <p style="font-family: ${BRAND.bodyFont}; font-size: 14px; color: ${BRAND.navy}; margin: 0;">${data.consultDate}</p>
            <p style="font-family: ${BRAND.bodyFont}; font-size: 11px; color: ${BRAND.muted}; margin: 4px 0 0;">with ${data.providerName}</p>
          </div>
        </div>

        <!-- Your Concerns -->
        <div style="margin-bottom: 28px;">
          <h2 style="font-family: ${BRAND.font}; font-size: 16px; color: ${BRAND.gold}; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 2px;">
            Your Concerns
          </h2>
          <ul style="margin: 0; padding-left: 20px;">
            ${data.concerns.map(c => `<li style="font-family: ${BRAND.bodyFont}; font-size: 13px; color: ${BRAND.navy}; margin-bottom: 8px; line-height: 1.5;">${c}</li>`).join('')}
          </ul>
        </div>

        <!-- Treatment Options -->
        <div style="margin-bottom: 28px;">
          <h2 style="font-family: ${BRAND.font}; font-size: 16px; color: ${BRAND.gold}; margin: 0 0 20px; text-transform: uppercase; letter-spacing: 2px;">
            Your Options
          </h2>
          <div style="display: flex; gap: 16px;">
            ${tierCard(data.goodOption, 'Good', false)}
            ${tierCard(data.betterOption, 'Better', true)}
            ${tierCard(data.bestOption, 'Best', false)}
          </div>
        </div>

        ${data.financingNote ? `
          <div style="background: ${BRAND.cream}; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <p style="font-family: ${BRAND.bodyFont}; font-size: 13px; color: ${BRAND.navy}; margin: 0;">
              ${data.financingNote}
            </p>
          </div>
        ` : ''}

        <p style="font-family: ${BRAND.bodyFont}; font-size: 11px; color: ${BRAND.muted}; text-align: center; margin-top: 24px;">
          This proposal is valid until ${data.validUntil}. Pricing subject to change.
        </p>
      </div>

      ${footer()}
    </body>
    </html>
  `;
}
