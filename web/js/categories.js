// 分类管理器
class CategoriesManager {
    constructor() {
        this.categories = CONFIG.CATEGORIES;
        this.currentCategory = this.categories[0]; // 默认选择第一个分类
        this.categoryNovels = {};
        this.currentNovels = [];
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
            if (e.detail.screen === 'categories') {
                this.loadCategories();
            }
        });
        
        // 监听滚动事件用于无限加载
        window.addEventListener('scroll', Utils.throttle(() => {
            if (window.navigationManager.getCurrentScreen() === 'categories') {
                this.handleScroll();
            }
        }, 200));
    }
    
    // 加载分类
    async loadCategories() {
        if (this.loading) return;
        
        const container = document.getElementById('categories-content');
        if (!container) return;
        
        this.loading = true;
        
        try {
            // 渲染分类选择器到header中，书籍列表到content中
            this.renderCategorySelector();
            this.renderBooksContainer(container);
            
            // 如果当前分类已有数据，直接渲染，否则加载新数据
            if (this.currentNovels.length > 0) {
                // 直接渲染已有数据
                const booksContainer = document.getElementById('category-books-container');
                if (booksContainer) {
                    this.renderCategoryNovels(booksContainer, true);
                }
            } else {
                // 加载当前分类的小说
                await this.loadCategoryNovels(this.currentCategory, true);
            }
        } catch (error) {
            console.error('Load categories error:', error);
            Utils.showError(container, 'Failed to load categories, please try again later');
        } finally {
            this.loading = false;
        }
    }
    
    // 渲染分类选择器到header中
    renderCategorySelector() {
        const header = document.querySelector('#categories-screen .screen-header');
        if (!header) return;
        
        header.innerHTML = `
            <div class="category-selector-header">
                <div class="category-tabs">
                    ${this.categories.map(category => `
                        <button class="category-tab ${category === this.currentCategory ? 'active' : ''}" 
                                data-category="${category}">
                            <i class="${Utils.getCategoryIcon(category)}"></i>
                            <span>${category}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
        
        // 绑定分类选择器事件
        this.bindCategoryTabs(header);
    }
    
    // 渲染书籍容器
    renderBooksContainer(container) {
        container.innerHTML = `
            <div id="category-books-container" class="category-books-container">
                <!-- 书籍列表将在这里渲染 -->
            </div>
            
            <div id="category-load-more" class="load-more-section" style="display: none;">
                <button class="load-more-btn">
                    <i class="fas fa-plus"></i>
                    Load More
                </button>
                <div class="auto-load-hint">Or scroll down to auto-load</div>
            </div>
        `;
    }
    
    // 绑定分类标签事件
    bindCategoryTabs(headerContainer) {
        const categoryTabs = headerContainer.querySelectorAll('.category-tab');
        
        categoryTabs.forEach(tab => {
            tab.addEventListener('click', async () => {
                const category = tab.dataset.category;
                if (category === this.currentCategory) return;
                
                // 更新当前分类
                this.currentCategory = category;
                this.currentPage = 1;
                this.hasMore = true;
                this.currentNovels = [];
                
                // 更新UI状态
                categoryTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // 加载新分类的小说
                await this.loadCategoryNovels(category, true);
            });
        });
        
        // 绑定加载更多按钮（在content区域）
        const loadMoreBtn = document.querySelector('#category-load-more .load-more-btn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                this.loadCategoryNovels(this.currentCategory, false);
            });
        }
    }
    
    // 加载分类小说
    async loadCategoryNovels(category, reset = false) {
        if (this.loading) return;
        
        const container = document.getElementById('category-books-container');
        if (!container) return;
        
        if (reset) {
            this.currentPage = 1;
            this.currentNovels = [];
            Utils.showLoading(container, 'Loading novels...');
        }
        
        this.loading = true;
        
        try {
            // 直接使用英文分类名称查询，与移动端保持一致
            const offset = (this.currentPage - 1) * CONFIG.ITEMS_PER_PAGE;
            const result = await window.supabaseClient.getNovels({
                category: category,  // 直接使用英文分类名如'Fantasy', 'Urban'等
                offset: offset,
                limit: CONFIG.ITEMS_PER_PAGE
            });
            
            if (result.success && result.data) {
                if (reset) {
                    this.currentNovels = result.data;
                } else {
                    this.currentNovels = [...this.currentNovels, ...result.data];
                }
                
                this.hasMore = result.data.length === CONFIG.ITEMS_PER_PAGE;
                this.currentPage++;
                
                this.renderCategoryNovels(container, reset);
            } else {
                // 没有数据时显示空状态
                if (reset) {
                    this.currentNovels = [];
                    this.hasMore = false;
                    this.renderCategoryNovels(container, true);
                }
            }
        } catch (error) {
            console.error('Load category novels error:', error);
            if (reset) {
                // 出错时显示错误状态
                Utils.showError(container, 'Failed to load novels, please try again later');
                this.currentNovels = [];
                this.hasMore = false;
            }
        } finally {
            this.loading = false;
        }
    }
    
    // 渲染分类小说
    renderCategoryNovels(container, reset = false) {
        if (reset) {
            container.innerHTML = '';
        }
        
        if (this.currentNovels.length === 0) {
            Utils.showEmpty(
                container,
                `No ${this.currentCategory} novels found`,
                'This category is still being updated, please check back later'
            );
            return;
        }
        
        // 创建或获取书籍网格
        let booksGrid = container.querySelector('.books-grid');
        if (!booksGrid || reset) {
            booksGrid = document.createElement('div');
            booksGrid.className = 'books-grid';
            if (reset) {
                container.innerHTML = '';
            }
            container.appendChild(booksGrid);
        }
        
        // 渲染新的书籍卡片
        const startIndex = reset ? 0 : booksGrid.children.length;
        const newNovels = this.currentNovels.slice(startIndex);
        
        newNovels.forEach((novel, index) => {
            const card = this.createBookCard(novel);
            booksGrid.appendChild(card);
        });
        
        // 更新加载更多按钮状态
        this.updateLoadMoreButton();
    }
    
    // 创建书籍卡片
    createBookCard(novel) {
        const card = document.createElement('div');
        card.className = 'book-card';
        
        const freeChapters = Math.floor(novel.total_chapters * 0.3);
        
        card.innerHTML = `
            <img src="${novel.cover_image || 'https://via.placeholder.com/100x150?text=No+Cover'}" 
                 alt="${novel.title}" 
                 class="book-cover"
                 loading="lazy">
            <div class="book-info">
                <h3 class="book-title" title="${novel.title}">${novel.title}</h3>
                <p class="book-author">Author: ${novel.author}</p>
                <p class="book-description">${novel.description || 'No description available'}</p>
                <div class="book-meta">
                    <span class="book-category">${Utils.getCategoryDisplayName(novel.category)}</span>
                    <span class="book-chapters">${novel.total_chapters} chapters</span>
                    ${novel.price > 0 ? `<span class="book-price">${Utils.formatPrice(novel.price)}</span>` : ''}
                    <span class="book-free">First ${freeChapters} chapters free</span>
                </div>
            </div>
        `;
        
        // 添加点击事件
        card.addEventListener('click', () => {
            window.navigationManager.navigateToNovelDetail(novel, false);
        });
        
        return card;
    }
    

    
    // 处理滚动事件
    handleScroll() {
        if (this.loading || !this.hasMore) return;
        
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        
        // 当滚动到距离底部200px时自动加载更多
        if (scrollTop + windowHeight >= documentHeight - 200) {
            this.loadCategoryNovels(this.currentCategory, false);
        }
    }
    
    // 更新加载更多按钮状态
    updateLoadMoreButton() {
        const loadMoreSection = document.getElementById('category-load-more');
        if (!loadMoreSection) return;
        
        if (this.hasMore && this.currentNovels.length > 0) {
            loadMoreSection.style.display = 'block';
            const loadMoreBtn = loadMoreSection.querySelector('.load-more-btn');
            if (loadMoreBtn) {
                loadMoreBtn.disabled = this.loading;
                loadMoreBtn.innerHTML = this.loading 
                    ? '<i class="fas fa-spinner fa-spin"></i> Loading...'
                    : '<i class="fas fa-plus"></i> Load More';
            }
        } else {
            loadMoreSection.style.display = 'none';
        }
    }
    
    // 切换到指定分类
    switchToCategory(category) {
        if (this.categories.includes(category)) {
            this.currentCategory = category;
            this.loadCategories();
        }
    }
    
    // 获取当前分类
    getCurrentCategory() {
        return this.currentCategory;
    }
    
    // 获取当前分类的小说
    getCurrentNovels() {
        return this.currentNovels;
    }
    
    // 刷新当前分类
    refresh() {
        this.loadCategoryNovels(this.currentCategory, true);
    }
}

// 创建全局分类管理器实例
window.categoriesManager = new CategoriesManager();