"use client";

import { signIn } from "next-auth/react";
import Image from "next/image";
import { Icon } from "@iconify/react";

export default function LoginPage() {
  const waLink = "https://wa.me/6287882725845?text=Halo%20Admin%20InvestOwl,%20saya%20ingin%20mengakses%20terminal%20bandarmologi.";

  return (
    <div className="min-h-[100dvh] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] flex items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-md bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] rounded-[24px] p-8 shadow-xl flex flex-col items-center text-center relative overflow-hidden">
        
        {/* Ornamen Garis Atas MD3 */}
        <div className="absolute top-0 left-0 w-full h-1 bg-[var(--md-sys-color-primary)]"></div>

        <div className="relative w-20 h-20 mb-4" style={{ filter: "drop-shadow(0 0 15px var(--md-sys-color-primary))" }}>
          <Image src="/logo.png" alt="InvestOwl Logo" fill className="object-contain" priority />
        </div>
        
        <h1 className="text-xl font-bold tracking-tight text-[var(--md-sys-color-on-surface)] mb-1">
          InvestOwl Terminal
        </h1>
        <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mb-8 leading-relaxed">
          Platform analitik kuantitatif pasar modal institusional. Akses terbatas hanya untuk pengguna terdaftar.
        </p>

        <div className="w-full space-y-4">
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="w-full flex items-center justify-center gap-3 bg-[var(--md-sys-color-surface-container-highest)] hover:bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)] px-4 py-3 rounded-full font-semibold transition-all active:scale-[0.98] shadow-sm"
          >
            <Icon icon="logos:google-icon" width="20" />
            Lanjutkan dengan Google
          </button>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-[var(--md-sys-color-outline-variant)]"></div>
            <span className="flex-shrink-0 mx-4 text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">ATAU HUBUNGI ADMIN</span>
            <div className="flex-grow border-t border-[var(--md-sys-color-outline-variant)]"></div>
          </div>

          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-600 dark:text-emerald-400 px-4 py-3 rounded-full font-semibold transition-all active:scale-[0.98]"
          >
            <Icon icon="ic:baseline-whatsapp" width="22" />
            Request Akses via WhatsApp
          </a>
        </div>
        
      </div>
    </div>
  );
}
