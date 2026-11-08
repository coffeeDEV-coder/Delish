$(function () {
    var CURRENT_KEY = 'delish_currentUser';
    var user = null;

    try {
        user = JSON.parse(localStorage.getItem(CURRENT_KEY));
    } catch (e) {
        user = null;
    }

    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    $('#profileName').text(user.username);
    $('#profileEmail').text(user.email);

    var date = user.createdAt ? new Date(user.createdAt) : null;
    $('#profileSince').text(
        date && !isNaN(date)
            ? date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            : '—'
    );

    $('#profilePhoto').attr('alt', user.username + ' profile photo');

    $('#logoutBtn').on('click', function () {
        localStorage.removeItem(CURRENT_KEY);
        window.location.href = 'login.html';
    });
});