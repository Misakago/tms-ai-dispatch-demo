# TMS 智能调度 · Demo 讲解视频工程

用 React + [motion.dev](https://motion.dev) 搭建的 TMS 智能调度可交互演示，并通过「虚拟时钟 + 逐帧截图」确定性录制为 1080p / 60fps 讲解视频。

设计理念：**AI 给建议，人来拍板**。Agent 读取 TMS 订单给出建议与判断依据，业务人员确认后回写 TMS，全程可追溯。

> 演示中的企业、承运商、人员、车牌、单号均为虚构数据。

## 演示主线

| # | 主线 | 看点 |
|---|---|---|
| 01 | 运输｜承运商匹配 | 推荐承运商与费用方案，讲清命中规则与未选原因 |
| 02 | 运输｜邮件转订单 | 字段出处可回溯；低置信度字段必须人工确认 |
| 03 | 关务｜进口订单匹配 | 四步推理（口岸 → 拆段 → 拆柜 → 代理费用）；改一步、后续自动重算 |
| 04 | 关务｜箱单识别 | 沿单据链关联箱单，与 TMS 逐柜比对 |
| 05 | 关务｜合并 / 单独送货 | 放行清单自动分组；A 角提交、B 角确认 |

## 目录

```
src/App.jsx        工作台、追溯记录、页面框架
src/screens/       五条主线页面
src/Stage.jsx      演示舞台：镜头、虚拟光标、高亮框、字幕、章节卡、片头片尾
src/director.js    演示脚本（时间线 + 字幕）
record.mjs         逐帧录制器（虚拟时钟 + CDP 截图 + ffmpeg）
make_doc.py        生成 Word 功能说明与口述稿
```

## 使用

需要 Node 18+、ffmpeg、本机 Google Chrome。

```bash
npm install
npm run dev                      # 浏览器打开 http://localhost:5173/?play 实时预览
npx vite build && node record.mjs --out out/demo.mp4   # 渲染 1920×1080 60fps 成片
node record.mjs --dry            # 只导出字幕时间线 out/timeline.json（不截图）
python3 make_doc.py              # 生成口述稿 docx（需 python-docx）
```

录制参数：`--fps 60`、`--scale 1.3333`（1440×810 → 1920×1080）、`--q 95`（截图质量）、`--max <帧数>`、`--snap <间隔帧>`（导出抽检帧）。

## 录制原理

页面加载前注入虚拟时钟，接管 `setTimeout`、`setInterval`、`requestAnimationFrame`、`performance.now` 与 `Date.now`，并移除 `Element.prototype.animate`，让 motion 全部走 JS 帧循环。录制器每帧推进 1/60 秒、等待 React 提交后截图，因此成片与机器性能无关、不掉帧。
