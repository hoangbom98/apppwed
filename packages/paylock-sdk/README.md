# paylock SDK

The official JavaScript SDK for integrating **paylock** into your web or SaaS application. Use this SDK to verify license keys, enforce project-based payments, and load secure injectables dynamically.

---

## 🔧 Installation

You can either include the SDK directly in your HTML, or install it via `npm`/`yarn` for Node.js/ESM/CommonJS use.

### ➤ Browser (via CDN or direct file)

```html
<script src="https://cdn.jsdelivr.net/npm/paylock-js@latest/dist/paylock-frontend.js"></script>
```

### ➤ Quick start (browser)

```html
<script>
  window.paylock = {
    apiKey: "pk_live_your_project_public_key",
    projectId: "69dbbbff80c3c7d88f330fbe",
    environment: "production",
    appName: "My SaaS App",
    sdkVersion: "1.0.0",
    onReady: function (data) {
      console.log("paylock initialized", data);
    },
    onError: function (err) {
      console.error("paylock failed to initialize", err);
    },
  };
</script>
<script src="https://cdn.jsdelivr.net/npm/paylock-js@latest/dist/paylock-frontend.js"></script>
```

### ➤ Node.js / Build Tools

```bash
npm install paylock-js
```

```js
// ESM
import "paylock-js";

// CommonJS
require("paylock-js");
```

## 🚀 Usage

Before the SDK initializes, you must define a global config object in the browser’s `window` scope. This object allows the paylock SDK to read your license, configure behavior, and optionally handle secure injectables.

#### ✅ Basic Usage

```html
<script>
  window.myapp = {
    license: "YOUR_LICENSE_KEY", // Required
    onReady: function () {
      console.log("✅ License verified.");
    },
  };
</script>
<script src="https://cdn.paylock.ng/paylock-sdk.js"></script>
```

#### 💻 Minimal Modal with Default Text

```html
<script>
  window.myapp = {
    license: "LICENSE_ABC123",
    invalidBehavior: "modal",
    debug: false,
  };
</script>
```

> This shows the default paylock modal with fallback messaging when license is invalid or expired.

#### 🎨 Fully Themed Modal with Custom Text

```html
<script>
  window.myapp = {
    license: "LICENSE_456DEF",
    invalidBehavior: "modal",
    modalText: "🚫 This application is not licensed. Please contact support.",
    modalTheme: {
      primary: "#10b981", // emerald
      background: "#1a1a2e",
      text: "#e0f2f1",
      border: "#10b981",
      glow: true,
    },
    onReady: function () {
      console.log("✅ All good.");
    },
  };
</script>
```

> Customize modal appearance using modalTheme.

#### 🔁 Persistent License (No Daily Recheck)

```html
<script>
  window.myapp = {
    license: "LICENSE_XYZ789",
    recheck: false,
    onReady: function () {
      console.log("🔓 Cached license still valid.");
    },
  };
</script>
```

> This skips license verification after the first success, unless storage is cleared.

#### 🔀 Redirect Instead of Modal on Failure

```html
<script>
  window.myapp = {
    license: "LICENSE_REDIRECT",
    invalidBehavior: "redirect",
    redirectUrl: "https://yourapp.com/upgrade",
    debug: true,
  };
</script>
```

> When license is invalid, users are redirected instead of seeing a modal.

#### 🔐 Injectables Support (Advanced Usage)

```html
<script>
  window.myapp = {
    license: "LICENSE_INJECT",
    injectables: true,
    injectablesEndpoint: "https://yourapp.com/sdk/receive",
    onReady: function () {
      console.log("🔐 License validated, injectables loading...");
    },
  };
</script>
```

> This sends retrieved injectables (if any) to your backend for secure use.

> 💡 **Tip:** You can name your global config variable anything — the SDK will automatically detect it  
> as long as it contains a `license` or `lk` property. This helps you keep the SDK integration hidden  
> or embedded in an existing namespace.

#### 🔧 Examples of custom config variable names

```html
<script>
  window.sdkConfig = {
    license: "YOUR_LICENSE_KEY",
    onReady: () => console.log("✅ sdkConfig verified"),
  };
</script>

<script>
  window._devSettings = {
    lk: "LICENSE_123ABC",
    debug: true,
    onReady: () => console.log("🔐 _devSettings verified"),
  };
</script>
<script>
  window.anythingYouWant = {
    license: "LICENSE_SOMETHING",
    injectables: true,
    onReady: () => console.log("🎯 anythingYouWant verified"),
  };
</script>
```

> The SDK will scan all global variables at runtime and automatically use the first object that has a
> valid license or lk key. No additional configuration is needed.

### 📦 Usage in Frameworks (ESM / CommonJS)

#### ➤ ESM (e.g. Vite, Nuxt, React, etc.)

```js
import "paylock-js";

// Optionally inject config into window (for client detection)
window.paylock = {
  license: "YOUR_LICENSE_KEY",
  onReady: () => console.log("✅ Verified"),
};
```

#### ➤ CommonJS (e.g. Webpack, Next.js)

```js
require("paylock-js");

global.paylock = {
  license: "YOUR_LICENSE_KEY",
  injectables: true,
  injectablesEndpoint: "https://yourapp.com/sdk/receive",
};
```

## 🔐 How It Works

- ✅ **Automatically detects** the license key from any global variable on the `window` scope.
- 🔍 **Verifies** the license against the paylock API in real-time.
- 🧠 **Caches** successful license checks using `localStorage` (with support for `recheck: false`).
- 🚫 If the license is **invalid**:
  - Shows a **modal** with customizable text and theme (`modalText`, `modalTheme`), or
  - **Redirects** the user if `invalidBehavior: 'redirect'` is set.
- 🔐 If `injectables` are enabled:
  - They are securely **forwarded** to your backend using the provided `injectablesEndpoint`.

> The SDK runs autonomously after being included — no need to manually call any methods.

## 💡 Notes

- 🧩 The global config key can be **named anything** (e.g., `window.myapp`, `window.licenseSettings`, etc.).  
  The SDK will automatically find the first object with a `license` or `lk` property.

- 🚫 The SDK **only runs once** and gracefully exits if license validation fails. Whenever an error is encountered, it will display the modal

- 🐞 You can enable `debug: true` in your config to see detailed logs in the browser console.

## 📫 Contact & Support

For help, feedback, or integration support:

- 🌐 Visit: [https://paylock.ng](https://paylock.ng)
- 📧 Email: [support@paylock.ng](mailto:support@paylock.ng)
