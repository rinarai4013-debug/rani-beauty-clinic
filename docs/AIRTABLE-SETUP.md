# Airtable Clients Table -- Field Creation Checklist

This document is the manual setup checklist for creating all required fields in the Airtable **Clients** table. Every field listed here maps to a constant in `src/lib/airtable/tables.ts` under `FIELDS.clients`. If a field is missing from your Airtable base, the code that references it will silently fail or throw errors.

- **Base ID:** `app1SwhSfwe8GKUg4`
- **Table Name:** `Clients`
- **Source of truth:** `src/lib/airtable/tables.ts` -- `FIELDS.clients`

---

## Identity

| Field Name | Airtable Field Type | Required? | Notes |
|---|---|---|---|
| `Client` | Single line text | Yes | Full name. Falls back to email prefix if not provided. |
| `MangoMint Client ID` | Single line text | No | Links to Mangomint POS record. Populated by booking sync. |

## Contact

| Field Name | Airtable Field Type | Required? | Notes |
|---|---|---|---|
| `Email` | Email | Yes | Primary lookup key. Used to match/upsert clients. Must be unique. |
| `Phone` | Phone | No | Mobile number. Set on create if provided. |
| `Preferred Contact` | Single select | Yes | Auto-set to "Text" if phone provided, otherwise "Email". Options: `Text`, `Email`. |

## Lead Status

| Field Name | Airtable Field Type | Required? | Notes |
|---|---|---|---|
| `Status` | Single select | Yes | Lifecycle stage. Options: `New Lead`, `Active`, `Lapsed 30`, `Lapsed 60`, `Lapsed 90`, `Churned`. Set to "New Lead" on create. |

## Attribution (First Touch)

| Field Name | Airtable Field Type | Required? | Notes |
|---|---|---|---|
| `Lead Source` | Single line text | No | Where the lead originated (e.g., google, meta, referral). First-touch only -- never overwritten. |
| `Lead Medium` | Single line text | No | Traffic medium (e.g., cpc, organic, social). First-touch only. |
| `Lead Campaign` | Single line text | No | Campaign name from ad platform. First-touch only. |
| `Lead Ad Set` | Single line text | No | Ad set / ad group name. First-touch only. |
| `Lead Ad` | Single line text | No | Individual ad creative name. First-touch only. |
| `Lead Offer` | Single line text | No | Offer or promo code that brought the lead in. First-touch only. |
| `Lead Landing Page` | Single line text | No | URL of the landing page from first visit. First-touch only. |
| `Lead Keyword` | Single line text | No | Search keyword that triggered the ad. First-touch only. |
| `Lead Referrer` | Single line text | No | Referring domain or URL. First-touch only. |
| `Attribution ID` | Single line text | No | Unique ID tying this client to an attribution session. First-touch only. |
| `First Touch At` | Date | No | Timestamp of first interaction. First-touch only -- never overwritten. |
| `Last Touch At` | Date | No | Timestamp of most recent interaction. Updated on every touch. |
| `Attribution Model` | Single line text | Yes | Attribution model used. Set to "first_touch" on create. |

## Attribution (UTM)

| Field Name | Airtable Field Type | Required? | Notes |
|---|---|---|---|
| `UTM Source` | Single line text | No | `utm_source` query param value. First-touch only. |
| `UTM Medium` | Single line text | No | `utm_medium` query param value. First-touch only. |
| `UTM Campaign` | Single line text | No | `utm_campaign` query param value. First-touch only. |
| `UTM Content` | Single line text | No | `utm_content` query param value. First-touch only. |
| `UTM Term` | Single line text | No | `utm_term` query param value. First-touch only. |

## Booking

| Field Name | Airtable Field Type | Required? | Notes |
|---|---|---|---|
| `First Booking Source` | Single line text | No | Channel of the client's first booking. |
| `First Booking Offer` | Single line text | No | Offer/promo associated with first booking. |

## Financial

| Field Name | Airtable Field Type | Required? | Notes |
|---|---|---|---|
| `Attributed Revenue` | Number (currency) | No | Total revenue attributed to this client's acquisition source. |

## Linked Records (read-only)

These fields are automatically populated by Airtable when records in other tables link back to Clients. You do **not** need to create these manually unless the linked tables are not yet set up.

| Field Name | Airtable Field Type | Notes |
|---|---|---|
| `Client Intakes` | Linked record (to Intake) | Intake form submissions linked to this client. |
| `Intake Intelligence` | Linked record (to Intake Intelligence) | AI-processed intake data. |
| `Appointments` | Linked record (to Appointments) | All appointments for this client. |
| `Packages` | Linked record (to Packages) | Treatment packages purchased. |
| `Memberships` | Linked record (to Memberships) | Active/past memberships. |
| `Transactions` | Linked record (to Transactions) | Payment and transaction history. |
| `Messages Log` | Linked record (to Messages Log) | SMS/email communication log. |
| `Reviews` | Linked record (to Reviews) | Google reviews left by this client. |

---

## How to Create These Fields

1. **Open Airtable** and navigate to the base with ID `app1SwhSfwe8GKUg4`.
2. **Open the "Clients" table.** If it does not exist, create a new table named exactly `Clients`.
3. **For each field in the tables above**, do the following:
   - Click the `+` button at the right end of the field header row.
   - Enter the **exact** field name as shown in the "Field Name" column (case-sensitive, spaces matter).
   - Select the **Airtable Field Type** listed.
   - For **Single select** fields (`Status`, `Preferred Contact`), add the option values noted in the "Notes" column.
   - For **Number (currency)** fields (`Attributed Revenue`), set the format to "Currency" and choose USD.
   - For **Date** fields (`First Touch At`, `Last Touch At`), enable the time component if you need timestamp precision.
   - Click **Create field**.
4. **Verify field names** match exactly. The code uses string lookups -- a typo or extra space will cause silent failures.
5. **Linked record fields** will appear automatically once the linked tables (Intake, Appointments, etc.) are created and configured with a link-to-Clients column. You do not need to manually create these in the Clients table.

### Quick Validation

After creating all fields, confirm the setup by:

- Opening the Rani dashboard and navigating to the Clients page.
- Submitting a test lead through the contact form at `/contact`.
- Checking that a new row appears in the Clients table with `Status` = "New Lead" and `Email` populated.
- Verifying attribution fields populate when UTM params are present on the contact form URL.
