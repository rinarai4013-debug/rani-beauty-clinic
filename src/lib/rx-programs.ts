export type RxProgramSlug =
  | 'glp1-weight-management'
  | 'mens-trt'
  | 'womens-hrt'
  | 'bpc-157'
  | 'nad-injections';

export interface RxProgramConfig {
  slug: RxProgramSlug;
  programId: string;
  label: string;
  intakeFormEnvKey: string;
  parentPath?: string;
}

export const RX_PROGRAMS: Record<RxProgramSlug, RxProgramConfig> = {
  'glp1-weight-management': {
    slug: 'glp1-weight-management',
    programId: 'glp1',
    label: 'GLP-1 Weight Management',
    intakeFormEnvKey: 'RX_INTAKE_FORM_GLP1_URL',
    parentPath: '/wellness/glp1-weight-management',
  },
  'mens-trt': {
    slug: 'mens-trt',
    programId: 'mens_trt',
    label: "Men's TRT",
    intakeFormEnvKey: 'RX_INTAKE_FORM_MENS_TRT_URL',
    parentPath: '/wellness/hormone-therapy/testosterone',
  },
  'womens-hrt': {
    slug: 'womens-hrt',
    programId: 'womens_hrt',
    label: "Women's HRT",
    intakeFormEnvKey: 'RX_INTAKE_FORM_WOMENS_HRT_URL',
    parentPath: '/wellness/hormone-therapy/female-hrt',
  },
  'bpc-157': {
    slug: 'bpc-157',
    programId: 'bpc_157',
    label: 'BPC-157',
    intakeFormEnvKey: 'RX_INTAKE_FORM_BPC157_URL',
    parentPath: '/wellness/bpc-157',
  },
  'nad-injections': {
    slug: 'nad-injections',
    programId: 'nad_plus',
    label: 'NAD+',
    intakeFormEnvKey: 'RX_INTAKE_FORM_NAD_URL',
    parentPath: '/wellness/nad-injections',
  },
};

export function isRxProgramSlug(value: string): value is RxProgramSlug {
  return value in RX_PROGRAMS;
}

export function getRxProgram(slug: string): RxProgramConfig | null {
  if (!isRxProgramSlug(slug)) return null;
  return RX_PROGRAMS[slug];
}

export function getRxProgramPrimaryCta(
  slug: string,
  isWellness: boolean,
): { text: string; href: string } | null {
  if (!isWellness) return null;

  if (slug === 'glp1-weight-management') {
    return {
      text: 'Start GLP-1 Enrollment',
      href: '/wellness/glp1-weight-management/enroll',
    };
  }

  if (slug === 'nad-injections') {
    return {
      text: 'Start NAD+ Enrollment',
      href: '/wellness/nad-injections/enroll',
    };
  }

  return null;
}

export function getRxProgramEnrollmentHref(slug: RxProgramSlug): string {
  return `/wellness/${slug}/enroll`;
}

export function getRxProgramFromVariation(
  parentSlug: string,
  variationSlug: string,
): RxProgramSlug | null {
  if (parentSlug === 'hormone-therapy' && variationSlug === 'testosterone') {
    return 'mens-trt';
  }
  if (parentSlug === 'hormone-therapy' && variationSlug === 'female-hrt') {
    return 'womens-hrt';
  }
  if (variationSlug === 'bpc-157') {
    return 'bpc-157';
  }
  return null;
}
