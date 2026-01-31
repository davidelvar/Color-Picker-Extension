# 🎨 Color Picker

A lightweight, fast color picker extension for Microsoft Edge and Chrome. Pick any color from any webpage with a magnifying glass preview and copy it instantly.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.2.0-green.svg)
![Edge](https://img.shields.io/badge/Edge-Compatible-blue?logo=microsoft-edge)
![Chrome](https://img.shields.io/badge/Chrome-Compatible-blue?logo=google-chrome)

## ✨ Features

- **🔍 Magnifying Glass** - 11x11 pixel zoom preview for precise color selection
- **📋 One-Click Copy** - Click any pixel to instantly copy the color value
- **🎯 Multiple Formats** - Switch between HEX, RGB, RGBA, and HSL
- **📜 Color History** - Quick access to your 8 most recent colors
- **⚡ Lightweight** - Zero bloat, minimal permissions, no tracking
- **🌍 Multi-language** - Supports 8 languages (EN, ES, FR, DE, PT, ZH, JA, KO)

## 📥 Installation

### From Store (Recommended)
- [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/jjpkoepmiolkamondihcckpfenemkhmi)

### Manual Installation (Developer Mode)

1. Download or clone this repository
2. Open your browser and go to:
   - Edge: `edge://extensions/`
   - Chrome: `chrome://extensions/`
3. Enable **Developer mode**
4. Click **Load unpacked**
5. Select the project folder

## 🚀 Usage

1. Click the Color Picker icon in your toolbar
2. Click **"Pick Color"** to activate
3. Hover over any element - the magnifier shows zoomed pixels
4. Click to copy the color to clipboard
5. Press **Escape** to cancel

## 🎨 Color Formats

| Format | Example |
|--------|---------|
| HEX | `#FF5733` |
| RGB | `rgb(255, 87, 51)` |
| RGBA | `rgba(255, 87, 51, 1)` |
| HSL | `hsl(11, 100%, 60%)` |

## 📁 Project Structure

```
ColorPicker/
├── manifest.json      # Extension manifest (Manifest V3)
├── popup.html         # Extension popup UI
├── popup.css          # Popup styles
├── popup.js           # Popup logic
├── content.js         # Color picker injection script
├── content.css        # Magnifier & cursor styles
├── background.js      # Service worker for screen capture
├── icons/             # Extension icons (16, 48, 128px)
└── _locales/          # Internationalization (8 languages)
```

## 🔒 Permissions

This extension requires minimal permissions:

| Permission | Purpose |
|------------|---------|
| `activeTab` | Access current tab for color picking |
| `clipboardWrite` | Copy color values to clipboard |
| `storage` | Save preferences and color history |
| `scripting` | Inject color picker into pages |

**No data collection. No external requests. Everything runs locally.**

## 🌍 Supported Languages

- 🇺🇸 English
- 🇪🇸 Spanish (Español)
- 🇫🇷 French (Français)
- 🇩🇪 German (Deutsch)
- 🇧🇷 Portuguese (Português)
- 🇨🇳 Chinese Simplified (简体中文)
- 🇯🇵 Japanese (日本語)
- 🇰🇷 Korean (한국어)

## ⚡ Performance Optimizations

- GPU-accelerated transforms for smooth magnifier movement
- Cached screen capture with direct pixel array access
- Pre-rendered grid overlay
- `requestAnimationFrame` for 60fps updates
- Bitwise operations for fast hex conversion

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## � Changelog

### v1.2.0 - January 31, 2026
**🎨 Light Theme & UI Redesign**

- **New Light Theme**: Fresh, professional design with `#F8FAFC` background
- **Theme Toggle**: Switch between light and dark modes with a single click
- **System Preference**: Automatically respects your OS theme preference on first launch
- **CSS Variables**: Complete theming system using CSS custom properties
- **Modern Typography**: System font stack for native look and feel
- **Clean SVG Icons**: Replaced emojis with crisp, scalable vector icons
- **Softer Shadows**: Professional, subtle shadow system
- **Refined Interactions**: Smoother, less aggressive hover effects
- **Improved Magnifier**: Light-themed color picker overlay
- **Better Notifications**: Cleaner toast messages when copying colors

### v1.1.0
- Initial release with magnifying glass picker
- Multiple color format support (HEX, RGB, RGBA, HSL)
- Color history (8 recent colors)
- Multi-language support (8 languages)

## �🙏 Acknowledgments

- Built with Manifest V3 for modern browser compatibility
- Icons designed for clarity at all sizes

---

**Made with ❤️ for designers and developers**
