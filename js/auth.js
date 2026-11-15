$(function () {
    var USERS_KEY = 'delish_users';
    var CURRENT_KEY = 'delish_currentUser';
    var ATTEMPTS_KEY = 'delish_loginAttempts';

    var PASSWORD_MIN = 12;
    var PASSWORD_MAX = 64;
    var MAX_LOGIN_ATTEMPTS = 5;
    var LOCK_SECONDS = 60;

    var USERNAME_RE = /^[A-Za-z][A-Za-z0-9_]{2,19}$/;
    var LOGIN_USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;
    var RESERVED_USERNAMES = ['admin', 'administrator', 'root', 'moderator', 'support', 'delish', 'system', 'null', 'undefined'];

    /* ---------- storage ---------- */

    function getUsers() {
        try {
            var data = JSON.parse(localStorage.getItem(USERS_KEY));
            return Array.isArray(data) ? data : [];
        } catch (e) {
            return [];
        }
    }

    function saveUsers(users) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    /* ---------- UI helpers ---------- */

    function setError($input, message) {
        $input.addClass('is-invalid').removeClass('is-valid');
        var $fb = $input.siblings('.invalid-feedback');
        if (!$fb.length) {
            $fb = $('<div class="invalid-feedback"></div>').insertAfter($input);
        }
        $fb.text(message);
        return false;
    }

    function setValid($input) {
        $input.removeClass('is-invalid').addClass('is-valid');
        $input.siblings('.invalid-feedback').remove();
        return true;
    }

    function showAlert($form, type, message) {
        $form.find('.form-alert').remove();
        $('<div class="form-alert alert alert-' + type + ' py-2" role="alert"></div>')
            .text(message)
            .prependTo($form);
    }

    /* ---------- pure validators (return '' when OK, otherwise an error message) ---------- */

    function checkEmail(v) {
        if (!v) return 'Email is required.';
        if (v.length > 254) return 'Email is too long (max 254 characters).';
        if (/\s/.test(v)) return 'Email must not contain spaces.';

        var atCount = v.split('@').length - 1;
        if (atCount === 0) return 'Email must contain the @ sign, e.g. name@example.com.';
        if (atCount > 1) return 'Email must contain only one @ sign.';

        var parts = v.split('@');
        var local = parts[0];
        var domain = parts[1];

        if (!local) return 'Enter the part of the email before @.';
        if (local.length > 64) return 'The part before @ is too long (max 64 characters).';
        if (!/^[A-Za-z0-9._%+\-]+$/.test(local)) {
            return 'Before @ use only Latin letters, digits and . _ % + -';
        }
        if (local.charAt(0) === '.' || local.charAt(local.length - 1) === '.' || local.indexOf('..') !== -1) {
            return 'The part before @ must not start or end with a dot or contain two dots in a row.';
        }

        if (!domain) return 'Enter the domain after @, e.g. gmail.com.';
        if (domain.indexOf('.') === -1) return 'The domain must contain a dot, e.g. example.com.';
        var labels = domain.split('.');
        for (var i = 0; i < labels.length; i++) {
            if (!labels[i]) return 'The domain must not start or end with a dot or contain two dots in a row.';
            if (!/^[A-Za-z0-9]([A-Za-z0-9\-]*[A-Za-z0-9])?$/.test(labels[i])) {
                return 'The domain contains invalid characters.';
            }
        }
        if (!/^[A-Za-z]{2,}$/.test(labels[labels.length - 1])) {
            return 'The domain must end with a valid extension, e.g. .com or .kz.';
        }
        return '';
    }

    function passwordChecks(v) {
        return [
            { ok: v.length >= PASSWORD_MIN, text: 'At least ' + PASSWORD_MIN + ' characters' },
            { ok: /[A-Za-z]/.test(v), text: 'A letter (A-Z, a-z)' },
            { ok: /\d/.test(v), text: 'A digit (0-9)' },
            { ok: /[^A-Za-z0-9\s]/.test(v), text: 'A symbol (e.g. ! ? # $ % & *)' }
        ];
    }

    function checkPassword(v, ctx) {
        ctx = ctx || {};
        if (!v) return 'Password is required.';
        if (/\s/.test(v)) return 'Password must not contain spaces.';
        if (!/^[\x21-\x7E]+$/.test(v)) return 'Use only Latin letters, digits and symbols.';
        if (v.length < PASSWORD_MIN) {
            return 'Password must be at least ' + PASSWORD_MIN + ' characters (now ' + v.length + ').';
        }
        if (v.length > PASSWORD_MAX) return 'Password is too long (max ' + PASSWORD_MAX + ' characters).';
        if (!/[A-Za-z]/.test(v)) return 'Password must contain at least one letter.';
        if (!/\d/.test(v)) return 'Password must contain at least one digit.';
        if (!/[^A-Za-z0-9]/.test(v)) return 'Password must contain at least one symbol, e.g. ! ? # $ % & *';
        if (/(.)\1{3,}/.test(v)) return 'Password must not repeat the same character 4+ times in a row.';

        var low = v.toLowerCase();
        if (ctx.username && ctx.username.length >= 3 && low.indexOf(ctx.username.toLowerCase()) !== -1) {
            return 'Password must not contain your username.';
        }
        if (ctx.email && ctx.email.indexOf('@') > 2) {
            var emailLocal = ctx.email.split('@')[0].toLowerCase();
            if (low.indexOf(emailLocal) !== -1) return 'Password must not contain the first part of your email.';
        }
        return '';
    }

    /* ---------- field validators (with UI) ---------- */

    function validateUsername($el) {
        var v = $.trim($el.val());
        if (!v) return setError($el, 'Username is required.');
        if (!USERNAME_RE.test(v)) {
            return setError($el, '3-20 characters: Latin letters, digits and underscore; must start with a letter.');
        }
        if (RESERVED_USERNAMES.indexOf(v.toLowerCase()) !== -1) {
            return setError($el, 'This username is reserved. Please choose another one.');
        }
        var exists = getUsers().some(function (u) {
            return u.username.toLowerCase() === v.toLowerCase();
        });
        if (exists) return setError($el, 'This username is already taken.');
        return setValid($el);
    }

    function validateEmail($el) {
        var v = $.trim($el.val());
        var err = checkEmail(v);
        if (err) return setError($el, err);
        var exists = getUsers().some(function (u) {
            return u.email === v.toLowerCase();
        });
        if (exists) return setError($el, 'An account with this email already exists.');
        return setValid($el);
    }

    function validatePassword($el, ctx) {
        var err = checkPassword($el.val(), ctx);
        if (err) return setError($el, err);
        return setValid($el);
    }

    function validateConfirm($el, $pass) {
        var v = $el.val();
        if (!v) return setError($el, 'Please confirm your password.');
        if (v !== $pass.val()) return setError($el, 'Passwords do not match.');
        return setValid($el);
    }

    /* ---------- registration ---------- */

    var $reg = $('#registerForm');
    if ($reg.length) {
        var $rUser = $('#username');
        var $rEmail = $('#email');
        var $rPass = $('#password');
        var $rConf = $('#check_password');

        // live checklist under the password field
        var $rules = $('<ul class="list-unstyled small mt-2 mb-0" id="password-rules" aria-live="polite"></ul>');
        $rPass.parent().append($rules);

        function updateRules() {
            var checks = passwordChecks($rPass.val());
            $rules.empty();
            checks.forEach(function (c) {
                $('<li></li>')
                    .addClass(c.ok ? 'text-success' : 'text-muted')
                    .text((c.ok ? '\u2713 ' : '\u25CB ') + c.text)
                    .appendTo($rules);
            });
        }
        updateRules();

        function passwordContext() {
            return { username: $.trim($rUser.val()), email: $.trim($rEmail.val()) };
        }

        function touched($el) {
            return $el.hasClass('is-invalid') || $el.hasClass('is-valid');
        }

        $rUser.on('blur', function () {
            validateUsername($rUser);
            if (touched($rPass)) validatePassword($rPass, passwordContext());
        });
        $rUser.on('input', function () {
            if (touched($rUser)) validateUsername($rUser);
        });

        $rEmail.on('blur', function () {
            validateEmail($rEmail);
            if (touched($rPass)) validatePassword($rPass, passwordContext());
        });
        $rEmail.on('input', function () {
            if (touched($rEmail)) validateEmail($rEmail);
        });

        $rPass.on('input', function () {
            updateRules();
            if (touched($rPass)) validatePassword($rPass, passwordContext());
            if ($rConf.val()) validateConfirm($rConf, $rPass);
        });
        $rPass.on('blur', function () {
            validatePassword($rPass, passwordContext());
            if ($rConf.val()) validateConfirm($rConf, $rPass);
        });

        $rConf.on('blur input', function () { validateConfirm($rConf, $rPass); });

        $reg.on('submit', function (e) {
            e.preventDefault();

            var results = [
                validateUsername($rUser),
                validateEmail($rEmail),
                validatePassword($rPass, passwordContext()),
                validateConfirm($rConf, $rPass)
            ];
            if (results.indexOf(false) !== -1) {
                showAlert($reg, 'danger', 'Please fix the errors below.');
                $reg.find('.is-invalid').first().trigger('focus');
                return;
            }

            var users = getUsers();
            users.push({
                username: $.trim($rUser.val()),
                email: $.trim($rEmail.val()).toLowerCase(),
                password: $rPass.val(),
                createdAt: new Date().toISOString()
            });
            saveUsers(users);

            showAlert($reg, 'success', 'Account created! Redirecting to login...');
            $reg.find('button[type="submit"]').prop('disabled', true);
            setTimeout(function () { window.location.href = 'login.html'; }, 1500);
        });
    }

    /* ---------- login ---------- */

    function getAttempts() {
        try {
            var a = JSON.parse(localStorage.getItem(ATTEMPTS_KEY));
            if (a && typeof a.count === 'number') return a;
        } catch (e) { /* ignore */ }
        return { count: 0, lockUntil: 0 };
    }

    function saveAttempts(a) {
        try { localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(a)); } catch (e) { /* ignore */ }
    }

    function lockSecondsLeft() {
        var a = getAttempts();
        var left = Math.ceil((a.lockUntil - Date.now()) / 1000);
        return left > 0 ? left : 0;
    }

    function registerFailedAttempt() {
        var a = getAttempts();
        a.count += 1;
        if (a.count >= MAX_LOGIN_ATTEMPTS) {
            a.count = 0;
            a.lockUntil = Date.now() + LOCK_SECONDS * 1000;
        }
        saveAttempts(a);
    }

    var $login = $('#loginForm');
    if ($login.length) {
        var $lId = $('#username');
        var $lPass = $('#password');

        $lId.add($lPass).on('input', function () {
            $(this).removeClass('is-invalid');
            $login.find('.form-alert').remove();
        });

        $login.on('submit', function (e) {
            e.preventDefault();

            var wait = lockSecondsLeft();
            if (wait > 0) {
                showAlert($login, 'warning', 'Too many failed attempts. Try again in ' + wait + ' s.');
                return;
            }

            var rawId = $.trim($lId.val());
            var id = rawId.toLowerCase();
            var pass = $lPass.val();
            var ok = true;

            if (!rawId) {
                setError($lId, 'Enter your username or email.'); ok = false;
            } else if (rawId.indexOf('@') !== -1) {
                var emailErr = checkEmail(rawId);
                if (emailErr) { setError($lId, emailErr); ok = false; } else { setValid($lId); }
            } else if (!LOGIN_USERNAME_RE.test(rawId)) {
                setError($lId, 'Username: 3-20 characters, Latin letters, digits and underscore only.'); ok = false;
            } else {
                setValid($lId);
            }

            if (!pass) { setError($lPass, 'Enter your password.'); ok = false; }
            else { setValid($lPass); }

            if (!ok) {
                $login.find('.is-invalid').first().trigger('focus');
                return;
            }

            var user = getUsers().filter(function (u) {
                return u.username.toLowerCase() === id || u.email === id;
            })[0];

            if (!user || user.password !== pass) {
                registerFailedAttempt();
                $lId.removeClass('is-valid');
                $lPass.removeClass('is-valid');
                var lockedNow = lockSecondsLeft();
                if (lockedNow > 0) {
                    showAlert($login, 'warning', 'Too many failed attempts. Try again in ' + lockedNow + ' s.');
                } else {
                    showAlert($login, 'danger', 'Incorrect username/email or password.');
                }
                return;
            }

            saveAttempts({ count: 0, lockUntil: 0 });
            localStorage.setItem(CURRENT_KEY, JSON.stringify({
                username: user.username,
                email: user.email,
                createdAt: user.createdAt
            }));

            showAlert($login, 'success', 'Welcome back, ' + user.username + '! Redirecting...');
            $login.find('button[type="submit"]').prop('disabled', true);
            setTimeout(function () { window.location.href = 'profile.html'; }, 1000);
        });
    }
});