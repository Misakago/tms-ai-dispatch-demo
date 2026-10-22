import { motion, AnimatePresence } from 'motion/react'
import { useEffect, useState } from 'react'
import { Icon, Btn, Busy, Done, PageHead, fadeUp, EASE } from '../ui.jsx'

const CH = [
  { type: '进口订单', no: 'TMS-CI-20261021-0142', icon: 'receipt_long' },
  { type: '提单', no: 'DHSE26101487', icon: 'directions_boat' },
  { type: '发票', no: 'INV-SPJP-261187', icon: 'request_quote' },
  { type: '箱单', no: 'PL-SPJP-261187', icon: 'inventory_2' }
]
const R = [
  { k: 'pcs', field: '件数', tms: '9 托', pl: '8 托', diff: '−1 托' },
  { k: 'kg', field: '毛重', tms: '4,120 kg', pl: '4,310 kg', diff: '+4.6%' },
  { k: 'cbm', field: '体积', tms: '14.0 m³', pl: '15.4 m³', diff: '+10%' }
]

export default function Packing({ onDone, onBack }) {
  const [found, setFound] = useState(0)
  const [phase, setPhase] = useState('extract')
  useEffect(() => {
    const t = [700, 1300, 1900, 2500].map((ms, i) => setTimeout(() => setFound(i + 1), ms))
    t.push(setTimeout(() => setPhase('review'), 4200))
    return () => t.forEach(clearTimeout)
  }, [])
  const done = phase === 'done'
  const status = done ? { text: '已核对', bg: '#1f6fd1', fg: '#fff', icon: 'cloud_done' }
    : phase === 'review' ? { text: '3 处差异', bg: '#fbe3e1', fg: '#410e0b', icon: 'difference' }
    : { text: 'AI 识别中', bg: '#dceafe', fg: '#0b2f66', icon: 'auto_awesome' }
  const confirm = () => { setPhase('writing'); setTimeout(() => setPhase('done'), 1300) }
  const finish = () => onDone({
    kind: 'direct', decision: '采纳', summary: '柜2 → 8 托 / 4,310 kg / 15.4 m³', exNote: '以箱单为准',
    snapshot: ['订单 → 提单 → 发票 → 箱单', '柜2 件数 / 毛重 / 体积 3 处差异，建议以箱单为准'],
    log: [{ t: '10:40', who: 'Agent', text: '识别箱单，标记 3 处差异' }, { t: '10:58', who: '周启航', text: '确认：以箱单为准' }, { t: '10:58', who: '系统', text: '回写 TMS' }],
    toast: '箱单已核对，TMS 货物数据已更新'
  })
  const showCompare = phase === 'review' || phase === 'writing' || done

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHead title="箱单识别" code="PL-SPJP-261187" status={status} onBack={onBack} />
      <div data-demo="pl-chain" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {CH.map((c, i) => {
          const on = found >= i + 1; const last = i === CH.length - 1
          return [
            <motion.div key={c.no} initial={false} animate={{ opacity: on ? 1 : 0.35, borderColor: on && last ? '#1f6fd1' : '#d3dce6', backgroundColor: on && last ? '#dceafe' : '#ffffff', y: on ? 0 : 6 }} transition={{ duration: 0.5, ease: EASE }}
              style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 14, border: '1px solid' }}>
              <Icon name={c.icon} size={22} style={{ color: on ? 'var(--primary)' : 'var(--ink3)' }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 12, color: 'var(--ink2)' }}>{c.type}</span>
                <span className="mono" style={{ fontSize: 13, fontWeight: 500 }}>{c.no}</span>
              </div>
              {on && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 18 }} style={{ marginLeft: 'auto', color: 'var(--primary)', display: 'inline-flex' }}><Icon name="check_circle" size={18} fill /></motion.span>}
            </motion.div>,
            !last && <motion.span key={'a' + i} initial={false} animate={{ opacity: found >= i + 2 ? 1 : 0.3 }} style={{ display: 'inline-flex', color: 'var(--ink2)' }}><Icon name="arrow_forward" size={18} /></motion.span>
          ]
        })}
      </div>
      <AnimatePresence mode="popLayout">
        {phase === 'extract' && <Busy key="x" text={found >= 4 ? '正在识别箱单…  厂商原版 PDF · 2 柜 · 26 托' : '正在沿单据链查找关联单据…'} />}
        {phase === 'writing' && <Busy key="w" tone="sync" text="正在回写 TMS…" />}
      </AnimatePresence>
      {showCompare && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <motion.section {...fadeUp(0)} data-demo="pl-table" style={{ borderRadius: 16, background: '#fff', border: '1px solid var(--line)', padding: '10px 14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr .8fr 1fr 1fr .8fr 1.3fr', gap: 8, padding: '6px 8px', fontSize: 12, color: 'var(--ink2)' }}>
              <span>柜号</span><span>字段</span><span>TMS</span><span>箱单</span><span>差异</span><span>以哪个为准</span>
            </div>
            <motion.div {...fadeUp(1)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 8px', borderRadius: 8, background: '#f3f8f6', fontSize: 14 }}>
              <span className="mono" style={{ width: '24%' }}>柜1 TGHU 8812046</span>
              <Icon name="check_circle" size={18} fill style={{ color: '#1e8e5a' }} /><span style={{ color: 'var(--ink2)' }}>件数、毛重、尺寸全部一致</span>
            </motion.div>
            {R.map((r, i) => (
              <motion.div key={r.k} {...fadeUp(i + 2, 0.12)} style={{ display: 'grid', gridTemplateColumns: '1.5fr .8fr 1fr 1fr .8fr 1.3fr', gap: 8, alignItems: 'center', padding: '10px 8px', borderTop: '1px solid #eef1f4', fontSize: 14 }}>
                <span className="mono">{i === 0 ? '柜2 MSKU 3305197' : ''}</span>
                <span>{r.field}</span>
                <motion.span className="num" initial={false} animate={{ color: '#9aa5b1' }} style={{ textDecoration: 'line-through' }}>{r.tms}</motion.span>
                <span className="num" style={{ fontWeight: 500 }}>{r.pl}</span>
                <span><span style={{ padding: '2px 8px', borderRadius: 999, background: '#fbe3e1', color: '#410e0b', fontSize: 12, fontWeight: 500 }}>{r.diff}</span></span>
                <span style={{ display: 'flex', gap: 6 }}>
                  <span style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid #1f6fd1', background: '#dceafe', color: '#0b2f66', fontSize: 12 }}>箱单</span>
                  <span style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid #9aa5b1', color: '#4a5562', fontSize: 12 }}>TMS</span>
                </span>
              </motion.div>
            ))}
          </motion.section>
          <motion.div {...fadeUp(5, 0.12)} data-demo="pl-advice" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: 12, background: '#dceafe', color: '#0b2f66', fontSize: 14 }}>
            <Icon name="auto_awesome" size={18} fill />提单记载 26 托，与箱单合计一致，建议以箱单为准
          </motion.div>
          {phase === 'review' && (
            <motion.div {...fadeUp(6, 0.12)} style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Btn demo="pl-confirm" icon="cloud_upload" onClick={confirm}>采纳并回写</Btn>
            </motion.div>
          )}
          {done && (
            <Done title="已回写 TMS" onBack={finish}>
              <motion.span {...fadeUp(2)} style={{ fontSize: 14, color: 'var(--ink2)' }}>柜2 更新为 <b style={{ color: 'var(--ink)', fontWeight: 500 }}>8 托 / 4,310 kg / 15.4 m³</b>；后续计费、配载按实际数据执行</motion.span>
            </Done>
          )}
        </div>
      )}
    </div>
  )
}
