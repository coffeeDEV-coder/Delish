'use strict';

document.addEventListener('DOMContentLoaded', () => {
    let cart = JSON.parse(localStorage.getItem('delishCart')) || [];

    // Находим все карточки блюд на странице меню
    const dishCards = document.querySelectorAll('.dish-card');

    dishCards.forEach((card, index) => {
        const titleEl = card.querySelector('h3');
        const priceEl = card.querySelector('.fw-bold span') || card.querySelector('.fw-bold');
        const qtyInput = card.querySelector('input[type="number"]');
        const addBtn = card.querySelector('button');

        if (!titleEl || !addBtn) return;

        addBtn.addEventListener('click', () => {
            const name = titleEl.textContent.trim();
            // Очищаем цену от текста и символов тенге (например, "3,990 ₸" -> 3990)
            const price = parseInt(priceEl.textContent.replace(/[^0-9]/g, ''), 10) || 0;
            const quantity = qtyInput ? parseInt(qtyInput.value, 10) || 1 : 1;

            // Проверяем, есть ли уже товар в корзине
            const existingItem = cart.find(item => item.name === name);
            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                cart.push({
                    id: 'dish-' + index,
                    name: name,
                    price: price,
                    quantity: quantity
                });
            }

            // Сохраняем в localStorage
            localStorage.setItem('delishCart', JSON.stringify(cart));

            // Анимация кнопки (успех)
            const oldText = addBtn.textContent;
            addBtn.textContent = 'Added ✓';
            addBtn.classList.add('btn-success');
            addBtn.classList.remove('btn-custom-cart');

            setTimeout(() => {
                addBtn.textContent = oldText;
                addBtn.classList.remove('btn-success');
                addBtn.classList.add('btn-custom-cart');
            }, 1200);
        });
    });
});