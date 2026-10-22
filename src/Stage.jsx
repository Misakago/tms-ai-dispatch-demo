import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import App from './App.jsx'
import { Icon, EASE } from './ui.jsx'

export const W = 1440, H = 810
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const CAM_EASE = [0.65, 0, 0.35, 1]

// 舞台控制器：供 director 脚本调用
export const ctl = {}

export default function Stage() {
  const camX = useMotionValue(0), camY = useMotionValue(0), camS = useMotionValue(1)
  const appRadius = useMotionValue(0)
  const curX = useMotionValue(W * 0.62), curY = useMotionValue(H * 0.7), curS = useMotionValue(1), curO = useMotionValue(0)
  const sx = useTransform(() => camX.get() + curX.get() * camS.get())
  const sy = useTransform(() => camY.get() + curY.get() * camS.get())
  const hlX = useMotionValue(0), hlY = useMotionValue(0), hlW = useMotionValue(0), hlH = useMotionValue(0), hlO = useMotionValue(0)
  const [caption, setCaption] = useState(null)
  const [chapter, setChapter] = useState(null)
  const [ripples, setRipples] = useState([])
  const [scene, setScene] = useState('intro') // intro | app | outro
  const [progress, setProgress] = useState(0)
  const layer = useRef(null)

  useEffect(() => {
    const appRect = (el) => {
      const r = el.getBoundingClientRect(), s = camS.get()
      return { x: (r.left - camX.get()) / s, y: (r.top - camY.get()) / s, w: r.width / s, h: r.height / s }
    }
    const q = (id) => document.querySelector(`[data-demo="${id}"]`)
    Object.assign(ctl, {
      q, appRect, sleep,
      async waitFor(id, timeout = 15000) {
        const t0 = performance.now()
        while (!q(id)) { if (performance.now() - t0 > timeout) throw new Error('waitFor ' + id); await sleep(50) }
        await sleep(60)
        return q(id)
      },
      async waitGone(id) { while (q(id)) await sleep(50) },
      caption(text, sub) { (window.__caps ||= []).push({ t: performance.now(), text, sub }); setCaption(text ? { text, sub } : null) },
      chapterOn(c) { (window.__caps ||= []).push({ t: performance.now(), chapter: c }); setChapter(c) }, chapterOff() { setChapter(null) },
      setScene, setProgress,
      async camera({ x = 0, y = 0, s = 1, dur = 1.2, radius } = {}) {
        const a = [animate(camX, x, { duration: dur, ease: CAM_EASE }), animate(camY, y, { duration: dur, ease: CAM_EASE }), animate(camS, s, { duration: dur, ease: CAM_EASE })]
        if (radius !== undefined) a.push(animate(appRadius, radius, { duration: dur, ease: CAM_EASE }))
        await Promise.all(a)
      },
      // 把元素（或多个元素的并集）放大居中
      async focus(ids, { s = 1.35, dur = 1.1, dy = -30 } = {}) {
        const list = (Array.isArray(ids) ? ids : [ids]).map(q).filter(Boolean)
        const rs = list.map(appRect)
        const x0 = Math.min(...rs.map((r) => r.x)), y0 = Math.min(...rs.map((r) => r.y))
        const x1 = Math.max(...rs.map((r) => r.x + r.w)), y1 = Math.max(...rs.map((r) => r.y + r.h))
        const fit = Math.min((W - 140) / (x1 - x0), (H - 220) / (y1 - y0))
        const sc = Math.max(1, Math.min(s, fit))
        const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2
        let x = W / 2 - cx * sc, y = H / 2 + dy - cy * sc
        x = Math.min(0, Math.max(W - W * sc, x)); y = Math.min(0, Math.max(H - H * sc, y))
        await ctl.camera({ x, y, s: sc, dur })
      },
      async unfocus(dur = 1.0) { await ctl.camera({ x: 0, y: 0, s: 1, dur }) },
      async hl(ids, pad = 8) {
        if (!ids) { await animate(hlO, 0, { duration: 0.35 }); return }
        const rs = (Array.isArray(ids) ? ids : [ids]).map(q).filter(Boolean).map(appRect)
        const x0 = Math.min(...rs.map((r) => r.x)) - pad, y0 = Math.min(...rs.map((r) => r.y)) - pad
        const x1 = Math.max(...rs.map((r) => r.x + r.w)) + pad, y1 = Math.max(...rs.map((r) => r.y + r.h)) + pad
        const first = hlO.get() < 0.05
        const o = { duration: first ? 0 : 0.6, ease: EASE }
        animate(hlX, x0, o); animate(hlY, y0, o); animate(hlW, x1 - x0, o); animate(hlH, y1 - y0, o)
        await animate(hlO, 1, { duration: 0.4 })
      },
      async scrollTo(id, { block = 'center', offset = 0, dur = 1.0 } = {}) {
        const main = window.__main, el = q(id)
        if (!main || !el) return
        const mr = main.getBoundingClientRect(), er = el.getBoundingClientRect(), s = camS.get()
        const rel = (er.top - mr.top) / s + main.scrollTop
        const hgt = er.height / s
        let target = block === 'start' ? rel - 24 : block === 'end' ? rel + hgt - main.clientHeight + 40 : rel + hgt / 2 - main.clientHeight / 2
        target = Math.max(0, Math.min(main.scrollHeight - main.clientHeight, target + offset))
        if (Math.abs(target - main.scrollTop) < 2) return
        await animate(main.scrollTop, target, { duration: dur, ease: CAM_EASE, onUpdate: (v) => { main.scrollTop = v } })
      },
      cursorShow(v = true) { return animate(curO, v ? 1 : 0, { duration: 0.4 }) },
      async moveTo(id, { dx = 0, dy = 0, dur } = {}) {
        const el = typeof id === 'string' ? await ctl.waitFor(id) : id
        const r = appRect(el)
        const tx = r.x + r.w / 2 + dx, ty = r.y + r.h / 2 + dy
        const dist = Math.hypot(tx - curX.get(), ty - curY.get())
        const d = dur ?? Math.min(1.15, Math.max(0.55, 0.35 + dist / 1100))
        if (curO.get() < 1) animate(curO, 1, { duration: 0.3 })
        // 带轻微弧度的移动
        const mx = (curX.get() + tx) / 2 + (ty - curY.get()) * 0.08, my = (curY.get() + ty) / 2 - (tx - curX.get()) * 0.08
        await Promise.all([
          animate(curX, [curX.get(), mx, tx], { duration: d, ease: [0.55, 0.05, 0.25, 1], times: [0, 0.5, 1] }),
          animate(curY, [curY.get(), my, ty], { duration: d, ease: [0.55, 0.05, 0.25, 1], times: [0, 0.5, 1] })
        ])
        return el
      },
      async click(id, opt = {}) {
        if (opt.scroll !== false) await ctl.scrollTo(id, { block: opt.block || 'center', dur: 0.8 })
        const el = await ctl.moveTo(id, opt)
        await sleep(opt.pre ?? 140)
        await animate(curS, 0.82, { duration: 0.09 })
        const key = Math.random()
        setRipples((r) => [...r, { key, x: sx.get(), y: sy.get() }])
        setTimeout(() => setRipples((r) => r.filter((p) => p.key !== key)), 900)
        animate(el, { scale: [1, 0.965, 1] }, { duration: 0.32, ease: 'easeOut' })
        el.click()
        await animate(curS, 1, { type: 'spring', stiffness: 500, damping: 22 })
        await sleep(opt.post ?? 260)
      }
    })
    window.__ctlReady = true
  }, [])

  return (
    <div style={{ position: 'relative', width: W, height: H, overflow: 'hidden', background: 'radial-gradient(120% 120% at 20% 10%, #16305c 0%, #0b1424 55%, #070c16 100%)' }}>
      <motion.div ref={layer} style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, x: camX, y: camY, scale: camS, transformOrigin: '0 0', borderRadius: appRadius, overflow: 'hidden', boxShadow: '0 40px 120px -30px rgba(0,0,0,.6)' }}>
        <App />
        <motion.div style={{ position: 'absolute', left: hlX, top: hlY, width: hlW, height: hlH, opacity: hlO, borderRadius: 16, pointerEvents: 'none', boxShadow: '0 0 0 2.5px #1f6fd1, 0 0 0 9px rgba(31,111,209,.16), 0 0 0 4000px rgba(10,20,40,.28)' }} />
      </motion.div>

      {/* 光标 */}
      <motion.div style={{ position: 'absolute', left: 0, top: 0, x: sx, y: sy, opacity: curO, scale: curS, zIndex: 50, pointerEvents: 'none' }}>
        <svg width="26" height="30" viewBox="0 0 26 30" style={{ position: 'absolute', left: -4, top: -3, filter: 'drop-shadow(0 3px 6px rgba(0,0,0,.35))' }}>
          <path d="M4 3 L4 24 L9.5 18.6 L13.4 27 L17 25.4 L13.2 17.2 L21 17.2 Z" fill="#111" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      </motion.div>
      {ripples.map((r) => (
        <motion.span key={r.key} initial={{ scale: 0.2, opacity: 0.55 }} animate={{ scale: 1, opacity: 0 }} transition={{ duration: 0.75, ease: 'easeOut' }}
          style={{ position: 'absolute', left: r.x - 26, top: r.y - 26, width: 52, height: 52, borderRadius: '50%', border: '2px solid #1f6fd1', background: 'rgba(31,111,209,.18)', zIndex: 49, pointerEvents: 'none' }} />
      ))}

      {/* 字幕 */}
      <AnimatePresence mode="wait">
        {caption && (
          <motion.div key={caption.text} initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -6, filter: 'blur(4px)' }} transition={{ duration: 0.45, ease: EASE }}
            style={{ position: 'absolute', left: 0, right: 0, margin: '0 auto', width: 'max-content', bottom: 30, zIndex: 60, display: 'flex', alignItems: 'center', gap: 14, maxWidth: 1260, padding: '13px 26px', borderRadius: 18, background: 'rgba(12,20,36,.82)', backdropFilter: 'blur(14px)', color: '#fff', boxShadow: '0 18px 50px -18px rgba(0,0,0,.6)', border: '1px solid rgba(255,255,255,.08)' }}>
            {caption.sub && <span style={{ flex: '0 0 auto', padding: '3px 10px', borderRadius: 8, background: 'rgba(120,170,255,.18)', color: '#a9c8ff', fontSize: 13, fontWeight: 500 }}>{caption.sub}</span>}
            <span style={{ fontSize: 19, lineHeight: '28px', letterSpacing: 0.2 }}>{caption.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 进度 */}
      <AnimatePresence>
        {scene === 'app' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, zIndex: 61, background: 'rgba(31,111,209,.12)' }}>
            <motion.div animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.9, ease: EASE }} style={{ height: '100%', background: 'linear-gradient(90deg,#4f93ff,#1f6fd1)' }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 章节卡 */}
      <AnimatePresence>
        {chapter && (
          <motion.div key={chapter.no} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.55, ease: EASE }}
            style={{ position: 'absolute', inset: 0, zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(7,14,28,.62)', backdropFilter: 'blur(18px) saturate(1.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 34 }}>
              <motion.span initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
                className="num" style={{ fontSize: 120, fontWeight: 200, color: 'rgba(160,196,255,.9)', lineHeight: 1 }}>{chapter.no}</motion.span>
              <motion.span initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} exit={{ scaleY: 0 }} transition={{ duration: 0.6, ease: EASE, delay: 0.2 }} style={{ width: 2, height: 110, background: 'rgba(160,196,255,.45)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <motion.span initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: EASE, delay: 0.22 }} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 18, color: '#8fb6f5' }}>
                  <Icon name={chapter.icon} size={22} />{chapter.line}
                </motion.span>
                <motion.span initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0 }} transition={{ duration: 0.7, ease: EASE, delay: 0.3 }} style={{ fontSize: 46, fontWeight: 500, color: '#fff', letterSpacing: 1 }}>{chapter.title}</motion.span>
                <motion.span initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: EASE, delay: 0.45 }} style={{ fontSize: 19, color: 'rgba(255,255,255,.72)' }}>{chapter.sub}</motion.span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 片头 */}
      <AnimatePresence>
        {scene === 'intro' && (
          <motion.div key="intro" exit={{ opacity: 0, scale: 1.04, filter: 'blur(10px)' }} transition={{ duration: 0.8, ease: EASE }}
            style={{ position: 'absolute', inset: 0, zIndex: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22, background: 'radial-gradient(110% 110% at 30% 20%, #1a3a6e 0%, #0b1527 55%, #060b15 100%)', color: '#fff' }}>
            <motion.div initial={{ opacity: 0, scale: 0.6, rotate: -12 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 16, delay: 0.2 }}
              style={{ width: 76, height: 76, borderRadius: 22, background: 'linear-gradient(135deg,#4f93ff,#1f6fd1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, boxShadow: '0 20px 60px -10px rgba(79,147,255,.6)' }}>AI</motion.div>
            <motion.div initial={{ opacity: 0, y: 24, filter: 'blur(10px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 0.9, ease: EASE, delay: 0.45 }} style={{ fontSize: 52, fontWeight: 500, letterSpacing: 2 }}>TMS 智能调度</motion.div>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE, delay: 0.8 }} style={{ fontSize: 22, color: 'rgba(255,255,255,.72)', letterSpacing: 1 }}>运输 + 关务 · AI 给建议，人来拍板</motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 1.3 }} style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              {['承运商匹配', '邮件转订单', '进口订单匹配', '箱单识别', '武汉合并送货'].map((t, i) => (
                <motion.span key={t} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE, delay: 1.4 + i * 0.1 }} style={{ padding: '6px 14px', borderRadius: 999, border: '1px solid rgba(160,196,255,.35)', color: '#bcd4ff', fontSize: 14 }}>{t}</motion.span>
              ))}
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} transition={{ duration: 1, delay: 2 }} style={{ position: 'absolute', bottom: 34, fontSize: 13, letterSpacing: 2 }}>语核科技 · 演示 Demo</motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 片尾 */}
      <AnimatePresence>
        {scene === 'outro' && (
          <motion.div key="outro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}
            style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: 590, zIndex: 80, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 18, padding: '0 64px 0 30px', color: '#fff' }}>
            <motion.div initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 0.8, ease: EASE, delay: 0.5 }} style={{ fontSize: 40, fontWeight: 500, letterSpacing: 1, marginBottom: 10 }}>AI 给建议，人来拍板</motion.div>
            {[
              ['auto_awesome', 'AI 建议', '读取 TMS 订单，按规则与报价池推理'],
              ['fact_check', '讲清依据', '命中规则、参考报价、未选原因一目了然'],
              ['how_to_reg', '人来拍板', '冲突与低置信度必须人工确认，可改可驳'],
              ['cloud_done', '回写 TMS', '确认即生成调度单、订单、送货单'],
              ['history', '全程可追溯', '修改原因反馈规则，越用越懂业务']
            ].map(([ic, t, d], i) => (
              <motion.div key={t} initial={{ opacity: 0, x: 26 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, ease: EASE, delay: 0.9 + i * 0.22 }} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(79,147,255,.18)', color: '#9cc3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={ic} size={24} /></span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 19, fontWeight: 500 }}>{t}</span>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,.62)' }}>{d}</span>
                </div>
              </motion.div>
            ))}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.55 }} transition={{ duration: 1, delay: 2.6 }} style={{ marginTop: 18, fontSize: 13, letterSpacing: 2 }}>语核科技</motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
