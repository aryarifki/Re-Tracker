"use client";

import { signOut } from "next-auth/react";
import { Icon } from "@iconify/react";
import { usePathname } from "next/navigation";

export default function LogoutButton() {
  const pathname = usePathname();
  
  // Sembunyikan di halaman otentikasi agar tidak aneh 😂
  if (pathname === "/login" || pathname === "/pending") return null;

  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="p-2 rounded-full hover:bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)] hover:text-red-500 transition-colors duration-200"
      title="Keluar (Sign Out)"
    >
      <Icon icon="ph:sign-out-bold" width="20" />
    </button>
  );
}
