'use strict';

document.addEventListener('DOMContentLoaded', () => {
    let cart = JSON.parse(localStorage.getItem('delishCart')) || [];
    const dishCards = document.querySelectorAll('.dish-card');
    dishCards.forEach((card, index) => {
        const titleEl = card.querySelector('h3');
        const priceEl = card.querySelector('.fw-bold span') || card.querySelector('.fw-bold');
        const qtyInput = card.querySelector('input[type="number"]');
        const addBtn = card.querySelector('button');
        if (!titleEl || !addBtn) return;
        addBtn.addEventListener('click', () => {
            const name = titleEl.textContent.trim();
            const price = parseInt(priceEl.textContent.replace(/[^0-9]/g, ''), 10) || 0;
            const quantity = qtyInput ? parseInt(qtyInput.value, 10) || 1 : 1;
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
            localStorage.setItem('delishCart', JSON.stringify(cart));
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
    const menuSections = Array.from(document.querySelectorAll('main section'));
    if (menuSections.length > 0) {
        const panel = document.createElement('div');
        panel.className = 'menu-filters bg-white rounded-4 shadow-sm p-3 p-md-4 mb-5';
        const row = document.createElement('div');
        row.className = 'row g-3 align-items-center';
        const searchCol = document.createElement('div');
        searchCol.className = 'col-12 col-lg-4';
        const searchLabel = document.createElement('label');
        searchLabel.htmlFor = 'menu-search';
        searchLabel.className = 'visually-hidden';
        searchLabel.textContent = 'Search dishes';
        const searchInput = document.createElement('input');
        searchInput.type = 'search';
        searchInput.id = 'menu-search';
        searchInput.className = 'form-control rounded-pill px-4';
        searchInput.placeholder = 'Search dishes...';
        searchInput.autocomplete = 'off';
        searchCol.append(searchLabel, searchInput);
        const buttonsCol = document.createElement('div');
        buttonsCol.className = 'col-12 col-lg-8';
        const buttonsGroup = document.createElement('div');
        buttonsGroup.className = 'd-flex flex-wrap gap-2 justify-content-lg-end';
        buttonsGroup.setAttribute('role', 'group');
        buttonsGroup.setAttribute('aria-label', 'Menu categories');
        buttonsCol.appendChild(buttonsGroup);
        row.append(searchCol, buttonsCol);
        panel.appendChild(row);
        const noResultsEl = document.createElement('p');
        noResultsEl.className = 'text-center text-secondary fs-5 my-5 d-none';
        noResultsEl.setAttribute('aria-live', 'polite');
        noResultsEl.textContent = 'No dishes found. Try another search or category.';
        menuSections[0].before(panel, noResultsEl);
        let activeSection = null; 
        const filterButtons = [];
        function applyFilters() {
            const query = searchInput.value.trim().toLowerCase();
            let totalVisible = 0;
            menuSections.forEach(section => {
                const categoryMatch = activeSection === null || section === activeSection;
                let visibleInSection = 0;
                section.querySelectorAll('.dish-card').forEach(card => {
                    const column = card.parentElement;
                    const show = categoryMatch &&
                        (query === '' || card.textContent.toLowerCase().includes(query));
                    column.classList.toggle('d-none', !show);
                    if (show) visibleInSection++;
                });
                section.classList.toggle('d-none', visibleInSection === 0);
                totalVisible += visibleInSection;
            });
            noResultsEl.classList.toggle('d-none', totalVisible > 0);
        }
        function addFilterButton(label, section) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = label;
            filterButtons.push(btn);
            btn.addEventListener('click', () => {
                activeSection = section;
                filterButtons.forEach(b => setButtonState(b, b === btn));
                applyFilters();
            });
            setButtonState(btn, section === null);
            buttonsGroup.appendChild(btn);
        }
        function setButtonState(btn, isActive) {
            btn.className = 'btn rounded-pill px-3 fw-semibold ' +
                (isActive ? 'btn-custom-cart' : 'btn-outline-secondary');
            btn.setAttribute('aria-pressed', String(isActive));
        }
        addFilterButton('All', null);
        menuSections.forEach(section => {
            const heading = section.querySelector('h2');
            addFilterButton(heading ? heading.textContent.trim() : 'Other', section);
        });
        searchInput.addEventListener('input', applyFilters);
    }
});