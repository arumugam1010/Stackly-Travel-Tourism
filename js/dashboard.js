/**
 * Restin Luxury Tours & Travels - Dashboard Interactive Controller
 * Handles: Mobile sidebar drawer, active role syncing, and routing dashboard action buttons to 404.html
 */
(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
        const sidebar = document.querySelector('.dashboard-sidebar');
        const overlay = document.querySelector('.dashboard-mobile-overlay');
        const hamburgerBtn = document.querySelector('.mobile-hamburger-btn');
        const closeBtn = document.querySelector('.sidebar-close-btn');

        // 1. Mobile Sidebar Toggle
        if (hamburgerBtn && sidebar && overlay) {
            hamburgerBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                sidebar.classList.add('mobile-open');
                overlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        }

        function closeMobileSidebar() {
            if (sidebar) sidebar.classList.remove('mobile-open');
            if (overlay) overlay.classList.remove('active');
            document.body.style.overflow = '';
        }

        if (closeBtn) closeBtn.addEventListener('click', closeMobileSidebar);
        if (overlay) overlay.addEventListener('click', closeMobileSidebar);

        // Close sidebar on ESC key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') closeMobileSidebar();
        });

        // 2. Sync Current User details in Dashboard UI
        if (window.RestinAuth) {
            const user = window.RestinAuth.getCurrentUser();
            if (user) {
                document.querySelectorAll('.topbar-user-name, .user-name-display').forEach(el => {
                    el.textContent = user.name || user.email.split('@')[0];
                });
                document.querySelectorAll('.topbar-user-role, .user-role-display').forEach(el => {
                    el.textContent = user.roleTitle || 'Member';
                });
                document.querySelectorAll('.topbar-user-avatar, .user-avatar-display').forEach(img => {
                    const fallback = (user.role === 'admin') ? 'assets/img/avatar-admin.svg' : 
                                     (user.role === 'manager') ? 'assets/img/avatar-manager.svg' : 'assets/img/avatar-user.svg';
                    img.onerror = function() {
                        this.onerror = null;
                        this.src = fallback;
                    };
                    if (user.avatar) {
                        img.src = user.avatar;
                    } else {
                        img.src = fallback;
                    }
                });
            }
        }

        // 3. Sidebar Nav Item Click & Dynamic View Switching
        const sidebarMenuItems = document.querySelectorAll('.sidebar-menu-item');
        const dashboardViews = document.querySelectorAll('.dashboard-view');
        const pageTitleEl = document.querySelector('.dashboard-page-title');

        function switchView(targetHash) {
            if (!targetHash) targetHash = '#overview';
            const cleanHash = targetHash.replace('#', '');
            const targetView = document.getElementById('view-' + cleanHash);

            if (targetView) {
                // Hide all views, show targeted view
                dashboardViews.forEach(v => v.classList.remove('active'));
                targetView.classList.add('active');

                // Update active sidebar item
                sidebarMenuItems.forEach(item => {
                    const link = item.querySelector('.sidebar-menu-link');
                    if (link && link.getAttribute('href') === '#' + cleanHash) {
                        item.classList.add('active');
                        // Update title if present
                        const span = link.querySelector('span:not(.item-count)');
                        if (span && pageTitleEl) {
                            pageTitleEl.textContent = span.textContent.replace(/^\d+\.\s*/, '');
                        }
                    } else {
                        item.classList.remove('active');
                    }
                });

                // Scroll view to top smoothly
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }

        sidebarMenuItems.forEach(item => {
            const link = item.querySelector('.sidebar-menu-link');
            if (link) {
                link.addEventListener('click', function(e) {
                    const href = link.getAttribute('href');
                    if (href && href.startsWith('#')) {
                        e.preventDefault();
                        window.location.hash = href;
                        switchView(href);
                        closeMobileSidebar();
                    }
                });
            }
        });

        // 3b. Sidebar Logo Click - Navigates directly to First Dashboard View (#overview)
        const sidebarLogo = document.querySelector('.sidebar-logo');
        if (sidebarLogo) {
            sidebarLogo.addEventListener('click', function(e) {
                e.preventDefault();
                window.location.hash = '#overview';
                switchView('#overview');
                closeMobileSidebar();
            });
        }

        // Listen to hash change (back/forward buttons)
        window.addEventListener('hashchange', function() {
            switchView(window.location.hash);
        });

        // Initialize active view on load
        if (window.location.hash && document.getElementById('view-' + window.location.hash.replace('#', ''))) {
            switchView(window.location.hash);
        } else {
            switchView('#overview');
        }

        // 4. CRITICAL REQUIREMENT:
        // "dashboard pages la ulla buttons click pana 404 page ponum"
        // Intercept all action buttons inside dashboard pages and route to 404.html
        document.addEventListener('click', function(e) {
            const target = e.target.closest('button, .dash-btn, a.btn, .btn-action, .to-404');
            if (!target) return;

            // EXCLUSIONS:
            // 1. Mobile hamburger toggle
            if (target.closest('.mobile-hamburger-btn, .sidebar-close-btn')) return;
            // 2. Return to home or external navigation links
            if (target.classList.contains('home-link') || target.getAttribute('href') === 'index.html') return;
            // 3. Logout action
            if (target.classList.contains('logout-link') || target.classList.contains('logout-btn')) return;
            // 4. Sidebar menu links or logo
            if (target.closest('.sidebar-menu-link, .sidebar-logo')) return;

            // Route all dashboard action buttons to 404.html
            e.preventDefault();
            e.stopPropagation();
            window.location.href = '404.html';
        });
    });
})();
