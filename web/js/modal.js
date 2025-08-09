// 模态框管理器
class ModalManager {
    constructor() {
        this.modal = null;
        this.modalContent = null;
        this.isOpen = false;
        this.init();
    }
    
    init() {
        this.modal = document.getElementById('modal');
        this.modalContent = this.modal?.querySelector('.modal-content');
        this.bindEvents();
    }
    
    // 绑定事件
    bindEvents() {
        if (!this.modal) return;
        
        // 点击遮罩层关闭
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });
        
        // 模态框关闭按钮
        const closeBtn = document.getElementById('modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.close();
            });
        }
        
        // ESC 键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
        
        // 阻止模态框内容区域的点击事件冒泡
        if (this.modalContent) {
            this.modalContent.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
    }
    
    // 显示模态框
    show(title, body, options = {}) {
        if (!this.modal) return;
        
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        const confirmBtn = document.getElementById('modal-confirm');
        const cancelBtn = document.getElementById('modal-cancel');
        
        // 设置标题
        if (modalTitle) {
            modalTitle.textContent = title || '提示';
        }
        
        // 设置内容
        if (modalBody) {
            if (typeof body === 'string') {
                modalBody.innerHTML = body;
            } else if (body instanceof HTMLElement) {
                modalBody.innerHTML = '';
                modalBody.appendChild(body);
            }
        }
        
        // 配置按钮
        this.configureButtons(confirmBtn, cancelBtn, options);
        
        // 显示模态框
        this.modal.classList.remove('hidden');
        this.isOpen = true;
        
        // 聚焦处理
        this.handleFocus(options.focusElement);
        
        // 添加动画类
        if (this.modalContent) {
            this.modalContent.classList.add('modal-enter');
            setTimeout(() => {
                this.modalContent.classList.remove('modal-enter');
            }, 300);
        }
        
        // 阻止背景滚动
        document.body.style.overflow = 'hidden';
        
        return this;
    }
    
    // 配置按钮
    configureButtons(confirmBtn, cancelBtn, options) {
        if (!confirmBtn || !cancelBtn) return;
        
        // 重置按钮状态
        confirmBtn.style.display = 'inline-block';
        cancelBtn.style.display = 'inline-block';
        confirmBtn.textContent = '确认';
        cancelBtn.textContent = '取消';
        confirmBtn.disabled = false;
        
        // 清除旧的事件监听器
        const newConfirmBtn = confirmBtn.cloneNode(true);
        const newCancelBtn = cancelBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        
        // 配置确认按钮
        if (options.confirmText) {
            newConfirmBtn.textContent = options.confirmText;
        }
        
        if (options.confirmClass) {
            newConfirmBtn.className = `btn ${options.confirmClass}`;
        }
        
        if (options.onConfirm) {
            newConfirmBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                
                // 显示加载状态
                const originalText = newConfirmBtn.textContent;
                newConfirmBtn.textContent = '处理中...';
                newConfirmBtn.disabled = true;
                
                try {
                    const result = await options.onConfirm();
                    
                    // 如果回调返回 false，不关闭模态框
                    if (result !== false) {
                        this.close();
                    }
                } catch (error) {
                    console.error('Modal confirm error:', error);
                } finally {
                    // 恢复按钮状态
                    newConfirmBtn.textContent = originalText;
                    newConfirmBtn.disabled = false;
                }
            });
        } else {
            newConfirmBtn.addEventListener('click', () => {
                this.close();
            });
        }
        
        // 配置取消按钮
        if (options.cancelText) {
            newCancelBtn.textContent = options.cancelText;
        }
        
        if (options.showCancel === false) {
            newCancelBtn.style.display = 'none';
        }
        
        if (options.onCancel) {
            newCancelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                options.onCancel();
                this.close();
            });
        } else {
            newCancelBtn.addEventListener('click', () => {
                this.close();
            });
        }
    }
    
    // 处理焦点
    handleFocus(focusElement) {
        setTimeout(() => {
            if (focusElement) {
                const element = typeof focusElement === 'string' 
                    ? document.getElementById(focusElement) || document.querySelector(focusElement)
                    : focusElement;
                
                if (element && element.focus) {
                    element.focus();
                }
            } else {
                // 默认聚焦到第一个可聚焦元素
                const focusableElements = this.modal.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                
                if (focusableElements.length > 0) {
                    focusableElements[0].focus();
                }
            }
        }, 100);
    }
    
    // 关闭模态框
    close() {
        if (!this.modal || !this.isOpen) return;
        
        // 添加退出动画
        if (this.modalContent) {
            this.modalContent.classList.add('modal-exit');
            setTimeout(() => {
                this.modalContent.classList.remove('modal-exit');
                this.modal.classList.add('hidden');
                this.isOpen = false;
                
                // 恢复背景滚动
                document.body.style.overflow = '';
            }, 300);
        } else {
            this.modal.classList.add('hidden');
            this.isOpen = false;
            document.body.style.overflow = '';
        }
        
        return this;
    }
    
    // 显示确认对话框
    confirm(title, message, onConfirm, onCancel) {
        return this.show(title, `<p>${message}</p>`, {
            confirmText: '确认',
            cancelText: '取消',
            onConfirm,
            onCancel
        });
    }
    
    // 显示信息对话框
    info(title, message, onClose) {
        return this.show(title, `<p>${message}</p>`, {
            confirmText: '确定',
            showCancel: false,
            onConfirm: onClose
        });
    }
    
    // 显示警告对话框
    warning(title, message, onConfirm, onCancel) {
        return this.show(title, `<p>${message}</p>`, {
            confirmText: '确认',
            confirmClass: 'btn-warning',
            cancelText: '取消',
            onConfirm,
            onCancel
        });
    }
    
    // 显示错误对话框
    error(title, message, onClose) {
        return this.show(title, `<p style="color: #dc3545;">${message}</p>`, {
            confirmText: '确定',
            confirmClass: 'btn-danger',
            showCancel: false,
            onConfirm: onClose
        });
    }
    
    // 显示成功对话框
    success(title, message, onClose) {
        return this.show(title, `<p style="color: #28a745;">${message}</p>`, {
            confirmText: '确定',
            confirmClass: 'btn-success',
            showCancel: false,
            onConfirm: onClose
        });
    }
    
    // 显示表单对话框
    form(title, formHTML, onSubmit, onCancel) {
        return this.show(title, formHTML, {
            confirmText: '提交',
            cancelText: '取消',
            onConfirm: () => {
                const form = this.modal.querySelector('form');
                if (form && onSubmit) {
                    const formData = new FormData(form);
                    const data = Object.fromEntries(formData.entries());
                    return onSubmit(data, form);
                }
            },
            onCancel,
            focusElement: 'input, textarea, select'
        });
    }
    
    // 显示加载对话框
    loading(title, message) {
        const loadingHTML = `
            <div style="text-align: center; padding: 20px;">
                <div class="loading-spinner" style="margin: 0 auto 20px;"></div>
                <p>${message || '处理中，请稍候...'}</p>
            </div>
        `;
        
        return this.show(title || '请稍候', loadingHTML, {
            showCancel: false,
            confirmText: '确定',
            onConfirm: () => false // 不允许关闭
        });
    }
    
    // 显示自定义内容对话框
    custom(title, contentElement, options = {}) {
        return this.show(title, contentElement, options);
    }
    
    // 检查是否打开
    isModalOpen() {
        return this.isOpen;
    }
    
    // 获取模态框元素
    getModal() {
        return this.modal;
    }
    
    // 获取模态框内容元素
    getModalContent() {
        return this.modalContent;
    }
    
    // 添加模态框样式（如果需要）
    addStyles() {
        if (document.querySelector('.modal-animations')) return;
        
        const style = document.createElement('style');
        style.className = 'modal-animations';
        style.textContent = `
            .modal-enter {
                animation: modalEnter 0.3s ease-out;
            }
            
            .modal-exit {
                animation: modalExit 0.3s ease-out;
            }
            
            @keyframes modalEnter {
                from {
                    opacity: 0;
                    transform: scale(0.7) translateY(-50px);
                }
                to {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                }
            }
            
            @keyframes modalExit {
                from {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                }
                to {
                    opacity: 0;
                    transform: scale(0.7) translateY(-50px);
                }
            }
            
            .btn-warning {
                background-color: #ffc107;
                color: #212529;
            }
            
            .btn-warning:hover {
                background-color: #e0a800;
            }
            
            .btn-danger {
                background-color: #dc3545;
                color: white;
            }
            
            .btn-danger:hover {
                background-color: #c82333;
            }
            
            .btn-success {
                background-color: #28a745;
                color: white;
            }
            
            .btn-success:hover {
                background-color: #218838;
            }
        `;
        
        document.head.appendChild(style);
    }
}

// 创建全局模态框管理器实例
window.modalManager = new ModalManager();

// 添加样式
window.modalManager.addStyles();
