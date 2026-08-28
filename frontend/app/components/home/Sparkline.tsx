export default function Sparkline({
  data, up,
}: { data: number[]; up: boolean }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => `(i/(data.length−1))∗100,{(i / (data.length - 1)) * 100},(i/(data.length−1))∗100,{28 - ((v - min) / range) * 24}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 28" className="w-20 h-7" preserveAspectRatio="none">
      <polyline
        points={pts} fill="none"
        stroke={up ? "#34d399" : "#f87171"} strokeWidth="1.5"
      />
    </svg>
  );
}
