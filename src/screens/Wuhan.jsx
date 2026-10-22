import { motion, AnimatePresence, LayoutGroup } from 'motion/react'
import { useEffect, useState } from 'react'
import { Icon, Btn, Busy, Done, KV, PageHead, fmt, fadeUp, EASE, SPRING } from '../ui.jsx'

const RAW = [
  { no: 1, name: '偏光片', tag: '', pcs: '6 托', kg: 1920, to: '光谷一厂', g: 'G1' },
  { no: 2, name: '背光膜材', tag: '', pcs: '4 托', kg: 820, to: '光谷一厂', g: 'G1' },
  { no: 3, name: '设备备件', tag: '', pcs: '2 托', kg: 610, to: '光谷一厂', g: 'G1' },
  { no: 4, name: '玻璃基板', tag: '超长', pcs: '14 托', kg: 9600, to: '光谷一厂', g: 'S1' },
  { no: 5, name: '光刻胶', tag: '危险品', pcs: '1 托', kg: 320, to: '光谷一厂', g: 'S2' },
  { no: 6, name: '驱动 IC', tag: '高货值', pcs: '3 箱', kg: 48, to: '光谷一厂', g: 'S3' },
  { no: 7, name: '治具', tag: '冲突', pcs: '3 托', kg: 900, to: '临空港二厂', g: 'G1' }
]
const G = [
  { code: 'G1', kind: '拼车', vehicle: '9.6 m 厢车', cost: 1530, goods: '#1 #2 #3 #7（串点）', why: '同日同区合并，#7 串点', plate: '鄂A·7K3P2', driver: '刘建军', slot: '13:30', icon: 'local_shipping' },
  { code: 'S1', kind: '专车', vehicle: '13 m 厢车', cost: 1600, goods: '#4 玻璃基板', why: '超 8 t 单独派车', plate: '鄂A·D8812', driver: '王涛', slot: '14:00', icon: 'straighten' },
  { code: 'S2', kind: '专车', vehicle: '危险品车', cost: 1450, goods: '#5 光刻胶', why: '危险品必须单独运输', plate: '鄂A·W0631', driver: '何勇', slot: '13:00', icon: 'warning' },
  { code: 'S3', kind: '专车', vehicle: '押运车', cost: 1200, goods: '#6 驱动 IC', why: '货值 ¥231 万，单独押运', plate: '鄂A·5F2M7', driver: '赵磊', slot: '11:30', icon: 'shield' }
]
const gStyle = (g) => g === 'G1' ? { bg: '#dceafe', fg: '#0b2f66' } : { bg: '#d5f0ee', fg: '#083b37' }

export default function Wuhan({ onDone, onBack, onRole }) {
  const [phase, setPhase] = useState('syncing')
  const [role, setRole] = useState('A')
  const [conf, setConf] = useState({})
  useEffect(() => {
    const t = [setTimeout(() => setPhase('grouping'), 1600), setTimeout(() => setPhase('review'), 3200)]
    return () => t.forEach(clearTimeout)
  }, [])
  const isSyncing = phase === 'syncing' || phase === 'grouping'
  const afterSubmit = ['handoff', 'confirm', 'writing', 'done'].includes(phase)
  const isB = role === 'B' && phase === 'confirm'
  const total = G.reduce((a, g) => a + g.cost, 0)
  const confirmed = G.filter((g) => conf[g.code]).length
  const status = phase === 'done' ? { text: '已回写', bg: '#1f6fd1', fg: '#fff', icon: 'cloud_done' }
    : isSyncing ? { text: 'AI 分组中', bg: '#dceafe', fg: '#0b2f66', icon: 'auto_awesome' }
    : phase === 'review' ? { text: '1 处规则冲突', bg: '#fbe3e1', fg: '#410e0b', icon: 'call_split' }
    : phase === 'handoff' ? { text: '待 B 角确认', bg: '#eef4fb', fg: '#0b2f66', icon: 'how_to_reg' }
    : { text: '送货确认中', bg: '#eef4fb', fg: '#0b2f66', icon: 'fact_check' }
  const finalize = () => { setPhase('writing'); setTimeout(() => setPhase('done'), 1400) }
  const finish = () => onDone({
    kind: 'direct', decision: '采纳', summary: G.length + ' 车 · ' + fmt(total), exNote: '第 7 票串点合并',
    snapshot: ['G1 拼车 #1#2#3 · S1 #4 · S2 #5 危险品 · S3 #6 高货值', '#7 规则冲突，AI 倾向串点'],
    log: [{ t: '10:30', who: 'Agent', text: '同步飞书清单 7 票，生成分组' }, { t: '10:52', who: '周启航', text: '#7 串点并入 G1，提交' }, { t: '10:55', who: '陈思远', text: '确认 4 车' }, { t: '10:55', who: '系统', text: '回写 TMS 与飞书' }],
    toast: '已生成送货单 4 张，飞书清单已更新'
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PageHead title="武汉合并 / 单独送货" code="10-21 放行 7 票 · 飞书清单 10:30 同步" status={status} onBack={onBack} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {[{ i: '周', l: 'A 角 周启航 · 分组', on: role === 'A' }, { i: '陈', l: 'B 角 陈思远 · 送货确认', on: role === 'B' }].map((r, k) => [
          <motion.div key={r.l} initial={false} animate={{ backgroundColor: r.on ? '#dceafe' : 'rgba(220,234,254,0)', color: r.on ? '#0b2f66' : '#4a5562' }} transition={{ duration: 0.4 }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 14px 4px 4px', borderRadius: 999 }}>
            <motion.span initial={false} animate={{ backgroundColor: r.on ? '#1f6fd1' : '#9aa5b1' }} style={{ width: 28, height: 28, borderRadius: '50%', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>{r.i}</motion.span>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{r.l}</span>
          </motion.div>,
          k === 0 && <Icon key="arr" name="chevron_right" size={20} style={{ color: 'var(--ink3)' }} />
        ])}
      </div>
      <AnimatePresence mode="popLayout">
        {isSyncing && <Busy key="s" tone={phase === 'syncing' ? 'sync' : 'ai'} text={phase === 'syncing' ? '正在同步飞书放行清单…' : 'AI 正在分组…  收货点 · 重量 · 货物属性 · 送货规则'} />}
      </AnimatePresence>
      {!isSyncing && (
        <LayoutGroup>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <motion.section {...fadeUp(0)} data-demo="wh-table" style={{ flex: '0 0 600px', borderRadius: 16, background: '#fff', border: '1px solid var(--line)', padding: '8px 12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '28px 1.5fr .7fr 1fr 1.1fr 1fr', gap: 8, padding: '6px 6px', fontSize: 12, color: 'var(--ink2)' }}>
                <span>#</span><span>货物</span><span>件数</span><span>毛重</span><span>收货点</span><span>分组</span>
              </div>
              {RAW.map((r, i) => {
                const gs = gStyle(r.g)
                return (
                  <motion.div key={r.no} data-demo={'wh-row-' + r.no} {...fadeUp(i + 1, 0.06)} style={{ display: 'grid', gridTemplateColumns: '28px 1.5fr .7fr 1fr 1.1fr 1fr', gap: 8, alignItems: 'center', padding: '8px 6px', borderRadius: 8, background: r.no === 7 && !afterSubmit ? '#fff7f6' : 'transparent', fontSize: 14 }}>
                    <span style={{ color: 'var(--ink2)' }}>{r.no}</span>
                    <span>{r.name}{r.tag && <span style={{ marginLeft: 6, fontSize: 11, color: r.no === 7 ? '#b3261e' : '#4a5562', border: `1px solid ${r.no === 7 ? '#e8a29d' : '#d3dce6'}`, borderRadius: 4, padding: '0 4px' }}>{r.tag}</span>}</span>
                    <span>{r.pcs}</span><span className="num">{r.kg.toLocaleString('en-US')} kg</span><span>{r.to}</span>
                    <motion.span initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 20, delay: 0.6 + i * 0.12 }}
                      style={{ justifySelf: 'start', padding: '2px 10px', borderRadius: 999, background: gs.bg, color: gs.fg, fontSize: 12, fontWeight: 500 }}>{r.g === 'G1' ? 'G1 拼车' : r.g + ' 专车'}</motion.span>
                  </motion.div>
                )
              })}
            </motion.section>
            <motion.section {...fadeUp(3)} data-demo="wh-conflict" style={{ flex: 1, borderRadius: 16, background: '#fff', border: `2px solid ${afterSubmit ? '#d3dce6' : '#e8a29d'}`, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 500, color: '#410e0b' }}><Icon name="call_split" size={20} style={{ color: '#b3261e' }} />第 7 票 治具 · 规则冲突</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                <span style={{ padding: '8px 10px', borderRadius: 8, background: '#f8fbff' }}><b className="mono" style={{ fontWeight: 500 }}>R-WH-004</b>　二厂距光谷 38 km，超过 20 km → 单独送 ¥1,350</span>
                <span style={{ padding: '8px 10px', borderRadius: 8, background: '#eef4fb', color: '#0b2f66' }}><b className="mono" style={{ fontWeight: 500 }}>R-WH-007</b>　单票 &lt; 1 t → 串点拼入 G1 +¥680 <span style={{ fontWeight: 500 }}>（AI 倾向）</span></span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span data-demo="wh-merge" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, border: '1px solid #1f6fd1', background: '#dceafe', color: '#0b2f66', fontSize: 13 }}><Icon name="radio_button_checked" size={16} />串点并入 G1</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, border: '1px solid #9aa5b1', color: '#4a5562', fontSize: 13 }}><Icon name="radio_button_unchecked" size={16} />单独专车</span>
              </div>
            </motion.section>
          </div>
          <motion.div layout style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500 }}>送货分组</h2>
            <span className="num" style={{ fontSize: 14, color: 'var(--ink2)' }}>{G.length} 车 · {fmt(total)}</span>
          </motion.div>
          <div data-demo="wh-groups" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {G.map((g, i) => {
              const c = !!conf[g.code]; const gs = gStyle(g.code)
              return (
                <motion.article key={g.code} {...fadeUp(i + 4, 0.1)} style={{ borderRadius: 16, background: '#fff', border: `${isB && c ? 2 : 1}px solid ${isB && c ? '#1f6fd1' : '#d3dce6'}`, padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ padding: '2px 10px', borderRadius: 999, background: gs.bg, color: gs.fg, fontSize: 12, fontWeight: 500 }}>{g.code} {g.kind}</span>
                    <span style={{ fontSize: 13, color: 'var(--ink2)' }}>{g.vehicle}</span>
                    <span style={{ flex: 1 }} />
                    <span className="num" style={{ fontSize: 15, fontWeight: 500 }}>{fmt(g.cost)}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{g.goods}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink2)' }}>{g.why}</div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--ink3)' }}>{g.plate} · {g.driver} · {g.slot}</div>
                  <AnimatePresence initial={false}>
                    {isB && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.4, ease: EASE, delay: i * 0.06 }} style={{ overflow: 'hidden', paddingTop: 4 }}>
                        {c ? <motion.span initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, color: 'var(--primary)', fontSize: 14, fontWeight: 500 }}><Icon name="check_circle" size={20} fill />已确认</motion.span>
                          : <Btn kind="tonal" demo={'wh-ok-' + g.code} onClick={() => setConf((p) => ({ ...p, [g.code]: true }))} style={{ height: 34 }}>确认送货</Btn>}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.article>
              )
            })}
          </div>
          <motion.div layout style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, minHeight: 44 }}>
            {phase === 'review' && <Btn demo="wh-submit" icon="send" onClick={() => setPhase('handoff')}>提交给 B 角</Btn>}
            {phase === 'handoff' && <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 14, color: 'var(--ink2)' }}>已提交 4 车，等待 B 角确认</span>
              <Btn demo="wh-switch" icon="switch_account" onClick={() => { setRole('B'); setPhase('confirm'); onRole && onRole('B') }}>切换到 B 角 陈思远</Btn>
            </motion.div>}
            {isB && <>
              <span className="num" style={{ fontSize: 14, color: 'var(--ink2)' }}>{confirmed} / {G.length} 已确认</span>
              <Btn demo="wh-final" icon="cloud_upload" disabled={confirmed !== G.length} onClick={finalize}>完成并回写 TMS</Btn>
            </>}
          </motion.div>
          <AnimatePresence mode="popLayout">
            {phase === 'writing' && <Busy key="w" tone="sync" text="正在回写 TMS 与飞书清单…" />}
          </AnimatePresence>
          {phase === 'done' && (
            <Done title="送货确认完成" onBack={finish}>
              <KV items={[{ k: 'TMS 送货单', v: '4 张 · SH-20261021-01 起' }, { k: '飞书清单', v: '7 票 → 已安排送货' }, { k: '运费合计', v: fmt(total) }]} />
            </Done>
          )}
        </LayoutGroup>
      )}
    </div>
  )
}
