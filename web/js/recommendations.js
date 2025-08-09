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
            Utils.showLoading(container, '加载推荐中...');
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
            
            // 如果是第一次加载失败，显示模拟数据
            if (reset && this.novels.length === 0) {
                this.loadMockData();
                this.renderRecommendations(container, true);
                Utils.showNotification('正在使用演示数据', 'info');
            } else {
                Utils.showError(container, '加载推荐失败，请稍后重试');
            }
        } finally {
            this.loading = false;
        }
    }
    
    // 加载模拟数据
    loadMockData() {
        this.novels = [
            {
                id: '1',
                title: '斗破苍穹（缩写版）',
                author: '天蚕土豆',
                description: '少年萧炎在家族中被视为废物，但在获得神秘戒指后开始崛起。这是原版小说的AI缩写版本，保留了精彩剧情的同时大大缩短了篇幅。',
                cover_image: 'https://via.placeholder.com/100x150?text=斗破苍穹',
                category: '玄幻',
                original_language: 'zh-CN',
                translated_language: 'en',
                total_chapters: 50,
                free_chapters: 12,
                price: 9.99,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: '2',
                title: '完美世界（缩写版）',
                author: '辰东',
                description: '一个少年从大荒中走出，踏上修炼之路。AI精心缩写，将数百万字的内容压缩为精华版本。',
                cover_image: 'https://via.placeholder.com/100x150?text=完美世界',
                category: '玄幻',
                original_language: 'zh-CN',
                translated_language: 'en',
                total_chapters: 45,
                free_chapters: 11,
                price: 8.99,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: '3',
                title: '凡人修仙传（缩写版）',
                author: '忘语',
                description: '一个普通的山村穷小子，偶然之下，跨入到一个江湖小门派。AI智能缩写，让你快速体验修仙之路。',
                cover_image: 'https://via.placeholder.com/100x150?text=凡人修仙传',
                category: '仙侠',
                original_language: 'zh-CN',
                translated_language: 'en',
                total_chapters: 40,
                free_chapters: 10,
                price: 7.99,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: '4',
                title: '遮天（缩写版）',
                author: '辰东',
                description: '冰冷与黑暗并存的宇宙深处，九具庞大的龙尸拉着一口青铜古棺，亘古长存。AI缩写经典，精彩不减。',
                cover_image: 'https://via.placeholder.com/100x150?text=遮天',
                category: '玄幻',
                original_language: 'zh-CN',
                translated_language: 'en',
                total_chapters: 55,
                free_chapters: 14,
                price: 10.99,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: '5',
                title: '诛仙（缩写版）',
                author: '萧鼎',
                description: '草庙村少年张小凡，经历家门血案后被青云门收为弟子。AI重新演绎经典仙侠故事。',
                cover_image: 'https://via.placeholder.com/100x150?text=诛仙',
                category: '仙侠',
                original_language: 'zh-CN',
                translated_language: 'en',
                total_chapters: 35,
                free_chapters: 9,
                price: 6.99,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: '6',
                title: '全职高手（缩写版）',
                author: '蝴蝶蓝',
                description: '网游荣耀中被誉为教科书级别的顶尖高手叶修，因为种种原因遭到俱乐部的驱逐。AI缩写电竞经典。',
                cover_image: 'https://via.placeholder.com/100x150?text=全职高手',
                category: '游戏',
                original_language: 'zh-CN',
                translated_language: 'en',
                total_chapters: 42,
                free_chapters: 11,
                price: 8.99,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        ];
        this.hasMore = false;
    }
    
    // 渲染推荐
    renderRecommendations(container, reset = true) {
        if (this.novels.length === 0) {
            Utils.showEmpty(
                container, 
                '暂无推荐内容', 
                '请稍后再试或联系管理员'
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
                <p class="book-author">作者：${novel.author}</p>
                <p class="book-description">${Utils.truncateText(novel.description, 100)}</p>
                <div class="book-meta">
                    <span class="book-category">${Utils.getCategoryDisplayName(novel.category)}</span>
                    <span class="book-chapters">${novel.total_chapters} 章</span>
                    <span class="book-chapters">前${freePercentage}%免费</span>
                    ${novel.price > 0 ? `<span class="book-price">${Utils.formatPrice(novel.price)}</span>` : ''}
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
                    <span>加载更多</span>
                </button>
                <p style="margin-top: 10px; color: #666; font-size: 14px;">
                    或向下滚动自动加载
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
                    已显示全部推荐内容
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
        Utils.showLoading(container, '搜索中...');
        
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
                        '未找到相关小说',
                        '尝试使用其他关键词搜索'
                    );
                }
            } else {
                throw result.error;
            }
        } catch (error) {
            console.error('Search novels error:', error);
            Utils.showError(container, '搜索失败，请稍后重试');
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
