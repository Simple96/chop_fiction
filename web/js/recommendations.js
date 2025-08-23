// 推荐管理器
class RecommendationsManager {
    constructor() {
        this.novels = [];
        this.loading = false;
        this.currentPage = 1;
        this.hasMore = true;
        this.init();
    }
    
    init() {
        this.bindEvents();
    }
    
    // 绑定事件
    bindEvents() {
        // 监听屏幕变化
        window.addEventListener('screenChange', (e) => {
            if (e.detail.screen === 'recommendations') {
                this.loadRecommendations();
            }
        });
        
        // 滚动加载更多
        window.addEventListener('scroll', Utils.throttle(() => {
            if (window.navigationManager.getCurrentScreen() === 'recommendations') {
                this.handleScroll();
            }
        }, 200));
    }
    
    // 加载推荐
    async loadRecommendations(reset = true) {
        if (this.loading) return;
        
        const container = document.getElementById('recommendations-content');
        if (!container) return;
        
        if (reset) {
            this.currentPage = 1;
            this.hasMore = true;
            this.novels = [];
        }
        
        this.loading = true;
        
        if (reset) {
            Utils.showLoading(container, 'Loading recommendations...');
        }
        
        try {
            const result = await window.supabaseClient.getNovels({
                orderBy: 'created_at',
                ascending: false,
                limit: CONFIG.ITEMS_PER_PAGE,
                offset: (this.currentPage - 1) * CONFIG.ITEMS_PER_PAGE
            });
            
            if (result.success) {
                const newNovels = result.data || [];
                
                if (reset) {
                    this.novels = newNovels;
                } else {
                    this.novels.push(...newNovels);
                }
                
                this.hasMore = newNovels.length === CONFIG.ITEMS_PER_PAGE;
                this.renderRecommendations(container, reset);
                
                if (newNovels.length > 0) {
                    this.currentPage++;
                }
            } else {
                throw result.error;
            }
        } catch (error) {
            console.error('Load recommendations error:', error);
            
            // 网络连接问题时显示错误
            Utils.showError(container, 'Network connection failed. Please check your internet connection and try again.');
            this.novels = [];
            this.hasMore = false;
        } finally {
            this.loading = false;
        }
    }
    

    
    // 渲染推荐
    renderRecommendations(container, reset = true) {
        if (this.novels.length === 0) {
            Utils.showEmpty(
                container, 
                'No recommendations available', 
                'Please try again later or contact administrator'
            );
            return;
        }
        
        let booksGrid;
        
        if (reset) {
            booksGrid = document.createElement('div');
            booksGrid.className = 'books-grid';
            container.innerHTML = '';
            container.appendChild(booksGrid);
        } else {
            booksGrid = container.querySelector('.books-grid');
            if (!booksGrid) {
                booksGrid = document.createElement('div');
                booksGrid.className = 'books-grid';
                container.appendChild(booksGrid);
            }
        }
        
        // 渲染新小说
        const startIndex = reset ? 0 : this.novels.length - CONFIG.ITEMS_PER_PAGE;
        const endIndex = this.novels.length;
        
        for (let i = Math.max(0, startIndex); i < endIndex; i++) {
            const novel = this.novels[i];
            const bookCard = this.createBookCard(novel, i);
            booksGrid.appendChild(bookCard);
        }
        
        // 添加加载更多按钮或提示
        this.updateLoadMoreStatus(container);
    }
    
    // 创建书籍卡片
    createBookCard(novel, index) {
        const card = document.createElement('div');
        card.className = 'book-card';
        
        // 计算免费章节百分比
        const freePercentage = novel.total_chapters > 0 
            ? Math.round((novel.free_chapters / novel.total_chapters) * 100)
            : 0;
        
        card.innerHTML = `
            <img src="${novel.cover_image || 'https://via.placeholder.com/100x150?text=暂无封面'}" 
                 alt="${novel.title}" 
                 class="book-cover"
                 onerror="Utils.handleImageError(this)">
            <div class="book-info">
                <h3 class="book-title" title="${novel.title}">${novel.title}</h3>
                <p class="book-author">Author: ${novel.author}</p>
                <p class="book-description">${Utils.truncateText(novel.description, 100)}</p>
                <div class="book-meta">
                    <span class="book-category">${Utils.getCategoryDisplayName(novel.category)}</span>
                    <span class="book-chapters">${novel.total_chapters} chapters</span>
                    <span class="book-chapters">First ${freePercentage}% free</span>
    
                </div>
            </div>
        `;
        
        // 添加点击事件
        card.addEventListener('click', () => {
            window.navigationManager.navigateToNovelDetail(novel, false);
        });
        
        // 添加悬停效果
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-4px)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
        });
        
        return card;
    }
    
    // 更新加载更多状态
    updateLoadMoreStatus(container) {
        // 移除旧的加载更多元素
        const oldLoadMore = container.querySelector('.load-more-container');
        if (oldLoadMore) {
            oldLoadMore.remove();
        }
        
        const loadMoreContainer = document.createElement('div');
        loadMoreContainer.className = 'load-more-container';
        loadMoreContainer.style.cssText = `
            text-align: center;
            padding: 30px 20px;
            margin-top: 20px;
        `;
        
        if (this.hasMore) {
            loadMoreContainer.innerHTML = `
                <button class="btn btn-outline load-more-btn">
                    <i class="fas fa-plus"></i>
                    <span>Load More</span>
                </button>
                <p style="margin-top: 10px; color: #666; font-size: 14px;">
                    Or scroll down to auto-load
                </p>
            `;
            
            const loadMoreBtn = loadMoreContainer.querySelector('.load-more-btn');
            loadMoreBtn.addEventListener('click', () => {
                this.loadRecommendations(false);
            });
        } else {
            loadMoreContainer.innerHTML = `
                <p style="color: #666; font-size: 14px;">
                    <i class="fas fa-check-circle"></i>
                    All recommendations loaded
                </p>
            `;
        }
        
        container.appendChild(loadMoreContainer);
    }
    
    // 处理滚动事件
    handleScroll() {
        if (!this.hasMore || this.loading) return;
        
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        
        // 距离底部200px时开始加载
        if (scrollTop + windowHeight >= documentHeight - 200) {
            this.loadRecommendations(false);
        }
    }
    
    // 搜索推荐
    async searchNovels(query, category = null) {
        if (this.loading) return;
        
        const container = document.getElementById('recommendations-content');
        if (!container) return;
        
        this.loading = true;
        Utils.showLoading(container, 'Searching...');
        
        try {
            const options = {
                orderBy: 'created_at',
                ascending: false,
                limit: CONFIG.ITEMS_PER_PAGE
            };
            
            if (query?.trim()) {
                options.search = query.trim();
            }
            
            if (category && category !== 'all') {
                options.category = category;
            }
            
            const result = await window.supabaseClient.getNovels(options);
            
            if (result.success) {
                this.novels = result.data || [];
                this.hasMore = false; // 搜索结果不支持分页
                this.renderRecommendations(container, true);
                
                if (this.novels.length === 0) {
                    Utils.showEmpty(
                        container,
                        'No novels found',
                        'Try searching with different keywords'
                    );
                }
            } else {
                throw result.error;
            }
        } catch (error) {
            console.error('Search novels error:', error);
            Utils.showError(container, 'Search failed, please try again later');
        } finally {
            this.loading = false;
        }
    }
    
    // 按分类筛选
    async filterByCategory(category) {
        await this.searchNovels(null, category);
    }
    
    // 获取热门推荐
    async getPopularNovels() {
        try {
            const result = await window.supabaseClient.getNovels({
                orderBy: 'created_at', // 可以根据实际需求改为点击量、评分等
                ascending: false,
                limit: 10
            });
            
            if (result.success) {
                return result.data || [];
            }
            return [];
        } catch (error) {
            console.error('Get popular novels error:', error);
            return [];
        }
    }
    
    // 获取最新推荐
    async getLatestNovels() {
        try {
            const result = await window.supabaseClient.getNovels({
                orderBy: 'created_at',
                ascending: false,
                limit: 10
            });
            
            if (result.success) {
                return result.data || [];
            }
            return [];
        } catch (error) {
            console.error('Get latest novels error:', error);
            return [];
        }
    }
    
    // 获取分类统计
    getCategoryStats() {
        const stats = {};
        
        this.novels.forEach(novel => {
            const category = Utils.getCategoryDisplayName(novel.category);
            stats[category] = (stats[category] || 0) + 1;
        });
        
        return stats;
    }
    
    // 重置推荐列表
    reset() {
        this.novels = [];
        this.currentPage = 1;
        this.hasMore = true;
        this.loading = false;
    }
    
    // 刷新推荐
    refresh() {
        this.reset();
        this.loadRecommendations(true);
    }
    
    // 添加搜索功能到页面（可选）
    addSearchFeature() {
        const container = document.getElementById('recommendations-content');
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
            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                <input type="text" 
                       id="search-input" 
                       placeholder="搜索小说标题、作者..." 
                       style="flex: 1; min-width: 200px; padding: 10px 16px; border: 2px solid #e1e8ed; border-radius: 8px; font-size: 14px;">
                <select id="category-filter" 
                        style="padding: 10px 16px; border: 2px solid #e1e8ed; border-radius: 8px; font-size: 14px;">
                    <option value="all">所有分类</option>
                    ${CONFIG.CATEGORIES.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                </select>
                <button id="search-btn" class="btn btn-primary" style="padding: 10px 20px;">
                    <i class="fas fa-search"></i>
                    <span>搜索</span>
                </button>
                <button id="reset-btn" class="btn btn-secondary" style="padding: 10px 20px;">
                    <i class="fas fa-refresh"></i>
                    <span>重置</span>
                </button>
            </div>
        `;
        
        container.insertBefore(searchContainer, container.firstChild);
        
        // 绑定搜索事件
        const searchInput = document.getElementById('search-input');
        const categoryFilter = document.getElementById('category-filter');
        const searchBtn = document.getElementById('search-btn');
        const resetBtn = document.getElementById('reset-btn');
        
        const performSearch = () => {
            const query = searchInput.value.trim();
            const category = categoryFilter.value === 'all' ? null : categoryFilter.value;
            this.searchNovels(query, category);
        };
        
        searchBtn.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSearch();
        });
        
        resetBtn.addEventListener('click', () => {
            searchInput.value = '';
            categoryFilter.value = 'all';
            this.refresh();
        });
    }
}

// 创建全局推荐管理器实例
window.recommendationsManager = new RecommendationsManager();
