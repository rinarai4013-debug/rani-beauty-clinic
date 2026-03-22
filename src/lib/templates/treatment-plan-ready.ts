/**
 * Treatment Plan Ready — Email & SMS Templates
 *
 * Sent after the n8n AI intake processing workflow completes.
 * Notifies the client that their personalized treatment plan is ready to view.
 *
 * Called by: POST /api/notify/treatment-plan
 * Triggered by: n8n Workflow WF1 (Intake Intelligence Engine)
 */

export interface TreatmentPlanNotifyVars {
  clientName: string;
  planUrl: string;
}

const CLINIC_PHONE = '(425) 539-4440';
const CLINIC_ADDRESS = '401 Olympia Ave NE #101, Renton, WA 98056';

/**
 * Generate the branded HTML email body for the "Treatment Plan Ready" notification.
 */
export function getTreatmentPlanReadyEmail(vars: TreatmentPlanNotifyVars): string {
  const { clientName, planUrl } = vars;
  const firstName = clientName.split(' ')[0] || clientName;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Your Treatment Plan is Ready</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #F8F6F1; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8F6F1;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <!-- Email container -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(15, 29, 44, 0.08);">

          <!-- Header -->
          <tr>
            <td style="background-color: #0F1D2C; padding: 40px 32px; text-align: center;">
              <!-- Logo text -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <p style="margin: 0; font-family: Georgia, 'Playfair Display', serif; font-size: 24px; font-weight: 700; color: #C9A96E; letter-spacing: 2px;">
                      RANI BEAUTY CLINIC
                    </p>
                    <p style="margin: 6px 0 0; font-size: 11px; color: rgba(255,255,255,0.4); letter-spacing: 3px; text-transform: uppercase;">
                      Physician-Supervised Medspa
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Sparkle accent bar -->
          <tr>
            <td style="background: linear-gradient(90deg, #C9A96E, #E8D5B5, #C9A96E); height: 3px; font-size: 0; line-height: 0;">
              &nbsp;
            </td>
          </tr>

          <!-- Body content -->
          <tr>
            <td style="background-color: #ffffff; padding: 40px 32px;">
              <!-- Greeting -->
              <p style="margin: 0 0 8px; font-family: Georgia, 'Playfair Display', serif; font-size: 26px; font-weight: 700; color: #0F1D2C; line-height: 1.3;">
                Hi ${firstName},
              </p>
              <p style="margin: 0 0 24px; font-family: Georgia, 'Playfair Display', serif; font-size: 22px; font-weight: 700; color: #0F1D2C; line-height: 1.3;">
                Your personalized treatment plan is ready!
              </p>

              <!-- Description -->
              <p style="margin: 0 0 16px; font-size: 15px; color: #555555; line-height: 1.7;">
                Our AI Treatment Architect has analyzed your intake and designed a custom transformation roadmap just for you. Your plan includes personalized treatment recommendations, a realistic timeline, and transparent pricing.
              </p>

              <p style="margin: 0 0 32px; font-size: 15px; color: #555555; line-height: 1.7;">
                Click below to view your plan and take the first step toward your best self.
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 8px 0 32px;">
                    <a href="${planUrl}" target="_blank" style="display: inline-block; background-color: #C9A96E; color: #0F1D2C; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">
                      View My Treatment Plan
                    </a>
                  </td>
                </tr>
              </table>

              <!-- What to expect -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8F6F1; border-radius: 12px; border-left: 4px solid #C9A96E;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <p style="margin: 0 0 12px; font-size: 14px; font-weight: 700; color: #0F1D2C;">
                      What you will find in your plan:
                    </p>
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 4px 0; font-size: 14px; color: #555555; line-height: 1.6;">
                          &#10003;&nbsp;&nbsp;Recommended treatments based on your goals
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size: 14px; color: #555555; line-height: 1.6;">
                          &#10003;&nbsp;&nbsp;Suggested timeline and treatment sequence
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size: 14px; color: #555555; line-height: 1.6;">
                          &#10003;&nbsp;&nbsp;Transparent pricing with financing options
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size: 14px; color: #555555; line-height: 1.6;">
                          &#10003;&nbsp;&nbsp;Next steps to book your consultation
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Contact section -->
          <tr>
            <td style="background-color: #0F1D2C; padding: 24px 32px; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 14px; color: rgba(255,255,255,0.8);">
                Questions? We are here to help.
              </p>
              <p style="margin: 0 0 4px;">
                <a href="tel:+14255394440" style="color: #C9A96E; text-decoration: none; font-size: 16px; font-weight: 700;">
                  ${CLINIC_PHONE}
                </a>
              </p>
              <p style="margin: 12px 0 0; font-size: 12px; color: rgba(255,255,255,0.4);">
                Rani Beauty Clinic &middot; ${CLINIC_ADDRESS}
              </p>
              <p style="margin: 4px 0 0; font-size: 12px; color: rgba(255,255,255,0.4);">
                <a href="https://www.ranibeautyclinic.com" style="color: rgba(255,255,255,0.4); text-decoration: none;">
                  ranibeautyclinic.com
                </a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Get the email subject line for the treatment plan notification.
 */
export function getTreatmentPlanReadySubject(): string {
  return 'Your Personalized Treatment Plan is Ready';
}

/**
 * Get the SMS body for the treatment plan notification.
 */
export function getTreatmentPlanReadySMS(vars: TreatmentPlanNotifyVars): string {
  const firstName = vars.clientName.split(' ')[0] || vars.clientName;
  return `Hi ${firstName}! Your personalized treatment plan from Rani Beauty Clinic is ready: ${vars.planUrl} Questions? Call ${CLINIC_PHONE}`;
}
