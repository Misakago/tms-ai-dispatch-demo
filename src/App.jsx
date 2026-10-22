import { motion, AnimatePresence, LayoutGroup } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Icon, Btn, Pill, CountUp, fadeUp, EASE, SPRING } from './ui.jsx'
import Carrier from './screens/Carrier.jsx'
import Email from './screens/Email.jsx'
import Import from './screens/Import.jsx'
import Packing from './screens/Packing.jsx'
import Wuhan from './screens/Wuhan.jsx'

const TASKS = [
  { key: 'carrier', line: '运输', type: '承运商匹配', title: '武汉 → 厦门 · 12 托 3.8 t', ai: '恒运达供应链 · ¥7,850', flag: '', flagKind: '' },
  { key: 'email', line: '运输', type: '邮件转订单', title: '瑞泓电子 · 武汉 → 苏州 · 8 托', ai: '已提取 8 组字段', flag: '低置信度', flagKind: 'warn' },
  { key: 'import', line: '关务', type: '进口订单匹配', title: '横滨 → 武汉 · 2×40HQ', ai: '上海洋山入境 · ¥37,456', flag: '规则冲突', flagKind: 'err' },
  { key: 'packing', line: '关务', type: '箱单识别', title: '关联 TMS-CI-20261021-0142', ai: '2 柜已识别', flag: '3 处差异', flagKind: 'warn' },
  { key: 'wuhan', line: '关务', type: '武汉合并/单独送货', title: '飞书放行清单 · 今日 7 票', ai: '1 拼车 + 3 专车', flag: '规则冲突', flagKind: 'err' }
]
const IDS = { carrier: 'TMS-TR-20261021-0087', email: 'TMS-TR-20261021-0093', import: 'TMS-CI-20261021-0142', packing: 'PL-SPJP-261187', wuhan: '放行清单 10-21' }
const EXD = {
  import: { title: '进口订单 · 规则冲突', desc: '交期优先 vs 属地优先' },
  wuhan: { title: '放行清单第 7 票 · 规则冲突', desc: '距离规则 vs 拼车规则' },
  email: { title: '邮件转单 · 低置信度', desc: '收货地址正文与附件不一致' },
  packing: { title: '箱单 · 数据差异', desc: '柜2 毛重差 +4.6%' }
}
const HIST = [
  { key: 'h1', type: '承运商匹配', id: 'TMS-TR-20261021-0064', decision: '驳回', snapshot: ['推荐 顺程物流 零担 ¥680'], log: [{ t: '09:12', who: 'Agent', text: '生成建议' }, { t: '09:21', who: '林晓雯', text: '驳回：报价已过期' }, { t: '09:24', who: '系统', text: '回写 TMS' }] },
  { key: 'h2', type: '进口订单匹配', id: 'TMS-CI-20261021-0118', decision: '修改后采纳', snapshot: ['推荐 空运普货 ¥6,420'], log: [{ t: '09:40', who: 'Agent', text: '生成建议' }, { t: '09:47', who: '周启航', text: '改为快件通道' }, { t: '09:48', who: '系统', text: '回写 TMS' }] }
]
const USERS = {
  hub: { i: '物', name: '物流部', role: '运输 + 关务' },
  lin: { i: '林', name: '林晓雯', role: '运输调度' },
  zhou: { i: '周', name: '周启航', role: '关务 A 角' },
  chen: { i: '陈', name: '陈思远', role: '关务 B 角' }
}

export default function App() {
  const [screen, setScreen] = useState('home')
  const [done, setDone] = useState({})
  const [toast, setToast] = useState('')
  const [role, setRole] = useState('A')
  const [traceKey, setTraceKey] = useState('import')
  const mainRef = useRef(null)
  const tt = useRef()
  useEffect(() => { if (mainRef.current) mainRef.current.scrollTop = 0; window.__main = mainRef.current }, [screen])

  const go = (k) => { setScreen(k); setRole('A') }
  const finish = (key) => (p) => {
    setDone((d) => ({ ...d, [key]: p })); setScreen('home'); setToast(p.toast)
    clearTimeout(tt.current); tt.current = setTimeout(() => setToast(''), 4200)
  }
  const user = screen === 'carrier' || screen === 'email' ? USERS.lin
    : screen === 'import' || screen === 'packing' ? USERS.zhou
    : screen === 'wuhan' ? (role === 'B' ? USERS.chen : USERS.zhou) : USERS.hub

  let direct = 17, mod = 4, rej = 2, exDone = 5
  Object.values(done).forEach((d) => { if (d.kind === 'mod') mod++; else if (d.kind === 'rej') rej++; else direct++ })
  const processed = direct + mod + rej
  const exOpen = Object.keys(EXD).filter((k) => !done[k]).length
  exDone += 4 - exOpen
  const pending = TASKS.length - Object.keys(done).length
  const rate = Math.round((direct + mod) / processed * 1000) / 10

  const nav = [
    { h: '总览' }, { k: 'home', label: '工作台', icon: 'space_dashboard' }, { k: 'trace', label: '追溯记录', icon: 'history' },
    { h: '运输' }, { k: 'carrier', label: '承运商匹配', icon: 'local_shipping' }, { k: 'email', label: '邮件转订单', icon: 'mark_email_unread' },
    { h: '关务' }, { k: 'import', label: '进口订单匹配', icon: 'directions_boat' }, { k: 'packing', label: '箱单识别', icon: 'inventory_2' }, { k: 'wuhan', label: '武汉送货', icon: 'alt_route' }
  ]

  return (
    <div style={{ width: 1440, height: 810, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <header style={{ height: 60, flex: '0 0 60px', display: 'flex', alignItems: 'center', gap: 16, padding: '0 24px', background: '#fff', borderBottom: '1px solid var(--line)' }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>AI</div>
        <span style={{ fontSize: 18, fontWeight: 500 }}>TMS 智能调度</span>
        <span style={{ flex: 1 }} />
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ink2)' }}>
          <motion.span animate={{ opacity: [1, 0.35, 1] }} transition={{ duration: 2.4, repeat: Infinity }} style={{ width: 8, height: 8, borderRadius: '50%', background: '#2fb27a' }} />TMS 已连接
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ink2)' }}>
          <Icon name="hub" size={16} />飞书 · 关务系统 · OA
        </span>
        <motion.div layout style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 14px 4px 4px', borderRadius: 999, background: '#eef4fb', overflow: 'hidden' }}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div key={user.name} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.4, ease: EASE }} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 500 }}>{user.i}</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 13, lineHeight: '18px', fontWeight: 500 }}>{user.name}</span>
                <span style={{ fontSize: 11, lineHeight: '14px', color: 'var(--ink2)' }}>{user.role}</span>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </header>
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <nav style={{ width: 220, flex: '0 0 220px', padding: '16px 12px', background: '#fff', borderRight: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {nav.map((n, i) => n.h ? <div key={i} style={{ padding: '14px 16px 6px', fontSize: 12, fontWeight: 500, color: 'var(--ink2)' }}>{n.h}</div> : (
            <button key={n.k} data-demo={'nav-' + n.k} onClick={() => go(n.k)} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, height: 42, padding: '0 16px', borderRadius: 999, fontSize: 14, fontWeight: 500, color: screen === n.k ? '#0b2f66' : '#4a5562' }}>
              {screen === n.k && <motion.span layoutId="navpill" transition={SPRING} style={{ position: 'absolute', inset: 0, borderRadius: 999, background: '#dceafe' }} />}
              <Icon name={n.icon} size={20} style={{ position: 'relative' }} />
              <span style={{ position: 'relative', flex: 1, textAlign: 'left' }}>{n.label}</span>
              <AnimatePresence>{TASKS.some((t) => t.key === n.k) && !done[n.k] && <motion.span exit={{ scale: 0 }} style={{ position: 'relative', width: 8, height: 8, borderRadius: '50%', background: '#b3261e' }} />}</AnimatePresence>
            </button>
          ))}
        </nav>
        <main ref={mainRef} className="scroll" style={{ flex: 1, minWidth: 0, padding: 28, position: 'relative' }}>
          <AnimatePresence mode="wait">
            <motion.div key={screen} initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }} transition={{ duration: 0.45, ease: EASE }} style={{ maxWidth: 1160, margin: '0 auto', paddingBottom: 140 }}>
              {screen === 'home' && <Home {...{ done, pending, processed, direct, mod, rej, rate, exOpen, exDone, go, setTraceKey, setScreen }} />}
              {screen === 'trace' && <Trace done={done} sel={traceKey} setSel={setTraceKey} onBack={() => go('home')} />}
              {screen === 'carrier' && <Carrier onDone={finish('carrier')} onBack={() => go('home')} />}
              {screen === 'email' && <Email onDone={finish('email')} onBack={() => go('home')} />}
              {screen === 'import' && <Import onDone={finish('import')} onBack={() => go('home')} />}
              {screen === 'packing' && <Packing onDone={finish('packing')} onBack={() => go('home')} />}
              {screen === 'wuhan' && <Wuhan onDone={finish('wuhan')} onBack={() => go('home')} onRole={setRole} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <AnimatePresence>
        {toast && (
          <motion.div key={toast} initial={{ opacity: 0, y: -16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10 }} transition={SPRING}
            style={{ position: 'absolute', top: 76, right: 28, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', borderRadius: 12, background: '#1a1f26', color: '#fff', fontSize: 14, boxShadow: '0 12px 32px -12px rgba(0,0,0,.45)' }}>
            <Icon name="cloud_done" size={20} style={{ color: '#9cc3ff' }} />{toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Home({ done, pending, processed, direct, mod, rej, rate, exOpen, exDone, go, setTraceKey, setScreen }) {
  const allDone = pending === 0
  const kpis = [
    { label: '今日处理', v: processed, sub: '运输 + 关务' },
    { label: 'AI 采纳率', v: rate, dec: 1, unit: '%', sub: `直接 ${direct} · 修改 ${mod} · 驳回 ${rej}` },
    { label: '待确认', v: pending, sub: '需人工拍板' },
    { label: '异常待处理', v: exOpen, sub: `已解决 ${exDone}`, alert: exOpen > 0 }
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <motion.div {...fadeUp(0)} style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 400 }}>今日待确认 <CountUp value={pending} /> 项</h1>
        <span style={{ fontSize: 14, color: 'var(--ink2)' }}>10 月 21 日 周三</span>
      </motion.div>
      <div data-demo="kpis" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {kpis.map((k, i) => (
          <motion.div key={k.label} {...fadeUp(i + 1)} style={{ borderRadius: 16, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 4, background: k.alert ? '#fbe3e1' : '#fff', border: `1px solid ${k.alert ? '#fbe3e1' : '#d3dce6'}`, color: k.alert ? '#410e0b' : 'var(--ink)' }}>
            <span style={{ fontSize: 13, color: k.alert ? '#410e0b' : 'var(--ink2)' }}>{k.label}</span>
            <span style={{ fontSize: 34, fontWeight: 400, lineHeight: '42px' }}><CountUp value={k.v} decimals={k.dec || 0} />{k.unit && <span style={{ fontSize: 18, marginLeft: 2 }}>{k.unit}</span>}</span>
            <span style={{ fontSize: 12, color: k.alert ? '#410e0b' : 'var(--ink2)' }}>{k.sub}</span>
          </motion.div>
        ))}
      </div>
      <AnimatePresence>
        {allDone && (
          <motion.div data-demo="all-done" initial={{ opacity: 0, height: 0, scale: 0.98 }} animate={{ opacity: 1, height: 'auto', scale: 1 }} transition={{ duration: 0.6, ease: EASE, delay: 0.5 }} style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderRadius: 16, background: 'linear-gradient(90deg,#1f6fd1,#3a86e8)', color: '#fff' }}>
              <Icon name="verified" size={24} fill />
              <span style={{ fontSize: 16, fontWeight: 500, flex: 1 }}>今日任务已全部确认并回写 TMS</span>
              <Btn kind="tonal" demo="go-trace" icon="history" onClick={() => { setTraceKey('import'); setScreen('trace') }} style={{ background: '#fff' }}>查看追溯</Btn>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
        <motion.section {...fadeUp(5)} data-demo="queue" style={{ flex: 1, minWidth: 0, borderRadius: 16, background: '#fff', border: '1px solid var(--line)', padding: '8px 8px 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '10px 12px' }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 500, flex: 1 }}>任务队列</h2>
            <span style={{ fontSize: 12, color: 'var(--ink2)' }}>AI 已生成建议，等待人工确认</span>
          </div>
          <LayoutGroup>
            {TASKS.map((t, i) => {
              const d = done[t.key]
              const tr = t.line === '运输'
              return (
                <motion.div layout key={t.key} data-demo={'row-' + t.key} {...fadeUp(i + 6, 0.06)}
                  style={{ display: 'grid', gridTemplateColumns: '1.35fr 1.25fr 150px', alignItems: 'center', gap: 12, padding: '12px', borderRadius: 12, borderTop: i ? '1px solid #eef1f4' : 'none' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ padding: '1px 8px', borderRadius: 6, fontSize: 12, fontWeight: 500, background: tr ? '#dceafe' : '#d5f0ee', color: tr ? '#0b2f66' : '#083b37' }}>{t.line}</span>
                      <span style={{ fontSize: 15, fontWeight: 500 }}>{t.type}</span>
                    </div>
                    <span style={{ fontSize: 13, color: 'var(--ink2)' }}>{t.title}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span key={d ? 'd' : 'a'} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} style={{ fontSize: 13, color: d ? 'var(--ink2)' : 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {d ? d.summary : <><Icon name="auto_awesome" size={14} fill style={{ color: 'var(--primary)', marginRight: 4, verticalAlign: -2 }} />{t.ai}</>}
                      </motion.span>
                    </AnimatePresence>
                    <AnimatePresence>{t.flag && !d && <motion.span exit={{ opacity: 0, scale: 0.8 }} style={{ padding: '1px 8px', borderRadius: 999, fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', background: t.flagKind === 'err' ? '#fbe3e1' : '#fff1d6', color: t.flagKind === 'err' ? '#410e0b' : '#4a3200' }}>{t.flag}</motion.span>}</AnimatePresence>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <AnimatePresence mode="popLayout" initial={false}>
                      {d ? (
                        <motion.span key="ok" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 18 }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: 'var(--primary)', height: 36 }}>
                          <Icon name="check_circle" size={20} fill />{d.decision}
                        </motion.span>
                      ) : <motion.span key="btn" exit={{ opacity: 0, scale: 0.8 }}><Btn demo={'open-' + t.key} onClick={() => go(t.key)} style={{ height: 36 }}>处理</Btn></motion.span>}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )
            })}
          </LayoutGroup>
        </motion.section>
        <motion.section {...fadeUp(6)} data-demo="exceptions" style={{ flex: '0 0 300px', borderRadius: 16, background: '#fff', border: '1px solid var(--line)', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 500 }}>异常 · 需人工拍板</h2>
          {Object.keys(EXD).map((k) => {
            const d = done[k]
            return (
              <div key={k} style={{ display: 'flex', gap: 10, padding: '8px 4px' }}>
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span key={d ? 'y' : 'n'} initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 18 }} style={{ display: 'inline-flex', color: d ? 'var(--primary)' : 'var(--err)' }}>
                    <Icon name={d ? 'check_circle' : 'error'} size={20} fill={!!d} />
                  </motion.span>
                </AnimatePresence>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{EXD[k].title}</span>
                  <span style={{ fontSize: 12, color: 'var(--ink2)' }}>{d ? '已处理 · ' + (d.exNote || d.decision) : EXD[k].desc}</span>
                </div>
              </div>
            )
          })}
        </motion.section>
      </div>
    </div>
  )
}

function Trace({ done, sel, setSel, onBack }) {
  const TYPE = Object.fromEntries(TASKS.map((t) => [t.key, t.type]))
  const recs = [...Object.keys(done).reverse().map((k) => ({ key: k, type: TYPE[k], id: IDS[k], ...done[k] })), ...HIST]
  const cur = recs.find((r) => r.key === sel) || recs[0]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <motion.div {...fadeUp(0)} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={onBack} style={{ width: 40, height: 40, borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink2)' }}><Icon name="arrow_back" size={22} /></button>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 400 }}>追溯记录</h1>
        <span style={{ fontSize: 14, color: 'var(--ink2)' }}>每一单：AI 当时怎么想 · 谁改了什么 · 何时回写</span>
      </motion.div>
      <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
        <motion.section {...fadeUp(1)} style={{ flex: '0 0 360px', borderRadius: 16, background: '#fff', border: '1px solid var(--line)', padding: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {recs.map((r) => (
            <button key={r.key} data-demo={'tr-' + r.key} onClick={() => setSel(r.key)} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, padding: '10px 14px', borderRadius: 12, textAlign: 'left' }}>
              {cur.key === r.key && <motion.span layoutId="trsel" transition={SPRING} style={{ position: 'absolute', inset: 0, borderRadius: 12, background: '#eef4fb' }} />}
              <span style={{ position: 'relative', display: 'flex', width: '100%', gap: 8, fontSize: 14, fontWeight: 500 }}>{r.type}<span style={{ flex: 1 }} /><span style={{ fontSize: 12, color: r.decision.startsWith('驳回') ? 'var(--err)' : 'var(--primary)' }}>{r.decision}</span></span>
              <span className="mono" style={{ position: 'relative', fontSize: 12, color: 'var(--ink2)' }}>{r.id}</span>
            </button>
          ))}
        </motion.section>
        <AnimatePresence mode="wait">
          <motion.section key={cur.key} data-demo="trace-detail" initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.4, ease: EASE }}
            style={{ flex: 1, borderRadius: 16, background: '#fff', border: '1px solid var(--line)', padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="mono" style={{ fontSize: 16, fontWeight: 500 }}>{cur.id}</span>
              <Pill bg="#dceafe" fg="#0b2f66">{cur.decision}</Pill>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 500, color: 'var(--ink2)' }}>AI 推理快照</h3>
              {cur.snapshot.map((s, i) => <motion.div key={s} {...fadeUp(i + 1, 0.1)} style={{ padding: '10px 14px', borderRadius: 10, background: '#f8fbff', border: '1px solid #e3eaf2', fontSize: 14 }}>{s}</motion.div>)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 500, color: 'var(--ink2)' }}>时间线</h3>
              {cur.log.map((l, i) => (
                <motion.div key={i} {...fadeUp(i + 3, 0.12)} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', position: 'relative', paddingBottom: 14 }}>
                  <span className="mono" style={{ width: 44, fontSize: 13, color: 'var(--ink2)', paddingTop: 1 }}>{l.t}</span>
                  <span style={{ position: 'relative', width: 12, display: 'flex', justifyContent: 'center', alignSelf: 'stretch' }}>
                    <span style={{ width: 10, height: 10, marginTop: 5, borderRadius: '50%', background: l.who === 'Agent' ? '#1f6fd1' : l.who === '系统' ? '#2fb27a' : '#f0a020', boxShadow: '0 0 0 3px #fff', position: 'relative', zIndex: 1 }} />
                    {i < cur.log.length - 1 && <span style={{ position: 'absolute', top: 12, bottom: -2, width: 2, background: '#e3eaf2' }} />}
                  </span>
                  <span style={{ width: 64, fontSize: 13, fontWeight: 500, color: l.who === 'Agent' ? 'var(--primary)' : 'var(--ink)' }}>{l.who}</span>
                  <span style={{ flex: 1, fontSize: 14 }}>{l.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.section>
        </AnimatePresence>
      </div>
    </div>
  )
}
