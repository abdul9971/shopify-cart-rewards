# Shopify Cart Rewards

A custom cart reward system for Shopify stores. When the cart total crosses configurable thresholds, reward messages (free shipping, mystery gift) appear/disappear dynamically without any page refresh.

Built with **HTML, CSS, and Vanilla JavaScript** only — no frameworks, no build tools, no third-party libraries.

---

## Features

- **Free Shipping Reward** — shows when cart total exceeds ₹3,000 (configurable)
- **Mystery Gift Reward** — shows when cart total exceeds ₹5,000 (configurable)
- **Auto-updating** — adding/removing items instantly re-evaluates rewards
- **Admin Settings Panel** — store admin can change thresholds at any time; changes persist via `localStorage`
- **Progress Bars** — animated progress toward the next reward tier
- **Responsive** — works on desktop, tablet, and mobile
- **Error Handling** — all modules use try/catch, input validation on admin panel

---

## Setup / Run Instructions

### Just open the file

Double-click `index.html` in your browser. That's it. No server required.

---

## Project Structure

```
shopify-cart-rewards/
├── index.html              # Main page
├── css/
│   └── styles.css          # All styles (design tokens, components, responsive)
├── js/
│   ├── config.js           # Reward thresholds config (localStorage backed)
│   ├── products.js          # Mock product data (simulates Shopify API)
│   ├── cart.js             # Cart state management (async, event-driven)
│   ├── rewards.js          # Reward evaluation engine (pure logic, no DOM)
│   ├── ui.js               # DOM rendering (banners, progress, toasts, admin)
│   └── app.js              # Entry point — wires everything together
├── assets/
│   └── images/             # Product images
└── README.md
```

---

## Approach & Architecture

### Modular Design

The code is split into 6 small modules, each with a single responsibility:

1. **config.js** — Stores reward thresholds in `localStorage`. Exposes a pub/sub API (`onChange`) so other modules react to admin changes instantly.

2. **products.js** — Mock product catalogue. In a real Shopify store, this data would come from the Storefront API or Liquid templates (`{{ product | json }}`).

3. **cart.js** — Manages cart state (add, remove, update quantity). Uses `async/await` with a simulated network delay to mimic the Shopify Cart AJAX API (`/cart/add.js`, `/cart/change.js`). Also uses pub/sub for change notifications.

4. **rewards.js** — Pure logic module with zero DOM access. Given a subtotal, it evaluates each reward tier and returns status objects (unlocked, progress percentage, remaining amount). This makes it easy to test independently.

5. **ui.js** — Handles all DOM manipulation — cart items, reward banners, progress bars, admin panel, toast notifications. Event delegation is used for dynamically created elements.

6. **app.js** — Entry point that subscribes the UI to Cart and Config changes, then seeds two demo products.

### Key Design Decisions

- **Observer pattern** (pub/sub) keeps modules decoupled — the Cart doesn't know about the UI, the Config doesn't know about the Rewards engine.
- **IIFE modules** provide encapsulation without needing a bundler (matching the "vanilla JS only" requirement).
- **Async simulation** demonstrates understanding of how the Shopify Cart AJAX API works in production.
- **Admin threshold validation** prevents invalid configs (negative numbers, gift threshold ≤ shipping threshold).

### How Reward Evaluation Works

```
Cart changes → Cart.onChange fires → UI.renderRewards() called
                                      ↓
                              RewardsEngine.evaluate(subtotal)
                                      ↓
                              Compares subtotal against each tier
                                      ↓
                              Returns: { unlocked, progress, remaining }
                                      ↓
                              UI shows/hides banners + progress bar
```

When admin changes thresholds:
```
Admin saves → RewardConfig.update() → RewardConfig.onChange fires
                                        ↓
                              UI.renderRewards() re-evaluates with new thresholds
```

### Shopify Integration Notes

To use this in a real Shopify store, you would:

1. Replace `products.js` with Liquid-rendered product data
2. Replace `Cart._simulateLatency()` calls with actual fetch requests to `/cart/add.js`, `/cart/change.js`, and `/cart.js`
3. Move admin settings to Shopify theme settings (`settings_schema.json`) or metafields
4. Include the JS/CSS in the theme's `cart.liquid` or `cart-template.liquid`

---

## How to Test

1. Open the app — cart starts with 2 items (₹3,998 total), so the free shipping banner should be visible
2. Add a **Premium Watch** (₹3,499) — total goes above ₹5,000, mystery gift banner appears
3. Remove items — watch the banners and progress bar update automatically
4. Change thresholds in the admin panel on the right and click **Save Settings**
5. Try edge cases: set threshold to 0, enter negative numbers, leave fields empty
6. Check mobile responsiveness by resizing the browser

---

## Browser Support

Tested on latest Chrome, Firefox, Safari, and Edge. Uses standard ES6+ features (async/await, template literals, optional chaining).
