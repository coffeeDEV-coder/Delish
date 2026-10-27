'use strict';
document.addEventListener('DOMContentLoaded', () => {
    const STORAGE_KEY = 'delishReviews';
    const MAX_REVIEW_LENGTH = 500;
    const MIN_REVIEW_LENGTH = 10;
    const form = document.querySelector('.review form');
    const reviewsList = document.querySelector('.recent-reviews .d-flex');
    if (!form || !reviewsList) return;
    const nameInput = document.getElementById('guest_name');
    const phoneInput = document.getElementById('guest_phone');
    const dateInput = document.getElementById('visit_date');
    const ratingSelect = document.getElementById('rating');
    const textInput = document.getElementById('review_text');
    const recommendLabels = { yes: 'Yes', maybe: 'Maybe', no: 'No' };
    function loadReviews() {
        try {
            const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
            return Array.isArray(data) ? data : [];
        } catch (e) {
            return [];
        }
    }
    function saveReviews() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
        } catch (e) {
        }
    }
    let reviews = loadReviews();
    const now = new Date();
    dateInput.max = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 10);
    textInput.maxLength = MAX_REVIEW_LENGTH;
    const counterEl = document.createElement('div');
    counterEl.className = 'form-text text-end';
    textInput.insertAdjacentElement('afterend', counterEl);
    function updateCounter() {
        counterEl.textContent = `${textInput.value.length} / ${MAX_REVIEW_LENGTH}`;
    }
    textInput.addEventListener('input', updateCounter);
    updateCounter();
    const messageWrap = document.createElement('div');
    messageWrap.className = 'col-12 d-none';
    const messageEl = document.createElement('div');
    messageEl.setAttribute('role', 'alert');
    messageWrap.appendChild(messageEl);
    const buttonsRow = form.querySelector('button[type="submit"]').parentElement;
    buttonsRow.before(messageWrap);
    let messageTimer = null;
    function showMessage(text, type) {
        clearTimeout(messageTimer);
        messageEl.className = `alert alert-${type} mb-0`;
        messageEl.textContent = text;
        messageWrap.classList.remove('d-none');
        if (type === 'success') {
            messageTimer = setTimeout(hideMessage, 4000);
        }
    }
    function hideMessage() {
        messageWrap.classList.add('d-none');
        messageEl.textContent = '';
    }
    function formatDate(isoDate) {
        const d = new Date(isoDate + 'T00:00:00');
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    function createReviewCard(review) {
        const article = document.createElement('article');
        article.className = 'card border-0 shadow-sm rounded-4 p-4 bg-white border-start border-4 border-custom-accent';
        const title = document.createElement('h3');
        title.className = 'h5 fw-bold text-dark mb-1';
        title.textContent = review.name;
        const text = document.createElement('p');
        text.className = 'text-secondary mb-2';
        text.textContent = review.text;
        const ratingP = document.createElement('p');
        ratingP.className = 'mb-2';
        const strong = document.createElement('strong');
        strong.textContent = 'Rating: ';
        const stars = document.createElement('span');
        stars.className = 'text-warning';
        stars.textContent = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
        ratingP.append(strong, stars, ` ${review.rating}/5`);
        const meta = document.createElement('small');
        meta.className = 'text-muted';
        meta.textContent = `Visited ${formatDate(review.date)} · Would recommend: ${recommendLabels[review.recommend] || '—'}`;
        article.append(title, text, ratingP, meta);
        return article;
    }
    reviews.forEach(review => reviewsList.prepend(createReviewCard(review)));
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        hideMessage();
        const name = nameInput.value.trim();
        const phone = phoneInput.value.trim();
        const text = textInput.value.trim();
        const rating = parseInt(ratingSelect.value, 10);
        if (name.length < 2) {
            showMessage('Please enter your name (at least 2 characters).', 'danger');
            nameInput.focus();
            return;
        }
        const phoneRegex = /^\+?[0-9\s\-\(\)]{10,20}$/;
        if (!phoneRegex.test(phone)) {
            showMessage('Please enter a valid phone number (e.g. +7 700 000 00 00).', 'danger');
            phoneInput.focus();
            return;
        }
        if (!rating) {
            showMessage('Please choose a rating.', 'danger');
            ratingSelect.focus();
            return;
        }
        if (text.length < MIN_REVIEW_LENGTH) {
            showMessage(`Your review is too short (at least ${MIN_REVIEW_LENGTH} characters).`, 'danger');
            textInput.focus();
            return;
        }
        const review = {
            name: name,
            rating: rating,
            text: text,
            date: dateInput.value,
            recommend: form.querySelector('input[name="recommend"]:checked').value
        };
        reviews.push(review);
        saveReviews();
        const card = createReviewCard(review);
        reviewsList.prepend(card);
        form.reset();
        updateCounter();
        showMessage('Thank you! Your review has been added below.', 'success');
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    form.addEventListener('reset', () => {
        hideMessage();
        setTimeout(updateCounter, 0);
    });
});