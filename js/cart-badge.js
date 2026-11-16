'use strict';

(function () {
    const CART_KEY = 'delishCart';

    function getItemsCount() {
        try {
            const cart = JSON.parse(localStorage.getItem(CART_KEY));
            if (!Array.isArray(cart)) return 0;
            return cart.reduce(function (sum, item) {
                var q = parseInt(item && item.quantity, 10);
                return sum + (q > 0 ? q : 0);
            }, 0);
        } catch (e) {
            return 0;
        }
    }

    function init() {
        const link = document.querySelector('.navbar-nav a[href="cart.html"]');
        if (!link) return;

        link.style.position = 'relative';

        const badge = document.createElement('span');
        badge.id = 'cart-badge';
        badge.setAttribute('aria-hidden', 'true');
        badge.style.cssText = [
            'position:absolute',
            'top:-2px',
            'right:-6px',
            'min-width:18px',
            'height:18px',
            'padding:0 5px',
            'box-sizing:border-box',
            'display:none',
            'align-items:center',
            'justify-content:center',
            'border-radius:50%',
            'font-size:11px',
            'font-weight:700',
            'line-height:1',
            'color:#fff',
            'background:radial-gradient(circle at 30% 25%, rgba(255,255,255,0.75), rgba(255,255,255,0.18) 60%)',
            'border:1px solid rgba(255,255,255,0.7)',
            'box-shadow:0 2px 6px rgba(0,0,0,0.25), inset 0 1px 2px rgba(255,255,255,0.8)',
            '-webkit-backdrop-filter:blur(4px)',
            'backdrop-filter:blur(4px)',
            'text-shadow:0 1px 2px rgba(0,0,0,0.45)',
            'pointer-events:none'
        ].join(';');
        link.appendChild(badge);

        function update() {
            const count = getItemsCount();
            badge.textContent = count > 99 ? '99+' : String(count);
            badge.style.display = count > 0 ? 'flex' : 'none';
            link.setAttribute('aria-label', count > 0 ? 'Cart, ' + count + ' items' : 'Cart');
        }

        update();
        window.addEventListener('delish:cart-changed', update);
        window.addEventListener('storage', function (e) {
            if (e.key === CART_KEY || e.key === null) update();
        });
        window.addEventListener('pageshow', update);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();