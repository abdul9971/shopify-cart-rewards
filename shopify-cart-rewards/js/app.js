// App entry point — wires Config, Cart, Rewards, and UI together.
// Seeds the cart with two products so the demo shows rewards right away.

(async function App() {
  "use strict";

  try {
    UI.init();

    // re-render everything on every cart change
    Cart.onChange((cartState) => {
      UI.renderCart(cartState);
      UI.renderRewards(cartState);
    });

    // re-evaluate rewards when admin changes thresholds
    RewardConfig.onChange(() => {
      UI.renderRewards(Cart.getState());
    });

    // seed some demo items
    await Cart.addItem("prod_001"); // backpack
    await Cart.addItem("prod_002"); // sneakers

    console.log("[ShopRewards] Ready");
  } catch (err) {
    console.error("App init error:", err);
    document.body.innerHTML = `
      <div style="padding:3rem;text-align:center;font-family:sans-serif">
        <h2>Something went wrong</h2>
        <p>Please refresh the page or contact support.</p>
      </div>
    `;
  }
})();
