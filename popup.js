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
  },

  // Get relative luminance for WCAG contrast
  getLuminance(r, g, b) {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },

  // Calculate contrast ratio between two colors
  getContrastRatio(hex1, hex2) {
    const rgb1 = this.hexToRgb(hex1);
    const rgb2 = this.hexToRgb(hex2);
    if (!rgb1 || !rgb2) return 1;
    
    const l1 = this.getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const l2 = this.getLuminance(rgb2.r, rgb2.g, rgb2.b);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  },

  // Get WCAG rating
  getWCAGRating(contrast) {
    if (contrast >= 7) return { level: 'AAA', pass: true };
    if (contrast >= 4.5) return { level: 'AA', pass: true };
    if (contrast >= 3) return { level: 'AA Large', pass: true };
    return { level: 'Fail', pass: false };
  },

  // CSS Named Colors database (most common)
  namedColors: {
    '#F0F8FF': 'AliceBlue', '#FAEBD7': 'AntiqueWhite', '#00FFFF': 'Aqua/Cyan',
    '#7FFFD4': 'Aquamarine', '#F0FFFF': 'Azure', '#F5F5DC': 'Beige',
    '#FFE4C4': 'Bisque', '#000000': 'Black', '#FFEBCD': 'BlanchedAlmond',
    '#0000FF': 'Blue', '#8A2BE2': 'BlueViolet', '#A52A2A': 'Brown',
    '#DEB887': 'BurlyWood', '#5F9EA0': 'CadetBlue', '#7FFF00': 'Chartreuse',
    '#D2691E': 'Chocolate', '#FF7F50': 'Coral', '#6495ED': 'CornflowerBlue',
    '#FFF8DC': 'Cornsilk', '#DC143C': 'Crimson', '#00008B': 'DarkBlue',
    '#008B8B': 'DarkCyan', '#B8860B': 'DarkGoldenRod', '#A9A9A9': 'DarkGray',
    '#006400': 'DarkGreen', '#BDB76B': 'DarkKhaki', '#8B008B': 'DarkMagenta',
    '#556B2F': 'DarkOliveGreen', '#FF8C00': 'DarkOrange', '#9932CC': 'DarkOrchid',
    '#8B0000': 'DarkRed', '#E9967A': 'DarkSalmon', '#8FBC8F': 'DarkSeaGreen',
    '#483D8B': 'DarkSlateBlue', '#2F4F4F': 'DarkSlateGray', '#00CED1': 'DarkTurquoise',
    '#9400D3': 'DarkViolet', '#FF1493': 'DeepPink', '#00BFFF': 'DeepSkyBlue',
    '#696969': 'DimGray', '#1E90FF': 'DodgerBlue', '#B22222': 'FireBrick',
    '#FFFAF0': 'FloralWhite', '#228B22': 'ForestGreen', '#FF00FF': 'Fuchsia/Magenta',
    '#DCDCDC': 'Gainsboro', '#F8F8FF': 'GhostWhite', '#FFD700': 'Gold',
    '#DAA520': 'GoldenRod', '#808080': 'Gray', '#008000': 'Green',
    '#ADFF2F': 'GreenYellow', '#F0FFF0': 'HoneyDew', '#FF69B4': 'HotPink',
    '#CD5C5C': 'IndianRed', '#4B0082': 'Indigo', '#FFFFF0': 'Ivory',
    '#F0E68C': 'Khaki', '#E6E6FA': 'Lavender', '#FFF0F5': 'LavenderBlush',
    '#7CFC00': 'LawnGreen', '#FFFACD': 'LemonChiffon', '#ADD8E6': 'LightBlue',
    '#F08080': 'LightCoral', '#E0FFFF': 'LightCyan', '#FAFAD2': 'LightGoldenRodYellow',
    '#D3D3D3': 'LightGray', '#90EE90': 'LightGreen', '#FFB6C1': 'LightPink',
    '#FFA07A': 'LightSalmon', '#20B2AA': 'LightSeaGreen', '#87CEFA': 'LightSkyBlue',
    '#778899': 'LightSlateGray', '#B0C4DE': 'LightSteelBlue', '#FFFFE0': 'LightYellow',
    '#00FF00': 'Lime', '#32CD32': 'LimeGreen', '#FAF0E6': 'Linen',
    '#800000': 'Maroon', '#66CDAA': 'MediumAquaMarine', '#0000CD': 'MediumBlue',
    '#BA55D3': 'MediumOrchid', '#9370DB': 'MediumPurple', '#3CB371': 'MediumSeaGreen',
    '#7B68EE': 'MediumSlateBlue', '#00FA9A': 'MediumSpringGreen', '#48D1CC': 'MediumTurquoise',
    '#C71585': 'MediumVioletRed', '#191970': 'MidnightBlue', '#F5FFFA': 'MintCream',
    '#FFE4E1': 'MistyRose', '#FFE4B5': 'Moccasin', '#FFDEAD': 'NavajoWhite',
    '#000080': 'Navy', '#FDF5E6': 'OldLace', '#808000': 'Olive',
    '#6B8E23': 'OliveDrab', '#FFA500': 'Orange', '#FF4500': 'OrangeRed',
    '#DA70D6': 'Orchid', '#EEE8AA': 'PaleGoldenRod', '#98FB98': 'PaleGreen',
    '#AFEEEE': 'PaleTurquoise', '#DB7093': 'PaleVioletRed', '#FFEFD5': 'PapayaWhip',
    '#FFDAB9': 'PeachPuff', '#CD853F': 'Peru', '#FFC0CB': 'Pink',
    '#DDA0DD': 'Plum', '#B0E0E6': 'PowderBlue', '#800080': 'Purple',
    '#663399': 'RebeccaPurple', '#FF0000': 'Red', '#BC8F8F': 'RosyBrown',
    '#4169E1': 'RoyalBlue', '#8B4513': 'SaddleBrown', '#FA8072': 'Salmon',
    '#F4A460': 'SandyBrown', '#2E8B57': 'SeaGreen', '#FFF5EE': 'SeaShell',
    '#A0522D': 'Sienna', '#C0C0C0': 'Silver', '#87CEEB': 'SkyBlue',
    '#6A5ACD': 'SlateBlue', '#708090': 'SlateGray', '#FFFAFA': 'Snow',
    '#00FF7F': 'SpringGreen', '#4682B4': 'SteelBlue', '#D2B48C': 'Tan',
    '#008080': 'Teal', '#D8BFD8': 'Thistle', '#FF6347': 'Tomato',
    '#40E0D0': 'Turquoise', '#EE82EE': 'Violet', '#F5DEB3': 'Wheat',
    '#FFFFFF': 'White', '#F5F5F5': 'WhiteSmoke', '#FFFF00': 'Yellow',
    '#9ACD32': 'YellowGreen'
  },

  // Get closest named color
  getColorName(hex) {
    hex = hex.toUpperCase();
    if (this.namedColors[hex]) return this.namedColors[hex];
    
    // Find closest color
    const rgb = this.hexToRgb(hex);
    if (!rgb) return null;
    
    let closestName = null;
    let closestDistance = Infinity;
    
    for (const [namedHex, name] of Object.entries(this.namedColors)) {
      const namedRgb = this.hexToRgb(namedHex);
      if (!namedRgb) continue;
      
      const distance = Math.sqrt(
        Math.pow(rgb.r - namedRgb.r, 2) +
        Math.pow(rgb.g - namedRgb.g, 2) +
        Math.pow(rgb.b - namedRgb.b, 2)
      );
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestName = name;
      }
    }
    
    // Only return if reasonably close (distance < 50)
    return closestDistance < 50 ? `~${closestName}` : null;
  }
};

// State
let currentColor = null;
let currentFormat = 'hex';
let colorHistory = [];
let currentTheme = 'light';

// DOM Elements
const pickBtn = document.getElementById('pickColor');
const previewBox = document.getElementById('previewBox');
const colorValue = document.getElementById('colorValue');
const colorName = document.getElementById('colorName');
const colorContrast = document.getElementById('colorContrast');
const formatBtns = document.querySelectorAll('.format-btn');
const historyContainer = document.getElementById('colorHistory');
const statusEl = document.getElementById('status');
const themeToggle = document.getElementById('themeToggle');
const scanColorsBtn = document.getElementById('scanColors');
const copyAllColorsBtn = document.getElementById('copyAllColors');
const pageColorsContainer = document.getElementById('pageColors');

// Store extracted colors for copy all
let extractedColors = [];

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

// Theme management
function setTheme(theme) {
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  chrome.storage.local.set({ theme });
}

function toggleTheme() {
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  setTheme(newTheme);
}

// Initialize
async function init() {
  // Apply translations
  applyTranslations();
  
  // Fetch and display actual keyboard shortcut
  try {
    const commands = await chrome.commands.getAll();
    const pickerCommand = commands.find(cmd => cmd.name === 'activate-picker');
    if (pickerCommand && pickerCommand.shortcut) {
      document.getElementById('shortcutDisplay').textContent = pickerCommand.shortcut;
    } else {
      document.getElementById('shortcutDisplay').textContent = 'Set in edge://extensions/shortcuts';
    }
  } catch (e) {
    console.log('Could not fetch shortcut');
  }
  
  // Load saved preferences
  const data = await chrome.storage.local.get(['colorFormat', 'colorHistory', 'lastColor', 'theme']);
  
  // Apply saved theme or default to light
  if (data.theme) {
    setTheme(data.theme);
  } else {
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  }
  
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
    
    // Show color name
    const name = ColorUtils.getColorName(currentColor);
    colorName.textContent = name || '';
    
    // Show contrast info
    updateContrastDisplay(currentColor);
  } else {
    colorName.textContent = '';
    colorContrast.innerHTML = '';
  }
}

// Update contrast display
function updateContrastDisplay(hex) {
  const contrastWhite = ColorUtils.getContrastRatio(hex, '#FFFFFF');
  const contrastBlack = ColorUtils.getContrastRatio(hex, '#000000');
  
  const ratingWhite = ColorUtils.getWCAGRating(contrastWhite);
  const ratingBlack = ColorUtils.getWCAGRating(contrastBlack);
  
  // Show the better contrast option
  const bestContrast = contrastWhite > contrastBlack ? contrastWhite : contrastBlack;
  const bestRating = contrastWhite > contrastBlack ? ratingWhite : ratingBlack;
  const bestColor = contrastWhite > contrastBlack ? 'white' : 'black';
  
  colorContrast.innerHTML = `
    <span class="contrast-badge ${bestRating.pass ? 'pass' : 'fail'}">
      ${bestRating.level} ${bestRating.pass ? '✓' : '✗'}
    </span>
    <span class="contrast-sample">
      <span style="background: ${hex}; color: white;">Aa</span>
      <span style="background: ${hex}; color: black;">Aa</span>
    </span>
  `;
}

// Show status message
function showStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = 'status ' + type;
  // Trigger reflow for animation
  void statusEl.offsetWidth;
  statusEl.classList.add('show');
  setTimeout(() => {
    statusEl.classList.remove('show');
  }, 2000);
}

// Render color history
function renderHistory() {
  historyContainer.innerHTML = '';
  
  if (colorHistory.length === 0) {
    const emptyEl = document.createElement('span');
    emptyEl.className = 'history-empty';
    emptyEl.textContent = i18n('noRecentColors') || 'No recent colors';
    historyContainer.appendChild(emptyEl);
    return;
  }
  
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

// Theme toggle click
themeToggle.addEventListener('click', toggleTheme);

// Scan page colors
scanColorsBtn.addEventListener('click', scanPageColors);

// Copy all colors
copyAllColorsBtn.addEventListener('click', copyAllColors);

async function copyAllColors() {
  if (extractedColors.length === 0) return;
  
  // Format colors based on current format
  const formattedColors = extractedColors.map(color => 
    ColorUtils.formatColor(color, currentFormat)
  );
  
  // Create a nice formatted output
  const output = formattedColors.join('\n');
  
  await copyToClipboard(output);
  showStatus(`${extractedColors.length} ${i18n('colorsCopied') || 'colors copied'}`, 'success');
}

async function scanPageColors() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
    showStatus(i18n('cannotPickOnPage'), 'error');
    return;
  }
  
  scanColorsBtn.classList.add('scanning');
  pageColorsContainer.innerHTML = '<span class="page-colors-empty">Scanning...</span>';
  
  try {
    // Inject content script if needed
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
  } catch (e) {
    // Script might already be injected
  }
  
  try {
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractColors' });
    if (response && response.colors && response.colors.length > 0) {
      extractedColors = response.colors;
      renderPageColors(response.colors);
      copyAllColorsBtn.style.display = 'flex';
    } else {
      extractedColors = [];
      copyAllColorsBtn.style.display = 'none';
      pageColorsContainer.innerHTML = '<span class="page-colors-empty">No colors found</span>';
    }
  } catch (err) {
    console.error('Failed to extract colors:', err);
    extractedColors = [];
    copyAllColorsBtn.style.display = 'none';
    pageColorsContainer.innerHTML = '<span class="page-colors-empty">Failed to scan</span>';
  }
  
  scanColorsBtn.classList.remove('scanning');
}

function renderPageColors(colors) {
  pageColorsContainer.innerHTML = '';
  
  if (colors.length === 0) {
    const emptyEl = document.createElement('span');
    emptyEl.className = 'page-colors-empty';
    emptyEl.textContent = 'No colors found';
    pageColorsContainer.appendChild(emptyEl);
    return;
  }
  
  colors.slice(0, 24).forEach(color => {
    const el = document.createElement('div');
    el.className = 'page-color';
    el.style.background = color;
    el.title = color;
    el.addEventListener('click', () => selectPageColor(color));
    pageColorsContainer.appendChild(el);
  });
}

async function selectPageColor(color) {
  currentColor = color;
  updateColorDisplay();
  await addToHistory(color);
  await copyToClipboard(ColorUtils.formatColor(color, currentFormat));
  showStatus(i18n('copied'), 'success');
}

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
