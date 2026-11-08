$(function () {
    var USERS_KEY = 'delish_users';
    var CURRENT_KEY = 'delish_currentUser';
    function getUsers() {
        try {
            return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
        } catch (e) {
            return [];
        }
    }

    function saveUsers(users) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

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

    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    var USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;

    function validateUsername($el) {
        var v = $.trim($el.val());
        if (!v) return setError($el, 'Username is required.');
        if (!USERNAME_RE.test(v)) {
            return setError($el, '3-20 characters: letters, digits and underscore only.');
        }
        var exists = getUsers().some(function (u) {
            return u.username.toLowerCase() === v.toLowerCase();
        });
        if (exists) return setError($el, 'This username is already taken.');
        return setValid($el);
    }

    function validateEmail($el) {
        var v = $.trim($el.val());
        if (!v) return setError($el, 'Email is required.');
        if (!EMAIL_RE.test(v)) return setError($el, 'Enter a valid email, e.g. name@example.com.');
        var exists = getUsers().some(function (u) {
            return u.email === v.toLowerCase();
        });
        if (exists) return setError($el, 'An account with this email already exists.');
        return setValid($el);
    }

    function validatePassword($el) {
        var v = $el.val();
        if (!v) return setError($el, 'Password is required.');
        if (v.length < 6) return setError($el, 'Password must be at least 6 characters.');
        if (!/[A-Za-z]/.test(v) || !/\d/.test(v)) {
            return setError($el, 'Password must contain at least one letter and one digit.');
        }
        return setValid($el);
    }

    function validateConfirm($el, $pass) {
        var v = $el.val();
        if (!v) return setError($el, 'Please confirm your password.');
        if (v !== $pass.val()) return setError($el, 'Passwords do not match.');
        return setValid($el);
    }

    var $reg = $('#registerForm');
    if ($reg.length) {
        var $rUser = $('#username');
        var $rEmail = $('#email');
        var $rPass = $('#password');
        var $rConf = $('#check_password');

        $rUser.on('blur', function () { validateUsername($rUser); });
        $rEmail.on('blur', function () { validateEmail($rEmail); });
        $rPass.on('blur input', function () {
            validatePassword($rPass);
            if ($rConf.val()) validateConfirm($rConf, $rPass);
        });
        $rConf.on('blur input', function () { validateConfirm($rConf, $rPass); });

        $reg.on('submit', function (e) {
            e.preventDefault();

            var results = [
                validateUsername($rUser),
                validateEmail($rEmail),
                validatePassword($rPass),
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

            var id = $.trim($lId.val()).toLowerCase();
            var pass = $lPass.val();
            var ok = true;

            if (!id) { setError($lId, 'Enter your username or email.'); ok = false; }
            else { setValid($lId); }

            if (!pass) { setError($lPass, 'Enter your password.'); ok = false; }
            else { setValid($lPass); }

            if (!ok) return;

            var user = getUsers().filter(function (u) {
                return u.username.toLowerCase() === id || u.email === id;
            })[0];

            if (!user || user.password !== pass) {
                $lId.removeClass('is-valid');
                $lPass.removeClass('is-valid');
                showAlert($login, 'danger', 'Incorrect username/email or password.');
                return;
            }
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