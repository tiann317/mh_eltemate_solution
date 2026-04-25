import { useEffect, useState } from "react";

export interface Clock {
  label: string;
  sub: string;
  hours: number;
}

interface Props {
  clock: Clock;
  discovery: string;
}

const pad = (n: number) => n.toString().padStart(2, "0");

export const ClockDisplay = ({ clock, discovery }: Props) => {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  if (!discovery) {
    return (
      <div className="aegis-clock-card">
        <div className="aegis-clock-label">{clock.label}</div>
        <div className="aegis-clock-digit text-muted-foreground">--:--:--</div>
        <div className="aegis-clock-sub">{clock.sub}</div>
      </div>
    );
  }

  const start = new Date(discovery).getTime();
  const deadline = start + clock.hours * 3600 * 1000;
  const remainingMs = deadline - Date.now();

  let colorClass = "text-emerald-400";
  let display: string;

  if (remainingMs <= 0) {
    display = "EXPIRED";
    colorClass = "text-red-400";
  } else {
    const totalSec = Math.floor(remainingMs / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    display = `${pad(h)}:${pad(m)}:${pad(s)}`;
    const hrsLeft = remainingMs / 3600000;
    if (hrsLeft < 6) colorClass = "text-red-400";
    else if (hrsLeft < 24) colorClass = "text-amber-400";
  }

  return (
    <div className="aegis-clock-card">
      <div className="aegis-clock-label">{clock.label}</div>
      <div className={`aegis-clock-digit ${colorClass}`}>{display}</div>
      <div className="aegis-clock-sub">{clock.sub}</div>
    </div>
  );
};
