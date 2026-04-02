// Rani Beauty Clinic — Single Source of Truth for Clinic Constants

export const CLINIC_NAME = "Rani Beauty Clinic";
export const CLINIC_ADDRESS = "401 Olympia Ave NE, Suite 101, Renton, WA 98056";
export const CLINIC_PHONE = "(425) 539-4440";
export const CLINIC_EMAIL = "info@ranibeautyclinic.com";
export const CLINIC_WEBSITE = "https://www.ranibeautyclinic.com";
export const BOOKING_URL = "https://booking.mangomint.com/ranibeautyclinic1";
export const CLINIC_COORDINATES = { lat: 47.486, lng: -122.1958 };
export const OWNER_NAME = "Rina Rai";
export const REVENUE_TARGET_MONTHLY = 100000;

const CLINIC_CONFIG = {
  CLINIC_NAME,
  CLINIC_ADDRESS,
  CLINIC_PHONE,
  CLINIC_EMAIL,
  CLINIC_WEBSITE,
  BOOKING_URL,
  CLINIC_COORDINATES,
  OWNER_NAME,
  REVENUE_TARGET_MONTHLY,
} as const;

export default CLINIC_CONFIG;
