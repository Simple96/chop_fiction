// 工具函数
const Utils = {
    // 显示通知
    showNotification(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        
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
    
    // 格式化日期
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
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
window.Utils = Utils;
