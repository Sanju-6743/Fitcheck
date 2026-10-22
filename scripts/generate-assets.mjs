import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '..', 'client', 'public', 'img')
const productDir = join(outDir, 'products')
mkdirSync(productDir, { recursive: true })

const palettes = [
  { a: '#0f0f0f', b: '#1f1f1f', accent: '#c8ff00', fg: '#f5f2eb' },
  { a: '#141b14', b: '#243024', accent: '#9dff5c', fg: '#f0f5e8' },
  { a: '#1a1208', b: '#2c1e0e', accent: '#ffb020', fg: '#f7efe0' },
  { a: '#0c1220', b: '#16203a', accent: '#6ecbff', fg: '#eef4fb' },
  { a: '#1c0c12', b: '#331522', accent: '#ff4d6d', fg: '#f9eef1' },
  { a: '#12100c', b: '#262116', accent: '#e8ff3a', fg: '#f6f3e8' },
]

const shapes = {
  tees: `<path d="M120 170 L160 145 L200 168 L240 145 L280 170 L320 230 L288 258 L268 232 L268 430 L132 430 L132 232 L112 258 L80 230 Z" fill="none" stroke="currentColor" stroke-width="7" stroke-linejoin="round"/>
    <path d="M170 150 Q200 190 230 150" fill="none" stroke="currentColor" stroke-width="6"/>`,
  hoodies: `<path d="M120 175 L165 148 L200 165 L235 148 L280 175 L322 245 L288 268 L268 240 L268 435 L132 435 L132 240 L112 268 L78 245 Z" fill="none" stroke="currentColor" stroke-width="7" stroke-linejoin="round"/>
    <path d="M155 152 Q200 215 245 152" fill="none" stroke="currentColor" stroke-width="7"/>
    <line x1="185" y1="230" x2="185" y2="270" stroke="currentColor" stroke-width="5"/>
    <line x1="215" y1="230" x2="215" y2="270" stroke="currentColor" stroke-width="5"/>`,
  bottomwear: `<path d="M145 150 L255 150 L272 445 L228 445 L200 270 L172 445 L128 445 Z" fill="none" stroke="currentColor" stroke-width="7" stroke-linejoin="round"/>
    <line x1="145" y1="175" x2="255" y2="175" stroke="currentColor" stroke-width="5"/>
    <rect x="152" y="195" width="30" height="38" rx="6" fill="none" stroke="currentColor" stroke-width="5"/>
    <rect x="218" y="195" width="30" height="38" rx="6" fill="none" stroke="currentColor" stroke-width="5"/>`,
  outerwear: `<path d="M125 170 L170 145 L200 160 L230 145 L275 170 L318 240 L285 265 L265 238 L265 440 L135 440 L135 238 L115 265 L82 240 Z" fill="none" stroke="currentColor" stroke-width="7" stroke-linejoin="round"/>
    <path d="M170 148 L200 210 L230 148" fill="none" stroke="currentColor" stroke-width="6"/>
    <line x1="200" y1="210" x2="200" y2="440" stroke="currentColor" stroke-width="5"/>
    <circle cx="214" cy="260" r="6" fill="currentColor"/><circle cx="214" cy="310" r="6" fill="currentColor"/>`,
  accessories: `<circle cx="200" cy="280" r="95" fill="none" stroke="currentColor" stroke-width="8"/>
    <path d="M105 280 Q200 380 295 280" fill="none" stroke="currentColor" stroke-width="8"/>
    <circle cx="200" cy="280" r="26" fill="none" stroke="currentColor" stroke-width="6"/>`,
}

const products = [
  { slug: 'classic-street-shirt', name: 'CLASSIC STREET', sub: 'COTTON SHIRT · ₹1000', category: 'outerwear', p: 0, tag: '₹1000' },
  { slug: 'urban-stride-pant', name: 'URBAN STRIDE', sub: 'STREET PANT · ₹1500', category: 'bottomwear', p: 5, tag: '₹1500' },
  { slug: 'choli-rage-tee', name: 'CHOLI RAGE', sub: 'OVERSIZED TEE', category: 'tees', p: 0, tag: '240 GSM' },
  { slug: 'midnight-bazaar-hoodie', name: 'MIDNIGHT', sub: 'BAZAAR HOODIE', category: 'hoodies', p: 1, tag: '460 GSM' },
  { slug: 'signal-black-cargo', name: 'SIGNAL BLACK', sub: 'CARGO PANTS', category: 'bottomwear', p: 2, tag: 'RIPSTOP' },
  { slug: 'bombay-static-jacket', name: 'BOMBAY STATIC', sub: 'VARSITY JACKET', category: 'outerwear', p: 3, tag: 'LIMITED 200' },
  { slug: 'masala-drip-shorts', name: 'MASALA DRIP', sub: 'SHORTS', category: 'bottomwear', p: 4, tag: 'FRENCH TERRY' },
  { slug: 'gully-groove-sweatshirt', name: 'GULLY GROOVE', sub: 'CREWNECK', category: 'hoodies', p: 5, tag: '380 GSM' },
  { slug: 'rickshaw-runners-tee', name: 'RICKSHAW', sub: 'RUNNERS TEE', category: 'tees', p: 3, tag: '180 GSM' },
  { slug: 'chai-break-cap', name: 'CHAI BREAK', sub: 'EMBROIDERED CAP', category: 'accessories', p: 2, tag: '3D STITCH' },
  { slug: 'monsoon-shell-anorak', name: 'MONSOON SHELL', sub: 'ANORAK', category: 'outerwear', p: 1, tag: 'WATER-RESIST' },
  { slug: 'desi-web-belt', name: 'DESI WEB', sub: 'TACTICAL BELT', category: 'accessories', p: 0, tag: 'QUICK-RELEASE' },
  { slug: 'neon-bazaar-joggers', name: 'NEON BAZAAR', sub: 'JOGGERS', category: 'bottomwear', p: 4, tag: 'REFLECTIVE' },
  { slug: 'tempo-shift-longsleeve', name: 'TEMPO SHIFT', sub: 'LONG SLEEVE', category: 'tees', p: 5, tag: 'BACK PRINT' },
]

const svgFor = (product, i) => {
  const { a, b, accent, fg } = palettes[product.p]
  const id = `g${i}`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
  <defs>
    <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${a}"/>
      <stop offset="100%" stop-color="${b}"/>
    </linearGradient>
    <filter id="n${i}">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.05 0"/>
    </filter>
  </defs>
  <rect width="400" height="500" fill="url(#${id})"/>
  <circle cx="${i % 2 ? 330 : 70}" cy="90" r="120" fill="${accent}" opacity="0.10"/>
  <circle cx="${i % 2 ? 60 : 340}" cy="420" r="90" fill="${accent}" opacity="0.07"/>
  <g color="${fg}" transform="translate(0,20)">
    ${shapes[product.category] || shapes.tees}
  </g>
  <rect x="0" y="0" width="400" height="500" filter="url(#n${i})" opacity="0.5"/>
  <rect x="24" y="24" width="112" height="30" rx="15" fill="${accent}"/>
  <text x="80" y="44" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="12" font-weight="900" fill="#0a0a0a" letter-spacing="1">${product.tag}</text>
  <text x="24" y="440" font-family="Arial Black, Arial, sans-serif" font-size="30" font-weight="900" fill="${fg}" letter-spacing="-0.5">${product.name}</text>
  <text x="24" y="464" font-family="Arial, sans-serif" font-size="14" font-weight="700" fill="${accent}" letter-spacing="3">${product.sub}</text>
  <text x="24" y="486" font-family="Arial, sans-serif" font-size="10" fill="${fg}" opacity="0.55" letter-spacing="4">FITCHECK INDIA · DROP 07</text>
</svg>`
}

const writeIfMissing = (path, contents) => {
  if (existsSync(path)) return
  writeFileSync(path, contents)
}

products.forEach((p, i) => writeIfMissing(join(productDir, `${p.slug}.svg`), svgFor(p, i)))

writeFileSync(
  join(productDir, 'placeholder.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500"><rect width="400" height="500" fill="#1c1c1c"/><text x="200" y="250" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="18" font-weight="900" fill="#7d7d74">NO IMAGE</text><text x="200" y="278" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#7d7d74">FITCHECK INDIA</text></svg>`
)


writeFileSync(
  join(outDir, 'favicon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0a0a0a"/><text x="32" y="42" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="28" font-weight="900" fill="#c8ff00">F.</text></svg>`
)

writeFileSync(
  join(outDir, 'hero-stack.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 520" width="640" height="520">
  <defs>
    <linearGradient id="h1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#1a1a1a"/><stop offset="100%" stop-color="#2a2a2a"/></linearGradient>
    <linearGradient id="h2" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stop-color="#c8ff00"/><stop offset="100%" stop-color="#9dcc00"/></linearGradient>
    <linearGradient id="h3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#6ecbff"/><stop offset="100%" stop-color="#3a86b8"/></linearGradient>
    <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2"/><feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.06 0"/></filter>
  </defs>
  <rect width="640" height="520" rx="28" fill="url(#h1)"/>
  <circle cx="520" cy="90" r="130" fill="#c8ff00" opacity="0.12"/>
  <circle cx="90" cy="440" r="110" fill="#ff4d24" opacity="0.12"/>
  <g transform="rotate(-8 200 280)">
    <rect x="90" y="140" width="210" height="270" rx="18" fill="#0f0f0f" stroke="#3a3a3a" stroke-width="2"/>
    <path d="M130 200 L160 180 L195 200 L230 180 L260 200 L285 250 L262 268 L248 245 L248 375 L142 375 L142 245 L128 268 L105 250 Z" fill="none" stroke="#f5f2eb" stroke-width="6" stroke-linejoin="round"/>
    <text x="112" y="400" font-family="Arial Black, Arial, sans-serif" font-size="16" font-weight="900" fill="#c8ff00">CHOLI RAGE</text>
  </g>
  <g transform="rotate(4 400 260)">
    <rect x="330" y="100" width="230" height="290" rx="18" fill="#141b14" stroke="#2f3a2f" stroke-width="2"/>
    <path d="M370 170 L405 148 L440 165 L475 148 L510 170 L540 235 L515 255 L500 230 L500 360 L380 360 L380 230 L365 255 L340 235 Z" fill="none" stroke="#f5f2eb" stroke-width="6" stroke-linejoin="round"/>
    <path d="M400 150 Q440 205 480 150" fill="none" stroke="#9dff5c" stroke-width="6"/>
    <text x="352" y="380" font-family="Arial Black, Arial, sans-serif" font-size="15" font-weight="900" fill="#9dff5c">MIDNIGHT BAZAAR</text>
  </g>
  <g transform="rotate(-3 320 470)">
    <rect x="220" y="400" width="240" height="86" rx="16" fill="#0c1220" stroke="#243050" stroke-width="2"/>
    <text x="240" y="437" font-family="Arial Black, Arial, sans-serif" font-size="20" font-weight="900" fill="#6ecbff">SIGNAL BLACK</text>
    <text x="240" y="462" font-family="Arial, sans-serif" font-size="12" fill="#f5f2eb" opacity="0.6" letter-spacing="3">CARGO · RIPSTOP</text>
  </g>
  <rect width="640" height="520" rx="28" filter="url(#grain)"/>
  <rect x="24" y="24" width="118" height="30" rx="15" fill="#c8ff00"/>
  <text x="83" y="44" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="12" font-weight="900" fill="#0a0a0a">DROP 07 LIVE</text>
</svg>`
)

writeFileSync(
  join(outDir, 'lookbook.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 540" width="720" height="540">
  <defs>
    <linearGradient id="lb" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#101010"/><stop offset="100%" stop-color="#242424"/></linearGradient>
    <filter id="lbg"><feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2"/><feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.05 0"/></filter>
  </defs>
  <rect width="720" height="540" rx="28" fill="url(#lb)"/>
  <g opacity="0.9">
    <rect x="48" y="70" width="190" height="400" rx="16" fill="#181818" stroke="#2e2e2e"/>
    <circle cx="143" cy="170" r="42" fill="none" stroke="#c8ff00" stroke-width="5"/>
    <path d="M95 300 Q143 240 191 300 L191 430 L95 430 Z" fill="none" stroke="#f5f2eb" stroke-width="5"/>
    <text x="70" y="455" font-family="Arial Black, Arial, sans-serif" font-size="16" font-weight="900" fill="#f5f2eb">LOOK 01</text>
  </g>
  <g opacity="0.9">
    <rect x="265" y="40" width="190" height="430" rx="16" fill="#141b14" stroke="#2a3a2a"/>
    <path d="M310 160 L345 138 L380 155 L415 138 L445 160 L470 220 L448 240 L432 215 L432 400 L323 400 L323 215 L307 240 L285 220 Z" fill="none" stroke="#9dff5c" stroke-width="5" stroke-linejoin="round"/>
    <text x="288" y="445" font-family="Arial Black, Arial, sans-serif" font-size="16" font-weight="900" fill="#9dff5c">LOOK 02</text>
  </g>
  <g opacity="0.9">
    <rect x="482" y="70" width="190" height="400" rx="16" fill="#1a1208" stroke="#3a2a12"/>
    <rect x="522" y="150" width="110" height="180" rx="12" fill="none" stroke="#ffb020" stroke-width="5"/>
    <line x1="522" y1="200" x2="632" y2="200" stroke="#ffb020" stroke-width="4"/>
    <text x="505" y="455" font-family="Arial Black, Arial, sans-serif" font-size="16" font-weight="900" fill="#ffb020">LOOK 03</text>
  </g>
  <rect width="720" height="540" rx="28" filter="url(#lbg)"/>
  <text x="360" y="34" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="#f5f2eb" opacity="0.5" letter-spacing="8">FITCHECK STUDIO · MUMBAI</text>
</svg>`
)

writeFileSync(
  join(outDir, 'contact-map.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 340" width="720" height="340">
  <rect width="720" height="340" rx="20" fill="#ebe7db"/>
  <g stroke="#ddd8c9" stroke-width="10" fill="none">
    <path d="M0 80 H720"/><path d="M0 170 H720"/><path d="M0 260 H720"/>
    <path d="M120 0 V340"/><path d="M300 0 V340"/><path d="M480 0 V340"/><path d="M620 0 V340"/>
  </g>
  <g stroke="#c8ff00" stroke-width="4" fill="none" opacity="0.8">
    <path d="M0 170 H300 V340"/><path d="M480 0 V170 H720"/>
  </g>
  <circle cx="300" cy="170" r="34" fill="#0a0a0a" opacity="0.12"/>
  <circle cx="300" cy="170" r="18" fill="#c8ff00" stroke="#0a0a0a" stroke-width="4"/>
  <rect x="330" y="120" width="180" height="52" rx="12" fill="#0a0a0a"/>
  <text x="350" y="142" font-family="Arial Black, Arial, sans-serif" font-size="13" font-weight="900" fill="#c8ff00">FITCHECK STUDIO</text>
  <text x="350" y="160" font-family="Arial, sans-serif" font-size="11" fill="#f5f2eb">Veera Desai Rd, Andheri W</text>
  <text x="24" y="318" font-family="Arial, sans-serif" font-size="11" fill="#7d7d74" letter-spacing="2">MUMBAI · MAHARASHTRA</text>
</svg>`
)

console.log(`Generated ${products.length} product images + hero, lookbook, map, favicon`)
