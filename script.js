const defaultProducts = [
  { id: 'p1', name: 'Dhaka Ko Topi', price: 1100, category: 'kapada', description: 'Handcrafted Nepali Dhaka topi from local weavers.', image: 'Topi', loss: false },
  { id: 'p2', name: 'Chiya Kettle', price: 2200, category: 'gharelu', description: 'Traditional tea kettle for Nepali kitchen use.', image: 'Kettle', loss: true },
  { id: 'p3', name: 'Handmade Pashmina', price: 4500, category: 'kapada', description: 'Soft Pashmina scarf woven by artisans.', image: 'Pashmina', loss: false },
  { id: 'p4', name: 'Local Honey', price: 650, category: 'aahar', description: 'Pure mountain honey from the Himalayan region.', image: 'Honey', loss: true },
  { id: 'p5', name: 'Organic Rice Pack', price: 2200, category: 'aahar', description: 'Locally grown organic rice for daily meals.', image: 'Rice', loss: false },
  { id: 'p6', name: 'Thangka Art Piece', price: 7800, category: 'sajawati', description: 'Traditional Thangka painting for cultural home decor.', image: 'Thangka', loss: true }
];

const storedProducts = JSON.parse(localStorage.getItem('ms-products')) || defaultProducts;
let products = Array.isArray(storedProducts) ? storedProducts : defaultProducts;
let cart = JSON.parse(localStorage.getItem('ms-cart')) || {};
const defaultUsers = {
  admin: { username: 'admin', password: 'admin123', role: 'admin' },
  customer: { username: 'customer', password: 'password', role: 'customer' }
};
const storedUsers = JSON.parse(localStorage.getItem('ms-users')) || defaultUsers;
let users = storedUsers && typeof storedUsers === 'object' ? storedUsers : defaultUsers;
const defaultChat = [
  { role: 'business', text: 'Welcome to Nepali Bazar! How can we help with local Nepali products today?', timestamp: new Date().toISOString() }
];
let chatMessages = JSON.parse(localStorage.getItem('ms-chat')) || defaultChat;
let activeCategory = 'all';
let activeSearch = '';

function saveState() {
  localStorage.setItem('ms-cart', JSON.stringify(cart));
  localStorage.setItem('ms-products', JSON.stringify(products));
  localStorage.setItem('ms-chat', JSON.stringify(chatMessages));
}

function saveUsers() {
  localStorage.setItem('ms-users', JSON.stringify(users));
}

function formatPrice(value) {
  return value.toLocaleString('en-IN');
}

function renderCurrency(value) {
  return `Rs ${formatPrice(value)}`;
}

function getProductImage(product) {
  const value = product.image || product.name;
  if (/^https?:\/\//.test(value)) {
    return value;
  }
  const text = encodeURIComponent(value);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="500" height="320">
      <rect width="100%" height="100%" rx="28" ry="28" fill="#f3f5ff" />
      <text x="50%" y="48%" dominant-baseline="middle" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="28" fill="#25303f">${text}</text>
      <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="18" fill="#667085">Nepali Bazar</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function renderProducts() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;
  const filtered = products.filter((product) => {
    const matchesCategory = activeCategory === 'all' || product.category.toLowerCase() === activeCategory;
    const matchesSearch = product.name.toLowerCase().includes(activeSearch) || product.description.toLowerCase().includes(activeSearch);
    return matchesCategory && matchesSearch;
  });

  grid.innerHTML = filtered.map((product) => `
    <article class="product-card">
      <div class="product-image">
        <img src="${getProductImage(product)}" alt="${product.name}" />
      </div>
      <div class="product-card-header">
        <div>
          <p class="eyebrow">${product.category}</p>
          <h3 class="product-card-title">${product.name}</h3>
        </div>
        <span class="badge">${product.category}</span>
      </div>
      <p class="product-card-description">${product.description}</p>
      <div class="product-card-price">
        <span>${product.loss ? '<span class="loss-badge">Loss</span>' : ''} ${renderCurrency(product.price)}</span>
        <button class="button" onclick="addToCart('${product.id}')">Add to cart</button>
      </div>
    </article>
  `).join('');
}

function updateProductFilters() {
  document.querySelectorAll('.filter-button').forEach((button) => {
    button.classList.toggle('active', button.dataset.category === activeCategory);
  });
}

function addToCart(productId) {
  const selected = products.find((product) => product.id === productId);
  if (!selected) return;
  cart[productId] = cart[productId] ? cart[productId] + 1 : 1;
  saveState();
  renderCart();
}

function removeFromCart(productId) {
  delete cart[productId];
  saveState();
  renderCart();
}

function changeCartQuantity(productId, delta) {
  if (!cart[productId]) return;
  cart[productId] += delta;
  if (cart[productId] <= 0) {
    delete cart[productId];
  }
  saveState();
  renderCart();
}

function renderCart() {
  const cartItems = document.getElementById('cart-items');
  const cartTotal = document.getElementById('cart-total');
  const cartCount = document.getElementById('cart-count');
  if (!cartItems || !cartTotal || !cartCount) return;

  const entries = Object.entries(cart);
  if (entries.length === 0) {
    cartItems.innerHTML = '<p class="cart-empty">Your cart is empty. Add a product to get started.</p>';
  } else {
    cartItems.innerHTML = entries.map(([productId, quantity]) => {
      const product = products.find((item) => item.id === productId);
      if (!product) return '';
      return `
        <div class="cart-item">
          <div class="cart-item-info">
            <p class="cart-item-title">${product.name}</p>
            <p class="cart-item-meta">${renderCurrency(product.price)} × ${quantity}</p>
          </div>
          <div class="cart-item-actions">
            <button onclick="changeCartQuantity('${product.id}', 1)">+</button>
            <button onclick="changeCartQuantity('${product.id}', -1)">−</button>
            <button onclick="removeFromCart('${product.id}')">Remove</button>
          </div>
        </div>
      `;
    }).join('');
  }

  const total = entries.reduce((sum, [productId, quantity]) => {
    const product = products.find((item) => item.id === productId);
    return sum + (product ? product.price * quantity : 0);
  }, 0);

  cartTotal.textContent = renderCurrency(total);
  cartCount.textContent = entries.reduce((sum, [, quantity]) => sum + quantity, 0);
}

function openCart() {
  document.getElementById('cart-panel')?.classList.add('open');
  document.getElementById('overlay')?.classList.add('active');
}

function closeCart() {
  document.getElementById('cart-panel')?.classList.remove('open');
  document.getElementById('overlay')?.classList.remove('active');
}

function checkout() {
  if (!Object.keys(cart).length) {
    alert('Add items to the cart before checkout.');
    return;
  }
  const user = getCurrentUser();
  if (!user) {
    alert('Please login or register to checkout.');
    window.location.href = 'login.html';
    return;
  }
  cart = {};
  saveState();
  renderCart();
  closeCart();
  alert(`Thank you, ${user.username}! Your order has been placed.`);
}

function renderChat(boxId) {
  const box = document.getElementById(boxId);
  if (!box) return;
  box.innerHTML = chatMessages.map((message) => `
    <div class="chat-message ${message.role}">
      <div>${message.text}</div>
      <time>${new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
    </div>
  `).join('');
  box.scrollTop = box.scrollHeight;
  updateBusinessStats();
}

function appendChatMessage(role, text) {
  chatMessages.push({ role, text, timestamp: new Date().toISOString() });
  saveState();
  renderChat('chat-box');
  renderChat('business-chat-box');
}

function initChatForm(formId, inputId, roleSelectId, resetButtonId) {
  const form = document.getElementById(formId);
  const input = document.getElementById(inputId);
  const roleSelect = document.getElementById(roleSelectId);

  if (!form || !input || !roleSelect) return;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const message = input.value.trim();
    if (!message) return;
    const role = roleSelect.value;
    appendChatMessage(role, message);
    input.value = '';
  });

  document.getElementById(resetButtonId)?.addEventListener('click', () => {
    chatMessages = [...defaultChat];
    saveState();
    renderChat('chat-box');
    renderChat('business-chat-box');
  });
}

function updateBusinessProductList() {
  const list = document.getElementById('business-product-list');
  if (!list) return;
  list.innerHTML = products.map((product) => `
    <tr>
      <td>${product.name}</td>
      <td>${product.category}</td>
      <td>${renderCurrency(product.price)}</td>
      <td>${product.loss ? '<span class="loss-badge">Loss</span>' : ''}</td>
      <td><button onclick="removeProduct('${product.id}')">Delete</button></td>
    </tr>
  `).join('');
  document.getElementById('product-count').textContent = `${products.length}`;
}

function addProduct(event) {
  event.preventDefault();
  const nameInput = document.getElementById('product-name');
  const priceInput = document.getElementById('product-price');
  const categoryInput = document.getElementById('product-category');
  const descriptionInput = document.getElementById('product-description');
  const imageInput = document.getElementById('product-image');

  if (!nameInput || !priceInput || !categoryInput || !descriptionInput || !imageInput) return;
  const name = nameInput.value.trim();
  const price = parseFloat(priceInput.value);
  const category = categoryInput.value.trim().toLowerCase();
  const description = descriptionInput.value.trim();
  const image = imageInput.value.trim();
  const loss = document.getElementById('product-loss')?.checked ?? false;

  if (!name || !price || !category || !description) {
    alert('Please fill in all product details.');
    return;
  }

  const id = `p${Date.now()}`;
  products.unshift({ id, name, price, category, description, image, loss });
  saveState();
  renderProducts();
  updateBusinessProductList();
  nameInput.value = '';
  priceInput.value = '';
  categoryInput.value = '';
  descriptionInput.value = '';
  imageInput.value = '';
}

function removeProduct(productId) {
  products = products.filter((product) => product.id !== productId);
  saveState();
  renderProducts();
  updateBusinessProductList();
  if (cart[productId]) {
    delete cart[productId];
    saveState();
    renderCart();
  }
}

function updateBusinessStats() {
  const messageCounter = document.getElementById('message-count');
  const lossCounter = document.getElementById('loss-count');
  if (messageCounter) {
    messageCounter.textContent = `${chatMessages.length}`;
  }
  if (lossCounter) {
    const lossCount = products.filter((product) => product.loss).length;
    lossCounter.textContent = `${lossCount}`;
  }
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('ms-user')) || null;
  } catch (error) {
    return null;
  }
}

function redirectIfLoggedIn() {
  const user = getCurrentUser();
  if (!user) return;
  const isLoginPage = window.location.pathname.includes('login.html');
  if (!isLoginPage) return;
  if (user.role === 'admin') {
    window.location.href = 'business.html';
  } else if (user.role === 'customer') {
    window.location.href = 'index.html';
  }
}

function requireAdminAccess() {
  const isBusinessPage = window.location.pathname.includes('business.html');
  if (!isBusinessPage) return;
  const user = getCurrentUser();
  if (!user || user.role !== 'admin') {
    window.location.href = 'login.html';
  }
}

function logout() {
  localStorage.removeItem('ms-user');
  window.location.href = 'login.html';
}

function updateHeaderUserStatus() {
  const user = getCurrentUser();
  const status = document.getElementById('user-status');
  const logoutBtn = document.getElementById('logout-btn');
  const loginLinks = Array.from(document.querySelectorAll('a[href="login.html"]'));

  if (!status || !logoutBtn) return;

  if (user) {
    status.textContent = `Logged in as ${user.username}`;
    logoutBtn.classList.remove('hidden');
    loginLinks.forEach((link) => link.classList.add('hidden'));
  } else {
    status.textContent = '';
    logoutBtn.classList.add('hidden');
    loginLinks.forEach((link) => link.classList.remove('hidden'));
  }
}

function registerUser(username, password) {
  if (users[username]) {
    return { success: false, message: 'Username already exists. Try a different username.' };
  }
  users[username] = { username, password, role: 'customer' };
  saveUsers();
  return { success: true };
}

function handleLogin() {
  const form = document.getElementById('login-form');
  const message = document.getElementById('login-message');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const role = document.getElementById('login-role')?.value;
    const username = document.getElementById('login-username')?.value.trim();
    const password = document.getElementById('login-password')?.value.trim();
    const user = users[username];

    if (user && user.password === password && user.role === role) {
      localStorage.setItem('ms-user', JSON.stringify({ role: user.role, username: user.username }));
      window.location.href = user.role === 'admin' ? 'business.html' : 'index.html';
      return;
    }

    if (message) {
      message.textContent = 'Invalid credentials. Customer: customer / password, Admin: admin / admin123';
    }
  });
}

function initNavigation() {
  document.getElementById('menu-toggle')?.addEventListener('click', () => {
    document.getElementById('nav-links')?.classList.toggle('open');
  });
  document.getElementById('logout-btn')?.addEventListener('click', logout);
}

function initAuthForms() {
  const loginToggle = document.getElementById('auth-toggle-login');
  const registerToggle = document.getElementById('auth-toggle-register');
  const loginCard = document.getElementById('login-card');
  const registerCard = document.getElementById('register-card');
  const registerForm = document.getElementById('register-form');
  const registerMessage = document.getElementById('register-message');

  if (loginToggle && registerToggle && loginCard && registerCard) {
    const setMode = (mode) => {
      loginCard.classList.toggle('hidden', mode !== 'login');
      registerCard.classList.toggle('hidden', mode !== 'register');
      loginToggle.classList.toggle('active', mode === 'login');
      registerToggle.classList.toggle('active', mode === 'register');
    };
    loginToggle.addEventListener('click', () => setMode('login'));
    registerToggle.addEventListener('click', () => setMode('register'));
    setMode('login');
  }

  if (registerForm) {
    registerForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const username = document.getElementById('register-username')?.value.trim();
      const password = document.getElementById('register-password')?.value.trim();
      const confirmPassword = document.getElementById('register-password-confirm')?.value.trim();

      if (!username || !password || !confirmPassword) {
        if (registerMessage) registerMessage.textContent = 'Please fill in all fields.';
        return;
      }
      if (password !== confirmPassword) {
        if (registerMessage) registerMessage.textContent = 'Passwords do not match.';
        return;
      }

      const result = registerUser(username, password);
      if (!result.success) {
        if (registerMessage) registerMessage.textContent = result.message;
        return;
      }

      localStorage.setItem('ms-user', JSON.stringify({ role: 'customer', username }));
      window.location.href = 'index.html';
    });
  }
}

function initActions() {
  document.getElementById('open-cart')?.addEventListener('click', openCart);
  document.getElementById('close-cart')?.addEventListener('click', closeCart);
  document.getElementById('overlay')?.addEventListener('click', closeCart);
  document.getElementById('checkout-btn')?.addEventListener('click', checkout);

  document.getElementById('search-input')?.addEventListener('input', (event) => {
    activeSearch = event.target.value.toLowerCase();
    renderProducts();
  });

  document.querySelectorAll('.filter-button').forEach((button) => {
    button.addEventListener('click', () => {
      activeCategory = button.dataset.category;
      updateProductFilters();
      renderProducts();
    });
  });

  const businessForm = document.getElementById('product-form');
  if (businessForm) {
    businessForm.addEventListener('submit', addProduct);
  }
}

function initPage() {
  initNavigation();
  updateHeaderUserStatus();
  redirectIfLoggedIn();
  requireAdminAccess();
  initActions();
  renderProducts();
  renderCart();
  renderChat('chat-box');
  renderChat('business-chat-box');
  initChatForm('chat-form', 'chat-input', 'chat-role', 'reset-chat');
  initChatForm('business-chat-form', 'business-chat-input', 'business-chat-role', 'business-reset-chat');
  updateBusinessProductList();
  updateBusinessStats();
  handleLogin();
  initAuthForms();
}

window.addEventListener('DOMContentLoaded', initPage);
