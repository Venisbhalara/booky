export function SectionHeading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      style={{
        backgroundColor: "var(--pale-periwinkle, #c2b4eb)",
        borderRadius: "2.5em",
        padding: "3em 2.5em",
        marginBottom: "1.5em",
        position: "relative",
        overflow: "hidden",
      }}
      className="flex flex-wrap items-end justify-between gap-4"
    >
      <div style={{ position: "relative", zIndex: 1 }}>
        <h1
          style={{
            fontFamily: "Champ, Arial, sans-serif",
            color: "var(--black, #000)",
            lineHeight: 0.85,
            letterSpacing: "-0.01em",
          }}
          className="text-4xl font-bold sm:text-6xl"
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              fontFamily: "Degular, Arial, sans-serif",
              color: "var(--black, #000)",
              marginTop: "0.5em",
            }}
            className="text-lg font-semibold opacity-85 sm:text-xl"
          >
            {subtitle}
          </p>
        )}
      </div>
      {action && <div style={{ position: "relative", zIndex: 1 }}>{action}</div>}
    </div>
  );
}
