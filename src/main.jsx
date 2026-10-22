import { createRoot } from 'react-dom/client'
import './styles.css'
import Stage from './Stage.jsx'
import { run } from './director.js'

createRoot(document.getElementById('root')).render(<Stage />)

const params = new URLSearchParams(location.search)
window.__startDemo = () => run().catch((e) => { console.error(e); window.__demoError = String(e); window.__demoDone = true })
if (params.has('play')) {
  const t = setInterval(async () => {
    if (!window.__ctlReady) return
    clearInterval(t)
    await document.fonts.ready
    window.__startDemo()
  }, 50)
}
