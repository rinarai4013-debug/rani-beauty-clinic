"use client";

import LayoutMobileNav from "../layout/MobileNav";
import type { UserRole } from "@/types/auth";

interface MobileNavProps {
  role: UserRole;
}

export default function MobileNav({ role }: MobileNavProps) {
  return <LayoutMobileNav role={role} />;
}
