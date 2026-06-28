// src/js/components/navbar.js
// Injects the shared navbar and highlights the active page link.

export function renderNavbar() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  const links = [
    { href: '/src/pages/index.html',   label: 'Home',    id: 'index.html' },
    { href: '/src/pages/about.html',   label: 'About',   id: 'about.html' },
    { href: '/src/pages/gallery.html', label: 'Gallery', id: 'gallery.html' },
    { href: '/src/pages/reviews.html', label: 'Reviews', id: 'reviews.html' },
    { href: '/src/pages/contact.html', label: 'Order',   id: 'contact.html' },
  ];

  const navHTML = `
    <nav id="navbar" class="bg-white/95 backdrop-blur-sm shadow-sm sticky top-0 z-50">
      <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <!-- Logo -->
        <a href="/src/pages/index.html" class="flex items-center gap-2 group">
          <span class="text-3xl">🎂</span>
          <div>
            <p class="font-playfair text-lg font-bold text-deeprose leading-tight">Anika's</p>
            <p class="font-dancing text-sm text-gold leading-tight">Homemade Cake Studio</p>
          </div>
        </a>

        <!-- Desktop links -->
        <div class="hidden md:flex items-center gap-6">
          ${links.map(l => `
            <a href="${l.href}" class="nav-link ${currentPage === l.id ? 'active' : ''}">${l.label}</a>
          `).join('')}
          <a href="/src/pages/admin/index.html" class="text-xs text-gray-300 hover:text-rose-300 transition ml-2">Admin</a>
        </div>

        <!-- Mobile hamburger -->
        <button id="mobile-menu-btn" class="md:hidden p-2 rounded-lg text-choco hover:bg-rose-50 transition" aria-label="Menu">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
      </div>

      <!-- Mobile menu -->
      <div id="mobile-menu" class="hidden md:hidden bg-white border-t border-rose-50 px-4 py-3 space-y-2">
        ${links.map(l => `
          <a href="${l.href}" class="block py-2 font-semibold text-sm ${currentPage === l.id ? 'text-deeprose' : 'text-choco'} hover:text-deeprose transition">${l.label}</a>
        `).join('')}
        <a href="/src/pages/admin/index.html" class="block py-2 text-xs text-gray-300 hover:text-rose-300 transition">Admin</a>
      </div>
    </nav>`;

  // Insert at top of body
  document.body.insertAdjacentHTML('afterbegin', navHTML);

  // Mobile toggle
  document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
    document.getElementById('mobile-menu')?.classList.toggle('hidden');
  });
}
