import fs from "fs";
import path from "path";
import sharp from "sharp";

// 1. Defs & Gradients shared across SVGs
const svgDefs = `
  <defs>
    <!-- Background Squircle Shadow -->
    <filter id="appIconShadow" x="-10%" y="-10%" width="125%" height="125%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#0b1a30" flood-opacity="0.12" />
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#0b1a30" flood-opacity="0.08" />
    </filter>

    <!-- Metallic Navy Gradients -->
    <linearGradient id="navyMetallic" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e3a6a" />
      <stop offset="35%" stop-color="#152c52" />
      <stop offset="70%" stop-color="#0d1b33" />
      <stop offset="100%" stop-color="#071120" />
    </linearGradient>

    <linearGradient id="navyHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#3b6cb5" />
      <stop offset="50%" stop-color="#1d3b6f" />
      <stop offset="100%" stop-color="#0e1e38" />
    </linearGradient>

    <linearGradient id="columnFlute" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#152c52" />
      <stop offset="50%" stop-color="#365e9d" />
      <stop offset="100%" stop-color="#0f1f3a" />
    </linearGradient>

    <!-- Gold & Brass Gradients -->
    <linearGradient id="goldBrass" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="25%" stop-color="#eab308" />
      <stop offset="50%" stop-color="#ca8a04" />
      <stop offset="75%" stop-color="#eab308" />
      <stop offset="100%" stop-color="#a16207" />
    </linearGradient>

    <linearGradient id="goldCircuit" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#fde047" />
      <stop offset="50%" stop-color="#eab308" />
      <stop offset="100%" stop-color="#ca8a04" />
    </linearGradient>

    <!-- Wood Gavel Gradient -->
    <linearGradient id="woodGavel" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#92400e" />
      <stop offset="40%" stop-color="#78350f" />
      <stop offset="70%" stop-color="#5a2609" />
      <stop offset="100%" stop-color="#451a03" />
    </linearGradient>

    <linearGradient id="woodHandle" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#78350f" />
      <stop offset="45%" stop-color="#b45309" />
      <stop offset="55%" stop-color="#d97706" />
      <stop offset="100%" stop-color="#451a03" />
    </linearGradient>

    <!-- 3D Bevel/Drop Shadow for Emblem elements -->
    <filter id="emblemShadow" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#0a1526" flood-opacity="0.3" />
    </filter>

    <filter id="glowGold" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="1.5" flood-color="#eab308" flood-opacity="0.5" />
    </filter>
  </defs>
`;

// 2. The Core Emblem Shapes (Scales on Column + Gavel + Circuit 'B')
function renderEmblem(offsetX = 0, offsetY = 0, scale = 1) {
  return `
  <g transform="translate(${offsetX}, ${offsetY}) scale(${scale})" filter="url(#emblemShadow)">
    <!-- ════════════════ LEFT: SCALES OF JUSTICE & IONIC COLUMN ════════════════ -->
    <!-- Column Base Plinths -->
    <rect x="126" y="360" width="68" height="12" rx="2" fill="url(#navyMetallic)" stroke="#2b4c7e" stroke-width="1.5" />
    <rect x="132" y="348" width="56" height="12" rx="1.5" fill="url(#navyMetallic)" stroke="#2b4c7e" stroke-width="1.2" />

    <!-- Column Shaft (Fluted classical pillar) -->
    <rect x="136" y="178" width="48" height="170" fill="url(#navyMetallic)" stroke="#1e3a6a" stroke-width="1.5" />
    <!-- Vertical Flutes highlights & shadows -->
    <line x1="144" y1="180" x2="144" y2="346" stroke="#3b6cb5" stroke-width="2.5" stroke-linecap="round" />
    <line x1="147" y1="180" x2="147" y2="346" stroke="#0d1b33" stroke-width="1.5" />
    <line x1="156" y1="180" x2="156" y2="346" stroke="#3b6cb5" stroke-width="2.5" stroke-linecap="round" />
    <line x1="159" y1="180" x2="159" y2="346" stroke="#0d1b33" stroke-width="1.5" />
    <line x1="168" y1="180" x2="168" y2="346" stroke="#3b6cb5" stroke-width="2.5" stroke-linecap="round" />
    <line x1="171" y1="180" x2="171" y2="346" stroke="#0d1b33" stroke-width="1.5" />

    <!-- Column Neck Ring -->
    <rect x="132" y="172" width="56" height="7" rx="1.5" fill="url(#navyHighlight)" stroke="#2b4c7e" stroke-width="1" />

    <!-- Ionic Capital (Volutes / Scrolls) -->
    <!-- Left Volute scroll -->
    <path d="M 134 165 C 122 165, 120 152, 128 147 C 134 143, 140 148, 137 154 C 135 158, 130 157, 131 154" 
          fill="none" stroke="url(#navyHighlight)" stroke-width="3" stroke-linecap="round" />
    <!-- Right Volute scroll -->
    <path d="M 186 165 C 198 165, 200 152, 192 147 C 186 143, 180 148, 183 154 C 185 158, 190 157, 189 154" 
          fill="none" stroke="url(#navyHighlight)" stroke-width="3" stroke-linecap="round" />
    <!-- Capital cushion & abacus beam -->
    <rect x="124" y="146" width="72" height="10" rx="2" fill="url(#navyHighlight)" stroke="#2b4c7e" stroke-width="1.5" />

    <!-- Extended Scale Beam extending leftwards -->
    <path d="M 160 148 L 74 148 C 68 148, 64 153, 67 158 L 71 161 L 160 161 Z" fill="url(#navyMetallic)" stroke="#2b4c7e" stroke-width="1.5" />
    <!-- Beam tip ornate finial & hook ring -->
    <circle cx="72" cy="154" r="5" fill="url(#navyHighlight)" stroke="#3b6cb5" stroke-width="1.5" />
    <circle cx="72" cy="154" r="2" fill="#0d1b33" />

    <!-- Scale Suspended Cords/Chains -->
    <line x1="72" y1="159" x2="52" y2="236" stroke="#2b4c7e" stroke-width="2" stroke-linecap="round" />
    <line x1="72" y1="159" x2="94" y2="236" stroke="#3b6cb5" stroke-width="2" stroke-linecap="round" />

    <!-- Scale Bowl / Pan (كفة الميزان) -->
    <!-- Outer bowl shell with 3D gradient -->
    <path d="M 48 236 C 50 266, 96 266, 98 236 Z" fill="url(#navyMetallic)" stroke="#2b4c7e" stroke-width="2" />
    <!-- Bowl top rim ellipse -->
    <ellipse cx="73" cy="236" rx="25" ry="5.5" fill="url(#navyHighlight)" stroke="#3b6cb5" stroke-width="1.5" />
    <!-- Bowl interior depth -->
    <ellipse cx="73" cy="237" rx="21" ry="3.5" fill="#091322" />

    <!-- ════════════════ CENTER: STANDING JUDGE GAVEL ════════════════ -->
    <!-- Gavel Head (Top Cylindrical Mallet) -->
    <!-- Left brass ring -->
    <rect x="202" y="141" width="6" height="34" rx="2" fill="url(#goldBrass)" stroke="#a16207" stroke-width="0.8" filter="url(#glowGold)" />
    <!-- Central wooden barrel -->
    <rect x="208" y="139" width="36" height="38" rx="4" fill="url(#woodGavel)" stroke="#3b1d07" stroke-width="1.2" />
    <!-- Barrel wooden sheen / highlights -->
    <line x1="211" y1="142" x2="241" y2="142" stroke="#d97706" stroke-width="2.5" stroke-linecap="round" opacity="0.6" />
    <line x1="211" y1="172" x2="241" y2="172" stroke="#291203" stroke-width="2" stroke-linecap="round" opacity="0.8" />
    <!-- Center gold emblem band on gavel -->
    <rect x="223" y="139" width="6" height="38" fill="url(#goldBrass)" opacity="0.8" />
    <!-- Right brass ring -->
    <rect x="244" y="141" width="6" height="34" rx="2" fill="url(#goldBrass)" stroke="#a16207" stroke-width="0.8" filter="url(#glowGold)" />

    <!-- Gavel Neck Collar (Gold) -->
    <path d="M 221 177 L 231 177 L 229 184 L 223 184 Z" fill="url(#goldBrass)" stroke="#854d0e" stroke-width="0.8" />

    <!-- Gavel Vertical Handle -->
    <!-- Main contoured wooden shaft -->
    <path d="M 223 184 L 229 184 L 233 346 L 219 346 Z" fill="url(#woodHandle)" stroke="#3b1d07" stroke-width="1.2" />
    <!-- Center light reflection along handle -->
    <line x1="226" y1="188" x2="226" y2="344" stroke="#fef08a" stroke-width="1.5" stroke-linecap="round" opacity="0.7" />
    <line x1="228" y1="188" x2="228" y2="344" stroke="#ca8a04" stroke-width="1" opacity="0.6" />

    <!-- Gavel Handle Bottom Ring & Pommel (Gold brass) -->
    <rect x="217" y="346" width="18" height="8" rx="2" fill="url(#goldBrass)" stroke="#854d0e" stroke-width="1" />
    <path d="M 218 354 C 218 368, 234 368, 234 354 Z" fill="url(#goldBrass)" stroke="#854d0e" stroke-width="1" />

    <!-- ════════════════ RIGHT: CYBER TECH LETTER 'B' ════════════════ -->
    <!-- Base 3D Outer Letter 'B' Body -->
    <path d="M 256 142 L 344 142 C 378 142, 404 162, 404 198 C 404 224, 386 244, 362 250 C 392 256, 412 278, 412 312 C 412 350, 382 372, 344 372 L 256 372 Z"
          fill="url(#navyMetallic)" stroke="#2b4c7e" stroke-width="3" stroke-linejoin="round" />

    <!-- Inner Top Cutout (Counter) of 'B' -->
    <path d="M 288 168 L 338 168 C 358 168, 372 178, 372 198 C 372 218, 358 228, 338 228 L 288 228 Z"
          fill="#ffffff" stroke="#152c52" stroke-width="2.5" />

    <!-- Inner Bottom Cutout (Counter) of 'B' -->
    <path d="M 288 274 L 342 274 C 364 274, 380 286, 380 310 C 380 334, 364 346, 342 346 L 288 346 Z"
          fill="#ffffff" stroke="#152c52" stroke-width="2.5" />

    <!-- ──────── High-Tech Golden Circuit Traces & Nodes (PCB) ──────── -->
    <g stroke="url(#goldCircuit)" stroke-linecap="round" stroke-linejoin="round" filter="url(#glowGold)">
      <!-- Spine Circuit Track 1 -->
      <polyline points="266,154 266,360" stroke-width="2.5" />
      <polyline points="274,158 274,352" stroke-width="2" />

      <!-- Top Loop Circuit Traces -->
      <polyline points="274,158 334,158 350,172 384,172" stroke-width="2.2" fill="none" />
      <polyline points="334,158 346,148 376,148" stroke-width="2" fill="none" />
      <polyline points="372,192 390,192 396,198" stroke-width="2" fill="none" />
      <polyline points="340,238 354,238 368,246 384,246" stroke-width="2.2" fill="none" />
      <polyline points="274,242 320,242 328,248" stroke-width="2" fill="none" />

      <!-- Bottom Loop Circuit Traces -->
      <polyline points="274,264 330,264 342,258 370,258" stroke-width="2.2" fill="none" />
      <polyline points="350,266 366,280 398,280" stroke-width="2" fill="none" />
      <polyline points="380,310 398,310 402,316" stroke-width="2" fill="none" />
      <polyline points="344,358 364,358 378,344 398,344" stroke-width="2.2" fill="none" />
      <polyline points="274,320 314,320 326,332 356,332" stroke-width="2" fill="none" />
      <polyline points="274,352 334,352 344,362" stroke-width="2" fill="none" />
    </g>

    <!-- Circuit Solder Connection Nodes (Golden Glowing Dots) -->
    <g fill="url(#goldBrass)" stroke="#78350f" stroke-width="0.8" filter="url(#glowGold)">
      <!-- Spine nodes -->
      <circle cx="266" cy="154" r="3.5" />
      <circle cx="266" cy="210" r="3.2" />
      <circle cx="266" cy="270" r="3.2" />
      <circle cx="266" cy="360" r="3.5" />
      <circle cx="274" cy="190" r="2.8" />
      <circle cx="274" cy="310" r="2.8" />

      <!-- Top loop nodes -->
      <circle cx="376" cy="148" r="3.5" />
      <circle cx="384" cy="172" r="3.5" />
      <circle cx="396" cy="198" r="3.2" />
      <circle cx="384" cy="246" r="3.5" />
      <circle cx="328" cy="248" r="3" />

      <!-- Bottom loop nodes -->
      <circle cx="370" cy="258" r="3.5" />
      <circle cx="398" cy="280" r="3.5" />
      <circle cx="402" cy="316" r="3.5" />
      <circle cx="398" cy="344" r="3.5" />
      <circle cx="356" cy="332" r="3.2" />
      <circle cx="344" cy="362" r="3.5" />
    </g>

    <!-- Subtle circuit node micro-highlights -->
    <g fill="#ffffff">
      <circle cx="265" cy="153" r="1.2" opacity="0.8" />
      <circle cx="375" cy="147" r="1.2" opacity="0.8" />
      <circle cx="383" cy="171" r="1.2" opacity="0.8" />
      <circle cx="397" cy="279" r="1.2" opacity="0.8" />
      <circle cx="401" cy="315" r="1.2" opacity="0.8" />
      <circle cx="397" cy="343" r="1.2" opacity="0.8" />
    </g>
  </g>
  `;
}

// 3. Generate "Application Icon" SVG (Squircle with clean white background, matching right side)
const appIconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  ${svgDefs}
  <!-- Squircle Canvas (iOS / macOS App Icon style) -->
  <rect x="24" y="24" width="464" height="464" rx="108" ry="108" fill="#ffffff" stroke="#f1f5f9" stroke-width="4" filter="url(#appIconShadow)" />
  <!-- Centered Emblem -->
  ${renderEmblem(18, 0, 1)}
</svg>`;

// 4. Generate "Maskable PWA Icon" (Extra 15% safe-zone margin on white canvas)
const maskableIconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  ${svgDefs}
  <rect x="0" y="0" width="512" height="512" fill="#ffffff" />
  <!-- Centered Emblem scaled to 80% safe zone -->
  ${renderEmblem(62, 52, 0.78)}
</svg>`;

// 5. Generate "Company Logo" SVG (Transparent with official typography matching left side)
const companyLogoSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
  ${svgDefs}
  <!-- Centered Emblem -->
  ${renderEmblem(70, 30, 0.94)}

  <!-- Brand Typography -->
  <text x="300" y="446" 
        text-anchor="middle" 
        font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" 
        font-weight="800" 
        font-size="34" 
        letter-spacing="4" 
        fill="#122543">
    MASLATT BABIL
  </text>
  <text x="300" y="482" 
        text-anchor="middle" 
        font-family="'IBM Plex Sans Arabic', system-ui, sans-serif" 
        font-weight="600" 
        font-size="19" 
        letter-spacing="1" 
        fill="#b45309">
    نظام مسلة بابل القانوني ERP 2026
  </text>
  <text x="300" y="512" 
        text-anchor="middle" 
        font-family="system-ui, sans-serif" 
        font-weight="500" 
        font-size="13" 
        letter-spacing="2" 
        fill="#64748b">
    LEGAL &amp; FINANCIAL ERP PROFESSIONAL
  </text>
</svg>`;

// 6. Generate Horizontal Header Brand Logo SVG (for Navbar & Sidebar)
const horizontalLogoSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 120" width="420" height="120">
  ${svgDefs}
  <!-- Scaled Emblem on the Left/Start -->
  ${renderEmblem(10, 10, 0.36)}
  <!-- Brand Text -->
  <text x="180" y="54" 
        font-family="'IBM Plex Sans Arabic', system-ui, sans-serif" 
        font-weight="700" 
        font-size="28" 
        fill="#ffffff">
    مسلة بابل
  </text>
  <text x="180" y="80" 
        font-family="system-ui, sans-serif" 
        font-weight="700" 
        font-size="15" 
        letter-spacing="2" 
        fill="#facc15">
    MASLATT BABIL
  </text>
  <text x="180" y="100" 
        font-family="'IBM Plex Sans Arabic', system-ui, sans-serif" 
        font-weight="500" 
        font-size="12" 
        fill="#94a3b8">
    الإدارة القانونية والمالية 2026
  </text>
</svg>`;

async function buildAll() {
  const publicDir = path.resolve("public");
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  // Save SVG files
  fs.writeFileSync(path.join(publicDir, "icon.svg"), appIconSvg);
  fs.writeFileSync(path.join(publicDir, "maslat-app-icon.svg"), appIconSvg);
  fs.writeFileSync(path.join(publicDir, "maslat-logo.svg"), companyLogoSvg);
  fs.writeFileSync(path.join(publicDir, "maslat-header-logo.svg"), horizontalLogoSvg);

  console.log("SVGs created successfully in public/");

  // Render PNGs via sharp
  const appIconBuffer = Buffer.from(appIconSvg);
  const maskableBuffer = Buffer.from(maskableIconSvg);
  const logoBuffer = Buffer.from(companyLogoSvg);

  // 1. PWA 512x512
  await sharp(appIconBuffer).resize(512, 512).png().toFile(path.join(publicDir, "pwa-512x512.png"));
  console.log("Created pwa-512x512.png");

  // 2. PWA 192x192
  await sharp(appIconBuffer).resize(192, 192).png().toFile(path.join(publicDir, "pwa-192x192.png"));
  console.log("Created pwa-192x192.png");

  // 3. Apple Touch Icon 180x180
  await sharp(appIconBuffer).resize(180, 180).png().toFile(path.join(publicDir, "apple-touch-icon.png"));
  console.log("Created apple-touch-icon.png");

  // 4. PWA Maskable 512x512
  await sharp(maskableBuffer).resize(512, 512).png().toFile(path.join(publicDir, "pwa-maskable-512x512.png"));
  console.log("Created pwa-maskable-512x512.png");

  // 5. Desktop App Icon PNG 512x512
  await sharp(appIconBuffer).resize(512, 512).png().toFile(path.join(publicDir, "maslat-app-icon.png"));
  console.log("Created maslat-app-icon.png");

  // 6. Company Logo PNG 800x800
  await sharp(logoBuffer).resize(800, 800).png().toFile(path.join(publicDir, "maslat-logo.png"));
  console.log("Created maslat-logo.png");

  // 7. Favicon 48x48 PNG & 32x32
  await sharp(appIconBuffer).resize(32, 32).png().toFile(path.join(publicDir, "favicon-32x32.png"));
  await sharp(appIconBuffer).resize(48, 48).png().toFile(path.join(publicDir, "favicon.png"));
  fs.copyFileSync(path.join(publicDir, "favicon.png"), path.join(publicDir, "favicon.ico"));
  console.log("Created favicons successfully");
}

buildAll().catch(console.error);
