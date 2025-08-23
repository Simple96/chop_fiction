// 小说详情管理器
class NovelDetailManager {
    constructor() {
        this.currentNovel = null;
        this.chapters = [];
        this.isInBookshelf = false;
        this.isPurchased = false;
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
            if (e.detail.screen === 'novel-detail' && e.detail.data) {
                this.loadNovelDetail(e.detail.data.novel, e.detail.data.isInBookshelf);
            }
        });
    }
    
    // 加载小说详情
    async loadNovelDetail(novel, isInBookshelf = false) {
        if (this.loading || !novel) return;
        
        const container = document.getElementById('novel-detail-content');
        if (!container) return;
        
        this.currentNovel = novel;
        this.isInBookshelf = isInBookshelf;
        this.loading = true;
        
        // 更新页面标题
        window.navigationManager.setPageTitle(novel.title);
        
        Utils.showLoading(container, 'Loading novel details...');
        
        try {
            // 并行加载章节列表和购买状态
            const [chaptersResult, purchaseResult] = await Promise.all([
                window.supabaseClient.getChapters(novel.id),
                window.supabaseClient.checkPurchase(novel.id)
            ]);
            
            if (chaptersResult.success) {
                this.chapters = chaptersResult.data || [];
            } else {
                // 网络连接问题或没有章节数据
                this.chapters = [];
                console.error('Failed to load chapters');
            }
            
            if (purchaseResult.success) {
                this.isPurchased = purchaseResult.purchased;
            } else {
                this.isPurchased = false;
            }
            
            this.renderNovelDetail(container);
        } catch (error) {
            console.error('Load novel detail error:', error);
            Utils.showError(container, 'Failed to load novel details, please try again later');
        } finally {
            this.loading = false;
        }
    }
    

    
    // 渲染小说详情
    renderNovelDetail(container) {
        const novelDetail = document.createElement('div');
        novelDetail.className = 'novel-detail fade-in';
        
        novelDetail.innerHTML = `
            ${this.createNovelHero()}
            ${this.createChaptersSection()}
        `;
        
        container.innerHTML = '';
        container.appendChild(novelDetail);
        
        // 绑定事件
        this.bindDetailEvents(novelDetail);
    }
    
    // 创建小说主要信息区域
    createNovelHero() {
        const novel = this.currentNovel;
        const freePercentage = novel.total_chapters > 0 
            ? Math.round((novel.free_chapters / novel.total_chapters) * 100)
            : 0;
        
        return `
            <div class="novel-hero">
                <img src="${novel.cover_image || 'https://via.placeholder.com/200x300?text=No+Cover'}" 
                     alt="${novel.title}" 
                     class="novel-cover-large"
                     onerror="Utils.handleImageError(this)">
                <div class="novel-info-large">
                    <h1 class="novel-title-large">${novel.title}</h1>
                    <p class="novel-author-large">Author: ${novel.author}</p>
                    <p class="novel-description-large">${novel.description}</p>
                    
                    <div class="novel-stats">
                        <div class="novel-stat">
                            <div class="novel-stat-value">${novel.total_chapters}</div>
                            <div class="novel-stat-label">Total Chapters</div>
                        </div>
                        <div class="novel-stat">
                            <div class="novel-stat-value">${freePercentage}%</div>
                            <div class="novel-stat-label">Free Ratio</div>
                        </div>
                        <div class="novel-stat">
                            <div class="novel-stat-value">${Utils.getCategoryDisplayName(novel.category)}</div>
                            <div class="novel-stat-label">Category</div>
                        </div>
                        <div class="novel-stat">
                            <div class="novel-stat-value">${Utils.formatPrice(novel.price)}</div>
                            <div class="novel-stat-label">Price</div>
                        </div>
                    </div>
                    
                    <div class="novel-actions">
                        ${this.createActionButtons()}
                    </div>
                </div>
            </div>
        `;
    }
    
    // 创建操作按钮
    createActionButtons() {
        const buttons = [];
        
        // 开始阅读按钮
        if (this.chapters.length > 0) {
            const lastReadChapter = this.getLastReadChapter();
            const buttonText = lastReadChapter > 0 ? `Continue Reading (Chapter ${lastReadChapter})` : 'Start Reading';
            const chapterToRead = lastReadChapter > 0 ? lastReadChapter : 1;
            
            buttons.push(`
                <button class="btn btn-primary start-reading-btn" data-chapter="${chapterToRead}">
                    <i class="fas fa-play"></i>
                    <span>${buttonText}</span>
                </button>
            `);
        }
        
        // 书架按钮
        if (window.authManager.isAuthenticated()) {
            if (this.isInBookshelf) {
                buttons.push(`
                    <button class="btn btn-secondary remove-from-bookshelf-btn">
                        <i class="fas fa-bookmark"></i>
                        <span>Remove from Bookshelf</span>
                    </button>
                `);
            } else {
                buttons.push(`
                    <button class="btn btn-outline add-to-bookshelf-btn">
                        <i class="fas fa-bookmark"></i>
                        <span>Add to Bookshelf</span>
                    </button>
                `);
            }
        }
        
        // 订阅按钮（订阅制）
        if (!this.isPurchased) {
            buttons.push(`
                <button class="btn btn-primary subscribe-btn">
                    <i class="fas fa-crown"></i>
                    <span>Upgrade to Premium</span>
                </button>
            `);
        } else {
            buttons.push(`
                <button class="btn btn-success" disabled>
                    <i class="fas fa-check"></i>
                    <span>Premium Active</span>
                </button>
            `);
        }
        
        return buttons.join('');
    }
    
    // 创建章节列表区域
    createChaptersSection() {
        if (this.chapters.length === 0) {
            return `
                <div class="chapters-section">
                    <h3>Chapter List</h3>
                    <div class="empty-state">
                        <i class="fas fa-book-open"></i>
                        <h3>No Chapters</h3>
                        <p>This novel has no available chapters yet</p>
                    </div>
                </div>
            `;
        }
        
        const chaptersList = this.chapters.map(chapter => {
            const isLocked = !chapter.is_free && !this.isPurchased;
            const statusClass = chapter.is_free ? 'free' : (this.isPurchased ? 'paid' : 'locked');
            const statusText = chapter.is_free ? 'Free' : (this.isPurchased ? 'Owned' : 'Paid');
            
            return `
                <div class="chapter-item ${isLocked ? 'locked' : ''}" data-chapter="${chapter.chapter_number}">
                    <span class="chapter-title">${chapter.title}</span>
                    <span class="chapter-status ${statusClass}">${statusText}</span>
                </div>
            `;
        }).join('');
        
        return `
            <div class="chapters-section">
                <h3>Chapter List (${this.chapters.length} chapters total)</h3>
                <div class="chapters-list">
                    ${chaptersList}
                </div>
            </div>
        `;
    }
    
    // 绑定详情页事件
    bindDetailEvents(container) {
        // 开始阅读按钮
        const startReadingBtn = container.querySelector('.start-reading-btn');
        if (startReadingBtn) {
            startReadingBtn.addEventListener('click', () => {
                const chapterNumber = parseInt(startReadingBtn.getAttribute('data-chapter'));
                this.startReading(chapterNumber);
            });
        }
        
        // 添加到书架按钮
        const addToBookshelfBtn = container.querySelector('.add-to-bookshelf-btn');
        if (addToBookshelfBtn) {
            addToBookshelfBtn.addEventListener('click', () => {
                this.addToBookshelf();
            });
        }
        
        // 从书架移除按钮
        const removeFromBookshelfBtn = container.querySelector('.remove-from-bookshelf-btn');
        if (removeFromBookshelfBtn) {
            removeFromBookshelfBtn.addEventListener('click', () => {
                this.removeFromBookshelf();
            });
        }
        
        // 订阅按钮
        const subscribeBtn = container.querySelector('.subscribe-btn');
        if (subscribeBtn) {
            subscribeBtn.addEventListener('click', async () => {
                if (!window.authManager.isAuthenticated()) {
                    Utils.showNotification('Please login first', 'warning');
                    return;
                }
                // 打开订阅选择弹窗
                if (window.stripeService) {
                    window.stripeService.showSubscriptionModal();
                } else {
                    Utils.showNotification('Subscription service unavailable', 'error');
                }
            });
        }
        
        // 章节点击事件
        const chapterItems = container.querySelectorAll('.chapter-item:not(.locked)');
        chapterItems.forEach(item => {
            item.addEventListener('click', () => {
                const chapterNumber = parseInt(item.getAttribute('data-chapter'));
                this.startReading(chapterNumber);
            });
        });
        
        // 锁定章节点击提示
        const lockedChapters = container.querySelectorAll('.chapter-item.locked');
        lockedChapters.forEach(item => {
            item.addEventListener('click', () => {
                Utils.showNotification('Please subscribe to unlock all chapters', 'warning');
            });
        });
    }
    
    // 开始阅读
    startReading(chapterNumber) {
        if (!this.currentNovel || !chapterNumber) return;
        
        const chapter = this.chapters.find(c => c.chapter_number === chapterNumber);
        if (!chapter) {
            Utils.showNotification('Chapter does not exist', 'error');
            return;
        }
        
        // 检查章节是否可以阅读
        if (!chapter.is_free && !this.isPurchased) {
            Utils.showNotification('This chapter requires purchase to read', 'warning');
            return;
        }
        
        window.navigationManager.navigateToReader(this.currentNovel, chapterNumber);
    }
    
    // 添加到书架
    async addToBookshelf() {
        if (!window.authManager.isAuthenticated()) {
            Utils.showNotification('Please login first', 'warning');
            return;
        }
        
        const success = await window.bookshelfManager.addToBookshelf(this.currentNovel.id);
        if (success) {
            this.isInBookshelf = true;
            // 重新渲染操作按钮
            this.updateActionButtons();
        }
    }
    
    // 从书架移除
    async removeFromBookshelf() {
        window.navigationManager.showConfirmDialog(
            'Remove Confirmation',
            'Are you sure you want to remove this novel from your bookshelf?',
            async () => {
                const success = await window.bookshelfManager.removeFromBookshelf(this.currentNovel.id);
                if (success) {
                    this.isInBookshelf = false;
                    // 重新渲染操作按钮
                    this.updateActionButtons();
                }
            }
        );
    }
    
    // 购买小说
    async purchaseNovel() {
        if (!window.authManager.isAuthenticated()) {
            Utils.showNotification('Please login first', 'warning');
            return;
        }
        
        window.navigationManager.showConfirmDialog(
            'Purchase Confirmation',
            `Are you sure you want to purchase "${this.currentNovel.title}"?\nPrice: ${Utils.formatPrice(this.currentNovel.price)}`,
            async () => {
                const result = await window.supabaseClient.purchaseNovel(this.currentNovel.id);
                if (result.success) {
                    this.isPurchased = true;
                    // 重新渲染页面
                    const container = document.getElementById('novel-detail-content');
                    this.renderNovelDetail(container);
                }
            }
        );
    }
    
    // 更新操作按钮
    updateActionButtons() {
        const actionsContainer = document.querySelector('.novel-actions');
        if (actionsContainer) {
            actionsContainer.innerHTML = this.createActionButtons();
            // 重新绑定事件
            this.bindDetailEvents(document.querySelector('.novel-detail'));
        }
    }
    
    // 获取最后阅读章节
    getLastReadChapter() {
        if (!this.isInBookshelf || !window.bookshelfManager) return 0;
        
        const bookshelfItem = window.bookshelfManager.getBookshelfItem(this.currentNovel.id);
        return bookshelfItem?.last_read_chapter || 0;
    }
    
    // 获取当前小说
    getCurrentNovel() {
        return this.currentNovel;
    }
    
    // 获取章节列表
    getChapters() {
        return this.chapters;
    }
    
    // 检查是否已购买
    isPurchasedNovel() {
        return this.isPurchased;
    }
    
    // 检查是否在书架中
    isNovelInBookshelf() {
        return this.isInBookshelf;
    }
    
    // 获取可阅读的章节
    getReadableChapters() {
        return this.chapters.filter(chapter => 
            chapter.is_free || this.isPurchased
        );
    }
    
    // 获取免费章节
    getFreeChapters() {
        return this.chapters.filter(chapter => chapter.is_free);
    }
    
    // 获取付费章节
    getPaidChapters() {
        return this.chapters.filter(chapter => !chapter.is_free);
    }
    
    // 刷新详情页
    refresh() {
        if (this.currentNovel) {
            this.loadNovelDetail(this.currentNovel, this.isInBookshelf);
        }
    }
    
    // 分享小说（可选功能）
    shareNovel() {
        if (!this.currentNovel) return;
        
        const shareData = {
            title: this.currentNovel.title,
            text: `Recommend a great book: "${this.currentNovel.title}" by ${this.currentNovel.author}`,
            url: window.location.href
        };
        
        if (navigator.share) {
            navigator.share(shareData).catch(console.error);
        } else {
            // 降级处理：复制到剪贴板
            const textToCopy = `${shareData.text}\n${shareData.url}`;
            
            if (navigator.clipboard) {
                navigator.clipboard.writeText(textToCopy).then(() => {
                    Utils.showNotification('Share link copied to clipboard', 'success');
                }).catch(() => {
                    this.fallbackCopyToClipboard(textToCopy);
                });
            } else {
                this.fallbackCopyToClipboard(textToCopy);
            }
        }
    }
    
    // 降级复制到剪贴板
    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            Utils.showNotification('Share link copied to clipboard', 'success');
        } catch (err) {
            console.error('Copy to clipboard failed:', err);
            Utils.showNotification('Copy failed, please copy the link manually', 'error');
        }
        
        document.body.removeChild(textArea);
    }
}

// 创建全局小说详情管理器实例
window.novelDetailManager = new NovelDetailManager();
