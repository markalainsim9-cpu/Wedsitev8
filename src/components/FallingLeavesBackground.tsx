import React, { useEffect, useRef } from 'react';
import { LeavesStyle, LeavesDensity, LeavesWindDirection, LeavesScale, AtmosphereLighting } from '../types';

export interface FallingLeavesBackgroundProps {
  enabled?: boolean;
  style?: LeavesStyle;
  density?: LeavesDensity;
  theme?: 'dusty-blue' | 'burgundy' | 'emerald' | 'navy' | 'champagne';
  windDirection?: LeavesWindDirection;
  scale?: LeavesScale;
  atmosphereLighting?: AtmosphereLighting;
  burstTrigger?: number;
}

type LeafType =
  | 'pointed'
  | 'eucalyptus'
  | 'petal'
  | 'willow'
  | 'sakura'
  | 'sakura_bud'
  | 'celestial_star'
  | 'stardust_mote'
  | 'candle_flame'
  | 'ember_mote'
  | 'lavender_floret'
  | 'wildflower_petal'
  | 'maple'
  | 'vineyard_leaf'
  | 'snowflake'
  | 'ice_crystal';

interface LeafParticle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  angle: number;
  angularSpeed: number;
  flip: number;
  flipSpeed: number;
  swayPhase: number;
  swaySpeed: number;
  swayAmp: number;
  opacity: number;
  baseOpacity: number;
  twinklePhase?: number;
  twinkleSpeed?: number;
  type: LeafType;
  primaryColor: string;
  secondaryColor: string;
  veinColor: string;
  isBuoyant?: boolean;
}

// Sophisticated Romantic Wedding Palettes
const PALETTES = {
  sage: {
    primary: 'rgba(128, 153, 133, ',
    secondary: 'rgba(152, 175, 156, ',
    vein: 'rgba(102, 128, 107, '
  },
  eucalyptus: {
    primary: 'rgba(110, 140, 130, ',
    secondary: 'rgba(135, 163, 154, ',
    vein: 'rgba(88, 118, 108, '
  },
  dustyBlue: {
    primary: 'rgba(118, 144, 166, ',
    secondary: 'rgba(148, 174, 196, ',
    vein: 'rgba(92, 118, 140, '
  },
  champagneGold: {
    primary: 'rgba(202, 178, 138, ',
    secondary: 'rgba(224, 204, 168, ',
    vein: 'rgba(172, 148, 108, '
  },
  blushPetal: {
    primary: 'rgba(224, 194, 190, ',
    secondary: 'rgba(240, 216, 212, ',
    vein: 'rgba(200, 168, 164, '
  },
  ivoryPetal: {
    primary: 'rgba(238, 230, 220, ',
    secondary: 'rgba(248, 242, 234, ',
    vein: 'rgba(215, 205, 193, '
  },
  burgundyPetal: {
    primary: 'rgba(138, 35, 58, ',
    secondary: 'rgba(170, 50, 78, ',
    vein: 'rgba(95, 18, 36, '
  },
  roseGold: {
    primary: 'rgba(212, 163, 115, ',
    secondary: 'rgba(230, 188, 146, ',
    vein: 'rgba(180, 132, 88, '
  },
  emeraldLeaf: {
    primary: 'rgba(42, 95, 70, ',
    secondary: 'rgba(65, 128, 98, ',
    vein: 'rgba(28, 70, 50, '
  },
  celestialGold: {
    primary: 'rgba(223, 178, 81, ',
    secondary: 'rgba(245, 208, 126, ',
    vein: 'rgba(185, 145, 55, '
  },
  navyStarlight: {
    primary: 'rgba(65, 88, 135, ',
    secondary: 'rgba(95, 120, 170, ',
    vein: 'rgba(38, 55, 90, '
  },
  // NEW PALETTES
  sakuraPink: {
    primary: 'rgba(244, 185, 200, ',
    secondary: 'rgba(255, 220, 230, ',
    vein: 'rgba(225, 140, 165, '
  },
  sakuraDeep: {
    primary: 'rgba(225, 120, 150, ',
    secondary: 'rgba(248, 180, 200, ',
    vein: 'rgba(185, 70, 105, '
  },
  candleAmber: {
    primary: 'rgba(251, 191, 36, ',
    secondary: 'rgba(254, 240, 138, ',
    vein: 'rgba(217, 119, 6, '
  },
  emberGlow: {
    primary: 'rgba(249, 115, 22, ',
    secondary: 'rgba(251, 191, 36, ',
    vein: 'rgba(194, 65, 12, '
  },
  lavenderPurp: {
    primary: 'rgba(167, 139, 219, ',
    secondary: 'rgba(206, 189, 240, ',
    vein: 'rgba(126, 95, 185, '
  },
  wildflowerYellow: {
    primary: 'rgba(250, 204, 21, ',
    secondary: 'rgba(254, 240, 138, ',
    vein: 'rgba(202, 138, 4, '
  },
  autumnCrimson: {
    primary: 'rgba(185, 45, 30, ',
    secondary: 'rgba(225, 85, 50, ',
    vein: 'rgba(130, 20, 15, '
  },
  autumnGold: {
    primary: 'rgba(217, 145, 30, ',
    secondary: 'rgba(245, 185, 70, ',
    vein: 'rgba(160, 95, 15, '
  },
  autumnSienna: {
    primary: 'rgba(150, 65, 35, ',
    secondary: 'rgba(190, 95, 55, ',
    vein: 'rgba(105, 35, 15, '
  },
  silverFrost: {
    primary: 'rgba(220, 235, 245, ',
    secondary: 'rgba(245, 250, 255, ',
    vein: 'rgba(180, 205, 225, '
  },
  iceCyan: {
    primary: 'rgba(186, 230, 253, ',
    secondary: 'rgba(224, 242, 254, ',
    vein: 'rgba(125, 211, 252, '
  },
  diamondSpark: {
    primary: 'rgba(255, 255, 255, ',
    secondary: 'rgba(240, 245, 255, ',
    vein: 'rgba(200, 220, 245, '
  }
};

export const FallingLeavesBackground: React.FC<FallingLeavesBackgroundProps> = ({
  enabled = true,
  style = 'mixed',
  density = 'medium',
  theme = 'dusty-blue',
  windDirection = 'calm',
  scale = 'natural',
  burstTrigger = 0
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const breezeRef = useRef<{ x: number; y: number; decay: number }>({ x: 0, y: 0, decay: 0.95 });
  const leavesRef = useRef<LeafParticle[]>([]);

  useEffect(() => {
    if (!enabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const updateSize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.resetTransform?.();
      ctx.scale(dpr, dpr);
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    // Breeze interaction on mouse / touch / scroll
    let lastX = 0;
    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
      const deltaX = clientX - lastX;
      lastX = clientX;
      breezeRef.current.x += Math.max(Math.min(deltaX * 0.04, 1.4), -1.4);
    };

    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY;
      lastScrollY = currentScrollY;
      breezeRef.current.x += (Math.random() - 0.5) * 0.6;
      breezeRef.current.y = Math.min(breezeRef.current.y + delta * 0.02, 1.8);
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Base particle count based on density
    const countMap: Record<LeavesDensity, number> = {
      whisper: 12,
      gentle: 20,
      medium: 32,
      lush: 50,
      blizzard: 72
    };
    const baseCount = countMap[density] || 32;
    const count = width < 640 ? Math.round(baseCount * 0.65) : baseCount;

    // Scale multiplier
    const sizeMultiplier = scale === 'delicate' ? 0.72 : scale === 'statement' ? 1.38 : 1.0;

    // Factory helper to generate a particle based on selected style & theme
    const createParticle = (initY?: number, forceBurst = false): LeafParticle => {
      let pal = PALETTES.sage;
      const rand = Math.random();
      let type: LeafType = 'pointed';
      let isBuoyant = false;

      switch (style) {
        case 'cherry-blossom':
          type = rand < 0.75 ? 'sakura' : 'sakura_bud';
          pal = rand < 0.5 ? PALETTES.sakuraPink : rand < 0.85 ? PALETTES.sakuraDeep : PALETTES.ivoryPetal;
          break;

        case 'celestial-stardust':
          type = rand < 0.6 ? 'celestial_star' : 'stardust_mote';
          if (theme === 'navy') {
            pal = rand < 0.55 ? PALETTES.celestialGold : rand < 0.85 ? PALETTES.diamondSpark : PALETTES.navyStarlight;
          } else if (theme === 'champagne') {
            pal = rand < 0.6 ? PALETTES.champagneGold : rand < 0.85 ? PALETTES.celestialGold : PALETTES.diamondSpark;
          } else {
            pal = rand < 0.5 ? PALETTES.celestialGold : rand < 0.8 ? PALETTES.diamondSpark : PALETTES.champagneGold;
          }
          break;

        case 'candlelit-lantern':
          type = rand < 0.45 ? 'candle_flame' : 'ember_mote';
          pal = rand < 0.6 ? PALETTES.candleAmber : rand < 0.85 ? PALETTES.emberGlow : PALETTES.champagneGold;
          isBuoyant = true;
          break;

        case 'lavender-wildflower':
          if (rand < 0.4) {
            type = 'lavender_floret';
            pal = PALETTES.lavenderPurp;
          } else if (rand < 0.7) {
            type = 'wildflower_petal';
            pal = Math.random() > 0.5 ? PALETTES.wildflowerYellow : PALETTES.ivoryPetal;
          } else {
            type = 'willow';
            pal = PALETTES.sage;
          }
          break;

        case 'autumn-maple':
          if (rand < 0.55) {
            type = 'maple';
            pal = rand < 0.35 ? PALETTES.autumnCrimson : rand < 0.7 ? PALETTES.autumnGold : PALETTES.autumnSienna;
          } else if (rand < 0.85) {
            type = 'vineyard_leaf';
            pal = rand < 0.5 ? PALETTES.burgundyPetal : PALETTES.autumnGold;
          } else {
            type = 'pointed';
            pal = PALETTES.autumnSienna;
          }
          break;

        case 'snow-crystal':
          type = rand < 0.65 ? 'snowflake' : 'ice_crystal';
          pal = rand < 0.45 ? PALETTES.silverFrost : rand < 0.8 ? PALETTES.iceCyan : PALETTES.diamondSpark;
          break;

        case 'petals':
          type = 'petal';
          if (theme === 'burgundy') {
            pal = rand < 0.5 ? PALETTES.burgundyPetal : rand < 0.8 ? PALETTES.blushPetal : PALETTES.roseGold;
          } else if (theme === 'emerald') {
            pal = rand < 0.6 ? PALETTES.ivoryPetal : PALETTES.sage;
          } else if (theme === 'navy') {
            pal = rand < 0.5 ? PALETTES.ivoryPetal : rand < 0.8 ? PALETTES.celestialGold : PALETTES.navyStarlight;
          } else if (theme === 'champagne') {
            pal = rand < 0.5 ? PALETTES.ivoryPetal : rand < 0.8 ? PALETTES.roseGold : PALETTES.champagneGold;
          } else {
            pal = rand > 0.4 ? PALETTES.blushPetal : PALETTES.ivoryPetal;
          }
          break;

        case 'botanical':
          type = rand < 0.45 ? 'pointed' : rand < 0.8 ? 'eucalyptus' : 'willow';
          if (theme === 'emerald') {
            pal = rand < 0.5 ? PALETTES.emeraldLeaf : rand < 0.8 ? PALETTES.eucalyptus : PALETTES.sage;
          } else if (theme === 'burgundy') {
            pal = rand < 0.5 ? PALETTES.sage : rand < 0.75 ? PALETTES.burgundyPetal : PALETTES.roseGold;
          } else if (theme === 'champagne') {
            pal = rand < 0.5 ? PALETTES.sage : rand < 0.8 ? PALETTES.champagneGold : PALETTES.eucalyptus;
          } else {
            pal = rand < 0.4 ? PALETTES.sage : rand < 0.75 ? PALETTES.eucalyptus : PALETTES.dustyBlue;
          }
          break;

        case 'gilded':
          type = rand < 0.45 ? 'pointed' : rand < 0.75 ? 'willow' : 'celestial_star';
          if (theme === 'navy') {
            pal = rand < 0.7 ? PALETTES.celestialGold : PALETTES.navyStarlight;
          } else if (theme === 'burgundy') {
            pal = rand < 0.6 ? PALETTES.roseGold : PALETTES.champagneGold;
          } else {
            pal = PALETTES.champagneGold;
          }
          break;

        case 'mixed':
        default:
          if (theme === 'burgundy') {
            if (rand < 0.3) {
              type = 'petal';
              pal = PALETTES.burgundyPetal;
            } else if (rand < 0.55) {
              type = 'petal';
              pal = PALETTES.blushPetal;
            } else if (rand < 0.75) {
              type = 'pointed';
              pal = PALETTES.sage;
            } else {
              type = 'willow';
              pal = PALETTES.roseGold;
            }
          } else if (theme === 'emerald') {
            if (rand < 0.35) {
              type = 'eucalyptus';
              pal = PALETTES.emeraldLeaf;
            } else if (rand < 0.65) {
              type = 'pointed';
              pal = PALETTES.eucalyptus;
            } else if (rand < 0.85) {
              type = 'willow';
              pal = PALETTES.sage;
            } else {
              type = 'pointed';
              pal = PALETTES.champagneGold;
            }
          } else if (theme === 'navy') {
            if (rand < 0.35) {
              type = 'pointed';
              pal = PALETTES.celestialGold;
            } else if (rand < 0.6) {
              type = 'willow';
              pal = PALETTES.navyStarlight;
            } else if (rand < 0.8) {
              type = 'petal';
              pal = PALETTES.ivoryPetal;
            } else {
              type = 'eucalyptus';
              pal = PALETTES.dustyBlue;
            }
          } else if (theme === 'champagne') {
            if (rand < 0.35) {
              type = 'petal';
              pal = PALETTES.ivoryPetal;
            } else if (rand < 0.6) {
              type = 'petal';
              pal = PALETTES.roseGold;
            } else if (rand < 0.8) {
              type = 'pointed';
              pal = PALETTES.champagneGold;
            } else {
              type = 'eucalyptus';
              pal = PALETTES.sage;
            }
          } else {
            if (rand < 0.35) {
              type = 'pointed';
              pal = PALETTES.sage;
            } else if (rand < 0.6) {
              type = 'eucalyptus';
              pal = PALETTES.eucalyptus;
            } else if (rand < 0.82) {
              type = 'petal';
              pal = Math.random() > 0.5 ? PALETTES.blushPetal : PALETTES.ivoryPetal;
            } else if (rand < 0.93) {
              type = 'willow';
              pal = PALETTES.dustyBlue;
            } else {
              type = 'pointed';
              pal = PALETTES.champagneGold;
            }
          }
          break;
      }

      // Base opacity & size
      const baseOpacity =
        style === 'celestial-stardust' || style === 'snow-crystal'
          ? 0.3 + Math.random() * 0.4
          : style === 'candlelit-lantern'
          ? 0.35 + Math.random() * 0.45
          : 0.22 + Math.random() * 0.28;

      let baseSize = (11 + Math.random() * 15) * sizeMultiplier;
      if (type === 'celestial_star' || type === 'snowflake' || type === 'maple') {
        baseSize *= 1.1;
      } else if (type === 'stardust_mote' || type === 'ember_mote') {
        baseSize *= 0.65;
      }

      // Base speeds with wind adjustments
      let speedY = (0.32 + Math.random() * 0.65);
      if (isBuoyant) {
        speedY = -(0.25 + Math.random() * 0.55); // upward floating embers & lanterns
      } else if (style === 'snow-crystal') {
        speedY = 0.25 + Math.random() * 0.45; // calm gentle snowfall
      } else if (style === 'cherry-blossom') {
        speedY = 0.28 + Math.random() * 0.5; // floating light flutter
      }

      let speedX = (Math.random() - 0.5) * 0.35;
      if (windDirection === 'breeze-right') {
        speedX += 0.45 + Math.random() * 0.5;
      } else if (windDirection === 'breeze-left') {
        speedX -= 0.45 + Math.random() * 0.5;
      }

      const spawnY =
        initY !== undefined
          ? initY
          : isBuoyant
          ? height + 20 + Math.random() * 30
          : -30 - Math.random() * 40;

      return {
        x: Math.random() * width,
        y: spawnY,
        size: baseSize,
        speedY: forceBurst ? (Math.random() - 0.8) * 3 : speedY,
        speedX: forceBurst ? (Math.random() - 0.5) * 4 : speedX,
        angle: Math.random() * Math.PI * 2,
        angularSpeed: (Math.random() - 0.5) * 0.024,
        flip: Math.random() * Math.PI,
        flipSpeed: 0.015 + Math.random() * 0.025,
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: 0.012 + Math.random() * 0.02,
        swayAmp: 0.8 + Math.random() * 1.6,
        opacity: baseOpacity,
        baseOpacity,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.02 + Math.random() * 0.03,
        type,
        primaryColor: pal.primary,
        secondaryColor: pal.secondary,
        veinColor: pal.vein,
        isBuoyant
      };
    };

    // Initialize particles
    const leaves: LeafParticle[] = [];
    for (let i = 0; i < count; i++) {
      leaves.push(createParticle(Math.random() * height));
    }
    leavesRef.current = leaves;

    // DRAWING ROUTINES

    // 1. Pointed Leaf
    const drawPointedLeaf = (c: CanvasRenderingContext2D, leaf: LeafParticle, scaleX: number, scaleY: number) => {
      const s = leaf.size;
      c.save();
      c.scale(scaleX, scaleY);
      c.beginPath();
      c.moveTo(0, -s);
      c.bezierCurveTo(s * 0.55, -s * 0.55, s * 0.6, s * 0.4, 0, s);
      c.bezierCurveTo(-s * 0.6, s * 0.4, -s * 0.55, -s * 0.55, 0, -s);
      c.closePath();
      const grad = c.createLinearGradient(-s * 0.3, -s, s * 0.3, s);
      grad.addColorStop(0, `${leaf.primaryColor}${leaf.opacity})`);
      grad.addColorStop(1, `${leaf.secondaryColor}${leaf.opacity * 0.75})`);
      c.fillStyle = grad;
      c.fill();
      c.beginPath();
      c.moveTo(0, -s * 0.85);
      c.quadraticCurveTo(s * 0.05, 0, 0, s * 0.95);
      c.strokeStyle = `${leaf.veinColor}${leaf.opacity * 0.65})`;
      c.lineWidth = 0.75;
      c.stroke();
      c.restore();
    };

    // 2. Eucalyptus Leaf
    const drawEucalyptusLeaf = (c: CanvasRenderingContext2D, leaf: LeafParticle, scaleX: number, scaleY: number) => {
      const s = leaf.size;
      c.save();
      c.scale(scaleX, scaleY);
      c.beginPath();
      c.ellipse(0, 0, s * 0.55, s * 0.8, 0, 0, Math.PI * 2);
      const grad = c.createRadialGradient(0, -s * 0.2, s * 0.1, 0, 0, s * 0.85);
      grad.addColorStop(0, `${leaf.secondaryColor}${leaf.opacity * 0.95})`);
      grad.addColorStop(1, `${leaf.primaryColor}${leaf.opacity * 0.8})`);
      c.fillStyle = grad;
      c.fill();
      c.strokeStyle = `${leaf.veinColor}${leaf.opacity * 0.4})`;
      c.lineWidth = 0.5;
      c.stroke();
      c.restore();
    };

    // 3. Classic Rose Petal
    const drawRosePetal = (c: CanvasRenderingContext2D, leaf: LeafParticle, scaleX: number, scaleY: number) => {
      const s = leaf.size * 0.92;
      c.save();
      c.scale(scaleX, scaleY);
      c.beginPath();
      c.moveTo(0, s * 0.75);
      c.bezierCurveTo(-s * 0.65, s * 0.5, -s * 0.7, -s * 0.4, -s * 0.2, -s * 0.75);
      c.bezierCurveTo(-s * 0.05, -s * 0.88, s * 0.05, -s * 0.88, s * 0.2, -s * 0.75);
      c.bezierCurveTo(s * 0.7, -s * 0.4, s * 0.65, s * 0.5, 0, s * 0.75);
      c.closePath();
      const grad = c.createLinearGradient(0, -s * 0.8, 0, s * 0.8);
      grad.addColorStop(0, `${leaf.primaryColor}${leaf.opacity})`);
      grad.addColorStop(1, `${leaf.secondaryColor}${leaf.opacity * 0.7})`);
      c.fillStyle = grad;
      c.fill();
      c.restore();
    };

    // 4. Willow Leaf
    const drawWillowLeaf = (c: CanvasRenderingContext2D, leaf: LeafParticle, scaleX: number, scaleY: number) => {
      const s = leaf.size * 1.15;
      c.save();
      c.scale(scaleX, scaleY);
      c.beginPath();
      c.moveTo(0, -s);
      c.bezierCurveTo(s * 0.35, -s * 0.4, s * 0.25, s * 0.5, 0, s);
      c.bezierCurveTo(-s * 0.25, s * 0.5, -s * 0.35, -s * 0.4, 0, -s);
      c.closePath();
      const grad = c.createLinearGradient(0, -s, 0, s);
      grad.addColorStop(0, `${leaf.primaryColor}${leaf.opacity * 0.9})`);
      grad.addColorStop(1, `${leaf.secondaryColor}${leaf.opacity * 0.7})`);
      c.fillStyle = grad;
      c.fill();
      c.beginPath();
      c.moveTo(0, -s * 0.9);
      c.lineTo(0, s * 0.9);
      c.strokeStyle = `${leaf.veinColor}${leaf.opacity * 0.5})`;
      c.lineWidth = 0.6;
      c.stroke();
      c.restore();
    };

    // 5. Sakura Cherry Blossom Petal (Notched heart cleft)
    const drawSakuraPetal = (c: CanvasRenderingContext2D, leaf: LeafParticle, scaleX: number, scaleY: number) => {
      const s = leaf.size * 0.95;
      c.save();
      c.scale(scaleX, scaleY);
      c.beginPath();
      c.moveTo(0, s * 0.8);
      c.bezierCurveTo(-s * 0.6, s * 0.5, -s * 0.65, -s * 0.3, -s * 0.3, -s * 0.75);
      c.bezierCurveTo(-s * 0.15, -s * 0.85, -s * 0.05, -s * 0.7, 0, -s * 0.55); // center notch cleft
      c.bezierCurveTo(s * 0.05, -s * 0.7, s * 0.15, -s * 0.85, s * 0.3, -s * 0.75);
      c.bezierCurveTo(s * 0.65, -s * 0.3, s * 0.6, s * 0.5, 0, s * 0.8);
      c.closePath();
      const grad = c.createRadialGradient(0, s * 0.4, s * 0.1, 0, 0, s * 0.9);
      grad.addColorStop(0, `${leaf.secondaryColor}${leaf.opacity * 0.95})`);
      grad.addColorStop(0.7, `${leaf.primaryColor}${leaf.opacity * 0.8})`);
      grad.addColorStop(1, `${leaf.veinColor}${leaf.opacity * 0.5})`);
      c.fillStyle = grad;
      c.fill();
      c.restore();
    };

    // 6. Sakura Blossom Bud
    const drawSakuraBud = (c: CanvasRenderingContext2D, leaf: LeafParticle, scaleX: number, scaleY: number) => {
      const s = leaf.size * 0.75;
      c.save();
      c.scale(scaleX, scaleY);
      // Double overlapping petal cluster
      c.beginPath();
      c.ellipse(-s * 0.3, 0, s * 0.4, s * 0.6, -Math.PI / 6, 0, Math.PI * 2);
      c.ellipse(s * 0.3, 0, s * 0.4, s * 0.6, Math.PI / 6, 0, Math.PI * 2);
      c.fillStyle = `${leaf.primaryColor}${leaf.opacity * 0.85})`;
      c.fill();
      // Center gold pistil speck
      c.beginPath();
      c.arc(0, 0, s * 0.18, 0, Math.PI * 2);
      c.fillStyle = `rgba(245, 208, 126, ${leaf.opacity})`;
      c.fill();
      c.restore();
    };

    // 7. Celestial 4-Point Star Diamond
    const drawCelestialStar = (c: CanvasRenderingContext2D, leaf: LeafParticle, scaleX: number, scaleY: number) => {
      const s = leaf.size * 1.1;
      c.save();
      c.scale(scaleX, scaleY);
      // Outer glow flare
      const glowGrad = c.createRadialGradient(0, 0, 0, 0, 0, s * 1.4);
      glowGrad.addColorStop(0, `${leaf.primaryColor}${leaf.opacity * 0.9})`);
      glowGrad.addColorStop(0.4, `${leaf.secondaryColor}${leaf.opacity * 0.4})`);
      glowGrad.addColorStop(1, `rgba(255,255,255,0)`);
      c.fillStyle = glowGrad;
      c.beginPath();
      c.arc(0, 0, s * 1.4, 0, Math.PI * 2);
      c.fill();

      // Sharp 4-point star
      c.beginPath();
      c.moveTo(0, -s * 1.2);
      c.quadraticCurveTo(0, 0, s * 0.3, 0);
      c.quadraticCurveTo(0, 0, 0, s * 1.2);
      c.quadraticCurveTo(0, 0, -s * 0.3, 0);
      c.quadraticCurveTo(0, 0, 0, -s * 1.2);
      c.closePath();
      c.fillStyle = `${leaf.secondaryColor}${leaf.opacity * 0.95})`;
      c.fill();

      // Horizontal micro diamond cross
      c.beginPath();
      c.moveTo(-s * 1.2, 0);
      c.quadraticCurveTo(0, 0, 0, s * 0.3);
      c.quadraticCurveTo(0, 0, s * 1.2, 0);
      c.quadraticCurveTo(0, 0, 0, -s * 0.3);
      c.quadraticCurveTo(0, 0, -s * 1.2, 0);
      c.closePath();
      c.fillStyle = `${leaf.secondaryColor}${leaf.opacity * 0.95})`;
      c.fill();

      // Bright white core
      c.beginPath();
      c.arc(0, 0, s * 0.22, 0, Math.PI * 2);
      c.fillStyle = `rgba(255, 255, 255, ${leaf.opacity})`;
      c.fill();
      c.restore();
    };

    // 8. Stardust Twinkle Mote
    const drawStardustMote = (c: CanvasRenderingContext2D, leaf: LeafParticle, scaleX: number, scaleY: number) => {
      const s = leaf.size * 0.6;
      c.save();
      c.scale(scaleX, scaleY);
      const radGrad = c.createRadialGradient(0, 0, 0, 0, 0, s * 1.8);
      radGrad.addColorStop(0, `rgba(255, 255, 255, ${leaf.opacity})`);
      radGrad.addColorStop(0.3, `${leaf.primaryColor}${leaf.opacity * 0.8})`);
      radGrad.addColorStop(1, `rgba(255, 255, 255, 0)`);
      c.fillStyle = radGrad;
      c.beginPath();
      c.arc(0, 0, s * 1.8, 0, Math.PI * 2);
      c.fill();
      c.restore();
    };

    // 9. Candlelight Glow Orb / Lantern Flame
    const drawCandleFlame = (c: CanvasRenderingContext2D, leaf: LeafParticle, scaleX: number, scaleY: number) => {
      const s = leaf.size * 0.85;
      c.save();
      c.scale(scaleX, scaleY);
      // Wide warm luminescent halo
      const halo = c.createRadialGradient(0, 0, s * 0.2, 0, 0, s * 2.2);
      halo.addColorStop(0, `${leaf.primaryColor}${leaf.opacity * 0.85})`);
      halo.addColorStop(0.5, `${leaf.secondaryColor}${leaf.opacity * 0.35})`);
      halo.addColorStop(1, 'rgba(251, 191, 36, 0)');
      c.fillStyle = halo;
      c.beginPath();
      c.arc(0, 0, s * 2.2, 0, Math.PI * 2);
      c.fill();

      // Soft teardrop center
      c.beginPath();
      c.moveTo(0, -s * 0.9);
      c.bezierCurveTo(s * 0.55, -s * 0.2, s * 0.45, s * 0.6, 0, s * 0.8);
      c.bezierCurveTo(-s * 0.45, s * 0.6, -s * 0.55, -s * 0.2, 0, -s * 0.9);
      c.closePath();
      c.fillStyle = `${leaf.secondaryColor}${leaf.opacity * 0.95})`;
      c.fill();
      c.restore();
    };

    // 10. Warm Ember Mote (Floating firefly ember)
    const drawEmberMote = (c: CanvasRenderingContext2D, leaf: LeafParticle, scaleX: number, scaleY: number) => {
      const s = leaf.size * 0.55;
      c.save();
      c.scale(scaleX, scaleY);
      const emberGrad = c.createRadialGradient(0, 0, 0, 0, 0, s * 1.8);
      emberGrad.addColorStop(0, `rgba(255, 255, 255, ${leaf.opacity})`);
      emberGrad.addColorStop(0.35, `${leaf.primaryColor}${leaf.opacity * 0.9})`);
      emberGrad.addColorStop(0.7, `${leaf.veinColor}${leaf.opacity * 0.4})`);
      emberGrad.addColorStop(1, 'rgba(249, 115, 22, 0)');
      c.fillStyle = emberGrad;
      c.beginPath();
      c.arc(0, 0, s * 1.8, 0, Math.PI * 2);
      c.fill();
      c.restore();
    };

    // 11. Lavender Floret Sprig
    const drawLavenderFloret = (c: CanvasRenderingContext2D, leaf: LeafParticle, scaleX: number, scaleY: number) => {
      const s = leaf.size * 0.9;
      c.save();
      c.scale(scaleX, scaleY);
      // Delicate stem
      c.beginPath();
      c.moveTo(0, -s);
      c.lineTo(0, s);
      c.strokeStyle = `rgba(128, 153, 133, ${leaf.opacity * 0.7})`;
      c.lineWidth = 0.8;
      c.stroke();
      // Tiered oval buds along stem
      const budPositions = [-0.7, -0.4, -0.1, 0.2, 0.5];
      budPositions.forEach((yFrac, idx) => {
        const offset = idx % 2 === 0 ? s * 0.22 : -s * 0.22;
        c.beginPath();
        c.ellipse(offset, s * yFrac, s * 0.18, s * 0.26, idx % 2 === 0 ? 0.3 : -0.3, 0, Math.PI * 2);
        c.fillStyle = `${leaf.primaryColor}${leaf.opacity * 0.85})`;
        c.fill();
      });
      c.restore();
    };

    // 12. Wildflower / Meadow Petal
    const drawWildflowerPetal = (c: CanvasRenderingContext2D, leaf: LeafParticle, scaleX: number, scaleY: number) => {
      const s = leaf.size * 0.85;
      c.save();
      c.scale(scaleX, scaleY);
      c.beginPath();
      c.ellipse(0, 0, s * 0.45, s * 0.85, 0, 0, Math.PI * 2);
      const grad = c.createLinearGradient(0, -s * 0.8, 0, s * 0.8);
      grad.addColorStop(0, `${leaf.secondaryColor}${leaf.opacity * 0.95})`);
      grad.addColorStop(1, `${leaf.primaryColor}${leaf.opacity * 0.75})`);
      c.fillStyle = grad;
      c.fill();
      c.restore();
    };

    // 13. Autumn Maple Leaf (5-Lobed)
    const drawMapleLeaf = (c: CanvasRenderingContext2D, leaf: LeafParticle, scaleX: number, scaleY: number) => {
      const s = leaf.size * 1.15;
      c.save();
      c.scale(scaleX, scaleY);
      c.beginPath();
      c.moveTo(0, s * 0.85); // base
      // Right bottom lobe
      c.lineTo(s * 0.35, s * 0.55);
      c.lineTo(s * 0.7, s * 0.45);
      c.lineTo(s * 0.45, s * 0.2);
      // Right upper lobe
      c.lineTo(s * 0.85, -s * 0.1);
      c.lineTo(s * 0.5, -s * 0.25);
      // Center top tip
      c.lineTo(s * 0.35, -s * 0.55);
      c.lineTo(0, -s * 0.95);
      // Left upper lobe
      c.lineTo(-s * 0.35, -s * 0.55);
      c.lineTo(-s * 0.5, -s * 0.25);
      c.lineTo(-s * 0.85, -s * 0.1);
      // Left bottom lobe
      c.lineTo(-s * 0.45, s * 0.2);
      c.lineTo(-s * 0.7, s * 0.45);
      c.lineTo(-s * 0.35, s * 0.55);
      c.closePath();

      const grad = c.createLinearGradient(0, -s, 0, s);
      grad.addColorStop(0, `${leaf.secondaryColor}${leaf.opacity * 0.95})`);
      grad.addColorStop(0.6, `${leaf.primaryColor}${leaf.opacity * 0.85})`);
      grad.addColorStop(1, `${leaf.veinColor}${leaf.opacity * 0.7})`);
      c.fillStyle = grad;
      c.fill();

      // Maple veins
      c.beginPath();
      c.moveTo(0, s * 0.85);
      c.lineTo(0, -s * 0.85);
      c.moveTo(0, s * 0.3);
      c.lineTo(s * 0.65, -s * 0.05);
      c.moveTo(0, s * 0.3);
      c.lineTo(-s * 0.65, -s * 0.05);
      c.strokeStyle = `${leaf.veinColor}${leaf.opacity * 0.55})`;
      c.lineWidth = 0.65;
      c.stroke();
      c.restore();
    };

    // 14. Vineyard Grape Leaf
    const drawVineyardLeaf = (c: CanvasRenderingContext2D, leaf: LeafParticle, scaleX: number, scaleY: number) => {
      const s = leaf.size * 1.1;
      c.save();
      c.scale(scaleX, scaleY);
      c.beginPath();
      c.moveTo(0, s * 0.8);
      c.bezierCurveTo(s * 0.8, s * 0.4, s * 0.9, -s * 0.4, 0, -s * 0.85);
      c.bezierCurveTo(-s * 0.9, -s * 0.4, -s * 0.8, s * 0.4, 0, s * 0.8);
      c.closePath();
      const grad = c.createLinearGradient(-s * 0.5, -s, s * 0.5, s);
      grad.addColorStop(0, `${leaf.primaryColor}${leaf.opacity * 0.9})`);
      grad.addColorStop(1, `${leaf.secondaryColor}${leaf.opacity * 0.7})`);
      c.fillStyle = grad;
      c.fill();
      c.restore();
    };

    // 15. Symmetrical 6-Point Geometric Snowflake
    const drawSnowflake = (c: CanvasRenderingContext2D, leaf: LeafParticle, scaleX: number, scaleY: number) => {
      const s = leaf.size * 1.1;
      c.save();
      c.scale(scaleX, scaleY);
      c.strokeStyle = `${leaf.primaryColor}${leaf.opacity * 0.9})`;
      c.lineWidth = 1.1;
      c.lineCap = 'round';

      // Draw 6 symmetrical branches
      for (let i = 0; i < 6; i++) {
        c.save();
        c.rotate((i * Math.PI) / 3);
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(0, -s);
        // Outer feather twigs
        c.moveTo(0, -s * 0.7);
        c.lineTo(s * 0.25, -s * 0.9);
        c.moveTo(0, -s * 0.7);
        c.lineTo(-s * 0.25, -s * 0.9);
        // Inner feather twigs
        c.moveTo(0, -s * 0.4);
        c.lineTo(s * 0.2, -s * 0.55);
        c.moveTo(0, -s * 0.4);
        c.lineTo(-s * 0.2, -s * 0.55);
        c.stroke();
        c.restore();
      }

      // Center crystalline diamond
      c.beginPath();
      c.arc(0, 0, s * 0.16, 0, Math.PI * 2);
      c.fillStyle = `rgba(255, 255, 255, ${leaf.opacity})`;
      c.fill();
      c.restore();
    };

    // 16. Ice Crystal Shard
    const drawIceCrystal = (c: CanvasRenderingContext2D, leaf: LeafParticle, scaleX: number, scaleY: number) => {
      const s = leaf.size * 0.85;
      c.save();
      c.scale(scaleX, scaleY);
      c.beginPath();
      c.moveTo(0, -s * 1.1);
      c.lineTo(s * 0.35, -s * 0.2);
      c.lineTo(s * 0.25, s * 0.8);
      c.lineTo(0, s * 1.1);
      c.lineTo(-s * 0.25, s * 0.8);
      c.lineTo(-s * 0.35, -s * 0.2);
      c.closePath();
      const grad = c.createLinearGradient(0, -s, 0, s);
      grad.addColorStop(0, `rgba(255, 255, 255, ${leaf.opacity})`);
      grad.addColorStop(0.5, `${leaf.primaryColor}${leaf.opacity * 0.85})`);
      grad.addColorStop(1, `${leaf.secondaryColor}${leaf.opacity * 0.6})`);
      c.fillStyle = grad;
      c.fill();
      c.strokeStyle = `rgba(255, 255, 255, ${leaf.opacity * 0.7})`;
      c.lineWidth = 0.5;
      c.stroke();
      c.restore();
    };

    // Dispatcher for drawing particle types
    const renderParticle = (c: CanvasRenderingContext2D, leaf: LeafParticle, scaleX: number, scaleY: number) => {
      switch (leaf.type) {
        case 'eucalyptus':
          drawEucalyptusLeaf(c, leaf, scaleX, scaleY);
          break;
        case 'petal':
          drawRosePetal(c, leaf, scaleX, scaleY);
          break;
        case 'willow':
          drawWillowLeaf(c, leaf, scaleX, scaleY);
          break;
        case 'sakura':
          drawSakuraPetal(c, leaf, scaleX, scaleY);
          break;
        case 'sakura_bud':
          drawSakuraBud(c, leaf, scaleX, scaleY);
          break;
        case 'celestial_star':
          drawCelestialStar(c, leaf, scaleX, scaleY);
          break;
        case 'stardust_mote':
          drawStardustMote(c, leaf, scaleX, scaleY);
          break;
        case 'candle_flame':
          drawCandleFlame(c, leaf, scaleX, scaleY);
          break;
        case 'ember_mote':
          drawEmberMote(c, leaf, scaleX, scaleY);
          break;
        case 'lavender_floret':
          drawLavenderFloret(c, leaf, scaleX, scaleY);
          break;
        case 'wildflower_petal':
          drawWildflowerPetal(c, leaf, scaleX, scaleY);
          break;
        case 'maple':
          drawMapleLeaf(c, leaf, scaleX, scaleY);
          break;
        case 'vineyard_leaf':
          drawVineyardLeaf(c, leaf, scaleX, scaleY);
          break;
        case 'snowflake':
          drawSnowflake(c, leaf, scaleX, scaleY);
          break;
        case 'ice_crystal':
          drawIceCrystal(c, leaf, scaleX, scaleY);
          break;
        case 'pointed':
        default:
          drawPointedLeaf(c, leaf, scaleX, scaleY);
          break;
      }
    };

    // MAIN ANIMATION LOOP
    let isRunning = true;
    let frameCount = 0;

    const render = () => {
      if (!isRunning) return;
      frameCount++;

      ctx.clearRect(0, 0, width, height);

      // Decay interactive breeze
      breezeRef.current.x *= breezeRef.current.decay;
      breezeRef.current.y *= 0.92;

      const currentBreezeX = breezeRef.current.x;
      const currentBreezeY = breezeRef.current.y;

      // Swirling eddy currents if wind direction is swirling
      const swirlFactor = windDirection === 'swirling' ? Math.sin(frameCount * 0.015) * 0.85 : 0;

      for (let i = 0; i < leaves.length; i++) {
        const leaf = leaves[i];

        // Update physics
        leaf.swayPhase += leaf.swaySpeed;
        leaf.angle += leaf.angularSpeed;
        leaf.flip += leaf.flipSpeed;

        if (leaf.twinklePhase !== undefined && leaf.twinkleSpeed !== undefined) {
          leaf.twinklePhase += leaf.twinkleSpeed;
          leaf.opacity = leaf.baseOpacity * (0.65 + 0.35 * Math.sin(leaf.twinklePhase));
        }

        const naturalDrift = Math.sin(leaf.swayPhase) * leaf.swayAmp;
        leaf.x += leaf.speedX + naturalDrift + currentBreezeX + swirlFactor;
        leaf.y += leaf.speedY + currentBreezeY * 0.35;

        // 3D tumbling flip in air
        const scaleX = Math.cos(leaf.flip);
        const scaleY = 1 + Math.sin(leaf.swayPhase) * 0.12;

        ctx.save();
        ctx.translate(leaf.x, leaf.y);
        ctx.rotate(leaf.angle);

        renderParticle(ctx, leaf, scaleX, scaleY);

        ctx.restore();

        // Boundary wrapping & recycling
        if (leaf.isBuoyant) {
          // Floating upwards
          if (leaf.y < -40) {
            leaf.y = height + 20 + Math.random() * 30;
            leaf.x = Math.random() * width;
          }
        } else {
          // Falling downwards
          if (leaf.y > height + 40) {
            leaf.y = -30 - Math.random() * 30;
            leaf.x = Math.random() * width;
          }
        }

        if (leaf.x < -60) {
          leaf.x = width + 40;
        } else if (leaf.x > width + 60) {
          leaf.x = -40;
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isRunning = false;
        cancelAnimationFrame(animationFrameId);
      } else {
        if (!isRunning) {
          isRunning = true;
          animationFrameId = requestAnimationFrame(render);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    animationFrameId = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, style, density, theme, windDirection, scale]);

  // Handle manual interactive burst triggers
  useEffect(() => {
    if (burstTrigger > 0 && leavesRef.current.length > 0) {
      breezeRef.current.x += (Math.random() - 0.5) * 6;
      breezeRef.current.y += (Math.random() - 0.5) * 4;
      // Add random impulse to several leaves
      for (let i = 0; i < Math.min(leavesRef.current.length, 16); i++) {
        const l = leavesRef.current[i];
        l.speedX += (Math.random() - 0.5) * 4;
        l.speedY += (Math.random() - 0.5) * 3;
      }
    }
  }, [burstTrigger]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      id="falling-leaves-canvas"
      className="fixed inset-0 pointer-events-none z-[2] w-full h-full"
      style={{ willChange: 'transform' }}
      aria-hidden="true"
    />
  );
};
