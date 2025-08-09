// 阅读器管理器
class ReaderManager {
    constructor() {
        this.currentNovel = null;
        this.currentChapter = null;
        this.chapterNumber = 1;
        this.chapters = [];
        this.loading = false;
        this.autoSaveProgress = true;
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.loadReaderSettings();
    }
    
    // 绑定事件
    bindEvents() {
        // 监听屏幕变化
        window.addEventListener('screenChange', (e) => {
            if (e.detail.screen === 'reader' && e.detail.data) {
                this.loadChapter(e.detail.data.novel, e.detail.data.chapterNumber);
            }
        });
        
        // 上一章按钮
        const prevBtn = document.getElementById('prev-chapter');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.previousChapter();
            });
        }
        
        // 下一章按钮
        const nextBtn = document.getElementById('next-chapter');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.nextChapter();
            });
        }
        
        // 键盘导航
        document.addEventListener('keydown', (e) => {
            if (window.navigationManager.getCurrentScreen() !== 'reader') return;
            
            switch (e.key) {
                case 'ArrowLeft':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.previousChapter();
                    }
                    break;
                case 'ArrowRight':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.nextChapter();
                    }
                    break;
                case 'Home':
                    e.preventDefault();
                    window.scrollTo(0, 0);
                    break;
                case 'End':
                    e.preventDefault();
                    window.scrollTo(0, document.body.scrollHeight);
                    break;
            }
        });
        
        // 滚动进度保存
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            if (window.navigationManager.getCurrentScreen() !== 'reader') return;
            
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.saveScrollPosition();
            }, 1000);
        });
        
        // 页面离开时保存进度
        window.addEventListener('beforeunload', () => {
            this.saveReadingProgress();
        });
    }
    
    // 加载章节
    async loadChapter(novel, chapterNumber) {
        if (this.loading || !novel || !chapterNumber) return;
        
        const container = document.getElementById('reader-content');
        if (!container) return;
        
        this.currentNovel = novel;
        this.chapterNumber = chapterNumber;
        this.loading = true;
        
        // 更新页面标题
        window.navigationManager.setPageTitle(`Chapter ${chapterNumber} - ${novel.title}`);
        
        // 更新阅读器标题
        const readerTitle = document.getElementById('reader-title');
        if (readerTitle) {
            readerTitle.textContent = `${novel.title} - Chapter ${chapterNumber}`;
        }
        
        Utils.showLoading(container, 'Loading chapter...');
        
        try {
            // 尝试从服务器加载章节
            const result = await window.supabaseClient.getChapter(novel.id, chapterNumber);
            
            if (result.success && result.data) {
                this.currentChapter = result.data;
            } else {
                // 使用模拟数据
                this.currentChapter = this.generateMockChapter(novel, chapterNumber);
            }
            
            // 加载章节列表（用于导航）
            await this.loadChaptersList(novel);
            
            this.renderChapter(container);
            this.updateNavigationButtons();
            
            // 自动保存阅读进度
            if (this.autoSaveProgress) {
                this.saveReadingProgress();
            }
            
            // 恢复滚动位置
            this.restoreScrollPosition();
            
        } catch (error) {
            console.error('Load chapter error:', error);
            Utils.showError(container, 'Failed to load chapter, please try again later');
        } finally {
            this.loading = false;
        }
    }
    
    // 生成模拟章节数据
    generateMockChapter(novel, chapterNumber) {
        const chapterTitles = [
            'Enter the World', 'Meet the Master', 'Path of Cultivation', 'Crisis Looms', 'Breaking Through',
            'Powerful Enemy', 'Life or Death', 'Light in Darkness', 'Power Surge', 'Famous Across Lands',
            'Love and Hate', 'Blood Feud', 'Path of Revenge', 'Final Battle', 'Retirement in Glory'
        ];
        
        const title = chapterTitles[chapterNumber % chapterTitles.length] || `Chapter ${chapterNumber}`;
        
        const content = `
            <p>This is the content of Chapter ${chapterNumber} from "${novel.title}".</p>
            <p>In this chapter, the protagonist faces new challenges and opportunities. After intense struggles, they finally achieve an important breakthrough.</p>
            <p>The story plot is thrilling and exciting, with vivid character development that keeps readers engaged.</p>
            <p>As the plot develops further, more mysteries will be revealed, and greater adventures await the protagonist.</p>
            <p>This is an AI-condensed version that retains the exciting content of the original while significantly shortening the length, allowing readers to quickly understand the core plot.</p>
            <p>The upcoming chapters will be even more exciting, stay tuned!</p>
        `;
        
        return {
            id: `${novel.id}-chapter-${chapterNumber}`,
            novel_id: novel.id,
            chapter_number: chapterNumber,
            title: title,
            content: content,
            is_free: chapterNumber <= (novel.free_chapters || Math.floor(novel.total_chapters * 0.25)),
            created_at: new Date().toISOString()
        };
    }
    
    // 加载章节列表
    async loadChaptersList(novel) {
        try {
            const result = await window.supabaseClient.getChapters(novel.id);
            if (result.success) {
                this.chapters = result.data || [];
            } else {
                // 生成模拟章节列表
                this.chapters = [];
                for (let i = 1; i <= novel.total_chapters; i++) {
                    this.chapters.push({
                        chapter_number: i,
                        is_free: i <= (novel.free_chapters || Math.floor(novel.total_chapters * 0.25))
                    });
                }
            }
        } catch (error) {
            console.error('Load chapters list error:', error);
            this.chapters = [];
        }
    }
    
    // 渲染章节
    renderChapter(container) {
        if (!this.currentChapter) {
            Utils.showError(container, 'Chapter content does not exist');
            return;
        }
        
        const chapterContent = document.createElement('div');
        chapterContent.className = 'fade-in';
        
        chapterContent.innerHTML = `
            <h1 class="chapter-title-reader">${this.currentChapter.title}</h1>
            <div class="chapter-content">
                ${this.formatChapterContent(this.currentChapter.content)}
            </div>
            <div class="chapter-navigation">
                <div class="chapter-nav-buttons">
                    ${this.chapterNumber > 1 ? 
                        `<button class="btn btn-outline prev-chapter-bottom">
                            <i class="fas fa-chevron-left"></i>
                            <span>Previous</span>
                        </button>` : ''
                    }
                    ${this.chapterNumber < this.currentNovel.total_chapters ? 
                        `<button class="btn btn-outline next-chapter-bottom">
                            <span>Next</span>
                            <i class="fas fa-chevron-right"></i>
                        </button>` : ''
                    }
                </div>
                <div class="chapter-progress">
                    <span>Chapter ${this.chapterNumber} / ${this.currentNovel.total_chapters} Total</span>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(this.chapterNumber / this.currentNovel.total_chapters) * 100}%"></div>
                    </div>
                </div>
            </div>
        `;
        
        // 添加进度条样式
        if (!document.querySelector('.progress-bar-styles')) {
            const style = document.createElement('style');
            style.className = 'progress-bar-styles';
            style.textContent = `
                .chapter-navigation {
                    margin-top: 40px;
                    padding: 20px 0;
                    border-top: 1px solid #eee;
                }
                
                .chapter-nav-buttons {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 20px;
                }
                
                .chapter-progress {
                    text-align: center;
                    color: #666;
                    font-size: 14px;
                }
                
                .progress-bar {
                    width: 100%;
                    height: 6px;
                    background-color: #f0f0f0;
                    border-radius: 3px;
                    margin-top: 8px;
                    overflow: hidden;
                }
                
                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #C0392B, #E74C3C);
                    border-radius: 3px;
                    transition: width 0.3s ease;
                }
            `;
            document.head.appendChild(style);
        }
        
        container.innerHTML = '';
        container.appendChild(chapterContent);
        
        // 绑定底部导航事件
        this.bindBottomNavigation(chapterContent);
    }
    
    // 格式化章节内容
    formatChapterContent(content) {
        if (!content) return '<p>Chapter content is empty</p>';
        
        // 如果内容已经是HTML格式，直接返回
        if (content.includes('<p>') || content.includes('<div>')) {
            return content;
        }
        
        // 将纯文本转换为段落
        return content
            .split('\n')
            .filter(line => line.trim())
            .map(line => `<p>${line.trim()}</p>`)
            .join('');
    }
    
    // 绑定底部导航事件
    bindBottomNavigation(container) {
        const prevBtn = container.querySelector('.prev-chapter-bottom');
        const nextBtn = container.querySelector('.next-chapter-bottom');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.previousChapter();
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.nextChapter();
            });
        }
    }
    
    // 更新导航按钮状态
    updateNavigationButtons() {
        const prevBtn = document.getElementById('prev-chapter');
        const nextBtn = document.getElementById('next-chapter');
        
        if (prevBtn) {
            prevBtn.disabled = this.chapterNumber <= 1;
        }
        
        if (nextBtn) {
            nextBtn.disabled = this.chapterNumber >= this.currentNovel.total_chapters;
        }
    }
    
    // 上一章
    async previousChapter() {
        if (this.chapterNumber <= 1) {
            Utils.showNotification('Already at the first chapter', 'info');
            return;
        }
        
        const prevChapterNumber = this.chapterNumber - 1;
        await this.loadChapter(this.currentNovel, prevChapterNumber);
    }
    
    // 下一章
    async nextChapter() {
        if (this.chapterNumber >= this.currentNovel.total_chapters) {
            Utils.showNotification('Already at the last chapter', 'info');
            return;
        }
        
        const nextChapterNumber = this.chapterNumber + 1;
        const nextChapter = this.chapters.find(c => c.chapter_number === nextChapterNumber);
        
        // 检查下一章是否可以阅读
        if (nextChapter && !nextChapter.is_free) {
            // 检查是否已购买
            const purchaseResult = await window.supabaseClient.checkPurchase(this.currentNovel.id);
            if (!purchaseResult.success || !purchaseResult.purchased) {
                Utils.showNotification('Next chapter requires purchase to read', 'warning');
                return;
            }
        }
        
        await this.loadChapter(this.currentNovel, nextChapterNumber);
    }
    
    // 跳转到指定章节
    async goToChapter(chapterNumber) {
        if (chapterNumber < 1 || chapterNumber > this.currentNovel.total_chapters) {
            Utils.showNotification('Invalid chapter number', 'error');
            return;
        }
        
        const chapter = this.chapters.find(c => c.chapter_number === chapterNumber);
        
        // 检查章节是否可以阅读
        if (chapter && !chapter.is_free) {
            const purchaseResult = await window.supabaseClient.checkPurchase(this.currentNovel.id);
            if (!purchaseResult.success || !purchaseResult.purchased) {
                Utils.showNotification('This chapter requires purchase to read', 'warning');
                return;
            }
        }
        
        await this.loadChapter(this.currentNovel, chapterNumber);
    }
    
    // 保存阅读进度
    async saveReadingProgress() {
        if (!this.currentNovel || !this.chapterNumber) return;
        if (!window.authManager.isAuthenticated()) return;
        
        try {
            // 检查是否在书架中，如果不在则先添加
            if (!window.bookshelfManager.isInBookshelf(this.currentNovel.id)) {
                await window.bookshelfManager.addToBookshelf(this.currentNovel.id);
            }
            
            // 更新阅读进度
            await window.bookshelfManager.updateReadingProgress(
                this.currentNovel.id, 
                this.chapterNumber
            );
        } catch (error) {
            console.error('Save reading progress error:', error);
        }
    }
    
    // 保存滚动位置
    saveScrollPosition() {
        if (!this.currentNovel || !this.chapterNumber) return;
        
        const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
        const key = `scroll_${this.currentNovel.id}_${this.chapterNumber}`;
        
        Utils.storage.set(key, scrollPosition);
    }
    
    // 恢复滚动位置
    restoreScrollPosition() {
        if (!this.currentNovel || !this.chapterNumber) return;
        
        const key = `scroll_${this.currentNovel.id}_${this.chapterNumber}`;
        const scrollPosition = Utils.storage.get(key);
        
        if (scrollPosition && scrollPosition > 0) {
            setTimeout(() => {
                window.scrollTo(0, scrollPosition);
            }, 100);
        } else {
            // 默认滚动到顶部
            setTimeout(() => {
                window.scrollTo(0, 0);
            }, 100);
        }
    }
    
    // 加载阅读器设置
    loadReaderSettings() {
        const settings = Utils.storage.get(CONFIG.STORAGE_KEYS.USER_PREFERENCES) || {};
        
        this.autoSaveProgress = settings.autoSaveProgress !== false;
        
        // 应用其他设置（如字体大小、背景色等）
        this.applyReaderSettings(settings);
    }
    
    // 应用阅读器设置
    applyReaderSettings(settings) {
        const readerContent = document.querySelector('.reader-content');
        if (!readerContent) return;
        
        // 字体大小
        if (settings.fontSize) {
            readerContent.style.fontSize = settings.fontSize + 'px';
        }
        
        // 行间距
        if (settings.lineHeight) {
            readerContent.style.lineHeight = settings.lineHeight;
        }
        
        // 背景色
        if (settings.backgroundColor) {
            readerContent.style.backgroundColor = settings.backgroundColor;
        }
        
        // 文字颜色
        if (settings.textColor) {
            readerContent.style.color = settings.textColor;
        }
    }
    
    // 保存阅读器设置
    saveReaderSettings(settings) {
        const currentSettings = Utils.storage.get(CONFIG.STORAGE_KEYS.USER_PREFERENCES) || {};
        const newSettings = { ...currentSettings, ...settings };
        
        Utils.storage.set(CONFIG.STORAGE_KEYS.USER_PREFERENCES, newSettings);
        this.applyReaderSettings(newSettings);
    }
    
    // 显示章节目录（可选功能）
    showChapterList() {
        if (this.chapters.length === 0) {
            Utils.showNotification('Chapter list is empty', 'info');
            return;
        }
        
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        const confirmBtn = document.getElementById('modal-confirm');
        const cancelBtn = document.getElementById('modal-cancel');
        
        modalTitle.textContent = 'Chapter List';
        
        const chaptersList = this.chapters.map(chapter => {
            const isLocked = !chapter.is_free;
            const isCurrent = chapter.chapter_number === this.chapterNumber;
            const statusText = chapter.is_free ? 'Free' : 'Paid';
            
            return `
                <div class="chapter-list-item ${isLocked ? 'locked' : ''} ${isCurrent ? 'current' : ''}" 
                     data-chapter="${chapter.chapter_number}"
                     style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 12px;
                        border-bottom: 1px solid #f0f0f0;
                        cursor: pointer;
                        transition: background-color 0.3s ease;
                        ${isCurrent ? 'background-color: #fff5f5; border-left: 3px solid #C0392B;' : ''}
                        ${isLocked ? 'opacity: 0.6;' : ''}
                     ">
                    <span>Chapter ${chapter.chapter_number}</span>
                    <span style="font-size: 12px; color: ${chapter.is_free ? '#28a745' : '#ffc107'};">
                        ${statusText}
                    </span>
                </div>
            `;
        }).join('');
        
        modalBody.innerHTML = `
            <div style="max-height: 400px; overflow-y: auto;">
                ${chaptersList}
            </div>
        `;
        
        // 隐藏确认和取消按钮
        confirmBtn.style.display = 'none';
        cancelBtn.textContent = 'Close';
        
        // 绑定章节点击事件
        modalBody.querySelectorAll('.chapter-list-item:not(.locked)').forEach(item => {
            item.addEventListener('click', () => {
                const chapterNumber = parseInt(item.getAttribute('data-chapter'));
                modal.classList.add('hidden');
                this.goToChapter(chapterNumber);
            });
        });
        
        // 绑定关闭事件
        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        newCancelBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
            confirmBtn.style.display = 'inline-block';
            cancelBtn.textContent = 'Cancel';
        });
        
        // 显示模态框
        modal.classList.remove('hidden');
    }
    
    // 获取当前章节信息
    getCurrentChapter() {
        return this.currentChapter;
    }
    
    // 获取当前小说
    getCurrentNovel() {
        return this.currentNovel;
    }
    
    // 获取当前章节号
    getCurrentChapterNumber() {
        return this.chapterNumber;
    }
    
    // 检查是否可以阅读下一章
    canReadNextChapter() {
        return this.chapterNumber < this.currentNovel.total_chapters;
    }
    
    // 检查是否可以阅读上一章
    canReadPreviousChapter() {
        return this.chapterNumber > 1;
    }
    
    // 获取阅读进度百分比
    getReadingProgress() {
        if (!this.currentNovel || !this.chapterNumber) return 0;
        return Math.round((this.chapterNumber / this.currentNovel.total_chapters) * 100);
    }
}

// 创建全局阅读器管理器实例
window.readerManager = new ReaderManager();
