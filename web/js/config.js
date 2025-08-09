// 应用配置
const CONFIG = {
    // Supabase 配置
    SUPABASE_URL: 'https://bbohqxwziavcqiwmcitw.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJib2hxeHd6aWF2Y3Fpd21jaXR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MDE3NDEsImV4cCI6MjA3MDA3Nzc0MX0.8MepqIP2eLmK6-TNw2JUGqobV_z0IIM9mZZi7kAvYOs',
    
    // 应用设置
    APP_NAME: '小说阅读器',
    APP_DESCRIPTION: 'AI缩写中国网络小说',
    
    // 分类配置
    CATEGORIES: [
        'Fantasy',
        'Urban',
        'Xianxia', 
        'Historical',
        'Military',
        'Gaming',
        'Sports',
        'Sci-Fi',
        'Supernatural',
        'Fanfiction'
    ],
    
    // 分类映射
    CATEGORY_MAPPING: {
        '玄幻': 'Fantasy',
        '都市': 'Urban', 
        '仙侠': 'Xianxia',
        '历史': 'Historical',
        '军事': 'Military',
        '游戏': 'Gaming',
        '竞技': 'Sports',
        '科幻': 'Sci-Fi',
        '灵异': 'Supernatural',
        '同人': 'Fanfiction'
    },
    
    // 分类图标映射
    CATEGORY_ICONS: {
        'Fantasy': 'fas fa-magic',
        'Urban': 'fas fa-city',
        'Xianxia': 'fas fa-mountain',
        'Historical': 'fas fa-scroll',
        'Military': 'fas fa-shield-alt',
        'Gaming': 'fas fa-gamepad',
        'Sports': 'fas fa-trophy',
        'Sci-Fi': 'fas fa-rocket',
        'Supernatural': 'fas fa-ghost',
        'Fanfiction': 'fas fa-heart'
    },
    
    // UI 设置
    ITEMS_PER_PAGE: 20,
    LOADING_TIMEOUT: 30000, // 30秒超时
    
    // 本地存储键名
    STORAGE_KEYS: {
        USER_SESSION: 'chop_fiction_session',
        USER_PREFERENCES: 'chop_fiction_preferences',
        READING_PROGRESS: 'chop_fiction_reading_progress'
    }
};

// 工具函数
const Utils = {
    // 获取分类显示名称
    getCategoryDisplayName(category) {
        return CONFIG.CATEGORY_MAPPING[category] || category;
    },
    
    // 获取分类图标
    getCategoryIcon(category) {
        const displayName = this.getCategoryDisplayName(category);
        return CONFIG.CATEGORY_ICONS[displayName] || 'fas fa-book';
    },
    
    // 格式化日期
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },
    
    // 格式化价格
    formatPrice(price) {
        if (price === 0) return '免费';
        return `¥${price.toFixed(2)}`;
    },
    
    // 防抖函数
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // 节流函数
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    // 显示通知
    showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
                <button class="notification-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // 添加样式
        if (!document.querySelector('.notification-styles')) {
            const styles = document.createElement('style');
            styles.className = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    z-index: 3000;
                    min-width: 300px;
                    animation: slideInRight 0.3s ease-out;
                }
                
                .notification-success {
                    border-left: 4px solid #28a745;
                }
                
                .notification-error {
                    border-left: 4px solid #dc3545;
                }
                
                .notification-warning {
                    border-left: 4px solid #ffc107;
                }
                
                .notification-info {
                    border-left: 4px solid #17a2b8;
                }
                
                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 16px;
                }
                
                .notification-content i:first-child {
                    color: #666;
                }
                
                .notification-success .notification-content i:first-child {
                    color: #28a745;
                }
                
                .notification-error .notification-content i:first-child {
                    color: #dc3545;
                }
                
                .notification-warning .notification-content i:first-child {
                    color: #ffc107;
                }
                
                .notification-info .notification-content i:first-child {
                    color: #17a2b8;
                }
                
                .notification-content span {
                    flex: 1;
                    color: #333;
                }
                
                .notification-close {
                    background: none;
                    border: none;
                    color: #999;
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                    transition: all 0.3s ease;
                }
                
                .notification-close:hover {
                    background-color: #f8f9fa;
                    color: #666;
                }
                
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(styles);
        }
        
        // 添加到页面
        document.body.appendChild(notification);
        
        // 关闭按钮事件
        const closeBtn = notification.querySelector('.notification-close');
        const closeNotification = () => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        };
        
        closeBtn.addEventListener('click', closeNotification);
        
        // 自动关闭
        setTimeout(closeNotification, 5000);
    },
    
    // 获取通知图标
    getNotificationIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    },
    
    // 显示加载状态
    showLoading(container, message = '加载中...') {
        const loading = document.createElement('div');
        loading.className = 'loading-placeholder';
        loading.innerHTML = `
            <i class="fas fa-spinner fa-spin"></i>
            <p>${message}</p>
        `;
        container.innerHTML = '';
        container.appendChild(loading);
    },
    
    // 显示空状态
    showEmpty(container, title = '暂无数据', subtitle = '') {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.innerHTML = `
            <i class="fas fa-inbox"></i>
            <h3>${title}</h3>
            ${subtitle ? `<p>${subtitle}</p>` : ''}
        `;
        container.innerHTML = '';
        container.appendChild(empty);
    },
    
    // 显示错误状态
    showError(container, message = '加载失败，请稍后重试') {
        const error = document.createElement('div');
        error.className = 'empty-state';
        error.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <h3>出错了</h3>
            <p>${message}</p>
            <button class="btn btn-primary" onclick="location.reload()">重新加载</button>
        `;
        container.innerHTML = '';
        container.appendChild(error);
    },
    
    // 处理图片加载错误
    handleImageError(img) {
        img.src = 'https://via.placeholder.com/100x150?text=No+Image';
        img.onerror = null; // 防止无限循环
    },
    
    // 截断文本
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    },
    
    // 计算阅读进度百分比
    calculateProgress(currentChapter, totalChapters) {
        if (!totalChapters || totalChapters === 0) return 0;
        return Math.round((currentChapter / totalChapters) * 100);
    },
    
    // 本地存储操作
    storage: {
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.error('Storage set error:', error);
                return false;
            }
        },
        
        get(key) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : null;
            } catch (error) {
                console.error('Storage get error:', error);
                return null;
            }
        },
        
        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error('Storage remove error:', error);
                return false;
            }
        },
        
        clear() {
            try {
                localStorage.clear();
                return true;
            } catch (error) {
                console.error('Storage clear error:', error);
                return false;
            }
        }
    }
};

// 导出到全局
window.CONFIG = CONFIG;
window.Utils = Utils;
