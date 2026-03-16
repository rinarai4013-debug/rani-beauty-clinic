# WF2 "Immediate Lead Response" — Fix Instructions

## Problem
WF2 fails EVERY HOUR with error: "Your request is invalid" in the "Poll Processed Intakes" Airtable node.

**Root cause:** The filter formula references field names that don't exist in the actual Airtable Client Intakes table.

## Current (BROKEN) filter in n8n:
```
AND({Processing Status} = "Processed", {AI Summary} != "", DATETIME_DIFF(NOW(), CREATED_TIME(), 'minutes') < 10)
```

### Issues:
1. `{Processing Status}` — This field does NOT exist in the Client Intakes table. **You need to create it.**
2. `{AI Summary}` — Wrong name. The real field is `{Intake Summary (AI)}`
3. `10 minutes` window is too tight — intakes that take longer to process get missed

## Fix Steps

### Step 1: Add "Processing Status" field in Airtable
1. Open Airtable → Client Intakes table
2. Click "+" to add a new field
3. Name: `Processing Status`
4. Type: **Single Select**
5. Add options: `New`, `Processed`, `Responded`
6. Set default value: `New`

### Step 2: Update WF1 (Intake Intelligence) to set Processing Status
1. Open WF1 in n8n editor
2. Find the Airtable "Update" node that writes AI fields (Intake Summary, Program Plan, etc.)
3. Add one more field to that update: `Processing Status` = `Processed`
4. This ensures every intake that gets AI-analyzed is marked as ready for WF2

### Step 3: Update WF2 filter formula
1. Open WF2 in n8n editor
2. Find the "Poll Processed Intakes" node (Airtable node)
3. Change the filter formula to:
```
AND({Processing Status} = "Processed", {Intake Summary (AI)} != "", DATETIME_DIFF(NOW(), CREATED_TIME(), 'minutes') < 60)
```

**Changes made:**
- `{AI Summary}` → `{Intake Summary (AI)}` (correct field name)
- `10` → `60` (wider window to catch slower-processed intakes)

### Step 4: Update WF2 to set status to "Responded"
1. In WF2, after the SMS/email is sent successfully
2. Add an Airtable "Update" node to set `{Processing Status}` = `Responded`
3. This prevents the same intake from being processed again

### Step 5: Test
1. Create a test intake in Typeform or directly in Airtable
2. Set its `Processing Status` to `Processed` and fill in `Intake Summary (AI)`
3. Trigger WF2 manually
4. Verify it picks up the record and sends the response
5. Verify it sets `Processing Status` to `Responded`

## Field Name Reference (Client Intakes)
Use these EXACT names in all n8n Airtable nodes:
| What you might guess | Actual field name |
|---------------------|-------------------|
| AI Summary | `Intake Summary (AI)` |
| AI Plan | `Program Plan (AI)` |
| AI Cost | `Cost Breakdown (AI)` |
| AI Timeline | `Timeline (AI)` |
| AI Next Step | `Suggested Next Step (AI)` |
| AI Value | `Treatment Value (AI)` |
| Status | `Processing Status` (create if missing) |
