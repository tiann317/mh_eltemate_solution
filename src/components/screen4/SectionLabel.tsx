import type { ReactNode } from "react";

export const ColumnHeader = ({
  kicker,
  kickerColor,
  sub,
}: {
  kicker: string;
  kickerColor: string;
  sub: string;
}) => (
  <div className="mb-4">
    <div
      className="text-[10px] tracking-widest uppercase font-semibold"
      style={{ color: kickerColor }}
    >
      {kicker}
    </div>
    <div className="text-muted-foreground text-[11px] mt-1">{sub}</div>
  </div>
);

export const SectionLabel = ({ children }: { children: ReactNode }) => (
  <div className="aegis-section-label mb-2.5 mt-6">{children}</div>
);
