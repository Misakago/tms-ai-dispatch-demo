import { motion, AnimatePresence } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Icon, Btn, Busy, Done, KV, PageHead, OrderAside, ChoiceChip, Progress, Tag, fmt, fadeUp, EASE, SPRING } from '../ui.jsx'

const STEP_MS = 1000
function plan(port) {
  if (port === 'YL') return {
    s1: '武汉阳逻港', s2: '不拆段，江海联运一票到底', s2why: 'R-CU-021 阳逻入境由国际代理全程承运', s2not: '拆段多一次换装交接',
    s3: '两柜整柜短驳',
    s3rows: [{ box: '柜1 TGHU 8812046', rate: '90%', dec: '整柜短驳', cmp: '¥1,200' }, { box: '柜2 MSKU 3305197', rate: '45%', dec: '整柜短驳', cmp: '¥1,200，比拆柜省 ¥850' }],
    segs: [
      { seg: '全程江海联运', agent: '东瀚国际货代', quote: 'Q-DH-2610-09', alt: '远洋通：无支线舱位', sub: '¥23,916' },
      { seg: '武汉清关', agent: '江城报关行', quote: 'Q-JC-2610-02', alt: '汉通关务 ¥720', sub: '¥650' },
      { seg: '阳逻短驳', agent: '楚运车队', quote: 'Q-CY-2607', alt: '拆柜转厢车 +¥850/柜', sub: '¥2,400' }
    ], total: 26966, eta: '11/02', etaN: 1102 }
  return {
    s1: '上海洋山港', s2: '拆为国际段 + 国内段', s2why: 'R-CU-020 入境口岸与目的地不同城市则拆段', s2not: '洋山至武汉走公路更快，国内段可单独比价',
    s3: '柜1 整柜 · 柜2 拆柜',
    s3rows: [{ box: '柜1 TGHU 8812046', rate: '90%', dec: '整柜直送', cmp: '¥9,800' }, { box: '柜2 MSKU 3305197', rate: '45%', dec: '口岸拆柜', cmp: '¥7,350，比整柜省 ¥2,450' }],
    segs: [
      { seg: '国际段', agent: '东瀚国际货代', quote: 'Q-DH-2610-07', alt: '远洋通 贵 5.1%', sub: '¥20,306' },
      { seg: '国内段 柜1', agent: '申江集运', quote: 'Q-SJ-2609-12', alt: '华程集运 ¥10,300', sub: '¥9,800' },
      { seg: '国内段 柜2', agent: '恒运达供应链', quote: 'Q-HYD-2604', alt: '整柜拖车 ¥9,800', sub: '¥7,350' }
    ], total: 37456, eta: '10/28', etaN: 1028 }
}
const PORTS = [
  { k: 'SH', name: '上海洋山', etaN: 1028, eta: '10/28', cost: 37456 },
  { k: 'YL', name: '武汉阳逻', etaN: 1102, eta: '11/02', cost: 26966 },
  { k: 'NB', name: '宁波舟山', etaN: 1029, eta: '10/29', cost: 39792 }
]
const REASONS = ['工厂可延至 11/03', '上海查验率高', '指定口岸']

function Step({ n, title, show, progress, dim, children, head, border = '#d3dce6', demo }) {
  return (
    <motion.article layout data-demo={demo} initial={false} animate={{ borderColor: border }} transition={{ layout: SPRING, duration: 0.4 }}
      style={{ borderRadius: 16, background: '#fff', border: '1px solid', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
      <motion.div layout="position" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <motion.span initial={false} animate={{ backgroundColor: show ? '#1f6fd1' : '#9aa5b1' }} style={{ width: 26, height: 26, borderRadius: '50%', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 500 }}>{n}</motion.span>
        <span style={{ fontSize: 14, color: 'var(--ink2)' }}>{title}</span>
        <AnimatePresence mode="popLayout">
          {show && <motion.span key={head.text} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: EASE }} style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <motion.span animate={{ opacity: dim ? 0.4 : 1 }} style={{ fontSize: 19, fontWeight: 500 }}>{head.text}</motion.span>{!dim && head.tags}
          </motion.span>}
        </AnimatePresence>
        <span style={{ flex: 1 }} />
        {head.right}
      </motion.div>
      <AnimatePresence initial={false}>
        {progress && <motion.div key="p" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Progress /></motion.div>}
        {show && (
          <motion.div key="c" initial={{ opacity: 0, height: 0 }} animate={{ opacity: dim ? 0.32 : 1, height: 'auto', filter: dim ? 'blur(1.2px)' : 'blur(0px)' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.5, ease: EASE }} style={{ overflow: 'hidden' }}>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  )
}

export default function Import({ onDone, onBack }) {
  const [s, set] = useState({ revealed: 0, port: 'SH', prevPort: 'SH', reason: -1, editing: false, editPort: 'YL', editReason: -1, recomputing: false, recompStep: 0, phase: 'review' })
  const up = (o) => set((p) => ({ ...p, ...o }))
  const timers = useRef([])
  useEffect(() => {
    timers.current = [1, 2, 3, 4].map((i) => setTimeout(() => up({ revealed: i }), 700 + i * STEP_MS))
    return () => timers.current.forEach(clearTimeout)
  }, [])
  const p = plan(s.port)
  const base = plan('SH')
  const modified = s.port !== 'SH'
  const thinking = s.revealed < 4
  const deadlineN = (s.port === 'YL' && s.reason === 0) ? 1103 : 1031
  const deadlineText = deadlineN === 1103 ? '11/03' : '10/31'
  const locked = s.phase !== 'review'
  const pv = plan(s.prevPort)
  const stale = (i) => s.recomputing && i >= s.recompStep
  const P = (i) => stale(i) ? pv : p
  const stepState = (i) => {
    const show = s.revealed >= i
    const progress = (thinking && s.revealed === i - 1) || (s.recomputing && i === s.recompStep)
    return { show, progress, dim: stale(i) }
  }
  const ready = !thinking && !s.recomputing
  const diff = base.total - p.total
  const status = s.phase === 'done' ? { text: '已回写 TMS', bg: '#1f6fd1', fg: '#fff', icon: 'cloud_done' }
    : (thinking || s.recomputing) ? { text: 'AI 推理中', bg: '#dceafe', fg: '#0b2f66', icon: 'auto_awesome' }
    : modified ? { text: '已修改 · 待确认', bg: '#dceafe', fg: '#0b2f66', icon: 'person_edit' }
    : { text: '待确认', bg: '#eef4fb', fg: '#0b2f66', icon: 'pending_actions' }
  const recalcTag = modified && <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}><Tag bg="#dceafe" fg="#0b2f66"><Icon name="refresh" size={12} style={{ verticalAlign: -2, marginRight: 3 }} />已重算</Tag></motion.span>

  const apply = () => {
    up({ prevPort: s.port, port: s.editPort, reason: s.editReason, editing: false, recomputing: true, recompStep: 2 })
    timers.current.push(setTimeout(() => up({ recompStep: 3 }), 1000))
    timers.current.push(setTimeout(() => up({ recompStep: 4 }), 2000))
    timers.current.push(setTimeout(() => up({ recomputing: false, recompStep: 0 }), 3000))
  }
  const confirm = () => { up({ phase: 'writing', editing: false }); timers.current.push(setTimeout(() => up({ phase: 'done' }), 1400)) }
  const reasonText = REASONS[s.reason] || ''
  const finish = () => onDone({
    kind: modified ? 'mod' : 'direct', decision: modified ? '修改后采纳' : '采纳', summary: p.s1 + ' · ' + fmt(p.total),
    exNote: modified ? '改为' + p.s1 : '按交期走上海',
    snapshot: ['v1：上海洋山 · 拆 3 段 · 柜2 拆柜 · ¥37,456 · 10/28 到厂'].concat(modified ? ['v2：' + p.s1 + ' · ' + p.s2 + ' · ' + fmt(p.total) + ' · ' + p.eta + ' 到厂'] : []),
    log: [
      { t: '10:12', who: 'Agent', text: '建议 v1：上海洋山 · 3 段 · 柜2 拆柜 · ¥37,456（规则冲突）' },
      ...(modified ? [{ t: '10:46', who: '周启航', text: '第 1 步改为' + p.s1 + '：' + reasonText }, { t: '10:46', who: 'Agent', text: '重算 v2：' + p.s2 + ' · ' + p.s3 + ' · ' + fmt(p.total) }] : []),
      { t: '10:47', who: '周启航', text: modified ? '修改后采纳' : '采纳' },
      { t: '10:47', who: '系统', text: '回写 TMS 成功 · 反馈规则 R-CU-011' }
    ],
    toast: '已回写 TMS：进口订单已委托 · ' + fmt(p.total)
  })

  const st1 = stepState(1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHead title="进口订单匹配" code="TMS-CI-20261021-0142" status={status} onBack={onBack} />
      <div style={{ display: 'flex', gap: 20 }}>
        <OrderAside items={[
          { k: '航线', v: '横滨 → 武汉一厂' }, { k: '货物', v: '2×40HQ · 27 托 · 13,960 kg' },
          { k: '柜1 TGHU 8812046', v: '偏光片 18 托' }, { k: '柜2 MSKU 3305197', v: '光学膜材 9 托' },
          { k: '要求到厂', v: deadlineText, fg: deadlineN === 1103 ? '#1f6fd1' : '#1a1f26' }
        ]} />
        <section style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <AnimatePresence mode="popLayout">
            {s.phase === 'writing' && <Busy key="w" tone="sync" text="正在回写 TMS…" />}
          </AnimatePresence>
          {s.phase === 'done' && (
            <Done title="已回写 TMS · 修改后采纳" onBack={finish}
              extra={<motion.span {...fadeUp(6)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start', padding: '6px 12px', borderRadius: 8, background: '#dceafe', color: '#0b2f66', fontSize: 13 }}><Icon name="model_training" size={16} />修改原因“{reasonText}”已反馈至规则 R-CU-011</motion.span>}>
              <KV items={[{ k: '入境口岸', v: '武汉阳逻港' }, { k: '运输段', v: '1 段（江海联运）' }, { k: '要求到厂', v: '10/31 → 11/03' }, { k: '费用', v: fmt(p.total) }]} />
            </Done>
          )}

          <Step n={1} title="入境口岸" demo="step1" show={st1.show} progress={st1.progress} border={modified ? '#1f6fd1' : (st1.show ? '#e8a29d' : '#d3dce6')}
            head={{ text: p.s1, tags: modified ? <Tag bg="#1f6fd1" fg="#fff">人工修改</Tag> : <Tag bg="#fbe3e1" fg="#410e0b">规则冲突</Tag>,
              right: ready && !locked && !s.editing && <Btn kind="outlined" icon="edit" demo="import-edit" onClick={() => up({ editing: true, editPort: 'SH', editReason: -1 })} style={{ height: 34 }}>修改</Btn> }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <AnimatePresence mode="popLayout" initial={false}>
                {!modified ? (
                  <motion.div key="cf" data-demo="import-conflict" exit={{ opacity: 0, scale: 0.98 }} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 14px', borderRadius: 12, background: '#fbe3e1', color: '#410e0b', fontSize: 13 }}>
                    <span style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="call_split" size={18} />两条规则结论不同，已按优先级选上海</span>
                    <span><b className="mono" style={{ fontWeight: 500 }}>R-CU-011</b> 交期优先（P1）→ 上海洋山</span>
                    <span><b className="mono" style={{ fontWeight: 500 }}>R-CU-003</b> 属地报关（P2）→ 武汉阳逻，省 ¥10,490，但晚 2 天</span>
                  </motion.div>
                ) : (
                  <motion.div key="md" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, background: '#dceafe', color: '#0b2f66', fontSize: 13 }}>
                    <Icon name="person_edit" size={18} />周启航改为{p.s1} · {reasonText}
                  </motion.div>
                )}
              </AnimatePresence>
              <div data-demo="port-table" style={{ fontSize: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr', gap: 8, padding: '4px 10px', fontSize: 12, color: 'var(--ink2)' }}>
                  <span>口岸</span><span>预计到厂</span><span>全程费用</span><span>交期</span>
                </div>
                {PORTS.map((x) => {
                  const late = x.etaN > deadlineN; const cur = x.k === s.port
                  return (
                    <motion.div key={x.k} layout initial={false} animate={{ backgroundColor: cur ? '#eef4fb' : 'rgba(238,244,251,0)' }} transition={{ duration: 0.4 }}
                      style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr', gap: 8, padding: '9px 10px', borderRadius: 8, fontWeight: cur ? 500 : 400 }}>
                      <span>{x.name}{cur && <Icon name="check" size={16} style={{ color: 'var(--primary)', marginLeft: 6, verticalAlign: -3 }} />}</span>
                      <span className="num">{x.eta}</span><span className="num">{fmt(x.cost)}</span>
                      <motion.span initial={false} animate={{ color: late ? '#b3261e' : '#1f6fd1' }}>{late ? '晚 2 天' : '满足'}</motion.span>
                    </motion.div>
                  )
                })}
              </div>
              <AnimatePresence>
                {s.editing && (
                  <motion.div key="ed" data-demo="import-editor" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.45, ease: EASE }} style={{ overflow: 'hidden' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 16, borderRadius: 12, border: '2px solid #1f6fd1', background: '#f8fbff' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                        {PORTS.map((x) => {
                          const on = s.editPort === x.k
                          return (
                            <motion.button key={x.k} data-demo={'port-' + x.k} onClick={() => up({ editPort: x.k })} initial={false}
                              animate={{ borderColor: on ? '#1f6fd1' : '#d3dce6', backgroundColor: on ? '#dceafe' : '#ffffff' }}
                              style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 2, padding: 12, borderRadius: 12, border: '2px solid' }}>
                              <span style={{ fontSize: 15, fontWeight: 500 }}>{x.name}</span>
                              <span className="num" style={{ fontSize: 12, color: 'var(--ink2)' }}>{x.eta} 到厂 · {fmt(x.cost)}</span>
                            </motion.button>
                          )
                        })}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, color: 'var(--ink2)' }}>原因</span>
                        {REASONS.map((t, i) => <ChoiceChip key={t} demo={'reason-' + i} on={s.editReason === i} onClick={() => up({ editReason: i })}>{t}</ChoiceChip>)}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Btn demo="import-apply" icon="refresh" disabled={!(s.editPort !== s.port && s.editReason >= 0)} onClick={apply}>应用并重算后续步骤</Btn>
                        <Btn kind="text" onClick={() => up({ editing: false })}>取消</Btn>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Step>

          <Step n={2} title="是否拆段" demo="step2" {...stepState(2)} head={{ text: P(2).s2, tags: recalcTag }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingLeft: 36, fontSize: 13, color: 'var(--ink2)' }}>
              <span>依据 <span className="mono">{P(2).s2why}</span></span><span>未选另一种：{P(2).s2not}</span>
            </div>
          </Step>

          <Step n={3} title="是否拆柜" demo="step3" {...stepState(3)} head={{ text: P(3).s3, tags: recalcTag }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 36 }}>
              {P(3).s3rows.map((r) => (
                <div key={r.box} style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                  <span className="mono" style={{ width: 150 }}>{r.box}</span><span style={{ width: 80, color: 'var(--ink2)' }}>装载 {r.rate}</span>
                  <span style={{ width: 80, fontWeight: 500 }}>{r.dec}</span><span style={{ color: 'var(--ink2)' }}>{r.cmp}</span>
                </div>
              ))}
              <span style={{ fontSize: 12, color: 'var(--ink2)' }}>依据 <span className="mono">R-CU-024</span> 装载率 &lt; 60% 且拆柜更省时拆柜</span>
            </div>
          </Step>

          <Step n={4} title="代理与费用" demo="step4" {...stepState(4)} head={{ text: '', tags: recalcTag }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {P(4).segs.map((g) => (
                <div key={g.seg} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '8px 12px', borderRadius: 10, background: '#f8fbff' }}>
                  <span style={{ width: 96, fontSize: 13, color: 'var(--ink2)' }}>{g.seg}</span>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{g.agent} <span className="mono" style={{ fontSize: 12, color: 'var(--ink2)', fontWeight: 400 }}>· {g.quote}</span></span>
                    <span style={{ fontSize: 12, color: 'var(--ink2)' }}>未选 {g.alt}</span>
                  </div>
                  <span className="num" style={{ fontSize: 15, fontWeight: 500 }}>{g.sub}</span>
                </div>
              ))}
            </div>
          </Step>

          <AnimatePresence>
            {ready && s.phase !== 'done' && (
              <motion.div key="sum" layout data-demo="import-summary" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: EASE }}
                style={{ display: 'flex', alignItems: 'center', gap: 28, padding: '16px 20px', borderRadius: 16, background: '#0b2f66', color: '#fff' }}>
                {[['全程费用', fmt(p.total)], ['预计到厂', p.eta], ['要求到厂', deadlineText]].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 12, opacity: 0.7 }}>{k}</span>
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span key={v} className="num" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.45, ease: EASE }} style={{ fontSize: 22, fontWeight: 500 }}>{v}</motion.span>
                    </AnimatePresence>
                  </div>
                ))}
                <span style={{ flex: 1 }} />
                {modified && <motion.span initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.3 }}
                  style={{ padding: '6px 14px', borderRadius: 999, background: '#7ee0b0', color: '#053b22', fontSize: 14, fontWeight: 600 }}>{diff > 0 ? '省 ' + fmt(diff) : '多 ' + fmt(-diff)} · 较 AI 原建议</motion.span>}
                {!modified && <span style={{ padding: '6px 14px', borderRadius: 999, background: 'rgba(255,255,255,.14)', fontSize: 13 }}>满足交期</span>}
              </motion.div>
            )}
          </AnimatePresence>
          {ready && s.phase === 'review' && (
            <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Btn kind="outlined">驳回</Btn>
              {modified && <Btn kind="text" onClick={() => up({ port: 'SH', reason: -1 })}>恢复 AI 建议</Btn>}
              <Btn demo="import-confirm" icon="cloud_upload" onClick={confirm}>{modified ? '修改后采纳' : '采纳'}</Btn>
            </motion.div>
          )}
        </section>
      </div>
    </div>
  )
}
