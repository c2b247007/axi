import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { access, cp, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, extname, join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { once } from "node:events";

import {
  buildTimestampedName,
  expandViewportToFitClip,
} from "../src/social-video.js";

type Options = {
  mp4Fps: number;
  gifFps: number;
  holdFinalMs: number;
  width: number;
  height: number;
  outputDir: string;
  name: string;
  chromeBin: string;
  skipGif: boolean;
  keepFrames: boolean;
};

type JsonTarget = {
  id: string;
  title: string;
  type: string;
  url: string;
  webSocketDebuggerUrl?: string;
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../..");

function parseArgs(argv: string[]): Options {
  const options: Options = {
    mp4Fps: 30,
    gifFps: 10,
    holdFinalMs: 1200,
    width: 1600,
    height: 1100,
    outputDir: resolve(repoRoot, "docs/social/rendered"),
    name: "race",
    chromeBin:
      process.env.CHROME_BIN ??
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    skipGif: false,
    keepFrames: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--mp4-fps" && next) {
      options.mp4Fps = Number(next);
      index += 1;
    } else if (arg === "--gif-fps" && next) {
      options.gifFps = Number(next);
      index += 1;
    } else if (arg === "--hold-final-ms" && next) {
      options.holdFinalMs = Number(next);
      index += 1;
    } else if (arg === "--width" && next) {
      options.width = Number(next);
      index += 1;
    } else if (arg === "--height" && next) {
      options.height = Number(next);
      index += 1;
    } else if (arg === "--output-dir" && next) {
      options.outputDir = resolve(process.cwd(), next);
      index += 1;
    } else if (arg === "--name" && next) {
      options.name = next;
      index += 1;
    } else if (arg === "--chrome-bin" && next) {
      options.chromeBin = next;
      index += 1;
    } else if (arg === "--skip-gif") {
      options.skipGif = true;
    } else if (arg === "--keep-frames") {
      options.keepFrames = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!Number.isFinite(options.mp4Fps) || options.mp4Fps <= 0) {
    throw new Error(`Invalid --mp4-fps value: ${options.mp4Fps}`);
  }

  if (!Number.isFinite(options.gifFps) || options.gifFps <= 0) {
    throw new Error(`Invalid --gif-fps value: ${options.gifFps}`);
  }

  return options;
}

function getMimeType(filePath: string): string {
  const extension = extname(filePath);

  if (extension === ".html") return "text/html; charset=utf-8";
  if (extension === ".css") return "text/css; charset=utf-8";
  if (extension === ".js") return "text/javascript; charset=utf-8";
  if (extension === ".png") return "image/png";
  if (extension === ".svg") return "image/svg+xml";
  return "application/octet-stream";
}

async function getFreePort(): Promise<number> {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();

  if (!address || typeof address === "string") {
    server.close();
    throw new Error("Could not allocate a port");
  }

  const { port } = address;
  server.close();
  await once(server, "close");
  return port;
}

async function startStaticServer() {
  const docsRoot = resolve(repoRoot, "docs");
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", "http://127.0.0.1");
      let pathname = decodeURIComponent(url.pathname);
      if (pathname === "/") pathname = "/social/race.html";

      const filePath = resolve(docsRoot, `.${pathname}`);
      if (!filePath.startsWith(docsRoot)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }

      await access(filePath);
      res.writeHead(200, { "content-type": getMimeType(filePath) });
      createReadStream(filePath).pipe(res);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  });

  const port = await getFreePort();
  server.listen(port, "127.0.0.1");
  await once(server, "listening");

  return {
    port,
    close: async () => {
      server.close();
      await once(server, "close");
    },
  };
}

async function waitForJson<T>(url: string, predicate: (value: T) => boolean) {
  const deadline = Date.now() + 15_000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      const payload = (await response.json()) as T;
      if (predicate(payload)) return payload;
    } catch {
      // Wait for the endpoint to come up.
    }

    await new Promise((resolveTimer) => setTimeout(resolveTimer, 100));
  }

  throw new Error(`Timed out waiting for ${url}`);
}

class CdpClient {
  private ws: WebSocket;
  private nextId = 1;
  private pending = new Map<
    number,
    { resolve: (value: any) => void; reject: (error: Error) => void }
  >();
  private eventWaiters = new Map<string, Array<(params: any) => void>>();

  constructor(wsUrl: string) {
    this.ws = new WebSocket(wsUrl);
  }

  async connect() {
    await new Promise<void>((resolveConnect, rejectConnect) => {
      this.ws.addEventListener("open", () => resolveConnect(), { once: true });
      this.ws.addEventListener(
        "error",
        () => rejectConnect(new Error("Failed to connect to Chrome DevTools")),
        { once: true },
      );
    });

    this.ws.addEventListener("message", (event) => {
      const payload = JSON.parse(String(event.data));

      if (typeof payload.id === "number") {
        const pending = this.pending.get(payload.id);
        if (!pending) return;
        this.pending.delete(payload.id);

        if (payload.error) {
          pending.reject(new Error(payload.error.message));
        } else {
          pending.resolve(payload.result);
        }
        return;
      }

      if (payload.method) {
        const waiters = this.eventWaiters.get(payload.method) ?? [];
        this.eventWaiters.delete(payload.method);
        waiters.forEach((resolveEvent) => resolveEvent(payload.params));
      }
    });
  }

  send<T>(method: string, params: Record<string, unknown> = {}) {
    const id = this.nextId;
    this.nextId += 1;
    this.ws.send(JSON.stringify({ id, method, params }));

    return new Promise<T>((resolveSend, rejectSend) => {
      this.pending.set(id, { resolve: resolveSend, reject: rejectSend });
    });
  }

  waitFor(method: string) {
    return new Promise<any>((resolveEvent) => {
      const waiters = this.eventWaiters.get(method) ?? [];
      waiters.push(resolveEvent);
      this.eventWaiters.set(method, waiters);
    });
  }

  close() {
    this.ws.close();
  }
}

async function runProcess(command: string, args: string[]) {
  const child = spawn(command, args, { stdio: "inherit" });
  const [code] = (await once(child, "exit")) as [number | null];
  if (code !== 0) {
    throw new Error(`${command} exited with code ${code}`);
  }
}

async function startChrome(options: Options, debugPort: number) {
  await access(options.chromeBin);

  const chrome = spawn(
    options.chromeBin,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--mute-audio",
      `--remote-debugging-port=${debugPort}`,
      `--window-size=${options.width},${options.height}`,
      "about:blank",
    ],
    {
      stdio: "ignore",
    },
  );

  return chrome;
}

async function settlePage(cdp: CdpClient) {
  await cdp.send("Runtime.evaluate", {
    expression:
      "new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve(true))))",
    awaitPromise: true,
    returnByValue: true,
  });
}

async function evaluateNumber(cdp: CdpClient, expression: string) {
  const result = await cdp.send<{ result: { value: number } }>(
    "Runtime.evaluate",
    {
      expression,
      returnByValue: true,
    },
  );
  return result.result.value;
}

async function evaluateClip(cdp: CdpClient) {
  const result = await cdp.send<{
    result: {
      value: {
        x: number;
        y: number;
        width: number;
        height: number;
        scale: number;
      };
    };
  }>("Runtime.evaluate", {
    expression: `(() => {
      const poster = document.querySelector(".poster");
      const frame = document.querySelector(".frame");
      if (!poster) throw new Error("Missing .poster element");
      if (!frame) throw new Error("Missing .frame element");
      const posterStyle = getComputedStyle(poster);
      const frameRect = frame.getBoundingClientRect();
      const paddingTop = parseFloat(posterStyle.paddingTop) || 0;
      const paddingRight = parseFloat(posterStyle.paddingRight) || 0;
      const paddingBottom = parseFloat(posterStyle.paddingBottom) || 0;
      const paddingLeft = parseFloat(posterStyle.paddingLeft) || 0;
      return {
        x: Math.max(0, Math.floor(frameRect.left - paddingLeft)),
        y: Math.max(0, Math.floor(frameRect.top - paddingTop)),
        width: Math.ceil(frameRect.width + paddingLeft + paddingRight),
        height: Math.ceil(frameRect.height + paddingTop + paddingBottom),
        scale: 1,
      };
    })()`,
    returnByValue: true,
  });

  return result.result.value;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const captureFps = Math.max(options.mp4Fps, options.gifFps);
  const outputName = buildTimestampedName(options.name);
  await mkdir(options.outputDir, { recursive: true });

  const server = await startStaticServer();
  const debugPort = await getFreePort();
  const chrome = await startChrome(options, debugPort);
  const tempDir = await mkdtemp(join(tmpdir(), "axi-social-render-"));
  const framesDir = join(tempDir, "frames");
  await mkdir(framesDir, { recursive: true });

  try {
    const targets = await waitForJson<JsonTarget[]>(
      `http://127.0.0.1:${debugPort}/json/list`,
      (payload) =>
        payload.some(
          (target) =>
            target.type === "page" && Boolean(target.webSocketDebuggerUrl),
        ),
    );
    const pageTarget = targets.find(
      (target) =>
        target.type === "page" && Boolean(target.webSocketDebuggerUrl),
    );

    if (!pageTarget?.webSocketDebuggerUrl) {
      throw new Error("Could not find a debuggable page target");
    }

    const cdp = new CdpClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: options.width,
      height: options.height,
      deviceScaleFactor: 1,
      mobile: false,
    });

    const pageUrl = `http://127.0.0.1:${server.port}/social/race.html?capture=1`;
    const loadEvent = cdp.waitFor("Page.loadEventFired");
    await cdp.send("Page.navigate", { url: pageUrl });
    await loadEvent;
    await settlePage(cdp);
    let clip = await evaluateClip(cdp);
    const expandedViewport = expandViewportToFitClip(
      { width: options.width, height: options.height },
      clip,
    );

    if (
      expandedViewport.width !== options.width ||
      expandedViewport.height !== options.height
    ) {
      await cdp.send("Emulation.setDeviceMetricsOverride", {
        width: expandedViewport.width,
        height: expandedViewport.height,
        deviceScaleFactor: 1,
        mobile: false,
      });
      await settlePage(cdp);
      clip = await evaluateClip(cdp);
    }

    const maxLaneDuration = await evaluateNumber(
      cdp,
      "window.__AXI_RACE_CAPTURE__.maxLaneDuration",
    );

    const totalDuration = maxLaneDuration + options.holdFinalMs;
    const frameDuration = 1000 / captureFps;
    const frameCount = Math.floor(totalDuration / frameDuration) + 1;

    for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
      const elapsed = Math.min(frameIndex * frameDuration, maxLaneDuration);
      await cdp.send("Runtime.evaluate", {
        expression: `window.__AXI_RACE_CAPTURE__.setElapsedMs(${Math.round(elapsed)})`,
      });
      await settlePage(cdp);

      const screenshot = await cdp.send<{ data: string }>(
        "Page.captureScreenshot",
        {
          format: "png",
          captureBeyondViewport: true,
          clip,
        },
      );
      const framePath = join(
        framesDir,
        `${String(frameIndex).padStart(5, "0")}.png`,
      );
      await writeFile(framePath, screenshot.data, "base64");

      if (frameIndex % 30 === 0 || frameIndex === frameCount - 1) {
        console.log(`Captured frame ${frameIndex + 1}/${frameCount}`);
      }
    }

    const mp4Path = join(options.outputDir, `${outputName}.mp4`);
    await runProcess("/opt/homebrew/bin/ffmpeg", [
      "-y",
      "-framerate",
      String(captureFps),
      "-i",
      join(framesDir, "%05d.png"),
      "-vf",
      `fps=${options.mp4Fps},pad=ceil(iw/2)*2:ceil(ih/2)*2:0:0`,
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      mp4Path,
    ]);

    if (!options.skipGif) {
      const palettePath = join(tempDir, "palette.png");
      const gifPath = join(options.outputDir, `${outputName}.gif`);

      await runProcess("/opt/homebrew/bin/ffmpeg", [
        "-y",
        "-framerate",
        String(captureFps),
        "-i",
        join(framesDir, "%05d.png"),
        "-frames:v",
        "1",
        "-update",
        "1",
        "-vf",
        "palettegen=stats_mode=diff",
        palettePath,
      ]);

      await runProcess("/opt/homebrew/bin/ffmpeg", [
        "-y",
        "-framerate",
        String(captureFps),
        "-i",
        join(framesDir, "%05d.png"),
        "-i",
        palettePath,
        "-lavfi",
        `fps=${options.gifFps}[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5`,
        gifPath,
      ]);
    }

    if (options.keepFrames) {
      const savedFramesDir = join(options.outputDir, `${outputName}-frames`);
      await rm(savedFramesDir, { recursive: true, force: true });
      await cp(framesDir, savedFramesDir, { recursive: true });
    }

    cdp.close();
    console.log(`Wrote ${mp4Path}`);
    if (!options.skipGif) {
      console.log(`Wrote ${join(options.outputDir, `${outputName}.gif`)}`);
    }
  } finally {
    chrome.kill("SIGKILL");
    await server.close();
    if (!options.keepFrames) {
      await rm(tempDir, { recursive: true, force: true });
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
