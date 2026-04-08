export function addDays(date: Date | number | string, amount: number): Date;
export function subDays(date: Date | number | string, amount: number): Date;
export function format(date: Date | number | string, formatStr: string): string;
export function parseISO(argument: string): Date;
export function differenceInDays(dateLeft: Date | number | string, dateRight: Date | number | string): number;
export function startOfWeek(date: Date | number | string, options?: { weekStartsOn?: number }): Date;
export function endOfWeek(date: Date | number | string, options?: { weekStartsOn?: number }): Date;
export function startOfMonth(date: Date | number | string): Date;
export function endOfMonth(date: Date | number | string): Date;
