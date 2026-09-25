"use client";

import { useEffect, useRef, memo } from 'react';

// Welcome background as a 2.5D scene: the photo is shifted per pixel by a depth map
// (pointer, device tilt, or a slow idle drift), and the fireflies fly at their own
// depths inside it, so they pass behind the couple and blur when out of focus.
//
// Depth map channels: R = depth for occlusion (sharp edges), G = dilated + blurred
// depth for the parallax shift (so edges stretch the background, not the couple).
// White = near, black = far.

interface DepthParallaxSceneProps {
  imageSrc: string;
  depthSrc: string;
  /** Where the couple stands, in image uv [x0, y0, x1, y1]. Extra fireflies gather and glow here. */
  subject: readonly [number, number, number, number];
  /** An ellipse the firefly light skips, in image uv [cx, cy, rx, ry] (e.g. the groom's hair). */
  unlit?: readonly [number, number, number, number];
  /** Called when WebGL or the images are unavailable; the caller shows the flat fallback. */
  onFail: () => void;
}

// Parallax pivot: depths below move one way, above the other. Mid-scene keeps both
// the couple and the sky shifts small.
const PIVOT = 0.45;
// Depth-of-field focus: the couple's depth in the map. Fireflies here are sharp.
const FOCUS_Z = 0.8;
// Degrees of tilt for the full parallax swing. People tilt a phone ~5-15 degrees
// when they try it, so a wider range barely moves the scene.
const TILT_RANGE = 12;
// How quickly the tilt re-centres on the way the phone is being held (ms), so the
// scene answers to movement rather than to the grip angle
const TILT_RECENTER_MS = 4000;
const DARK = [0x12 / 255, 0x10 / 255, 0x0e / 255]; // --color-wedding-dark
// Fireflies near the couple also light the photo; each one is a light in the shader.
const MAX_LIGHTS = 16;

const VERT_QUAD = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5); // y down, matching the image rows
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

// Shared by both passes so a firefly's occlusion reads the exact depth the viewer sees.
const SCENE_UV = `
uniform sampler2D uDepth;
uniform vec2 uScale;   // visible part of the image (object-cover)
uniform vec2 uOffset;  // parallax offset, in image uv
vec2 sceneUv(vec2 s) {
  vec2 uv = 0.5 + (s - 0.5) * uScale;
  float d = texture2D(uDepth, uv).g;
  return uv + uOffset * (d - ${PIVOT.toFixed(2)});
}`;

const FRAG_BG = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uImage;
uniform float uExposure;
uniform vec3 uDark;
uniform vec4 uLights[${MAX_LIGHTS}]; // screen x, screen y, depth z, brightness
uniform vec3 uLightColor;
uniform vec2 uCss;                   // canvas size in css px
uniform vec4 uUnlit;                 // ellipse with no firefly light, image uv
${SCENE_UV}
void main() {
  vec2 uv = sceneUv(vUv);
  vec3 albedo = texture2D(uImage, uv).rgb;
  float depth = texture2D(uDepth, uv).r;
  // Same darkening as the flat version's gradient: 60% top, 40% middle, 80% bottom
  float g = vUv.y < 0.5 ? mix(0.6, 0.4, vUv.y * 2.0) : mix(0.4, 0.8, (vUv.y - 0.5) * 2.0);
  vec3 c = mix(albedo * uExposure, uDark, g);
  // Firefly light falling on the scene: strongest on surfaces at the firefly's depth
  // (skin, dress, suit), so a firefly beside the couple warms them, not the sky behind.
  float light = 0.0;
  for (int i = 0; i < ${MAX_LIGHTS}; i++) {
    vec4 l = uLights[i];
    vec2 d = (vUv - l.xy) * uCss;
    float r = 55.0 + l.z * 45.0;
    float f = max(0.0, 1.0 - dot(d, d) / (r * r));
    light += f * f * l.w * (1.0 - smoothstep(0.08, 0.3, abs(depth - l.z)));
  }
  // Soft-edged ellipse (in photo space, so it moves with the head) that gets no light
  float unlit = smoothstep(0.75, 1.0, length((uv - uUnlit.xy) / uUnlit.zw));
  // Multiplies the photo's own color only, so dark areas stay dark instead of turning orange
  c += uLightColor * light * albedo * 0.7 * unlit;
  gl_FragColor = vec4(c, 1.0);
}`;

const VERT_FLY = `
attribute vec3 aPos;     // screen x, screen y (0..1, y down), depth z
attribute float aBright;
attribute vec3 aColor;
uniform vec2 uOffsetS;   // parallax offset, in screen uv
uniform float uBaseSize; // device px
uniform float uMaxSize;
varying float vBright;
varying vec3 vColor;
varying float vBlur;
varying float vZ;
void main() {
  vec2 s = aPos.xy - uOffsetS * (aPos.z - ${PIVOT.toFixed(2)});
  gl_Position = vec4(s.x * 2.0 - 1.0, 1.0 - s.y * 2.0, 0.0, 1.0);
  vBlur = clamp(abs(aPos.z - ${FOCUS_Z.toFixed(2)}) * 1.8, 0.0, 1.0);
  float size = uBaseSize * (0.5 + aPos.z * 0.6) * (1.0 + vBlur * 0.7);
  gl_PointSize = min(size, uMaxSize);
  // A defocused firefly spreads the same light over a bigger disc
  vBright = aBright / (1.0 + vBlur * 1.2);
  vColor = aColor;
  vZ = aPos.z;
}`;

const FRAG_FLY = `
precision mediump float;
varying float vBright;
varying vec3 vColor;
varying float vBlur;
varying float vZ;
uniform vec2 uRes;
${SCENE_UV}
void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(p, p);
  if (r2 > 1.0) discard;
  // In focus: a small warm point in a tight glow. Out of focus: a faint soft disc.
  float core = exp(-r2 * mix(22.0, 5.0, vBlur));
  float halo = exp(-r2 * 6.0) * 0.4 * (1.0 - vBlur);
  float disc = smoothstep(1.0, 0.6, sqrt(r2)) * vBlur * 0.22;
  float a = (core + halo) * (1.0 - vBlur * 0.6) + disc;
  // Hidden behind anything nearer in the photo (the couple, the road)
  vec2 s = gl_FragCoord.xy / uRes;
  s.y = 1.0 - s.y;
  float scene = texture2D(uDepth, sceneUv(s)).r;
  float vis = 1.0 - smoothstep(vZ - 0.02, vZ + 0.04, scene);
  vec3 col = mix(vColor, vec3(1.0, 0.97, 0.88), core * 0.7 * (1.0 - vBlur));
  gl_FragColor = vec4(col * a * vBright * vis * 1.4, 1.0);
}`;

// Warm candlelight gold and champagne, to sit with the gold theme and the lamp light
const GLOW_COLORS = [
  [255, 206, 120], [255, 214, 140], [255, 228, 170], [240, 232, 160],
].map((c) => c.map((v) => v / 255));

const rand = (min: number, max: number) => min + Math.random() * (max - min);

type Phase = 'dark' | 'rise' | 'fade';

// Flight and glow adapted from TwinkleSparks (slower and softer), in screen uv plus a depth.
class Firefly {
  x = rand(0, 1);
  y = rand(0, 1);
  // 0.35 = far behind the couple, 0.8 = beside them, 1.05 = just in front of them
  z = rand(0.35, 1.05);
  zMin = 0.35;
  zMax = 1.05;
  color = GLOW_COLORS[Math.floor(Math.random() * GLOW_COLORS.length)];
  heading = rand(0, Math.PI * 2);
  turn = 0;
  speed = rand(4, 10);
  bob = rand(0, Math.PI * 2);
  zDrift = rand(0, Math.PI * 2);
  brightness = 0;
  peak = 1;
  phase: Phase = 'dark';
  timer = rand(0, 3);
  duration = 1;
  flashesLeft = 0;

  /** Pass a screen rect to keep this firefly around the couple, weaving just behind and in front of them. */
  constructor(home?: number[]) {
    if (!home) return;
    this.x = rand(home[0], home[2]);
    this.y = rand(home[1], home[3]);
    this.zMin = 0.72;
    this.zMax = 1.02;
    this.z = rand(this.zMin, this.zMax);
    this.timer = rand(0, 1.5);
  }

  update(dt: number, w: number, h: number, home?: number[]) {
    this.turn += rand(-1, 1) * 1.2 * dt;
    this.turn = Math.max(-0.6, Math.min(0.6, this.turn));
    this.heading += this.turn * dt;
    this.bob += dt * 0.9;
    this.zDrift += dt * 0.3;
    // Nearer fireflies cross the screen faster
    const v = this.speed * (0.4 + this.z * 0.6);
    this.x += (Math.cos(this.heading) * v * dt) / w;
    this.y += ((Math.sin(this.heading) * v - 3) * dt + Math.sin(this.bob) * 0.08) / h;
    this.z = Math.max(this.zMin, Math.min(this.zMax, this.z + Math.sin(this.zDrift) * 0.04 * dt));

    if (home) {
      // Outside the couple's area: turn back toward its centre
      if (this.x < home[0] || this.x > home[2] || this.y < home[1] || this.y > home[3]) {
        const want = Math.atan2(((home[1] + home[3]) / 2 - this.y) * h, ((home[0] + home[2]) / 2 - this.x) * w);
        const diff = Math.atan2(Math.sin(want - this.heading), Math.cos(want - this.heading));
        this.heading += diff * Math.min(1, dt * 1.5);
      }
    } else {
      const mx = 30 / w, my = 30 / h;
      if (this.x < -mx) this.x = 1 + mx;
      if (this.x > 1 + mx) this.x = -mx;
      if (this.y < -my) this.y = 1 + my;
      if (this.y > 1 + my) this.y = -my;
    }

    // Glow: dark pause -> slow swell -> long fade, like breathing (rarely twice)
    this.timer -= dt;
    if (this.phase === 'dark') {
      this.brightness = 0;
      if (this.timer <= 0) {
        if (this.flashesLeft === 0) this.flashesLeft = Math.random() < 0.1 ? 2 : 1;
        this.peak = rand(0.6, 1);
        this.phase = 'rise';
        this.timer = this.duration = rand(0.8, 1.5);
      }
    } else if (this.phase === 'rise') {
      const t = 1 - Math.max(0, this.timer) / this.duration;
      this.brightness = this.peak * t * t * (3 - 2 * t);
      if (this.timer <= 0) {
        this.phase = 'fade';
        this.timer = this.duration = rand(1.8, 3.2);
      }
    } else {
      const t = Math.max(0, this.timer) / this.duration;
      this.brightness = this.peak * Math.pow(t, 1.5);
      if (this.timer <= 0) {
        this.flashesLeft--;
        this.phase = 'dark';
        this.timer = this.flashesLeft > 0 ? rand(0.4, 0.8) : rand(1, this.zMin > 0.5 ? 2 : 3.5);
      }
    }
  }
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function compile(gl: WebGLRenderingContext, vert: string, frag: string) {
  const program = gl.createProgram()!;
  for (const [type, src] of [[gl.VERTEX_SHADER, vert], [gl.FRAGMENT_SHADER, frag]] as const) {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? 'shader');
    gl.attachShader(program, shader);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? 'link');
  return program;
}

function texture(gl: WebGLRenderingContext, unit: number, img: HTMLImageElement) {
  const tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  // Non-power-of-two images: WebGL 1 needs clamp and no mipmaps
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
}

export const DepthParallaxScene = memo(function DepthParallaxScene({ imageSrc, depthSrc, subject, unlit, onFail }: DepthParallaxSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onFailRef = useRef(onFail);
  useEffect(() => {
    onFailRef.current = onFail;
  }, [onFail]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
    if (!gl) {
      onFailRef.current();
      return;
    }

    let disposed = false;
    let animationFrameId: number | null = null;
    const cleanups: (() => void)[] = [];
    const fail = () => {
      if (!disposed) onFailRef.current();
    };

    // Capped lower than the 2D fireflies: every pixel samples the photo twice
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let cssW = 1, cssH = 1;
    let imageAspect = 16 / 9;
    const scale = [1, 1];
    const setSize = () => {
      cssW = canvas.clientWidth || 1;
      cssH = canvas.clientHeight || 1;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      const canvasAspect = cssW / cssH;
      scale[0] = canvasAspect < imageAspect ? canvasAspect / imageAspect : 1;
      scale[1] = canvasAspect < imageAspect ? 1 : imageAspect / canvasAspect;
    };
    const resizeObserver = new ResizeObserver(setSize);
    resizeObserver.observe(canvas);
    cleanups.push(() => resizeObserver.disconnect());

    // Parallax input: pointer on desktop, tilt on Android. When neither moves for a
    // moment, an idle drift takes over so the scene never sits still.
    // iOS only sends tilt after a permission prompt, so it gets the drift alone.
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let lastInputAt = -Infinity;
    const setTarget = (x: number, y: number) => {
      // A resting phone still reports tiny tilt jitter: only a real move counts as input
      if (Math.abs(x - target.x) + Math.abs(y - target.y) > 0.03) lastInputAt = performance.now();
      target.x = x;
      target.y = y;
    };
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      setTarget((e.clientX / window.innerWidth - 0.5) * 2, (e.clientY / window.innerHeight - 0.5) * 2);
    };
    let baseBeta: number | null = null;
    let baseGamma = 0;
    let lastTiltAt = 0;
    const clampUnit = (v: number) => Math.max(-1, Math.min(1, v));
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      const t = performance.now();
      if (baseBeta === null) {
        baseBeta = e.beta;
        baseGamma = e.gamma;
      } else {
        const k = Math.min(1, (t - lastTiltAt) / TILT_RECENTER_MS);
        baseBeta += (e.beta - baseBeta) * k;
        baseGamma += (e.gamma - baseGamma) * k;
      }
      lastTiltAt = t;
      setTarget(clampUnit((e.gamma - baseGamma) / TILT_RANGE), clampUnit((e.beta - baseBeta) / TILT_RANGE));
    };
    window.addEventListener('pointermove', onPointer);
    window.addEventListener('deviceorientation', onTilt);
    cleanups.push(() => {
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('deviceorientation', onTilt);
    });

    const onLost = (e: Event) => {
      e.preventDefault();
      fail();
    };
    canvas.addEventListener('webglcontextlost', onLost);
    cleanups.push(() => canvas.removeEventListener('webglcontextlost', onLost));

    gl.clearColor(DARK[0], DARK[1], DARK[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    Promise.all([loadImage(imageSrc), loadImage(depthSrc)]).then(([image, depth]) => {
      if (disposed) return;
      imageAspect = image.naturalWidth / image.naturalHeight;
      setSize();

      let bg: WebGLProgram, fly: WebGLProgram;
      try {
        bg = compile(gl, VERT_QUAD, FRAG_BG);
        fly = compile(gl, VERT_FLY, FRAG_FLY);
      } catch {
        fail();
        return;
      }
      texture(gl, 0, image);
      texture(gl, 1, depth);

      const quad = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

      // The couple's area on screen (object-cover crops the photo differently per screen)
      const home = [0, 0, 0, 0];
      const setHome = () => {
        for (let i = 0; i < 4; i++) home[i] = 0.5 + (subject[i] - 0.5) / scale[i % 2];
      };
      setHome();
      const homed = cssW < 768 ? 12 : MAX_LIGHTS;
      const count = homed + (cssW < 768 ? 30 : 48); // ambient fireflies, +20% (about +15% overall)
      const fireflies = Array.from({ length: count }, (_, i) => new Firefly(i < homed ? home : undefined));
      const lights = new Float32Array(MAX_LIGHTS * 4);
      // A little warmer than the glow colors: how the light reads on skin
      const lightColor = [1.0, 0.86, 0.65];
      // No ellipse: park one far outside the photo
      const unlitArea = unlit ?? [-10, -10, 1, 1];
      const STRIDE = 7; // x, y, z, brightness, r, g, b
      const flyData = new Float32Array(count * STRIDE);
      const flyBuffer = gl.createBuffer();

      const u = (p: WebGLProgram, name: string) => gl.getUniformLocation(p, name);
      const bgU = { image: u(bg, 'uImage'), depth: u(bg, 'uDepth'), scale: u(bg, 'uScale'), offset: u(bg, 'uOffset'), exposure: u(bg, 'uExposure'), dark: u(bg, 'uDark'), lights: u(bg, 'uLights'), lightColor: u(bg, 'uLightColor'), css: u(bg, 'uCss'), unlit: u(bg, 'uUnlit') };
      const flyU = { depth: u(fly, 'uDepth'), scale: u(fly, 'uScale'), offset: u(fly, 'uOffset'), offsetS: u(fly, 'uOffsetS'), res: u(fly, 'uRes'), baseSize: u(fly, 'uBaseSize'), maxSize: u(fly, 'uMaxSize') };
      const bgPos = gl.getAttribLocation(bg, 'aPos');
      const flyPos = gl.getAttribLocation(fly, 'aPos');
      const flyBright = gl.getAttribLocation(fly, 'aBright');
      const flyColor = gl.getAttribLocation(fly, 'aColor');
      const maxPoint = (gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE) as Float32Array)[1];

      let last = 0;
      let elapsed = 0;
      let idle = 1; // 0 = following the input, 1 = drifting
      const loop = (now: number) => {
        const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
        last = now;
        elapsed += dt;

        // Ease toward the input
        const k = 1 - Math.exp(-dt * 3);
        current.x += (target.x - current.x) * k;
        current.y += (target.y - current.y) * k;
        // After 1.5 s without input, fade the drift in; fade it out when input resumes
        const idleTarget = now - lastInputAt > 1500 ? 1 : 0;
        idle += (idleTarget - idle) * (1 - Math.exp(-dt * 1.2));
        // Two slow waves per axis (~16 s loop) so the drift wanders instead of repeating
        const driftX = Math.sin(elapsed * 0.38) * 0.75 + Math.sin(elapsed * 0.17 + 2) * 0.25;
        const driftY = Math.sin(elapsed * 0.31 + 1) * 0.6 + Math.sin(elapsed * 0.13) * 0.2;
        // Moderate: enough to feel the depth, below the point where the stretched edges show
        // Same 30 px on desktop; on phones the input swing is now larger than the idle drift
        const amp = Math.min(30, 0.028 * Math.max(cssW, cssH)); // css px at full input
        const idleAmp = Math.min(28, 0.022 * Math.max(cssW, cssH)); // css px at full drift
        const cap = Math.max(amp, idleAmp) * 1.15;
        const pxX = Math.max(-cap, Math.min(cap, current.x * amp * (1 - idle * 0.5) + driftX * idleAmp * idle));
        const pxY = Math.max(-cap, Math.min(cap, current.y * amp * (1 - idle * 0.5) + driftY * idleAmp * idle));
        const offS = [pxX / cssW, pxY / cssH];
        const off = [offS[0] * scale[0], offS[1] * scale[1]];

        setHome();
        for (let i = 0; i < count; i++) {
          const f = fireflies[i];
          f.update(dt, cssW, cssH, i < homed ? home : undefined);
          const o = i * STRIDE;
          flyData[o] = f.x;
          flyData[o + 1] = f.y;
          flyData[o + 2] = f.z;
          flyData[o + 3] = f.brightness;
          flyData[o + 4] = f.color[0];
          flyData[o + 5] = f.color[1];
          flyData[o + 6] = f.color[2];
          if (i < homed) {
            // Where the firefly is drawn, after its own parallax shift
            lights[i * 4] = f.x - offS[0] * (f.z - PIVOT);
            lights[i * 4 + 1] = f.y - offS[1] * (f.z - PIVOT);
            lights[i * 4 + 2] = f.z;
            lights[i * 4 + 3] = f.brightness;
          }
        }

        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.disable(gl.BLEND);
        gl.useProgram(bg);
        gl.uniform1i(bgU.image, 0);
        gl.uniform1i(bgU.depth, 1);
        gl.uniform2f(bgU.scale, scale[0], scale[1]);
        gl.uniform2f(bgU.offset, off[0], off[1]);
        gl.uniform1f(bgU.exposure, 0.85);
        gl.uniform3f(bgU.dark, DARK[0], DARK[1], DARK[2]);
        gl.uniform4fv(bgU.lights, lights);
        gl.uniform3f(bgU.lightColor, lightColor[0], lightColor[1], lightColor[2]);
        gl.uniform2f(bgU.css, cssW, cssH);
        gl.uniform4f(bgU.unlit, unlitArea[0], unlitArea[1], unlitArea[2], unlitArea[3]);
        gl.bindBuffer(gl.ARRAY_BUFFER, quad);
        gl.enableVertexAttribArray(bgPos);
        gl.vertexAttribPointer(bgPos, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.disableVertexAttribArray(bgPos);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE); // light adds up, like the 2D version's screen blend
        gl.useProgram(fly);
        gl.uniform1i(flyU.depth, 1);
        gl.uniform2f(flyU.scale, scale[0], scale[1]);
        gl.uniform2f(flyU.offset, off[0], off[1]);
        gl.uniform2f(flyU.offsetS, offS[0], offS[1]);
        gl.uniform2f(flyU.res, canvas.width, canvas.height);
        gl.uniform1f(flyU.baseSize, 26 * dpr);
        gl.uniform1f(flyU.maxSize, maxPoint);
        gl.bindBuffer(gl.ARRAY_BUFFER, flyBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flyData, gl.DYNAMIC_DRAW);
        const B = Float32Array.BYTES_PER_ELEMENT;
        gl.enableVertexAttribArray(flyPos);
        gl.vertexAttribPointer(flyPos, 3, gl.FLOAT, false, STRIDE * B, 0);
        gl.enableVertexAttribArray(flyBright);
        gl.vertexAttribPointer(flyBright, 1, gl.FLOAT, false, STRIDE * B, 3 * B);
        gl.enableVertexAttribArray(flyColor);
        gl.vertexAttribPointer(flyColor, 3, gl.FLOAT, false, STRIDE * B, 4 * B);
        gl.drawArrays(gl.POINTS, 0, count);
        gl.disableVertexAttribArray(flyPos);
        gl.disableVertexAttribArray(flyBright);
        gl.disableVertexAttribArray(flyColor);

        animationFrameId = requestAnimationFrame(loop);
      };

      // Run only while the canvas is on screen and the tab is visible
      let onScreen = true;
      const sync = () => {
        const shouldRun = onScreen && document.visibilityState === 'visible';
        if (shouldRun && animationFrameId === null) {
          last = 0;
          animationFrameId = requestAnimationFrame(loop);
        } else if (!shouldRun && animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
      };
      const observer = new IntersectionObserver(([entry]) => {
        onScreen = entry.isIntersecting;
        sync();
      });
      observer.observe(canvas);
      document.addEventListener('visibilitychange', sync);
      cleanups.push(() => {
        observer.disconnect();
        document.removeEventListener('visibilitychange', sync);
      });
      sync();
    }, fail);

    return () => {
      disposed = true;
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
      cleanups.forEach((c) => c());
    };
  }, [imageSrc, depthSrc, subject, unlit]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
});
