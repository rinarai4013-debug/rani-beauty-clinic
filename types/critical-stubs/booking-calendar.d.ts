import type { BookableService, CalendarColorMode } from "@/lib/booking/types";
import type { AvailabilityEngine } from "@/lib/booking/availability";

export class CalendarManager {
  constructor(engine: AvailabilityEngine, services: BookableService[]);
  getProviderView(dateStr: string): unknown;
  getRoomView(dateStr: string): unknown;
  getRevenueOverlay(dateStr: string): unknown;
  getPrintSchedule(dateStr: string): unknown;
  getDayView(dateStr: string, colorMode?: CalendarColorMode): unknown;
  getWeekView(dateStr: string, colorMode?: CalendarColorMode): unknown;
  getMonthView(dateStr: string, colorMode?: CalendarColorMode): unknown;
}
