// Mock product catalogue.
// In a real Shopify store this data comes from the Storefront API or Liquid templates.

const ProductCatalogue = (() => {
  "use strict";

  const _products = Object.freeze([
    {
      id: "prod_001",
      title: "Classic Backpack",
      variant: "Black",
      price: 1799,
      image: "assets/images/backpack.png",
    },
    {
      id: "prod_002",
      title: "Minimal Sneakers",
      variant: "White / 42",
      price: 2199,
      image: "assets/images/sneakers.png",
    },
    {
      id: "prod_003",
      title: "Premium Watch",
      variant: "Silver",
      price: 3499,
      image: "assets/images/watch.png",
    },
    {
      id: "prod_004",
      title: "Wireless Earbuds",
      variant: "Graphite",
      price: 1299,
      image: "assets/images/earbuds.png",
    },
  ]);

  return Object.freeze({
    getAll() { return [..._products]; },
    getById(id) { return _products.find((p) => p.id === id); },
  });
})();
