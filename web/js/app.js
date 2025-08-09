// 应用主入口
class App {
    constructor() {
        this.initialized = false;
        this.managers = {};
        this.init();
    }
    
    async init() {
        try {
            console.log('Initializing ChopFiction Web App...');
            
            // 等待 DOM 加载完成
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this.initializeApp();
                });
            } else {
                this.initializeApp();
            }
            
        } catch (error) {
            console.error('App initialization error:', error);
            this.handleInitError(error);
        }
    }
    
    async initializeApp() {
        try {
            // 显示加载屏幕
            this.showLoadingScreen();
            
            // 初始化管理器
            this.initializeManagers();
            
            // 等待 Supabase 客户端初始化
            await this.waitForSupabaseClient();
            
            // 检查认证状态
            await this.checkAuthenticationState();
            
            // 初始化完成
            this.initialized = true;
            this.hideLoadingScreen();
            
            console.log('ChopFiction Web App initialized successfully');
            
            // 触发应用初始化完成事件
            window.dispatchEvent(new CustomEvent('appInitialized'));
            
        } catch (error) {
            console.error('App initialization error:', error);
            this.handleInitError(error);
        }
    }
    
    // 显示加载屏幕
    showLoadingScreen() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.remove('hidden');
        }
    }
    
    // 隐藏加载屏幕
    hideLoadingScreen() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.add('hidden');
        }
    }
    
    // 初始化管理器
    initializeManagers() {
        // 管理器应该已经通过脚本标签加载并自动初始化
        this.managers = {
            supabase: window.supabaseClient,
            auth: window.authManager,
            navigation: window.navigationManager,
            bookshelf: window.bookshelfManager,
            recommendations: window.recommendationsManager,
            categories: window.categoriesManager,
            profile: window.profileManager,
            novelDetail: window.novelDetailManager,
            reader: window.readerManager,
            modal: window.modalManager
        };
        
        // 验证所有管理器都已正确初始化
        const missingManagers = Object.entries(this.managers)
            .filter(([name, manager]) => !manager)
            .map(([name]) => name);
            
        if (missingManagers.length > 0) {
            throw new Error(`Missing managers: ${missingManagers.join(', ')}`);
        }
        
        console.log('All managers initialized successfully');
    }
    
    // 等待 Supabase 客户端初始化
    async waitForSupabaseClient() {
        let attempts = 0;
        const maxAttempts = 50; // 5秒超时
        
        while (!window.supabaseClient?.client && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.supabaseClient?.client) {
            throw new Error('Supabase client initialization timeout');
        }
        
        console.log('Supabase client ready');
    }
    
    // 检查认证状态
    async checkAuthenticationState() {
        try {
            await window.authManager.checkAuthState();
            console.log('Authentication state checked');
        } catch (error) {
            console.error('Authentication check error:', error);
            // 认证检查失败时显示登录页面
            window.authManager.showAuthScreen();
        }
    }
    
    // 处理初始化错误
    handleInitError(error) {
        console.error('Application initialization failed:', error);
        
        this.hideLoadingScreen();
        
        // 显示错误页面
        const errorHTML = `
            <div class="error-screen" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: #f8f9fa;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                text-align: center;
                padding: 20px;
            ">
                <div style="max-width: 500px;">
                    <i class="fas fa-exclamation-triangle" style="
                        font-size: 64px;
                        color: #dc3545;
                        margin-bottom: 20px;
                    "></i>
                    <h1 style="color: #2C3E50; margin-bottom: 16px;">应用初始化失败</h1>
                    <p style="color: #666; margin-bottom: 24px; line-height: 1.6;">
                        很抱歉，应用在启动过程中遇到了问题。请尝试刷新页面，如果问题持续存在，请联系技术支持。
                    </p>
                    <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                        <button onclick="location.reload()" style="
                            background: linear-gradient(135deg, #C0392B, #E74C3C);
                            color: white;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 16px;
                            font-weight: 600;
                        ">
                            <i class="fas fa-refresh"></i>
                            刷新页面
                        </button>
                        <button onclick="window.app.showErrorDetails('${error.message}')" style="
                            background: transparent;
                            color: #666;
                            border: 1px solid #ddd;
                            padding: 12px 24px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 16px;
                        ">
                            <i class="fas fa-info-circle"></i>
                            错误详情
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', errorHTML);
    }
    
    // 显示错误详情
    showErrorDetails(message) {
        alert(`错误详情：\n${message}\n\n请将此信息提供给技术支持团队。`);
    }
    
    // 获取应用状态
    getAppState() {
        return {
            initialized: this.initialized,
            user: window.authManager?.getCurrentUser(),
            currentScreen: window.navigationManager?.getCurrentScreen(),
            managers: Object.keys(this.managers)
        };
    }
    
    // 重启应用
    async restart() {
        console.log('Restarting application...');
        
        try {
            // 清理现有状态
            this.initialized = false;
            
            // 重新初始化
            await this.initializeApp();
            
            Utils.showNotification('应用已重启', 'success');
        } catch (error) {
            console.error('App restart error:', error);
            Utils.showNotification('应用重启失败', 'error');
        }
    }
    
    // 检查应用健康状态
    checkHealth() {
        const health = {
            initialized: this.initialized,
            supabaseConnected: !!window.supabaseClient?.client,
            managersLoaded: Object.keys(this.managers).length,
            userAuthenticated: window.authManager?.isAuthenticated(),
            timestamp: new Date().toISOString()
        };
        
        console.log('App health check:', health);
        return health;
    }
    
    // 添加全局错误处理
    setupGlobalErrorHandling() {
        // 捕获未处理的 Promise 拒绝
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            
            // 显示用户友好的错误消息
            if (this.initialized) {
                Utils.showNotification('操作失败，请稍后重试', 'error');
            }
            
            // 防止默认的控制台错误
            event.preventDefault();
        });
        
        // 捕获全局 JavaScript 错误
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            
            // 显示用户友好的错误消息
            if (this.initialized) {
                Utils.showNotification('发生了意外错误', 'error');
            }
        });
        
        // 捕获资源加载错误
        window.addEventListener('error', (event) => {
            if (event.target !== window && event.target.tagName) {
                console.error('Resource loading error:', event.target.src || event.target.href);
            }
        }, true);
    }
    
    // 添加性能监控
    setupPerformanceMonitoring() {
        // 监控页面加载性能
        window.addEventListener('load', () => {
            if (window.performance && window.performance.timing) {
                const timing = window.performance.timing;
                const loadTime = timing.loadEventEnd - timing.navigationStart;
                console.log(`Page load time: ${loadTime}ms`);
                
                // 如果加载时间过长，给出提示
                if (loadTime > 5000) {
                    setTimeout(() => {
                        Utils.showNotification('网络较慢，建议检查网络连接', 'warning');
                    }, 1000);
                }
            }
        });
        
        // 监控内存使用（如果支持）
        if (window.performance && window.performance.memory) {
            setInterval(() => {
                const memory = window.performance.memory;
                const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
                const totalMB = Math.round(memory.totalJSHeapSize / 1048576);
                
                // 如果内存使用过高，给出警告
                if (usedMB > 100) {
                    console.warn(`High memory usage: ${usedMB}MB / ${totalMB}MB`);
                }
            }, 30000); // 每30秒检查一次
        }
    }
    
    // 添加离线状态检测
    setupOfflineDetection() {
        const updateOnlineStatus = () => {
            if (navigator.onLine) {
                Utils.showNotification('网络连接已恢复', 'success');
            } else {
                Utils.showNotification('网络连接已断开', 'warning');
            }
        };
        
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
    }
    
    // 应用信息
    getAppInfo() {
        return {
            name: CONFIG.APP_NAME,
            description: CONFIG.APP_DESCRIPTION,
            version: '1.0.0',
            buildDate: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
    }
}

// 创建全局应用实例
window.app = new App();

// 设置全局错误处理和性能监控
window.app.setupGlobalErrorHandling();
window.app.setupPerformanceMonitoring();
window.app.setupOfflineDetection();

// 开发环境下的调试工具
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.debug = {
        app: window.app,
        config: CONFIG,
        utils: Utils,
        managers: {
            supabase: () => window.supabaseClient,
            auth: () => window.authManager,
            navigation: () => window.navigationManager,
            bookshelf: () => window.bookshelfManager,
            recommendations: () => window.recommendationsManager,
            categories: () => window.categoriesManager,
            profile: () => window.profileManager,
            novelDetail: () => window.novelDetailManager,
            reader: () => window.readerManager,
            modal: () => window.modalManager
        },
        health: () => window.app.checkHealth(),
        restart: () => window.app.restart(),
        clearStorage: () => {
            localStorage.clear();
            sessionStorage.clear();
            Utils.showNotification('存储已清空，请刷新页面', 'info');
        }
    };
    
    console.log('Debug tools available at window.debug');
    console.log('Available commands:');
    console.log('- debug.health() - Check app health');
    console.log('- debug.restart() - Restart app');
    console.log('- debug.clearStorage() - Clear all storage');
}
