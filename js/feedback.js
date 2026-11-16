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

    const phoneMask = setupPhoneMask(phoneInput);

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
        const digits = v.replace(/\D/g, ''); // includes the fixed leading 7
        if (digits.length <= 1) return 'Phone number is required.';
        if (digits.length < 11) return 'Enter all 10 digits after +7, e.g. +7 (700) 000-00-00.';
        if (/^7(\d)\1{9}$/.test(digits)) return 'Please enter a real phone number.';
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
        setTimeout(() => { updateCounter(); phoneMask.reset(); }, 0);
    });
});