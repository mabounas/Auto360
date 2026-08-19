export function GarageIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 640 420" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#003282" />
          <stop offset="1" stopColor="#0d4694" />
        </linearGradient>
        <linearGradient id="floorGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0d4694" />
          <stop offset="1" stopColor="#00246a" />
        </linearGradient>
      </defs>
      <rect width="640" height="420" rx="24" fill="url(#skyGrad)" />
      <rect x="0" y="300" width="640" height="120" fill="url(#floorGrad)" opacity="0.6" />
      {/* Garage bay outline */}
      <rect x="40" y="60" width="560" height="220" rx="12" stroke="#4fa3ef" strokeOpacity="0.35" strokeWidth="2" />
      <line x1="40" y1="130" x2="600" y2="130" stroke="#4fa3ef" strokeOpacity="0.25" strokeWidth="1" />
      {/* Lift columns */}
      <rect x="120" y="90" width="14" height="200" rx="4" fill="#4fa3ef" fillOpacity="0.35" />
      <rect x="500" y="90" width="14" height="200" rx="4" fill="#4fa3ef" fillOpacity="0.35" />
      {/* Car body */}
      <g transform="translate(150,205)">
        <path
          d="M10 60 C10 40 30 26 55 24 L95 20 C115 4 150 -6 190 -6 C230 -6 262 4 282 20 L320 24 C345 26 365 40 365 60 L365 78 C365 88 357 96 347 96 L28 96 C18 96 10 88 10 78 Z"
          fill="#f6f8fb"
        />
        <path
          d="M95 20 L120 -4 C132 -14 150 -20 172 -20 L214 -20 C236 -20 252 -12 262 0 L282 20 Z"
          fill="#cfe0f6"
        />
        <rect x="10" y="55" width="355" height="10" fill="#288fe3" />
        <circle cx="75" cy="96" r="26" fill="#10203f" />
        <circle cx="75" cy="96" r="11" fill="#cfe0f6" />
        <circle cx="300" cy="96" r="26" fill="#10203f" />
        <circle cx="300" cy="96" r="11" fill="#cfe0f6" />
      </g>
      {/* technician */}
      <g transform="translate(430,150)">
        <circle cx="20" cy="18" r="14" fill="#f6f8fb" />
        <path d="M0 100 L4 46 C6 32 14 24 30 24 C46 24 54 32 56 46 L60 100 Z" fill="#288fe3" />
        <rect x="8" y="96" width="16" height="34" rx="4" fill="#10203f" />
        <rect x="36" y="96" width="16" height="34" rx="4" fill="#10203f" />
      </g>
      {/* floor reflection line */}
      <line x1="60" y1="310" x2="580" y2="310" stroke="#4fa3ef" strokeOpacity="0.25" strokeWidth="2" />
    </svg>
  );
}
