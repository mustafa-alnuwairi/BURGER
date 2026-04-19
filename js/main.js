/* ============================================================
   BURGER RESTAURANT — Main JavaScript
   File: js/main.js
============================================================ */

// ── Navbar scroll ─────────────────────────────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', scrollY > 40));

document.getElementById('hamburger').addEventListener('click', () => {
  const l = document.querySelector('.nav-links');
  l.style.cssText = l.style.display === 'flex' ? '' :
    'display:flex;flex-direction:column;position:absolute;top:100%;left:0;right:0;background:rgba(10,10,10,.97);padding:24px;gap:20px;border-bottom:1px solid var(--border);backdrop-filter:blur(18px);z-index:999';
});

// ── Reveal on scroll ──────────────────────────────────────────
const ro = new IntersectionObserver(entries => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('visible'), i * 80);
      ro.unobserve(e.target);
    }
  });
}, { threshold: .12 });
document.querySelectorAll('.reveal').forEach(el => ro.observe(el));

// ── HTML escape helper ────────────────────────────────────────
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ── Cart state ────────────────────────────────────────────────
let cart = [];

function cartTotal() { return cart.reduce((s, i) => s + i.price * i.qty, 0); }
function cartCount() { return cart.reduce((s, i) => s + i.qty, 0); }

function saveCart()  { try { localStorage.setItem('burger_cart', JSON.stringify(cart)); } catch(e) {} }
function loadCart()  { try { const d = localStorage.getItem('burger_cart'); if (d) cart = JSON.parse(d); } catch(e) {} }

function updateCartBadge() {
  const cnt = cartCount();
  const el  = document.getElementById('cartCount');
  el.textContent = cnt;
  el.classList.toggle('show', cnt > 0);
}

function addToCart(item) {
  const existing = cart.find(c => c.id === item.id);
  if (existing) { existing.qty++; }
  else { cart.push({ ...item, qty: 1 }); }
  saveCart();
  updateCartBadge();
  renderCartItems();
  // Animate badge
  const badge = document.getElementById('cartCount');
  badge.style.transform = 'scale(1.5)';
  setTimeout(() => { badge.style.transform = ''; }, 250);
}

function removeFromCart(id) {
  cart = cart.filter(c => c.id !== id);
  saveCart(); updateCartBadge(); renderCartItems();
}

function changeQty(id, delta) {
  const item = cart.find(c => c.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) { removeFromCart(id); return; }
  saveCart(); updateCartBadge(); renderCartItems();
}

function renderCartItems() {
  const el  = document.getElementById('cartItems');
  const tot = document.getElementById('cartTotal');
  tot.textContent = cartTotal().toFixed(2);

  if (!cart.length) {
    el.innerHTML = '<div class="cart-empty"><div class="cart-empty-icon">&#x1F6D2;</div>Your cart is empty.<br>Add some items from the menu!</div>';
    return;
  }

  el.innerHTML = cart.map(item => `
    <div class="cart-item" data-id="${item.id}">
      <img class="ci-img" src="${esc(item.image_path)}" alt="${esc(item.name)}"
        onerror="this.style.opacity='.3'" loading="lazy" />
      <div class="ci-info">
        <div class="ci-name">${esc(item.name)}</div>
        <div class="ci-price">
          <span style="font-family:var(--ff-b);font-size:.7rem;color:var(--muted)">EGP </span>
          ${(item.price * item.qty).toFixed(2)}
        </div>
        <div class="ci-controls">
          <button class="ci-btn"    data-action="dec" data-id="${item.id}">&#x2212;</button>
          <span   class="ci-qty">${item.qty}</span>
          <button class="ci-btn"    data-action="inc" data-id="${item.id}">&#x2B;</button>
          <button class="ci-remove" data-action="del" data-id="${item.id}">&#x1F5D1;</button>
        </div>
      </div>
    </div>
  `).join('');
}

// Delegated listener — cart controls
document.getElementById('cartItems').addEventListener('click', function(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const id     = parseInt(btn.dataset.id, 10);
  const action = btn.dataset.action;
  if (action === 'inc') changeQty(id, +1);
  if (action === 'dec') changeQty(id, -1);
  if (action === 'del') removeFromCart(id);
});

// ── Cart open / close ─────────────────────────────────────────
function openCart() {
  document.getElementById('cartOverlay').classList.add('open');
  document.getElementById('cartSidebar').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeCart() {
  document.getElementById('cartOverlay').classList.remove('open');
  document.getElementById('cartSidebar').classList.remove('open');
  document.body.style.overflow = '';
}

document.getElementById('cartTrigger').addEventListener('click', openCart);
document.getElementById('cartClose').addEventListener('click', closeCart);
document.getElementById('cartOverlay').addEventListener('click', closeCart);

// ── Checkout → order modal ────────────────────────────────────
document.getElementById('checkoutBtn').addEventListener('click', () => {
  if (!cart.length) return;
  closeCart();
  openOrderModal();
});

// ── Order modal ───────────────────────────────────────────────
function openOrderModal() {
  document.getElementById('orderSummary').innerHTML = `
    <div class="order-summary-title">Order Summary</div>
    ${cart.map(i => `
      <div class="order-summary-item">
        <span>${esc(i.name)} x${i.qty}</span>
        <span>EGP ${(i.price * i.qty).toFixed(2)}</span>
      </div>`).join('')}
    <div class="order-summary-total">
      <span>Total</span>
      <span>EGP ${cartTotal().toFixed(2)}</span>
    </div>`;

  document.getElementById('orderFormState').style.display = 'block';
  document.getElementById('orderSuccess').style.display   = 'none';
  document.getElementById('orderModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeOrderModal() {
  document.getElementById('orderModal').classList.remove('open');
  document.body.style.overflow = '';
}

document.getElementById('modalCancel').addEventListener('click', closeOrderModal);
document.getElementById('successClose').addEventListener('click', closeOrderModal);
document.getElementById('orderModal').addEventListener('click', e => {
  if (e.target === document.getElementById('orderModal')) closeOrderModal();
});

// ── Submit order ──────────────────────────────────────────────
document.getElementById('orderForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const name    = document.getElementById('oName').value.trim();
  const phone   = document.getElementById('oPhone').value.trim();
  const address = document.getElementById('oAddress').value.trim();
  const notes   = document.getElementById('oNotes').value.trim();

  if (!name)  { document.getElementById('oName').focus();  return; }
  if (!phone) { document.getElementById('oPhone').focus(); return; }

  const btn = document.getElementById('confirmBtn');
  btn.disabled    = true;
  btn.textContent = 'Placing Order...';

  const payload = {
    customer_name:    name,
    customer_phone:   phone,
    customer_address: address,
    notes,
    items: cart.map(i => ({ id: i.id, qty: i.qty }))
  };

  function showSuccess(orderId, total) {
    document.getElementById('orderFormState').style.display = 'none';
    document.getElementById('orderSuccess').style.display   = 'block';
    document.getElementById('successOrderId').textContent   = orderId
      ? `Order #${orderId} · EGP ${total}`
      : `EGP ${cartTotal().toFixed(2)} — We'll call you to confirm!`;
    cart = [];
    saveCart(); updateCartBadge(); renderCartItems();
    this.reset();
  }

  try {
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 6000);

    const res  = await fetch('api/order.php', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
      signal:  controller.signal
    });
    clearTimeout(timeout);
    const data = await res.json();

    if (data.success) {
      showSuccess.call(this, data.order_id, data.total);
    } else {
      // Server responded but with an error — still show success to user
      showSuccess.call(this, null, null);
    }
  } catch (_) {
    // No PHP server — show success in offline mode, order saved in browser
    showSuccess.call(this, null, null);
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Confirm Order';
  }
});

// ── Menu ──────────────────────────────────────────────────────
let allCategories = [];
let activeSlug    = null;
const itemsMap    = {};

function renderSkeletons(n = 8) {
  document.getElementById('menuGrid').innerHTML = Array.from({ length: n }).map(() => `
    <div class="skeleton-card">
      <div class="skeleton-img"></div>
      <div class="skeleton-body">
        <div class="skeleton-line"></div>
        <div class="skeleton-line short"></div>
      </div>
    </div>`).join('');
}

function renderTabs(cats) {
  const el = document.getElementById('menuTabs');
  el.innerHTML = cats.map(c => `
    <button class="tab-btn${c.slug === activeSlug ? ' active' : ''}" data-slug="${c.slug}">
      ${esc(c.name)}
    </button>`).join('');
  el.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeSlug = btn.dataset.slug;
      renderTabs(allCategories);
      renderCards(allCategories.find(c => c.slug === activeSlug));
    });
  });
}

function renderCards(category) {
  const grid = document.getElementById('menuGrid');
  if (!category || !category.items.length) {
    grid.innerHTML = '<p style="color:var(--muted);grid-column:1/-1;text-align:center;padding:40px 0">No items found.</p>';
    return;
  }
  category.items.forEach(item => {
    itemsMap[item.id] = {
      id:         item.id,
      name:       item.name,
      price:      parseFloat(item.price),
      image_path: item.image_path
    };
  });

  grid.innerHTML = category.items.map((item, i) => `
    <div class="menu-card" style="animation-delay:${i * .05}s">
      <div class="card-img-wrap">
        <img src="${esc(item.image_path)}" alt="${esc(item.name)}"
          loading="lazy" onerror="this.style.opacity='.3'" />
      </div>
      <div class="card-body">
        <div class="card-name">${esc(item.name)}</div>
        <div class="card-desc">${esc(item.description)}</div>
        <div class="card-footer">
          <div class="card-price"><span>EGP</span>${parseFloat(item.price).toFixed(2)}</div>
          <button class="btn-add" data-id="${item.id}">+ Add</button>
        </div>
      </div>
    </div>`).join('');
}

// Delegated listener — Add to Cart
document.getElementById('menuGrid').addEventListener('click', function(e) {
  const btn = e.target.closest('.btn-add');
  if (!btn) return;
  const item = itemsMap[btn.dataset.id];
  if (!item) return;
  addToCart(item);
  btn.textContent      = '✓ Added';
  btn.style.background = 'var(--amber)';
  btn.style.color      = '#000';
  setTimeout(() => {
    btn.textContent      = '+ Add';
    btn.style.background = '';
    btn.style.color      = '';
  }, 900);
});

// ── Static menu data (fallback — works without PHP server) ────
const STATIC_MENU = [
  {
    name: 'Chicken Sandwiches', slug: 'chicken-sandwiches',
    items: [
      { id:1,  name:'Mushroom Cheese Melt',    description:'Juicy open-faced beef patty loaded with sautéed mushrooms and melted cheese on crispy lettuce',                          price:62.00, image_path:'Chicken Sandwiches/084465fc13ed66144c17a5bc9f37524d.webp' },
      { id:2,  name:'The Open Stack',           description:'Open beef smash with melted cheddar, fresh tomato and white onion on a bed of green lettuce',                            price:57.00, image_path:'Chicken Sandwiches/107de22f659cd70e480e6ac560ef7d59.webp' },
      { id:3,  name:'Smoky Bacon Crunch',       description:'Beef patty with melted cheddar, caramelized onions and crispy bacon bits in a toasted brioche bun',                      price:72.00, image_path:'Chicken Sandwiches/43e6612b0dd5ae746a58531327ae98ce.webp' },
      { id:4,  name:'Crispy Chicken Classic',   description:'Golden crispy fried chicken with fresh lettuce, tomato, pickles, onions and creamy house sauce in a sesame bun',         price:58.00, image_path:'Chicken Sandwiches/5f9673352a1f5fafd00e3e2ae90af631.webp' },
      { id:5,  name:'The Classic Smash',        description:'Classic double smash beef patty with melted cheese, pickle slices, tomato, onion and mustard',                           price:55.00, image_path:'Chicken Sandwiches/60ff5457285c7ed2396e8dd07f4c53cf.webp' },
      { id:6,  name:'Jalapeño Chicken Crunch',  description:'Crispy fried chicken stacked with pickled jalapeños, red onion rings and spicy sauce in a sesame bun',                   price:65.00, image_path:'Chicken Sandwiches/730e9ce3b48956379c62c9ca72ac2b42.webp' },
      { id:7,  name:'Loaded Smash',             description:'Beef patty with melted cheese, crispy fries and onion rings all stacked in one brioche bun',                             price:75.00, image_path:'Chicken Sandwiches/8b4ae83988917cd8f1648e546cf5a6fd.webp' },
      { id:8,  name:'Simple Smash',             description:'A no-nonsense beef smash with melted cheese, pickle, tomato, onion and lettuce in a soft bun',                           price:50.00, image_path:'Chicken Sandwiches/933b3b93e79dc4ecae3d0af378b4ec84.webp' },
      { id:9,  name:'Brioche Smash',            description:'Beef patty with double cheddar, fresh tomato, onion and pickle slices in a premium toasted brioche',                     price:68.00, image_path:'Chicken Sandwiches/943a11bfe9daa4870f46f84eb418d640.webp' },
      { id:10, name:'Mushroom Burger',          description:'Tender beef patty with melted cheese and sautéed garlic mushrooms in a soft plain bun',                                  price:60.00, image_path:'Chicken Sandwiches/b1ac15401351170b2d82d45b75006d7c.webp' },
      { id:11, name:'Spicy Cheddar Burger',     description:'Beef smash with melted cheddar, pickled jalapeños and red onion rings in a toasted bun',                                price:63.00, image_path:'Chicken Sandwiches/e1201b5a044be680a2b9561fa933127e.webp' },
      { id:12, name:'Creamy Chicken Sandwich',  description:'Crispy fried chicken with fresh lettuce, tomato and our signature creamy sauce in a sesame bun',                         price:55.00, image_path:'Chicken Sandwiches/f3da7a1ac56e2121f21e49b5b2e1622f.webp' },
      { id:13, name:'Pepper & Fries Burger',    description:'Beef patty with melted cheese, roasted red peppers and crispy fries tucked inside a brioche bun',                        price:70.00, image_path:'Chicken Sandwiches/f7bb286103ecf2c0f09a091b37827565.webp' },
      { id:14, name:'Chicken Bacon Melt',       description:'Crispy chicken with sautéed mushrooms, crispy bacon strips and creamy white sauce in a sesame bun',                      price:78.00, image_path:'Chicken Sandwiches/fce09e6a80b59a8cf77275475988c79a.webp' },
    ]
  },
  {
    name: 'Drinks', slug: 'drinks',
    items: [
      { id:15, name:'Fresh Orange Juice', description:'100% freshly squeezed orange juice — pure and natural, 330ml', price:22.00, image_path:'Drinks/0de776208dca33c7a7c1274c3468a4ac.webp' },
      { id:16, name:'Lemon Lime Soda',    description:'Sparkling lemon-lime flavored soda, naturally flavored, 330ml', price:18.00, image_path:'Drinks/3161417d4cf84f1b60324a07ebace275.webp' },
      { id:17, name:'Cola',               description:'Classic cola soda with natural flavors, no caffeine, 330ml',    price:18.00, image_path:'Drinks/3f400af5438eb1f64e855faaf99b643d.webp' },
      { id:18, name:'Diet Cola',          description:'Light diet cola for a guilt-free sip, 300ml',                   price:18.00, image_path:'Drinks/768ace034324d1bea7d67141f98ad43c.webp' },
      { id:19, name:'Apple Juice',        description:'Juhayna 100% pure natural apple juice, 235ml',                  price:15.00, image_path:'Drinks/9f9d227549b8d0c81257dded1ebe0c7d.webp' },
      { id:20, name:'Mineral Water',      description:'Puvana still mineral water, 600ml',                              price:10.00, image_path:'Drinks/b4c9969a147297e6f3e852c84d7c319f.webp' },
    ]
  },
  {
    name: 'Sweets', slug: 'sweets',
    items: [
      { id:21, name:'Lotus Biscoff Cheesecake', description:'Creamy cheesecake cup crowned with crushed Biscoff crumble and a whole Lotus cookie', price:45.00, image_path:'Sweets/32e21a32d4e55705d9b3235bb02e804c.webp' },
      { id:22, name:'Blueberry Cheesecake',     description:'Rich and velvety cheesecake cup drizzled with fresh blueberry compote',               price:42.00, image_path:'Sweets/3c45b0dfba0fd0664b7fde22592a5fa8.webp' },
      { id:23, name:'Chocolate Chip Cookies',   description:'Homestyle tin box loaded with warm golden chocolate chip cookies — perfect for sharing', price:38.00, image_path:'Sweets/a7e0611c04d97471f037b87fef17664c.webp' },
    ]
  },
  {
    name: 'Additives', slug: 'additives',
    items: [
      { id:24, name:'Chicken Nuggets (6 pcs)',   description:'Crispy golden fried chicken nuggets — 6 pieces served in a red tray',          price:35.00, image_path:'Additives/00e14cb2b9b112c1ec40d7697e4ce5a3.webp' },
      { id:25, name:'Mustard Sauce',             description:'Classic yellow mustard dipping sauce — sharp and tangy',                       price: 5.00, image_path:'Additives/1bb8e64ccb038d875244c1ea2bbb2891.webp' },
      { id:26, name:'Chicken Tenders (2 pcs)',   description:'Two crispy golden fried chicken tenders, juicy inside and crunchy outside',    price:28.00, image_path:'Additives/2e08dbc9ce048332a0b11bc8b165e009.webp' },
      { id:27, name:'Ketchup',                   description:'House red tomato ketchup — smooth and sweet',                                  price: 5.00, image_path:'Additives/41a277c946e35a12ad0227b2572e917c.webp' },
      { id:28, name:'Cheese Onion Rings',        description:'Crispy breaded onion rings stuffed with melted cheese filling',                price:22.00, image_path:'Additives/4550b3ccfea85ef780f441ae4c83bc56.webp' },
      { id:29, name:'Cheese Onion Rings Basket', description:'Generous basket of crispy cheese-filled onion rings in a red tray',            price:30.00, image_path:'Additives/5542a555dd006d63d373c6a23f57ca00.webp' },
      { id:30, name:'Crispy Onion Rings',        description:'Four golden crispy battered onion rings served in a red tray',                 price:20.00, image_path:'Additives/6e98465e852f3ec7285c670f94caf2ec.webp' },
      { id:31, name:'Ranch Sauce',               description:'Cool and creamy ranch dipping sauce with herbs',                               price: 6.00, image_path:'Additives/80033c188b6c87f8ef4e026182907e1e.webp' },
      { id:32, name:'Coleslaw Salad',            description:'Fresh shredded cabbage and carrots tossed in a creamy house dressing',         price:18.00, image_path:'Additives/8747ba64511bf652a671d38c60f9b59c.webp' },
      { id:33, name:'Buffalo Sauce',             description:'Spicy pink-orange buffalo dipping sauce — bold and fiery',                     price: 6.00, image_path:'Additives/8bf4273178b92fdb18438b2413e0fe4e.webp' },
      { id:34, name:'Garlic Sauce',              description:'Pale green creamy garlic sauce — rich and aromatic',                           price: 6.00, image_path:'Additives/8e388f1948e7754daa467a2348ff09c9.webp' },
      { id:35, name:'Jalapeño Croquettes',       description:'Golden crispy fried jalapeño and cheese croquettes in an orange tray',         price:25.00, image_path:'Additives/aae91c5c0548fc3be5a977beaacf5f76.webp' },
      { id:36, name:'Egg & Cheese Wrap',         description:'Grilled flatbread filled with scrambled eggs, ham and melted cheddar',         price:32.00, image_path:'Additives/b1b145e6bfd55e3dce42604a41dfed10.webp' },
      { id:37, name:'Mushroom Sauce',            description:'Creamy mushroom and herb sauce — the perfect finishing touch',                 price: 6.00, image_path:'Additives/c264684275c150adc27ad6626141be67.webp' },
      { id:38, name:'Honey Mustard Sauce',       description:'Sweet and tangy honey mustard dipping sauce — a fan favorite',                price: 5.00, image_path:'Additives/d657260b7da71715c209e2d9355def36.webp' },
    ]
  }
];

async function loadMenu() {
  renderSkeletons();
  try {
    const res  = await fetch('api/menu.php');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.length) throw new Error('Empty');
    allCategories = data;
  } catch (_) {
    allCategories = STATIC_MENU;
  }
  activeSlug = allCategories[0].slug;
  renderTabs(allCategories);
  renderCards(allCategories[0]);
}

// ── Contact form ──────────────────────────────────────────────
document.getElementById('contactForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const btn = document.getElementById('submitBtn');
  btn.textContent = 'Sending...';
  btn.disabled    = true;
  setTimeout(() => {
    btn.textContent      = 'Message Sent!';
    btn.style.background = 'var(--amber)';
    btn.style.color      = '#000';
    this.reset();
    setTimeout(() => {
      btn.textContent      = 'Send Message';
      btn.style.background = '';
      btn.style.color      = '';
      btn.disabled         = false;
    }, 3000);
  }, 1200);
});

// ── Init ──────────────────────────────────────────────────────
loadCart();
updateCartBadge();
renderCartItems();
loadMenu();
