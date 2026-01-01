// Color Picker Content Script - Optimized with Batch Pixel Reading
(function() {
  if (window.__colorPickerInjected) return;
  window.__colorPickerInjected = true;

  let isActive = false;
  let magnifier = null;
  let cursor = null;
  let colorFormat = 'hex';
  let rafId = null;
  let lastX = 0, lastY = 0;
  let cachedPreview = null;
  let cachedValue = null;
  let screenCanvas = null;
  let screenCtx = null;
  let screenData = null; // Cache full image data for fast access
  let devicePixelRatio = 1;
  const GRID_SIZE = 11;
  const PIXEL_SIZE = 12;
  const CANVAS_SIZE = GRID_SIZE * PIXEL_SIZE;
  const HALF_GRID = Math.floor(GRID_SIZE / 2);

  const ColorUtils = {
    rgbToHex(r, g, b) {
      return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
    },
    rgbToHsl(r, g, b) {
      r /= 255; g /= 255; b /= 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h, s, l = (max + min) / 2;
      if (max === min) { h = s = 0; }
      else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
          case g: h = ((b - r) / d + 2) / 6; break;
          case b: h = ((r - g) / d + 4) / 6; break;
        }
      }
      return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
    },
    formatColor(r, g, b, format) {
      switch (format) {
        case 'hex': return this.rgbToHex(r, g, b);
        case 'rgb': return `rgb(${r}, ${g}, ${b})`;
        case 'rgba': return `rgba(${r}, ${g}, ${b}, 1)`;
        case 'hsl':
          const hsl = this.rgbToHsl(r, g, b);
          return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
        default: return this.rgbToHex(r, g, b);
      }
    }
  };

  function createMagnifier() {
    const el = document.createElement('div');
    el.id = 'color-picker-magnifier';
    el.innerHTML = `
      <canvas id="color-picker-canvas" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}"></canvas>
      <div class="color-picker-crosshair"></div>
      <div class="color-picker-info">
        <div class="color-picker-preview"></div>
        <div class="color-picker-value"></div>
      </div>
    `;
    document.body.appendChild(el);
    return el;
  }

  function createCursor() {
    const el = document.createElement('div');
    el.id = 'color-picker-cursor';
    document.body.appendChild(el);
    return el;
  }

  // Fast pixel access from cached ImageData
  function getPixelFast(x, y) {
    if (!screenData) return { r: 128, g: 128, b: 128 };
    const sx = Math.floor(x * devicePixelRatio);
    const sy = Math.floor(y * devicePixelRatio);
    if (sx < 0 || sy < 0 || sx >= screenData.width || sy >= screenData.height) {
      return { r: 128, g: 128, b: 128 };
    }
    const i = (sy * screenData.width + sx) * 4;
    return { r: screenData.data[i], g: screenData.data[i + 1], b: screenData.data[i + 2] };
  }

  async function captureScreen() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'captureScreen' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Runtime error:', chrome.runtime.lastError);
          resolve(false);
          return;
        }
        if (response && response.dataUrl) {
          const img = new Image();
          img.onload = () => {
            screenCanvas = document.createElement('canvas');
            screenCanvas.width = img.width;
            screenCanvas.height = img.height;
            screenCtx = screenCanvas.getContext('2d', { willReadFrequently: true });
            screenCtx.drawImage(img, 0, 0);
            // Cache the entire image data for fast pixel access
            screenData = screenCtx.getImageData(0, 0, img.width, img.height);
            resolve(true);
          };
          img.onerror = () => resolve(false);
          img.src = response.dataUrl;
        } else {
          resolve(false);
        }
      });
    });
  }

  async function activate(format) {
    if (isActive) return;
    isActive = true;
    colorFormat = format || 'hex';
    devicePixelRatio = window.devicePixelRatio || 1;
    
    const captured = await captureScreen();
    if (!captured) {
      console.error('Failed to capture screen');
      isActive = false;
      return;
    }
    
    magnifier = createMagnifier();
    cursor = createCursor();
    magnifier._ctx = magnifier.querySelector('#color-picker-canvas').getContext('2d', { willReadFrequently: true });
    cachedPreview = magnifier.querySelector('.color-picker-preview');
    cachedValue = magnifier.querySelector('.color-picker-value');
    
    // Pre-draw grid lines on an offscreen canvas for reuse
    magnifier._gridCanvas = document.createElement('canvas');
    magnifier._gridCanvas.width = CANVAS_SIZE;
    magnifier._gridCanvas.height = CANVAS_SIZE;
    const gridCtx = magnifier._gridCanvas.getContext('2d');
    gridCtx.strokeStyle = 'rgba(255,255,255,0.2)';
    gridCtx.lineWidth = 1;
    for (let i = 0; i <= CANVAS_SIZE; i += PIXEL_SIZE) {
      gridCtx.beginPath(); gridCtx.moveTo(i, 0); gridCtx.lineTo(i, CANVAS_SIZE); gridCtx.stroke();
      gridCtx.beginPath(); gridCtx.moveTo(0, i); gridCtx.lineTo(CANVAS_SIZE, i); gridCtx.stroke();
    }
    
    document.body.style.cursor = 'none';
    document.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKeyDown);
  }

  function deactivate() {
    if (!isActive) return;
    isActive = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    document.body.style.cursor = '';
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('keydown', onKeyDown);
    if (magnifier) { magnifier.remove(); magnifier = null; }
    if (cursor) { cursor.remove(); cursor = null; }
    cachedPreview = null;
    cachedValue = null;
    screenCanvas = null;
    screenCtx = null;
    screenData = null;
  }

  function onMouseMove(e) {
    lastX = e.clientX;
    lastY = e.clientY;
    if (!rafId) rafId = requestAnimationFrame(updateMagnifier);
  }

  function updateMagnifier() {
    rafId = null;
    if (!magnifier || !isActive) return;
    const x = lastX, y = lastY;
    
    if (cursor) cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    
    let magX = x + 20, magY = y + 20;
    if (magX + 160 > window.innerWidth) magX = x - 180;
    if (magY + 200 > window.innerHeight) magY = y - 210;
    magnifier.style.transform = `translate3d(${magX}px, ${magY}px, 0)`;
    
    const color = getPixelFast(x, y);
    cachedPreview.style.backgroundColor = ColorUtils.rgbToHex(color.r, color.g, color.b);
    cachedValue.textContent = ColorUtils.formatColor(color.r, color.g, color.b, colorFormat);
    drawMagnifier(x, y);
  }

  function drawMagnifier(centerX, centerY) {
    if (!magnifier?._ctx || !screenData) return;
    const ctx = magnifier._ctx;
    
    // Draw pixels
    for (let dy = -HALF_GRID; dy <= HALF_GRID; dy++) {
      for (let dx = -HALF_GRID; dx <= HALF_GRID; dx++) {
        const color = getPixelFast(centerX + dx, centerY + dy);
        ctx.fillStyle = `rgb(${color.r},${color.g},${color.b})`;
        ctx.fillRect((dx + HALF_GRID) * PIXEL_SIZE, (dy + HALF_GRID) * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
      }
    }
    
    // Overlay pre-rendered grid
    if (magnifier._gridCanvas) {
      ctx.drawImage(magnifier._gridCanvas, 0, 0);
    }
    
    // Center pixel highlight
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(HALF_GRID * PIXEL_SIZE, HALF_GRID * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
  }

  function onClick(e) {
    e.preventDefault();
    e.stopPropagation();
    const color = getPixelFast(e.clientX, e.clientY);
    const hex = ColorUtils.rgbToHex(color.r, color.g, color.b);
    const formatted = ColorUtils.formatColor(color.r, color.g, color.b, colorFormat);
    navigator.clipboard.writeText(formatted).then(() => {
      chrome.runtime.sendMessage({ action: 'colorPicked', color: hex, formatted });
      showNotification(`Copied: ${formatted}`);
    }).catch(() => {
      showNotification(`Color: ${formatted}`);
    });
    deactivate();
  }

  function showNotification(text) {
    const n = document.createElement('div');
    n.className = 'color-picker-notification';
    n.textContent = text;
    document.body.appendChild(n);
    setTimeout(() => { n.classList.add('fade-out'); setTimeout(() => n.remove(), 300); }, 1500);
  }

  function onKeyDown(e) { 
    if (e.key === 'Escape') deactivate();
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'activatePicker') { 
      activate(msg.format);
      sendResponse({ success: true }); 
    }
    return true;
  });
})();
