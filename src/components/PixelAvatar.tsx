import React from 'react';
import { DEFAULT_AVATAR_CONFIG, hasActiveEnchantedItem } from '../data/avatarCatalog';
import type { PixelAvatarConfig } from '../types';

interface PixelAvatarProps {
  config?: Partial<PixelAvatarConfig> | null;
  size?: number;
  className?: string;
  forceEnchanted?: boolean;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function shadeHex(hex: string, amount: number): string {
  const clean = /^#([0-9A-Fa-f]{6})$/.exec((hex || '').trim());
  if (!clean) return hex || '#888888';
  const num = parseInt(clean[1], 16);
  const r = clamp(((num >> 16) & 255) + amount, 0, 255);
  const g = clamp(((num >> 8) & 255) + amount, 0, 255);
  const b = clamp((num & 255) + amount, 0, 255);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

const OUTLINE = '#17141D';
const OUTLINE_SOFT = '#25202E';

export const PixelAvatar: React.FC<PixelAvatarProps> = ({
  config,
  size = 64,
  className = '',
  forceEnchanted
}) => {
  const cfg: PixelAvatarConfig = {
    ...DEFAULT_AVATAR_CONFIG,
    ...(config || {}),
    unlockedItems: config?.unlockedItems || DEFAULT_AVATAR_CONFIG.unlockedItems,
    enchantedItems: config?.enchantedItems || []
  };
  const isEnchanted = typeof forceEnchanted === 'boolean' ? forceEnchanted : hasActiveEnchantedItem(cfg);

  // Preset detection
  const isClassicBoy = cfg.preset === 'boy_classic';
  const isHoodieBoy = cfg.preset === 'boy_hoodie';
  const isPonytailGirl = cfg.preset === 'girl_ponytail';
  const isWavyGirl = cfg.preset === 'girl_wavy' || (!isClassicBoy && !isHoodieBoy && !isPonytailGirl && cfg.gender === 'girl');

  // Dynamic Color Palette
  const hair = cfg.hairColor || DEFAULT_AVATAR_CONFIG.hairColor;
  const hairDark = shadeHex(hair, -36);
  const hairDeep = shadeHex(hair, -50);
  const hairLight = shadeHex(hair, 32);
  const hairHighlight = shadeHex(hair, 50);

  const skin = cfg.skinTone || DEFAULT_AVATAR_CONFIG.skinTone;
  const skinShadow = shadeHex(skin, -26);
  const skinDeep = shadeHex(skin, -40);
  const skinLight = shadeHex(skin, 24);
  const blush = shadeHex(skin, -16);

  const shirt = cfg.shirtColor || DEFAULT_AVATAR_CONFIG.shirtColor;
  const shirtDark = shadeHex(shirt, -32);
  const shirtDeep = shadeHex(shirt, -48);
  const shirtLight = shadeHex(shirt, 28);
  const shirtHighlight = shadeHex(shirt, 46);

  const pants = cfg.pantsColor || DEFAULT_AVATAR_CONFIG.pantsColor;
  const pantsDark = shadeHex(pants, -28);
  const pantsDeep = shadeHex(pants, -44);
  const pantsLight = shadeHex(pants, 24);

  // 1. Background (32x48 grid)
  const renderBackground = () => {
    switch (cfg.background) {
      case 'space':
        return (
          <g>
            <rect x="0" y="0" width="32" height="48" fill="#0B0F2A" />
            <rect x="0" y="38" width="32" height="10" fill="#171C42" />
            {/* Golden Crescent Moon */}
            <rect x="24" y="4" width="4" height="6" fill="#FACC15" />
            <rect x="25" y="4" width="2" height="6" fill="#FEF08A" />
            <rect x="26" y="5" width="2" height="4" fill="#0B0F2A" />
            {/* Stars */}
            <rect x="4" y="6" width="1" height="1" fill="#FFFFFF" />
            <rect x="5" y="5" width="1" height="3" fill="#FDE047" opacity="0.8" />
            <rect x="4" y="16" width="1" height="1" fill="#FFFFFF" />
            <rect x="27" y="14" width="1" height="1" fill="#93C5FD" />
            <rect x="2" y="26" width="1" height="1" fill="#FDE047" />
            <rect x="29" y="28" width="1" height="1" fill="#FFFFFF" />
          </g>
        );
      case 'london_cafe':
        return (
          <g>
            <rect x="0" y="0" width="32" height="36" fill="#F7EDE2" />
            <rect x="0" y="36" width="32" height="12" fill="#8B4513" />
            <rect x="0" y="36" width="32" height="2" fill="#6B3410" />
            {/* Brick & window accents */}
            <rect x="2" y="5" width="6" height="12" fill="#D4A373" />
            <rect x="3" y="6" width="4" height="10" fill="#E0F2FE" />
            <rect x="24" y="6" width="6" height="5" fill="#431407" />
            <rect x="25" y="7" width="4" height="3" fill="#FDE68A" />
          </g>
        );
      case 'forest':
        return (
          <g>
            <rect x="0" y="0" width="32" height="36" fill="#BAE6FD" />
            <rect x="0" y="36" width="32" height="12" fill="#4ADE80" />
            <rect x="0" y="36" width="32" height="2" fill="#22C55E" />
            {/* Pine Trees */}
            <rect x="2" y="24" width="2" height="12" fill="#78350F" />
            <rect x="1" y="16" width="4" height="9" fill="#15803D" />
            <rect x="2" y="13" width="2" height="4" fill="#16A34A" />
            <rect x="27" y="26" width="2" height="10" fill="#78350F" />
            <rect x="25" y="18" width="6" height="9" fill="#15803D" />
            <rect x="27" y="15" width="2" height="4" fill="#16A34A" />
          </g>
        );
      case 'castle':
        return (
          <g>
            <rect x="0" y="0" width="32" height="48" fill="#2E1065" />
            <rect x="0" y="36" width="32" height="12" fill="#4C1D95" />
            {/* Battlements */}
            <rect x="1" y="20" width="5" height="16" fill="#CA8A04" />
            <rect x="1" y="18" width="2" height="3" fill="#EAB308" />
            <rect x="4" y="18" width="2" height="3" fill="#EAB308" />
            <rect x="26" y="20" width="5" height="16" fill="#CA8A04" />
            <rect x="26" y="18" width="2" height="3" fill="#EAB308" />
            <rect x="29" y="18" width="2" height="3" fill="#EAB308" />
            <rect x="3" y="5" width="1" height="1" fill="#FEF08A" />
            <rect x="28" y="7" width="1" height="1" fill="#FEF08A" />
          </g>
        );
      case 'plain':
      default:
        return (
          <g>
            <rect x="0" y="0" width="32" height="48" fill="#F8FAFC" />
            <rect x="0" y="44" width="32" height="4" fill="#E2E8F0" />
            {/* Subtle shadow puddle under feet */}
            <ellipse cx="16" cy="44.5" rx="8" ry="1.5" fill="#CBD5E1" opacity="0.6" />
          </g>
        );
    }
  };

  // 2. Back Hair (behind neck & shoulders)
  const renderBackHair = () => {
    if (isWavyGirl) {
      // Cascading rich wavy locks flowing past shoulders down to chest/elbows
      return (
        <g>
          {/* Main back hair base */}
          <rect x="7" y="8" width="18" height="16" fill={OUTLINE} />
          <rect x="8" y="9" width="16" height="15" fill={hairDark} />

          {/* Left cascading curls (viewer's left) */}
          <rect x="4" y="10" width="6" height="16" fill={OUTLINE} />
          <rect x="5" y="11" width="4" height="14" fill={hair} />
          <rect x="4" y="14" width="2" height="6" fill={hairDeep} />
          <rect x="6" y="13" width="2" height="7" fill={hairLight} />
          <rect x="5" y="22" width="4" height="4" fill={hairDark} />
          <rect x="6" y="24" width="2" height="2" fill={hair} />

          {/* Right cascading curls (viewer's right) */}
          <rect x="22" y="10" width="6" height="16" fill={OUTLINE} />
          <rect x="23" y="11" width="4" height="14" fill={hair} />
          <rect x="26" y="14" width="2" height="6" fill={hairDeep} />
          <rect x="24" y="13" width="2" height="7" fill={hairLight} />
          <rect x="23" y="22" width="4" height="4" fill={hairDark} />
          <rect x="24" y="24" width="2" height="2" fill={hair} />
        </g>
      );
    }

    if (isPonytailGirl) {
      // High perky ponytail to her right (viewer's left) with red ribbon
      return (
        <g>
          {/* Ponytail Base & Scrunchie */}
          <rect x="5" y="5" width="4" height="5" fill={OUTLINE} />
          <rect x="6" y="6" width="3" height="3" fill="#EF4444" />
          <rect x="7" y="6" width="1" height="2" fill="#FCA5A5" />

          {/* Ponytail hair arching outward & downward */}
          <rect x="2" y="7" width="5" height="10" fill={OUTLINE} />
          <rect x="3" y="8" width="4" height="8" fill={hair} />
          <rect x="2" y="10" width="2" height="5" fill={hairDark} />
          <rect x="4" y="9" width="2" height="5" fill={hairLight} />
          {/* Tapered curly tip */}
          <rect x="1" y="14" width="3" height="3" fill={OUTLINE} />
          <rect x="2" y="14" width="2" height="2" fill={hairDark} />

          {/* Back nape hair */}
          <rect x="9" y="10" width="14" height="7" fill={OUTLINE} />
          <rect x="10" y="11" width="12" height="5" fill={hairDark} />
        </g>
      );
    }

    if (isHoodieBoy) {
      // Messy black hair back tips
      return (
        <g>
          <rect x="6" y="6" width="20" height="10" fill={OUTLINE} />
          <rect x="7" y="7" width="18" height="8" fill={hairDark} />
          {/* Outward messy tufts behind neck */}
          <rect x="5" y="9" width="2" height="4" fill={OUTLINE} />
          <rect x="25" y="9" width="2" height="4" fill={OUTLINE} />
        </g>
      );
    }

    // Classic Boy: neat tapered back hair
    return (
      <g>
        <rect x="8" y="7" width="16" height="9" fill={OUTLINE} />
        <rect x="9" y="8" width="14" height="7" fill={hairDark} />
      </g>
    );
  };

  // 3. Legs & Shoes
  const renderLegsAndFeet = () => {
    // Custom Outfits override
    if (cfg.outfit === 'space_suit') {
      return (
        <g>
          {/* White astronaut suit legs */}
          <rect x="10" y="28" width="5" height="14" fill={OUTLINE} />
          <rect x="17" y="28" width="5" height="14" fill={OUTLINE} />
          <rect x="11" y="28" width="4" height="13" fill="#F8FAFC" />
          <rect x="17" y="28" width="4" height="13" fill="#F8FAFC" />
          <rect x="10" y="34" width="12" height="2" fill="#0EA5E9" />
          {/* White boots */}
          <rect x="9" y="42" width="6" height="4" fill={OUTLINE} />
          <rect x="17" y="42" width="6" height="4" fill={OUTLINE} />
          <rect x="10" y="43" width="5" height="2" fill="#E2E8F0" />
          <rect x="17" y="43" width="5" height="2" fill="#E2E8F0" />
          <rect x="9" y="45" width="6" height="1" fill="#38BDF8" />
          <rect x="17" y="45" width="6" height="1" fill="#38BDF8" />
        </g>
      );
    }

    // Girl 3 (Ponytail): Bare peach legs + White Folded Socks + Coral-Red Mary Janes!
    if (isPonytailGirl && cfg.outfit === 'default') {
      return (
        <g>
          {/* Bare legs below the skirt */}
          <rect x="11" y="34" width="4" height="6" fill={OUTLINE} />
          <rect x="17" y="34" width="4" height="6" fill={OUTLINE} />
          <rect x="12" y="34" width="3" height="5" fill={skin} />
          <rect x="17" y="34" width="3" height="5" fill={skin} />
          <rect x="11" y="35" width="1" height="4" fill={skinShadow} />
          <rect x="19" y="35" width="1" height="4" fill={skinShadow} />

          {/* White Folded Crew Socks */}
          <rect x="11" y="39" width="4" height="4" fill={OUTLINE} />
          <rect x="17" y="39" width="4" height="4" fill={OUTLINE} />
          <rect x="12" y="39" width="3" height="3" fill="#FFFFFF" />
          <rect x="17" y="39" width="3" height="3" fill="#FFFFFF" />
          <rect x="11" y="39" width="4" height="1" fill="#E2E8F0" />
          <rect x="17" y="39" width="4" height="1" fill="#E2E8F0" />

          {/* Coral-Red Sneakers / Mary Janes */}
          <rect x="10" y="42" width="6" height="4" fill={OUTLINE} />
          <rect x="16" y="42" width="6" height="4" fill={OUTLINE} />
          <rect x="11" y="43" width="4" height="2" fill="#EF4444" />
          <rect x="17" y="43" width="4" height="2" fill="#EF4444" />
          {/* White toe box */}
          <rect x="10" y="44" width="2" height="2" fill="#FFFFFF" />
          <rect x="20" y="44" width="2" height="2" fill="#FFFFFF" />
          {/* White sole */}
          <rect x="10" y="45" width="6" height="1" fill="#FFFFFF" />
          <rect x="16" y="45" width="6" height="1" fill="#FFFFFF" />
        </g>
      );
    }

    // Girl 4 (Wavy): Dark navy slim jeans + Stylish Black Heeled Boots!
    if (isWavyGirl && cfg.outfit === 'default') {
      return (
        <g>
          {/* Dark slim pants */}
          <rect x="11" y="27" width="5" height="12" fill={OUTLINE} />
          <rect x="16" y="27" width="5" height="12" fill={OUTLINE} />
          <rect x="12" y="27" width="4" height="11" fill={pants} />
          <rect x="16" y="27" width="4" height="11" fill={pants} />
          <rect x="11" y="28" width="1" height="9" fill={pantsDark} />
          <rect x="20" y="28" width="1" height="9" fill={pantsDark} />

          {/* Black High-Heeled Ankle Boots */}
          <rect x="10" y="38" width="6" height="8" fill={OUTLINE} />
          <rect x="16" y="38" width="6" height="8" fill={OUTLINE} />
          {/* Shaft */}
          <rect x="11" y="38" width="4" height="4" fill="#0F172A" />
          <rect x="17" y="38" width="4" height="4" fill="#0F172A" />
          <rect x="12" y="39" width="1" height="3" fill="#334155" />
          <rect x="18" y="39" width="1" height="3" fill="#334155" />
          {/* Boot Foot Vamp */}
          <rect x="10" y="42" width="5" height="4" fill="#0F172A" />
          <rect x="17" y="42" width="5" height="4" fill="#0F172A" />
          {/* Distinct Heel Block */}
          <rect x="13" y="44" width="2" height="2" fill="#020617" />
          <rect x="17" y="44" width="2" height="2" fill="#020617" />
          {/* Front Sole */}
          <rect x="10" y="45" width="3" height="1" fill="#1E293B" />
          <rect x="19" y="45" width="3" height="1" fill="#1E293B" />
        </g>
      );
    }

    // Boy 2 (Hoodie): Charcoal straight trousers + Gray skate sneakers
    if (isHoodieBoy && cfg.outfit === 'default') {
      return (
        <g>
          {/* Charcoal pants */}
          <rect x="10" y="28" width="5" height="14" fill={OUTLINE} />
          <rect x="17" y="28" width="5" height="14" fill={OUTLINE} />
          <rect x="11" y="28" width="4" height="13" fill={pants} />
          <rect x="17" y="28" width="4" height="13" fill={pants} />
          <rect x="10" y="29" width="1" height="11" fill={pantsDark} />
          <rect x="21" y="29" width="1" height="11" fill={pantsDark} />
          <rect x="12" y="31" width="2" height="5" fill={pantsLight} />
          <rect x="18" y="31" width="2" height="5" fill={pantsLight} />

          {/* Gray retro skate sneakers */}
          <rect x="9" y="42" width="6" height="4" fill={OUTLINE} />
          <rect x="17" y="42" width="6" height="4" fill={OUTLINE} />
          <rect x="10" y="43" width="5" height="2" fill="#64748B" />
          <rect x="17" y="43" width="5" height="2" fill="#64748B" />
          {/* White laces */}
          <rect x="12" y="43" width="2" height="1" fill="#FFFFFF" />
          <rect x="18" y="43" width="2" height="1" fill="#FFFFFF" />
          {/* White toe cap & sole */}
          <rect x="9" y="44" width="2" height="2" fill="#E2E8F0" />
          <rect x="21" y="44" width="2" height="2" fill="#E2E8F0" />
          <rect x="9" y="45" width="6" height="1" fill="#FFFFFF" />
          <rect x="17" y="45" width="6" height="1" fill="#FFFFFF" />
        </g>
      );
    }

    // Default: Boy 1 (Classic): Dark Blue Denim Jeans + Blue Sneakers with White Toes!
    return (
      <g>
        {/* Denim Jeans */}
        <rect x="10" y="28" width="5" height="14" fill={OUTLINE} />
        <rect x="17" y="28" width="5" height="14" fill={OUTLINE} />
        <rect x="11" y="28" width="4" height="13" fill={pants} />
        <rect x="17" y="28" width="4" height="13" fill={pants} />
        <rect x="10" y="29" width="1" height="12" fill={pantsDark} />
        <rect x="21" y="29" width="1" height="12" fill={pantsDark} />
        {/* Denim knee & thigh highlights */}
        <rect x="12" y="31" width="2" height="6" fill={pantsLight} />
        <rect x="18" y="31" width="2" height="6" fill={pantsLight} />

        {/* Blue sneakers with white toe box & white soles */}
        <rect x="9" y="42" width="6" height="4" fill={OUTLINE} />
        <rect x="17" y="42" width="6" height="4" fill={OUTLINE} />
        <rect x="10" y="43" width="5" height="2" fill="#1D4ED8" />
        <rect x="17" y="43" width="5" height="2" fill="#1D4ED8" />
        {/* White laces */}
        <rect x="12" y="43" width="2" height="1" fill="#FFFFFF" />
        <rect x="18" y="43" width="2" height="1" fill="#FFFFFF" />
        {/* White toe caps */}
        <rect x="9" y="44" width="2" height="2" fill="#FFFFFF" />
        <rect x="21" y="44" width="2" height="2" fill="#FFFFFF" />
        {/* White rubber soles */}
        <rect x="9" y="45" width="6" height="1" fill="#FFFFFF" />
        <rect x="17" y="45" width="6" height="1" fill="#FFFFFF" />
      </g>
    );
  };

  // 4. Torso, Arms & Poses
  const renderTorsoAndArms = () => {
    // Custom Outfits
    if (cfg.outfit === 'pro_hoodie') {
      return (
        <g>
          <rect x="14" y="17" width="4" height="2" fill={skinShadow} />
          <rect x="9" y="19" width="14" height="10" fill={OUTLINE} />
          <rect x="10" y="19" width="12" height="9" fill="#0F172A" />
          <rect x="12" y="22" width="8" height="3" fill="#0284C7" />
          <rect x="14" y="23" width="4" height="1" fill="#38BDF8" />
          {/* Arms */}
          <rect x="7" y="20" width="3" height="8" fill={OUTLINE} />
          <rect x="22" y="20" width="3" height="8" fill={OUTLINE} />
          <rect x="7" y="20" width="2" height="7" fill="#0F172A" />
          <rect x="23" y="20" width="2" height="7" fill="#0F172A" />
          <rect x="7" y="27" width="2" height="2" fill={skin} />
          <rect x="23" y="27" width="2" height="2" fill={skin} />
        </g>
      );
    }

    if (cfg.outfit === 'star_jacket') {
      return (
        <g>
          <rect x="14" y="17" width="4" height="2" fill={skinShadow} />
          <rect x="9" y="19" width="14" height="10" fill={OUTLINE} />
          <rect x="10" y="19" width="12" height="9" fill="#991B1B" />
          <rect x="13" y="20" width="6" height="8" fill="#F8FAFC" />
          <rect x="15" y="22" width="2" height="2" fill="#FACC15" />
          {/* Gold sleeves */}
          <rect x="7" y="20" width="3" height="8" fill={OUTLINE} />
          <rect x="22" y="20" width="3" height="8" fill={OUTLINE} />
          <rect x="7" y="20" width="2" height="7" fill="#F59E0B" />
          <rect x="23" y="20" width="2" height="7" fill="#F59E0B" />
          <rect x="7" y="27" width="2" height="2" fill={skin} />
          <rect x="23" y="27" width="2" height="2" fill={skin} />
        </g>
      );
    }

    if (cfg.outfit === 'crafted_pixel_hoodie') {
      return (
        <g>
          <rect x="14" y="17" width="4" height="2" fill={skinShadow} />
          <rect x="9" y="19" width="14" height="10" fill={OUTLINE} />
          <rect x="10" y="19" width="12" height="9" fill="#7C3AED" />
          {/* Golden craft emblem & cream drawcords */}
          <rect x="13" y="21" width="1" height="4" fill="#FEF08A" />
          <rect x="18" y="21" width="1" height="4" fill="#FEF08A" />
          <rect x="15" y="22" width="2" height="2" fill="#FACC15" />
          {/* Arms in pocket */}
          <rect x="7" y="20" width="4" height="8" fill={OUTLINE} />
          <rect x="21" y="20" width="4" height="8" fill={OUTLINE} />
          <rect x="7" y="20" width="3" height="7" fill="#6D28D9" />
          <rect x="22" y="20" width="3" height="7" fill="#6D28D9" />
        </g>
      );
    }

    // -------------------------------------------------------------
    // PRESET 2: Boy Hoodie (Hands in Kangaroo Pouch Pose!)
    // -------------------------------------------------------------
    if (isHoodieBoy) {
      return (
        <g>
          {/* Neck with shadow */}
          <rect x="14" y="17" width="4" height="2" fill={skinShadow} />

          {/* Green Hoodie Torso */}
          <rect x="9" y="19" width="14" height="10" fill={OUTLINE} />
          <rect x="10" y="19" width="12" height="9" fill={shirt} />
          <rect x="10" y="19" width="1" height="9" fill={shirtDark} />
          <rect x="21" y="19" width="1" height="9" fill={shirtDark} />
          <rect x="12" y="20" width="8" height="2" fill={shirtLight} />

          {/* Hood Cowl Collar */}
          <rect x="11" y="18" width="10" height="2" fill={OUTLINE} />
          <rect x="12" y="18" width="8" height="2" fill={shirtDark} />

          {/* White Drawstring Cords */}
          <rect x="13" y="20" width="1" height="5" fill="#FFFFFF" />
          <rect x="18" y="20" width="1" height="5" fill="#FFFFFF" />
          <rect x="13" y="25" width="1" height="1" fill="#CBD5E1" />
          <rect x="18" y="25" width="1" height="1" fill="#CBD5E1" />

          {/* Kangaroo Pouch Pocket in Front */}
          <rect x="11" y="24" width="10" height="4" fill={shirtDeep} />
          <rect x="12" y="24" width="8" height="3" fill={shirtDark} />
          {/* Ribbed bottom waistband */}
          <rect x="10" y="27" width="12" height="2" fill={shirtDeep} />

          {/* Bent Arms angled inward into the pocket (hands inside!) */}
          <rect x="6" y="20" width="4" height="7" fill={OUTLINE} />
          <rect x="22" y="20" width="4" height="7" fill={OUTLINE} />
          {/* Left arm sleeve going into pouch */}
          <rect x="7" y="20" width="3" height="3" fill={shirt} />
          <rect x="6" y="22" width="3" height="3" fill={shirtDark} />
          <rect x="8" y="24" width="3" height="3" fill={shirt} />
          {/* Right arm sleeve going into pouch */}
          <rect x="22" y="20" width="3" height="3" fill={shirt} />
          <rect x="23" y="22" width="3" height="3" fill={shirtDark} />
          <rect x="21" y="24" width="3" height="3" fill={shirt} />
        </g>
      );
    }

    // -------------------------------------------------------------
    // PRESET 3: Girl Ponytail (Coral Turtleneck Sweater & Flared Pleated Skirt!)
    // -------------------------------------------------------------
    if (isPonytailGirl) {
      return (
        <g>
          {/* Turtleneck Ribbed Mock Collar */}
          <rect x="13" y="17" width="6" height="3" fill={OUTLINE} />
          <rect x="14" y="17" width="4" height="3" fill={shirtDark} />
          <rect x="14" y="18" width="4" height="1" fill={shirtLight} />

          {/* Knitted Sweater Body */}
          <rect x="9" y="19" width="14" height="9" fill={OUTLINE} />
          <rect x="10" y="19" width="12" height="8" fill={shirt} />
          <rect x="10" y="19" width="1" height="8" fill={shirtDark} />
          <rect x="21" y="19" width="1" height="8" fill={shirtDark} />
          <rect x="12" y="20" width="8" height="2" fill={shirtLight} />
          {/* Ribbed Sweater Waistband */}
          <rect x="10" y="26" width="12" height="2" fill={shirtDeep} />

          {/* Puffy Knitted Sleeves & Cute Peach Hands */}
          {/* Left sleeve (puffy) */}
          <rect x="6" y="20" width="4" height="8" fill={OUTLINE} />
          <rect x="7" y="20" width="3" height="7" fill={shirt} />
          <rect x="6" y="22" width="1" height="4" fill={shirtDark} />
          <rect x="8" y="21" width="1" height="5" fill={shirtLight} />
          {/* Left ribbed wrist cuff */}
          <rect x="7" y="26" width="3" height="1" fill={shirtDeep} />
          {/* Left Hand */}
          <rect x="7" y="27" width="3" height="2" fill={OUTLINE} />
          <rect x="7" y="27" width="2" height="2" fill={skin} />

          {/* Right sleeve (puffy) */}
          <rect x="22" y="20" width="4" height="8" fill={OUTLINE} />
          <rect x="22" y="20" width="3" height="7" fill={shirt} />
          <rect x="25" y="22" width="1" height="4" fill={shirtDark} />
          <rect x="23" y="21" width="1" height="5" fill={shirtLight} />
          {/* Right ribbed wrist cuff */}
          <rect x="22" y="26" width="3" height="1" fill={shirtDeep} />
          {/* Right Hand */}
          <rect x="22" y="27" width="3" height="2" fill={OUTLINE} />
          <rect x="23" y="27" width="2" height="2" fill={skin} />

          {/* Flared Pleated Skirt in Matching Coral Pink! */}
          <rect x="8" y="27" width="16" height="7" fill={OUTLINE} />
          <rect x="9" y="28" width="14" height="6" fill={pants} />
          {/* Pleat vertical shadow grooves */}
          <rect x="11" y="28" width="1" height="6" fill={pantsDeep} />
          <rect x="14" y="28" width="1" height="6" fill={pantsDeep} />
          <rect x="17" y="28" width="1" height="6" fill={pantsDeep} />
          <rect x="20" y="28" width="1" height="6" fill={pantsDeep} />
          {/* Pleat face highlights */}
          <rect x="12" y="28" width="2" height="5" fill={pantsLight} />
          <rect x="18" y="28" width="2" height="5" fill={pantsLight} />
        </g>
      );
    }

    // -------------------------------------------------------------
    // PRESET 4: Girl Wavy (Purple Blazer + White Top + Hand on Hip Pose!)
    // -------------------------------------------------------------
    if (isWavyGirl) {
      return (
        <g>
          {/* Neck with shadow */}
          <rect x="14" y="17" width="4" height="3" fill={skinShadow} />

          {/* White inner scoop-neck camisole */}
          <rect x="13" y="19" width="6" height="8" fill="#F8FAFC" />
          <rect x="14" y="20" width="4" height="6" fill="#FFFFFF" />
          <rect x="13" y="25" width="6" height="1" fill="#E2E8F0" />

          {/* Purple tailored jacket (open in front) */}
          <rect x="9" y="19" width="14" height="8" fill={OUTLINE} />
          {/* Left jacket panel */}
          <rect x="10" y="19" width="4" height="7" fill={shirt} />
          <rect x="10" y="19" width="1" height="7" fill={shirtDark} />
          <rect x="13" y="20" width="1" height="5" fill={shirtDeep} />
          {/* Right jacket panel */}
          <rect x="18" y="19" width="4" height="7" fill={shirt} />
          <rect x="21" y="19" width="1" height="7" fill={shirtDark} />
          <rect x="18" y="20" width="1" height="5" fill={shirtDeep} />

          {/* SIGNATURE POSE: Right Hand on Hip (viewer's left)! */}
          {/* Bent elbow sticking out in sharp triangle */}
          <rect x="4" y="20" width="6" height="6" fill={OUTLINE} />
          <rect x="5" y="20" width="4" height="2" fill={shirt} />
          <rect x="4" y="21" width="3" height="4" fill={shirtLight} />
          <rect x="7" y="23" width="3" height="3" fill={shirtDark} />
          {/* Hand resting firmly on hip/waist */}
          <rect x="9" y="24" width="3" height="3" fill={OUTLINE} />
          <rect x="9" y="24" width="2" height="2" fill={skin} />

          {/* Left Arm: hanging gracefully at side (viewer's right) */}
          <rect x="22" y="20" width="3" height="8" fill={OUTLINE} />
          <rect x="22" y="20" width="2" height="7" fill={shirt} />
          <rect x="23" y="21" width="1" height="5" fill={shirtLight} />
          {/* Left Hand */}
          <rect x="22" y="27" width="2" height="2" fill={skin} />
        </g>
      );
    }

    // -------------------------------------------------------------
    // PRESET 1: Boy Classic (Blue T-shirt, Relaxed Standing)
    // -------------------------------------------------------------
    return (
      <g>
        {/* Neck */}
        <rect x="14" y="17" width="4" height="2" fill={skinShadow} />

        {/* Royal Blue Crew-Neck T-shirt */}
        <rect x="9" y="19" width="14" height="10" fill={OUTLINE} />
        <rect x="10" y="19" width="12" height="9" fill={shirt} />
        {/* Crew neckline band */}
        <rect x="13" y="18" width="6" height="2" fill={OUTLINE} />
        <rect x="14" y="19" width="4" height="1" fill={shirtDark} />
        {/* Shading & Highlights on T-shirt */}
        <rect x="10" y="20" width="1" height="8" fill={shirtDark} />
        <rect x="21" y="20" width="1" height="8" fill={shirtDark} />
        <rect x="12" y="21" width="8" height="2" fill={shirtLight} />

        {/* Relaxed Arms at sides with peach hands */}
        {/* Left Arm */}
        <rect x="6" y="20" width="4" height="8" fill={OUTLINE} />
        <rect x="7" y="20" width="3" height="4" fill={shirt} />
        <rect x="6" y="21" width="1" height="3" fill={shirtDark} />
        <rect x="7" y="24" width="2" height="4" fill={skin} />
        <rect x="8" y="26" width="1" height="2" fill={skinShadow} />

        {/* Right Arm */}
        <rect x="22" y="20" width="4" height="8" fill={OUTLINE} />
        <rect x="22" y="20" width="3" height="4" fill={shirt} />
        <rect x="24" y="21" width="1" height="3" fill={shirtDark} />
        <rect x="23" y="24" width="2" height="4" fill={skin} />
        <rect x="23" y="26" width="1" height="2" fill={skinShadow} />
      </g>
    );
  };

  // 5. Head, Face & Front Hair
  const renderHeadAndFace = () => {
    return (
      <g>
        {/* Head outline & skin base */}
        <rect x="9" y="7" width="14" height="11" fill={OUTLINE} />
        <rect x="10" y="8" width="12" height="9" fill={skin} />
        <rect x="11" y="16" width="10" height="2" fill={skin} />

        {/* Ears */}
        <rect x="8" y="10" width="2" height="4" fill={OUTLINE} />
        <rect x="22" y="10" width="2" height="4" fill={OUTLINE} />
        <rect x="9" y="11" width="1" height="2" fill={skin} />
        <rect x="22" y="11" width="1" height="2" fill={skin} />
        <rect x="9" y="12" width="1" height="1" fill={skinShadow} />
        <rect x="22" y="12" width="1" height="1" fill={skinShadow} />

        {/* Cheek Blush */}
        <rect x="10" y="13" width="2" height="1" fill={blush} opacity="0.65" />
        <rect x="20" y="13" width="2" height="1" fill={blush} opacity="0.65" />

        {/* Eyebrows */}
        <rect x="11" y="10" width="3" height="1" fill={hairDeep} />
        <rect x="18" y="10" width="3" height="1" fill={hairDeep} />

        {/* Big Expressive Anime Eyes with Specular Sparkles */}
        {/* Left eye */}
        <rect x="11" y="11" width="3" height="3" fill={OUTLINE} />
        <rect x="12" y="11" width="2" height="3" fill={isHoodieBoy ? '#27272A' : '#451A03'} />
        <rect x="12" y="13" width="2" height="1" fill={isHoodieBoy ? '#52525B' : '#78350F'} />
        <rect x="11" y="11" width="1" height="1" fill="#FFFFFF" />

        {/* Right eye */}
        <rect x="18" y="11" width="3" height="3" fill={OUTLINE} />
        <rect x="18" y="11" width="2" height="3" fill={isHoodieBoy ? '#27272A' : '#451A03'} />
        <rect x="18" y="13" width="2" height="1" fill={isHoodieBoy ? '#52525B' : '#78350F'} />
        <rect x="18" y="11" width="1" height="1" fill="#FFFFFF" />

        {/* Cute Nose Dot */}
        <rect x="15" y="13" width="1" height="1" fill={skinShadow} />

        {/* ----------------- MOUTHS ----------------- */}
        {isClassicBoy ? (
          // Boy 1: Wide open cheerful smile with white teeth!
          <g>
            <rect x="14" y="14" width="4" height="3" fill={OUTLINE} />
            <rect x="14" y="14" width="4" height="1" fill="#FFFFFF" />
            <rect x="14" y="15" width="4" height="2" fill="#991B1B" />
          </g>
        ) : isHoodieBoy ? (
          // Boy 2: Cool side smirk!
          <g>
            <rect x="14" y="15" width="4" height="1" fill={OUTLINE} />
            <rect x="17" y="14" width="1" height="1" fill={OUTLINE} />
          </g>
        ) : isPonytailGirl ? (
          // Girl 3: Sweet bright smile
          <g>
            <rect x="14" y="15" width="4" height="1" fill="#E11D48" />
            <rect x="15" y="15" width="2" height="1" fill="#FB7185" />
          </g>
        ) : (
          // Girl 4: Confident berry smile
          <g>
            <rect x="14" y="15" width="4" height="1" fill="#9F1239" />
            <rect x="15" y="15" width="2" height="1" fill="#BE123C" />
          </g>
        )}

        {/* ----------------- FRONT HAIRSTYLES ----------------- */}
        {isClassicBoy && (
          // Boy 1: Layered textured brown hair with parted bangs
          <g>
            {/* Top crown */}
            <rect x="8" y="4" width="16" height="5" fill={OUTLINE} />
            <rect x="9" y="5" width="14" height="4" fill={hair} />
            <rect x="10" y="4" width="3" height="2" fill={hair} />
            <rect x="14" y="3" width="4" height="2" fill={hair} />
            <rect x="19" y="4" width="3" height="2" fill={hair} />
            {/* Highlight band */}
            <rect x="11" y="6" width="9" height="1" fill={hairLight} />
            {/* Sideburns */}
            <rect x="8" y="8" width="2" height="5" fill={hairDark} />
            <rect x="22" y="8" width="2" height="5" fill={hairDark} />
            {/* Layered Bangs parted to left */}
            <rect x="10" y="8" width="4" height="2" fill={hair} />
            <rect x="14" y="7" width="2" height="2" fill={hairDark} />
            <rect x="16" y="8" width="5" height="2" fill={hair} />
          </g>
        )}

        {isHoodieBoy && (
          // Boy 2: Wild Messy Spiky Black Anime Hair!
          <g>
            {/* Crown base */}
            <rect x="7" y="3" width="18" height="6" fill={OUTLINE} />
            <rect x="8" y="4" width="16" height="5" fill={hair} />
            {/* Multiple Top Spikes */}
            <rect x="9" y="1" width="3" height="3" fill={OUTLINE} />
            <rect x="10" y="2" width="2" height="2" fill={hair} />
            <rect x="13" y="0" width="4" height="4" fill={OUTLINE} />
            <rect x="14" y="1" width="3" height="3" fill={hair} />
            <rect x="18" y="1" width="4" height="3" fill={OUTLINE} />
            <rect x="19" y="2" width="2" height="2" fill={hair} />
            {/* Left & Right wild side spikes */}
            <rect x="5" y="4" width="3" height="5" fill={OUTLINE} />
            <rect x="6" y="5" width="2" height="4" fill={hairDark} />
            <rect x="5" y="8" width="3" height="4" fill={OUTLINE} />
            <rect x="24" y="4" width="3" height="5" fill={OUTLINE} />
            <rect x="24" y="5" width="2" height="4" fill={hairDark} />
            <rect x="24" y="8" width="3" height="4" fill={OUTLINE} />
            {/* Front sharp jagged bangs falling between eyes */}
            <rect x="9" y="8" width="3" height="2" fill={hair} />
            <rect x="13" y="8" width="3" height="3" fill={hair} />
            <rect x="14" y="11" width="1" height="1" fill={hairDeep} />
            <rect x="17" y="8" width="4" height="2" fill={hair} />
            {/* Subtle slate hair highlights */}
            <rect x="11" y="5" width="2" height="1" fill="#3F3F46" />
            <rect x="16" y="4" width="3" height="1" fill="#52525B" />
          </g>
        )}

        {isPonytailGirl && (
          // Girl 3: Straight neat bangs & front crown
          <g>
            {/* Crown */}
            <rect x="8" y="4" width="16" height="5" fill={OUTLINE} />
            <rect x="9" y="5" width="14" height="4" fill={hair} />
            <rect x="11" y="5" width="9" height="1" fill={hairLight} />
            {/* Side framing locks */}
            <rect x="8" y="8" width="2" height="6" fill={hairDark} />
            <rect x="22" y="8" width="2" height="6" fill={hairDark} />
            {/* Straight neat bangs with little trim cuts */}
            <rect x="9" y="8" width="14" height="2" fill={hair} />
            <rect x="12" y="9" width="1" height="1" fill={skin} />
            <rect x="17" y="9" width="1" height="1" fill={skin} />
          </g>
        )}

        {isWavyGirl && (
          // Girl 4: Center-parted voluminous front wavy bangs
          <g>
            {/* Crown */}
            <rect x="8" y="4" width="16" height="5" fill={OUTLINE} />
            <rect x="9" y="5" width="14" height="4" fill={hair} />
            {/* Center parting showing forehead */}
            <rect x="15" y="6" width="2" height="2" fill={skin} />
            {/* Left curved wave lock */}
            <rect x="9" y="8" width="5" height="3" fill={hair} />
            <rect x="8" y="9" width="2" height="5" fill={hairLight} />
            {/* Right curved wave lock */}
            <rect x="18" y="8" width="5" height="3" fill={hair} />
            <rect x="22" y="9" width="2" height="5" fill={hairLight} />
          </g>
        )}
      </g>
    );
  };

  // 6. Accessories: Glasses
  const renderGlasses = () => {
    switch (cfg.glasses) {
      case 'nerd_glasses':
        return (
          <g>
            <rect x="10" y="10" width="5" height="4" fill={OUTLINE} />
            <rect x="17" y="10" width="5" height="4" fill={OUTLINE} />
            <rect x="11" y="11" width="3" height="2" fill="#BAE6FD" opacity="0.6" />
            <rect x="18" y="11" width="3" height="2" fill="#BAE6FD" opacity="0.6" />
            <rect x="15" y="11" width="2" height="1" fill={OUTLINE} />
          </g>
        );
      case 'cool_shades':
        return (
          <g>
            <rect x="10" y="10" width="5" height="4" fill="#09090B" />
            <rect x="17" y="10" width="5" height="4" fill="#09090B" />
            <rect x="15" y="10" width="2" height="1" fill="#09090B" />
            {/* White diagonal reflection line */}
            <rect x="11" y="11" width="1" height="1" fill="#FFFFFF" />
            <rect x="18" y="11" width="1" height="1" fill="#FFFFFF" />
          </g>
        );
      case 'cyber_visor':
        return (
          <g>
            <rect x="9" y="10" width="14" height="4" fill="#0F172A" />
            <rect x="10" y="11" width="12" height="2" fill="#22D3EE" />
            <rect x="18" y="11" width="3" height="2" fill="#F472B6" />
          </g>
        );
      case 'crafted_cyber_shades':
        return (
          <g>
            {/* Iron metallic frame + cyber blue glowing lenses */}
            <rect x="9" y="10" width="6" height="4" fill="#94A3B8" />
            <rect x="17" y="10" width="6" height="4" fill="#94A3B8" />
            <rect x="10" y="11" width="4" height="2" fill="#0EA5E9" />
            <rect x="18" y="11" width="4" height="2" fill="#0EA5E9" />
            <rect x="11" y="11" width="1" height="1" fill="#FEF08A" />
            <rect x="19" y="11" width="1" height="1" fill="#FEF08A" />
            <rect x="15" y="10" width="2" height="1" fill="#475569" />
          </g>
        );
      default:
        return null;
    }
  };

  // 7. Accessories: Hat
  const renderHat = () => {
    switch (cfg.hat) {
      case 'cap':
        return (
          <g>
            <rect x="8" y="2" width="16" height="5" fill={OUTLINE} />
            <rect x="9" y="3" width="14" height="4" fill="#DC2626" />
            <rect x="14" y="3" width="4" height="2" fill="#FFFFFF" />
            {/* Visor Brim */}
            <rect x="6" y="6" width="18" height="2" fill="#991B1B" />
          </g>
        );
      case 'headphones':
        return (
          <g>
            {/* Overhead headband */}
            <rect x="8" y="2" width="16" height="2" fill="#0F172A" />
            <rect x="11" y="2" width="10" height="1" fill="#38BDF8" />
            {/* Cyan Earcups */}
            <rect x="6" y="9" width="3" height="6" fill={OUTLINE} />
            <rect x="23" y="9" width="3" height="6" fill={OUTLINE} />
            <rect x="7" y="10" width="2" height="4" fill="#38BDF8" />
            <rect x="23" y="10" width="2" height="4" fill="#38BDF8" />
          </g>
        );
      case 'crown':
        return (
          <g>
            <rect x="9" y="1" width="14" height="5" fill={OUTLINE} />
            <rect x="9" y="1" width="2" height="4" fill="#FACC15" />
            <rect x="15" y="0" width="2" height="5" fill="#FDE047" />
            <rect x="21" y="1" width="2" height="4" fill="#FACC15" />
            <rect x="10" y="3" width="12" height="3" fill="#EAB308" />
            {/* Ruby & Sapphire jewels */}
            <rect x="12" y="4" width="2" height="1" fill="#38BDF8" />
            <rect x="15" y="4" width="2" height="1" fill="#EF4444" />
            <rect x="18" y="4" width="2" height="1" fill="#38BDF8" />
          </g>
        );
      case 'explorer_hat':
        return (
          <g>
            {/* Safari Wide-Brim Explorer Hat */}
            <rect x="4" y="5" width="24" height="2" fill={OUTLINE} />
            <rect x="5" y="4" width="22" height="2" fill="#B45309" />
            <rect x="10" y="1" width="12" height="4" fill={OUTLINE} />
            <rect x="11" y="2" width="10" height="3" fill="#D97706" />
            <rect x="10" y="4" width="12" height="1" fill="#78350F" />
            <rect x="15" y="3" width="2" height="2" fill="#FDE047" />
          </g>
        );
      case 'scholar_crown':
        return (
          <g>
            {/* Royal Scholar Cap + Golden Crown Crest */}
            <rect x="6" y="3" width="20" height="2" fill={OUTLINE} />
            <rect x="8" y="2" width="16" height="3" fill="#4C1D95" />
            <rect x="10" y="0" width="12" height="3" fill="#FACC15" />
            <rect x="13" y="0" width="6" height="2" fill="#FEF08A" />
            <rect x="14" y="2" width="4" height="1" fill="#A855F7" />
            {/* Golden dangling tassel */}
            <rect x="24" y="3" width="2" height="5" fill="#F59E0B" />
            <rect x="24" y="6" width="2" height="2" fill="#FDE047" />
          </g>
        );
      default:
        return null;
    }
  };

  // 8. Accessories: Hand Item
  const renderHandItem = () => {
    if (cfg.handItem === 'golden_camera') {
      return (
        <g>
          {/* Golden Pixel Camera held on character's right */}
          <rect x="22" y="24" width="8" height="6" fill={OUTLINE} />
          <rect x="23" y="23" width="3" height="2" fill="#FACC15" />
          <rect x="23" y="25" width="6" height="4" fill="#F59E0B" />
          <rect x="24" y="25" width="4" height="3" fill="#FDE047" />
          {/* Camera Lens */}
          <rect x="25" y="25" width="3" height="3" fill="#0F172A" />
          <rect x="26" y="26" width="1" height="1" fill="#38BDF8" />
          {/* Flash sparkle dot */}
          <rect x="28" y="24" width="1" height="1" fill="#FFFFFF" />
        </g>
      );
    }
    return null;
  };

  // 9. Enchanted Aura: Shimmering Purple & Golden Sparkles
  const renderEnchantedAura = () => {
    if (!isEnchanted) return null;
    return (
      <g>
        {/* Soft magical aura glow */}
        <rect x="3" y="3" width="26" height="42" fill="#A855F7" opacity="0.12" rx="3" />
        {/* Shimmering Purple and Golden Pixel Sparkles */}
        <rect x="2" y="4" width="2" height="2" fill="#A855F7" opacity="0.9" />
        <rect x="3" y="4" width="1" height="1" fill="#FDE047" />
        <rect x="27" y="6" width="2" height="2" fill="#FACC15" opacity="0.95" />
        <rect x="28" y="7" width="1" height="1" fill="#C084FC" />
        <rect x="1" y="22" width="2" height="2" fill="#C084FC" opacity="0.9" />
        <rect x="2" y="23" width="1" height="1" fill="#FEF08A" />
        <rect x="28" y="26" width="2" height="2" fill="#A855F7" opacity="0.9" />
        <rect x="28" y="27" width="1" height="1" fill="#FDE047" />
        <rect x="4" y="42" width="2" height="2" fill="#FACC15" />
        <rect x="25" y="43" width="2" height="2" fill="#C084FC" />
        {/* Border aura frame */}
        <rect x="0" y="0" width="32" height="1" fill="#A855F7" opacity="0.6" />
        <rect x="0" y="47" width="32" height="1" fill="#FACC15" opacity="0.7" />
        <rect x="0" y="0" width="1" height="48" fill="#C084FC" opacity="0.5" />
        <rect x="31" y="0" width="1" height="48" fill="#FACC15" opacity="0.5" />
      </g>
    );
  };

  const svgElement = (
    <svg
      viewBox="0 0 32 48"
      width={size}
      height={size}
      preserveAspectRatio="xMidYMid meet"
      shapeRendering="crispEdges"
      className={`select-none shrink-0 ${className}`}
      aria-label="صورة الشخصية البكسل"
    >
      {renderBackground()}
      {isEnchanted && (
        <rect x="2" y="2" width="28" height="44" fill="#A855F7" opacity="0.14" />
      )}
      {renderBackHair()}
      {renderLegsAndFeet()}
      {renderTorsoAndArms()}
      {renderHeadAndFace()}
      {renderGlasses()}
      {renderHat()}
      {renderHandItem()}
      {renderEnchantedAura()}
    </svg>
  );

  if (!isEnchanted) {
    return svgElement;
  }

  return (
    <div
      className={`relative inline-flex shrink-0 rounded-xl p-[2px] bg-gradient-to-tr from-purple-600 via-fuchsia-400 to-amber-400 shadow-[0_0_16px_rgba(168,85,247,0.65),0_0_8px_rgba(250,204,21,0.5)] ${className}`}
      title="شخصية مطورة بسحر 2x ✨"
    >
      <div className="rounded-[10px] overflow-hidden leading-none bg-slate-900/10">
        {svgElement}
      </div>
    </div>
  );
};
