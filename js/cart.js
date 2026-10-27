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
    let cart = JSON.parse(localStorage.getItem('delishCart')) || [];
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
                if (newQty > 0) {
                    cart[index].quantity = newQty;
                } else {
                    cart.splice(index, 1);
                }
                localStorage.setItem('delishCart', JSON.stringify(cart));
                renderCart();
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
            const phoneRegex = /^\+?[0-9\s\-\(\)]{10,20}$/;
            if (!phoneRegex.test(phone)) {
                showError('Please enter a valid phone number (e.g. +7 700 000 00 00).');
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
        });
    }
    function showError(message) {
        if (orderErrorEl) {
            orderErrorEl.textContent = message;
            orderErrorEl.classList.remove('hidden');
        }
    }
    renderCart();
});