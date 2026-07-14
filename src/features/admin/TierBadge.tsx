interface TierBadgeProps {
  value: string;
}

const tierDescriptions: Record<string, string> = {
  "S+": "Elite tier. Among the strongest options available for this role.",
  S: "Top tier. Excellent and strongly recommended for this role.",
  A: "Very strong. A reliable and recommended option.",
  B: "Good. Useful, but stronger alternatives may exist.",
  C: "Average. Usually replaced as better heroes become available.",
  D: "Weak. Rarely recommended for meaningful investment.",
  "-": "Not ranked. This hero is not normally used for this role.",
};

function getTierClassName(value: string): string {
 const normalisedValue =
  value === "-"
    ? "not-ranked"
    : value
        .toLowerCase()
        .replace("+", "-plus");

  return `tier-badge tier-badge--${normalisedValue}`;
}

export function TierBadge({
  value,
}: TierBadgeProps) {
  const description =
    tierDescriptions[value] ??
    "No tier description is available.";

  const displayValue =
    value === "-" ? "N/A" : value;

  return (
    <span
      className={getTierClassName(value)}
      title={description}
      aria-label={`${displayValue}: ${description}`}
    >
      {displayValue}
    </span>
  );
}