import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const CLINIC_EMAIL = process.env.CONTACT_EMAIL || "hello@ranibeautyclinic.com";
const FROM_EMAIL = process.env.FROM_EMAIL || "Rani Beauty Clinic <noreply@ranibeautyclinic.com>";

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  service: string;
  preferredDate?: string;
  message?: string;
  honeypot?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ContactFormData = await request.json();

    // Honeypot check — if this hidden field has a value, it was filled by a bot
    if (body.honeypot) {
      // Return success to the bot so it thinks it worked, but do nothing
      return NextResponse.json(
        { success: true, message: "Message sent successfully." },
        { status: 200 }
      );
    }

    // Validate required fields
    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { error: "Name is required." },
        { status: 400 }
      );
    }

    if (!body.email || !body.email.trim()) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (!body.service || !body.service.trim()) {
      return NextResponse.json(
        { error: "Please select a service of interest." },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedData = {
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      phone: body.phone?.trim() || "",
      service: body.service.trim(),
      preferredDate: body.preferredDate?.trim() || "",
      message: body.message?.trim() || "",
      submittedAt: new Date().toISOString(),
    };

    // Send email notification to clinic via Resend
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: FROM_EMAIL,
        to: CLINIC_EMAIL,
        replyTo: sanitizedData.email,
        subject: `New Consultation Request — ${sanitizedData.service}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #0F1D2C; padding: 24px; text-align: center;">
              <h1 style="color: #C9A96E; margin: 0; font-size: 24px;">New Consultation Request</h1>
            </div>
            <div style="padding: 24px; background-color: #ffffff;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #0F1D2C; width: 140px;">Name</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #555;">${sanitizedData.name}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #0F1D2C;">Email</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #555;"><a href="mailto:${sanitizedData.email}">${sanitizedData.email}</a></td>
                </tr>
                ${sanitizedData.phone ? `<tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #0F1D2C;">Phone</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #555;"><a href="tel:${sanitizedData.phone}">${sanitizedData.phone}</a></td>
                </tr>` : ""}
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #0F1D2C;">Service</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #555;">${sanitizedData.service}</td>
                </tr>
                ${sanitizedData.preferredDate ? `<tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #0F1D2C;">Preferred Date</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #555;">${sanitizedData.preferredDate}</td>
                </tr>` : ""}
                ${sanitizedData.message ? `<tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #0F1D2C;">Message</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #555;">${sanitizedData.message}</td>
                </tr>` : ""}
              </table>
              <p style="margin-top: 24px; color: #888; font-size: 12px;">Submitted at ${sanitizedData.submittedAt}</p>
            </div>
            <div style="background-color: #F8F6F1; padding: 16px; text-align: center;">
              <p style="margin: 0; color: #888; font-size: 12px;">Rani Beauty Clinic &middot; 401 Olympia Ave NE #101, Renton, WA 98056</p>
            </div>
          </div>
        `,
      });
    } else {
      // Fallback: log to console if RESEND_API_KEY is not configured
      console.log("=== New Contact Form Submission ===");
      console.log(JSON.stringify(sanitizedData, null, 2));
      console.log("===================================");
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Thank you! Your message has been received. Our team will contact you within 24 hours.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again or call us directly." },
      { status: 500 }
    );
  }
}
