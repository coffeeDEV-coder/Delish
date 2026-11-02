'use strict';

// Весь код обёрнут в $(function () {...}) - это сокращение от $(document).ready():
// код выполнится, когда DOM готов (замена document.addEventListener('DOMContentLoaded', ...)).
$(function () {
    const CART_KEY = 'delishCart';
    const $cartEmpty = $('#cart-empty');
    const $cartContent = $('#cart-content');
    const $checkout = $('#checkout-section');
    const $cartItems = $('#cart-items');
    const $itemCount = $('#cart-item-count');
    const $cartTotal = $('#cart-total');
    const $orderError = $('#order-error');
    const $confirmation = $('#order-confirmation');

    let cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];

    function saveCart() {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
    }

    function formatPrice(value) {
        return value.toLocaleString() + ' ₸';
    }

    // ФУНКЦИЯ 1 (renderCart).
    // jQuery заменил: getElementById/classList -> $('#id').addClass()/removeClass(),
    // createElement + appendChild + textContent -> $('<tr>').append($('<td>').text()),
    // addEventListener на каждую кнопку -> два делегированных обработчика ниже.
    // Стало короче и нагляднее: нет ручных createElement и повторяющихся appendChild.
    function renderCart() {
        $cartItems.empty();

        if (cart.length === 0) {
            $cartEmpty.removeClass('hidden');
            $cartContent.add($checkout).addClass('hidden');
            return;
        }

        $cartEmpty.addClass('hidden');
        $cartContent.add($checkout).removeClass('hidden');

        let totalQuantity = 0;
        let totalPrice = 0;

        // Строки таблицы создаются из массива cart - в HTML их нет.
        $.each(cart, function (index, item) {
            const subtotal = item.price * item.quantity;
            totalQuantity += item.quantity;
            totalPrice += subtotal;

            $('<tr>')
                .attr('data-index', index)
                .append(
                    $('<td>').text(item.name),
                    $('<td>').text(formatPrice(item.price)),
                    $('<td>').append(
                        $('<input>', {
                            type: 'number',
                            min: 1,
                            max: 20,
                            value: item.quantity,
                            'class': 'form-control form-control-sm text-center qty-input'
                        })
                    ),
                    $('<td>', { 'class': 'fw-semibold' }).text(formatPrice(subtotal)),
                    $('<td>').append(
                        $('<button>', {
                            type: 'button',
                            'class': 'btn btn-outline-danger btn-sm rounded-pill px-3 remove-btn',
                            text: 'Remove'
                        })
                    )
                )
                .appendTo($cartItems);
        });

        $itemCount.text(totalQuantity);
        $cartTotal.text(formatPrice(totalPrice));
    }

    // ДЕЛЕГИРОВАНИЕ: обработчик повешен на #cart-items, который существует всегда.
    // Строки и кнопки создаются в renderCart() уже ПОСЛЕ загрузки страницы.
    // Прямая привязка $('.qty-input').on(...) не сработала бы: в момент вызова
    // этих элементов ещё нет в DOM, и jQuery не нашёл бы, к чему привязаться.
    $cartItems.on('change', '.qty-input', function () {
        const index = $(this).closest('tr').data('index');
        const newQty = parseInt($(this).val(), 10);

        if (newQty > 0) {
            cart[index].quantity = newQty;
        } else {
            cart.splice(index, 1);
        }
        saveCart();
        renderCart();
    });

    $cartItems.on('click', '.remove-btn', function () {
        const index = $(this).closest('tr').data('index');
        cart.splice(index, 1);
        saveCart();
        renderCart();
    });

    $('#clear-cart-btn').on('click', function () {
        cart = [];
        localStorage.removeItem(CART_KEY);
        renderCart();
    });

    // Сообщение об ошибке появляется плавно (эффект fadeIn).
    function showError(message) {
        $orderError
            .text(message)
            .removeClass('hidden') // снимаем CSS-класс hidden
            .stop(true, true)      // сбрасываем незавершённую анимацию
            .hide()                // прячем инлайн-стилем, чтобы fadeIn было что показывать
            .fadeIn(200);
    }

    function clearError() {
        $orderError.stop(true, true).hide().text('');
    }

    $('#checkout-form').on('submit', function (event) {
        // preventDefault: без него браузер отправит форму (POST на cart.html)
        // и перезагрузит страницу, и мы не увидим подтверждение заказа,
        // а корзина (в памяти скрипта) была бы потеряна.
        event.preventDefault();
        clearError();

        const name = $.trim($('#order-name').val());
        const phone = $.trim($('#order-phone').val());
        const time = $.trim($('#order-time').val());
        const payment = $('#order-payment').val();

        if (name.length < 2) {
            showError('Please enter a valid name (at least 2 characters).');
            $('#order-name').trigger('focus');
            return;
        }
        if (!/^\+?[0-9\s\-\(\)]{10,20}$/.test(phone)) {
            showError('Please enter a valid phone number (e.g. +7 700 000 00 00).');
            $('#order-phone').trigger('focus');
            return;
        }
        if (!time) {
            showError('Please select a pickup/dine-in time.');
            $('#order-time').trigger('focus');
            return;
        }
        if (!payment) {
            showError('Please choose a payment method.');
            $('#order-payment').trigger('focus');
            return;
        }

        const orderNumber = 'DEL-' + Math.floor(100000 + Math.random() * 900000);
        let finalSum = 0;

        $('#confirm-name').text(name);
        $('#confirm-number').text(orderNumber);
        // Селектор по атрибуту + фильтр :checked
        $('#confirm-type').text($('input[name="order_type"]:checked').val());
        $('#confirm-time').text(time);
        $('#confirm-payment').text(payment === 'cash' ? 'Cash at the cafe' : 'Card at the cafe');

        const $confirmItems = $('#confirm-items').empty();
        $.each(cart, function (i, item) {
            const lineTotal = item.price * item.quantity;
            finalSum += lineTotal;
            $('<li>', { 'class': 'd-flex justify-content-between py-1' })
                .text(item.name + ' × ' + item.quantity)
                .append($('<span>').text(formatPrice(lineTotal)))
                .appendTo($confirmItems);
        });
        $('#confirm-total').text(formatPrice(finalSum));

        $checkout.add($cartContent).addClass('hidden');

        // Эффект с длительностью 400 мс и callback: после появления плавно
        // прокручиваем страницу к подтверждению (animate).
        $confirmation
            .removeClass('hidden')
            .hide()
            .fadeIn(400, function () {
                $('html, body').animate({ scrollTop: $(this).offset().top - 80 }, 300);
            });

        cart = [];
        localStorage.removeItem(CART_KEY);
    });

    renderCart();
});