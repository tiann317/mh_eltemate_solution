import type { LDAResult, LDASource } from "@/lib/aegis";

interface Props {
  heading: string;
  result: LDAResult;
}

export const SourcedCard = ({ heading, result }: Props) => (
  <div className="aegis-card mb-4 relative">
    <span className="aegis-sourced-badge absolute top-3.5 right-3.5">SOURCED</span>
    <div className="text-white text-[13px] font-medium mb-2.5 pr-[70px]">{heading}</div>
    <div className="text-muted-foreground text-[13px] leading-7 whitespace-pre-wrap">
      {result.answer || "(no answer returned)"}
    </div>
    {result.sources.length > 0 && (
      <details className="mt-3">
        <summary className="text-sky-400 text-[11px] cursor-pointer">
          View sources ({result.sources.length})
        </summary>
        <div className="mt-2 flex flex-col gap-1.5">
          {result.sources.map((src: LDASource, i) => (
            <div key={i} className="text-[11px] text-white/50 leading-normal">
              <span className="text-sky-400">[{src.source_indicator ?? i + 1}]</span>{" "}
              {src.source ?? "Source"}{" "}
              {src.oso_url && (
                <a
                  href={src.oso_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-400 underline"
                >
                  open ↗
                </a>
              )}
            </div>
          ))}
        </div>
      </details>
    )}
  </div>
);
