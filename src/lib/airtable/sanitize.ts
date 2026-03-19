/**
 * Sanitize a value before injecting it into an Airtable filterByFormula string.
 * Strips characters that could break or escape the formula syntax.
 */
export function sanitizeFormulaValue(value: string): string {
  return value.replace(/['"\\\n\r]/g, '');
}
