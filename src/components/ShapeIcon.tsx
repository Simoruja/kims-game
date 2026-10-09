import { ShapeKind } from "@/lib/types";

export default function ShapeIcon({
  shape,
  color,
  className,
}: {
  shape: ShapeKind;
  color: string;
  className?: string;
}) {
  const common = { fill: color, stroke: "rgba(0,0,0,0.15)", strokeWidth: 1.5 };

  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      {shape === "circle" && <circle cx={50} cy={50} r={42} {...common} />}
      {shape === "square" && (
        <rect x={10} y={10} width={80} height={80} rx={10} {...common} />
      )}
      {shape === "triangle" && (
        <polygon points="50,8 92,88 8,88" {...common} />
      )}
      {shape === "diamond" && (
        <polygon points="50,6 94,50 50,94 6,50" {...common} />
      )}
      {shape === "pentagon" && (
        <polygon points="50,6 95,38 78,92 22,92 5,38" {...common} />
      )}
      {shape === "hexagon" && (
        <polygon points="25,6 75,6 97,50 75,94 25,94 3,50" {...common} />
      )}
      {shape === "star" && (
        <polygon
          points="50,4 61,37 96,37 68,58 79,92 50,71 21,92 32,58 4,37 39,37"
          {...common}
        />
      )}
      {shape === "heart" && (
        <path
          d="M50 90 C20 65 5 45 5 28 C5 12 18 4 30 4 C40 4 48 10 50 20 C52 10 60 4 70 4 C82 4 95 12 95 28 C95 45 80 65 50 90 Z"
          {...common}
        />
      )}
    </svg>
  );
}
