import React, { useState } from 'react';
import type { IslandTile, PixelAvatarConfig, UserIslandData } from '../types';
import { ISLAND_ITEMS_MAP } from '../data/islandCatalog';
import { PixelAvatar } from './PixelAvatar';

interface PixelIslandCanvasProps {
  island: UserIslandData;
  avatarConfig?: Partial<PixelAvatarConfig> | null;
  userName?: string;
  selectedItemId?: string | null; // null or 'demolish' or specific itemId
  onTileClick?: (x: number, y: number) => void;
  isReadOnly?: boolean;
  isVisiting?: boolean;
}

// 8x8 Grid Configuration inside the 840x480 SVG
const GRID_SIZE = 8;
const GRID_X = 260;
const GRID_Y = 130;
const CELL_W = 38;
const CELL_H = 34;

export const PixelIslandCanvas: React.FC<PixelIslandCanvasProps> = ({
  island,
  avatarConfig,
  userName = 'المستكشف',
  selectedItemId,
  onTileClick,
  isReadOnly = false,
  isVisiting = false
}) => {
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null);

  // Map tiles for quick O(1) lookup
  const tileMap = React.useMemo(() => {
    const map = new Map<string, IslandTile>();
    for (const t of island?.tiles || []) {
      map.set(`${t.x},${t.y}`, t);
    }
    return map;
  }, [island?.tiles]);

  const handleCellClick = (x: number, y: number) => {
    if (isReadOnly || !onTileClick) return;
    onTileClick(x, y);
  };

  const selectedItemDef = selectedItemId && selectedItemId !== 'demolish'
    ? ISLAND_ITEMS_MAP[selectedItemId]
    : null;

  return (
    <div className="relative w-full aspect-[840/480] max-h-[560px] mx-auto select-none overflow-hidden rounded-2xl shadow-2xl border-4 border-emerald-900/30 bg-sky-200">
      <svg
        viewBox="0 0 840 480"
        className="w-full h-full block"
        style={{ shapeRendering: 'crispEdges' }}
      >
        <defs>
          {/* Sky Gradient */}
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4aa3df" />
            <stop offset="60%" stopColor="#7ec8f2" />
            <stop offset="100%" stopColor="#a9e0fc" />
          </linearGradient>

          {/* Deep Ocean Gradient */}
          <linearGradient id="seaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2574a9" />
            <stop offset="40%" stopColor="#1f618d" />
            <stop offset="100%" stopColor="#154360" />
          </linearGradient>

          {/* Sand Gradient */}
          <linearGradient id="sandGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="60%" stopColor="#fde047" />
            <stop offset="100%" stopColor="#eab308" />
          </linearGradient>

          {/* Grass Gradient */}
          <linearGradient id="grassGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="70%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#16a34a" />
          </linearGradient>

          {/* Pond Gradient */}
          <radialGradient id="pondGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#67e8f9" />
            <stop offset="70%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#0369a1" />
          </radialGradient>
        </defs>

        {/* --- 1. SKY & HORIZON --- */}
        <rect x="0" y="0" width="840" height="110" fill="url(#skyGrad)" />
        <rect x="0" y="106" width="840" height="4" fill="#a9e0fc" opacity="0.6" />

        {/* Fluffy Pixel Clouds */}
        <g fill="#ffffff" opacity="0.95">
          {/* Cloud 1 (Left) */}
          <rect x="60" y="24" width="70" height="14" rx="3" />
          <rect x="80" y="16" width="40" height="10" rx="3" />
          <rect x="110" y="22" width="30" height="12" rx="3" />
          <rect x="68" y="34" width="54" height="6" fill="#e0f2fe" />

          {/* Cloud 2 (Center) */}
          <rect x="360" y="14" width="90" height="16" rx="4" />
          <rect x="385" y="6" width="50" height="12" rx="4" />
          <rect x="420" y="12" width="42" height="14" rx="4" />
          <rect x="372" y="26" width="76" height="6" fill="#e0f2fe" />

          {/* Cloud 3 (Right) */}
          <rect x="670" y="26" width="80" height="14" rx="3" />
          <rect x="695" y="18" width="45" height="10" rx="3" />
          <rect x="680" y="36" width="60" height="6" fill="#e0f2fe" />
        </g>

        {/* Flying Pixel Seagulls */}
        <g fill="#ffffff" opacity="0.8">
          <path d="M190,45 L194,48 L198,45 L196,44 L194,46 L192,44 Z" />
          <path d="M210,38 L213,41 L216,38 L215,37 L213,39 L211,37 Z" />
          <path d="M620,40 L624,43 L628,40 L626,39 L624,41 L622,39 Z" />
        </g>

        {/* --- 2. OCEAN WITH SHALLOW WATER & SURF WAVES --- */}
        <rect x="0" y="110" width="840" height="370" fill="url(#seaGrad)" />

        {/* Rhythmic Ocean Ripple Lines */}
        <g stroke="#ffffff" strokeWidth="2" opacity="0.35">
          <line x1="40" y1="130" x2="110" y2="130" />
          <line x1="720" y1="135" x2="790" y2="135" />
          <line x1="20" y1="200" x2="80" y2="200" />
          <line x1="760" y1="220" x2="820" y2="220" />
          <line x1="40" y1="360" x2="100" y2="360" />
          <line x1="740" y1="370" x2="810" y2="370" />
          <line x1="180" y1="465" x2="260" y2="465" />
          <line x1="580" y1="468" x2="680" y2="468" />
        </g>

        {/* Coastal Shallow Turquoise Water Ring */}
        <ellipse cx="420" cy="275" rx="370" ry="175" fill="#38bdf8" opacity="0.4" />
        <ellipse cx="420" cy="275" rx="355" ry="165" fill="#67e8f9" opacity="0.5" />

        {/* Foamy White Surf Shoreline (Organic Pixel Curves) */}
        <path
          d="M80,270 C80,185 200,140 420,140 C640,140 760,185 760,270 C760,355 640,430 420,430 C200,430 80,355 80,270 Z"
          fill="#ffffff"
          opacity="0.95"
        />

        {/* --- 3. GOLDEN SAND BEACH --- */}
        <path
          d="M90,270 C90,190 205,148 420,148 C635,148 750,190 750,270 C750,350 635,422 420,422 C205,422 90,350 90,270 Z"
          fill="url(#sandGrad)"
          stroke="#ca8a04"
          strokeWidth="3"
        />

        {/* Sandy beach texture specks */}
        <g fill="#d97706" opacity="0.4">
          <rect x="130" y="240" width="3" height="3" />
          <rect x="145" y="280" width="3" height="3" />
          <rect x="710" y="250" width="3" height="3" />
          <rect x="690" y="310" width="3" height="3" />
          <rect x="420" y="414" width="4" height="3" />
          <rect x="470" y="410" width="3" height="3" />
          <rect x="350" y="412" width="3" height="3" />
        </g>

        {/* --- 4. GREEN GRASS PLATEAU --- */}
        {/* Dark Grass Border Drop Shadow */}
        <path
          d="M130,265 C130,195 230,165 420,165 C610,165 710,195 710,265 C710,335 610,395 420,395 C230,395 130,335 130,265 Z"
          fill="#15803d"
        />
        {/* Main Grass Body */}
        <path
          d="M130,260 C130,190 230,160 420,160 C610,160 710,190 710,260 C710,330 610,390 420,390 C230,390 130,330 130,260 Z"
          fill="url(#grassGrad)"
          stroke="#166534"
          strokeWidth="2"
        />

        {/* Subtle Pixel Grass Tufts across island base */}
        <g fill="#15803d">
          <path d="M160,200 L163,194 L165,200 M164,200 L167,196 L169,200" stroke="#15803d" strokeWidth="1.5" />
          <path d="M220,175 L223,169 L225,175 M224,175 L227,171 L229,175" stroke="#15803d" strokeWidth="1.5" />
          <path d="M640,190 L643,184 L645,190 M644,190 L647,186 L649,190" stroke="#15803d" strokeWidth="1.5" />
          <path d="M670,270 L673,264 L675,270 M674,270 L677,266 L679,270" stroke="#15803d" strokeWidth="1.5" />
          <path d="M610,360 L613,354 L615,360 M614,360 L617,356 L619,360" stroke="#15803d" strokeWidth="1.5" />
          <path d="M210,375 L213,369 L215,375 M214,375 L217,371 L219,375" stroke="#15803d" strokeWidth="1.5" />
        </g>

        {/* --- 5. COBBLESTONE STEPPING STONE PATHWAY --- */}
        {/* Winding organic cobblestone path connecting bottom center through island */}
        <g fill="#94a3b8" stroke="#334155" strokeWidth="1.5">
          {/* Main vertical path entering from south beach */}
          <rect x="412" y="386" width="16" height="10" rx="3" />
          <rect x="424" y="374" width="14" height="11" rx="3" />
          <rect x="408" y="362" width="18" height="10" rx="3" />
          <rect x="420" y="350" width="15" height="11" rx="3" />
          <rect x="410" y="338" width="16" height="10" rx="3" />
          <rect x="422" y="326" width="14" height="10" rx="3" />

          {/* Fork to the left toward pond */}
          <rect x="390" y="332" width="16" height="9" rx="3" />
          <rect x="370" y="330" width="15" height="9" rx="3" />
          <rect x="350" y="334" width="14" height="8" rx="3" />

          {/* Fork into central plaza */}
          <rect x="414" y="312" width="16" height="11" rx="3" />
          <rect x="428" y="302" width="14" height="10" rx="3" />
          <rect x="412" y="290" width="18" height="10" rx="3" />

          {/* Fork heading east toward right shore */}
          <rect x="580" y="320" width="15" height="9" rx="3" />
          <rect x="600" y="318" width="16" height="9" rx="3" />
          <rect x="620" y="316" width="14" height="9" rx="3" />
          <rect x="640" y="318" width="15" height="8" rx="3" />
        </g>

        {/* --- 6. LOWER-LEFT WATER POND & LILY PADS --- */}
        {/* Pond Shadow */}
        <ellipse cx="205" cy="320" rx="56" ry="36" fill="#166534" />
        {/* Pond Bank */}
        <ellipse cx="205" cy="318" rx="55" ry="35" fill="#ca8a04" stroke="#854d0e" strokeWidth="2" />
        {/* Pond Water */}
        <ellipse cx="205" cy="317" rx="50" ry="31" fill="url(#pondGrad)" />

        {/* Floating Green Lily Pads */}
        <g fill="#16a34a" stroke="#14532d" strokeWidth="1">
          <ellipse cx="180" cy="310" rx="9" ry="6" />
          <ellipse cx="225" cy="312" rx="10" ry="7" />
          <ellipse cx="200" cy="332" rx="8" ry="5" />
          {/* Lily Pad Notch */}
          <polygon points="180,310 176,308 177,313" fill="#0284c7" />
          <polygon points="225,312 229,310 228,315" fill="#0284c7" />
        </g>
        {/* Pink Water Blossom */}
        <circle cx="180" cy="310" r="2.5" fill="#f43f5e" />
        <circle cx="225" cy="312" r="2.5" fill="#fb7185" />

        {/* Reeds / Cattails on Pond Rim */}
        <g stroke="#15803d" strokeWidth="2">
          <line x1="250" y1="326" x2="250" y2="304" />
          <line x1="254" y1="328" x2="256" y2="300" />
          <line x1="160" y1="330" x2="158" y2="308" />
        </g>
        {/* Brown Cattail tops */}
        <rect x="249" y="302" width="3" height="7" rx="1" fill="#78350f" />
        <rect x="255" y="298" width="3" height="7" rx="1" fill="#78350f" />
        <rect x="157" y="306" width="3" height="7" rx="1" fill="#78350f" />

        {/* --- 7. THE 8x8 BUILDING GRID --- */}
        {/* Backdrop for 8x8 building plot */}
        <g id="island-grid">
          {Array.from({ length: GRID_SIZE }).map((_, row) => {
            return Array.from({ length: GRID_SIZE }).map((__, col) => {
              const x = GRID_X + col * CELL_W;
              const y = GRID_Y + row * CELL_H;
              const isEven = (row + col) % 2 === 0;
              const isHovered = hoveredTile?.x === col && hoveredTile?.y === row;
              const tileData = tileMap.get(`${col},${row}`);
              const isDemolishMode = selectedItemId === 'demolish';

              return (
                <g
                  key={`cell-${col}-${row}`}
                  className={!isReadOnly ? 'cursor-pointer transition-opacity' : ''}
                  onMouseEnter={() => !isReadOnly && setHoveredTile({ x: col, y: row })}
                  onMouseLeave={() => !isReadOnly && setHoveredTile(null)}
                  onClick={() => handleCellClick(col, row)}
                >
                  {/* Subtle Grid Tile Ground */}
                  <rect
                    x={x}
                    y={y}
                    width={CELL_W}
                    height={CELL_H}
                    fill={isEven ? 'rgba(34, 197, 94, 0.28)' : 'rgba(22, 163, 74, 0.18)'}
                    stroke={
                      isHovered
                        ? isDemolishMode
                          ? '#ef4444'
                          : '#facc15'
                        : 'rgba(255, 255, 255, 0.22)'
                    }
                    strokeWidth={isHovered ? 2.5 : 1}
                    strokeDasharray={isHovered ? 'none' : '3 3'}
                  />

                  {/* Empty Cell Coordinate Dot */}
                  {!tileData && !isHovered && (
                    <circle
                      cx={x + CELL_W / 2}
                      cy={y + CELL_H / 2}
                      r={1.5}
                      fill="rgba(255,255,255,0.3)"
                    />
                  )}

                  {/* Placed Item Sprite Rendering */}
                  {tileData && (
                    <g transform={`translate(${x}, ${y})`}>
                      {renderPixelSprite(tileData.itemId)}
                    </g>
                  )}

                  {/* Hover Ghost Preview */}
                  {isHovered && !isReadOnly && (
                    <g transform={`translate(${x}, ${y})`} opacity={0.65}>
                      {isDemolishMode ? (
                        <g>
                          <rect
                            x={2}
                            y={2}
                            width={CELL_W - 4}
                            height={CELL_H - 4}
                            fill="#ef4444"
                            opacity={0.3}
                          />
                          <text
                            x={CELL_W / 2}
                            y={CELL_H / 2 + 5}
                            textAnchor="middle"
                            fontSize="16"
                          >
                            🧹
                          </text>
                        </g>
                      ) : selectedItemDef ? (
                        renderPixelSprite(selectedItemDef.id)
                      ) : null}
                    </g>
                  )}
                </g>
              );
            });
          })}
        </g>

        {/* --- 8. USER / FRIEND PIXEL AVATAR ON ISLAND --- */}
        <g transform="translate(180, 215)">
          {/* Ground drop shadow for avatar */}
          <ellipse cx="26" cy="62" rx="20" ry="7" fill="rgba(0,0,0,0.28)" />

          {/* Friendly Speech Bubble if Visiting */}
          {isVisiting && (
            <g transform="translate(-25, -42)">
              <rect
                x="0"
                y="0"
                width="110"
                height="32"
                rx="8"
                fill="#ffffff"
                stroke="#0f172a"
                strokeWidth="2"
              />
              <polygon points="45,32 55,32 50,38" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
              <rect x="46" y="30" width="8" height="4" fill="#ffffff" />
              <text
                x="55"
                y="18"
                textAnchor="middle"
                fontSize="10"
                fontWeight="bold"
                fill="#0f172a"
                fontFamily="sans-serif"
              >
                مرحباً بك في جزيرتي! 🏝️
              </text>
            </g>
          )}

          {/* Name Tag */}
          <g transform="translate(-10, -14)">
            <rect
              x="0"
              y="0"
              width="74"
              height="16"
              rx="4"
              fill="rgba(15, 23, 42, 0.85)"
              stroke="#e2e8f0"
              strokeWidth="1"
            />
            <text
              x="37"
              y="11"
              textAnchor="middle"
              fontSize="9"
              fontWeight="bold"
              fill="#f8fafc"
              fontFamily="sans-serif"
            >
              {userName}
            </text>
          </g>

          {/* Pixel Avatar */}
          <foreignObject x="0" y="0" width="54" height="64">
            <div className="w-full h-full flex items-center justify-center animate-bounce-subtle">
              <PixelAvatar config={avatarConfig} size={54} />
            </div>
          </foreignObject>
        </g>
      </svg>

      {/* Floating Canvas UI Controls */}
      <div className="absolute top-3 left-3 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-xs text-white shadow-lg pointer-events-none">
        <span className="font-bold text-emerald-400">🏝️ {island.name || 'جزيرتي البكسلية'}</span>
        <span className="text-white/40">|</span>
        <span className="text-amber-300 font-semibold">{island.tiles.length}/64 مربع مبني</span>
        <span className="text-white/40">|</span>
        <span className="text-rose-400 font-semibold">❤️ {island.likes} إعجاب</span>
      </div>

      {hoveredTile && !isReadOnly && (
        <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-lg border border-emerald-500/40 text-xs text-emerald-300 shadow-md pointer-events-none">
          المربع [{hoveredTile.x + 1}, {hoveredTile.y + 1}] —{' '}
          {tileMap.has(`${hoveredTile.x},${hoveredTile.y}`)
            ? ISLAND_ITEMS_MAP[tileMap.get(`${hoveredTile.x},${hoveredTile.y}`)!.itemId]?.nameAr || 'مبنى'
            : selectedItemId === 'demolish'
            ? 'انقر للإخلاء 🧹'
            : selectedItemDef
            ? `انقر لبناء ${selectedItemDef.nameAr}`
            : 'اختر عنصراً من الأسفل للبناء'}
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// Detailed Pixel Art Sprites for the 9 Island Catalog Items
// Rendered crisp inside each CELL_W x CELL_H (38x34) grid tile
// -------------------------------------------------------------
function renderPixelSprite(itemId: string) {
  switch (itemId) {
    case 'house':
      // 🏠 Cozy House: red pitched tiled roof, wood walls, chimney, door, paned window
      return (
        <g id="sprite-house">
          {/* Drop shadow */}
          <ellipse cx={CELL_W / 2} cy={CELL_H - 2} rx={16} ry={3} fill="rgba(0,0,0,0.3)" />

          {/* Brick Chimney */}
          <rect x={CELL_W - 14} y={3} width={5} height={9} fill="#991b1b" stroke="#450a0a" strokeWidth={1} />
          {/* Smoke puff */}
          <circle cx={CELL_W - 11} cy={1} r={2} fill="#e2e8f0" opacity={0.7} />

          {/* Red Gable Roof */}
          <polygon
            points={`${CELL_W / 2},4 3,17 ${CELL_W - 3},17`}
            fill="#dc2626"
            stroke="#7f1d1d"
            strokeWidth={1.5}
          />
          {/* Roof Shingles Accent */}
          <line x1={8} y1={13} x2={CELL_W - 8} y2={13} stroke="#ef4444" strokeWidth={1.5} />
          <line x1={CELL_W / 2} y1={5} x2={CELL_W / 2} y2={17} stroke="#b91c1c" strokeWidth={1} />

          {/* Wooden Cottage Walls */}
          <rect
            x={5}
            y={17}
            width={CELL_W - 10}
            height={15}
            fill="#d97706"
            stroke="#78350f"
            strokeWidth={1.5}
          />
          {/* Wood Planks Lines */}
          <line x1={5} y1={22} x2={CELL_W - 5} y2={22} stroke="#b45309" strokeWidth={1} />
          <line x1={5} y1={27} x2={CELL_W - 5} y2={27} stroke="#b45309" strokeWidth={1} />

          {/* Wooden Door with knob */}
          <rect x={CELL_W / 2 - 4} y={20} width={8} height={12} fill="#78350f" stroke="#451a03" strokeWidth={1} />
          <circle cx={CELL_W / 2 + 1} cy={26} r={1} fill="#facc15" />

          {/* Glowing Paned Window */}
          <rect x={7} y={20} width={6} height={6} fill="#fef08a" stroke="#78350f" strokeWidth={1} />
          <line x1={10} y1={20} x2={10} y2={26} stroke="#78350f" strokeWidth={0.75} />
          <line x1={7} y1={23} x2={13} y2={23} stroke="#78350f" strokeWidth={0.75} />
        </g>
      );

    case 'tree':
      // 🌲 Pine Tree: multi-tiered evergreen needles and wooden trunk
      return (
        <g id="sprite-tree">
          {/* Drop shadow */}
          <ellipse cx={CELL_W / 2} cy={CELL_H - 2} rx={12} ry={3} fill="rgba(0,0,0,0.25)" />

          {/* Tree Trunk */}
          <rect x={CELL_W / 2 - 3} y={24} width={6} height={9} fill="#78350f" stroke="#451a03" strokeWidth={1} />

          {/* Pine Needle Tier 3 (Bottom) */}
          <polygon
            points={`${CELL_W / 2},14 5,25 ${CELL_W - 5},25`}
            fill="#15803d"
            stroke="#14532d"
            strokeWidth={1.5}
          />
          {/* Pine Needle Tier 2 (Middle) */}
          <polygon
            points={`${CELL_W / 2},8 8,17 ${CELL_W - 8},17`}
            fill="#16a34a"
            stroke="#14532d"
            strokeWidth={1.5}
          />
          {/* Pine Needle Tier 1 (Top) */}
          <polygon
            points={`${CELL_W / 2},2 12,11 ${CELL_W - 12},11`}
            fill="#22c55e"
            stroke="#14532d"
            strokeWidth={1.5}
          />
        </g>
      );

    case 'flowers':
      // 🌸 Wildflowers: cluster of red, yellow, purple, blue pixel flowers
      return (
        <g id="sprite-flowers">
          {/* Drop shadow */}
          <ellipse cx={CELL_W / 2} cy={CELL_H - 3} rx={14} ry={4} fill="rgba(0,0,0,0.18)" />

          {/* Leaves base */}
          <circle cx={14} cy={24} r={5} fill="#16a34a" />
          <circle cx={24} cy={25} r={5} fill="#15803d" />
          <circle cx={19} cy={20} r={4} fill="#22c55e" />

          {/* Flower 1 (Red Rose) */}
          <circle cx={13} cy={16} r={4} fill="#ef4444" stroke="#991b1b" strokeWidth={1} />
          <circle cx={13} cy={16} r={1.5} fill="#fef08a" />

          {/* Flower 2 (Yellow Sunflower) */}
          <circle cx={25} cy={17} r={4} fill="#facc15" stroke="#ca8a04" strokeWidth={1} />
          <circle cx={25} cy={17} r={1.5} fill="#78350f" />

          {/* Flower 3 (Purple Violet) */}
          <circle cx={19} cy={11} r={3.5} fill="#a855f7" stroke="#6b21a8" strokeWidth={1} />
          <circle cx={19} cy={11} r={1.2} fill="#ffffff" />

          {/* Flower 4 (Blue Daisy) */}
          <circle cx={21} cy={26} r={3.5} fill="#38bdf8" stroke="#0284c7" strokeWidth={1} />
          <circle cx={21} cy={26} r={1.2} fill="#fef08a" />
        </g>
      );

    case 'fence':
      // 🚧 Wooden Fence: rustic farm fence with vertical posts and horizontal rails
      return (
        <g id="sprite-fence">
          {/* Drop shadow */}
          <ellipse cx={CELL_W / 2} cy={CELL_H - 2} rx={16} ry={2.5} fill="rgba(0,0,0,0.2)" />

          {/* Horizontal Rails */}
          <rect x={3} y={15} width={CELL_W - 6} height={4} fill="#b45309" stroke="#78350f" strokeWidth={1} />
          <rect x={3} y={23} width={CELL_W - 6} height={4} fill="#b45309" stroke="#78350f" strokeWidth={1} />

          {/* Left Vertical Post */}
          <rect x={6} y={10} width={6} height={21} rx={1} fill="#d97706" stroke="#78350f" strokeWidth={1.2} />
          <polygon points="6,10 9,6 12,10" fill="#d97706" stroke="#78350f" strokeWidth={1.2} />

          {/* Right Vertical Post */}
          <rect x={CELL_W - 12} y={10} width={6} height={21} rx={1} fill="#d97706" stroke="#78350f" strokeWidth={1.2} />
          <polygon points={`${CELL_W - 12},10 ${CELL_W - 9},6 ${CELL_W - 6},10`} fill="#d97706" stroke="#78350f" strokeWidth={1.2} />
        </g>
      );

    case 'well':
      // 🪣 Stone Well: round cobblestone well with canopy and bucket
      return (
        <g id="sprite-well">
          {/* Drop shadow */}
          <ellipse cx={CELL_W / 2} cy={CELL_H - 2} rx={14} ry={4} fill="rgba(0,0,0,0.25)" />

          {/* Wood Canopy Roof */}
          <polygon
            points={`${CELL_W / 2},5 6,12 ${CELL_W - 6},12`}
            fill="#78350f"
            stroke="#451a03"
            strokeWidth={1.2}
          />
          {/* Wooden Support Posts */}
          <rect x={8} y={12} width={3} height={12} fill="#b45309" stroke="#451a03" strokeWidth={0.8} />
          <rect x={CELL_W - 11} y={12} width={3} height={12} fill="#b45309" stroke="#451a03" strokeWidth={0.8} />

          {/* Hanging Rope & Bucket */}
          <line x1={CELL_W / 2} y1={12} x2={CELL_W / 2} y2={18} stroke="#fde047" strokeWidth={1} />
          <rect x={CELL_W / 2 - 2} y={18} width={4} height={4} fill="#475569" stroke="#1e293b" strokeWidth={0.8} />

          {/* Stone Basin */}
          <ellipse cx={CELL_W / 2} cy={25} rx={13} ry={6} fill="#64748b" stroke="#334155" strokeWidth={1.2} />
          <rect x={6} y={25} width={CELL_W - 12} height={7} fill="#64748b" stroke="#334155" strokeWidth={1.2} />
          <ellipse cx={CELL_W / 2} cy={31} rx={13} ry={4} fill="#475569" />
          {/* Water Surface inside */}
          <ellipse cx={CELL_W / 2} cy={25} rx={10} ry={4} fill="#38bdf8" />
        </g>
      );

    case 'sheep':
      // 🐑 Pixel Sheep: fluffy white wool sheep with dark hooves and cute ears
      return (
        <g id="sprite-sheep">
          {/* Drop shadow */}
          <ellipse cx={CELL_W / 2} cy={CELL_H - 2} rx={13} ry={3.5} fill="rgba(0,0,0,0.25)" />

          {/* Dark Hooves / Legs */}
          <rect x={11} y={25} width={3} height={7} fill="#1e293b" />
          <rect x={17} y={25} width={3} height={7} fill="#1e293b" />
          <rect x={24} y={25} width={3} height={7} fill="#1e293b" />

          {/* Fluffy Wool Body */}
          <circle cx={15} cy={19} r={7} fill="#f8fafc" stroke="#cbd5e1" strokeWidth={1} />
          <circle cx={22} cy={18} r={8} fill="#ffffff" stroke="#cbd5e1" strokeWidth={1} />
          <circle cx={27} cy={20} r={6} fill="#f8fafc" stroke="#cbd5e1" strokeWidth={1} />

          {/* Cute Face Head */}
          <ellipse cx={10} cy={18} rx={5} ry={4} fill="#334155" stroke="#0f172a" strokeWidth={1} />
          {/* Pink Ear */}
          <ellipse cx={9} cy={14} rx={2} ry={3} fill="#fda4af" />
          {/* White Eye */}
          <circle cx={8.5} cy={17.5} r={1} fill="#ffffff" />
          <circle cx={8.5} cy={17.5} r={0.5} fill="#000000" />
        </g>
      );

    case 'dog':
      // 🐕 Faithful Dog: loyal golden/brown pixel puppy
      return (
        <g id="sprite-dog">
          {/* Drop shadow */}
          <ellipse cx={CELL_W / 2} cy={CELL_H - 2} rx={12} ry={3} fill="rgba(0,0,0,0.25)" />

          {/* Legs */}
          <rect x={11} y={25} width={3} height={7} fill="#b45309" stroke="#78350f" strokeWidth={0.8} />
          <rect x={17} y={25} width={3} height={7} fill="#b45309" stroke="#78350f" strokeWidth={0.8} />
          <rect x={24} y={25} width={3} height={7} fill="#b45309" stroke="#78350f" strokeWidth={0.8} />

          {/* Tail wagging up */}
          <path d="M26,20 C29,18 31,13 32,11" stroke="#d97706" strokeWidth={2.5} strokeLinecap="round" />

          {/* Puppy Body */}
          <rect x={13} y={16} width={15} height={10} rx={3} fill="#d97706" stroke="#78350f" strokeWidth={1.2} />

          {/* Puppy Head & Floppy Ear */}
          <circle cx={12} cy={15} r={6} fill="#d97706" stroke="#78350f" strokeWidth={1.2} />
          <ellipse cx={8} cy={13} rx={2} ry={4} fill="#78350f" />
          {/* Snout */}
          <ellipse cx={8} cy={16} rx={3} ry={2.5} fill="#fed7aa" />
          <circle cx={7} cy={15.5} r={1} fill="#1e293b" />
          {/* Eye */}
          <circle cx={12} cy={13.5} r={1} fill="#0f172a" />
          {/* Red Collar */}
          <rect x={11} y={19} width={5} height={2} fill="#ef4444" />
        </g>
      );

    case 'crops':
      // 🌾 Farm Crops: dark tilled garden plot with green sprouts and watering can
      return (
        <g id="sprite-crops">
          {/* Tilled Soil Plot */}
          <rect
            x={4}
            y={12}
            width={CELL_W - 8}
            height={20}
            rx={3}
            fill="#57361a"
            stroke="#3a220d"
            strokeWidth={1.5}
          />
          {/* Soil Furrows */}
          <line x1={6} y1={18} x2={CELL_W - 6} y2={18} stroke="#3a220d" strokeWidth={1} />
          <line x1={6} y1={25} x2={CELL_W - 6} y2={25} stroke="#3a220d" strokeWidth={1} />

          {/* Growing Green Sprouts */}
          {/* Row 1 */}
          <g fill="#22c55e" stroke="#15803d" strokeWidth={0.8}>
            <circle cx={9} cy={15} r={2.5} />
            <circle cx={17} cy={15} r={2.5} />
            <circle cx={25} cy={15} r={2.5} />
            {/* Row 2 */}
            <circle cx={9} cy={22} r={3} />
            <circle cx={17} cy={22} r={3} />
            <circle cx={25} cy={22} r={3} />
          </g>

          {/* Little Blue Watering Can */}
          <rect x={CELL_W - 11} y={23} width={5} height={6} rx={1} fill="#38bdf8" stroke="#0284c7" strokeWidth={0.8} />
          <line x1={CELL_W - 13} y1={25} x2={CELL_W - 11} y2={25} stroke="#0284c7" strokeWidth={1} />
        </g>
      );

    case 'lantern':
      // ⛲ Garden Lantern: iron post with glowing amber lamp bulb
      return (
        <g id="sprite-lantern">
          {/* Drop shadow */}
          <ellipse cx={CELL_W / 2} cy={CELL_H - 2} rx={9} ry={3} fill="rgba(0,0,0,0.25)" />

          {/* Stone Pedestal Base */}
          <rect x={CELL_W / 2 - 5} y={27} width={10} height={5} fill="#475569" stroke="#1e293b" strokeWidth={1} />

          {/* Wrought Iron Post */}
          <rect x={CELL_W / 2 - 2} y={14} width={4} height={13} fill="#1e293b" />

          {/* Radiant Amber Glow Halo */}
          <circle cx={CELL_W / 2} cy={9} r={9} fill="#fef08a" opacity={0.35} />

          {/* Lantern Head Frame */}
          <rect
            x={CELL_W / 2 - 5}
            y={5}
            width={10}
            height={9}
            rx={1}
            fill="#f59e0b"
            stroke="#0f172a"
            strokeWidth={1.2}
          />
          {/* Glowing Center Bulb */}
          <circle cx={CELL_W / 2} cy={9} r={3} fill="#ffffff" />
          {/* Iron Cap Peak */}
          <polygon
            points={`${CELL_W / 2},2 ${CELL_W / 2 - 6},5 ${CELL_W / 2 + 6},5`}
            fill="#0f172a"
          />
        </g>
      );

    default:
      return (
        <text x={CELL_W / 2} y={CELL_H / 2 + 5} textAnchor="middle" fontSize="16">
          📦
        </text>
      );
  }
}
