// One renderer for both the cart page and the drawer, so a change to how a
// line looks can't drift between them.
import { read, setQty, subtotal, money } from './cart.js';

export function lineHTML(slug, item, qty, { compact = false } = {}) {
  return `
    <li class="flex flex-wrap items-center gap-x-5 gap-y-3 ${compact ? 'py-4' : 'py-6'}">
      <div class="napkin shrink-0 p-2">
        <img src="${item.thumb}" alt="${item.alt}" width="${compact ? 48 : 64}" height="${compact ? 60 : 80}"
             class="${compact ? 'h-15 w-12' : 'h-20 w-16'} rounded-md object-cover" loading="lazy">
      </div>
      <div class="min-w-[8rem] flex-1">
        <a href="/menu/${slug}" class="font-display ${compact ? 'text-base' : 'text-lg'} tracking-[0.05em] text-brand uppercase">${item.name}</a>
        <p class="data mt-1 text-[11px] text-ink/70">${item.abv || 'Zero proof'} · ${money(item.price)} each</p>
      </div>
      <div class="flex items-center gap-2">
        <button type="button" class="step" data-step="-1" data-slug="${slug}" aria-label="One fewer ${item.name}">&minus;</button>
        <span class="data w-8 text-center text-base text-brand" data-qty-for="${slug}">${qty}</span>
        <button type="button" class="step" data-step="1" data-slug="${slug}" aria-label="One more ${item.name}">+</button>
      </div>
      <p class="data w-20 text-right text-base text-brand">${money(item.price * qty)}</p>
      <button type="button" class="eyebrow inline-flex min-h-11 items-center px-1 text-ink/70 underline underline-offset-4 hover:text-error"
              data-remove="${slug}">Remove</button>
    </li>`;
}

/** Fills a <ul> from the cart. Returns the number of distinct drinks shown. */
export function renderLines(list, catalog, options = {}) {
  const cart = read();
  const slugs = Object.keys(cart).filter((slug) => catalog[slug]);
  list.innerHTML = slugs.map((slug) => lineHTML(slug, catalog[slug], cart[slug], options)).join('');
  return { slugs, total: subtotal(cart, catalog) };
}

/** Steppers and remove buttons work identically wherever a line is rendered. */
export function bindLineControls(root = document) {
  root.addEventListener('click', (event) => {
    const step = event.target.closest('[data-step]');
    if (step) {
      const cart = read();
      setQty(step.dataset.slug, (cart[step.dataset.slug] || 0) + Number(step.dataset.step));
      return;
    }
    const remove = event.target.closest('[data-remove]');
    if (remove) setQty(remove.dataset.remove, 0);
  });
}
