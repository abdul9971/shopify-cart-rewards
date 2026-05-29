// UI renderer — handles all DOM updates for the cart, reward banners,
// progress bars, admin panel, and toast notifications.

const UI = (() => {
  "use strict";

  // DOM refs (cached on init)
  let $cartBody, $subtotal, $cartCountNav, $rewardBanners, $progressSection,
      $emptyState, $cartContent, $adminShipping, $adminGift, $adminSaveBtn,
      $adminResetBtn, $toastContainer, $bottomBar;

  function formatCurrency(amount) {
    return "₹" + Number(amount).toLocaleString("en-IN");
  }

  // --- Toast notifications ---

  function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
      <span class="toast__icon">${type === "success" ? "✓" : type === "error" ? "✕" : "ℹ"}</span>
      <span class="toast__text">${message}</span>
    `;
    $toastContainer.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add("toast--visible"));

    setTimeout(() => {
      toast.classList.remove("toast--visible");
      toast.addEventListener("transitionend", () => toast.remove());
    }, 3000);
  }

  // --- Cart rendering ---

  function renderCart(cartState) {
    const { items, subtotal, totalItems } = cartState;

    // empty vs filled state
    if (items.length === 0) {
      $emptyState.classList.remove("hidden");
      $cartContent.classList.add("hidden");
      $bottomBar.classList.add("hidden");
    } else {
      $emptyState.classList.add("hidden");
      $cartContent.classList.remove("hidden");
    }

    // badge
    $cartCountNav.textContent = totalItems;
    $cartCountNav.classList.toggle("hidden", totalItems === 0);

    // cart rows
    $cartBody.innerHTML = items
      .map(
        (item) => `
      <div class="cart-item" data-product-id="${item.product.id}">
        <div class="cart-item__image-col">
          <img class="cart-item__image" src="${item.product.image}" alt="${item.product.title}" loading="lazy" />
        </div>
        <div class="cart-item__info">
          <h3 class="cart-item__title">${item.product.title}</h3>
          <span class="cart-item__variant">${item.product.variant}</span>
        </div>
        <div class="cart-item__price">${formatCurrency(item.product.price)}</div>
        <div class="cart-item__quantity">
          <button class="qty-btn qty-btn--minus" data-action="decrease" data-id="${item.product.id}" aria-label="Decrease quantity">−</button>
          <input class="qty-input" type="number" min="1" value="${item.quantity}" data-id="${item.product.id}" aria-label="Quantity" />
          <button class="qty-btn qty-btn--plus" data-action="increase" data-id="${item.product.id}" aria-label="Increase quantity">+</button>
        </div>
        <div class="cart-item__total">${formatCurrency(item.lineTotal)}</div>
        <button class="cart-item__remove" data-action="remove" data-id="${item.product.id}" aria-label="Remove item">Remove</button>
      </div>
    `
      )
      .join("");

    $subtotal.textContent = formatCurrency(subtotal);
  }

  // --- Reward banners & progress bars ---

  function renderRewards(cartState) {
    const { subtotal } = cartState;
    const rewards = RewardsEngine.evaluate(subtotal);
    const unlocked = rewards.filter((r) => r.unlocked);
    const nextReward = rewards.find((r) => !r.unlocked);

    // banners for unlocked rewards
    $rewardBanners.innerHTML = unlocked
      .map(
        (r) => `
      <div class="reward-banner reward-banner--${r.type} reward-banner--in">
        <span class="reward-banner__icon">${r.icon}</span>
        <span class="reward-banner__text">${r.message}</span>
      </div>
    `
      )
      .join("");

    // progress toward next reward
    if (nextReward) {
      $progressSection.innerHTML = `
        <div class="progress-track">
          <div class="progress-fill" style="width: ${(nextReward.progress * 100).toFixed(1)}%"></div>
        </div>
        <div class="progress-label">
          <span>${formatCurrency(nextReward.remaining)} more to unlock a ${nextReward.type === "mystery-gift" ? "mystery gift" : "reward"}!</span>
          <span>${formatCurrency(nextReward.threshold)}</span>
        </div>
      `;
      $progressSection.classList.remove("hidden");
    } else if (rewards.length > 0) {
      $progressSection.innerHTML = `
        <div class="progress-track">
          <div class="progress-fill" style="width: 100%"></div>
        </div>
        <div class="progress-label">
          <span>🎉 All rewards unlocked!</span>
          <span></span>
        </div>
      `;
      $progressSection.classList.remove("hidden");
    } else {
      $progressSection.classList.add("hidden");
    }

    // sticky bottom bar
    if (nextReward && cartState.items.length > 0) {
      $bottomBar.classList.remove("hidden");
      $bottomBar.innerHTML = `
        <div class="bottom-bar__inner">
          <span class="bottom-bar__icon">${nextReward.icon}</span>
          <div class="bottom-bar__content">
            <span class="bottom-bar__text">Add items worth ${formatCurrency(nextReward.remaining)} more to unlock a ${nextReward.type === "mystery-gift" ? "mystery gift" : "free shipping"}!</span>
            <div class="bottom-bar__progress">
              <div class="bottom-bar__fill" style="width: ${(nextReward.progress * 100).toFixed(1)}%"></div>
            </div>
            <span class="bottom-bar__target">${formatCurrency(nextReward.threshold)}</span>
          </div>
        </div>
      `;
    } else if (cartState.items.length > 0 && !nextReward) {
      $bottomBar.classList.remove("hidden");
      $bottomBar.innerHTML = `
        <div class="bottom-bar__inner bottom-bar__inner--complete">
          <span class="bottom-bar__icon">🎉</span>
          <span class="bottom-bar__text">All rewards unlocked! You're getting the best deal.</span>
        </div>
      `;
    } else {
      $bottomBar.classList.add("hidden");
    }
  }

  // --- Admin settings panel ---

  function renderAdmin() {
    const cfg = RewardConfig.get();
    $adminShipping.value = cfg.freeShipping.threshold;
    $adminGift.value = cfg.mysteryGift.threshold;
  }

  function bindAdminEvents() {
    $adminSaveBtn.addEventListener("click", () => {
      const shippingVal = Number($adminShipping.value);
      const giftVal = Number($adminGift.value);

      if (isNaN(shippingVal) || shippingVal < 0) {
        showToast("Free shipping threshold must be a positive number.", "error");
        $adminShipping.focus();
        return;
      }
      if (isNaN(giftVal) || giftVal < 0) {
        showToast("Mystery gift threshold must be a positive number.", "error");
        $adminGift.focus();
        return;
      }
      if (giftVal <= shippingVal) {
        showToast("Mystery gift threshold should be greater than free shipping threshold.", "error");
        $adminGift.focus();
        return;
      }

      const ok = RewardConfig.update({ freeShipping: shippingVal, mysteryGift: giftVal });
      if (ok) {
        showToast("Reward settings saved successfully!");
        renderRewards(Cart.getState());
      } else {
        showToast("Failed to save settings.", "error");
      }
    });

    $adminResetBtn.addEventListener("click", () => {
      RewardConfig.reset();
      renderAdmin();
      renderRewards(Cart.getState());
      showToast("Settings reset to defaults.", "info");
    });
  }

  // --- Cart event delegation ---

  function bindCartEvents() {
    $cartBody.addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;

      const { action, id } = btn.dataset;
      const cartState = Cart.getState();
      const item = cartState.items.find((i) => i.product.id === id);
      btn.disabled = true;

      switch (action) {
        case "increase":
          await Cart.updateQuantity(id, (item?.quantity || 0) + 1);
          break;
        case "decrease":
          if (item && item.quantity > 1) {
            await Cart.updateQuantity(id, item.quantity - 1);
          } else {
            await Cart.removeItem(id);
          }
          break;
        case "remove":
          await Cart.removeItem(id);
          showToast("Item removed from cart.", "info");
          break;
      }
      btn.disabled = false;
    });

    // handle direct number input in qty field
    $cartBody.addEventListener("change", async (e) => {
      if (!e.target.matches(".qty-input")) return;
      const id = e.target.dataset.id;
      const newQty = parseInt(e.target.value, 10);

      if (isNaN(newQty) || newQty < 1) {
        e.target.value = 1;
        await Cart.updateQuantity(id, 1);
      } else {
        await Cart.updateQuantity(id, newQty);
      }
    });
  }

  // --- "Add to Cart" buttons in product grid ---

  function bindAddButtons() {
    document.querySelectorAll("[data-add-product]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.addProduct;
        btn.disabled = true;
        btn.textContent = "Adding…";
        await Cart.addItem(id);
        btn.disabled = false;
        btn.textContent = "Add to Cart";
        showToast("Item added to cart!");
      });
    });
  }

  // --- Init ---

  function init() {
    $cartBody = document.getElementById("cart-items");
    $subtotal = document.getElementById("cart-subtotal");
    $cartCountNav = document.getElementById("cart-count");
    $rewardBanners = document.getElementById("reward-banners");
    $progressSection = document.getElementById("reward-progress");
    $emptyState = document.getElementById("cart-empty");
    $cartContent = document.getElementById("cart-content");
    $adminShipping = document.getElementById("admin-shipping");
    $adminGift = document.getElementById("admin-gift");
    $adminSaveBtn = document.getElementById("admin-save");
    $adminResetBtn = document.getElementById("admin-reset");
    $toastContainer = document.getElementById("toast-container");
    $bottomBar = document.getElementById("bottom-bar");

    // quick sanity check
    const refs = { $cartBody, $subtotal, $cartCountNav, $rewardBanners, $progressSection,
      $emptyState, $cartContent, $adminShipping, $adminGift, $adminSaveBtn, $toastContainer, $bottomBar };
    for (const [name, el] of Object.entries(refs)) {
      if (!el) console.error(`Missing DOM element: ${name}`);
    }

    bindCartEvents();
    bindAdminEvents();
    bindAddButtons();
    renderAdmin();

    RewardConfig.onChange(() => renderAdmin());
  }

  return Object.freeze({ init, renderCart, renderRewards, showToast, formatCurrency });
})();
