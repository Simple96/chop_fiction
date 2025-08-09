// 个人中心管理器
class ProfileManager {
    constructor() {
        this.userProfile = null;
        this.userStats = null;
        this.loading = false;
        this.init();
    }
    
    init() {
        this.bindEvents();
    }
    
    // 绑定事件
    bindEvents() {
        // 监听用户状态变化
        window.addEventListener('userStateChange', (e) => {
            if (e.detail.user && window.navigationManager.getCurrentScreen() === 'profile') {
                this.loadProfile();
            }
        });
        
        // 监听屏幕变化
        window.addEventListener('screenChange', (e) => {
            if (e.detail.screen === 'profile') {
                this.loadProfile();
            }
        });
    }
    
    // 加载用户资料
    async loadProfile() {
        if (this.loading) return;
        
        const container = document.getElementById('profile-content');
        if (!container) return;
        
        // 检查用户是否已登录
        if (!window.authManager.isAuthenticated()) {
            this.showLoginPrompt(container);
            return;
        }
        
        this.loading = true;
        Utils.showLoading(container, 'Loading profile...');
        
        try {
            // 并行加载用户资料和统计信息
            const [profileResult, statsResult] = await Promise.all([
                window.supabaseClient.getProfile(),
                window.supabaseClient.getUserStats()
            ]);
            
            if (profileResult.success) {
                this.userProfile = profileResult.data;
            } else {
                // 如果没有找到资料，使用默认信息
                this.userProfile = this.createDefaultProfile();
            }
            
            if (statsResult.success) {
                this.userStats = statsResult.data;
            } else {
                this.userStats = { bookshelfCount: 0, purchaseCount: 0 };
            }
            
            this.renderProfile(container);
        } catch (error) {
            console.error('Load profile error:', error);
            Utils.showError(container, 'Failed to load profile, please try again later');
        } finally {
            this.loading = false;
        }
    }
    
    // 创建默认用户资料
    createDefaultProfile() {
        const user = window.authManager.getCurrentUser();
        return {
            id: user.id,
            username: window.authManager.getUserDisplayName(),
            avatar_url: window.authManager.getUserAvatar(),
            created_at: user.created_at
        };
    }
    
    // 渲染用户资料
    renderProfile(container) {
        const user = window.authManager.getCurrentUser();
        const profileCard = this.createProfileCard();
        const statsCard = this.createStatsCard();
        const actionsCard = this.createActionsCard();
        
        container.innerHTML = '';
        container.appendChild(profileCard);
        container.appendChild(statsCard);
        container.appendChild(actionsCard);
    }
    
    // 创建用户资料卡片
    createProfileCard() {
        const card = document.createElement('div');
        card.className = 'profile-card';
        
        const user = window.authManager.getCurrentUser();
        const displayName = this.userProfile?.username || window.authManager.getUserDisplayName();
        const avatarUrl = this.userProfile?.avatar_url || window.authManager.getUserAvatar();
        const joinDate = Utils.formatDate(this.userProfile?.created_at || user.created_at);
        
        card.innerHTML = `
            <div class="profile-header">
                <div class="profile-avatar">
                    ${avatarUrl ? 
                        `<img src="${avatarUrl}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">` :
                        `<span>${displayName.charAt(0).toUpperCase()}</span>`
                    }
                </div>
                <div class="profile-info">
                    <h2>${displayName}</h2>
                    <p>${user.email}</p>
                    <p style="color: #999; font-size: 14px;">Joined: ${joinDate}</p>
                </div>
            </div>
            <div class="profile-actions">
                <button class="btn btn-outline edit-profile-btn">
                    <i class="fas fa-edit"></i>
                    <span>Edit Profile</span>
                </button>
                <button class="btn btn-outline change-password-btn">
                    <i class="fas fa-key"></i>
                    <span>Change Password</span>
                </button>
            </div>
        `;
        
        // 绑定编辑资料事件
        const editBtn = card.querySelector('.edit-profile-btn');
        editBtn.addEventListener('click', () => {
            this.showEditProfileDialog();
        });
        
        // 绑定修改密码事件
        const passwordBtn = card.querySelector('.change-password-btn');
        passwordBtn.addEventListener('click', () => {
            this.showChangePasswordDialog();
        });
        
        return card;
    }
    
    // 创建统计信息卡片
    createStatsCard() {
        const card = document.createElement('div');
        card.className = 'profile-card';
        
        card.innerHTML = `
            <h3 style="margin-bottom: 20px; color: #2C3E50;">
                <i class="fas fa-chart-line"></i>
                Reading Statistics
            </h3>
            <div class="profile-stats">
                <div class="profile-stat">
                    <div class="profile-stat-value">${this.userStats?.bookshelfCount || 0}</div>
                    <div class="profile-stat-label">Bookshelf</div>
                </div>
                <div class="profile-stat">
                    <div class="profile-stat-value">${this.userStats?.purchaseCount || 0}</div>
                    <div class="profile-stat-label">Purchased</div>
                </div>
                <div class="profile-stat">
                    <div class="profile-stat-value">${this.calculateReadingDays()}</div>
                    <div class="profile-stat-label">Reading Days</div>
                </div>
                <div class="profile-stat">
                    <div class="profile-stat-value">${this.calculateTotalChapters()}</div>
                    <div class="profile-stat-label">Chapters Read</div>
                </div>
            </div>
        `;
        
        return card;
    }
    
    // 创建操作卡片
    createActionsCard() {
        const card = document.createElement('div');
        card.className = 'profile-card';
        
        card.innerHTML = `
            <h3 style="margin-bottom: 20px; color: #2C3E50;">
                <i class="fas fa-cog"></i>
                Settings & Help
            </h3>
            <div class="profile-actions-list">
                <button class="profile-action-item reading-settings-btn">
                    <i class="fas fa-book-reader"></i>
                    <span>Reading Settings</span>
                    <i class="fas fa-chevron-right"></i>
                </button>
                <button class="profile-action-item notification-settings-btn">
                    <i class="fas fa-bell"></i>
                    <span>Notifications</span>
                    <i class="fas fa-chevron-right"></i>
                </button>
                <button class="profile-action-item help-btn">
                    <i class="fas fa-question-circle"></i>
                    <span>Help & Feedback</span>
                    <i class="fas fa-chevron-right"></i>
                </button>
                <button class="profile-action-item about-btn">
                    <i class="fas fa-info-circle"></i>
                    <span>About App</span>
                    <i class="fas fa-chevron-right"></i>
                </button>
                <button class="profile-action-item logout-btn">
                    <i class="fas fa-sign-out-alt"></i>
                    <span>Logout</span>
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;
        
        // 添加操作按钮样式
        const style = document.createElement('style');
        style.textContent = `
            .profile-actions-list {
                display: flex;
                flex-direction: column;
                gap: 1px;
                background-color: #f8f9fa;
                border-radius: 8px;
                overflow: hidden;
            }
            
            .profile-action-item {
                display: flex;
                align-items: center;
                gap: 16px;
                padding: 16px 20px;
                background-color: white;
                border: none;
                cursor: pointer;
                transition: all 0.3s ease;
                text-align: left;
                font-size: 16px;
                color: #2C3E50;
            }
            
            .profile-action-item:hover {
                background-color: #f8f9fa;
                transform: translateX(4px);
            }
            
            .profile-action-item i:first-child {
                width: 20px;
                text-align: center;
                color: #C0392B;
            }
            
            .profile-action-item span {
                flex: 1;
            }
            
            .profile-action-item i:last-child {
                color: #ccc;
                font-size: 14px;
            }
            
            .profile-action-item.logout-btn:hover {
                background-color: #fff5f5;
                color: #C0392B;
            }
        `;
        document.head.appendChild(style);
        
        // 绑定事件
        this.bindActionEvents(card);
        
        return card;
    }
    
    // 绑定操作事件
    bindActionEvents(card) {
        const readingBtn = card.querySelector('.reading-settings-btn');
        const notificationBtn = card.querySelector('.notification-settings-btn');
        const helpBtn = card.querySelector('.help-btn');
        const aboutBtn = card.querySelector('.about-btn');
        const logoutBtn = card.querySelector('.logout-btn');
        
        readingBtn.addEventListener('click', () => {
            this.showReadingSettings();
        });
        
        notificationBtn.addEventListener('click', () => {
            this.showNotificationSettings();
        });
        
        helpBtn.addEventListener('click', () => {
            this.showHelp();
        });
        
        aboutBtn.addEventListener('click', () => {
            this.showAbout();
        });
        
        logoutBtn.addEventListener('click', () => {
            window.authManager.handleLogout();
        });
    }
    
    // 显示登录提示
    showLoginPrompt(container) {
        const prompt = document.createElement('div');
        prompt.className = 'empty-state';
        prompt.innerHTML = `
            <i class="fas fa-user-lock"></i>
            <h3>Please Login First</h3>
            <p>Login to view and manage your profile</p>
            <button class="btn btn-primary" onclick="window.authManager.showAuthScreen()">
                <i class="fas fa-sign-in-alt"></i>
                <span>Login Now</span>
            </button>
        `;
        
        container.innerHTML = '';
        container.appendChild(prompt);
    }
    
    // 显示编辑资料对话框
    showEditProfileDialog() {
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        const confirmBtn = document.getElementById('modal-confirm');
        const cancelBtn = document.getElementById('modal-cancel');
        
        modalTitle.textContent = 'Edit Profile';
        modalBody.innerHTML = `
            <form id="edit-profile-form">
                <div class="form-group">
                    <label for="edit-username">Username</label>
                    <input type="text" 
                           id="edit-username" 
                           name="username" 
                           value="${this.userProfile?.username || ''}"
                           placeholder="Enter username">
                </div>
                <div class="form-group">
                    <label for="edit-avatar">Avatar URL (Optional)</label>
                    <input type="url" 
                           id="edit-avatar" 
                           name="avatar_url" 
                           value="${this.userProfile?.avatar_url || ''}"
                           placeholder="Enter avatar image URL">
                </div>
            </form>
        `;
        
        confirmBtn.textContent = 'Save';
        
        // 清除之前的事件监听器
        const newConfirmBtn = confirmBtn.cloneNode(true);
        const newCancelBtn = cancelBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        
        // 添加新的事件监听器
        newConfirmBtn.addEventListener('click', async () => {
            const form = document.getElementById('edit-profile-form');
            const formData = new FormData(form);
            const updates = {
                username: formData.get('username')?.trim() || null,
                avatar_url: formData.get('avatar_url')?.trim() || null
            };
            
            newConfirmBtn.textContent = 'Saving...';
            newConfirmBtn.disabled = true;
            
            const result = await window.supabaseClient.updateProfile(updates);
            
            if (result.success) {
                modal.classList.add('hidden');
                this.userProfile = { ...this.userProfile, ...updates };
                this.loadProfile(); // 重新加载资料
            }
            
            newConfirmBtn.textContent = 'Save';
            newConfirmBtn.disabled = false;
        });
        
        newCancelBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
        });
        
        // 显示模态框
        modal.classList.remove('hidden');
        
        // 聚焦到用户名输入框
        setTimeout(() => {
            const usernameInput = document.getElementById('edit-username');
            if (usernameInput) usernameInput.focus();
        }, 100);
    }
    
    // 显示修改密码对话框
    showChangePasswordDialog() {
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        const confirmBtn = document.getElementById('modal-confirm');
        const cancelBtn = document.getElementById('modal-cancel');
        
        modalTitle.textContent = 'Change Password';
        modalBody.innerHTML = `
            <form id="change-password-form">
                <div class="form-group">
                    <label for="new-password">New Password</label>
                    <input type="password" 
                           id="new-password" 
                           name="password" 
                           required 
                           minlength="6"
                           placeholder="Enter new password (at least 6 characters)">
                </div>
                <div class="form-group">
                    <label for="confirm-password">Confirm Password</label>
                    <input type="password" 
                           id="confirm-password" 
                           name="confirmPassword" 
                           required 
                           minlength="6"
                           placeholder="Enter new password again">
                </div>
            </form>
        `;
        
        confirmBtn.textContent = 'Change Password';
        
        // 清除之前的事件监听器
        const newConfirmBtn = confirmBtn.cloneNode(true);
        const newCancelBtn = cancelBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        
        // 添加新的事件监听器
        newConfirmBtn.addEventListener('click', async () => {
            const form = document.getElementById('change-password-form');
            const formData = new FormData(form);
            const password = formData.get('password');
            const confirmPassword = formData.get('confirmPassword');
            
            if (password !== confirmPassword) {
                Utils.showNotification('Passwords do not match', 'error');
                return;
            }
            
            if (password.length < 6) {
                Utils.showNotification('Password must be at least 6 characters', 'error');
                return;
            }
            
            newConfirmBtn.textContent = 'Changing...';
            newConfirmBtn.disabled = true;
            
            const result = await window.authManager.updatePassword(password);
            
            if (result.success) {
                modal.classList.add('hidden');
            }
            
            newConfirmBtn.textContent = 'Change Password';
            newConfirmBtn.disabled = false;
        });
        
        newCancelBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
        });
        
        // 显示模态框
        modal.classList.remove('hidden');
        
        // 聚焦到密码输入框
        setTimeout(() => {
            const passwordInput = document.getElementById('new-password');
            if (passwordInput) passwordInput.focus();
        }, 100);
    }
    
    // 显示阅读设置
    showReadingSettings() {
        window.navigationManager.showInfoDialog(
            'Reading Settings',
            'Reading settings feature is under development, stay tuned!\n\nComing soon:\n• Font size adjustment\n• Background color settings\n• Line spacing adjustment\n• Night mode'
        );
    }
    
    // 显示通知设置
    showNotificationSettings() {
        window.navigationManager.showInfoDialog(
            'Notification Settings',
            'Notification settings feature is under development, stay tuned!\n\nComing soon:\n• New chapter update reminders\n• Promotional activity notifications\n• System message push'
        );
    }
    
    // 显示帮助信息
    showHelp() {
        window.navigationManager.showInfoDialog(
            'Help & Feedback',
            `Welcome to ${CONFIG.APP_NAME}!\n\nFAQ:\n• How to add novels to bookshelf?\n  Click "Add to Bookshelf" button on novel detail page\n\n• How to purchase paid chapters?\n  Click "Purchase Novel" button on novel detail page\n\n• Forgot password?\n  Click "Forgot Password" link on login page\n\nFor more help, please contact customer service.`
        );
    }
    
    // 显示关于信息
    showAbout() {
        window.navigationManager.showInfoDialog(
            'About App',
            `${CONFIG.APP_NAME}\nVersion: 1.0.0\n\n${CONFIG.APP_DESCRIPTION}\n\nThis is an app designed specifically for reading AI-condensed Chinese web novels. We are committed to providing users with a quality reading experience, allowing you to quickly understand the exciting content of classic web novels.\n\n© 2024 ${CONFIG.APP_NAME}. All rights reserved.`
        );
    }
    
    // 计算阅读天数
    calculateReadingDays() {
        if (!this.userProfile?.created_at) return 0;
        
        const joinDate = new Date(this.userProfile.created_at);
        const today = new Date();
        const diffTime = Math.abs(today - joinDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays;
    }
    
    // 计算总阅读章节数（模拟数据）
    calculateTotalChapters() {
        const bookshelfCount = this.userStats?.bookshelfCount || 0;
        const purchaseCount = this.userStats?.purchaseCount || 0;
        
        // 模拟计算：假设每本书平均阅读20章
        return (bookshelfCount + purchaseCount) * 20;
    }
    
    // 获取用户资料
    getUserProfile() {
        return this.userProfile;
    }
    
    // 获取用户统计信息
    getUserStats() {
        return this.userStats;
    }
    
    // 刷新用户资料
    refresh() {
        this.userProfile = null;
        this.userStats = null;
        this.loadProfile();
    }
}

// 创建全局个人中心管理器实例
window.profileManager = new ProfileManager();
