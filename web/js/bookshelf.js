// 书架管理器
class BookshelfManager {
    constructor() {
        this.bookshelfItems = [];
        this.loading = false;
        this.init();
    }
    
    init() {
        this.bindEvents();
    }
    
    // 绑定事件
    bindEvents() {
        // 监听用户状态变化
        window.addEventListener('userStateChange', () => {
            if (window.navigationManager.getCurrentScreen() === 'bookshelf') {
                this.loadBookshelf();
            }
        });
        
        // 监听屏幕变化
        window.addEventListener('screenChange', (e) => {
            if (e.detail.screen === 'bookshelf') {
                this.loadBookshelf();
            }
        });
    }
    
    // 加载书架
    async loadBookshelf() {
        if (this.loading) return;
        
        const container = document.getElementById('bookshelf-content');
        if (!container) return;
        
        // 检查用户是否已登录
        if (!window.authManager.isAuthenticated()) {
            this.showLoginPrompt(container);
            return;
        }
        
        this.loading = true;
        Utils.showLoading(container, 'Loading bookshelf...');
        
        try {
            const result = await window.supabaseClient.getBookshelf();
            
            if (result.success) {
                this.bookshelfItems = result.data || [];
                this.renderBookshelf(container);
            } else {
                throw result.error;
            }
        } catch (error) {
            console.error('Load bookshelf error:', error);
            Utils.showError(container, 'Failed to load bookshelf, please try again later');
        } finally {
            this.loading = false;
        }
    }
    
    // 渲染书架
    renderBookshelf(container) {
        if (this.bookshelfItems.length === 0) {
            Utils.showEmpty(
                container, 
                'Your bookshelf is empty', 
                'Go to Discover page to find novels you like'
            );
            return;
        }
        
        const booksGrid = document.createElement('div');
        booksGrid.className = 'books-grid fade-in';
        
        this.bookshelfItems.forEach(item => {
            const novel = item.novel;
            if (!novel) return;
            
            const bookCard = this.createBookCard(novel, item);
            booksGrid.appendChild(bookCard);
        });
        
        container.innerHTML = '';
        container.appendChild(booksGrid);
    }
    
    // 创建书籍卡片
    createBookCard(novel, bookshelfItem) {
        const card = document.createElement('div');
        card.className = 'book-card';
        
        // 计算阅读进度
        const progress = bookshelfItem.last_read_chapter 
            ? Utils.calculateProgress(bookshelfItem.last_read_chapter, novel.total_chapters)
            : 0;
        
        const progressText = bookshelfItem.last_read_chapter 
            ? `Read to Chapter ${bookshelfItem.last_read_chapter} (${progress}%)`
            : 'Not started reading';
        
        card.innerHTML = `
            <img src="${novel.cover_image || 'https://via.placeholder.com/100x150?text=No+Cover'}" 
                 alt="${novel.title}" 
                 class="book-cover"
                 onerror="Utils.handleImageError(this)">
            <div class="book-info">
                <h3 class="book-title" title="${novel.title}">${novel.title}</h3>
                <p class="book-author">Author: ${novel.author}</p>
                <p class="book-progress">${progressText}</p>
                <div class="book-meta">
                    <span class="book-category">${Utils.getCategoryDisplayName(novel.category)}</span>
                    <span class="book-chapters">${novel.total_chapters} chapters</span>
                    ${novel.price > 0 ? `<span class="book-price">${Utils.formatPrice(novel.price)}</span>` : ''}
                </div>
            </div>
        `;
        
        // 添加点击事件
        card.addEventListener('click', () => {
            window.navigationManager.navigateToNovelDetail(novel, true);
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
    
    // 显示登录提示
    showLoginPrompt(container) {
        const prompt = document.createElement('div');
        prompt.className = 'empty-state';
        prompt.innerHTML = `
            <i class="fas fa-user-lock"></i>
            <h3>Please Login First</h3>
            <p>Login to view your personal bookshelf</p>
            <button class="btn btn-primary" onclick="window.authManager.showAuthScreen()">
                <i class="fas fa-sign-in-alt"></i>
                <span>Login Now</span>
            </button>
        `;
        
        container.innerHTML = '';
        container.appendChild(prompt);
    }
    
    // 添加到书架
    async addToBookshelf(novelId) {
        try {
            const result = await window.supabaseClient.addToBookshelf(novelId);
            
            if (result.success) {
                // 重新加载书架
                if (window.navigationManager.getCurrentScreen() === 'bookshelf') {
                    this.loadBookshelf();
                }
                return true;
            }
            return false;
        } catch (error) {
            console.error('Add to bookshelf error:', error);
            return false;
        }
    }
    
    // 从书架移除
    async removeFromBookshelf(novelId) {
        try {
            const result = await window.supabaseClient.removeFromBookshelf(novelId);
            
            if (result.success) {
                // 重新加载书架
                if (window.navigationManager.getCurrentScreen() === 'bookshelf') {
                    this.loadBookshelf();
                }
                return true;
            }
            return false;
        } catch (error) {
            console.error('Remove from bookshelf error:', error);
            return false;
        }
    }
    
    // 检查小说是否在书架中
    isInBookshelf(novelId) {
        return this.bookshelfItems.some(item => item.novel_id === novelId);
    }
    
    // 获取书架项目
    getBookshelfItem(novelId) {
        return this.bookshelfItems.find(item => item.novel_id === novelId);
    }
    
    // 更新阅读进度
    async updateReadingProgress(novelId, chapterNumber) {
        try {
            const result = await window.supabaseClient.updateReadingProgress(novelId, chapterNumber);
            
            if (result.success) {
                // 更新本地数据
                const item = this.bookshelfItems.find(item => item.novel_id === novelId);
                if (item) {
                    item.last_read_chapter = chapterNumber;
                }
                
                // 如果当前在书架页面，重新渲染
                if (window.navigationManager.getCurrentScreen() === 'bookshelf') {
                    const container = document.getElementById('bookshelf-content');
                    this.renderBookshelf(container);
                }
                
                return true;
            }
            return false;
        } catch (error) {
            console.error('Update reading progress error:', error);
            return false;
        }
    }
    
    // 获取书架统计信息
    getStats() {
        const total = this.bookshelfItems.length;
        const reading = this.bookshelfItems.filter(item => item.last_read_chapter > 0).length;
        const completed = this.bookshelfItems.filter(item => {
            const novel = item.novel;
            return novel && item.last_read_chapter >= novel.total_chapters;
        }).length;
        
        return { total, reading, completed };
    }
    
    // 搜索书架
    searchBookshelf(query) {
        if (!query.trim()) {
            return this.bookshelfItems;
        }
        
        const searchTerm = query.toLowerCase().trim();
        return this.bookshelfItems.filter(item => {
            const novel = item.novel;
            if (!novel) return false;
            
            return novel.title.toLowerCase().includes(searchTerm) ||
                   novel.author.toLowerCase().includes(searchTerm) ||
                   novel.description.toLowerCase().includes(searchTerm);
        });
    }
    
    // 按分类筛选
    filterByCategory(category) {
        if (!category || category === 'all') {
            return this.bookshelfItems;
        }
        
        return this.bookshelfItems.filter(item => {
            const novel = item.novel;
            return novel && novel.category === category;
        });
    }
    
    // 排序书架
    sortBookshelf(sortBy = 'added_at', ascending = false) {
        const sorted = [...this.bookshelfItems].sort((a, b) => {
            let valueA, valueB;
            
            switch (sortBy) {
                case 'title':
                    valueA = a.novel?.title || '';
                    valueB = b.novel?.title || '';
                    break;
                case 'author':
                    valueA = a.novel?.author || '';
                    valueB = b.novel?.author || '';
                    break;
                case 'progress':
                    valueA = a.last_read_chapter || 0;
                    valueB = b.last_read_chapter || 0;
                    break;
                case 'added_at':
                default:
                    valueA = new Date(a.added_at);
                    valueB = new Date(b.added_at);
                    break;
            }
            
            if (valueA < valueB) return ascending ? -1 : 1;
            if (valueA > valueB) return ascending ? 1 : -1;
            return 0;
        });
        
        return sorted;
    }
    
    // 获取最近阅读的小说
    getRecentlyRead(limit = 5) {
        return this.bookshelfItems
            .filter(item => item.last_read_chapter > 0)
            .sort((a, b) => new Date(b.updated_at || b.added_at) - new Date(a.updated_at || a.added_at))
            .slice(0, limit);
    }
    
    // 清空书架（危险操作）
    async clearBookshelf() {
        window.navigationManager.showConfirmDialog(
            'Clear Bookshelf',
            'Are you sure you want to clear the entire bookshelf? This action cannot be undone.',
            async () => {
                try {
                    const promises = this.bookshelfItems.map(item => 
                        window.supabaseClient.removeFromBookshelf(item.novel_id)
                    );
                    
                    await Promise.all(promises);
                    
                    Utils.showNotification('Bookshelf cleared', 'success');
                    this.loadBookshelf();
                } catch (error) {
                    console.error('Clear bookshelf error:', error);
                    Utils.showNotification('Failed to clear bookshelf', 'error');
                }
            }
        );
    }
}

// 创建全局书架管理器实例
window.bookshelfManager = new BookshelfManager();
