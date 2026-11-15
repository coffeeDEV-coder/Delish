'use strict';
document.addEventListener('DOMContentLoaded', () => {
    const STORAGE_KEY = 'delishReviews';
    const MAX_REVIEW_LENGTH = 500;
    const MIN_REVIEW_LENGTH = 10;
    const MAX_PARTY_SIZE = 20;
    const MAX_VISIT_AGE_DAYS = 365;
    const SUBMIT_COOLDOWN_MS = 10000;

    const form = document.querySelector('.review form');
    const reviewsList = document.querySelector('.recent-reviews .d-flex');
    if (!form || !reviewsList) return;

    // Our own validation with inline messages instead of the browser's tooltips
    form.noValidate = true;

    const nameInput = document.getElementById('guest_name');
    const emailInput = document.getElementById('guest_email');
    const phoneInput = document.getElementById('guest_phone');
    const dateInput = document.getElementById('visit_date');
    const partyInput = document.getElementById('party_size');
    const ratingSelect = document.getElementById('rating');
    const textInput = document.getElementById('review_text');
    const recommendLabels = { yes: 'Yes', maybe: 'Maybe', no: 'No' };
    const fields = [nameInput, emailInput, phoneInput, dateInput, partyInput, ratingSelect, textInput];

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

    /* ---------- date limits ---------- */

    function toLocalISO(date) {
        return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    }
    const now = new Date();
    const oldest = new Date(now.getTime() - MAX_VISIT_AGE_DAYS * 24 * 3600 * 1000);
    dateInput.max = toLocalISO(now);
    dateInput.min = toLocalISO(oldest);

    textInput.maxLength = MAX_REVIEW_LENGTH;

    /* ---------- counter and messages ---------- */

    const counterEl = document.createElement('div');
    counterEl.className = 'form-text text-end';
    textInput.insertAdjacentElement('afterend', counterEl);
    function updateCounter() {
        counterEl.textContent = `${textInput.value.length} / ${MAX_REVIEW_LENGTH}`;
    }
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

    /* ---------- inline field state ---------- */

    function getFeedbackEl(input) {
        let fb = input.parentElement.querySelector(':scope > .invalid-feedback');
        if (!fb) {
            fb = document.createElement('div');
            fb.className = 'invalid-feedback';
            input.insertAdjacentElement('afterend', fb);
        }
        return fb;
    }
    function setError(input, message) {
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');
        getFeedbackEl(input).textContent = message;
        return false;
    }
    function setValid(input) {
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
        const fb = input.parentElement.querySelector(':scope > .invalid-feedback');
        if (fb) fb.remove();
        return true;
    }
    function clearState(input) {
        input.classList.remove('is-invalid', 'is-valid');
        const fb = input.parentElement.querySelector(':scope > .invalid-feedback');
        if (fb) fb.remove();
    }

    /* ---------- validators (return '' when OK) ---------- */

    function checkName(v) {
        if (!v) return 'Please enter your name.';
        if (v.length < 2) return 'Name must be at least 2 characters.';
        if (v.length > 50) return 'Name is too long (max 50 characters).';
        if (!/^\p{L}+(?:[ '\u2019.\-]\p{L}+)*\.?$/u.test(v)) {
            return 'Name may contain only letters, spaces, hyphens and apostrophes.';
        }
        return '';
    }

    function checkEmail(v) {
        if (!v) return 'Email is required.';
        if (v.length > 254) return 'Email is too long (max 254 characters).';
        if (/\s/.test(v)) return 'Email must not contain spaces.';
        const atCount = v.split('@').length - 1;
        if (atCount === 0) return 'Email must contain the @ sign, e.g. name@example.com.';
        if (atCount > 1) return 'Email must contain only one @ sign.';
        const [local, domain] = v.split('@');
        if (!local) return 'Enter the part of the email before @.';
        if (local.length > 64) return 'The part before @ is too long (max 64 characters).';
        if (!/^[A-Za-z0-9._%+\-]+$/.test(local)) return 'Before @ use only Latin letters, digits and . _ % + -';
        if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) {
            return 'The part before @ must not start or end with a dot or contain two dots in a row.';
        }
        if (!domain) return 'Enter the domain after @, e.g. gmail.com.';
        if (!domain.includes('.')) return 'The domain must contain a dot, e.g. example.com.';
        const labels = domain.split('.');
        for (const label of labels) {
            if (!label) return 'The domain must not start or end with a dot or contain two dots in a row.';
            if (!/^[A-Za-z0-9]([A-Za-z0-9\-]*[A-Za-z0-9])?$/.test(label)) return 'The domain contains invalid characters.';
        }
        if (!/^[A-Za-z]{2,}$/.test(labels[labels.length - 1])) {
            return 'The domain must end with a valid extension, e.g. .com or .kz.';
        }
        return '';
    }

    function checkPhone(v) {
        if (!v) return 'Phone number is required.';
        if (!/^\+?[0-9\s\-()]+$/.test(v)) return 'Phone may contain only digits, spaces, + - ( ).';
        if (v.indexOf('+') > 0) return 'The + sign is allowed only at the beginning.';
        const digits = v.replace(/\D/g, '');
        if (digits.length < 10 || digits.length > 15) return 'Phone must contain 10-15 digits (e.g. +7 700 000 00 00).';
        if (/^(\+7|7|8)/.test(v.replace(/[\s\-()]/g, '')) && digits.length !== 11) {
            return 'A Kazakhstan/Russia number must have 11 digits, e.g. +7 700 000 00 00.';
        }
        if (/^(\d)\1+$/.test(digits)) return 'Please enter a real phone number.';
        return '';
    }

    function checkDate(v) {
        if (!v) return 'Please choose the date of your visit.';
        const d = new Date(v + 'T00:00:00');
        if (isNaN(d)) return 'Please enter a valid date.';
        if (v > dateInput.max) return 'The visit date cannot be in the future.';
        if (v < dateInput.min) return 'We accept reviews of visits from the last 12 months only.';
        return '';
    }

    function checkParty(v) {
        if (v === '') return 'Please enter the number of guests.';
        if (!/^\d+$/.test(v)) return 'Number of guests must be a whole number.';
        const n = parseInt(v, 10);
        if (n < 1 || n > MAX_PARTY_SIZE) return `Number of guests must be between 1 and ${MAX_PARTY_SIZE}.`;
        return '';
    }

    function checkRating(v) {
        const n = parseInt(v, 10);
        if (!n || n < 1 || n > 5) return 'Please choose a rating.';
        return '';
    }

    function checkText(v) {
        if (!v) return 'Please write your review.';
        if (v.length < MIN_REVIEW_LENGTH) return `Your review is too short (at least ${MIN_REVIEW_LENGTH} characters).`;
        if (v.length > MAX_REVIEW_LENGTH) return `Your review is too long (max ${MAX_REVIEW_LENGTH} characters).`;
        if ((v.match(/\p{L}/gu) || []).length < 5) return 'Please describe your visit with words.';
        if (v.split(/\s+/).length < 2) return 'Please write at least two words.';
        if (/(.)\1{5,}/u.test(v)) return 'Please avoid repeating the same character many times.';
        if (/https?:\/\/|www\.|[a-z0-9-]+\.(com|ru|kz|net|org|io)\b/i.test(v)) return 'Links are not allowed in reviews.';
        const lower = v.toLowerCase();
        if (reviews.some(r => r.text.trim().toLowerCase() === lower)) return 'An identical review has already been posted.';
        return '';
    }

    function normalizeSpaces(s) {
        return s.replace(/\s+/g, ' ').trim();
    }

    const validators = [
        [nameInput, () => checkName(normalizeSpaces(nameInput.value))],
        [emailInput, () => checkEmail(emailInput.value.trim())],
        [phoneInput, () => checkPhone(phoneInput.value.trim())],
        [dateInput, () => checkDate(dateInput.value)],
        [partyInput, () => checkParty(partyInput.value.trim())],
        [ratingSelect, () => checkRating(ratingSelect.value)],
        [textInput, () => checkText(textInput.value.trim())]
    ];

    function validateField(input, check) {
        const err = check();
        return err ? setError(input, err) : setValid(input);
    }

    validators.forEach(([input, check]) => {
        const evt = input.tagName === 'SELECT' || input.type === 'date' ? 'change' : 'blur';
        input.addEventListener(evt, () => validateField(input, check));
        input.addEventListener('input', () => {
            if (input.classList.contains('is-invalid') || input.classList.contains('is-valid')) {
                validateField(input, check);
            }
        });
    });
    textInput.addEventListener('input', updateCounter);

    /* ---------- rendering ---------- */

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

    /* ---------- submit ---------- */

    let lastSubmitAt = 0;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        hideMessage();

        const results = validators.map(([input, check]) => validateField(input, check));
        if (results.includes(false)) {
            showMessage('Please fix the highlighted fields.', 'danger');
            const firstInvalid = fields.find(f => f.classList.contains('is-invalid'));
            if (firstInvalid) firstInvalid.focus();
            return;
        }

        const waitMs = SUBMIT_COOLDOWN_MS - (Date.now() - lastSubmitAt);
        if (waitMs > 0) {
            showMessage(`Please wait ${Math.ceil(waitMs / 1000)} s before sending another review.`, 'warning');
            return;
        }

        const review = {
            name: normalizeSpaces(nameInput.value),
            rating: parseInt(ratingSelect.value, 10),
            text: textInput.value.trim(),
            date: dateInput.value,
            recommend: form.querySelector('input[name="recommend"]:checked').value
        };
        reviews.push(review);
        saveReviews();
        lastSubmitAt = Date.now();

        const card = createReviewCard(review);
        reviewsList.prepend(card);
        form.reset();
        updateCounter();
        showMessage('Thank you! Your review has been added below.', 'success');
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    form.addEventListener('reset', () => {
        hideMessage();
        fields.forEach(clearState);
        setTimeout(updateCounter, 0);
    });
});