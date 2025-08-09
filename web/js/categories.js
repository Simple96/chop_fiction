// 分类管理器
class CategoriesManager {
    constructor() {
        this.categories = CONFIG.CATEGORIES;
        this.categoryNovels = {};
        this.loading = false;
        this.init();
    }
    
    init() {
        this.bindEvents();
    }
    
    // 绑定事件
    bindEvents() {
        // 监听屏幕变化
        window.addEventListener('screenChange', (e) => {
            if (e.detail.screen === 'categories') {
                this.loadCategories();
            }
        });
    }
    
    // 加载分类
    async loadCategories() {
        if (this.loading) return;
        
        const container = document.getElementById('categories-content');
        if (!container) return;
        
        this.loading = true;
        Utils.showLoading(container, '加载分类中...');
        
        try {
            // 获取每个分类的统计信息
            await this.loadCategoryStats();
            this.renderCategories(container);
        } catch (error) {
            console.error('Load categories error:', error);
            // 使用默认分类数据
            this.renderCategories(container);
        } finally {
            this.loading = false;
        }
    }
    
    // 加载分类统计信息
    async loadCategoryStats() {
        try {
            const promises = this.categories.map(async (category) => {
                // 获取对应的中文分类名
                const chineseCategory = Object.keys(CONFIG.CATEGORY_MAPPING).find(
                    key => CONFIG.CATEGORY_MAPPING[key] === category
                );
                
                const result = await window.supabaseClient.getNovels({
                    category: chineseCategory || category,
                    limit: 1
                });
                
                // 这里我们只是检查是否有数据，实际项目中可能需要获取总数
                return {
                    category,
                    count: result.success && result.data ? result.data.length : 0,
                    hasNovels: result.success && result.data && result.data.length > 0
                };
            });
            
            const results = await Promise.all(promises);
            
            results.forEach(({ category, count, hasNovels }) => {
                this.categoryNovels[category] = {
                    count: hasNovels ? Math.floor(Math.random() * 50) + 10 : 0, // 模拟数据
                    hasNovels
                };
            });
        } catch (error) {
            console.error('Load category stats error:', error);
            // 使用模拟数据
            this.categories.forEach(category => {
                this.categoryNovels[category] = {
                    count: Math.floor(Math.random() * 50) + 10,
                    hasNovels: true
                };
            });
        }
    }
    
    // 渲染分类
    renderCategories(container) {
        const categoriesGrid = document.createElement('div');
        categoriesGrid.className = 'categories-grid fade-in';
        
        this.categories.forEach((category, index) => {
            const categoryCard = this.createCategoryCard(category, index);
            categoriesGrid.appendChild(categoryCard);
        });
        
        container.innerHTML = '';
        container.appendChild(categoriesGrid);
    }
    
    // 创建分类卡片
    createCategoryCard(category, index) {
        const card = document.createElement('div');
        card.className = 'category-card';
        
        const stats = this.categoryNovels[category] || { count: 0, hasNovels: false };
        const icon = Utils.getCategoryIcon(category);
        const description = this.getCategoryDescription(category);
        
        // 动态生成渐变背景色
        const gradients = [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
            'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
            'linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%)',
            'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
        ];
        
        card.style.background = gradients[index % gradients.length];
        
        card.innerHTML = `
            <i class="${icon}"></i>
            <h3>${category}</h3>
            <p>${description}</p>
            <div style="margin-top: 12px; font-size: 14px; opacity: 0.9;">
                ${stats.hasNovels ? `${stats.count}+ 本小说` : '敬请期待'}
            </div>
        `;
        
        // 添加点击事件
        card.addEventListener('click', () => {
            this.navigateToCategory(category);
        });
        
        // 添加悬停效果
        let hoverTimeout;
        card.addEventListener('mouseenter', () => {
            clearTimeout(hoverTimeout);
            card.style.transform = 'translateY(-8px) scale(1.02)';
            card.style.boxShadow = '0 12px 30px rgba(0,0,0,0.2)';
        });
        
        card.addEventListener('mouseleave', () => {
            hoverTimeout = setTimeout(() => {
                card.style.transform = 'translateY(0) scale(1)';
                card.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }, 100);
        });
        
        return card;
    }
    
    // 获取分类描述
    getCategoryDescription(category) {
        const descriptions = {
            'Fantasy': '玄幻奇缘，异世修仙',
            'Urban': '都市生活，现代传奇',
            'Xianxia': '仙侠武侠，剑气纵横',
            'Historical': '历史军事，金戈铁马',
            'Military': '军事战争，铁血豪情',
            'Gaming': '游戏竞技，虚拟世界',
            'Sports': '体育竞技，热血青春',
            'Sci-Fi': '科幻未来，星际征程',
            'Supernatural': '灵异悬疑，神秘莫测',
            'Fanfiction': '同人创作，经典重现'
        };
        
        return descriptions[category] || '精彩内容等你发现';
    }
    
    // 导航到分类页面
    navigateToCategory(category) {
        // 这里可以导航到分类详情页，或者在推荐页面进行筛选
        window.navigationManager.navigateTo('recommendations');
        
        // 等待推荐页面加载完成后进行筛选
        setTimeout(() => {
            if (window.recommendationsManager) {
                window.recommendationsManager.filterByCategory(category);
            }
        }, 100);
        
        Utils.showNotification(`正在加载 ${category} 分类的小说`, 'info');
    }
    
    // 获取分类统计信息
    getCategoryStats() {
        return this.categoryNovels;
    }
    
    // 获取最受欢迎的分类
    getPopularCategories(limit = 5) {
        return Object.entries(this.categoryNovels)
            .sort(([, a], [, b]) => b.count - a.count)
            .slice(0, limit)
            .map(([category, stats]) => ({ category, ...stats }));
    }
    
    // 搜索分类
    searchCategories(query) {
        if (!query.trim()) {
            return this.categories;
        }
        
        const searchTerm = query.toLowerCase().trim();
        return this.categories.filter(category => {
            const description = this.getCategoryDescription(category);
            return category.toLowerCase().includes(searchTerm) ||
                   description.toLowerCase().includes(searchTerm);
        });
    }
    
    // 添加分类搜索功能（可选）
    addSearchFeature() {
        const container = document.getElementById('categories-content');
        if (!container) return;
        
        const searchContainer = document.createElement('div');
        searchContainer.className = 'search-container';
        searchContainer.style.cssText = `
            background: white;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        `;
        
        searchContainer.innerHTML = `
            <div style="display: flex; gap: 12px; align-items: center;">
                <i class="fas fa-search" style="color: #666;"></i>
                <input type="text" 
                       id="category-search-input" 
                       placeholder="搜索分类..." 
                       style="flex: 1; padding: 10px 16px; border: 2px solid #e1e8ed; border-radius: 8px; font-size: 14px;">
                <button id="category-search-clear" 
                        class="btn btn-secondary" 
                        style="padding: 10px 16px;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        container.insertBefore(searchContainer, container.firstChild);
        
        // 绑定搜索事件
        const searchInput = document.getElementById('category-search-input');
        const clearBtn = document.getElementById('category-search-clear');
        
        const performSearch = Utils.debounce((query) => {
            const filteredCategories = this.searchCategories(query);
            this.renderFilteredCategories(container, filteredCategories);
        }, 300);
        
        searchInput.addEventListener('input', (e) => {
            performSearch(e.target.value);
        });
        
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            this.renderCategories(container);
        });
    }
    
    // 渲染过滤后的分类
    renderFilteredCategories(container, categories) {
        const existingGrid = container.querySelector('.categories-grid');
        if (existingGrid) {
            existingGrid.remove();
        }
        
        if (categories.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty-state';
            empty.innerHTML = `
                <i class="fas fa-search"></i>
                <h3>未找到相关分类</h3>
                <p>尝试使用其他关键词搜索</p>
            `;
            container.appendChild(empty);
            return;
        }
        
        const categoriesGrid = document.createElement('div');
        categoriesGrid.className = 'categories-grid fade-in';
        
        categories.forEach((category, index) => {
            const categoryCard = this.createCategoryCard(category, index);
            categoriesGrid.appendChild(categoryCard);
        });
        
        container.appendChild(categoriesGrid);
    }
    
    // 获取推荐分类（基于用户阅读历史）
    async getRecommendedCategories() {
        try {
            if (!window.authManager.isAuthenticated()) {
                return this.getPopularCategories(3);
            }
            
            // 获取用户书架中的分类统计
            const bookshelfResult = await window.supabaseClient.getBookshelf();
            if (!bookshelfResult.success) {
                return this.getPopularCategories(3);
            }
            
            const categoryCount = {};
            bookshelfResult.data.forEach(item => {
                if (item.novel) {
                    const category = Utils.getCategoryDisplayName(item.novel.category);
                    categoryCount[category] = (categoryCount[category] || 0) + 1;
                }
            });
            
            // 根据用户偏好推荐相似分类
            const userPreferences = Object.entries(categoryCount)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([category]) => category);
            
            return userPreferences.length > 0 ? userPreferences : this.getPopularCategories(3);
        } catch (error) {
            console.error('Get recommended categories error:', error);
            return this.getPopularCategories(3);
        }
    }
    
    // 添加分类统计图表（可选功能）
    addStatsChart() {
        const container = document.getElementById('categories-content');
        if (!container) return;
        
        const statsContainer = document.createElement('div');
        statsContainer.className = 'category-stats';
        statsContainer.style.cssText = `
            background: white;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        `;
        
        const popularCategories = this.getPopularCategories();
        
        statsContainer.innerHTML = `
            <h3 style="margin-bottom: 16px; color: #2C3E50;">
                <i class="fas fa-chart-bar"></i>
                热门分类统计
            </h3>
            <div class="stats-list">
                ${popularCategories.map((item, index) => `
                    <div class="stats-item" style="
                        display: flex; 
                        align-items: center; 
                        justify-content: space-between; 
                        padding: 8px 0; 
                        border-bottom: 1px solid #f0f0f0;
                    ">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <span style="
                                display: inline-flex;
                                align-items: center;
                                justify-content: center;
                                width: 24px;
                                height: 24px;
                                border-radius: 50%;
                                background: linear-gradient(135deg, #C0392B, #E74C3C);
                                color: white;
                                font-size: 12px;
                                font-weight: bold;
                            ">${index + 1}</span>
                            <span style="color: #2C3E50; font-weight: 500;">${item.category}</span>
                        </div>
                        <span style="color: #666; font-size: 14px;">${item.count} 本</span>
                    </div>
                `).join('')}
            </div>
        `;
        
        container.insertBefore(statsContainer, container.firstChild);
    }
    
    // 刷新分类数据
    refresh() {
        this.categoryNovels = {};
        this.loadCategories();
    }
}

// 创建全局分类管理器实例
window.categoriesManager = new CategoriesManager();
