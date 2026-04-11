# Wave 3 Status

Wave 3 auth/security coverage has been pushed forward for the modules present in this checkout:

- `src/lib/auth/middleware.ts`
- `src/lib/patient-auth/require-patient.ts`
- `src/lib/patient-auth/session.ts`

Already present before this pass:

- `src/lib/auth/__tests__/session.test.ts`

Blocker:

- `src/lib/auth/password.ts` is not present in this checkout, so that target could not be covered in this wave.

Notes:

- Coverage was added as test files only; no production auth source was changed in this wave.
- No test run or typecheck was performed in this pass.
