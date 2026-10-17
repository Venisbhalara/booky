export function Badge({
  children,
  tone = "brand",
}: {
  children: React.ReactNode;
  tone?: "brand" | "navy" | "coral" | "muted" | "green";
}) {
  const tones = {
    brand: "bg-[#1ce8ed] text-black",
    navy: "bg-[#670a2e] text-white",
    coral: "bg-[#fd48f2] text-black",
    muted: "bg-[#faed8f] text-black",
    green: "bg-[#69fe6f] text-black",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-[0.5em] px-3 py-1 text-xs font-bold tracking-tight ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
