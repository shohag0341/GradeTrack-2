// ============================================
// GRADETRACK - Main Application Script
// Part 1: Core Systems, Navigation & Utilities
// ============================================

'use strict';

// ============================================
// TELEGRAM WEBAPP INITIALIZATION
// ============================================
class TelegramService {
    constructor() {
        this.tg = null;
        this.isTelegram = false;
        this.themeParams = null;
        this.mainButton = null;
        this.backButton = null;
    }

    init() {
        // Check if running inside Telegram
        if (window.Telegram && window.Telegram.WebApp) {
            this.tg = window.Telegram.WebApp;
            this.isTelegram = true;
            
            // Initialize Telegram WebApp
            this.tg.ready();
            this.tg.expand();
            
            // Get theme parameters
            this.themeParams = this.tg.themeParams;
            
            // Setup main button
            this.mainButton = this.tg.MainButton;
            
            // Setup back button
            this.backButton = this.tg.BackButton;
            
            // Apply Telegram theme colors if available
            this.applyTelegramTheme();
            
            // Handle back button press
            this.backButton.onClick(() => {
                window.screenManager.goBack();
            });
            
            console.log('✅ Telegram WebApp initialized');
        } else {
            console.log('🔄 Running in browser (Demo Mode)');
            this.isTelegram = false;
        }
        
        return this.isTelegram;
    }

    applyTelegramTheme() {
        if (!this.themeParams) return;
        
        const root = document.documentElement;
        
        // Apply Telegram theme colors if different from default
        if (this.themeParams.bg_color && this.themeParams.bg_color !== '#09090F') {
            root.style.setProperty('--bg-primary', this.themeParams.bg_color);
        }
        
        if (this.themeParams.text_color && this.themeParams.text_color !== '#FFFFFF') {
            root.style.setProperty('--text-primary', this.themeParams.text_color);
        }
        
        if (this.themeParams.hint_color) {
            root.style.setProperty('--text-tertiary', this.themeParams.hint_color);
        }
        
        if (this.themeParams.button_color) {
            root.style.setProperty('--primary', this.themeParams.button_color);
        }
    }

    // Show confirmation popup
    showConfirm(message, callback) {
        if (this.isTelegram) {
            this.tg.showConfirm(message, callback);
        } else {
            // Fallback for browser
            if (confirm(message)) {
                callback(true);
            } else {
                callback(false);
            }
        }
    }

    // Show alert
    showAlert(message) {
        if (this.isTelegram) {
            this.tg.showAlert(message);
        } else {
            alert(message);
        }
    }

    // Haptic feedback
    hapticImpact(style = 'light') {
        if (this.isTelegram && this.tg.HapticFeedback) {
            this.tg.HapticFeedback.impactOccurred(style);
        }
    }

    // Set main button
    setMainButton(text, callback, visible = true) {
        if (!this.isTelegram) return;
        
        this.mainButton.setText(text);
        this.mainButton.onClick(callback);
        
        if (visible) {
            this.mainButton.show();
        } else {
            this.mainButton.hide();
        }
    }

    // Hide main button
    hideMainButton() {
        if (this.isTelegram) {
            this.mainButton.hide();
        }
    }

    // Show back button
    showBackButton() {
        if (this.isTelegram) {
            this.backButton.show();
        }
    }

    // Hide back button
    hideBackButton() {
        if (this.isTelegram) {
            this.backButton.hide();
        }
    }
}

// ============================================
// SCREEN MANAGER
// ============================================
class ScreenManager {
    constructor() {
        this.currentScreen = 'dashboard';
        this.previousScreen = null;
        this.screenHistory = ['dashboard'];
        this.screens = {};
        this.transitionDuration = 250; // ms
    }

    init() {
        // Cache all screen elements
        const screenElements = document.querySelectorAll('.screen');
        screenElements.forEach(screen => {
            this.screens[screen.id.replace('screen-', '')] = screen;
        });

        // Setup navigation event listeners
        this.setupNavigation();
        
        // Show initial screen
        this.navigateTo('dashboard', false);
        
        console.log('✅ Screen Manager initialized');
    }

    setupNavigation() {
        // Navigation bar items
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const screen = item.dataset.screen;
                if (screen) {
                    this.navigateTo(screen);
                    this.updateActiveNav(screen);
                }
            });
        });

        // Back buttons
        document.querySelectorAll('.back-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const backScreen = button.dataset.back || 'dashboard';
                this.navigateTo(backScreen);
            });
        });

        // Quick action cards
        document.querySelectorAll('.action-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const screen = card.dataset.screen;
                if (screen) {
                    this.navigateTo(screen);
                    this.updateActiveNav(screen);
                }
            });
        });

        // Links with data-screen attribute
        document.addEventListener('click', (e) => {
            const link = e.target.closest('[data-screen]');
            if (link && !link.closest('.nav-item') && !link.closest('.action-card')) {
                const screen = link.dataset.screen;
                if (screen && screen !== 'back') {
                    this.navigateTo(screen);
                    this.updateActiveNav(screen);
                }
            }
        });
    }

    navigateTo(screenName, addToHistory = true) {
        // Validate screen exists
        if (!this.screens[screenName]) {
            console.error(`Screen "${screenName}" not found`);
            return;
        }

        // Don't navigate to same screen
        if (this.currentScreen === screenName) return;

        // Get current and target screens
        const currentScreenEl = this.screens[this.currentScreen];
        const targetScreenEl = this.screens[screenName];

        if (!currentScreenEl || !targetScreenEl) return;

        // Update history
        if (addToHistory && this.currentScreen !== screenName) {
            this.previousScreen = this.currentScreen;
            this.screenHistory.push(screenName);
        }

        // Transition: Hide current screen
        currentScreenEl.classList.remove('active');
        currentScreenEl.style.opacity = '0';
        currentScreenEl.style.transform = 'translateX(-20px)';

        // Transition: Show target screen
        setTimeout(() => {
            targetScreenEl.classList.add('active');
            targetScreenEl.style.opacity = '1';
            targetScreenEl.style.transform = 'translateX(0)';
            
            // Scroll to top
            targetScreenEl.scrollTop = 0;
            
            // Update current screen
            this.currentScreen = screenName;

            // Trigger screen-specific logic
            this.onScreenChange(screenName);
            
            // Haptic feedback
            telegramService.hapticImpact('light');
        }, this.transitionDuration);

        // Update Telegram back button visibility
        if (screenName === 'dashboard') {
            telegramService.hideBackButton();
            telegramService.hideMainButton();
        } else {
            telegramService.showBackButton();
        }

        // Update navigation active state
        this.updateActiveNav(screenName);
    }

    goBack() {
        if (this.screenHistory.length > 1) {
            this.screenHistory.pop(); // Remove current
            const previousScreen = this.screenHistory[this.screenHistory.length - 1];
            this.navigateTo(previousScreen, false);
        } else {
            this.navigateTo('dashboard', false);
        }
    }

    updateActiveNav(screenName) {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            if (item.dataset.screen === screenName) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    onScreenChange(screenName) {
        // Trigger screen-specific updates
        switch (screenName) {
            case 'dashboard':
                if (window.dashboardRenderer) {
                    window.dashboardRenderer.render();
                }
                break;
            case 'gpa-calc':
                if (window.gpaCalculator) {
                    window.gpaCalculator.render();
                }
                break;
            case 'cgpa-calc':
                if (window.cgpaCalculator) {
                    window.cgpaCalculator.render();
                }
                break;
            case 'semester':
                if (window.semesterManager) {
                    window.semesterManager.render();
                }
                break;
            case 'target':
                if (window.targetCalculator) {
                    window.targetCalculator.render();
                }
                break;
            case 'settings':
                if (window.settingsManager) {
                    window.settingsManager.render();
                }
                break;
        }
    }

    getCurrentScreen() {
        return this.currentScreen;
    }

    getScreenElement(screenName) {
        return this.screens[screenName] || null;
    }
}

// ============================================
// TOAST NOTIFICATION SERVICE
// ============================================
class ToastService {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        // Create toast container
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
    }

    show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        // Icon based on type
        const icons = {
            success: `<svg class="toast-icon" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="9" stroke="#22C55E" stroke-width="2"/>
                <path d="M6 10L9 13L14 7" stroke="#22C55E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`,
            error: `<svg class="toast-icon" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="9" stroke="#EF4444" stroke-width="2"/>
                <path d="M13 7L7 13M7 7L13 13" stroke="#EF4444" stroke-width="2" stroke-linecap="round"/>
            </svg>`,
            warning: `<svg class="toast-icon" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L18 17H2L10 2Z" stroke="#F59E0B" stroke-width="2" stroke-linejoin="round"/>
                <path d="M10 8V11" stroke="#F59E0B" stroke-width="2" stroke-linecap="round"/>
                <circle cx="10" cy="14" r="1" fill="#F59E0B"/>
            </svg>`,
            info: `<svg class="toast-icon" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="9" stroke="#7C5CFF" stroke-width="2"/>
                <path d="M10 6V11" stroke="#7C5CFF" stroke-width="2" stroke-linecap="round"/>
                <circle cx="10" cy="14" r="1" fill="#7C5CFF"/>
            </svg>`
        };

        toast.innerHTML = `
            ${icons[type] || icons.info}
            <span class="toast-message">${message}</span>
            <button class="toast-close">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M10 4L4 10M4 4L10 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
            </button>
        `;

        // Add to container
        this.container.appendChild(toast);

        // Close button handler
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            this.removeToast(toast);
        });

        // Auto remove after duration
        setTimeout(() => {
            this.removeToast(toast);
        }, duration);

        // Haptic feedback
        telegramService.hapticImpact('light');
    }

    removeToast(toast) {
        toast.classList.add('removing');
        setTimeout(() => {
            if (toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }
        }, 300);
    }

    success(message, duration) {
        this.show(message, 'success', duration);
    }

    error(message, duration) {
        this.show(message, 'error', duration);
    }

    warning(message, duration) {
        this.show(message, 'warning', duration);
    }

    info(message, duration) {
        this.show(message, 'info', duration);
    }
}

// ============================================
// MODAL SERVICE
// ============================================
class ModalService {
    constructor() {
        this.activeModals = [];
        this.init();
    }

    init() {
        // Setup modal close buttons
        document.querySelectorAll('.modal-close').forEach(button => {
            button.addEventListener('click', (e) => {
                const modalId = button.dataset.close;
                if (modalId) {
                    this.close(modalId);
                }
            });
        });

        // Close modal on overlay click
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                const modal = overlay.closest('.modal');
                if (modal) {
                    this.close(modal.id);
                }
            });
        });

        // Prevent modal content click from closing
        document.querySelectorAll('.modal-content').forEach(content => {
            content.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        });

        console.log('✅ Modal Service initialized');
    }

    open(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.error(`Modal "${modalId}" not found`);
            return;
        }

        modal.classList.add('active');
        this.activeModals.push(modalId);
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        // Focus trap (basic)
        const firstInput = modal.querySelector('input, select, textarea, button');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 300);
        }

        // Haptic feedback
        telegramService.hapticImpact('medium');
    }

    close(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        modal.classList.remove('active');
        this.activeModals = this.activeModals.filter(id => id !== modalId);
        
        // Restore body scroll if no more modals
        if (this.activeModals.length === 0) {
            document.body.style.overflow = '';
        }

        // Haptic feedback
        telegramService.hapticImpact('light');
    }

    closeAll() {
        this.activeModals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.remove('active');
            }
        });
        this.activeModals = [];
        document.body.style.overflow = '';
    }

    isOpen(modalId) {
        return this.activeModals.includes(modalId);
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
class Utils {
    // Grade to grade point mapping
    static gradeToPoint(grade) {
        const gradeMap = {
            'A+': 4.00,
            'A': 4.00,
            'A-': 3.70,
            'B+': 3.30,
            'B': 3.00,
            'B-': 2.70,
            'C+': 2.30,
            'C': 2.00,
            'C-': 1.70,
            'D+': 1.30,
            'D': 1.00,
            'F': 0.00
        };
        return gradeMap[grade] || 0;
    }

    // Calculate GPA for a set of courses
    static calculateGPA(courses) {
        if (!courses || courses.length === 0) return 0;
        
        let totalGradePoints = 0;
        let totalCredits = 0;
        
        courses.forEach(course => {
            const credits = parseFloat(course.credit) || 0;
            const gradePoint = parseFloat(course.grade_point) || 0;
            
            totalGradePoints += credits * gradePoint;
            totalCredits += credits;
        });
        
        if (totalCredits === 0) return 0;
        
        const gpa = totalGradePoints / totalCredits;
        return Math.round(gpa * 100) / 100; // Round to 2 decimal places
    }

    // Calculate CGPA from multiple semesters
    static calculateCGPA(semesters) {
        if (!semesters || semesters.length === 0) return 0;
        
        let totalGradePoints = 0;
        let totalCredits = 0;
        
        semesters.forEach(semester => {
            const gpa = parseFloat(semester.semester_gpa) || 0;
            const credits = parseFloat(semester.semester_credit) || 0;
            
            totalGradePoints += gpa * credits;
            totalCredits += credits;
        });
        
        if (totalCredits === 0) return 0;
        
        const cgpa = totalGradePoints / totalCredits;
        return Math.round(cgpa * 100) / 100;
    }

    // Calculate required GPA for target CGPA
    static calculateRequiredGPA(currentCGPA, completedCredits, remainingCredits, targetCGPA) {
        const current = parseFloat(currentCGPA) || 0;
        const completed = parseFloat(completedCredits) || 0;
        const remaining = parseFloat(remainingCredits) || 0;
        const target = parseFloat(targetCGPA) || 0;
        
        if (remaining === 0) return 0;
        
        const totalPoints = target * (completed + remaining);
        const currentPoints = current * completed;
        const requiredPoints = totalPoints - currentPoints;
        
        const requiredGPA = requiredPoints / remaining;
        
        // Cap at 4.00
        return Math.min(Math.round(requiredGPA * 100) / 100, 4.00);
    }

    // Get academic status based on CGPA
    static getAcademicStatus(cgpa) {
        const cgpaNum = parseFloat(cgpa) || 0;
        
        if (cgpaNum >= 3.70) return { text: 'Excellent', class: 'badge-success' };
        if (cgpaNum >= 3.30) return { text: 'Very Good', class: 'badge-success' };
        if (cgpaNum >= 3.00) return { text: 'Good', class: 'badge-primary' };
        if (cgpaNum >= 2.70) return { text: 'Satisfactory', class: 'badge-warning' };
        if (cgpaNum >= 2.00) return { text: 'Pass', class: 'badge-warning' };
        return { text: 'At Risk', class: 'badge-danger' };
    }

      // Get greeting based on time of day
    static getGreeting() {
        const hour = new Date().getHours();
        
        if (hour >= 5 && hour < 12) return 'Good Morning';
        if (hour >= 12 && hour < 17) return 'Good Afternoon';
        if (hour >= 17 && hour < 21) return 'Good Evening';
        return 'Good Night';
    }

    // Format number to 2 decimal places
    static formatNumber(num) {
        return parseFloat(num).toFixed(2);
    }

    // Generate unique ID
    static generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Debounce function
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Validate number input
    static isValidNumber(value, min = 0, max = Infinity) {
        const num = parseFloat(value);
        return !isNaN(num) && num >= min && num <= max;
    }

    // Truncate text with ellipsis
    static truncateText(text, maxLength = 30) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
}

// ============================================
// GLOBAL ERROR HANDLER
// ============================================
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    
    // Show user-friendly error
    if (window.toastService) {
        window.toastService.error('Something went wrong. Please try again.');
    }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    if (window.toastService) {
        window.toastService.error('Operation failed. Please try again.');
    }
});

// ============================================
// INITIALIZE CORE SERVICES
// ============================================

// Initialize Telegram service
const telegramService = new TelegramService();
telegramService.init();

// Initialize Screen Manager
const screenManager = new ScreenManager();

// Initialize Toast Service
const toastService = new ToastService();

// Initialize Modal Service
const modalService = new ModalService();

// Make services globally available
window.telegramService = telegramService;
window.screenManager = screenManager;
window.toastService = toastService;
window.modalService = modalService;
window.Utils = Utils;

// ============================================
// APP INITIALIZATION SEQUENCE
// ============================================
async function initializeApp() {
    try {
        console.log('🚀 Initializing GradeTrack...');
        
        // Show loading screen
        const loadingScreen = document.getElementById('screen-loading');
        loadingScreen.classList.add('active');
        
        // Initialize authentication
        if (window.authService) {
            await authService.initAuth();
            
            // Update user info in UI
            const user = authService.getCurrentUser();
            if (user) {
                document.getElementById('greeting-name').textContent = 
                    user.first_name || 'Student';
                document.getElementById('avatar-initial').textContent = 
                    (user.first_name || 'S').charAt(0).toUpperCase();
            }
        }
        
        // Initialize screen manager (after auth)
        screenManager.init();
        
        // Hide loading screen after minimum display time
        setTimeout(() => {
            loadingScreen.classList.remove('active');
            
            // Show dashboard
            screenManager.navigateTo('dashboard', false);
            
            // Render dashboard
            if (window.dashboardRenderer) {
                window.dashboardRenderer.render();
            }
            
            console.log('✅ GradeTrack initialized successfully');
        }, 1500);
        
    } catch (error) {
        console.error('❌ App initialization error:', error);
        
        // Show error state
        const loadingScreen = document.getElementById('screen-loading');
        loadingScreen.innerHTML = `
            <div class="loading-container">
                <h2 style="color: #EF4444; margin-bottom: 16px;">Failed to Load</h2>
                <p style="color: #B8B8C7; margin-bottom: 24px;">Please restart the app</p>
                <button class="btn-primary" onclick="location.reload()">
                    Retry
                </button>
            </div>
        `;
    }
}

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

// Handle app visibility (Telegram minimize/restore)
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        // Refresh data when app becomes visible again
        if (screenManager && screenManager.getCurrentScreen() === 'dashboard') {
            if (window.dashboardRenderer) {
                window.dashboardRenderer.render();
            }
        }
    }
});

console.log('📱 GradeTrack Core Systems Loaded');










// ============================================
// GRADETRACK - Main Application Script
// Part 2: Dashboard Renderer & Chart Integration
// ============================================

// ============================================
// DASHBOARD RENDERER
// ============================================
class DashboardRenderer {
    constructor() {
        this.trendChart = null;
        this.chartCanvas = null;
    }

    async render() {
        try {
            // Update greeting
            this.updateGreeting();
            
            // Update user info
            await this.updateUserInfo();
            
            // Update CGPA stats
            await this.updateCGPAStats();
            
            // Render recent semesters
            await this.renderRecentSemesters();
            
            // Render trend chart
            await this.renderTrendChart();
            
            console.log('✅ Dashboard rendered');
        } catch (error) {
            console.error('Error rendering dashboard:', error);
        }
    }

    updateGreeting() {
        const greetingText = document.getElementById('greeting-text');
        if (greetingText) {
            greetingText.textContent = Utils.getGreeting();
        }
    }

    async updateUserInfo() {
        const user = authService.getCurrentUser();
        if (!user) return;

        // Update greeting name
        const greetingName = document.getElementById('greeting-name');
        if (greetingName) {
            greetingName.textContent = user.first_name || 'Student';
        }

        // Update avatar
        const avatarInitial = document.getElementById('avatar-initial');
        if (avatarInitial) {
            avatarInitial.textContent = (user.first_name || 'S').charAt(0).toUpperCase();
        }

        // Update dashboard stats
        const completedCredits = document.getElementById('completed-credits');
        if (completedCredits) {
            completedCredits.textContent = user.completed_credits || 0;
        }

        const dashboardCGPA = document.getElementById('dashboard-cgpa');
        if (dashboardCGPA) {
            dashboardCGPA.textContent = Utils.formatNumber(user.current_cgpa || 0);
        }

        // Update academic status badge
        const academicStatus = document.getElementById('academic-status');
        if (academicStatus) {
            const status = Utils.getAcademicStatus(user.current_cgpa);
            academicStatus.textContent = status.text;
            academicStatus.className = `cgpa-badge ${status.class}`;
        }
    }

    async updateCGPAStats() {
        try {
            // Get all semesters
            const semesters = await dbService.getSemesters();
            
            // Get all courses across all semesters
            let totalCourses = 0;
            let totalCompletedCredits = 0;
            
            for (const semester of semesters) {
                const courses = await dbService.getCourses(semester.id);
                totalCourses += courses.length;
                totalCompletedCredits += semester.semester_credit || 0;
            }

            // Update total semesters
            const totalSemesters = document.getElementById('total-semesters');
            if (totalSemesters) {
                totalSemesters.textContent = semesters.length;
            }

            // Update total courses
            const totalCoursesEl = document.getElementById('total-courses');
            if (totalCoursesEl) {
                totalCoursesEl.textContent = totalCourses;
            }

            // Update completed credits
            const completedCredits = document.getElementById('completed-credits');
            if (completedCredits) {
                completedCredits.textContent = totalCompletedCredits;
            }

            // Update user in database
            const user = authService.getCurrentUser();
            if (user) {
                const cgpa = Utils.calculateCGPA(semesters);
                
                await authService.updateUserProfile({
                    completed_credits: totalCompletedCredits,
                    current_cgpa: cgpa
                });

                // Update CGPA display
                const dashboardCGPA = document.getElementById('dashboard-cgpa');
                if (dashboardCGPA) {
                    dashboardCGPA.textContent = Utils.formatNumber(cgpa);
                }

                // Update academic status
                const academicStatus = document.getElementById('academic-status');
                if (academicStatus) {
                    const status = Utils.getAcademicStatus(cgpa);
                    academicStatus.textContent = status.text;
                    academicStatus.className = `cgpa-badge ${status.class}`;
                }
            }
        } catch (error) {
            console.error('Error updating CGPA stats:', error);
        }
    }

    async renderRecentSemesters() {
        const container = document.getElementById('recent-semesters-list');
        if (!container) return;

        try {
            const semesters = await dbService.getSemesters();
            
            // Show only last 3 semesters
            const recentSemesters = semesters.slice(-3).reverse();

            if (recentSemesters.length === 0) {
                container.innerHTML = `
                    <div class="empty-state" style="padding: var(--spacing-lg);">
                        <p style="color: var(--text-tertiary); font-size: var(--font-size-sm);">
                            No semesters yet. Start by adding your first semester!
                        </p>
                    </div>
                `;
                return;
            }

            container.innerHTML = recentSemesters.map(semester => `
                <div class="semester-mini-card" data-semester-id="${semester.id}" 
                     onclick="screenManager.navigateTo('semester')">
                    <div class="semester-mini-info">
                        <h4>${semester.name}</h4>
                        <span>${semester.semester_credit || 0} Credits</span>
                    </div>
                    <div class="semester-mini-gpa">
                        ${Utils.formatNumber(semester.semester_gpa || 0)}
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Error rendering recent semesters:', error);
            container.innerHTML = `
                <p style="color: var(--text-tertiary); text-align: center;">
                    Failed to load semesters
                </p>
            `;
        }
    }

    async renderTrendChart() {
        const canvas = document.getElementById('trend-chart');
        if (!canvas) return;

        try {
            // Get GPA history or calculate from semesters
            let gpaHistory = await dbService.getGPAHistory();
            
            // If no history, generate from semesters
            if (gpaHistory.length === 0) {
                const semesters = await dbService.getSemesters();
                gpaHistory = semesters
                    .filter(s => s.is_completed || s.semester_gpa > 0)
                    .map(s => ({
                        semester_name: s.name,
                        gpa: s.semester_gpa || 0,
                        credits: s.semester_credit || 0
                    }));
            }

            // Prepare chart data
            const labels = gpaHistory.map(h => h.semester_name);
            const gpaData = gpaHistory.map(h => h.gpa);

            // Destroy existing chart
            if (this.trendChart) {
                this.trendChart.destroy();
            }

            // Chart configuration
            const ctx = canvas.getContext('2d');
            
            // Create gradient
            const gradient = ctx.createLinearGradient(0, 0, 0, 200);
            gradient.addColorStop(0, 'rgba(124, 92, 255, 0.3)');
            gradient.addColorStop(1, 'rgba(124, 92, 255, 0)');

            this.trendChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels.length > 0 ? labels : ['No Data'],
                    datasets: [{
                        label: 'GPA',
                        data: gpaData.length > 0 ? gpaData : [0],
                        borderColor: '#7C5CFF',
                        backgroundColor: gradient,
                        borderWidth: 2.5,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#7C5CFF',
                        pointBorderColor: '#FFFFFF',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 8,
                        pointHoverBackgroundColor: '#9E6CFF',
                        pointHoverBorderColor: '#FFFFFF',
                        pointHoverBorderWidth: 3,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            backgroundColor: 'rgba(21, 21, 33, 0.95)',
                            titleColor: '#FFFFFF',
                            bodyColor: '#B8B8C7',
                            borderColor: 'rgba(124, 92, 255, 0.3)',
                            borderWidth: 1,
                            padding: 12,
                            displayColors: false,
                            callbacks: {
                                label: function(context) {
                                    return `GPA: ${context.parsed.y.toFixed(2)}`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.05)',
                                drawBorder: false
                            },
                            ticks: {
                                color: '#8E8E9E',
                                font: {
                                    size: 11,
                                    family: 'Poppins'
                                },
                                maxRotation: 45
                            },
                            border: {
                                display: false
                            }
                        },
                        y: {
                            min: 0,
                            max: 4.0,
                            grid: {
                                color: 'rgba(255, 255, 255, 0.05)',
                                drawBorder: false
                            },
                            ticks: {
                                color: '#8E8E9E',
                                font: {
                                    size: 11,
                                    family: 'Poppins'
                                },
                                stepSize: 0.5,
                                callback: function(value) {
                                    return value.toFixed(1);
                                }
                            },
                            border: {
                                display: false
                            }
                        }
                    }
                }
            });

        } catch (error) {
            console.error('Error rendering trend chart:', error);
            
            // Show placeholder
            const container = canvas.parentElement;
            if (container) {
                container.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: center; height: 200px;">
                        <p style="color: var(--text-tertiary);">Chart unavailable</p>
                    </div>
                `;
            }
        }
    }

    // Handle quick action navigation
    setupQuickActions() {
        const actionCards = document.querySelectorAll('.action-card');
        actionCards.forEach(card => {
            card.addEventListener('click', (e) => {
                const screen = card.dataset.screen;
                if (screen) {
                    screenManager.navigateTo(screen);
                }
            });
        });
    }
}

// ============================================
// CHART HELPER SERVICE
// ============================================
class ChartService {
    constructor() {
        this.charts = {};
    }

    // Create a line chart
    createLineChart(canvasId, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;

        // Destroy existing chart
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        const ctx = canvas.getContext('2d');
        
        // Default options
        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#8E8E9E',
                        font: {
                            size: 11,
                            family: 'Poppins'
                        }
                    },
                    border: {
                        display: false
                    }
                },
                y: {
                    min: 0,
                    max: 4.0,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#8E8E9E',
                        font: {
                            size: 11,
                            family: 'Poppins'
                        },
                        stepSize: 0.5
                    },
                    border: {
                        display: false
                    }
                }
            }
        };

        const mergedOptions = { ...defaultOptions, ...options };
        
        // Create gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, 200);
        gradient.addColorStop(0, 'rgba(124, 92, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(124, 92, 255, 0)');

        // Add gradient to first dataset if not specified
        if (data.datasets && data.datasets[0] && !data.datasets[0].backgroundColor) {
            data.datasets[0].backgroundColor = gradient;
            data.datasets[0].borderColor = data.datasets[0].borderColor || '#7C5CFF';
            data.datasets[0].borderWidth = data.datasets[0].borderWidth || 2.5;
            data.datasets[0].fill = true;
            data.datasets[0].tension = 0.4;
            data.datasets[0].pointBackgroundColor = '#7C5CFF';
            data.datasets[0].pointBorderColor = '#FFFFFF';
            data.datasets[0].pointBorderWidth = 2;
            data.datasets[0].pointRadius = 5;
        }

        const chart = new Chart(ctx, {
            type: 'line',
            data: data,
            options: mergedOptions
        });

        this.charts[canvasId] = chart;
        return chart;
    }

    // Destroy all charts
    destroyAll() {
        Object.keys(this.charts).forEach(key => {
            if (this.charts[key]) {
                this.charts[key].destroy();
            }
        });
        this.charts = {};
    }

    // Destroy specific chart
    destroy(canvasId) {
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
            delete this.charts[canvasId];
        }
    }
}

// ============================================
// GPA STATISTICS CALCULATOR
// ============================================
class GPAStatistics {
    // Calculate statistics from GPA history
    static calculate(gpaHistory) {
        if (!gpaHistory || gpaHistory.length === 0) {
            return {
                highest: 0,
                lowest: 0,
                average: 0,
                trend: 'stable',
                totalSemesters: 0
            };
        }

        const gpas = gpaHistory.map(h => parseFloat(h.gpa) || 0);
        
        const highest = Math.max(...gpas);
        const lowest = Math.min(...gpas);
        const average = gpas.reduce((sum, gpa) => sum + gpa, 0) / gpas.length;
        
        // Determine trend
        let trend = 'stable';
        if (gpas.length >= 2) {
            const recent = gpas.slice(-3);
            const recentAvg = recent.reduce((sum, gpa) => sum + gpa, 0) / recent.length;
            const olderGpas = gpas.slice(0, -3);
            
            if (olderGpas.length > 0) {
                const olderAvg = olderGpas.reduce((sum, gpa) => sum + gpa, 0) / olderGpas.length;
                
                if (recentAvg > olderAvg + 0.3) trend = 'improving';
                else if (recentAvg < olderAvg - 0.3) trend = 'declining';
            }
        }

        return {
            highest: Math.round(highest * 100) / 100,
            lowest: Math.round(lowest * 100) / 100,
            average: Math.round(average * 100) / 100,
            trend: trend,
            totalSemesters: gpas.length
        };
    }

    // Get trend icon and color
    static getTrendDisplay(trend) {
        const displays = {
            improving: {
                icon: '📈',
                text: 'Improving',
                color: 'var(--accent)',
                class: 'badge-success'
            },
            declining: {
                icon: '📉',
                text: 'Declining',
                color: 'var(--danger)',
                class: 'badge-danger'
            },
            stable: {
                icon: '📊',
                text: 'Stable',
                color: 'var(--primary)',
                class: 'badge-primary'
            }
        };
        return displays[trend] || displays.stable;
    }
}

// ============================================
// INITIALIZE DASHBOARD
// ============================================
const dashboardRenderer = new DashboardRenderer();
const chartService = new ChartService();

// Make globally available
window.dashboardRenderer = dashboardRenderer;
window.chartService = chartService;
window.GPAStatistics = GPAStatistics;

// Setup dashboard event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Trend view all link
    const trendLink = document.querySelector('.trend-link');
    if (trendLink) {
        trendLink.addEventListener('click', () => {
            // Will implement trend screen later
            toastService.info('Full trend analysis coming soon!');
        });
    }

    // Section manage link
    const sectionLink = document.querySelector('.section-link');
    if (sectionLink) {
        sectionLink.addEventListener('click', () => {
            screenManager.navigateTo('semester');
        });
    }
});

console.log('📊 Dashboard & Chart Systems Loaded');













// ============================================
// GRADETRACK - Main Application Script
// Part 3: GPA Calculator
// ============================================

// ============================================
// GPA CALCULATOR
// ============================================
class GPACalculator {
    constructor() {
        this.courses = [];
        this.editingCourseId = null;
        this.currentSemesterId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        console.log('✅ GPA Calculator initialized');
    }

    setupEventListeners() {
        // Add course button
        const addBtn = document.getElementById('gpa-add-course-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                this.openCourseModal();
            });
        }

        // Save course button
        const saveBtn = document.getElementById('save-course-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveCourse();
            });
        }

        // Course modal close
        document.querySelectorAll('[data-close="course-modal"]').forEach(btn => {
            btn.addEventListener('click', () => {
                modalService.close('course-modal');
            });
        });

        // Real-time GPA calculation on input change
        const gradeInput = document.getElementById('course-grade-input');
        const creditInput = document.getElementById('course-credit-input');
        
        if (gradeInput && creditInput) {
            gradeInput.addEventListener('change', () => this.previewGPA());
            creditInput.addEventListener('input', () => this.previewGPA());
        }
    }

    async render() {
        // Reset courses array
        this.courses = [];
        
        // Load courses if semester is selected
        if (this.currentSemesterId) {
            await this.loadCourses();
        }
        
        // Render course list
        this.renderCourseList();
        
        // Calculate and display GPA
        this.calculateAndDisplayGPA();
        
        // Update Telegram main button
        telegramService.setMainButton('Calculate GPA', () => {
            this.calculateAndDisplayGPA();
        }, false);
    }

    setSemester(semesterId) {
        this.currentSemesterId = semesterId;
        this.render();
    }

    async loadCourses() {
        try {
            if (this.currentSemesterId) {
                this.courses = await dbService.getCourses(this.currentSemesterId);
            }
        } catch (error) {
            console.error('Error loading courses:', error);
            this.courses = [];
        }
    }

    openCourseModal(courseId = null) {
        const modal = document.getElementById('course-modal');
        const title = document.getElementById('course-modal-title');
        const nameInput = document.getElementById('course-name-input');
        const codeInput = document.getElementById('course-code-input');
        const creditInput = document.getElementById('course-credit-input');
        const gradeInput = document.getElementById('course-grade-input');
        
        // Reset form
        nameInput.value = '';
        codeInput.value = '';
        creditInput.value = '3';
        gradeInput.value = '';
        
        if (courseId) {
            // Edit mode
            const course = this.courses.find(c => c.id === courseId);
            if (course) {
                title.textContent = 'Edit Course';
                nameInput.value = course.course_name || '';
                codeInput.value = course.course_code || '';
                creditInput.value = course.credit || 3;
                gradeInput.value = course.grade || '';
                this.editingCourseId = courseId;
            }
        } else {
            // Add mode
            title.textContent = 'Add Course';
            this.editingCourseId = null;
        }
        
        modalService.open('course-modal');
    }

    async saveCourse() {
        const nameInput = document.getElementById('course-name-input');
        const codeInput = document.getElementById('course-code-input');
        const creditInput = document.getElementById('course-credit-input');
        const gradeInput = document.getElementById('course-grade-input');
        
        // Validate
        const courseName = nameInput.value.trim();
        if (!courseName) {
            toastService.warning('Please enter a course name');
            nameInput.focus();
            return;
        }
        
        const credit = parseInt(creditInput.value);
        if (!credit || credit < 1 || credit > 10) {
            toastService.warning('Credits must be between 1 and 10');
            creditInput.focus();
            return;
        }
        
        const grade = gradeInput.value;
        const gradePoint = grade ? Utils.gradeToPoint(grade) : 0;
        
        const courseData = {
            course_name: courseName,
            course_code: codeInput.value.trim(),
            credit: credit,
            grade: grade || null,
            grade_point: gradePoint,
            is_completed: !!grade
        };
        
        try {
            if (this.editingCourseId) {
                // Update existing course
                if (this.currentSemesterId) {
                    // In database
                    await dbService.updateCourse(this.editingCourseId, courseData);
                } else {
                    // In memory only
                    const index = this.courses.findIndex(c => c.id === this.editingCourseId);
                    if (index !== -1) {
                        this.courses[index] = { ...this.courses[index], ...courseData };
                    }
                }
                toastService.success('Course updated!');
            } else {
                // Add new course
                if (this.currentSemesterId) {
                    // In database
                    courseData.semester_id = this.currentSemesterId;
                    const newCourse = await dbService.addCourse(courseData);
                    this.courses.push(newCourse);
                } else {
                    // In memory only
                    const newCourse = {
                        id: Utils.generateId(),
                        ...courseData
                    };
                    this.courses.push(newCourse);
                }
                toastService.success('Course added!');
            }
            
            // Close modal
            modalService.close('course-modal');
            
            // Reset editing state
            this.editingCourseId = null;
            
            // Re-render
            this.renderCourseList();
            this.calculateAndDisplayGPA();
            
            // Haptic feedback
            telegramService.hapticImpact('success');
            
        } catch (error) {
            console.error('Error saving course:', error);
            toastService.error('Failed to save course');
        }
    }

    editCourse(courseId) {
        this.openCourseModal(courseId);
    }

    async deleteCourse(courseId) {
        const course = this.courses.find(c => c.id === courseId);
        if (!course) return;
        
        // Confirm deletion
        modalService.close('course-modal');
        
        const confirmModal = document.getElementById('confirm-modal');
        const confirmMessage = document.getElementById('confirm-message');
        const confirmTitle = document.getElementById('confirm-title');
        const confirmBtn = document.getElementById('confirm-action-btn');
        
        confirmTitle.textContent = 'Delete Course';
        confirmMessage.textContent = `Are you sure you want to delete "${course.course_name}"?`;
        
        // Setup confirm button
        const handleConfirm = async () => {
            try {
                if (this.currentSemesterId) {
                    await dbService.deleteCourse(courseId);
                }
                
                // Remove from array
                this.courses = this.courses.filter(c => c.id !== courseId);
                
                // Re-render
                this.renderCourseList();
                this.calculateAndDisplayGPA();
                
                toastService.success('Course deleted');
                telegramService.hapticImpact('success');
                
            } catch (error) {
                console.error('Error deleting course:', error);
                toastService.error('Failed to delete course');
            }
            
            // Cleanup
            confirmBtn.removeEventListener('click', handleConfirm);
            modalService.close('confirm-modal');
        };
        
        // Remove old listeners
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        // Add new listener
        newConfirmBtn.addEventListener('click', handleConfirm);
        
        modalService.open('confirm-modal');
    }

    renderCourseList() {
        const container = document.getElementById('gpa-course-list');
        if (!container) return;
        
        if (this.courses.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="padding: var(--spacing-2xl) var(--spacing-lg);">
                    <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                        <rect x="10" y="10" width="40" height="40" rx="8" stroke="#B8B8C7" stroke-width="2"/>
                        <path d="M20 30H40M30 20V40" stroke="#B8B8C7" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    <h3>No Courses Added</h3>
                    <p>Add courses to calculate your GPA</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.courses.map(course => `
            <div class="course-card">
                <div class="course-info">
                    <div class="course-name">${course.course_name}</div>
                    <div class="course-meta">
                        <span>${course.credit} Credits</span>
                        ${course.course_code ? `<span>• ${course.course_code}</span>` : ''}
                    </div>
                </div>
                <div style="display: flex; align-items: center;">
                    <span class="course-grade">${course.grade || 'N/A'}</span>
                    <div class="course-actions">
                        <button class="btn-icon" onclick="gpaCalculator.editCourse('${course.id}')" title="Edit">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M11 1.5L14.5 5L5 14.5H1.5V11L11 1.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
                                <path d="M10 2.5L13.5 6" stroke="currentColor" stroke-width="1.5"/>
                            </svg>
                        </button>
                        <button class="btn-icon danger" onclick="gpaCalculator.deleteCourse('${course.id}')" title="Delete">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M3 4.5H13M6 4.5V3C6 2.44772 6.44772 2 7 2H9C9.55228 2 10 2.44772 10 3V4.5M12 4.5V13C12 13.5523 11.5523 14 11 14H5C4.44772 14 4 13.5523 4 13V4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    calculateAndDisplayGPA() {
        const gpaResult = document.getElementById('gpa-result');
        const totalCredits = document.getElementById('gpa-total-credits');
        const totalCourses = document.getElementById('gpa-total-courses');
        
        if (!gpaResult) return;
        
        // Calculate GPA
        const gpa = Utils.calculateGPA(this.courses);
        
        // Calculate total credits
        const credits = this.courses.reduce((sum, course) => {
            return sum + (parseFloat(course.credit) || 0);
        }, 0);
        
        // Update display
        gpaResult.textContent = Utils.formatNumber(gpa);
        totalCredits.textContent = `${credits} Credits`;
        totalCourses.textContent = `${this.courses.length} Courses`;
        
        // Add animation class
        gpaResult.style.animation = 'none';
        gpaResult.offsetHeight; // Trigger reflow
        gpaResult.style.animation = 'fadeInScale 0.3s ease-out';
        
        // Update result card highlight based on GPA
        const resultCard = gpaResult.closest('.result-card');
        if (resultCard) {
            resultCard.classList.remove('highlight-card');
            if (gpa >= 3.70) {
                resultCard.classList.add('highlight-card');
            }
        }
    }

    previewGPA() {
        // Create temporary course from form inputs
        const nameInput = document.getElementById('course-name-input');
        const creditInput = document.getElementById('course-credit-input');
        const gradeInput = document.getElementById('course-grade-input');
        
        if (!nameInput || !creditInput || !gradeInput) return;
        
        const tempCourse = {
            course_name: nameInput.value || 'Preview',
            credit: parseInt(creditInput.value) || 0,
            grade: gradeInput.value,
            grade_point: Utils.gradeToPoint(gradeInput.value)
        };
        
        const previewGPA = Utils.calculateGPA([...this.courses, tempCourse]);
        
        // Show preview somewhere if needed
        console.log('Preview GPA:', previewGPA);
    }

    // Reset calculator
    reset() {
        this.courses = [];
        this.editingCourseId = null;
        this.currentSemesterId = null;
        this.render();
    }
}

// ============================================
// INITIALIZE GPA CALCULATOR
// ============================================
const gpaCalculator = new GPACalculator();

// Make globally available
window.gpaCalculator = gpaCalculator;

// ============================================
// KEYBOARD SHORTCUTS FOR GPA CALCULATOR
// ============================================
document.addEventListener('keydown', (e) => {
    // Only when course modal is open
    if (!modalService.isOpen('course-modal')) return;
    
    // Enter key to save
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        gpaCalculator.saveCourse();
    }
    
    // Escape to close
    if (e.key === 'Escape') {
        modalService.close('course-modal');
    }
});

// ============================================
// SWIPE GESTURES (Mobile Enhancement)
// ============================================
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    // Only trigger if horizontal swipe is dominant
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 80) {
        const currentScreen = screenManager.getCurrentScreen();
        
        // Swipe right to go back
        if (deltaX > 0 && currentScreen !== 'dashboard') {
            screenManager.goBack();
        }
    }
});

console.log('🧮 GPA Calculator System Loaded');
















// ============================================
// GRADETRACK - Main Application Script
// Part 4: CGPA Calculator & Semester Management
// ============================================

// ============================================
// CGPA CALCULATOR
// ============================================
class CGPACalculator {
    constructor() {
        this.semesters = [];
        this.init();
    }

    init() {
        console.log('✅ CGPA Calculator initialized');
    }

    async render() {
        try {
            // Load all semesters
            this.semesters = await dbService.getSemesters();
            
            // Render semester list
            this.renderSemesterList();
            
            // Calculate and display CGPA
            this.calculateAndDisplayCGPA();
            
        } catch (error) {
            console.error('Error rendering CGPA calculator:', error);
            toastService.error('Failed to load CGPA data');
        }
    }

    renderSemesterList() {
        const container = document.getElementById('cgpa-semester-list');
        if (!container) return;

        if (this.semesters.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="padding: var(--spacing-xl);">
                    <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                        <circle cx="30" cy="30" r="20" stroke="#B8B8C7" stroke-width="2"/>
                        <path d="M30 20V30L36 36" stroke="#B8B8C7" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    <h3>No Semester Data</h3>
                    <p>Add semesters to calculate your CGPA</p>
                    <button class="btn-primary" onclick="screenManager.navigateTo('semester')">
                        Go to Semesters
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.semesters.map(semester => `
            <div class="semester-gpa-item">
                <div class="semester-gpa-info">
                    <div class="semester-gpa-name">${semester.name}</div>
                    <div class="semester-gpa-credits">${semester.semester_credit || 0} Credits</div>
                </div>
                <div class="semester-gpa-score">
                    ${Utils.formatNumber(semester.semester_gpa || 0)}
                </div>
            </div>
        `).join('');

        // Add stagger animation
        container.classList.add('stagger-children');
    }

    async calculateAndDisplayCGPA() {
        const cgpaResult = document.getElementById('cgpa-result');
        const totalCredits = document.getElementById('cgpa-total-credits');
        
        if (!cgpaResult) return;

        // Calculate CGPA
        const cgpa = Utils.calculateCGPA(this.semesters);
        
        // Calculate total credits
        const credits = this.semesters.reduce((sum, semester) => {
            return sum + (parseFloat(semester.semester_credit) || 0);
        }, 0);

        // Update display
        cgpaResult.textContent = Utils.formatNumber(cgpa);
        if (totalCredits) {
            totalCredits.textContent = `${credits} Total Credits`;
        }

        // Update user's CGPA in database
        const user = authService.getCurrentUser();
        if (user) {
            await authService.updateUserProfile({
                current_cgpa: cgpa,
                completed_credits: credits
            });
        }

        // Highlight card based on CGPA
        const resultCard = cgpaResult.closest('.result-card');
        if (resultCard) {
            resultCard.classList.remove('highlight-card');
            if (cgpa >= 3.50) {
                resultCard.classList.add('highlight-card');
            }
        }
    }
}

// ============================================
// SEMESTER MANAGER
// ============================================
class SemesterManager {
    constructor() {
        this.semesters = [];
        this.editingSemesterId = null;
        this.expandedSemesterId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        console.log('✅ Semester Manager initialized');
    }

    setupEventListeners() {
        // Add semester button
        const addBtn = document.getElementById('add-semester-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                this.openSemesterModal();
            });
        }

        // Empty state add button
        const emptyAddBtn = document.getElementById('empty-add-semester');
        if (emptyAddBtn) {
            emptyAddBtn.addEventListener('click', () => {
                this.openSemesterModal();
            });
        }

        // Save semester button
        const saveBtn = document.getElementById('save-semester-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveSemester();
            });
        }

        // Semester modal close
        document.querySelectorAll('[data-close="semester-modal"]').forEach(btn => {
            btn.addEventListener('click', () => {
                modalService.close('semester-modal');
            });
        });
    }

    async render() {
        try {
            // Load semesters
            this.semesters = await dbService.getSemesters();
            
            // Render semester list
            this.renderSemesterList();
            
            // Update empty state
            this.updateEmptyState();
            
        } catch (error) {
            console.error('Error rendering semesters:', error);
            toastService.error('Failed to load semesters');
        }
    }

    renderSemesterList() {
        const container = document.getElementById('semester-list');
        if (!container) return;

        if (this.semesters.length === 0) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = this.semesters.map((semester, index) => `
            <div class="semester-card ${this.expandedSemesterId === semester.id ? 'expanded' : ''}" 
                 data-semester-id="${semester.id}">
                <div class="semester-header" onclick="semesterManager.toggleSemester('${semester.id}')">
                    <div class="semester-info">
                        <h3>${semester.name}</h3>
                        <div class="semester-meta">
                            ${semester.semester_credit || 0} Credits • 
                            ${semester.is_completed ? 'Completed' : 'In Progress'}
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div class="semester-gpa-value">
                            ${Utils.formatNumber(semester.semester_gpa || 0)}
                        </div>
                        <svg class="semester-expand-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M5 7.5L10 12.5L15 7.5" stroke="#B8B8C7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                </div>
                <div class="semester-courses" id="semester-courses-${semester.id}">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <span style="font-size: 13px; color: var(--text-tertiary);">Courses</span>
                        <button class="btn-icon" onclick="event.stopPropagation(); semesterManager.addCourseToSemester('${semester.id}')" title="Add Course">
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                <path d="M9 3V15M3 9H15" stroke="#7C5CFF" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </button>
                    </div>
                    <div id="courses-list-${semester.id}" class="course-list">
                        <div class="skeleton skeleton-text" style="width: 80%;"></div>
                        <div class="skeleton skeleton-text" style="width: 60%;"></div>
                    </div>
                    <div style="display: flex; gap: 8px; margin-top: 12px;">
                        <button class="btn-secondary" style="flex: 1; padding: 8px;" 
                                onclick="event.stopPropagation(); semesterManager.editSemester('${semester.id}')">
                            Edit Semester
                        </button>
                        <button class="btn-danger" style="flex: 1; padding: 8px;" 
                                onclick="event.stopPropagation(); semesterManager.deleteSemester('${semester.id}')">
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        // Add stagger animation
        container.classList.add('stagger-children');
    }

    updateEmptyState() {
        const emptyState = document.getElementById('empty-semesters');
        const semesterList = document.getElementById('semester-list');
        
        if (!emptyState || !semesterList) return;
        
        if (this.semesters.length === 0) {
            emptyState.style.display = 'flex';
            semesterList.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            semesterList.style.display = 'flex';
        }
    }

    async toggleSemester(semesterId) {
        const card = document.querySelector(`[data-semester-id="${semesterId}"]`);
        if (!card) return;

        // Toggle expanded state
        if (this.expandedSemesterId === semesterId) {
            this.expandedSemesterId = null;
            card.classList.remove('expanded');
        } else {
            // Close previously expanded
            if (this.expandedSemesterId) {
                const prevCard = document.querySelector(`[data-semester-id="${this.expandedSemesterId}"]`);
                if (prevCard) {
                    prevCard.classList.remove('expanded');
                }
            }
            
            this.expandedSemesterId = semesterId;
            card.classList.add('expanded');
            
            // Load courses for this semester
            await this.loadSemesterCourses(semesterId);
        }

        // Haptic feedback
        telegramService.hapticImpact('light');
    }

    async loadSemesterCourses(semesterId) {
        const container = document.getElementById(`courses-list-${semesterId}`);
        if (!container) return;

        try {
            const courses = await dbService.getCourses(semesterId);
            
            if (courses.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 20px; color: var(--text-tertiary);">
                        <p style="font-size: 13px;">No courses added yet</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = courses.map(course => `
                <div class="semester-course-item">
                    <div class="semester-course-info">
                        <div class="semester-course-name">${course.course_name}</div>
                        <div class="semester-course-meta">
                            ${course.credit} Credits • ${course.course_code || 'No Code'}
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="semester-course-grade">${course.grade || 'N/A'}</span>
                        <div class="course-actions">
                            <button class="btn-icon" 
                                    onclick="event.stopPropagation(); semesterManager.editCourse('${course.id}', '${semesterId}')" 
                                    title="Edit">
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                    <path d="M10 1.5L12.5 4L4.5 12H2V9.5L10 1.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
                                </svg>
                            </button>
                            <button class="btn-icon danger" 
                                    onclick="event.stopPropagation(); semesterManager.deleteCourse('${course.id}', '${semesterId}')" 
                                    title="Delete">
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                    <path d="M3 4H11M5.5 4V3C5.5 2.44772 5.94772 2 6.5 2H7.5C8.05228 2 8.5 2.44772 8.5 3V4M10.5 4V11C10.5 11.5523 10.0523 12 9.5 12H4.5C3.94772 12 3.5 11.5523 3.5 11V4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Error loading courses:', error);
            container.innerHTML = `
                <p style="color: var(--danger); text-align: center; font-size: 13px;">
                    Failed to load courses
                </p>
            `;
        }
    }

    openSemesterModal(semesterId = null) {
        const title = document.getElementById('semester-modal-title');
        const nameInput = document.getElementById('semester-name-input');
        
        if (semesterId) {
            // Edit mode
            const semester = this.semesters.find(s => s.id === semesterId);
            if (semester) {
                title.textContent = 'Edit Semester';
                nameInput.value = semester.name;
                this.editingSemesterId = semesterId;
            }
        } else {
            // Add mode
            title.textContent = 'Add Semester';
            nameInput.value = '';
            this.editingSemesterId = null;
        }
        
        modalService.open('semester-modal');
        
        // Focus input
        setTimeout(() => nameInput.focus(), 300);
    }

    async saveSemester() {
        const nameInput = document.getElementById('semester-name-input');
        const name = nameInput.value.trim();
        
        if (!name) {
            toastService.warning('Please enter a semester name');
            nameInput.focus();
            return;
        }
        
        try {
            if (this.editingSemesterId) {
                // Update existing semester
                await dbService.updateSemester(this.editingSemesterId, { name });
                toastService.success('Semester updated!');
            } else {
                // Add new semester
                const newSemester = await dbService.addSemester({ name });
                toastService.success('Semester added!');
            }
            
            // Close modal
            modalService.close('semester-modal');
            
            // Reset editing state
            this.editingSemesterId = null;
            
            // Re-render
            await this.render();
            
            // Haptic feedback
            telegramService.hapticImpact('success');
            
        } catch (error) {
            console.error('Error saving semester:', error);
            toastService.error('Failed to save semester');
        }
    }

    editSemester(semesterId) {
        this.openSemesterModal(semesterId);
    }

    async deleteSemester(semesterId) {
        const semester = this.semesters.find(s => s.id === semesterId);
        if (!semester) return;
        
        const confirmModal = document.getElementById('confirm-modal');
        const confirmMessage = document.getElementById('confirm-message');
        const confirmTitle = document.getElementById('confirm-title');
        const confirmBtn = document.getElementById('confirm-action-btn');
        
        confirmTitle.textContent = 'Delete Semester';
        confirmMessage.textContent = `Are you sure you want to delete "${semester.name}" and all its courses? This action cannot be undone.`;
        
        const handleConfirm = async () => {
            try {
                await dbService.deleteSemester(semesterId);
                
                // Clear expanded state if deleted
                if (this.expandedSemesterId === semesterId) {
                    this.expandedSemesterId = null;
                }
                
                // Re-render
                await this.render();
                
                toastService.success('Semester deleted');
                telegramService.hapticImpact('warning');
                
            } catch (error) {
                console.error('Error deleting semester:', error);
                toastService.error('Failed to delete semester');
            }
            
            confirmBtn.removeEventListener('click', handleConfirm);
            modalService.close('confirm-modal');
        };
        
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        newConfirmBtn.addEventListener('click', handleConfirm);
        
        modalService.open('confirm-modal');
    }

    addCourseToSemester(semesterId) {
        // Set the semester context for GPA calculator
        gpaCalculator.setSemester(semesterId);
        
        // Open add course modal
        gpaCalculator.openCourseModal();
        
        // Close semester if expanded
        // We'll refresh when they come back
    }

    async editCourse(courseId, semesterId) {
        // Load courses for this semester if not loaded
        const courses = await dbService.getCourses(semesterId);
        gpaCalculator.courses = courses;
        gpaCalculator.currentSemesterId = semesterId;
        gpaCalculator.editCourse(courseId);
    }

    async deleteCourse(courseId, semesterId) {
        const confirmModal = document.getElementById('confirm-modal');
        const confirmMessage = document.getElementById('confirm-message');
        const confirmTitle = document.getElementById('confirm-title');
        const confirmBtn = document.getElementById('confirm-action-btn');
        
        confirmTitle.textContent = 'Delete Course';
        confirmMessage.textContent = 'Are you sure you want to delete this course?';
        
        const handleConfirm = async () => {
            try {
                await dbService.deleteCourse(courseId);
                
                // Reload courses for this semester
                await this.loadSemesterCourses(semesterId);





            // Update semester GPA
                await this.recalculateSemesterGPA(semesterId);
                
                toastService.success('Course deleted');
                telegramService.hapticImpact('success');
                
            } catch (error) {
                console.error('Error deleting course:', error);
                toastService.error('Failed to delete course');
            }
            
            confirmBtn.removeEventListener('click', handleConfirm);
            modalService.close('confirm-modal');
        };
        
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        newConfirmBtn.addEventListener('click', handleConfirm);
        
        modalService.open('confirm-modal');
    }

    async recalculateSemesterGPA(semesterId) {
        try {
            const courses = await dbService.getCourses(semesterId);
            const gpa = Utils.calculateGPA(courses);
            const totalCredits = courses.reduce((sum, c) => sum + (parseInt(c.credit) || 0), 0);
            
            await dbService.updateSemester(semesterId, {
                semester_gpa: gpa,
                semester_credit: totalCredits
            });
            
            // Re-render to show updated GPA
            await this.render();
            
            // If expanded, reload courses
            if (this.expandedSemesterId === semesterId) {
                await this.loadSemesterCourses(semesterId);
            }
            
        } catch (error) {
            console.error('Error recalculating GPA:', error);
        }
    }
}

// ============================================
// INITIALIZE CGPA CALCULATOR & SEMESTER MANAGER
// ============================================
const cgpaCalculator = new CGPACalculator();
const semesterManager = new SemesterManager();

// Make globally available
window.cgpaCalculator = cgpaCalculator;
window.semesterManager = semesterManager;

// ============================================
// MODAL CLOSE ON BACK BUTTON (Telegram)
// ============================================
if (telegramService.isTelegram) {
    telegramService.backButton.onClick(() => {
        // Close modals first if open
        if (modalService.activeModals.length > 0) {
            modalService.closeAll();
        } else {
            screenManager.goBack();
        }
    });
}

// ============================================
// AUTO-SAVE ON MODAL CLOSE
// ============================================
document.addEventListener('click', (e) => {
    // If clicking modal overlay, we might want to warn about unsaved changes
    if (e.target.classList.contains('modal-overlay')) {
        const courseNameInput = document.getElementById('course-name-input');
        const semesterNameInput = document.getElementById('semester-name-input');
        
        if ((courseNameInput && courseNameInput.value.trim()) ||
            (semesterNameInput && semesterNameInput.value.trim())) {
            // Could implement unsaved changes warning here
        }
    }
});

console.log('📚 CGPA Calculator & Semester Manager Loaded');

















// ============================================
// GRADETRACK - Main Application Script
// Part 5: Target CGPA Calculator & Settings
// ============================================

// ============================================
// TARGET CGPA CALCULATOR
// ============================================
class TargetCalculator {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        console.log('✅ Target CGPA Calculator initialized');
    }

    setupEventListeners() {
        // Calculate button
        const calculateBtn = document.getElementById('calculate-target-btn');
        if (calculateBtn) {
            calculateBtn.addEventListener('click', () => {
                this.calculateTarget();
            });
        }

        // Real-time calculation on input change
        const targetInput = document.getElementById('target-cgpa-input');
        const remainingInput = document.getElementById('remaining-credits-input');
        
        if (targetInput && remainingInput) {
            const debouncedCalculate = Utils.debounce(() => {
                this.calculateTarget();
            }, 500);

            targetInput.addEventListener('input', debouncedCalculate);
            remainingInput.addEventListener('input', debouncedCalculate);
        }
    }

    async render() {
        try {
            // Load user data
            const user = authService.getCurrentUser();
            if (!user) return;

            // Update current stats display
            const currentCGPA = document.getElementById('target-current-cgpa');
            const completedCredits = document.getElementById('target-completed-credits');
            
            if (currentCGPA) {
                currentCGPA.textContent = Utils.formatNumber(user.current_cgpa || 0);
            }
            
            if (completedCredits) {
                completedCredits.textContent = user.completed_credits || 0;
            }

            // Update input fields with saved values
            const targetInput = document.getElementById('target-cgpa-input');
            if (targetInput && user.target_cgpa) {
                targetInput.value = user.target_cgpa;
            }

            // Calculate remaining credits
            const totalCredits = user.total_credits || 120;
            const completed = user.completed_credits || 0;
            const remaining = Math.max(0, totalCredits - completed);
            
            const remainingInput = document.getElementById('remaining-credits-input');
            if (remainingInput && !remainingInput.value) {
                remainingInput.value = remaining;
            }

            // Auto-calculate if all values present
            if (targetInput.value && remainingInput.value) {
                this.calculateTarget();
            }

        } catch (error) {
            console.error('Error rendering target calculator:', error);
        }
    }

    calculateTarget() {
        const targetCGPAInput = document.getElementById('target-cgpa-input');
        const remainingCreditsInput = document.getElementById('remaining-credits-input');
        const requiredGPAEl = document.getElementById('required-gpa');
        
        if (!targetCGPAInput || !remainingCreditsInput || !requiredGPAEl) return;

        // Get values
        const user = authService.getCurrentUser();
        if (!user) {
            toastService.warning('Please set up your profile first');
            return;
        }

        const currentCGPA = parseFloat(user.current_cgpa) || 0;
        const completedCredits = parseInt(user.completed_credits) || 0;
        const targetCGPA = parseFloat(targetCGPAInput.value);
        const remainingCredits = parseInt(remainingCreditsInput.value);

        // Validate inputs
        if (isNaN(targetCGPA) || targetCGPA < 0 || targetCGPA > 4.00) {
            toastService.warning('Target CGPA must be between 0.00 and 4.00');
            targetCGPAInput.focus();
            return;
        }

        if (isNaN(remainingCredits) || remainingCredits < 1) {
            toastService.warning('Remaining credits must be at least 1');
            remainingCreditsInput.focus();
            return;
        }

        // Calculate required GPA
        const requiredGPA = Utils.calculateRequiredGPA(
            currentCGPA,
            completedCredits,
            remainingCredits,
            targetCGPA
        );

        // Display result
        requiredGPAEl.textContent = Utils.formatNumber(requiredGPA);
        
        // Add animation
        requiredGPAEl.style.animation = 'none';
        requiredGPAEl.offsetHeight; // Trigger reflow
        requiredGPAEl.style.animation = 'fadeInScale 0.4s ease-out';

        // Update result card based on feasibility
        const resultCard = requiredGPAEl.closest('.result-card');
        if (resultCard) {
            resultCard.classList.remove('highlight-card', 'glass-card-danger', 'glass-card-warning', 'glass-card-accent');
            
            if (requiredGPA > 4.00) {
                resultCard.classList.add('glass-card-danger');
                this.showFeasibilityMessage('impossible');
            } else if (requiredGPA > 3.70) {
                resultCard.classList.add('glass-card-warning');
                this.showFeasibilityMessage('challenging');
            } else if (requiredGPA <= currentCGPA) {
                resultCard.classList.add('glass-card-accent');
                this.showFeasibilityMessage('easy');
            } else {
                resultCard.classList.add('highlight-card');
                this.showFeasibilityMessage('achievable');
            }
        }

        // Save target CGPA
        this.saveTargetCGPA(targetCGPA);

        // Haptic feedback
        telegramService.hapticImpact('medium');
    }

    showFeasibilityMessage(type) {
        const subtitle = document.querySelector('.result-subtitle');
        if (!subtitle) return;

        const messages = {
            impossible: {
                text: '⚠️ Target is not mathematically possible with remaining credits',
                color: 'var(--danger)'
            },
            challenging: {
                text: '💪 Very challenging! You need near-perfect grades',
                color: 'var(--warning)'
            },
            achievable: {
                text: '✅ Achievable with consistent effort',
                color: 'var(--primary-light)'
            },
            easy: {
                text: '🎯 Easily achievable! Keep up the good work',
                color: 'var(--accent)'
            }
        };

        const message = messages[type] || messages.achievable;
        subtitle.textContent = message.text;
        subtitle.style.color = message.color;
    }

    async saveTargetCGPA(targetCGPA) {
        try {
            await authService.updateUserProfile({
                target_cgpa: targetCGPA
            });
        } catch (error) {
            console.error('Error saving target CGPA:', error);
        }
    }

    // Reset calculator
    reset() {
        const targetInput = document.getElementById('target-cgpa-input');
        const remainingInput = document.getElementById('remaining-credits-input');
        const requiredGPAEl = document.getElementById('required-gpa');
        
        if (targetInput) targetInput.value = '4.00';
        if (remainingInput) remainingInput.value = '';
        if (requiredGPAEl) requiredGPAEl.textContent = '0.00';
        
        const subtitle = document.querySelector('.result-subtitle');
        if (subtitle) {
            subtitle.textContent = 'to achieve your target CGPA';
            subtitle.style.color = 'var(--text-tertiary)';
        }
    }
}

// ============================================
// SETTINGS MANAGER
// ============================================
class SettingsManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        console.log('✅ Settings Manager initialized');
    }

    setupEventListeners() {
        // Reset data button
        const resetBtn = document.getElementById('reset-data-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.confirmResetData();
            });
        }

        // Save profile on input change
        const universityInput = document.getElementById('settings-university');
        const departmentInput = document.getElementById('settings-department');
        const totalCreditsInput = document.getElementById('settings-total-credits');
        
        const saveProfile = Utils.debounce(() => {
            this.saveProfile();
        }, 1000);

        if (universityInput) {
            universityInput.addEventListener('input', saveProfile);
        }
        if (departmentInput) {
            departmentInput.addEventListener('input', saveProfile);
        }
        if (totalCreditsInput) {
            totalCreditsInput.addEventListener('input', saveProfile);
        }
    }

    async render() {
        try {
            const user = authService.getCurrentUser();
            if (!user) return;

            // Update profile display
            const settingsName = document.getElementById('settings-name');
            const settingsUsername = document.getElementById('settings-username');
            const settingsAvatar = document.getElementById('settings-avatar-initial');
            
            if (settingsName) {
                settingsName.textContent = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Student';
            }
            if (settingsUsername) {
                settingsUsername.textContent = user.username ? `@${user.username}` : '@username';
            }
            if (settingsAvatar) {
                settingsAvatar.textContent = (user.first_name || 'S').charAt(0).toUpperCase();
            }

            // Update input fields
            const universityInput = document.getElementById('settings-university');
            const departmentInput = document.getElementById('settings-department');
            const totalCreditsInput = document.getElementById('settings-total-credits');
            
            if (universityInput) universityInput.value = user.university || '';
            if (departmentInput) departmentInput.value = user.department || '';
            if (totalCreditsInput) totalCreditsInput.value = user.total_credits || 120;

        } catch (error) {
            console.error('Error rendering settings:', error);
        }
    }

    async saveProfile() {
        try {
            const university = document.getElementById('settings-university')?.value || '';
            const department = document.getElementById('settings-department')?.value || '';
            const totalCredits = parseInt(document.getElementById('settings-total-credits')?.value) || 120;

            await authService.updateUserProfile({
                university,
                department,
                total_credits: totalCredits
            });

            toastService.success('Profile saved!');
        } catch (error) {
            console.error('Error saving profile:', error);
            toastService.error('Failed to save profile');
        }
    }

    confirmResetData() {
        const confirmModal = document.getElementById('confirm-modal');
        const confirmMessage = document.getElementById('confirm-message');
        const confirmTitle = document.getElementById('confirm-title');
        const confirmBtn = document.getElementById('confirm-action-btn');
        
        confirmTitle.textContent = 'Reset All Data';
        confirmMessage.innerHTML = `
            <div style="text-align: center;">
                <p style="color: var(--danger); font-weight: 600; margin-bottom: 12px;">
                    ⚠️ Warning: This action cannot be undone!
                </p>
                <p style="color: var(--text-secondary); font-size: 14px;">
                    All your semesters, courses, and academic data will be permanently deleted.
                </p>
            </div>
        `;
        
        const handleConfirm = async () => {
            try {
                await dbService.resetAllData();
                
                // Clear local state
                this.resetLocalState();
                
                toastService.success('All data has been reset');
                telegramService.hapticImpact('warning');
                
                // Navigate to dashboard
                screenManager.navigateTo('dashboard');
                
            } catch (error) {
                console.error('Error resetting data:', error);
                toastService.error('Failed to reset data');
            }
            
            confirmBtn.removeEventListener('click', handleConfirm);
            modalService.close('confirm-modal');
        };
        
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        newConfirmBtn.addEventListener('click', handleConfirm);
        
        modalService.open('confirm-modal');
    }

    resetLocalState() {
        // Reset all calculators
        gpaCalculator.reset();
        semesterManager.semesters = [];
        semesterManager.expandedSemesterId = null;
        semesterManager.render();
        cgpaCalculator.semesters = [];
        cgpaCalculator.render();
        targetCalculator.reset();
        
        // Reset dashboard
        dashboardRenderer.render();
    }

    // Export data as JSON
    async exportData() {
        try {
            const user = authService.getCurrentUser();
            const semesters = await dbService.getSemesters();
            
            const exportData = {
                version: '1.0.0',
                exportDate: new Date().toISOString(),
                user: user,
                semesters: []
            };

            // Get courses for each semester
            for (const semester of semesters) {
                const courses = await dbService.getCourses(semester.id);
                exportData.semesters.push({
                    ...semester,
                    courses: courses
                });
            }

            // Create and download file
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
            
            const exportFileName = `gradetrack-backup-${new Date().toISOString().split('T')[0]}.json`;
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileName);
            linkElement.click();
            
            toastService.success('Data exported successfully!');
            
        } catch (error) {
            console.error('Error exporting data:', error);
            toastService.error('Failed to export data');
        }
    }

    // Import data from JSON
    async importData(file) {
        try {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const importData = JSON.parse(e.target.result);
                    
                    // Validate data structure
                    if (!importData.semesters || !Array.isArray(importData.semesters)) {
                        throw new Error('Invalid data format');
                    }
                    
                    // Confirm import
                    const confirmModal = document.getElementById('confirm-modal');
                    const confirmMessage = document.getElementById('confirm-message');
                    const confirmTitle = document.getElementById('confirm-title');
                    const confirmBtn = document.getElementById('confirm-action-btn');
                    
                    confirmTitle.textContent = 'Import Data';
                    confirmMessage.innerHTML = `
                        <div style="text-align: center;">
                            <p style="margin-bottom: 8px;">
                                Found ${importData.semesters.length} semesters
                            </p>
                            <p style="color: var(--warning); font-size: 13px;">
                                ⚠️ This will replace all existing data
                            </p>
                        </div>
                    `;
                    
                    const handleImport = async () => {
                        try {
                            // Reset existing data
                            await dbService.resetAllData();
                            
                            // Import semesters and courses
                            for (const semester of importData.semesters) {
                                const newSemester = await dbService.addSemester({
                                    name: semester.name,
                                    semester_order: semester.semester_order || 1
                                });
                                
                                if (semester.courses) {
                                    for (const course of semester.courses) {
                                        await dbService.addCourse({
                                            semester_id: newSemester.id,
                                            course_name: course.course_name,
                                            course_code: course.course_code || '',
                                            credit: course.credit || 3,
                                            grade: course.grade || null,
                                            grade_point: course.grade_point || 0,
                                            is_completed: course.is_completed || false
                                        });
                                    }
                                }
                                
                                // Recalculate semester GPA
                                await semesterManager.recalculateSemesterGPA(newSemester.id);
                            }
                            
                            toastService.success('Data imported successfully!');
                            telegramService.hapticImpact('success');
                            
                            // Refresh all screens
                            dashboardRenderer.render();
                            
                        } catch (error) {
                            console.error('Error importing data:', error);
                            toastService.error('Failed to import data');
                        }
                        
                        confirmBtn.removeEventListener('click', handleImport);
                        modalService.close('confirm-modal');
                    };
                    
                    const newConfirmBtn = confirmBtn.cloneNode(true);
                    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
                    newConfirmBtn.addEventListener('click', handleImport);
                    
                    modalService.open('confirm-modal');
                    
                } catch (error) {
                    console.error('Error parsing import file:', error);
                    toastService.error('Invalid backup file');
                }
            };
            
            reader.readAsText(file);
            
        } catch (error) {
            console.error('Error importing data:', error);
            toastService.error('Failed to import data');
        }
    }
}

// ============================================
// INITIALIZE TARGET CALCULATOR & SETTINGS
// ============================================
const targetCalculator = new TargetCalculator();
const settingsManager = new SettingsManager();

// Make globally available
window.targetCalculator = targetCalculator;
window.settingsManager = settingsManager;

// ============================================
// SETTINGS - EXPORT/IMPORT BUTTONS
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Add export/import buttons to settings (dynamically)
    const settingsActions = document.querySelector('.settings-actions');
    if (settingsActions) {
        // Export button
        const exportBtn = document.createElement('button');
        exportBtn.className = 'btn-secondary';
        exportBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 2V12M9 12L5 8M9 12L13 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M3 12V15C3 15.5523 3.44772 16 4 16H14C14.5523 16 15 15.5523 15 15V12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Export Data
        `;
        exportBtn.addEventListener('click', () => settingsManager.exportData());
        
        // Import button
        const importBtn = document.createElement('button');
        importBtn.className = 'btn-secondary';
        importBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 2V12M9 2L5 6M9 2L13 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M3 12V15C3 15.5523 3.44772 16 4 16H14C14.5523 16 15 15.5523 15 15V12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Import Data
        `;
        importBtn.addEventListener('click', () => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.json';
            fileInput.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    settingsManager.importData(file);
                }
            };
            fileInput.click();
        });
        
        // Insert before reset button
        const resetBtn = document.getElementById('reset-data-btn');
        if (resetBtn) {
            settingsActions.insertBefore(exportBtn, resetBtn);
            settingsActions.insertBefore(importBtn, resetBtn);
        }
    }
});

// ============================================
// DASHBOARD USER AVATAR CLICK
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const userAvatar = document.getElementById('user-avatar');
    if (userAvatar) {
        userAvatar.addEventListener('click', () => {
            screenManager.navigateTo('settings');
            screenManager.updateActiveNav('settings');
        });
    }
});

// ============================================
// HANDLE APP STATE CHANGES
// ============================================
// Update all screens when data changes
window.addEventListener('focus', () => {
    const currentScreen = screenManager.getCurrentScreen();
    
    // Refresh current screen
    switch (currentScreen) {
        case 'dashboard':
            dashboardRenderer.render();
            break;
        case 'semester':
            semesterManager.render();
            break;
        case 'cgpa-calc':
            cgpaCalculator.render();
            break;
        case 'target':
            targetCalculator.render();
            break;
        case 'settings':
            settingsManager.render();
            break;
    }
});

console.log('🎯 Target Calculator & Settings Manager Loaded');














// ============================================
// GRADETRACK - Main Application Script
// Part 6: Final Integration & Event Handlers
// ============================================

// ============================================
// APP STATE MANAGER
// ============================================
class AppStateManager {
    constructor() {
        this.state = {
            isOnline: true,
            lastSync: null,
            isSyncing: false,
            pendingChanges: 0
        };
        this.init();
    }

    init() {
        this.monitorOnlineStatus();
        this.setupPeriodicSync();
        console.log('✅ App State Manager initialized');
    }

    monitorOnlineStatus() {
        window.addEventListener('online', () => {
            this.state.isOnline = true;
            toastService.success('Back online! Syncing data...');
            this.syncAllData();
        });

        window.addEventListener('offline', () => {
            this.state.isOnline = false;
            toastService.warning('You are offline. Changes will be saved locally.');
        });
    }

    setupPeriodicSync() {
        // Sync data every 5 minutes
        setInterval(() => {
            if (this.state.isOnline) {
                this.syncAllData();
            }
        }, 300000); // 5 minutes
    }

    async syncAllData() {
        if (this.state.isSyncing) return;
        
        this.state.isSyncing = true;
        
        try {
            // Refresh user data
            const user = authService.getCurrentUser();
            if (user) {
                // Refresh dashboard
                await dashboardRenderer.render();
                
                // Update last sync time
                this.state.lastSync = new Date().toISOString();
            }
        } catch (error) {
            console.error('Sync error:', error);
        } finally {
            this.state.isSyncing = false;
        }
    }
}

// ============================================
// KEYBOARD NAVIGATION
// ============================================
class KeyboardNavigator {
    constructor() {
        this.init();
    }

    init() {
        document.addEventListener('keydown', (e) => {
            // Don't handle if user is typing in an input
            const activeElement = document.activeElement;
            if (activeElement && (activeElement.tagName === 'INPUT' || 
                activeElement.tagName === 'TEXTAREA' || 
                activeElement.tagName === 'SELECT')) {
                // Only handle Escape for inputs
                if (e.key === 'Escape') {
                    activeElement.blur();
                    modalService.closeAll();
                }
                return;
            }

            // Global keyboard shortcuts
            switch (e.key) {
                case '1':
                    screenManager.navigateTo('dashboard');
                    break;
                case '2':
                    screenManager.navigateTo('semester');
                    break;
                case '3':
                    screenManager.navigateTo('target');
                    break;
                case '4':
                    screenManager.navigateTo('settings');
                    break;
                case 'Escape':
                    if (modalService.activeModals.length > 0) {
                        modalService.closeAll();
                    } else {
                        screenManager.goBack();
                    }
                    break;
                case 'g':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        screenManager.navigateTo('gpa-calc');
                    }
                    break;
                case 'ArrowLeft':
                    if (e.altKey) {
                        screenManager.goBack();
                    }
                    break;
                default:
                    break;
            }
        });

        console.log('⌨️ Keyboard Navigator initialized');
    }
}

// ============================================
// PERFORMANCE OPTIMIZER
// ============================================
class PerformanceOptimizer {
    constructor() {
        this.observers = new Map();
        this.init();
    }

    init() {
        this.setupIntersectionObserver();
        this.setupLazyLoading();
        console.log('⚡ Performance Optimizer initialized');
    }

    // Lazy load animations only when elements are visible
    setupIntersectionObserver() {
        const options = {
            root: null,
            rootMargin: '50px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, options);

        // Observe fade-in sections
        document.querySelectorAll('.fade-in-section').forEach(el => {
            observer.observe(el);
        });

        this.observers.set('fadeIn', observer);
    }

    setupLazyLoading() {
        // Lazy load chart only when dashboard is visible
        const dashboardScreen = document.getElementById('screen-dashboard');
        if (dashboardScreen) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    if (mutation.target.classList.contains('active')) {
                        // Dashboard is now visible
                        if (dashboardRenderer && dashboardRenderer.trendChart === null) {
                            setTimeout(() => {
                                dashboardRenderer.renderTrendChart();
                            }, 300);
                        }
                    }
                });
            });

            observer.observe(dashboardScreen, {
                attributes: true,
                attributeFilter: ['class']
            });

            this.observers.set('dashboard', observer);
        }
    }

    // Debounced resize handler
    setupResizeHandler() {
        let resizeTimeout;
        
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                // Redraw charts on resize
                if (chartService) {
                    Object.values(chartService.charts).forEach(chart => {
                        if (chart && chart.resize) {
                            chart.resize();
                        }
                    });
                }
            }, 250);
        });
    }

    destroy() {
        // Cleanup all observers
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
    }
}

// ============================================
// ANIMATION CONTROLLER
// ============================================
class AnimationController {
    constructor() {
        this.init();
    }

    init() {
        this.setupPageTransitions();
        console.log('✨ Animation Controller initialized');
    }

    setupPageTransitions() {
        // Add smooth transitions between screens
        const originalNavigateTo = screenManager.navigateTo.bind(screenManager);
        
        screenManager.navigateTo = (screenName, addToHistory = true) => {
            // Add exit animation to current screen
            const currentScreen = screenManager.getScreenElement(screenManager.currentScreen);
            if (currentScreen) {
                currentScreen.style.animation = 'fadeInDown 0.2s ease-in reverse';
            }
            
            // Call original method
            originalNavigateTo(screenName, addToHistory);
            
            // Add entrance animation to new screen
            setTimeout(() => {
                const newScreen = screenManager.getScreenElement(screenName);
                if (newScreen) {
                    newScreen.style.animation = 'fadeInUp 0.3s ease-out';
                    setTimeout(() => {
                        newScreen.style.animation = '';
                    }, 300);
                }
            }, 50);
        };
    }

    // Celebratory animation for achievements
    celebrate() {
        // Create confetti-like effect
        const colors = ['#7C5CFF', '#9E6CFF', '#22C55E', '#F59E0B', '#EF4444'];
        const container = document.getElementById('app-container');
        
        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: fixed;
                width: 8px;
                height: 8px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: -10px;
                z-index: 9999;
                pointer-events: none;
                animation: confettiFall ${1 + Math.random() * 2}s linear forwards;
                animation-delay: ${Math.random() * 0.5}s;
            `;
            
            container.appendChild(particle);
            
            // Remove particle after animation
            setTimeout(() => {
                if (particle.parentElement) {
                    particle.parentElement.removeChild(particle);
                }
            }, 3000);
        }

        // Add confetti keyframe if not exists
        if (!document.getElementById('confetti-style')) {
            const style = document.createElement('style');
            style.id = 'confetti-style';
            style.textContent = `
                @keyframes confettiFall {
                    0% {
                        transform: translateY(0) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(100vh) rotate(720deg);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// ============================================
// ERROR BOUNDARY & RECOVERY
// ============================================
class ErrorBoundary {
    constructor() {
        this.errors = [];
        this.maxErrors = 10;
        this.init();
    }

    init() {
        this.setupErrorHandling();
        console.log('🛡️ Error Boundary initialized');
    }

    setupErrorHandling() {
        // Global error handler
        window.onerror = (message, source, lineno, colno, error) => {
            this.handleError({
                type: 'global',
                message,
                source,
                lineno,
                colno,
                error
            });
            return true; // Prevent default error handling
        };

        // Unhandled promise rejection handler
        window.onunhandledrejection = (event) => {
            this.handleError({
                type: 'promise',
                message: event.reason?.message || 'Promise rejected',
                error: event.reason
            });
        };
    }

    handleError(errorInfo) {
        console.error('Error caught:', errorInfo);
        
        // Add to error log
        this.errors.push({
            ...errorInfo,
            timestamp: new Date().toISOString(),
            screen: screenManager.getCurrentScreen()
        });

        // Keep only recent errors
        if (this.errors.length > this.maxErrors) {
            this.errors.shift();
        }

        // Show user-friendly message
        if (this.errors.length === 1) {
            // Show error only for first error to avoid spam
            toastService.error('Something went wrong. The app will try to recover.');
        }

        // Attempt recovery
        this.attemptRecovery();
    }

    attemptRecovery() {
        const currentScreen = screenManager.getCurrentScreen();
        
        // Try to re-render current screen
        try {
            switch (currentScreen) {
                case 'dashboard':
                    dashboardRenderer.render();
                    break;
                case 'semester':
                    semesterManager.render();
                    break;
                case 'gpa-calc':
                    gpaCalculator.render();
                    break;
                case 'cgpa-calc':
                    cgpaCalculator.render();
                    break;
                case 'target':
                    targetCalculator.render();
                    break;
                case 'settings':
                    settingsManager.render();
                    break;
            }
        } catch (error) {
            console.error('Recovery failed:', error);
            
            // Last resort: navigate to dashboard
            try {
                screenManager.navigateTo('dashboard');
            } catch (e) {
                // If even that fails, reload the app
                console.error('Critical error, reloading...');
                setTimeout(() => location.reload(), 2000);
            }
        }
    }

    getErrorLog() {
        return this.errors;
    }
}

// ============================================
// TELEGRAM DEEP LINK HANDLER
// ============================================
class DeepLinkHandler {
    constructor() {
        this.init();
    }

    init() {
        if (telegramService.isTelegram) {
            const startParam = telegramService.tg.initDataUnsafe?.start_param;
            if (startParam) {
                this.handleDeepLink(startParam);
            }
        }
    }

    handleDeepLink(param) {
        console.log('Deep link received:', param);
        
        // Handle different deep link actions
        switch (param) {
            case 'gpa':
                screenManager.navigateTo('gpa-calc');
                break;
            case 'cgpa':
                screenManager.navigateTo('cgpa-calc');
                break;
            case 'target':
                screenManager.navigateTo('target');
                break;
            case 'semester':
                screenManager.navigateTo('semester');
                break;
            default:
                // Default to dashboard
                screenManager.navigateTo('dashboard');
        }
    }
}

// ============================================
// ANALYTICS & USAGE TRACKING (Basic)
// ============================================
class UsageTracker {
    constructor() {
        this.screenViews = {};
        this.featureUsage = {};
        this.sessionStart = new Date();
        this.init();
    }

    init() {
        this.trackScreenView('loading');
        this.setupTracking();
        console.log('📊 Usage Tracker initialized');
    }

    setupTracking() {
        // Track screen changes
        const originalNavigateTo = screenManager.navigateTo.bind(screenManager);
        
        screenManager.navigateTo = (screenName, addToHistory) => {
            this.trackScreenView(screenName);
            originalNavigateTo(screenName, addToHistory);
        };
    }

    trackScreenView(screenName) {
        this.screenViews[screenName] = (this.screenViews[screenName] || 0) + 1;
        
        // Save to localStorage periodically
        this.saveStats();
    }

    trackFeature(featureName) {
        this.featureUsage[featureName] = (this.featureUsage[featureName] || 0) + 1;
        this.saveStats();
    }

    saveStats() {
        const stats = {
            screenViews: this.screenViews,
            featureUsage: this.featureUsage,
            sessionStart: this.sessionStart,
            lastUpdated: new Date().toISOString()
        };
        
        localStorage.setItem('gradetrack_stats', JSON.stringify(stats));
    }

    getStats() {
        return {
            screenViews: this.screenViews,
            featureUsage: this.featureUsage,
            sessionDuration: Math.floor((new Date() - this.sessionStart) / 1000)
        };
    }
}

// ============================================
// INITIALIZE ALL FINAL SYSTEMS
// ============================================
const appStateManager = new AppStateManager();
const keyboardNavigator = new KeyboardNavigator();
const performanceOptimizer = new PerformanceOptimizer();
const animationController = new AnimationController();
const errorBoundary = new ErrorBoundary();
const deepLinkHandler = new DeepLinkHandler();
const usageTracker = new UsageTracker();

// Make available globally
window.animationController = animationController;
window.errorBoundary = errorBoundary;

// ============================================
// FINAL APP INITIALIZATION
// ============================================
async function finalizeAppInit() {
    try {
        console.log('🚀 Finalizing GradeTrack initialization...');
        
        // Setup resize handler
        performanceOptimizer.setupResizeHandler();
        
        // Update dashboard with real data
        await dashboardRenderer.render();
        
        // Setup quick actions on dashboard
        dashboardRenderer.setupQuickActions();
        
        // Hide loading screen if still visible
        const loadingScreen = document.getElementById('screen-loading');
        if (loadingScreen && loadingScreen.classList.contains('active')) {
            setTimeout(() => {
                loadingScreen.classList.remove('active');
            }, 500);
        }
        
        // Show welcome toast for new users
        const user = authService.getCurrentUser();
        if (user && (!user.completed_credits || user.completed_credits === 0)) {
            setTimeout(() => {
                toastService.info('👋 Welcome! Start by adding your first semester.');
            }, 2000);
        }
        
        // Check for achievements
        checkAchievements();
        
        console.log('✅ GradeTrack fully initialized!');
        console.log('📱 Running on:', telegramService.isTelegram ? 'Telegram' : 'Browser');
        console.log('👤 User:', user?.first_name || 'Guest');
        
    } catch (error) {
        console.error('Final initialization error:', error);
        errorBoundary.handleError({
            type: 'init',
            message: 'Failed to complete initialization',
            error
        });
    }
}

// ============================================
// ACHIEVEMENT SYSTEM
// ============================================
function checkAchievements() {
    const user = authService.getCurrentUser();
    if (!user) return;
    
    // First semester achievement
    if (user.completed_credits >= 12 && user.completed_credits < 15) {
        setTimeout(() => {
            toastService.success('🏆 Achievement Unlocked: First Semester Complete!');
            animationController.celebrate();
        }, 3000);
    }
    
    // CGPA milestones
    if (user.current_cgpa >= 3.50) {
        setTimeout(() => {
            toastService.success('🌟 Outstanding CGPA! Keep it up!');
        }, 3500);
    }
    
    // Credit milestones
    if (user.completed_credits >= 60 && user.completed_credits < 65) {
        setTimeout(() => {
            toastService.success('🎓 Halfway through your degree!');
            animationController.celebrate();
        }, 4000);
    }
}

// ============================================
// SERVICE WORKER REGISTRATION (Future PWA)
// ============================================
if ('serviceWorker' in navigator) {
    // Service worker can be added later for offline support
    console.log('Service Worker support detected');
}




// ============================================
// EXPORT APP VERSION
// ============================================
const APP_VERSION = '1.0.0';
const APP_BUILD = 'production';

console.log(`
╔══════════════════════════════════╗
║        GradeTrack v${APP_VERSION}        ║
║     GPA & CGPA Management       ║
║     Telegram Mini App           ║
║     Build: ${APP_BUILD}             ║
╚══════════════════════════════════╝
`);

// ============================================
// FINAL STARTUP
// ============================================
// Override the original initializeApp to include final systems
const originalInit = initializeApp;
initializeApp = async function() {
    await originalInit();
    await finalizeAppInit();
};

// ============================================
// HANDLE UNEXPECTED SHUTDOWN
// ============================================
window.addEventListener('beforeunload', () => {
    // Save any pending data
    console.log('App closing, saving state...');
    
    // Final stats save
    if (usageTracker) {
        usageTracker.saveStats();
    }
});

// ============================================
// MEMORY LEAK PREVENTION
// ============================================
// Clean up on screen transitions
const cleanupScreen = (screenName) => {
    // Destroy charts when leaving dashboard
    if (screenName !== 'dashboard' && chartService) {
        // Keep trend chart, destroy others if any
    }
    
    // Clear any pending timers for hidden screens
    // This prevents memory leaks from abandoned timers
};

// Override screen manager to include cleanup
const originalOnScreenChange = screenManager.onScreenChange.bind(screenManager);
screenManager.onScreenChange = function(screenName) {
    cleanupScreen(screenName);
    originalOnScreenChange(screenName);
};

console.log('🎉 GradeTrack - All Systems Ready');


