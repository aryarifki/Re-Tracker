export default function SignalBadge({ signal }: { signal?: string | null }) {
  const s = (signal || "NETRAL").toUpperCase();
  const style = s.includes("AKUMULASI")
    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
    : s.includes("DISTRIBUSI")
    ? "bg-red-500/15 text-red-400 border-red-500/30"
    : "bg-neutral-500/15 text-neutral-400 border-neutral-500/30";
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${style}`}>
      {s}
    </span>
  );
}
