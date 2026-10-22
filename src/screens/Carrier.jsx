import { motion, AnimatePresence } from 'motion/react'
import { useEffect, useState } from 'react'
import { Icon, Btn, Busy, Done, KV, PageHead, OrderAside, ChoiceChip, fmt, fadeUp, EASE } from '../ui.jsx'

const C = {
  HYD: { name: '恒运达供应链', tag: 'AI 推荐', price: 7850, perf: '42 h · 准时率 98.2%',
    plans: [{ k: 'A', name: '整车一口价', amount: 7850, calc: '报价 Q-HYD-2604' }, { k: 'B', name: '按吨计费', amount: 8170, calc: '¥2,150/t × 3.8 t' }] },
  PC: { name: '鹏驰运输', tag: '备选', price: 8400, perf: '40 h · 准时率 99.1%', plans: [{ k: 'A', name: '整车一口价', amount: 8400, calc: '报价 Q-PC-2601' }] },
  SC: { name: '顺程物流', tag: '已排除', price: 5320, perf: '零担 · 60 h 超时间窗', plans: [] }
}
const RULES = [
  { id: 'R-TR-012', text: '显示模组 ≥3 t 须整车' },
  { id: 'R-TR-005', text: '厦门方向合同承运商优先' },
  { id: 'R-TR-018', text: '50 h 时间窗内送达' }
]

export default function Carrier({ onDone, onBack }) {
  const [ready, setReady] = useState(false)
  const [sel, setSel] = useState('HYD')
  const [plan, setPlan] = useState('A')
  const [phase, setPhase] = useState('review')
  useEffect(() => { const t = setTimeout(() => setReady(true), 2200); return () => clearTimeout(t) }, [])

  const isMod = !(sel === 'HYD' && plan === 'A')
  const cur = C[sel]
  const curPlan = cur.plans.find((p) => p.k === plan) || cur.plans[0]
  const locked = phase !== 'review'
  const status = phase === 'done' ? { text: '已调度', bg: '#1f6fd1', fg: '#fff', icon: 'cloud_done' }
    : !ready ? { text: 'AI 匹配中', bg: '#dceafe', fg: '#0b2f66', icon: 'auto_awesome' }
    : isMod ? { text: '已修改 · 待确认', bg: '#dceafe', fg: '#0b2f66', icon: 'person_edit' }
    : { text: '待确认', bg: '#eef4fb', fg: '#0b2f66', icon: 'pending_actions' }
  const whyNot = [{ name: '鹏驰运输', text: '贵 ¥550（+7%），准时率仅高 0.9 pt' }, { name: '顺程物流', text: '零担，违反 R-TR-012' }]

  const confirm = () => { setPhase('writing'); setTimeout(() => setPhase('done'), 1300) }
  const finish = () => onDone({
    kind: isMod ? 'mod' : 'direct', decision: isMod ? '修改后采纳' : '采纳', summary: cur.name + ' · ' + fmt(curPlan.amount),
    snapshot: ['推荐 恒运达供应链 整车一口价 ¥7,850', '未选 鹏驰（+¥550）、顺程（零担违规）'],
    log: [{ t: '09:59', who: 'Agent', text: '推荐恒运达 ¥7,850' }, { t: '10:21', who: '林晓雯', text: '采纳：' + cur.name + ' ' + fmt(curPlan.amount) }, { t: '10:21', who: '系统', text: '回写 TMS，生成 DD-20261021-0311' }],
    toast: '调度单 DD-20261021-0311 已生成'
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHead title="承运商匹配" code="TMS-TR-20261021-0087" status={status} onBack={onBack} />
      <div style={{ display: 'flex', gap: 20 }}>
        <OrderAside items={[
          { k: '线路', v: '武汉一厂 → 厦门 鹭岛光显' }, { k: '货物', v: 'LCM 显示模组 · 12 托' },
          { k: '毛重 / 体积', v: '3,800 kg / 18.6 m³' }, { k: '提货 → 到货', v: '10/21 16:00 → 10/23 18:00' }, { k: '要求', v: '防震 · 禁止叠压' }
        ]} />
        <section style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <AnimatePresence mode="popLayout">
            {!ready && <Busy key="b" text="AI 正在匹配承运商…  读取订单 · 比对合同报价池 · 校验规则" />}
            {phase === 'writing' && <Busy key="w" tone="sync" text="正在回写 TMS…" />}
          </AnimatePresence>
          {phase === 'done' && (
            <Done title="调度单 DD-20261021-0311 已生成" onBack={finish}>
              <KV items={[{ k: '承运商', v: cur.name }, { k: '费用', v: curPlan.name + ' ' + fmt(curPlan.amount) }, { k: '订单状态', v: '待调度 → 已调度' }]} />
            </Done>
          )}
          {ready && phase !== 'done' && (
            <motion.div layout style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {['HYD', 'PC', 'SC'].map((k, i) => {
                  const c = C[k]; const on = sel === k; const ex = k === 'SC'
                  return (
                    <motion.button key={k} data-demo={'cand-' + k} {...fadeUp(i, 0.1)} onClick={() => !ex && !locked && (setSel(k), setPlan('A'))}
                      style={{ textAlign: 'left', padding: 16, borderRadius: 16, border: `2px solid ${on ? '#1f6fd1' : '#d3dce6'}`, background: on ? '#eef4fb' : '#fff', opacity: ex ? 0.6 : 1, display: 'flex', flexDirection: 'column', gap: 6, position: 'relative' }}>
                      <span style={{ alignSelf: 'flex-start', padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 500, background: k === 'HYD' ? '#1f6fd1' : ex ? '#fbe3e1' : '#eef4fb', color: k === 'HYD' ? '#fff' : ex ? '#410e0b' : '#0b2f66' }}>
                        {k === 'HYD' && <Icon name="auto_awesome" size={12} fill style={{ marginRight: 4, verticalAlign: -1 }} />}{c.tag}
                      </span>
                      <span style={{ fontSize: 17, fontWeight: 500 }}>{c.name}</span>
                      <span className="num" style={{ fontSize: 22, fontWeight: 500, color: ex ? 'var(--ink2)' : 'var(--ink)', textDecoration: ex ? 'line-through' : 'none' }}>{fmt(c.price)}</span>
                      <span style={{ fontSize: 13, color: ex ? 'var(--err)' : 'var(--ink2)' }}>{c.perf}</span>
                    </motion.button>
                  )
                })}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {cur.plans.map((p, i) => {
                  const on = curPlan.k === p.k
                  return (
                    <motion.button key={p.k} data-demo={'plan-' + p.k} {...fadeUp(i + 3, 0.1)} onClick={() => !locked && setPlan(p.k)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, border: `1px solid ${on ? '#1f6fd1' : '#d3dce6'}`, background: on ? '#eef4fb' : '#fff', textAlign: 'left' }}>
                      <Icon name={on ? 'radio_button_checked' : 'radio_button_unchecked'} size={20} style={{ color: on ? '#1f6fd1' : '#6f7a87' }} />
                      <span style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 14, fontWeight: 500 }}>{p.name}</span>
                        <span style={{ fontSize: 12, color: 'var(--ink2)' }}>{p.calc}</span>
                      </span>
                      <span className="num" style={{ fontSize: 16, fontWeight: 500 }}>{fmt(p.amount)}</span>
                    </motion.button>
                  )
                })}
              </div>
              <motion.section data-demo="carrier-why" {...fadeUp(5, 0.1)} style={{ borderRadius: 16, background: '#fff', border: '1px solid var(--line)', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 500 }}><Icon name="fact_check" size={18} style={{ color: 'var(--primary)' }} />判断依据</span>
                <div data-demo="carrier-rules" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {RULES.map((r, i) => (
                    <motion.span key={r.id} {...fadeUp(i + 6, 0.12)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: '#eef4fb', fontSize: 13 }}>
                      <Icon name="check" size={16} style={{ color: 'var(--primary)' }} /><b className="mono" style={{ fontWeight: 500 }}>{r.id}</b>{r.text}
                    </motion.span>
                  ))}
                </div>
                <span style={{ fontSize: 13, color: 'var(--ink2)' }}>参考报价 Q-HYD-2604（年度合同）· 近 90 天该线路 61 单</span>
                <div data-demo="carrier-whynot" style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
                  {whyNot.map((w) => <span key={w.name}><span style={{ color: 'var(--ink2)' }}>未选 {w.name}：</span>{w.text}</span>)}
                </div>
              </motion.section>
              {phase === 'review' && (
                <motion.div {...fadeUp(7, 0.1)} style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <Btn kind="outlined">驳回</Btn>
                  <Btn demo="carrier-confirm" icon="cloud_upload" onClick={confirm}>{isMod ? '修改后采纳' : '采纳'}</Btn>
                </motion.div>
              )}
            </motion.div>
          )}
        </section>
      </div>
    </div>
  )
}
