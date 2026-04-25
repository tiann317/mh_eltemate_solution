export const CoordinationBanner = () => (
  <div className="bg-[#112240] border border-white/[0.08] rounded-sm px-4 py-3.5 flex flex-row items-center justify-between gap-4 flex-wrap mb-7">
    <div className="flex items-center gap-3">
      <span className="w-7 h-7 rounded-full bg-[#1A56DB] inline-flex items-center justify-center text-white text-[11px] font-bold tracking-wider">
        AI
      </span>
      <span className="text-white text-[13px]">
        AI is coordinating both tracks simultaneously
      </span>
    </div>
    <svg width={260} height={44} className="flex-shrink-0">
      <defs>
        <marker
          id="arr"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M0,0 L10,5 L0,10 z" fill="#63aff0" />
        </marker>
      </defs>
      <circle cx={26} cy={22} r={16} fill="rgba(99,175,240,0.12)" stroke="#63aff0" />
      <text x={26} y={26} fill="#63aff0" fontSize={9} textAnchor="middle">
        Intake
      </text>
      <circle cx={130} cy={22} r={16} fill="rgba(26,86,219,0.25)" stroke="#1A56DB" />
      <text x={130} y={26} fill="#fff" fontSize={9} textAnchor="middle">
        AI
      </text>
      <circle cx={234} cy={22} r={16} fill="rgba(82,214,138,0.12)" stroke="#52D68A" />
      <text x={234} y={20} fill="#52D68A" fontSize={8} textAnchor="middle">
        Tech +
      </text>
      <text x={234} y={30} fill="#52D68A" fontSize={8} textAnchor="middle">
        Legal
      </text>
      <line
        x1={44}
        y1={22}
        x2={112}
        y2={22}
        stroke="#63aff0"
        strokeWidth={1.5}
        markerEnd="url(#arr)"
      />
      <line
        x1={148}
        y1={22}
        x2={216}
        y2={22}
        stroke="#63aff0"
        strokeWidth={1.5}
        markerEnd="url(#arr)"
      />
    </svg>
  </div>
);
