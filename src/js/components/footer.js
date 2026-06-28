// src/js/components/footer.js
// Injects the shared footer.

export function renderFooter() {
  const footerHTML = `
    <footer class="bg-choco text-cream mt-16">
      <div class="max-w-6xl mx-auto px-4 py-12">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">

          <!-- Brand -->
          <div>
            <div class="flex items-center gap-2 mb-3">
              <span class="text-3xl">🎂</span>
              <div>
                <p class="font-playfair text-xl font-bold text-blush">Anika's</p>
                <p class="font-dancing text-sm text-gold">Homemade Cake Studio</p>
              </div>
            </div>
            <p class="text-sm text-cream/70 leading-relaxed">Baked with Love, Purely Eggless.<br/>Custom cakes made fresh for every occasion.</p>
          </div>

          <!-- Quick links -->
          <div>
            <h4 class="font-cormorant text-lg font-semibold text-blush mb-3">Quick Links</h4>
            <ul class="space-y-2 text-sm text-cream/70">
              <li><a href="/src/pages/index.html"   class="hover:text-blush transition">Home</a></li>
              <li><a href="/src/pages/about.html"   class="hover:text-blush transition">About Us</a></li>
              <li><a href="/src/pages/gallery.html" class="hover:text-blush transition">Gallery</a></li>
              <li><a href="/src/pages/reviews.html" class="hover:text-blush transition">Reviews</a></li>
              <li><a href="/src/pages/contact.html" class="hover:text-blush transition">Order a Cake</a></li>
            </ul>
          </div>

          <!-- Contact -->
          <div>
            <h4 class="font-cormorant text-lg font-semibold text-blush mb-3">Get in Touch</h4>
            <ul class="space-y-3 text-sm text-cream/70">
              <li class="flex items-start gap-2">
                <span>📍</span>
                <span>Vision Aristo, Mukai Chowk,<br/>Ravet, Pune – 412101</span>
              </li>
              <li>
                <a href="https://wa.me/919503025610" target="_blank" class="flex items-center gap-2 hover:text-green-400 transition">
                  <span>💬</span> +91 95030 25610
                </a>
              </li>
              <li>
                <a href="https://www.instagram.com/anika_shomemadecakestudio" target="_blank" class="flex items-center gap-2 hover:text-pink-400 transition">
                  <span>📸</span> @anika_shomemadecakestudio
                </a>
              </li>
            </ul>
          </div>
        </div>

        <hr class="border-cream/10 my-8" />
        <div class="flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-cream/40">
          <p>© ${new Date().getFullYear()} Anika's Homemade Cake Studio. All rights reserved.</p>
          <p>Made with 🩷 in Pune</p>
        </div>
      </div>
    </footer>`;

  document.body.insertAdjacentHTML('beforeend', footerHTML);
}
