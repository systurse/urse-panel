/**
 * Widget de atención al usuario (SSM) — para incrustar en sitios externos.
 *
 * Modo burbuja flotante (por defecto):
 *   <script src="https://app.urse.edu.mx/widget-ssm.js" defer></script>
 *
 * Modo inline (el formulario dentro de un contenedor de la página):
 *   <div id="ssm-widget"></div>
 *   <script src="https://app.urse.edu.mx/widget-ssm.js" data-mode="inline" defer></script>
 *
 * Atributos opcionales:
 *   data-mode="bubble|inline"   burbuja flotante o formulario embebido (default: bubble)
 *   data-target="#ssm-widget"   selector del contenedor en modo inline
 *   data-color="#1a1a1a"        color de la burbuja y su encabezado
 *   data-text="Soporte URSE"    etiqueta de la burbuja
 *   data-panel-url="https://…"  origen del panel; por defecto se toma del src del script
 */
(function () {
  'use strict'

  const script = document.currentScript
  if (!script) {
    return
  }

  const panelUrl = (script.dataset.panelUrl || script.src.replace(/\/widget-ssm\.js.*$/, '')).replace(/\/+$/, '')
  const panelOrigin = new URL(panelUrl).origin
  const widgetSrc = panelUrl + '/soporte?embed=1'
  const mode = script.dataset.mode || 'bubble'
  const color = script.dataset.color || '#1a1a1a'
  const text = script.dataset.text || 'Soporte URSE'

  function createFrame () {
    const iframe = document.createElement('iframe')
    iframe.src = widgetSrc
    iframe.title = 'Atención al usuario URSE'
    iframe.style.border = '0'
    iframe.style.width = '100%'
    iframe.style.background = 'transparent'
    iframe.setAttribute('loading', 'lazy')
    return iframe
  }

  // ------------------------------------------------------------- modo inline
  if (mode === 'inline') {
    const target = document.querySelector(script.dataset.target || '#ssm-widget')
    if (!target) {
      console.warn('[widget-ssm] no existe el contenedor para data-mode="inline"')
      return
    }

    const inlineFrame = createFrame()
    inlineFrame.style.height = '760px'
    target.append(inlineFrame)

    // El formulario reporta su altura real para que el iframe crezca solo
    window.addEventListener('message', function (event) {
      if (event.origin === panelOrigin && event.data && event.data.type === 'ssm-widget:height') {
        inlineFrame.style.height = Math.max(360, event.data.height) + 'px'
      }
    })
    return
  }

  // ---------------------------------------------------- modo burbuja flotante
  let open = false

  const panel = document.createElement('div')
  panel.style.cssText = 'position:fixed;bottom:92px;right:20px;width:400px;max-width:calc(100vw - 32px);'
    + 'height:640px;max-height:calc(100vh - 120px);background:#fff;border-radius:16px;overflow:hidden;'
    + 'box-shadow:0 12px 40px rgba(0,0,0,.28);display:none;flex-direction:column;z-index:2147483000;'

  const header = document.createElement('div')
  header.style.cssText = 'background:' + color + ';color:#fff;font:600 14px/1 system-ui,sans-serif;'
    + 'padding:14px 16px;flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;gap:8px;'

  const headerTitle = document.createElement('span')
  headerTitle.textContent = text
  header.append(headerTitle)

  // Salida alterna si el navegador bloquea el iframe (X-Frame-Options/CSP)
  const popout = document.createElement('a')
  popout.href = panelUrl + '/soporte'
  popout.target = '_blank'
  popout.rel = 'noopener'
  popout.textContent = 'Abrir en pestaña nueva ↗'
  popout.style.cssText = 'color:#fff;font:400 11px/1 system-ui,sans-serif;text-decoration:underline;opacity:.85;white-space:nowrap;'
  header.append(popout)

  panel.append(header)

  const frameWrap = document.createElement('div')
  frameWrap.style.cssText = 'flex:1;min-height:0;'
  panel.append(frameWrap)

  const bubble = document.createElement('button')
  bubble.type = 'button'
  bubble.setAttribute('aria-label', text)
  bubble.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none">'
    + '<path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-4 4a.6.6 0 0 1-1-.45V5Z" fill="#fff"/>'
    + '<circle cx="9" cy="10" r="1.3" fill="' + color + '"/><circle cx="13" cy="10" r="1.3" fill="' + color + '"/>'
    + '<circle cx="17" cy="10" r="1.3" fill="' + color + '"/></svg>'
  bubble.style.cssText = 'position:fixed;bottom:20px;right:20px;width:56px;height:56px;border-radius:50%;'
    + 'border:0;cursor:pointer;background:' + color + ';display:flex;align-items:center;justify-content:center;'
    + 'box-shadow:0 6px 20px rgba(0,0,0,.3);z-index:2147483001;'

  let bubbleFrame = null

  bubble.addEventListener('click', function () {
    open = !open
    panel.style.display = open ? 'flex' : 'none'

    // El iframe se carga hasta el primer clic para no penalizar la página anfitriona
    if (open && !bubbleFrame) {
      bubbleFrame = createFrame()
      bubbleFrame.style.height = '100%'
      frameWrap.append(bubbleFrame)
    }
  })

  document.body.append(panel)
  document.body.append(bubble)
})()
