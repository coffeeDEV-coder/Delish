'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const cartEmptyEl = document.getElementById('cart-empty');
    const cartContentEl = document.getElementById('cart-content');
    const checkoutSection = document.getElementById('checkout-section');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartItemCountEl = document.getElementById('cart-item-count');
    const cartTotalEl = document.getElementById('cart-total');
    const clearCartBtn = document.getElementById('clear-cart-btn');
    const checkoutForm = document.getElementById('checkout-form');
    const orderErrorEl = document.getElementById('order-error');
    const orderConfirmation = document.getElementById('order-confirmation');
    let cart = [];
    try {
        const saved = JSON.parse(localStorage.getItem('delishCart'));
        cart = Array.isArray(saved) ? saved : [];
    } catch (e) {
        cart = [];
    }
    function notifyCartChanged() {
        window.dispatchEvent(new Event('delish:cart-changed'));
    }
    function renderCart() {
        if (!cartItemsContainer) return;
        cartItemsContainer.innerHTML = '';
        if (cart.length === 0) {
            if (cartEmptyEl) cartEmptyEl.classList.remove('hidden');
            if (cartContentEl) cartContentEl.classList.add('hidden');
            if (checkoutSection) checkoutSection.classList.add('hidden');
            return;
        }
        if (cartEmptyEl) cartEmptyEl.classList.add('hidden');
        if (cartContentEl) cartContentEl.classList.remove('hidden');
        if (checkoutSection) checkoutSection.classList.remove('hidden');
        let totalQuantity = 0;
        let totalPrice = 0;
        cart.forEach((item, index) => {
            const subtotal = item.price * item.quantity;
            totalQuantity += item.quantity;
            totalPrice += subtotal;
            const tr = document.createElement('tr');
            const tdName = document.createElement('td');
            tdName.textContent = item.name;
            tr.appendChild(tdName);
            const tdPrice = document.createElement('td');
            tdPrice.textContent = item.price.toLocaleString() + ' ₸';
            tr.appendChild(tdPrice);
            const tdQty = document.createElement('td');
            const qtyInput = document.createElement('input');
            qtyInput.type = 'number';
            qtyInput.min = '1';
            qtyInput.max = '20';
            qtyInput.value = item.quantity;
            qtyInput.className = 'form-control form-control-sm text-center';
            qtyInput.style.width = '70px';
        
            qtyInput.addEventListener('change', (e) => {
                const newQty = parseInt(e.target.value, 10);
                if (isNaN(newQty) || newQty < 1) {
                    // некорректное значение: возвращаем прежнее количество (удаление - кнопкой Remove)
                    e.target.value = cart[index].quantity;
                    return;
                }
                cart[index].quantity = Math.min(newQty, 20);
                localStorage.setItem('delishCart', JSON.stringify(cart));
                renderCart();
                notifyCartChanged();
            });
            tdQty.appendChild(qtyInput);
            tr.appendChild(tdQty);
            const tdSubtotal = document.createElement('td');
            tdSubtotal.className = 'fw-semibold';
            tdSubtotal.textContent = subtotal.toLocaleString() + ' ₸';
            tr.appendChild(tdSubtotal);
            const tdAction = document.createElement('td');
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'btn btn-outline-danger btn-sm rounded-pill px-3';
            removeBtn.textContent = 'Remove';
            removeBtn.addEventListener('click', () => {
                cart.splice(index, 1);
                localStorage.setItem('delishCart', JSON.stringify(cart));
                renderCart();
                notifyCartChanged();
            });
            tdAction.appendChild(removeBtn);
            tr.appendChild(tdAction);
            cartItemsContainer.appendChild(tr);
        });
        if (cartItemCountEl) cartItemCountEl.textContent = totalQuantity;
        if (cartTotalEl) cartTotalEl.textContent = totalPrice.toLocaleString() + ' ₸';
    }

    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', () => {
            cart = [];
            localStorage.removeItem('delishCart');
            renderCart();
            notifyCartChanged();
        });
    }
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nameInput = document.getElementById('order-name');
            const phoneInput = document.getElementById('order-phone');
            const timeInput = document.getElementById('order-time');
            const paymentSelect = document.getElementById('order-payment');
            if (orderErrorEl) {
                orderErrorEl.classList.add('hidden');
                orderErrorEl.textContent = '';
            }
            const name = nameInput.value.trim();
            const phone = phoneInput.value.trim();
            const time = timeInput.value.trim();
            const payment = paymentSelect.value;
            if (name.length < 2) {
                showError('Please enter a valid name (at least 2 characters).');
                nameInput.focus();
                return;
            }
            const phoneDigits = phone.replace(/\D/g, '');
            if (phoneDigits.length < 11 || /^7(\d)\1{9}$/.test(phoneDigits)) {
                showError('Please enter all 10 digits after +7 (e.g. +7 (700) 000-00-00).');
                phoneInput.focus();
                return;
            }
            if (!time) {
                showError('Please select a pickup/dine-in time.');
                timeInput.focus();
                return;
            }
            if (!payment) {
                showError('Please choose a payment method.');
                paymentSelect.focus();
                return;
            }
            const orderNumber = 'DEL-' + Math.floor(100000 + Math.random() * 900000);
            document.getElementById('confirm-name').textContent = name;
            document.getElementById('confirm-number').textContent = orderNumber;
            document.getElementById('confirm-type').textContent = document.querySelector('input[name="order_type"]:checked').value;
            document.getElementById('confirm-time').textContent = time;
            document.getElementById('confirm-payment').textContent = payment === 'cash' ? 'Cash at the cafe' : 'Card at the cafe';
        
            const confirmItemsList = document.getElementById('confirm-items');
            confirmItemsList.innerHTML = '';
            let finalSum = 0;
            cart.forEach(item => {
                const li = document.createElement('li');
                li.className = 'd-flex justify-content-between py-1';
                li.textContent = `${item.name} × ${item.quantity}`;
                const span = document.createElement('span');
                span.textContent = (item.price * item.quantity).toLocaleString() + ' ₸';
                li.appendChild(span);
                confirmItemsList.appendChild(li);
                finalSum += item.price * item.quantity;
            });
            document.getElementById('confirm-total').textContent = finalSum.toLocaleString() + ' ₸';
            checkoutSection.classList.add('hidden');
            if (cartContentEl) cartContentEl.classList.add('hidden');
            orderConfirmation.classList.remove('hidden');
            cart = [];
            localStorage.removeItem('delishCart');
            notifyCartChanged();
        });
    }
    /* ---------- phone mask: "+7" is fixed, max 11 digits in total ---------- */

    function formatPhone(n) {
        let out = '+7';
        if (n.length > 0) out += ' (' + n.slice(0, 3);
        if (n.length >= 3) out += ')';
        if (n.length > 3) out += ' ' + n.slice(3, 6);
        if (n.length > 6) out += '-' + n.slice(6, 8);
        if (n.length > 8) out += '-' + n.slice(8, 10);
        return out;
    }

    // Returns the 10 national digits (without the country code 7/8)
    function parseNational(value) {
        const d = value.replace(/\D/g, '');
        if (value.startsWith('+7')) return d.slice(1, 11);
        if (d.length >= 11 && /^[78]/.test(d)) return d.slice(1, 11);
        return d.slice(0, 10);
    }

    function setupPhoneMask(input) {
        input.inputMode = 'tel';
        let prev = '';
        const apply = (n) => {
            prev = n;
            input.value = formatPhone(n);
            try { input.setSelectionRange(input.value.length, input.value.length); } catch (e) { }
        };
        input.addEventListener('input', (e) => {
            let n = parseNational(input.value);
            // Backspace over a formatting symbol "(", ")", " " or "-" removes the previous digit
            if (e.inputType === 'deleteContentBackward' && n === prev && prev.length > 0) {
                n = n.slice(0, -1);
            }
            apply(n);
        });
        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = (e.clipboardData || window.clipboardData).getData('text');
            let d = text.replace(/\D/g, '');
            if (d.length >= 11 && /^[78]/.test(d)) d = d.slice(1);
            apply(d.slice(0, 10));
            input.dispatchEvent(new Event('input', { bubbles: true }));
        });
        input.addEventListener('focus', () => {
            setTimeout(() => {
                try { input.setSelectionRange(input.value.length, input.value.length); } catch (e) { }
            }, 0);
        });
        apply('');
        return { reset: () => apply('') };
    }

    function showError(message) {
        if (orderErrorEl) {
            orderErrorEl.textContent = message;
            orderErrorEl.classList.remove('hidden');
        }
    }
    const orderPhoneEl = document.getElementById('order-phone');
    if (orderPhoneEl) setupPhoneMask(orderPhoneEl);
    renderCart();
});