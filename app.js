window.addEventListener('DOMContentLoaded', () => {
  const view = document.getElementById('game-view');
  const term = document.getElementById('terminal');
  const urlBar = document.getElementById('url-bar');
  const sidebar = document.getElementById('sidebar');

  function log(msg) {
    const line = document.createElement('div');
    line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    term.appendChild(line);
    term.scrollTop = term.scrollHeight;
  }

  function injectFullControls() {
    view.executeJavaScript(`
      if (!window.__allControlsInstalled) {
        window.__allControlsInstalled = true;
        window.__virtualLocked = false;
        let lastX = null, lastY = null;

        Element.prototype.requestPointerLock = function() {
          window.__virtualLocked = true;
          document.body.style.cursor = 'none';
          const c = document.querySelector('canvas');
          if (c) { c.tabIndex = 0; c.focus(); }
          document.dispatchEvent(new Event('pointerlockchange'));
          return Promise.resolve();
        };

        document.exitPointerLock = function() {
          window.__virtualLocked = false;
          document.body.style.cursor = 'auto';
          lastX = null;
          lastY = null;
          document.dispatchEvent(new Event('pointerlockchange'));
        };

        Object.defineProperty(document, 'pointerLockElement', {
          get: function() {
            return window.__virtualLocked ? document.querySelector('canvas') : null;
          }
        });

        document.addEventListener('mousedown', (e) => {
          const canvas = document.querySelector('canvas');
          if (canvas && (e.target === canvas || canvas.contains(e.target))) {
            window.__virtualLocked = true;
            document.body.style.cursor = 'none';
            canvas.tabIndex = 0;
            canvas.focus();
            lastX = e.clientX;
            lastY = e.clientY;
            document.dispatchEvent(new Event('pointerlockchange'));
          }
        }, true);

        window.addEventListener('mousemove', (e) => {
          if (!window.__virtualLocked || e.__synthetic) return;
          const dx = lastX !== null ? (e.clientX - lastX) * 2.5 : 0;
          const dy = lastY !== null ? (e.clientY - lastY) * 2.5 : 0;
          lastX = e.clientX;
          lastY = e.clientY;

          const canvas = document.querySelector('canvas');
          if (canvas && (dx !== 0 || dy !== 0)) {
            const init = {
              bubbles: true,
              cancelable: true,
              view: window,
              clientX: e.clientX,
              clientY: e.clientY,
              movementX: dx,
              movementY: dy
            };
            const mEvt = new MouseEvent('mousemove', init);
            mEvt.__synthetic = true;
            canvas.dispatchEvent(mEvt);
            document.dispatchEvent(mEvt);

            if (window.PointerEvent) {
              const pEvt = new PointerEvent('pointermove', { ...init, pointerId: 1, pointerType: 'mouse' });
              pEvt.__synthetic = true;
              canvas.dispatchEvent(pEvt);
            }
          }
        }, true);

        window.addEventListener('keydown', (e) => {
          if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code) && window.__virtualLocked) {
            e.preventDefault();
          }
          if (e.ctrlKey && e.altKey) {
            document.exitPointerLock();
            console.log('[INPUT] Cursor released via Ctrl+Alt');
          }
        }, true);
      }
    `).catch(() => {});
  }

  function releaseCursor() {
    view.executeJavaScript(`
      if (document.exitPointerLock) document.exitPointerLock();
    `).catch(() => {});
    log('[INPUT] Ctrl+Alt pressed — cursor released.');
  }

  if (window.electronAPI && window.electronAPI.onReleaseCursor) {
    window.electronAPI.onReleaseCursor(releaseCursor);
  }

  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.altKey) releaseCursor();
  });

  log('[SYSTEM] All game controls + Trackpad look ready.');

  view.addEventListener('did-start-loading', () => log('[NETWORK] Loading game...'));
  view.addEventListener('did-finish-load', () => {
    urlBar.value = view.getURL();
    injectFullControls();
    view.focus();
    log(`[READY] Loaded: ${view.getURL()}`);
  });
  view.addEventListener('console-message', (e) => log(`[GAME] ${e.message}`));
  view.addEventListener('render-process-gone', (e) => log(`[CRASH] Renderer stopped: ${e.reason}`));

  document.getElementById('btn-sidebar').addEventListener('click', () => sidebar.classList.toggle('collapsed'));
  document.getElementById('btn-back').addEventListener('click', () => { if (view.canGoBack()) view.goBack(); });
  document.getElementById('btn-forward').addEventListener('click', () => { if (view.canGoForward()) view.goForward(); });
  document.getElementById('btn-reload').addEventListener('click', () => { view.reload(); log('[ACTION] Reloading...'); });

  document.getElementById('load-preset').addEventListener('click', () => {
    const url = document.getElementById('preset-select').value;
    view.loadURL(url);
    log(`[LAUNCH] Loading ${url}`);
  });

  document.getElementById('btn-fullscreen').addEventListener('click', () => {
    window.electronAPI.toggleFullscreen();
    log('[UI] Toggled fullscreen');
  });

  document.getElementById('btn-focus').addEventListener('click', () => {
    view.focus();
    log('[INPUT] Game focused');
  });

  document.getElementById('btn-terminal').addEventListener('click', () => term.classList.toggle('hidden'));
  document.getElementById('btn-clear').addEventListener('click', () => { term.innerHTML = ''; log('[SYSTEM] Console cleared.'); });

  document.getElementById('btn-devtools').addEventListener('click', () => {
    if (view.isDevToolsOpened()) view.closeDevTools();
    else view.openDevTools();
  });
});
