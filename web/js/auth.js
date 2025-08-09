// 认证管理器
class AuthManager {
    constructor() {
        this.user = null;
        this.session = null;
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.checkAuthState();
    }
    
    // 绑定事件
    bindEvents() {
        // 登录表单
        const loginForm = document.getElementById('login-form-element');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin(e);
            });
        }
        
        // 注册表单
        const registerForm = document.getElementById('register-form-element');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister(e);
            });
        }
        
        // 切换登录/注册表单
        const showRegisterBtn = document.getElementById('show-register');
        const showLoginBtn = document.getElementById('show-login');
        
        if (showRegisterBtn) {
            showRegisterBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showRegisterForm();
            });
        }
        
        if (showLoginBtn) {
            showLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLoginForm();
            });
        }
        
        // 登出按钮
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        }
        
        // 监听认证状态变化
        window.addEventListener('authStateChange', (e) => {
            const { event, session, user } = e.detail;
            this.handleAuthStateChange(event, session, user);
        });
        
        // Enter 键快捷登录
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.closest('.auth-form')) {
                const form = e.target.closest('form');
                if (form) {
                    form.dispatchEvent(new Event('submit'));
                }
            }
        });
    }
    
    // 检查认证状态
    async checkAuthState() {
        try {
            const { session, user } = await window.supabaseClient.getSession();
            this.session = session;
            this.user = user;
            
            if (user) {
                this.showMainApp();
            } else {
                this.showAuthScreen();
            }
        } catch (error) {
            console.error('Check auth state error:', error);
            this.showAuthScreen();
        }
    }
    
    // 处理登录
    async handleLogin(e) {
        const form = e.target;
        const formData = new FormData(form);
        const email = formData.get('email').trim();
        const password = formData.get('password');
        
        // 表单验证
        if (!this.validateEmail(email)) {
            Utils.showNotification('请输入有效的邮箱地址', 'error');
            return;
        }
        
        if (!password || password.length < 6) {
            Utils.showNotification('密码至少需要6个字符', 'error');
            return;
        }
        
        // 显示加载状态
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '登录中...';
        submitBtn.disabled = true;
        
        try {
            const result = await window.supabaseClient.signIn(email, password);
            
            if (result.success) {
                // 登录成功，状态变化会通过事件处理
                form.reset();
            }
        } catch (error) {
            console.error('Login error:', error);
        } finally {
            // 恢复按钮状态
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }
    
    // 处理注册
    async handleRegister(e) {
        const form = e.target;
        const formData = new FormData(form);
        const email = formData.get('email').trim();
        const password = formData.get('password');
        const username = formData.get('username')?.trim() || null;
        
        // 表单验证
        if (!this.validateEmail(email)) {
            Utils.showNotification('请输入有效的邮箱地址', 'error');
            return;
        }
        
        if (!password || password.length < 6) {
            Utils.showNotification('密码至少需要6个字符', 'error');
            return;
        }
        
        // 显示加载状态
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '注册中...';
        submitBtn.disabled = true;
        
        try {
            const result = await window.supabaseClient.signUp(email, password, username);
            
            if (result.success) {
                form.reset();
                // 显示验证邮箱提示
                this.showEmailVerificationMessage(email);
            }
        } catch (error) {
            console.error('Register error:', error);
        } finally {
            // 恢复按钮状态
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }
    
    // 处理登出
    async handleLogout() {
        // 显示确认对话框
        window.navigationManager.showConfirmDialog(
            '确认退出',
            '您确定要退出登录吗？',
            async () => {
                try {
                    await window.supabaseClient.signOut();
                } catch (error) {
                    console.error('Logout error:', error);
                }
            }
        );
    }
    
    // 处理认证状态变化
    handleAuthStateChange(event, session, user) {
        console.log('Auth state changed:', event, user);
        
        this.session = session;
        this.user = user;
        
        if (event === 'SIGNED_IN' && user) {
            this.showMainApp();
        } else if (event === 'SIGNED_OUT' || !user) {
            this.showAuthScreen();
        }
        
        // 触发用户状态变化事件
        window.dispatchEvent(new CustomEvent('userStateChange', {
            detail: { user, session }
        }));
    }
    
    // 显示主应用
    showMainApp() {
        const authScreen = document.getElementById('auth-screen');
        const mainApp = document.getElementById('main-app');
        const loading = document.getElementById('loading');
        
        if (authScreen) authScreen.classList.add('hidden');
        if (loading) loading.classList.add('hidden');
        if (mainApp) {
            mainApp.classList.remove('hidden');
            // 初始化路由
            window.navigationManager.initFromUrl();
        }
        
        // 设置页面标题
        window.navigationManager.setPageTitle('');
    }
    
    // 显示认证屏幕
    showAuthScreen() {
        const authScreen = document.getElementById('auth-screen');
        const mainApp = document.getElementById('main-app');
        const loading = document.getElementById('loading');
        
        if (mainApp) mainApp.classList.add('hidden');
        if (loading) loading.classList.add('hidden');
        if (authScreen) {
            authScreen.classList.remove('hidden');
            // 默认显示登录表单
            this.showLoginForm();
        }
        
        // 设置页面标题
        document.title = `登录 - ${CONFIG.APP_NAME}`;
    }
    
    // 显示登录表单
    showLoginForm() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        
        if (loginForm) {
            loginForm.classList.add('active');
            // 聚焦到邮箱输入框
            const emailInput = loginForm.querySelector('input[type="email"]');
            if (emailInput) {
                setTimeout(() => emailInput.focus(), 100);
            }
        }
        if (registerForm) registerForm.classList.remove('active');
        
        document.title = `登录 - ${CONFIG.APP_NAME}`;
    }
    
    // 显示注册表单
    showRegisterForm() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        
        if (registerForm) {
            registerForm.classList.add('active');
            // 聚焦到邮箱输入框
            const emailInput = registerForm.querySelector('input[type="email"]');
            if (emailInput) {
                setTimeout(() => emailInput.focus(), 100);
            }
        }
        if (loginForm) loginForm.classList.remove('active');
        
        document.title = `注册 - ${CONFIG.APP_NAME}`;
    }
    
    // 显示邮箱验证消息
    showEmailVerificationMessage(email) {
        window.navigationManager.showInfoDialog(
            'Verify Email',
            `We've sent a verification email to ${email}. Please click the link in the email to complete your registration. If you don't see the email, please check your spam folder.`,
            () => {
                this.showLoginForm();
            }
        );
    }
    
    // 邮箱格式验证
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // 获取当前用户
    getCurrentUser() {
        return this.user;
    }
    
    // 获取当前会话
    getCurrentSession() {
        return this.session;
    }
    
    // 检查是否已登录
    isAuthenticated() {
        return !!this.user;
    }
    
    // 获取用户显示名称
    getUserDisplayName() {
        if (!this.user) return '';
        
        const profile = this.user.user_metadata;
        return profile?.username || 
               profile?.full_name || 
               this.user.email?.split('@')[0] || 
               '用户';
    }
    
    // 获取用户头像
    getUserAvatar() {
        if (!this.user) return null;
        
        const profile = this.user.user_metadata;
        return profile?.avatar_url || null;
    }
    
    // 密码重置
    async resetPassword(email) {
        try {
            const { error } = await window.supabaseClient.client.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}#reset-password`
            });
            
            if (error) throw error;
            
            Utils.showNotification('密码重置邮件已发送', 'success');
            return { success: true };
        } catch (error) {
            console.error('Reset password error:', error);
            Utils.showNotification('发送重置邮件失败', 'error');
            return { success: false, error };
        }
    }
    
    // 更新密码
    async updatePassword(newPassword) {
        try {
            const { error } = await window.supabaseClient.client.auth.updateUser({
                password: newPassword
            });
            
            if (error) throw error;
            
            Utils.showNotification('密码更新成功', 'success');
            return { success: true };
        } catch (error) {
            console.error('Update password error:', error);
            Utils.showNotification('密码更新失败', 'error');
            return { success: false, error };
        }
    }
    
    // 添加密码重置表单（可选功能）
    showPasswordResetForm() {
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        const confirmBtn = document.getElementById('modal-confirm');
        const cancelBtn = document.getElementById('modal-cancel');
        
        modalTitle.textContent = '重置密码';
        modalBody.innerHTML = `
            <form id="reset-password-form">
                <div class="form-group">
                    <label for="reset-email">邮箱地址</label>
                    <input type="email" id="reset-email" name="email" required>
                </div>
            </form>
        `;
        
        confirmBtn.textContent = '发送重置邮件';
        
        // 清除之前的事件监听器
        const newConfirmBtn = confirmBtn.cloneNode(true);
        const newCancelBtn = cancelBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        
        // 添加新的事件监听器
        newConfirmBtn.addEventListener('click', async () => {
            const form = document.getElementById('reset-password-form');
            const formData = new FormData(form);
            const email = formData.get('email').trim();
            
            if (!this.validateEmail(email)) {
                Utils.showNotification('请输入有效的邮箱地址', 'error');
                return;
            }
            
            newConfirmBtn.textContent = '发送中...';
            newConfirmBtn.disabled = true;
            
            const result = await this.resetPassword(email);
            
            if (result.success) {
                modal.classList.add('hidden');
            }
            
            newConfirmBtn.textContent = '发送重置邮件';
            newConfirmBtn.disabled = false;
        });
        
        newCancelBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
        });
        
        // 显示模态框
        modal.classList.remove('hidden');
        
        // 聚焦到邮箱输入框
        setTimeout(() => {
            const emailInput = document.getElementById('reset-email');
            if (emailInput) emailInput.focus();
        }, 100);
    }
}

// 创建全局认证管理器实例
window.authManager = new AuthManager();
