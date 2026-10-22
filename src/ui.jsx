import { motion, AnimatePresence, animate, useMotionValue, useTransform } from 'motion/react'
import { useEffect, useState } from 'react'

export const EASE = [0.22, 1, 0.36, 1]
export const SPRING = { type: 'spring', stiffness: 260, damping: 30, mass: 0.9 }

export const fmt = (n) => '¥' + n.toLocaleString('en-US')

export function Icon({ name, size = 20, fill, style, className = '' }) {
  return <span className={`ms ${fill ? 'fill' : ''} ${className}`} style={{ fontSize: size, width: size, height: size, ...style }}>{name}</span>
}

const BTN = {
  filled: { background: 'var(--primary)', color: '#fff', boxShadow: '0 1px 2px rgba(31,111,209,.25), 0 4px 12px -4px rgba(31,111,209,.45)' },
  tonal: { background: 'var(--primary-soft)', color: 'var(--primary-ink)' },
  outlined: { background: '#fff', color: 'var(--primary)', boxShadow: 'inset 0 0 0 1px #6f7a87' },
  text: { background: 'transparent', color: 'var(--primary)' },
  disabled: { background: '#e3e7ec', color: '#9aa5b1' }
}
export function Btn({ kind = 'filled', icon, children, onClick, demo, disabled, style }) {
  const k = disabled ? 'disabled' : kind
  return (
    <motion.button layout="position" data-demo={demo} onClick={disabled ? undefined : onClick}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 40, padding: icon ? '0 22px 0 16px' : '0 22px', borderRadius: 999, fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', ...BTN[k], ...style }}>
      {icon && <Icon name={icon} size={18} />}
      {children}
    </motion.button>
  )
}

export function Pill({ bg, fg, icon, children, style }) {
  return (
    <motion.span layout initial={false} animate={{ backgroundColor: bg, color: fg }} transition={{ duration: 0.4, ease: EASE }}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', ...style }}>
      {icon && <Icon name={icon} size={16} />}
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={String(children)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3, ease: EASE }}>{children}</motion.span>
      </AnimatePresence>
    </motion.span>
  )
}

export function Tag({ bg, fg, children, style }) {
  return <span style={{ padding: '2px 10px', borderRadius: 999, background: bg, color: fg, fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', ...style }}>{children}</span>
}

export function Card({ children, style, ...rest }) {
  return <motion.div {...rest} style={{ borderRadius: 16, background: '#fff', border: '1px solid var(--line)', ...style }}>{children}</motion.div>
}

// 无 CSS 动画的不定进度条（便于虚拟时钟逐帧录制）
export function Progress({ color = 'var(--primary)', track = 'rgba(31,111,209,.16)' }) {
  return (
    <div style={{ position: 'relative', height: 4, borderRadius: 4, overflow: 'hidden', background: track }}>
      <motion.div style={{ position: 'absolute', top: 0, bottom: 0, width: '38%', borderRadius: 4, background: color }}
        initial={{ left: '-40%' }} animate={{ left: '105%' }} transition={{ duration: 1.25, ease: [0.45, 0, 0.25, 1], repeat: Infinity }} />
    </div>
  )
}

export function Busy({ text, tone = 'ai' }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.35, ease: EASE }}
      style={{ borderRadius: 16, background: 'var(--primary-soft)', color: 'var(--primary-ink)', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 500 }}>
        <motion.span animate={{ rotate: [0, 18, -10, 0], scale: [1, 1.12, 1] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }} style={{ display: 'inline-flex' }}>
          <Icon name={tone === 'ai' ? 'auto_awesome' : 'cloud_sync'} size={18} fill />
        </motion.span>
        {text}
      </span>
      <Progress />
    </motion.div>
  )
}

export function CountUp({ value, decimals = 0, duration = 1.1 }) {
  const mv = useMotionValue(value)
  const txt = useTransform(mv, (v) => v.toFixed(decimals))
  useEffect(() => { const c = animate(mv, value, { duration, ease: EASE }); return () => c.stop() }, [value])
  return <motion.span className="num">{txt}</motion.span>
}

export const fadeUp = (i = 0, d = 0.06) => ({
  initial: { opacity: 0, y: 14, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { duration: 0.55, ease: EASE, delay: i * d }
})

export function Done({ title, children, onBack, demo = 'back-home', extra }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.97, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={SPRING}
      style={{ borderRadius: 16, background: '#fff', border: '2px solid var(--primary)', padding: 20, display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 12px 32px -18px rgba(31,111,209,.55)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <motion.span initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 18, delay: 0.1 }} style={{ display: 'inline-flex', color: 'var(--primary)' }}>
          <Icon name="cloud_done" size={26} fill />
        </motion.span>
        <span style={{ fontSize: 18, fontWeight: 500 }}>{title}</span>
      </div>
      {children}
      {extra}
      <div><Btn demo={demo} onClick={onBack}>返回工作台</Btn></div>
    </motion.div>
  )
}

export function KV({ items }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 8 }}>
      {items.map((w, i) => (
        <motion.div key={w.k} {...fadeUp(i + 2, 0.07)} style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '10px 12px', borderRadius: 12, background: 'var(--primary-faint)' }}>
          <span style={{ fontSize: 12, color: 'var(--ink2)' }}>{w.k}</span>
          <span style={{ fontSize: 14, fontWeight: 500 }}>{w.v}</span>
        </motion.div>
      ))}
    </div>
  )
}

export function PageHead({ title, code, status, onBack }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <button data-demo="head-back" onClick={onBack} style={{ width: 40, height: 40, borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink2)' }}><Icon name="arrow_back" size={22} /></button>
      <h1 style={{ margin: 0, fontSize: 24, lineHeight: '32px', fontWeight: 400 }}>{title}</h1>
      {code && <span className="mono" style={{ fontSize: 14, color: 'var(--ink2)' }}>{code}</span>}
      {status && <Pill bg={status.bg} fg={status.fg} icon={status.icon}>{status.text}</Pill>}
    </div>
  )
}

export function useAfter(ms, initial = false) {
  const [v, set] = useState(initial)
  useEffect(() => { const t = setTimeout(() => set(true), ms); return () => clearTimeout(t) }, [])
  return v
}

export function OrderAside({ items }) {
  return (
    <motion.aside {...fadeUp(0)} style={{ flex: '0 0 260px', borderRadius: 16, background: '#fff', border: '1px solid var(--line)', padding: 18, display: 'flex', flexDirection: 'column', gap: 14, alignSelf: 'flex-start' }}>
      {items.map((o) => (
        <div key={o.k} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 12, color: 'var(--ink2)' }}>{o.k}</span>
          <motion.span initial={false} animate={{ color: o.fg || '#1a1f26' }} style={{ fontSize: 15 }}>{o.v}</motion.span>
        </div>
      ))}
    </motion.aside>
  )
}

export function ChoiceChip({ on, red, children, onClick, demo }) {
  const c = on ? (red ? ['#b3261e', '#fbe3e1', '#410e0b'] : ['#1f6fd1', '#dceafe', '#0b2f66']) : ['#9aa5b1', '#ffffff', '#4a5562']
  return (
    <motion.button data-demo={demo} onClick={onClick} initial={false}
      animate={{ borderColor: c[0], backgroundColor: c[1], color: c[2] }} transition={{ duration: 0.25 }}
      style={{ minHeight: 36, padding: '6px 14px', borderRadius: 8, border: '1px solid', fontSize: 13 }}>{children}</motion.button>
  )
}
