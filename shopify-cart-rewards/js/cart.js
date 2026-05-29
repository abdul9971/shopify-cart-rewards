// Cart state manager.
// In production this would wrap Shopify's Cart AJAX API (/cart/add.js, /cart/change.js).
// The _simulateLatency call mimics network delay for a realistic demo.

const Cart = (() => {
  "use strict";

  let _items = [];
  const _listeners = new Set();

  function _simulateLatency() {
    return new Promise((res) => setTimeout(res, 50 + Math.random() * 150));
  }

  function _notify() {
    const snapshot = Cart.getState();
    _listeners.forEach((fn) => {
      try { fn(snapshot); } catch (err) { console.error("Cart listener error:", err); }
    });
  }

  function _indexOf(productId) {
    return _items.findIndex((item) => item.product.id === productId);
  }

  return Object.freeze({
    async addItem(productId) {
      try {
        await _simulateLatency();
        const idx = _indexOf(productId);
        if (idx !== -1) {
          _items[idx].quantity += 1;
        } else {
          const product = ProductCatalogue.getById(productId);
          if (!product) throw new Error(`Product ${productId} not found`);
          _items.push({ product, quantity: 1 });
        }
        _notify();
        return true;
      } catch (err) {
        console.error("addItem failed:", err);
        return false;
      }
    },

    async removeItem(productId) {
      try {
        await _simulateLatency();
        const idx = _indexOf(productId);
        if (idx === -1) throw new Error(`Item ${productId} not in cart`);
        _items.splice(idx, 1);
        _notify();
        return true;
      } catch (err) {
        console.error("removeItem failed:", err);
        return false;
      }
    },

    async updateQuantity(productId, qty) {
      try {
        await _simulateLatency();
        const newQty = Math.max(0, Math.floor(Number(qty)));
        const idx = _indexOf(productId);

        if (idx === -1) {
          if (newQty > 0) {
            const product = ProductCatalogue.getById(productId);
            if (!product) throw new Error(`Product ${productId} not found`);
            _items.push({ product, quantity: newQty });
          }
        } else if (newQty === 0) {
          _items.splice(idx, 1);
        } else {
          _items[idx].quantity = newQty;
        }
        _notify();
        return true;
      } catch (err) {
        console.error("updateQuantity failed:", err);
        return false;
      }
    },

    getState() {
      const items = _items.map((i) => ({
        ...i,
        lineTotal: i.product.price * i.quantity,
      }));
      return {
        items,
        totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
        subtotal: items.reduce((sum, i) => sum + i.lineTotal, 0),
      };
    },

    async clear() {
      await _simulateLatency();
      _items = [];
      _notify();
    },

    onChange(fn) {
      _listeners.add(fn);
      return () => _listeners.delete(fn);
    },
  });
})();
