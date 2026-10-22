import { motion, AnimatePresence } from 'motion/react'
import { useState } from 'react'
import { Icon, Btn, Busy, Done, PageHead, fadeUp, EASE } from '../ui.jsx'

const ADDR = { '328': '苏州工业园区星湖街 328 号 3 号门', '238': '苏州工业园区星湖街 238 号' }
const BODY = ['晓雯你好，麻烦安排一票发货：', '提货：10 月 22 日上午 9 点，武汉一厂成品仓', '收货：瑞泓电子（苏州）有限公司', '地址：苏州工业园区星湖街 328 号 3 号门', '收货人：吴晓峰 138****6621', '货物：背光模组 BLU-156A，8 托，详见附件', '请 10 月 24 日前送到，仓库只能尾板车卸货。', '谢谢！张蔓']
const CELLS = [['A', '物料', '背光模组 BLU-156A'], ['B', '订单', 'RH-PO-26-3381'], ['C', '毛重', '2,460 kg'], ['D', '体积', '11.2 m³'], ['E', '收货地址', '苏州工业园区星湖街 238 号'], ['F', '托数', '8']]

export default function Email({ onDone, onBack }) {
  const [phase, setPhase] = useState('arrived')
  const [sel, setSel] = useState('address')
  const [addr, setAddr] = useState('')
  const extracted = phase === 'review'
  const resolved = !!addr
  const F = [
    { k: 'customer', label: '客户', value: '瑞泓电子（苏州）', src: 'L3', conf: 99, lines: [3], cells: [] },
    { k: 'po', label: '客户订单', value: 'RH-PO-26-3381', src: 'B', conf: 98, lines: [], cells: ['B'] },
    { k: 'pickup', label: '提货', value: '10/22 09:00 · 武汉一厂', src: 'L2', conf: 96, lines: [2], cells: [] },
    { k: 'address', label: '收货地址', value: resolved ? ADDR[addr] : '星湖街 328 / 238 号？', src: 'L4 · E', conf: 58, lines: [4], cells: ['E'] },
    { k: 'consignee', label: '收货人', value: '吴晓峰 138****6621', src: 'L5', conf: 96, lines: [5], cells: [] },
    { k: 'goods', label: '货物', value: '背光模组 BLU-156A · 8 托', src: 'L6 · A F', conf: 99, lines: [6], cells: ['A', 'F'] },
    { k: 'weight', label: '毛重 / 体积', value: '2,460 kg / 11.2 m³', src: 'C D', conf: 97, lines: [], cells: ['C', 'D'] },
    { k: 'due', label: '要求', value: '10/24 前到 · 尾板车', src: 'L7', conf: 91, lines: [7], cells: [] }
  ]
  const selF = extracted ? F.find((f) => f.k === sel) : null
  const conflictSel = selF && selF.k === 'address' && !resolved
  const hl = (on) => on ? { backgroundColor: conflictSel ? '#fbe3e1' : '#dceafe', boxShadow: `inset 0 0 0 2px ${conflictSel ? '#b3261e' : '#1f6fd1'}` } : { backgroundColor: 'rgba(255,255,255,0)', boxShadow: 'inset 0 0 0 0px rgba(31,111,209,0)' }
  const status = phase === 'done' ? { text: '已创建订单', bg: '#1f6fd1', fg: '#fff', icon: 'cloud_done' }
    : phase === 'arrived' ? { text: '待转单', bg: '#eef4fb', fg: '#0b2f66', icon: 'mark_email_unread' }
    : phase === 'extracting' ? { text: 'AI 提取中', bg: '#dceafe', fg: '#0b2f66', icon: 'auto_awesome' }
    : resolved ? { text: '可创建', bg: '#dceafe', fg: '#0b2f66', icon: 'task_alt' }
    : { text: '1 个字段待确认', bg: '#fbe3e1', fg: '#410e0b', icon: 'help' }

  const extract = () => { setPhase('extracting'); setTimeout(() => { setPhase('review'); setSel('address') }, 2000) }
  const create = () => { setPhase('creating'); setTimeout(() => setPhase('done'), 1300) }
  const finish = () => onDone({
    kind: 'mod', decision: '修改后采纳', summary: '已创建 TMS-TR-20261021-0093',
    exNote: '地址确认为 328 号',
    snapshot: ['提取 8 组字段，收货地址置信度 58%（正文 328 号 ≠ 附件 238 号）'],
    log: [{ t: '10:06', who: 'Agent', text: '提取字段，标记 1 个低置信度' }, { t: '10:33', who: '林晓雯', text: '确认地址：' + ADDR['328'] }, { t: '10:34', who: '系统', text: '创建 TMS-TR-20261021-0093' }],
    toast: '已创建订单 TMS-TR-20261021-0093'
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHead title="邮件转订单" status={status} onBack={onBack} />
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        <section style={{ flex: '0 0 520px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <motion.article {...fadeUp(0)} data-demo="mail-body" style={{ borderRadius: 16, background: '#fff', border: '1px solid var(--line)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 15, fontWeight: 500 }}>【发货需求】10/22 武汉→苏州 背光模组 8 托</span>
              <span style={{ fontSize: 12, color: 'var(--ink2)' }}>张蔓 · 瑞泓电子 · 10:06</span>
            </div>
            <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {BODY.map((t, i) => {
                const on = !!selF && selF.lines.includes(i + 1)
                return (
                  <motion.div key={i} data-demo={'L' + (i + 1)} initial={false} animate={hl(on)} transition={{ duration: 0.35, ease: EASE }}
                    style={{ display: 'flex', gap: 10, padding: '5px 8px', borderRadius: 8, fontSize: 14 }}>
                    <span className="mono" style={{ width: 22, color: 'var(--ink3)', fontSize: 12, paddingTop: 2 }}>L{i + 1}</span>
                    <span>{t}</span>
                  </motion.div>
                )
              })}
            </div>
          </motion.article>
          <motion.article {...fadeUp(1)} data-demo="mail-attach" style={{ borderRadius: 16, background: '#fff', border: '1px solid var(--line)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
              <Icon name="attach_file" size={18} style={{ color: 'var(--ink2)' }} />
              <span>发货通知单_RH-DN-261022.xlsx</span>
            </div>
            <div style={{ padding: 12, display: 'grid', gridTemplateColumns: '1.35fr 1.15fr .8fr .7fr 1.6fr .65fr', fontSize: 12 }}>
              {CELLS.map((c) => <span key={c[0]} style={{ whiteSpace: 'nowrap', padding: '4px 6px', color: 'var(--ink2)', background: '#f3f6fa' }}>{c[0]} {c[1]}</span>)}
              {CELLS.map((c) => {
                const on = !!selF && selF.cells.includes(c[0])
                return <motion.span key={'v' + c[0]} data-demo={'cell-' + c[0]} initial={false} animate={hl(on)} transition={{ duration: 0.35 }} style={{ padding: '8px 6px', borderRadius: 6 }}>{c[2]}</motion.span>
              })}
            </div>
          </motion.article>
        </section>

        <section style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <AnimatePresence mode="popLayout">
            {phase === 'arrived' && (
              <motion.div key="a" {...fadeUp(2)} exit={{ opacity: 0, y: -8 }} style={{ borderRadius: 16, background: '#fff', border: '1px dashed #9aa5b1', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                <Icon name="mark_email_unread" size={34} style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: 15 }}>新的发货需求邮件</span>
                <Btn demo="email-extract" icon="auto_awesome" onClick={extract}>AI 提取订单字段</Btn>
              </motion.div>
            )}
            {phase === 'extracting' && <Busy key="e" text="正在读取正文与附件…" />}
            {phase === 'creating' && <Busy key="c" tone="sync" text="正在 TMS 中创建订单…" />}
          </AnimatePresence>
          {phase === 'done' && (
            <Done title="已创建 TMS-TR-20261021-0093" onBack={finish}>
              <motion.span {...fadeUp(2)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--ink2)' }}><Icon name="move_down" size={18} style={{ color: 'var(--primary)' }} />已自动进入承运商匹配队列</motion.span>
            </Done>
          )}
          {extracted && (
            <motion.div layout style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {F.map((f, i) => {
                  const on = sel === f.k
                  const low = f.k === 'address' && !resolved
                  const human = f.k === 'address' && resolved
                  return (
                    <motion.button key={f.k} data-demo={'field-' + f.k} {...fadeUp(i, 0.07)} onClick={() => setSel(f.k)}
                      style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 4, padding: '10px 12px', borderRadius: 12, border: `1px solid ${on ? (low ? '#b3261e' : '#1f6fd1') : '#d3dce6'}`, background: on ? (low ? '#fff7f6' : '#eef4fb') : '#fff' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink2)' }}>
                        {f.label}<span className="mono" style={{ color: 'var(--ink3)' }}>· {f.src}</span>
                        <span style={{ flex: 1 }} />
                        <motion.span layout style={{ padding: '1px 8px', borderRadius: 999, fontSize: 11, fontWeight: 500, background: low ? '#b3261e' : human ? '#1f6fd1' : '#eef4fb', color: low || human ? '#fff' : '#4a5562' }}>{human ? '已确认' : f.conf + '%'}</motion.span>
                      </span>
                      <AnimatePresence mode="popLayout" initial={false}>
                        <motion.span key={f.value} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ fontSize: 14, fontWeight: 500, color: low ? '#b3261e' : 'var(--ink)' }}>{f.value}</motion.span>
                      </AnimatePresence>
                    </motion.button>
                  )
                })}
              </div>
              <AnimatePresence>
                {!resolved && (
                  <motion.div key="r" data-demo="addr-resolve" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.45, ease: EASE, delay: 0.5 }}
                    style={{ overflow: 'hidden', borderRadius: 16, background: '#fff', border: '2px solid var(--err)' }}>
                    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 500, color: 'var(--err-ink)' }}><Icon name="help" size={18} style={{ color: 'var(--err)' }} />收货地址：正文 328 号，附件 238 号</span>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {[{ k: '328', text: '328 号 3 号门', meta: '正文 + 客户主数据一致 · AI 倾向' }, { k: '238', text: '238 号', meta: '仅附件' }].map((a) => (
                          <button key={a.k} data-demo={'addr-' + a.k} onClick={() => { setAddr(a.k); setSel('address') }}
                            style={{ textAlign: 'left', padding: 12, borderRadius: 12, border: `1px solid ${a.k === '328' ? '#1f6fd1' : '#9aa5b1'}`, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontSize: 15, fontWeight: 500 }}>{a.text}</span>
                            <span style={{ fontSize: 12, color: a.k === '328' ? 'var(--primary)' : 'var(--ink2)' }}>{a.k === '328' && <Icon name="auto_awesome" size={12} fill style={{ marginRight: 4, verticalAlign: -1 }} />}{a.meta}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <motion.div layout style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <Btn demo="email-create" icon="add_task" disabled={!resolved} onClick={create}>在 TMS 创建订单</Btn>
              </motion.div>
            </motion.div>
          )}
        </section>
      </div>
    </div>
  )
}
