'use strict';

$(function () {
    const STORAGE_KEY = 'delishReviews';
    const MAX_REVIEW_LENGTH = 500;
    const MIN_REVIEW_LENGTH = 10;
    const PHONE_REGEX = /^\+?[0-9\s\-\(\)]{10,20}$/;
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const recommendLabels = { yes: 'Yes', maybe: 'Maybe', no: 'No' };

    const $form = $('.review form');
    const $reviewsList = $('.recent-reviews > .d-flex');
    if (!$form.length || !$reviewsList.length) return;

    const $date = $('#visit_date');
    const $text = $('#review_text');

    function loadReviews() {
        try {
            const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
            return Array.isArray(data) ? data : [];
        } catch (e) {
            return [];
        }
    }

    let reviews = loadReviews();

    function saveReviews() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
        } catch (e) {
        }
    }
    const now = new Date();
    const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 10);
    $date.attr('max', today);
    $text.prop('maxLength', MAX_REVIEW_LENGTH);
    const $counter = $('<div>', { 'class': 'form-text text-end' }).insertAfter($text);

    function updateCounter() {
        $counter.text($text.val().length + ' / ' + MAX_REVIEW_LENGTH);
    }
    $text.on('input', updateCounter);
    updateCounter();
    const $messageWrap = $('<div>', { 'class': 'col-12 d-none' });
    const $message = $('<div>', { role: 'alert', 'class': 'alert alert-success mb-0' }).appendTo($messageWrap);
    $form.find('button[type="submit"]').parent().before($messageWrap);

    function showSuccess(text) {
        $messageWrap
            .stop(true, true)         
            .removeClass('d-none')      
            .hide()                    
            .fadeIn(200)                
            .delay(4000)               
            .fadeOut(300);            
        $message.text(text);
    }

    function hideMessage() {
        $messageWrap.stop(true, true).hide();
        $message.text('');
    }
    const validators = {
        guest_name: function (v) {
            return v.length >= 2 ? '' : 'Please enter your name (at least 2 characters).';
        },
        guest_email: function (v) {
            return EMAIL_REGEX.test(v) ? '' : 'Please enter a valid email (e.g. name@example.com).';
        },
        guest_phone: function (v) {
            return PHONE_REGEX.test(v) ? '' : 'Please enter a valid phone number (e.g. +7 700 000 00 00).';
        },
        visit_date: function (v) {
            if (!v) return 'Please choose the date of your visit.';
            return v > today ? 'The visit date cannot be in the future.' : '';
        },
        rating: function (v) {
            return v ? '' : 'Please choose a rating.';
        },
        review_text: function (v) {
            return v.length >= MIN_REVIEW_LENGTH
                ? ''
                : 'Your review is too short (at least ' + MIN_REVIEW_LENGTH + ' characters).';
        }
    };
    const fieldSelector = Object.keys(validators)
        .map(function (id) { return '#' + id; })
        .join(', ');
    function validateField($field) {
        const validate = validators[$field.attr('id')];
        if (!validate) return true;
        const error = validate($.trim($field.val()));
        let $feedback = $field.siblings('.invalid-feedback');
        if (!$feedback.length) {
            $feedback = $('<div>', { 'class': 'invalid-feedback' }).insertAfter($field);
        }
        $field.toggleClass('is-invalid', error !== '');
        $feedback.text(error);
        return error === '';
    }
    $form.on('input change', 'input, select, textarea', function () {
        if ($(this).hasClass('is-invalid')) {
            validateField($(this));
        }
    });
    function createReviewCard(review) {
        const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
        const recommend = recommendLabels[review.recommend] || '—';
        return $('<article>', {
            'class': 'card border-0 shadow-sm rounded-4 p-4 bg-white border-start border-4 border-custom-accent'
        }).append(
            $('<h3>', { 'class': 'h5 fw-bold text-dark mb-1' }).text(review.name),
            $('<p>', { 'class': 'text-secondary mb-2' }).text(review.text),
            $('<p>', { 'class': 'mb-2' }).append(
                $('<strong>').text('Rating: '),
                $('<span>', { 'class': 'text-warning' }).text(stars),
                $('<span>').text(' ' + review.rating + '/5')
            ),
            $('<small>', { 'class': 'text-muted' }).text(
                'Visited ' + formatDate(review.date) + ' · Would recommend: ' + recommend
            )
        );
    }
    function formatDate(isoDate) {
        const d = new Date(isoDate + 'T00:00:00');
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    $.each(reviews, function (i, review) {
        $reviewsList.prepend(createReviewCard(review));
    });

    $form.on('submit', function (event) {
        event.preventDefault();
        hideMessage();
        let $firstInvalid = null;
        $form.find(fieldSelector).each(function () {
            if (!validateField($(this)) && !$firstInvalid) {
                $firstInvalid = $(this);
            }
        });
        if ($firstInvalid) {
            $firstInvalid.trigger('focus');
            return;
        }
        const review = {
            name: $.trim($('#guest_name').val()),
            rating: parseInt($('#rating').val(), 10),
            text: $.trim($text.val()),
            date: $date.val(),
            recommend: $form.find('input[name="recommend"]:checked').val()
        };
        reviews.push(review);
        saveReviews();
        const $card = createReviewCard(review).hide();
        $reviewsList.prepend($card);
        $form.get(0).reset();
        updateCounter();
        showSuccess('Thank you! Your review has been added below.');
        $card.slideDown(400, function () {
            $('html, body').animate({ scrollTop: $(this).offset().top - 100 }, 400);
        });
    });
    $form.on('reset', function () {
        hideMessage();
        $form.find('.is-invalid').removeClass('is-invalid');
        setTimeout(updateCounter, 0); 
    });
});