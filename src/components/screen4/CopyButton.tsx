import { useState } from "react";

interface Props {
  text: string;
}

export const CopyButton = ({ text }: Props) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="aegis-btn-secondary absolute top-3 right-3 text-[11px] px-2.5 py-1"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
};
