// Renders marketing/video/reel.html.
//   node marketing/video/render.mjs stills 0.6 3.2 9.5   -> out/still-<t>.png (review frames)
//   node marketing/video/render.mjs video [--fast]       -> out/reel.mp4 (H.264 + AAC)
// Motion blur follows the motion-broll engine: K subframes per frame across a 180° shutter,
// averaged with ffmpeg tmix (--fast renders 1 subframe). Sound effects are synthesised from the
// cue list the scene exposes as window.SFX, so audio and picture can never drift apart.
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ffmpeg from "ffmpeg-static";
import { chromium } from "playwright";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "out");
const FPS = 30;
const RATE = 44100;
mkdirSync(OUT, { recursive: true });

const [mode = "video", ...args] = process.argv.slice(2);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(pathToFileURL(path.join(HERE, "reel.html")).href + "?render");
await page.evaluate(() => document.fonts.ready);
const { T, SFX } = await page.evaluate(() => ({ T: window.DURATION, SFX: window.SFX }));

if (mode === "stills") {
  for (const t of args.map(Number)) {
    await page.evaluate((t) => window.seek(t), t);
    const file = path.join(OUT, `still-${t.toFixed(2)}.png`);
    await page.screenshot({ path: file });
    console.log("still", file);
  }
} else {
  const fast = args.includes("--fast");
  const K = fast ? 1 : 4;
  const silent = path.join(OUT, "reel-silent.mp4");
  await renderVideo(silent, K);
  const wav = path.join(OUT, "sfx.wav");
  writeFileSync(wav, synth(SFX, T));
  await run(["-y", "-loglevel", "error", "-i", silent, "-i", wav, "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", path.join(OUT, "reel.mp4")]);
  console.log("rendered", path.join(OUT, "reel.mp4"), `${T}s`, fast ? "(fast)" : "(motion blur)");
}
await browser.close();
if (errors.length) console.error("page errors:", errors);

async function renderVideo(out, K) {
  const N = Math.round(T * FPS);
  const sub = 1 / (FPS * 2 * K);
  const vf = K > 1 ? `tmix=frames=${K}:weights='${Array(K).fill(1).join(" ")}',select='eq(mod(n\\,${K})\\,${K - 1})',setpts=N/(${FPS})/TB` : "null";
  const ff = spawn(ffmpeg, ["-loglevel", "error", "-y", "-f", "image2pipe", "-framerate", String(FPS * K), "-c:v", "png", "-i", "-",
    "-vf", vf, "-r", String(FPS), "-c:v", "libx264", "-crf", "16", "-preset", "medium", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out]);
  ff.stderr.on("data", (d) => process.stderr.write(d));
  const done = new Promise((r) => ff.on("close", r));
  for (let f = 0; f < N; f++) {
    for (let k = 0; k < K; k++) {
      const t = Math.max(0, f / FPS + (K > 1 ? (k - (K - 1) / 2) * sub : 0));
      await page.evaluate((t) => window.seek(t), t);
      const buf = await page.screenshot({ type: "png" });
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
    }
    if (f % 60 === 0) process.stdout.write(`frame ${f}/${N}\r`);
  }
  ff.stdin.end();
  await done;
}

function run(argv) {
  return new Promise((resolve, reject) => {
    const p = spawn(ffmpeg, argv, { stdio: "inherit" });
    p.on("close", (c) => (c === 0 ? resolve() : reject(new Error(`ffmpeg exited ${c}`))));
  });
}

// ---------------- sound design ----------------
// Small synthesised palette: pop (bubbles, pills), tick (UI highlight), tap (button), whoosh
// (camera moves and scene changes), chime (pin drop, end card), over a quiet ambient pad.
function synth(cues, duration) {
  const n = Math.ceil(duration * RATE);
  const L = new Float32Array(n), R = new Float32Array(n);
  let seed = 7;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
  const add = (i, v, pan) => {
    if (i < 0 || i >= n) return;
    L[i] += v * Math.cos(((pan + 1) * Math.PI) / 4);
    R[i] += v * Math.sin(((pan + 1) * Math.PI) / 4);
  };

  // ambient pad: Amaj9-ish, slow swell, fades in and out
  const notes = [110, 164.81, 220, 277.18, 329.63, 493.88];
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    const env = Math.min(1, t / 2.5) * Math.min(1, (duration - t) / 2.5);
    let v = 0;
    notes.forEach((f, k) => {
      const lfo = 0.6 + 0.4 * Math.sin(2 * Math.PI * (0.07 + k * 0.013) * t + k);
      v += Math.sin(2 * Math.PI * f * t + 0.3 * Math.sin(2 * Math.PI * 0.2 * t)) * lfo / (k + 2);
    });
    add(i, v * 0.045 * env, Math.sin(t * 0.2) * 0.3);
  }

  for (const { t, type, gain = 1, pan = 0 } of cues) {
    const i0 = Math.round(t * RATE);
    if (type === "pop") {
      const len = 0.16 * RATE;
      for (let j = 0; j < len; j++) {
        const s = j / RATE, f = 380 + 620 * Math.exp(-s * 38);
        const env = Math.min(1, s / 0.003) * Math.exp(-s * 26);
        add(i0 + j, (Math.sin(2 * Math.PI * f * s) * 0.5 + rnd() * 0.04 * Math.exp(-s * 300)) * env * gain * 0.55, pan);
      }
    } else if (type === "tick") {
      const len = 0.05 * RATE;
      for (let j = 0; j < len; j++) {
        const s = j / RATE;
        add(i0 + j, Math.sin(2 * Math.PI * 2400 * s) * Math.exp(-s * 90) * gain * 0.25, pan);
      }
    } else if (type === "tap") {
      const len = 0.09 * RATE;
      let lp = 0;
      for (let j = 0; j < len; j++) {
        const s = j / RATE, x = rnd();
        lp += 0.35 * (x - lp);
        add(i0 + j, ((x - lp) * 0.6 * Math.exp(-s * 120) + Math.sin(2 * Math.PI * 180 * s) * Math.exp(-s * 40) * 0.7) * gain * 0.6, pan);
      }
    } else if (type === "whoosh") {
      // filtered noise; cutoff sweeps up then down, pan travels across the stereo field
      const a = 0.28, b = 0.42, len = (a + b) * RATE;
      let lp1 = 0, lp2 = 0;
      for (let j = 0; j < len; j++) {
        const s = j / RATE;
        const env = s < a ? Math.pow(s / a, 2) : Math.pow(1 - (s - a) / b, 2.2);
        const cut = 0.02 + 0.22 * Math.sin(Math.PI * Math.min(1, s / (a + b)));
        const x = rnd();
        lp1 += cut * (x - lp1);
        lp2 += cut * (lp1 - lp2);
        const p = Math.max(-1, Math.min(1, pan + (s / (a + b) - 0.5) * 1.2));
        add(i0 - Math.round(a * RATE) + j, lp2 * 3.2 * env * gain * 0.55, p);
      }
    } else if (type === "chime") {
      const len = 1.8 * RATE;
      const partials = [[880, 1], [1320.5, 0.5], [1760.8, 0.35], [2641, 0.15]];
      for (let j = 0; j < len; j++) {
        const s = j / RATE;
        let v = 0;
        for (const [f, amp] of partials) v += Math.sin(2 * Math.PI * f * s) * amp * Math.exp(-s * (2.2 + f / 1400));
        add(i0 + j, v * Math.min(1, s / 0.004) * gain * 0.22, pan + 0.15 * Math.sin(s * 3));
      }
    }
  }

  // soft limiter + 16-bit stereo WAV
  const buf = Buffer.alloc(44 + n * 4);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write("WAVE", 8);
  buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(RATE, 24); buf.writeUInt32LE(RATE * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
  buf.write("data", 36); buf.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.round(Math.tanh(L[i] * 1.2) * 32000), 44 + i * 4);
    buf.writeInt16LE(Math.round(Math.tanh(R[i] * 1.2) * 32000), 46 + i * 4);
  }
  return buf;
}
