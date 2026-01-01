// Color format utilities
const ColorUtils = {
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  },

  rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
  },

  rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  },

  formatColor(hex, format) {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return hex;

    switch (format) {
      case 'hex':
        return hex.toUpperCase();
      case 'rgb':
        return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
      case 'rgba':
        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`;
      case 'hsl':
        const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
        return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
      default:
        return hex;
    }
  }
};

// State
let currentColor = null;
let currentFormat = 'hex';
let colorHistory = [];

// DOM Elements
const pickBtn = document.getElementById('pickColor');
const previewBox = document.getElementById('previewBox');
const colorValue = document.getElementById('colorValue');
const formatBtns = document.querySelectorAll('.format-btn');
const historyContainer = document.getElementById('colorHistory');
const statusEl = document.getElementById('status');

// Localization helper
function i18n(key) {
  return chrome.i18n.getMessage(key) || key;
}

// Apply translations to all elements with data-i18n attribute
function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const msg = i18n(key);
    if (msg) el.textContent = msg;
  });
}

// Initialize
async function init() {
  // Apply translations
  applyTranslations();
  
  // Load saved format and history
  const data = await chrome.storage.local.get(['colorFormat', 'colorHistory', 'lastColor']);
  
  if (data.colorFormat) {
    currentFormat = data.colorFormat;
    updateFormatButtons();
  }
  
  if (data.colorHistory) {
    colorHistory = data.colorHistory;
    renderHistory();
  }
  
  if (data.lastColor) {
    currentColor = data.lastColor;
    updateColorDisplay();
  }
}

// Update format button states
function updateFormatButtons() {
  formatBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.format === currentFormat);
  });
}

// Update color display
function updateColorDisplay() {
  if (currentColor) {
    previewBox.style.background = currentColor;
    colorValue.textContent = ColorUtils.formatColor(currentColor, currentFormat);
  }
}

// Show status message
function showStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = 'status ' + type;
  setTimeout(() => {
    statusEl.className = 'status';
  }, 2000);
}

// Render color history
function renderHistory() {
  historyContainer.innerHTML = '';
  colorHistory.slice(0, 8).forEach(color => {
    const el = document.createElement('div');
    el.className = 'history-color';
    el.style.background = color;
    el.title = color;
    el.addEventListener('click', () => selectHistoryColor(color));
    historyContainer.appendChild(el);
  });
}

// Select color from history
async function selectHistoryColor(color) {
  currentColor = color;
  updateColorDisplay();
  await copyToClipboard(ColorUtils.formatColor(color, currentFormat));
  showStatus(i18n('copied'), 'success');
}

// Add color to history
async function addToHistory(color) {
  colorHistory = colorHistory.filter(c => c !== color);
  colorHistory.unshift(color);
  colorHistory = colorHistory.slice(0, 8);
  await chrome.storage.local.set({ colorHistory, lastColor: color });
  renderHistory();
}

// Copy to clipboard
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
}

// Pick color button click
pickBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
    showStatus(i18n('cannotPickOnPage'), 'error');
    return;
  }
  
  try {
    // First, try to inject the content script in case it's not loaded
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
    await chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ['content.css']
    });
  } catch (e) {
    // Script might already be injected, that's okay
    console.log('Script injection:', e.message);
  }
  
  // Send message to content script to activate picker
  try {
    await chrome.tabs.sendMessage(tab.id, { action: 'activatePicker', format: currentFormat });
    window.close();
  } catch (err) {
    showStatus(i18n('failedToActivate'), 'error');
    console.error(err);
  }
});

// Format button clicks
formatBtns.forEach(btn => {
  btn.addEventListener('click', async () => {
    currentFormat = btn.dataset.format;
    updateFormatButtons();
    updateColorDisplay();
    await chrome.storage.local.set({ colorFormat: currentFormat });
  });
});

// Listen for color picked message
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'colorPicked') {
    currentColor = message.color;
    addToHistory(currentColor);
    updateColorDisplay();
    showStatus(i18n('colorCopied'), 'success');
  }
});

// Color value click to copy
colorValue.addEventListener('click', async () => {
  if (currentColor) {
    const formatted = ColorUtils.formatColor(currentColor, currentFormat);
    await copyToClipboard(formatted);
    showStatus(i18n('copied'), 'success');
  }
});

// Initialize on load
init();
