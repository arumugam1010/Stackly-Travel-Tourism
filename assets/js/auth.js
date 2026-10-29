/**
 * Restin Luxury Tours & Travels - Auth & Session Manager
 * Handles: Email validation, Strict Password validation (8+ chars, upper, lower, num, symbol),
 * 3-Role routing (Admin, Manager, Traveler), Navbar dynamic auth state, and localStorage session.
 */
(function(window) {
    'use strict';

    const STORAGE_KEY = 'restin_currentUser';
    const DEMO_USERS_KEY = 'restin_registered_users';

    // Role definitions
    const ROLES = {
        admin: {
            id: 'admin',
            title: 'Administrator',
            badgeClass: 'badge-admin',
            dashboardUrl: 'dashboard-admin.html',
            icon: 'fa-solid fa-crown',
            avatar: 'assets/img/avatar-admin.svg',
            description: 'Full platform management & business analytics'
        },
        manager: {
            id: 'manager',
            title: 'Tour Manager',
            badgeClass: 'badge-manager',
            dashboardUrl: 'dashboard-manager.html',
            icon: 'fa-solid fa-compass',
            avatar: 'assets/img/avatar-manager.svg',
            description: 'Tour departures, guides, fleet & bookings'
        },
        traveler: {
            id: 'traveler',
            title: 'Traveler / Customer',
            badgeClass: 'badge-traveler',
            dashboardUrl: 'dashboard-user.html',
            icon: 'fa-solid fa-plane-departure',
            avatar: 'assets/img/avatar-user.svg',
            description: 'My trips, itineraries, tickets & wishlist'
        }
    };

    const RestinAuth = {
        roles: ROLES,

        // Retrieve current logged in user
        getCurrentUser: function() {
            try {
                const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('currentUser');
                if (stored) {
                    return JSON.parse(stored);
                }
            } catch (e) {
                console.error('Error parsing auth session:', e);
            }
            return null;
        },

        // Save session
        setCurrentUser: function(user) {
            try {
                const roleData = ROLES[user.role] || ROLES.traveler;
                const sessionUser = {
                    email: user.email.trim(),
                    name: user.name || user.email.split('@')[0],
                    role: roleData.id,
                    roleTitle: roleData.title,
                    avatar: user.avatar || roleData.avatar,
                    dashboardUrl: roleData.dashboardUrl,
                    loggedInAt: new Date().toISOString()
                };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
                localStorage.setItem('currentUser', JSON.stringify(sessionUser));
                return sessionUser;
            } catch (e) {
                console.error('Error storing auth session:', e);
                return null;
            }
        },

        // Log out
        logout: function(e) {
            if (e && e.preventDefault) e.preventDefault();
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem('currentUser');
            // Notify & redirect to index.html
            window.location.href = 'index.html';
        },

        // Validate Email
        validateEmail: function(email) {
            if (!email || typeof email !== 'string') return false;
            const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            return re.test(email.trim());
        },

        // Validate Password strictly:
        // 8+ chars, uppercase, lowercase, numbers, symbols
        validatePassword: function(password) {
            if (!password || typeof password !== 'string') {
                return {
                    isValid: false,
                    length: false,
                    uppercase: false,
                    lowercase: false,
                    number: false,
                    symbol: false,
                    score: 0
                };
            }

            const length = password.length >= 8;
            const uppercase = /[A-Z]/.test(password);
            const lowercase = /[a-z]/.test(password);
            const number = /[0-9]/.test(password);
            // symbols include any non-alphanumeric character
            const symbol = /[^A-Za-z0-9]/.test(password);

            const score = [length, uppercase, lowercase, number, symbol].filter(Boolean).length;
            const isValid = score === 5;

            return {
                isValid: isValid,
                length: length,
                uppercase: uppercase,
                lowercase: lowercase,
                number: number,
                symbol: symbol,
                score: score
            };
        },

        // Redirect to active role dashboard or login
        routeToDashboard: function() {
            const user = this.getCurrentUser();
            if (user && user.role && ROLES[user.role]) {
                window.location.href = ROLES[user.role].dashboardUrl;
            } else {
                window.location.href = 'login.html';
            }
        },

        // Update Navbar Auth State on pages (index, about, etc.)
        updateNavbar: function() {
            const user = this.getCurrentUser();
            const isAuth = !!user;

            // Target elements
            const guestElements = document.querySelectorAll('.auth-guest-item, .auth-guest-link');
            const userElements = document.querySelectorAll('.auth-user-item, .auth-user-link');
            const dashboardLinks = document.querySelectorAll('.dynamic-dashboard-link, a.dashboard-link, [data-auth-dashboard]');
            const userRoleBadges = document.querySelectorAll('.auth-user-role');
            const userNameLabels = document.querySelectorAll('.auth-user-name');
            const userAvatars = document.querySelectorAll('.auth-user-avatar');

            if (isAuth) {
                // User is logged in: HIDE Login & Register, SHOW Dashboard & Logout
                guestElements.forEach(el => {
                    el.style.setProperty('display', 'none', 'important');
                });
                userElements.forEach(el => {
                    el.style.removeProperty('display');
                    el.classList.remove('d-none');
                });

                const targetDashboard = (user.role && ROLES[user.role]) 
                    ? ROLES[user.role].dashboardUrl 
                    : 'dashboard.html';

                dashboardLinks.forEach(link => {
                    link.setAttribute('href', targetDashboard);
                    const textEl = link.querySelector('.dash-text');
                    if (textEl) {
                        textEl.textContent = 'Dashboard';
                    }
                    link.setAttribute('title', `${user.roleTitle || 'Role'} Dashboard`);
                });

                userRoleBadges.forEach(el => {
                    el.textContent = user.roleTitle || 'Member';
                });

                userNameLabels.forEach(el => {
                    el.textContent = user.name || user.email.split('@')[0];
                });

                userAvatars.forEach(img => {
                    if (user.avatar) img.src = user.avatar;
                });
            } else {
                // Not logged in: SHOW Login & Register, HIDE Dashboard & Logout
                guestElements.forEach(el => {
                    el.style.removeProperty('display');
                    el.classList.remove('d-none');
                });
                userElements.forEach(el => {
                    el.style.setProperty('display', 'none', 'important');
                });
            }

            // Also check meanmenu (mobile menu) cloned items
            setTimeout(function() {
                const meanGuest = document.querySelectorAll('.mean-nav .auth-guest-item, .mean-nav .auth-guest-link');
                const meanUser = document.querySelectorAll('.mean-nav .auth-user-item, .mean-nav .auth-user-link');
                const meanDashLinks = document.querySelectorAll('.mean-nav .dynamic-dashboard-link, .mean-nav a.dashboard-link');

                if (isAuth) {
                    meanGuest.forEach(el => el.style.setProperty('display', 'none', 'important'));
                    meanUser.forEach(el => {
                        el.style.removeProperty('display');
                        el.classList.remove('d-none');
                    });
                    const targetDashboard = (user.role && ROLES[user.role]) 
                        ? ROLES[user.role].dashboardUrl 
                        : 'dashboard.html';
                    meanDashLinks.forEach(link => link.setAttribute('href', targetDashboard));
                } else {
                    meanGuest.forEach(el => {
                        el.style.removeProperty('display');
                        el.classList.remove('d-none');
                    });
                    meanUser.forEach(el => el.style.setProperty('display', 'none', 'important'));
                }
            }, 100);
        }
    };

    // Auto-update navbar on DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            RestinAuth.updateNavbar();
        });
    } else {
        RestinAuth.updateNavbar();
    }

    // Expose to window
    window.RestinAuth = RestinAuth;

    // Global Video / Play Button Interceptor -> redirect to 404.html
    document.addEventListener('click', function(e) {
        var target = e.target;
        if (!target) return;
        var videoLink = target.closest('.video-btn, .video-popup, .button-text a, .button-text, a:has(.fa-play), button:has(.fa-play), a[href*="youtube.com"], a[href*="vimeo.com"]');
        if (videoLink) {
            e.preventDefault();
            e.stopPropagation();
            window.location.href = '404.html';
        }
    }, true);

    // Global Social Media (LinkedIn, Twitter/X, Instagram, Facebook, etc.) Interceptor -> redirect to 404.html
    document.addEventListener('click', function(e) {
        var target = e.target;
        if (!target) return;
        var a = target.closest('a');
        if (a) {
            var isSocial = a.closest('.social-icon') || 
                           (a.classList.contains('icon') && a.querySelector('.fa-instagram')) ||
                           a.querySelector('.fa-facebook, .fa-facebook-f, .fa-twitter, .fa-x-twitter, .fa-instagram, .fa-linkedin, .fa-linkedin-in, .fa-youtube, .fa-pinterest');
            if (isSocial) {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = '404.html';
                return;
            }
        }
    }, true);

})(window);

