// The whole cart. Slug -> quantity in localStorage; names and prices always come
// from the content collection at render time, so a price change in Markdown can
// never be contradicted by a stale copy in someone's browser.
const KEY = 'cv-cart';

export function read() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY));
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {}; // Private mode, cleared storage, corrupt value — all mean "empty".
  }
}

function write(cart) {
  try {
    localStorage.setItem(KEY, JSON.stringify(cart));
  } catch {
    /* Storage full or blocked: the page still works, it just won't persist. */
  }
  document.dispatchEvent(new CustomEvent('cart:change', { detail: cart }));
}

export function setQty(slug, qty) {
  const cart = read();
  if (qty > 0) cart[slug] = Math.min(qty, 99);
  else delete cart[slug];
  write(cart);
}

export function add(slug, n = 1) {
  setQty(slug, (read()[slug] || 0) + n);
}

export function clear() {
  write({});
}

export function count(cart = read()) {
  return Object.values(cart).reduce((total, qty) => total + qty, 0);
}

export function subtotal(cart, catalog) {
  return Object.entries(cart).reduce(
    (total, [slug, qty]) => total + (catalog[slug]?.price ?? 0) * qty,
    0,
  );
}

export const money = (n) => `£${n.toFixed(2)}`;
