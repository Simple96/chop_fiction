// 导航管理器
class NavigationManager {
    constructor() {
        this.currentScreen = 'bookshelf';
        this.screenHistory = [];
        this.novelDetailData = null;
        this.readerData = null;
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.updateActiveNav();
    }
    
    // 绑定事件
    bindEvents() {
        // 导航菜单点击事件
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const screen = item.getAttribute('data-screen');
                if (screen) {
                    this.navigateTo(screen);
                }
            });
        });
        
        // 返回按钮事件
        const backToMainBtn = document.getElementById('back-to-main');
        if (backToMainBtn) {
            backToMainBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateBack();
            });
        }
        
        const backToDetailBtn = document.getElementById('back-to-detail');
        if (backToDetailBtn) {
            backToDetailBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateToNovelDetail(this.readerData?.novel);
            });
        }
        
        // 浏览器后退按钮支持
        window.addEventListener('popstate', (e) => {
            const state = e.state;
            if (state && state.screen) {
                this.navigateTo(state.screen, state.data, false);
            }
        });
        
        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            // ESC 键返回
            if (e.key === 'Escape') {
                this.navigateBack();
            }
            
            // 阅读器中的快捷键
            if (this.currentScreen === 'reader') {
                if (e.key === 'ArrowLeft' && e.ctrlKey) {
                    e.preventDefault();
                    this.previousChapter();
                }
                if (e.key === 'ArrowRight' && e.ctrlKey) {
                    e.preventDefault();
                    this.nextChapter();
                }
            }
        });
    }
    
    // 导航到指定屏幕
    navigateTo(screenName, data = null, pushState = true) {
        // 隐藏所有屏幕
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => {
            screen.classList.remove('active');
        });
        
        // 显示目标屏幕
        const targetScreen = document.getElementById(`${screenName}-screen`);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
        
        // 更新当前屏幕
        const previousScreen = this.currentScreen;
        this.currentScreen = screenName;
        
        // 更新历史记录
        if (previousScreen !== screenName) {
            this.screenHistory.push(previousScreen);
            // 限制历史记录长度
            if (this.screenHistory.length > 10) {
                this.screenHistory.shift();
            }
        }
        
        // 更新浏览器历史
        if (pushState) {
            const state = { screen: screenName, data };
            const url = `#${screenName}`;
            history.pushState(state, '', url);
        }
        
        // 更新导航栏状态
        this.updateActiveNav();
        
        // 加载屏幕内容
        this.loadScreenContent(screenName, data);
        
        // 触发屏幕变化事件
        window.dispatchEvent(new CustomEvent('screenChange', {
            detail: { screen: screenName, data }
        }));
    }
    
    // 兼容旧代码的别名方法
    // 有些地方调用了 switchScreen，这里做一个简单代理
    switchScreen(screenName, data = null) {
        this.navigateTo(screenName, data);
    }
    
    // 返回上一个屏幕
    navigateBack() {
        if (this.screenHistory.length > 0) {
            const previousScreen = this.screenHistory.pop();
            this.navigateTo(previousScreen, null, false);
        } else {
            // 默认返回书架
            this.navigateTo('bookshelf', null, false);
        }
    }
    
    // 导航到小说详情页
    navigateToNovelDetail(novel, isInBookshelf = false) {
        this.novelDetailData = { novel, isInBookshelf };
        this.navigateTo('novel-detail', this.novelDetailData);
    }
    
    // 导航到阅读器
    navigateToReader(novel, chapterNumber = 1) {
        this.readerData = { novel, chapterNumber };
        this.navigateTo('reader', this.readerData);
    }
    
    // 上一章
    async previousChapter() {
        if (!this.readerData) return;
        
        const { novel, chapterNumber } = this.readerData;
        const prevChapter = chapterNumber - 1;
        
        if (prevChapter < 1) {
            Utils.showNotification('Already at the first chapter', 'info');
            return;
        }
        
        this.navigateToReader(novel, prevChapter);
    }
    
    // 下一章
    async nextChapter() {
        if (!this.readerData) return;
        
        const { novel, chapterNumber } = this.readerData;
        const nextChapter = chapterNumber + 1;
        
        if (nextChapter > novel.total_chapters) {
            Utils.showNotification('Already at the last chapter', 'info');
            return;
        }
        
        this.navigateToReader(novel, nextChapter);
    }
    
    // 更新导航栏活跃状态
    updateActiveNav() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            const screen = item.getAttribute('data-screen');
            if (screen === this.currentScreen) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        // 更新导航栏显示状态
        const navbar = document.getElementById('navbar');
        const isMainScreen = ['bookshelf', 'recommendations', 'categories', 'profile'].includes(this.currentScreen);
        
        if (isMainScreen) {
            navbar.style.display = 'flex';
        } else {
            // 详情页和阅读器页面可以选择隐藏导航栏
            // navbar.style.display = 'none';
        }
    }
    
    // 加载屏幕内容
    loadScreenContent(screenName, data) {
        switch (screenName) {
            case 'bookshelf':
                if (window.bookshelfManager) {
                    window.bookshelfManager.loadBookshelf();
                }
                break;
                
            case 'recommendations':
                if (window.recommendationsManager) {
                    window.recommendationsManager.loadRecommendations();
                }
                break;
                
            case 'categories':
                if (window.categoriesManager) {
                    window.categoriesManager.loadCategories();
                }
                break;
                
            case 'profile':
                if (window.profileManager) {
                    window.profileManager.loadProfile();
                }
                break;
                
            case 'novel-detail':
                if (window.novelDetailManager && data) {
                    window.novelDetailManager.loadNovelDetail(data.novel, data.isInBookshelf);
                }
                break;
                
            case 'reader':
                if (window.readerManager && data) {
                    window.readerManager.loadChapter(data.novel, data.chapterNumber);
                }
                break;
        }
    }
    
    // 获取当前屏幕
    getCurrentScreen() {
        return this.currentScreen;
    }
    
    // 获取当前屏幕数据
    getCurrentScreenData() {
        switch (this.currentScreen) {
            case 'novel-detail':
                return this.novelDetailData;
            case 'reader':
                return this.readerData;
            default:
                return null;
        }
    }
    
    // 设置页面标题
    setPageTitle(title) {
        document.title = title ? `${title} - ${CONFIG.APP_NAME}` : CONFIG.APP_NAME;
    }
    
    // 从 URL 初始化路由
    initFromUrl() {
        const hash = window.location.hash.slice(1);
        if (hash && ['bookshelf', 'recommendations', 'categories', 'profile'].includes(hash)) {
            this.navigateTo(hash, null, false);
        } else {
            this.navigateTo('bookshelf', null, false);
        }
    }
    
    // 显示确认对话框
    showConfirmDialog(title, message, onConfirm, onCancel) {
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        const confirmBtn = document.getElementById('modal-confirm');
        const cancelBtn = document.getElementById('modal-cancel');
        
        modalTitle.textContent = title;
        modalBody.innerHTML = `<p>${message}</p>`;
        
        // 清除之前的事件监听器
        const newConfirmBtn = confirmBtn.cloneNode(true);
        const newCancelBtn = cancelBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        
        // 添加新的事件监听器
        newConfirmBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
            if (onConfirm) onConfirm();
        });
        
        newCancelBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
            if (onCancel) onCancel();
        });
        
        // 显示模态框
        modal.classList.remove('hidden');
    }
    
    // 显示信息对话框
    showInfoDialog(title, message, onClose) {
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        const confirmBtn = document.getElementById('modal-confirm');
        const cancelBtn = document.getElementById('modal-cancel');
        
        modalTitle.textContent = title;
        modalBody.innerHTML = `<p>${message}</p>`;
        
        // 隐藏取消按钮
        cancelBtn.style.display = 'none';
        confirmBtn.textContent = 'OK';
        
        // 清除之前的事件监听器
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        // 添加新的事件监听器
        newConfirmBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
            cancelBtn.style.display = 'inline-block';
            confirmBtn.textContent = 'Confirm';
            if (onClose) onClose();
        });
        
        // 显示模态框
        modal.classList.remove('hidden');
    }
}

// 创建全局导航管理器实例
window.navigationManager = new NavigationManager();
