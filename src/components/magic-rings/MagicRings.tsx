import { useEffect, useRef } from "react";
import { Mesh, Program, Renderer, Triangle } from "ogl";

const vertex = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `#version 300 es
precision highp float;

uniform float uTime, uAttenuation, uLineThickness;
uniform float uBaseRadius, uRadiusStep, uScaleRate;
uniform float uOpacity, uNoiseAmount, uRotation, uRingGap;
uniform float uFadeIn, uFadeOut;
uniform float uMouseInfluence, uHoverAmount, uHoverScale, uParallax, uBurst;
uniform float uCoverageAlpha;
uniform vec2 uResolution, uMouse;
uniform vec3 uColor, uColorTwo;
uniform int uRingCount;

out vec4 fragColor;

const float HP = 1.5707963;
const float CYCLE = 3.45;

float fade(float t) {
  return t < uFadeIn ? smoothstep(0.0, uFadeIn, t) : 1.0 - smoothstep(uFadeOut, CYCLE - 0.2, t);
}

float ring(vec2 p, float ri, float cut, float t0, float px) {
  float t = mod(uTime + t0, CYCLE);
  float r = ri + t / CYCLE * uScaleRate;
  float d = abs(length(p) - r);
  float a = atan(abs(p.y), abs(p.x)) / HP;
  float th = max(1.0 - a, 0.5) * px * uLineThickness;
  float h = (1.0 - smoothstep(th, th * 1.5, d)) + 1.0;
  d += pow(cut * a, 3.0) * r;
  return h * exp(-uAttenuation * d) * fade(t);
}

void main() {
  float px = 1.0 / min(uResolution.x, uResolution.y);
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution.xy) * px;
  float cr = cos(uRotation), sr = sin(uRotation);
  p = mat2(cr, -sr, sr, cr) * p;
  p -= uMouse * uMouseInfluence;
  float sc = mix(1.0, uHoverScale, uHoverAmount) + uBurst * 0.3;
  p /= sc;
  vec3 c = vec3(0.0);
  float coverage = 0.0;
  float rcf = max(float(uRingCount) - 1.0, 1.0);
  for (int i = 0; i < 10; i++) {
    if (i >= uRingCount) break;
    float fi = float(i);
    vec2 pr = p - fi * uParallax * uMouse;
    vec3 rc = mix(uColor, uColorTwo, fi / rcf);
    float ringAmount = ring(pr, uBaseRadius + fi * uRadiusStep, pow(uRingGap, fi), i == 0 ? 0.0 : 2.95 * fi, px);
    c = mix(c, rc, vec3(ringAmount));
    coverage = max(coverage, ringAmount);
  }
  c *= 1.0 + uBurst * 2.0;
  float n = fract(sin(dot(gl_FragCoord.xy + uTime * 100.0, vec2(12.9898, 78.233))) * 43758.5453);
  c += (n - 0.5) * uNoiseAmount;
  float intensity = max(c.r, max(c.g, c.b));
  vec3 emissiveColor = intensity > 0.0001 ? clamp(c / intensity, 0.0, 1.0) : vec3(0.0);
  vec3 outputColor = mix(emissiveColor, clamp(c, 0.0, 1.0), uCoverageAlpha);
  float outputAlpha = mix(intensity, coverage, uCoverageAlpha);
  fragColor = vec4(outputColor, clamp(outputAlpha * uOpacity, 0.0, 1.0));
}
`;

type AlphaMode = "luminance" | "coverage";

export type MagicRingsProps = {
  color?: string;
  colorTwo?: string;
  speed?: number;
  ringCount?: number;
  attenuation?: number;
  lineThickness?: number;
  baseRadius?: number;
  radiusStep?: number;
  scaleRate?: number;
  opacity?: number;
  blur?: number;
  noiseAmount?: number;
  rotation?: number;
  ringGap?: number;
  fadeIn?: number;
  fadeOut?: number;
  followMouse?: boolean;
  mouseInfluence?: number;
  hoverScale?: number;
  parallax?: number;
  clickBurst?: boolean;
  alphaMode?: AlphaMode;
};

type RingSettings = Required<Omit<MagicRingsProps, "blur">>;

const hexToRgb = (hex: string) => {
  const normalized = hex.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;
  const num = Number.parseInt(value, 16);
  if (Number.isNaN(num)) return new Float32Array([1, 1, 1]);
  return new Float32Array([((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255]);
};

export default function MagicRings({
  color = "#8B5CFF",
  colorTwo = "#3B1578",
  speed = 0.65,
  ringCount = 4,
  attenuation = 14,
  lineThickness = 1.4,
  baseRadius = 0.38,
  radiusStep = 0.15,
  scaleRate = 0.06,
  opacity = 0.95,
  blur = 0,
  noiseAmount = 0.06,
  rotation = 0,
  ringGap = 1.5,
  fadeIn = 0.7,
  fadeOut = 0.5,
  followMouse = false,
  mouseInfluence = 0.2,
  hoverScale = 1.2,
  parallax = 0.05,
  clickBurst = false,
  alphaMode = "luminance",
}: MagicRingsProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const propsRef = useRef<RingSettings>(null!);
  const mouseRef = useRef([0, 0]);
  const smoothMouseRef = useRef([0, 0]);
  const hoverAmountRef = useRef(0);
  const isHoveredRef = useRef(false);
  const burstRef = useRef(0);

  propsRef.current = {
    color,
    colorTwo,
    speed,
    ringCount,
    attenuation,
    lineThickness,
    baseRadius,
    radiusStep,
    scaleRate,
    opacity,
    noiseAmount,
    rotation,
    ringGap,
    fadeIn,
    fadeOut,
    followMouse,
    mouseInfluence,
    hoverScale,
    parallax,
    clickBurst,
    alphaMode,
  };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: Renderer;
    try {
      renderer = new Renderer({
        webgl: 2,
        alpha: true,
        antialias: false,
        dpr: Math.min(window.devicePixelRatio || 1, 2),
      });
    } catch {
      return;
    }

    if (!renderer.isWebgl2) return;

    const gl = renderer.gl;
    const canvas = gl.canvas;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    mount.appendChild(canvas);

    const uniforms = {
      uTime: { value: 0 },
      uAttenuation: { value: 0 },
      uResolution: { value: new Float32Array([1, 1]) },
      uColor: { value: new Float32Array([1, 1, 1]) },
      uColorTwo: { value: new Float32Array([1, 1, 1]) },
      uLineThickness: { value: 0 },
      uBaseRadius: { value: 0 },
      uRadiusStep: { value: 0 },
      uScaleRate: { value: 0 },
      uRingCount: { value: 0 },
      uOpacity: { value: 1 },
      uNoiseAmount: { value: 0 },
      uRotation: { value: 0 },
      uRingGap: { value: 1.6 },
      uFadeIn: { value: 0.5 },
      uFadeOut: { value: 0.75 },
      uMouse: { value: new Float32Array([0, 0]) },
      uMouseInfluence: { value: 0 },
      uHoverAmount: { value: 0 },
      uHoverScale: { value: 1 },
      uParallax: { value: 0 },
      uBurst: { value: 0 },
      uCoverageAlpha: { value: 0 },
    };

    const program = new Program(gl, {
      vertex,
      fragment,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms,
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    const resize = () => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      renderer.setSize(width, height);
      uniforms.uResolution.value[0] = gl.drawingBufferWidth;
      uniforms.uResolution.value[1] = gl.drawingBufferHeight;
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    const onMouseMove = (event: MouseEvent) => {
      const rect = mount.getBoundingClientRect();
      mouseRef.current[0] = (event.clientX - rect.left) / rect.width - 0.5;
      mouseRef.current[1] = -((event.clientY - rect.top) / rect.height - 0.5);
    };
    const onMouseEnter = () => {
      isHoveredRef.current = true;
    };
    const onMouseLeave = () => {
      isHoveredRef.current = false;
      mouseRef.current[0] = 0;
      mouseRef.current[1] = 0;
    };
    const onClick = () => {
      burstRef.current = 1;
    };

    const hoverRoot = mount.closest("aside") ?? mount;
    isHoveredRef.current = hoverRoot.matches(":hover");
    hoverRoot.addEventListener("mouseenter", onMouseEnter);
    hoverRoot.addEventListener("mouseleave", onMouseLeave);
    mount.addEventListener("mousemove", onMouseMove);
    mount.addEventListener("click", onClick);

    let frameId = 0;
    let isVisible = false;
    let isPageVisible = !document.hidden;
    let elapsed = 0;
    let lastT = 0;

    const animate = (t: number) => {
      frameId = requestAnimationFrame(animate);
      const settings = propsRef.current;
      const dt = lastT === 0 ? 0 : Math.min(t - lastT, 100);
      lastT = t;
      elapsed += dt * 0.001 * settings.speed;

      smoothMouseRef.current[0] += (mouseRef.current[0] - smoothMouseRef.current[0]) * 0.08;
      smoothMouseRef.current[1] += (mouseRef.current[1] - smoothMouseRef.current[1]) * 0.08;
      hoverAmountRef.current += ((isHoveredRef.current ? 1 : 0) - hoverAmountRef.current) * 0.08;
      burstRef.current *= 0.95;
      if (burstRef.current < 0.001) burstRef.current = 0;

      uniforms.uTime.value = elapsed;
      uniforms.uAttenuation.value = settings.attenuation;
      uniforms.uColor.value = hexToRgb(settings.color);
      uniforms.uColorTwo.value = hexToRgb(settings.colorTwo);
      uniforms.uLineThickness.value = settings.lineThickness;
      uniforms.uBaseRadius.value = settings.baseRadius;
      uniforms.uRadiusStep.value = settings.radiusStep;
      uniforms.uScaleRate.value = settings.scaleRate;
      uniforms.uRingCount.value = settings.ringCount;
      uniforms.uOpacity.value = settings.opacity;
      uniforms.uNoiseAmount.value = settings.noiseAmount;
      uniforms.uRotation.value = (settings.rotation * Math.PI) / 180;
      uniforms.uRingGap.value = settings.ringGap;
      uniforms.uFadeIn.value = settings.fadeIn;
      uniforms.uFadeOut.value = settings.fadeOut;
      uniforms.uMouse.value[0] = smoothMouseRef.current[0];
      uniforms.uMouse.value[1] = smoothMouseRef.current[1];
      uniforms.uMouseInfluence.value = settings.followMouse ? settings.mouseInfluence : 0;
      uniforms.uHoverAmount.value = hoverAmountRef.current;
      uniforms.uHoverScale.value = settings.hoverScale;
      uniforms.uParallax.value = settings.parallax;
      uniforms.uBurst.value = settings.clickBurst ? burstRef.current : 0;
      uniforms.uCoverageAlpha.value = settings.alphaMode === "coverage" ? 1 : 0;

      renderer.render({ scene: mesh });
    };

    const tryStart = () => {
      if (isVisible && isPageVisible && frameId === 0) {
        lastT = 0;
        frameId = requestAnimationFrame(animate);
      }
    };
    const tryStop = () => {
      if (frameId !== 0) {
        cancelAnimationFrame(frameId);
        frameId = 0;
      }
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry?.isIntersecting ?? false;
        if (isVisible) tryStart();
        else tryStop();
      },
      { threshold: 0 },
    );
    io.observe(mount);

    const onVisibility = () => {
      isPageVisible = !document.hidden;
      if (isPageVisible) tryStart();
      else tryStop();
    };
    document.addEventListener("visibilitychange", onVisibility);
    tryStart();

    return () => {
      tryStop();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      ro.disconnect();
      hoverRoot.removeEventListener("mouseenter", onMouseEnter);
      hoverRoot.removeEventListener("mouseleave", onMouseLeave);
      mount.removeEventListener("mousemove", onMouseMove);
      mount.removeEventListener("click", onClick);
      if (canvas.parentElement === mount) mount.removeChild(canvas);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="size-full"
      style={blur > 0 ? { filter: `blur(${blur}px)` } : undefined}
    />
  );
}
