# Browser Extension Development - Agent Instructions

A comprehensive guide for AI agents and developers building browser extensions for Chrome, Edge, and other Chromium-based browsers.

---

## 📋 Table of Contents

1. [Manifest V3 Fundamentals](#manifest-v3-fundamentals)
2. [Project Structure](#project-structure)
3. [Permissions Best Practices](#permissions-best-practices)
4. [Background Scripts (Service Workers)](#background-scripts-service-workers)
5. [Content Scripts](#content-scripts)
6. [Popup UI](#popup-ui)
7. [Message Passing](#message-passing)
8. [Storage](#storage)
9. [Security Guidelines](#security-guidelines)
10. [Performance Optimization](#performance-optimization)
11. [Internationalization (i18n)](#internationalization-i18n)
12. [Testing & Debugging](#testing--debugging)
13. [Store Submission Checklist](#store-submission-checklist)

---

## Manifest V3 Fundamentals

### Required Fields

```json
{
  "manifest_version": 3,
  "name": "Extension Name",
  "version": "1.0.0",
  "description": "Brief description (132 chars max for store)"
}
```

### Common Configuration

```json
{
  "manifest_version": 3,
  "name": "__MSG_extName__",
  "version": "1.0.0",
  "description": "__MSG_extDescription__",
  "default_locale": "en",
  "permissions": ["storage"],
  "host_permissions": ["<all_urls>"],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["content.js"],
    "css": ["content.css"]
  }]
}
```

### Version Numbering

- Use semantic versioning: `MAJOR.MINOR.PATCH`
- Increment for store updates (stores require version bump)
- Example: `1.0.0` → `1.0.1` (patch) → `1.1.0` (feature) → `2.0.0` (breaking)

---

## Project Structure

### Recommended Layout

```
extension/
├── manifest.json          # Extension configuration
├── background.js          # Service worker
├── popup.html             # Popup UI markup
├── popup.css              # Popup styles
├── popup.js               # Popup logic
├── content.js             # Injected into pages
├── content.css            # Injected styles
├── options.html           # Options page (if needed)
├── options.js
├── icons/
│   ├── icon16.png         # Toolbar icon
│   ├── icon48.png         # Extensions page
│   └── icon128.png        # Store listing
├── _locales/
│   ├── en/
│   │   └── messages.json
│   └── [other languages]/
├── README.md
├── LICENSE
└── .gitignore
```

### Icon Requirements

| Size | Usage |
|------|-------|
| 16x16 | Toolbar, favicon |
| 48x48 | Extensions management page |
| 128x128 | Store listing, installation |

**Best Practice:** Create icons as SVG first, then export to PNG for crisp rendering at all sizes.

---

## Permissions Best Practices

### Principle of Least Privilege

Only request permissions you absolutely need:

```json
// ❌ Bad - Too broad
"permissions": ["<all_urls>", "tabs", "history", "bookmarks"]

// ✅ Good - Minimal
"permissions": ["activeTab", "storage"]
```

### Common Permissions

| Permission | Use Case | User Impact |
|------------|----------|-------------|
| `activeTab` | Access current tab on user action | Low - preferred |
| `storage` | Save preferences/data | Low |
| `clipboardWrite` | Copy to clipboard | Low |
| `clipboardRead` | Paste from clipboard | Medium |
| `tabs` | Access all tab URLs/titles | Medium |
| `scripting` | Programmatic script injection | Medium |
| `<all_urls>` | Access all websites | High - avoid if possible |
| `webRequest` | Intercept network requests | High |

### Host Permissions (Manifest V3)

```json
// Specific sites only
"host_permissions": ["https://example.com/*"]

// All sites (request only if needed)
"host_permissions": ["<all_urls>"]
```

### Optional Permissions

Request at runtime for better user experience:

```javascript
// In popup.js or background.js
chrome.permissions.request({
  permissions: ['tabs'],
  origins: ['https://example.com/*']
}, (granted) => {
  if (granted) {
    // Permission granted
  }
});
```

---

## Background Scripts (Service Workers)

### Key Differences from Manifest V2

- **No persistent background pages** - Service workers are event-driven
- **No DOM access** - Cannot use `document`, `window.localStorage`
- **Limited lifetime** - Terminated when idle (~30 seconds)
- **No XMLHttpRequest** - Use `fetch()` instead

### Service Worker Pattern

```javascript
// background.js

// ✅ Good - Event-driven
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // First install
    chrome.storage.local.set({ settings: defaultSettings });
  } else if (details.reason === 'update') {
    // Extension updated
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getData') {
    // Handle async operations
    fetchData().then(data => sendResponse({ data }));
    return true; // Keep channel open for async response
  }
});

// ❌ Bad - Will be lost when service worker terminates
let globalState = {}; // Don't rely on this persisting
```

### Persisting State

```javascript
// Use chrome.storage instead of variables
async function saveState(state) {
  await chrome.storage.local.set({ state });
}

async function getState() {
  const { state } = await chrome.storage.local.get(['state']);
  return state || {};
}
```

### Alarms for Periodic Tasks

```javascript
// Set up alarm (minimum 1 minute)
chrome.alarms.create('periodicTask', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'periodicTask') {
    performTask();
  }
});
```

---

## Content Scripts

### Injection Methods

**1. Declarative (manifest.json)**
```json
"content_scripts": [{
  "matches": ["https://*.example.com/*"],
  "js": ["content.js"],
  "css": ["content.css"],
  "run_at": "document_idle"
}]
```

**2. Programmatic (from background/popup)**
```javascript
await chrome.scripting.executeScript({
  target: { tabId: tab.id },
  files: ['content.js']
});

await chrome.scripting.insertCSS({
  target: { tabId: tab.id },
  files: ['content.css']
});
```

### Isolation Pattern (IIFE)

```javascript
// content.js
(function() {
  // Prevent multiple injections
  if (window.__myExtensionInjected) return;
  window.__myExtensionInjected = true;

  // Your code here - isolated from page scripts
  
  // Cleanup function
  function cleanup() {
    // Remove event listeners
    // Remove DOM elements
    window.__myExtensionInjected = false;
  }
})();
```

### DOM Manipulation Best Practices

```javascript
// ✅ Good - Use unique IDs/classes with prefix
const overlay = document.createElement('div');
overlay.id = 'myext-overlay';
overlay.className = 'myext-container';

// ✅ Good - High z-index for overlays
overlay.style.zIndex = '2147483647'; // Max 32-bit int

// ✅ Good - Clean up when done
function removeOverlay() {
  const el = document.getElementById('myext-overlay');
  if (el) el.remove();
}

// ❌ Bad - Generic selectors that might conflict
document.querySelector('.container'); // Could match page elements
```

### Event Listener Cleanup

```javascript
// Store references for cleanup
const handlers = {
  click: (e) => handleClick(e),
  keydown: (e) => handleKeydown(e)
};

function activate() {
  document.addEventListener('click', handlers.click);
  document.addEventListener('keydown', handlers.keydown);
}

function deactivate() {
  document.removeEventListener('click', handlers.click);
  document.removeEventListener('keydown', handlers.keydown);
}
```

---

## Popup UI

### HTML Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="script-src 'self';">
  <title>Extension Name</title>
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div class="container">
    <!-- Content -->
  </div>
  <script src="popup.js"></script>
</body>
</html>
```

### CSS Guidelines

```css
/* Set explicit width - popups don't auto-size well */
body {
  width: 300px;
  min-height: 200px;
  margin: 0;
  padding: 0;
}

/* Use system fonts for native feel */
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Avoid scrollbars when possible */
.container {
  padding: 16px;
  overflow: hidden;
}
```

### Popup Lifecycle

```javascript
// popup.js

// Popup opens fresh each time - no persistent state
document.addEventListener('DOMContentLoaded', async () => {
  // Load saved state
  const data = await chrome.storage.local.get(['settings']);
  initializeUI(data.settings);
});

// Popup closes when user clicks away
// Save state before any action that might close it
async function handleAction() {
  await chrome.storage.local.set({ lastAction: Date.now() });
  window.close(); // Explicitly close if needed
}
```

---

## Message Passing

### Popup ↔ Background

```javascript
// popup.js - Send message
const response = await chrome.runtime.sendMessage({ 
  action: 'getData',
  params: { id: 123 }
});

// background.js - Receive message
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getData') {
    getData(message.params).then(data => {
      sendResponse({ success: true, data });
    });
    return true; // REQUIRED for async sendResponse
  }
});
```

### Popup/Background ↔ Content Script

```javascript
// popup.js - Send to content script
const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
const response = await chrome.tabs.sendMessage(tab.id, { action: 'activate' });

// content.js - Receive message
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'activate') {
    activate();
    sendResponse({ success: true });
  }
  return true;
});

// content.js - Send to background
chrome.runtime.sendMessage({ action: 'log', data: 'Hello from content' });
```

### Error Handling

```javascript
// Always handle potential errors
try {
  const response = await chrome.tabs.sendMessage(tabId, message);
} catch (err) {
  // Content script might not be injected
  console.error('Message failed:', err);
  
  // Try injecting the script first
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['content.js']
  });
  
  // Retry
  const response = await chrome.tabs.sendMessage(tabId, message);
}
```

---

## Storage

### Types of Storage

| Type | Capacity | Sync | Use Case |
|------|----------|------|----------|
| `storage.local` | 10MB | No | Large data, local-only |
| `storage.sync` | 100KB | Yes | Settings, synced across devices |
| `storage.session` | 10MB | No | Temporary, cleared on browser close |

### Usage Patterns

```javascript
// Save data
await chrome.storage.local.set({ 
  settings: { theme: 'dark' },
  history: [1, 2, 3]
});

// Load data
const { settings, history } = await chrome.storage.local.get(['settings', 'history']);

// Load with defaults
const { settings = defaultSettings } = await chrome.storage.local.get(['settings']);

// Remove data
await chrome.storage.local.remove(['history']);

// Clear all
await chrome.storage.local.clear();
```

### Listen for Changes

```javascript
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.settings) {
    const { oldValue, newValue } = changes.settings;
    applySettings(newValue);
  }
});
```

---

## Security Guidelines

### Content Security Policy

```json
// manifest.json - Manifest V3 has strict defaults
// Only modify if absolutely necessary
"content_security_policy": {
  "extension_pages": "script-src 'self'; object-src 'self'"
}
```

### Never Do These

```javascript
// ❌ Never use eval()
eval(userInput);

// ❌ Never use innerHTML with untrusted content
element.innerHTML = userInput;

// ❌ Never construct code from strings
new Function(userInput);

// ❌ Never load remote scripts
const script = document.createElement('script');
script.src = 'https://external-site.com/script.js';
```

### Safe Alternatives

```javascript
// ✅ Use textContent for user input
element.textContent = userInput;

// ✅ Use DOM methods
const div = document.createElement('div');
div.className = 'safe';
div.textContent = userInput;
parent.appendChild(div);

// ✅ Sanitize if HTML is required
function sanitizeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
```

### Validate External Data

```javascript
// Always validate data from storage or messages
function validateSettings(settings) {
  return {
    theme: ['light', 'dark'].includes(settings?.theme) ? settings.theme : 'light',
    fontSize: Number.isInteger(settings?.fontSize) ? settings.fontSize : 14
  };
}
```

---

## Performance Optimization

### Content Script Performance

```javascript
// ✅ Use requestAnimationFrame for visual updates
function updateUI() {
  requestAnimationFrame(() => {
    element.style.transform = `translate(${x}px, ${y}px)`;
  });
}

// ✅ Use passive event listeners when not preventing default
document.addEventListener('scroll', onScroll, { passive: true });

// ✅ Debounce expensive operations
function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

// ✅ Use CSS transforms for animations (GPU accelerated)
element.style.transform = 'translateX(100px)'; // Good
element.style.left = '100px'; // Bad - triggers layout

// ✅ Use will-change for animated elements
.animated-element {
  will-change: transform;
}
```

### Memory Management

```javascript
// ✅ Clean up when deactivating
function deactivate() {
  // Remove event listeners
  document.removeEventListener('click', onClick);
  
  // Clear intervals/timeouts
  clearInterval(intervalId);
  
  // Remove DOM elements
  overlay?.remove();
  
  // Null out references
  overlay = null;
  cachedData = null;
}

// ✅ Use WeakMap for DOM element data
const elementData = new WeakMap();
elementData.set(element, { clicks: 0 });
```

### Efficient DOM Queries

```javascript
// ✅ Cache DOM references
const container = document.getElementById('myext-container');
const button = container.querySelector('.button');

// ❌ Don't query repeatedly in loops
for (let i = 0; i < 100; i++) {
  document.getElementById('counter').textContent = i; // Bad
}

// ✅ Query once
const counter = document.getElementById('counter');
for (let i = 0; i < 100; i++) {
  counter.textContent = i; // Good
}
```

---

## Internationalization (i18n)

### Setup

```json
// manifest.json
{
  "default_locale": "en"
}
```

### Message Files

```
_locales/
├── en/
│   └── messages.json
├── es/
│   └── messages.json
└── fr/
    └── messages.json
```

### Message Format

```json
// _locales/en/messages.json
{
  "extName": {
    "message": "My Extension",
    "description": "Extension name shown in browser"
  },
  "buttonLabel": {
    "message": "Click Me",
    "description": "Main action button"
  },
  "greeting": {
    "message": "Hello, $USER$!",
    "description": "Greeting with username",
    "placeholders": {
      "user": {
        "content": "$1",
        "example": "John"
      }
    }
  }
}
```

### Usage

```javascript
// In JavaScript
const name = chrome.i18n.getMessage('extName');
const greeting = chrome.i18n.getMessage('greeting', ['John']);

// In manifest.json
"name": "__MSG_extName__"

// In HTML (requires JS to apply)
<span data-i18n="buttonLabel">Click Me</span>

// Apply translations
document.querySelectorAll('[data-i18n]').forEach(el => {
  const key = el.getAttribute('data-i18n');
  el.textContent = chrome.i18n.getMessage(key);
});
```

### Supported Locales

Common locales to support: `en`, `es`, `fr`, `de`, `pt`, `zh_CN`, `ja`, `ko`, `ru`, `ar`

---

## Testing & Debugging

### Loading Unpacked Extension

1. Open `chrome://extensions` or `edge://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select extension folder

### Debugging Tools

| Component | How to Debug |
|-----------|--------------|
| Popup | Right-click popup → Inspect |
| Background | Extensions page → "Service Worker" link |
| Content Script | Page DevTools → Sources → Content Scripts |
| Storage | DevTools → Application → Extension Storage |

### Console Logging

```javascript
// Background service worker
console.log('[BG]', message);

// Content script
console.log('[CS]', message);

// Use groups for complex logs
console.group('Extension: Action');
console.log('Step 1:', data1);
console.log('Step 2:', data2);
console.groupEnd();
```

### Common Issues

| Issue | Solution |
|-------|----------|
| Content script not running | Check `matches` pattern, try programmatic injection |
| Message not received | Return `true` in listener for async, check tab ID |
| Service worker inactive | Use alarms, don't rely on global state |
| CSS not applying | Check specificity, use `!important` if needed |
| Permission denied | Check manifest permissions, request at runtime |

---

## Store Submission Checklist

### Before Submitting

- [ ] **Version bumped** in manifest.json
- [ ] **Icons** all sizes (16, 48, 128)
- [ ] **Description** clear and accurate
- [ ] **Permissions** minimal and justified
- [ ] **Privacy policy** if collecting any data
- [ ] **Tested** on target browsers
- [ ] **No console errors** in production

### Required Store Assets

| Asset | Size | Required |
|-------|------|----------|
| Extension icon | 128x128 | Yes |
| Store logo | 300x300 (min 128x128) | Yes |
| Screenshots | 1280x800 or 640x400 | Yes (1-6) |
| Small promo tile | 440x280 | Optional |
| Large promo tile | 1400x560 | Optional |

### Packaging

```powershell
# Create zip excluding unnecessary files
Compress-Archive -Path * -DestinationPath ../extension.zip -Force

# Or with exclusions
$exclude = @('*.zip', '.git', 'node_modules', '.gitignore')
Get-ChildItem -Exclude $exclude | Compress-Archive -DestinationPath ../extension.zip
```

### Certification Notes

Include in your submission:
- Test instructions
- Any required accounts/credentials
- Description of permissions usage
- Known limitations

---

## Quick Reference

### Useful APIs

```javascript
// Get current tab
const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

// Open new tab
chrome.tabs.create({ url: 'https://example.com' });

// Get extension URL
chrome.runtime.getURL('page.html');

// Copy to clipboard (requires permission)
await navigator.clipboard.writeText('text');

// Show notification (requires permission)
chrome.notifications.create({
  type: 'basic',
  iconUrl: 'icon128.png',
  title: 'Title',
  message: 'Message'
});
```

### Browser Compatibility

```javascript
// Use chrome namespace (works in Edge, Chrome, Opera)
// Firefox uses browser namespace but supports chrome

// Feature detection
if (chrome.scripting) {
  // Manifest V3
} else if (chrome.tabs.executeScript) {
  // Manifest V2 fallback
}
```

---

## Resources

- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [Edge Extension Docs](https://docs.microsoft.com/en-us/microsoft-edge/extensions-chromium/)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Chrome Extension Samples](https://github.com/GoogleChrome/chrome-extensions-samples)

---

*Last updated: January 2026*
