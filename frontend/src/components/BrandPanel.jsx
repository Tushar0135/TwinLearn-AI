import React from 'react';

export default function BrandPanel({ eyebrow, headline, sub }) {
  return (
    <div className="hidden lg:flex lg:w-[42%] relative bg-dark-900 text-white flex-col justify-between px-12 py-12 overflow-hidden">
      {/* Signature: two mirrored node clusters joined by a single seam line — the "twin" */}
      <svg
        className="absolute inset-0 h-full w-full opacity-90"
        viewBox="0 0 480 800"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <line x1="240" y1="0" x2="240" y2="800" stroke="#5639C2" strokeWidth="1" strokeOpacity="0.35" />
        {[
          [140, 120], [90, 260], [170, 340], [110, 460], [180, 560], [130, 680],
        ].map(([x, y], i) => (
          <g key={`l-${i}`}>
            <circle cx={x} cy={y} r={i % 2 === 0 ? 5 : 3} fill="#8D7CE3" className="twin-node" style={{ animationDelay: `${i * 0.3}s` }} />
            <line x1={x} y1={y} x2={480 - x} y2={y} stroke="#372480" strokeWidth="1" strokeOpacity="0.4" />
          </g>
        ))}
        {[
          [340, 120], [390, 260], [310, 340], [370, 460], [300, 560], [350, 680],
        ].map(([x, y], i) => (
          <circle key={`r-${i}`} cx={x} cy={y} r={i % 2 === 0 ? 5 : 3} fill="#22D3EE" className="twin-node" style={{ animationDelay: `${i * 0.3 + 0.15}s` }} />
        ))}
      </svg>

      <div className="relative z-10 flex items-center gap-2">
        <div className="w-8 h-8 rounded-md bg-primary-500 flex items-center justify-center font-display font-semibold text-sm">
          T
        </div>
        <span className="font-display font-semibold tracking-tight">TwinLearnAI</span>
      </div>

      <div className="relative z-10 max-w-xs">
        <p className="text-xs uppercase tracking-widest text-primary-300 mb-3">{eyebrow}</p>
        <h2 className="font-display text-3xl font-semibold leading-tight mb-3">{headline}</h2>
        <p className="text-sm text-dark-100 leading-relaxed">{sub}</p>
      </div>

      <p className="relative z-10 text-xs text-dark-100">© {new Date().getFullYear()} TwinLearnAI</p>
    </div>
  );
}