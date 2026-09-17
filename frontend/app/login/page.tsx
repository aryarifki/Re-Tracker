"use client";

import { signIn } from "next-auth/react";
import { Icon } from "@iconify/react";
import Image from "next/image";

export default function LoginPage() {
  const handleWhatsApp = () => {
    window.open("https://wa.me/6287882725845?text=Halo%20Admin,%20saya%20ingin%20request%20akses%20untuk%20The%20Investowl.", "_blank");
  };

  return (
    <div className="min-h-[90vh] flex flex-col items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md flex flex-col gap-6">
        
        {/* KARTU UTAMA LOGIN */}
        <div className="bg-[var(--md-sys-color-surface-container)] rounded-[32px] p-8 sm:p-10 shadow-sm border border-[var(--md-sys-color-outline-variant)] relative overflow-hidden">
          
          {/* Dekorasi Latar Belakang */}
          <div className="absolute -top-24 -right-24 w-56 h-56 bg-[var(--md-sys-color-primary-container)] rounded-full blur-3xl opacity-50"></div>
          <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-[var(--md-sys-color-tertiary-container)] rounded-full blur-3xl opacity-50"></div>

          <div className="relative z-10 flex flex-col items-center text-center mb-10 mt-2">
            <div className="w-20 h-20 mb-6 relative drop-shadow-sm">
              <Image 
                src="/logo.png" 
                alt="The Investowl Logo" 
                fill 
                sizes="80px"
                className="object-contain" 
                priority 
              />
            </div>
            
            <h1 className="text-3xl font-extrabold text-[var(--md-sys-color-on-surface)] tracking-tight mb-3">
              The Investowl
            </h1>
            <p className="text-sm font-medium text-[var(--md-sys-color-on-surface-variant)] leading-relaxed px-2">
              Akses terbatas hanya untuk pengguna terdaftar.
            </p>
          </div>

          <div className="relative z-10 space-y-4">
            <button
              onClick={() => signIn("google", { callbackUrl: "/" })}
              className="w-full flex items-center justify-center gap-3 bg-[var(--md-sys-color-surface-container-highest)] hover:bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-full px-6 py-4 text-sm font-bold transition-all active:scale-[0.98] shadow-sm"
            >
              <Icon icon="logos:google-icon" width="22" />
              Lanjutkan dengan Google
            </button>

            <div className="flex items-center py-2">
              <div className="flex-grow border-t border-[var(--md-sys-color-outline-variant)]"></div>
              <span className="flex-shrink-0 mx-4 text-xs font-bold tracking-[0.2em] text-[var(--md-sys-color-outline)] uppercase">
                Atau
              </span>
              <div className="flex-grow border-t border-[var(--md-sys-color-outline-variant)]"></div>
            </div>

            {/* Perbaikan Kontras Tombol WhatsApp (MD3 Expressive) */}
            <button
              onClick={handleWhatsApp}
              className="w-full flex items-center justify-center gap-3 bg-[#128C7E] hover:bg-[#075E54] text-white dark:bg-[#25D366] dark:hover:bg-[#128C7E] dark:text-[#075E54] rounded-full px-6 py-4 text-sm font-bold transition-all active:scale-[0.98] shadow-sm"
            >
              <Icon icon="ph:whatsapp-logo-fill" width="24" />
              Request Akses via WhatsApp
            </button>
          </div>
        </div>

        {/* KOTAK DISCLAIMER (MD3 EXPRESSIVE STYLING) */}
        <div className="bg-[var(--md-sys-color-surface-container-high)] rounded-[28px] p-6 sm:p-7 border border-[var(--md-sys-color-outline-variant)] shadow-sm">
          <div className="flex items-center gap-2.5 mb-3 text-[var(--md-sys-color-error)]">
            <Icon icon="ph:warning-circle-fill" width="22" />
            <span className="text-sm font-bold uppercase tracking-widest">Disclaimer</span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-[var(--md-sys-color-on-surface-variant)] leading-relaxed text-center">
            This project is built for educational purposes and data science research. It is not financial or investment advice. The behavioral buckets (&quot;Smart Money&quot;, &quot;Retail&quot;, etc.) are heuristic classifications based on historical broker patterns, not official identities. Any corporate-affiliation notes discovered using this tool are observational hypotheses and do not imply insider trading or wrongdoing.
          </p>
        </div>

      </div>
    </div>
  );
}
