'use strict';
$(function () {
    const CART_KEY = 'delishCart';
    $('.dish-card').each(function (index) {
        const $card = $(this);
        const $title = $card.find('h3').first();
        const $price = $card.find('.fw-bold span, .fw-bold').first();
        const $qty = $card.find('input[type="number"]').first();
        const $addBtn = $card.find('button').first();
        if (!$title.length || !$addBtn.length) return;
        $addBtn.on('click', function () {
            const $btn = $(this);
            const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
            const name = $.trim($title.text());
            const price = parseInt($price.text().replace(/[^0-9]/g, ''), 10) || 0;
            const quantity = $qty.length ? parseInt($qty.val(), 10) || 1 : 1;
            const existing = cart.filter(function (item) { return item.name === name; })[0];
            if (existing) {
                existing.quantity += quantity;
            } else {
                cart.push({ id: 'dish-' + index, name: name, price: price, quantity: quantity });
            }
            localStorage.setItem(CART_KEY, JSON.stringify(cart));
            const oldText = $btn.text();
            $btn.text('Added ✓').addClass('btn-success').removeClass('btn-custom-cart');
            setTimeout(function () {
                $btn.text(oldText).removeClass('btn-success').addClass('btn-custom-cart');
            }, 1200);
        });
    });
    const $sections = $('main section');
    if ($sections.length === 0) return;
    const $searchInput = $('<input>', {
        type: 'search',
        id: 'menu-search',
        'class': 'form-control rounded-pill px-4',
        placeholder: 'Search dishes...',
        autocomplete: 'off'
    });
    const $buttonsGroup = $('<div>', {
        'class': 'd-flex flex-wrap gap-2 justify-content-lg-end',
        role: 'group',
        'aria-label': 'Menu categories'
    });
    const $panel = $('<div>', { 'class': 'menu-filters bg-white rounded-4 shadow-sm p-3 p-md-4 mb-5' }).append(
        $('<div>', { 'class': 'row g-3 align-items-center' }).append(
            $('<div>', { 'class': 'col-12 col-lg-4' }).append(
                $('<label>', { 'for': 'menu-search', 'class': 'visually-hidden', text: 'Search dishes' }),
                $searchInput
            ),
            $('<div>', { 'class': 'col-12 col-lg-8' }).append($buttonsGroup)
        )
    );
    const $noResults = $('<p>', {
        'class': 'text-center text-secondary fs-5 my-5 d-none',
        'aria-live': 'polite',
        text: 'No dishes found. Try another search or category.'
    });
    $sections.first().before($panel, $noResults);
    let $activeSection = null; 
    function applyFilters() {
        const query = $.trim($searchInput.val()).toLowerCase();
        let totalVisible = 0;
        $sections.each(function () {
            const $section = $(this);
            const categoryMatch = $activeSection === null || $section.is($activeSection);
            let visibleInSection = 0;

            $section.find('.dish-card').each(function () {
                const $card = $(this);
                const show = categoryMatch &&
                    (query === '' || $card.text().toLowerCase().indexOf(query) !== -1);

                $card.parent().toggleClass('d-none', !show);
                if (show) visibleInSection++;
            });

            $section.toggleClass('d-none', visibleInSection === 0);
            totalVisible += visibleInSection;
        });
        if (totalVisible === 0) {
            if ($noResults.hasClass('d-none')) {
                $noResults.removeClass('d-none').hide().fadeIn(200);
            }
        } else {
            $noResults.stop(true, true).addClass('d-none');
        }
    }
    function setButtonState($btn, isActive) {
        $btn
            .toggleClass('btn-custom-cart', isActive)
            .toggleClass('btn-outline-secondary', !isActive)
            .attr('aria-pressed', String(isActive));
    }
    function addFilterButton(label, $section) {
        $('<button>', {
            type: 'button',
            'class': 'btn rounded-pill px-3 fw-semibold',
            text: label
        })
            .each(function () { setButtonState($(this), $section === null); })
            .appendTo($buttonsGroup);
    }
    addFilterButton('All', null);
    $sections.each(function () {
        const $heading = $(this).find('h2').first();
        addFilterButton($heading.length ? $.trim($heading.text()) : 'Other', $(this));
    });
    $buttonsGroup.on('click', 'button', function () {
        const $btn = $(this);
        const idx = $btn.index();
        $activeSection = idx === 0 ? null : $sections.eq(idx - 1);

        setButtonState($btn.siblings(), false);
        setButtonState($btn, true);
        applyFilters();
    });
    $searchInput.on('input', applyFilters);
});