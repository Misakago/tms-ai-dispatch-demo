// 逐帧确定性录制：虚拟时钟 + CDP 截图 + ffmpeg 合成
// 用法：node record.mjs [--fps 60] [--scale 1.3333] [--q 92] [--out out.mp4] [--max 0] [--snap 0]
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d }
const FPS = +arg('fps', 60), SCALE = +arg('scale', 4 / 3), Q = +arg('q', 92)
const DRY = process.argv.includes('--dry')
const OUT = arg('out', 'out/tms-ai-dispatch-demo.mp4'), MAX = +arg('max', 0), SNAP = +arg('snap', 0)
const PORT = 4173
mkdirSync('out', { recursive: true })
if (SNAP) mkdirSync('out/snap', { recursive: true })

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 1500))
process.on('exit', () => server.kill())
process.on('uncaughtException', (e) => { console.error(e); server.kill(); process.exit(1) })

const VCLOCK = `(() => {
  let now = 0; const t0 = Date.now(); let tid = 1, rid = 1
  const timers = new Map(), rafs = new Map()
  performance.now = () => now
  Date.now = () => t0 + now
  window.setTimeout = (fn, ms = 0, ...a) => { const id = tid++; timers.set(id, { at: now + Math.max(0, +ms || 0), fn, a, iv: 0 }); return id }
  window.setInterval = (fn, ms = 0, ...a) => { const iv = Math.max(1, +ms || 0); const id = tid++; timers.set(id, { at: now + iv, fn, a, iv }); return id }
  window.clearTimeout = window.clearInterval = (id) => { timers.delete(id) }
  window.requestAnimationFrame = (fn) => { const id = rid++; rafs.set(id, fn); return id }
  window.cancelAnimationFrame = (id) => { rafs.delete(id) }
  delete Element.prototype.animate
  const tick = () => new Promise((r) => { const c = new MessageChannel(); c.port1.onmessage = () => r(); c.port2.postMessage(0) })
  window.__advance = async (dt) => {
    const target = now + dt
    for (let guard = 0; guard < 500; guard++) {
      let best = null
      for (const [id, t] of timers) if (t.at <= target && (!best || t.at < best[1].at || (t.at === best[1].at && id < best[0]))) best = [id, t]
      if (!best) break
      const [id, t] = best
      now = Math.max(now, t.at)
      if (t.iv) t.at += t.iv; else timers.delete(id)
      try { typeof t.fn === 'function' ? t.fn(...t.a) : 0 } catch (e) { console.error(e) }
      await Promise.resolve(); await tick()
    }
    now = target
    for (let i = 0; i < 3; i++) await tick()
    const cbs = [...rafs.values()]; rafs.clear()
    for (const cb of cbs) { try { cb(now) } catch (e) { console.error(e) } }
    await tick()
    return now
  }
})()`

const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--force-color-profile=srgb', '--font-render-hinting=none', '--hide-scrollbars'] })
const page = await browser.newPage({ viewport: { width: 1440, height: 810 }, deviceScaleFactor: SCALE })
page.on('console', (m) => { if (m.type() === 'error') console.log('[page]', m.text()) })
page.on('pageerror', (e) => console.log('[pageerror]', e.message))
await page.addInitScript(VCLOCK)
await page.goto(`http://localhost:${PORT}/`)
// 虚拟时钟接管了 rAF/setTimeout，这里在 Node 侧轮询（字体在真实时间里加载）
for (let i = 0; ; i++) {
  const ok = await page.evaluate(() => window.__ctlReady === true && document.fonts.status === 'loaded' && document.fonts.check('24px "Material Symbols Outlined"'))
  if (ok) break
  if (i > 300) throw new Error('页面未就绪')
  await new Promise((r) => setTimeout(r, 100))
}
await new Promise((r) => setTimeout(r, 800))
await page.evaluate(() => { window.__startDemo() })

const cdp = await page.context().newCDPSession(page)
const W = Math.round(1440 * SCALE), H = Math.round(810 * SCALE)
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
  '-vf', `scale=${W - (W % 2)}:${H - (H % 2)}:flags=lanczos:in_range=pc:out_range=tv,format=yuv420p`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-tune', 'animation', '-r', String(FPS), '-movflags', '+faststart', OUT], { stdio: ['pipe', 'inherit', 'inherit'] })

const dt = 1000 / FPS
let f = 0, t0 = Date.now()
while (true) {
  await page.evaluate((d) => window.__advance(d), dt)
  if (DRY) { f++; if (f % FPS === 0 && await page.evaluate(() => !!window.__demoDone)) break; continue }
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: Q, optimizeForSpeed: true })
  const buf = Buffer.from(data, 'base64')
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r))
  if (SNAP && f % SNAP === 0) writeFileSync(`out/snap/${String(f).padStart(6, '0')}.jpg`, buf)
  f++
  if (f % (FPS * 10) === 0) {
    const st = await page.evaluate(() => ({ done: !!window.__demoDone, err: window.__demoError || '' }))
    process.stdout.write(`\r${(f / FPS).toFixed(0)}s 视频 · 用时 ${((Date.now() - t0) / 1000).toFixed(0)}s   `)
    if (st.err) console.log('\n脚本错误:', st.err)
  }
  if (MAX && f >= MAX) break
  if (f % FPS === 0 && await page.evaluate(() => !!window.__demoDone)) break
}
writeFileSync('out/timeline.json', JSON.stringify(await page.evaluate(() => window.__caps), null, 1))
ff.stdin.end()
await new Promise((r) => ff.on('close', r))
await browser.close()
server.kill()
console.log(`\n完成：${OUT} · ${f} 帧 · ${(f / FPS).toFixed(1)}s`)
