import type { FC } from "react";

/**
 * شعار وأيقونة مسلة بابل الرسمية — MASLATT BABIL 2026
 * يتضمن:
 * 1. ميزان العدالة على العمود الرخامي الأثري باللون الكحلي المعدني
 * 2. مطرقة القاضي الرأسية الخشبية المذهبة في المنتصف
 * 3. حرف B التكنولوجي بمسارات الدوائر الإلكترونية المذهبة (Legal Tech)
 */
export const MaslatEmblem: FC<{ className?: string; size?: number | string }> = ({
  className = "h-10 w-10",
  size,
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={className}
      fill="none"
      role="img"
      aria-label="شعار مسلة بابل"
    >
      <defs>
        <linearGradient id="embNavyMetallic" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e3a6a" />
          <stop offset="35%" stopColor="#152c52" />
          <stop offset="70%" stopColor="#0d1b33" />
          <stop offset="100%" stopColor="#071120" />
        </linearGradient>

        <linearGradient id="embNavyHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3b6cb5" />
          <stop offset="50%" stopColor="#1d3b6f" />
          <stop offset="100%" stopColor="#0e1e38" />
        </linearGradient>

        <linearGradient id="embGoldBrass" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="25%" stopColor="#eab308" />
          <stop offset="50%" stopColor="#ca8a04" />
          <stop offset="75%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#a16207" />
        </linearGradient>

        <linearGradient id="embGoldCircuit" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="50%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>

        <linearGradient id="embWoodGavel" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#92400e" />
          <stop offset="40%" stopColor="#78350f" />
          <stop offset="70%" stopColor="#5a2609" />
          <stop offset="100%" stopColor="#451a03" />
        </linearGradient>

        <linearGradient id="embWoodHandle" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#78350f" />
          <stop offset="45%" stopColor="#b45309" />
          <stop offset="55%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#451a03" />
        </linearGradient>

        <filter id="embGlowGold" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#eab308" floodOpacity="0.5" />
        </filter>
      </defs>

      <g transform="translate(18, 0)">
        {/* العمود وميزان العدالة */}
        <rect x="126" y="360" width="68" height="12" rx="2" fill="url(#embNavyMetallic)" stroke="#2b4c7e" strokeWidth="1.5" />
        <rect x="132" y="348" width="56" height="12" rx="1.5" fill="url(#embNavyMetallic)" stroke="#2b4c7e" strokeWidth="1.2" />
        <rect x="136" y="178" width="48" height="170" fill="url(#embNavyMetallic)" stroke="#1e3a6a" strokeWidth="1.5" />
        <line x1="144" y1="180" x2="144" y2="346" stroke="#3b6cb5" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="147" y1="180" x2="147" y2="346" stroke="#0d1b33" strokeWidth="1.5" />
        <line x1="156" y1="180" x2="156" y2="346" stroke="#3b6cb5" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="159" y1="180" x2="159" y2="346" stroke="#0d1b33" strokeWidth="1.5" />
        <line x1="168" y1="180" x2="168" y2="346" stroke="#3b6cb5" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="171" y1="180" x2="171" y2="346" stroke="#0d1b33" strokeWidth="1.5" />
        <rect x="132" y="172" width="56" height="7" rx="1.5" fill="url(#embNavyHighlight)" stroke="#2b4c7e" strokeWidth="1" />
        <path d="M 134 165 C 122 165, 120 152, 128 147 C 134 143, 140 148, 137 154 C 135 158, 130 157, 131 154" fill="none" stroke="url(#embNavyHighlight)" strokeWidth="3" strokeLinecap="round" />
        <path d="M 186 165 C 198 165, 200 152, 192 147 C 186 143, 180 148, 183 154 C 185 158, 190 157, 189 154" fill="none" stroke="url(#embNavyHighlight)" strokeWidth="3" strokeLinecap="round" />
        <rect x="124" y="146" width="72" height="10" rx="2" fill="url(#embNavyHighlight)" stroke="#2b4c7e" strokeWidth="1.5" />

        {/* عارضة الميزان والكفة */}
        <path d="M 160 148 L 74 148 C 68 148, 64 153, 67 158 L 71 161 L 160 161 Z" fill="url(#embNavyMetallic)" stroke="#2b4c7e" strokeWidth="1.5" />
        <circle cx="72" cy="154" r="5" fill="url(#embNavyHighlight)" stroke="#3b6cb5" strokeWidth="1.5" />
        <circle cx="72" cy="154" r="2" fill="#0d1b33" />
        <line x1="72" y1="159" x2="52" y2="236" stroke="#2b4c7e" strokeWidth="2" strokeLinecap="round" />
        <line x1="72" y1="159" x2="94" y2="236" stroke="#3b6cb5" strokeWidth="2" strokeLinecap="round" />
        <path d="M 48 236 C 50 266, 96 266, 98 236 Z" fill="url(#embNavyMetallic)" stroke="#2b4c7e" strokeWidth="2" />
        <ellipse cx="73" cy="236" rx="25" ry="5.5" fill="url(#embNavyHighlight)" stroke="#3b6cb5" strokeWidth="1.5" />
        <ellipse cx="73" cy="237" rx="21" ry="3.5" fill="#091322" />

        {/* مطرقة القاضي الرأسية في المنتصف */}
        <rect x="202" y="141" width="6" height="34" rx="2" fill="url(#embGoldBrass)" stroke="#a16207" strokeWidth="0.8" />
        <rect x="208" y="139" width="36" height="38" rx="4" fill="url(#embWoodGavel)" stroke="#3b1d07" strokeWidth="1.2" />
        <line x1="211" y1="142" x2="241" y2="142" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
        <line x1="211" y1="172" x2="241" y2="172" stroke="#291203" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
        <rect x="223" y="139" width="6" height="38" fill="url(#embGoldBrass)" opacity="0.8" />
        <rect x="244" y="141" width="6" height="34" rx="2" fill="url(#embGoldBrass)" stroke="#a16207" strokeWidth="0.8" />
        <path d="M 221 177 L 231 177 L 229 184 L 223 184 Z" fill="url(#embGoldBrass)" stroke="#854d0e" strokeWidth="0.8" />
        <path d="M 223 184 L 229 184 L 233 346 L 219 346 Z" fill="url(#embWoodHandle)" stroke="#3b1d07" strokeWidth="1.2" />
        <line x1="226" y1="188" x2="226" y2="344" stroke="#fef08a" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
        <rect x="217" y="346" width="18" height="8" rx="2" fill="url(#embGoldBrass)" stroke="#854d0e" strokeWidth="1" />
        <path d="M 218 354 C 218 368, 234 368, 234 354 Z" fill="url(#embGoldBrass)" stroke="#854d0e" strokeWidth="1" />

        {/* حرف B التكنولوجي مع الدوائر الإلكترونية المذهبة */}
        <path
          d="M 256 142 L 344 142 C 378 142, 404 162, 404 198 C 404 224, 386 244, 362 250 C 392 256, 412 278, 412 312 C 412 350, 382 372, 344 372 L 256 372 Z"
          fill="url(#embNavyMetallic)"
          stroke="#2b4c7e"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path
          d="M 288 168 L 338 168 C 358 168, 372 178, 372 198 C 372 218, 358 228, 338 228 L 288 228 Z"
          fill="#ffffff"
          stroke="#152c52"
          strokeWidth="2.5"
        />
        <path
          d="M 288 274 L 342 274 C 364 274, 380 286, 380 310 C 380 334, 364 346, 342 346 L 288 346 Z"
          fill="#ffffff"
          stroke="#152c52"
          strokeWidth="2.5"
        />

        {/* مسارات الـ PCB الإلكترونية */}
        <g stroke="url(#embGoldCircuit)" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="266,154 266,360" strokeWidth="2.5" />
          <polyline points="274,158 274,352" strokeWidth="2" />
          <polyline points="274,158 334,158 350,172 384,172" strokeWidth="2.2" fill="none" />
          <polyline points="334,158 346,148 376,148" strokeWidth="2" fill="none" />
          <polyline points="372,192 390,192 396,198" strokeWidth="2" fill="none" />
          <polyline points="340,238 354,238 368,246 384,246" strokeWidth="2.2" fill="none" />
          <polyline points="274,242 320,242 328,248" strokeWidth="2" fill="none" />
          <polyline points="274,264 330,264 342,258 370,258" strokeWidth="2.2" fill="none" />
          <polyline points="350,266 366,280 398,280" strokeWidth="2" fill="none" />
          <polyline points="380,310 398,310 402,316" strokeWidth="2" fill="none" />
          <polyline points="344,358 364,358 378,344 398,344" strokeWidth="2.2" fill="none" />
          <polyline points="274,320 314,320 326,332 356,332" strokeWidth="2" fill="none" />
          <polyline points="274,352 334,352 344,362" strokeWidth="2" fill="none" />
        </g>

        {/* نقاط الاتصال الدائرية المذهبة (Nodes) */}
        <g fill="url(#embGoldBrass)" stroke="#78350f" strokeWidth="0.8">
          <circle cx="266" cy="154" r="3.5" />
          <circle cx="266" cy="210" r="3.2" />
          <circle cx="266" cy="270" r="3.2" />
          <circle cx="266" cy="360" r="3.5" />
          <circle cx="274" cy="190" r="2.8" />
          <circle cx="274" cy="310" r="2.8" />
          <circle cx="376" cy="148" r="3.5" />
          <circle cx="384" cy="172" r="3.5" />
          <circle cx="396" cy="198" r="3.2" />
          <circle cx="384" cy="246" r="3.5" />
          <circle cx="328" cy="248" r="3" />
          <circle cx="370" cy="258" r="3.5" />
          <circle cx="398" cy="280" r="3.5" />
          <circle cx="402" cy="316" r="3.5" />
          <circle cx="398" cy="344" r="3.5" />
          <circle cx="356" cy="332" r="3.2" />
          <circle cx="344" cy="362" r="3.5" />
        </g>
      </g>
    </svg>
  );
};

/**
 * أيقونة التطبيق بنمط Squircle (أيقونة سطح المكتب والتثبيت)
 */
export const MaslatAppIcon: FC<{ size?: number; className?: string }> = ({
  size = 48,
  className = "",
}) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative inline-flex items-center justify-center rounded-[22%] bg-white p-[12%] shadow-md border border-slate-100 dark:border-slate-800 ${className}`}
    >
      <img
        src="/maslat-app-icon.png"
        alt="أيقونة مسلة بابل"
        className="h-full w-full object-contain"
        onError={(e) => {
          // fallback to SVG if image not yet loaded
          (e.currentTarget as HTMLImageElement).src = "/icon.svg";
        }}
      />
    </div>
  );
};

/**
 * الشعار الكامل للشركة (Company Logo) مع الخط والرمز
 */
export const MaslatCompanyLogo: FC<{ className?: string; size?: number }> = ({
  className = "",
  size = 180,
}) => {
  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <img
        src="/maslat-logo.png"
        alt="شعار شركة مسلة بابل"
        style={{ width: size, height: size }}
        className="object-contain drop-shadow-sm"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = "/maslat-logo.svg";
        }}
      />
    </div>
  );
};

export default MaslatEmblem;
