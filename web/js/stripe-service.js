// Stripe 支付服务
class StripeService {
    constructor() {
        this.stripe = null;
        this.isInitialized = false;
        // 延迟初始化，等待页面完全加载
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => this.init(), 100);
            });
        } else {
            setTimeout(() => this.init(), 100);
        }
    }
    
    // 初始化 Stripe
    async init() {
        try {
            // 检查CONFIG是否已加载
            if (!window.CONFIG || !CONFIG.STRIPE_PUBLISHABLE_KEY) {
                console.error('CONFIG or STRIPE_PUBLISHABLE_KEY not available');
                throw new Error('Stripe configuration not available');
            }
            
            // 动态加载 Stripe.js
            if (!window.Stripe) {
                await this.loadStripeScript();
            }
            
            // 初始化 Stripe 客户端
            this.stripe = Stripe(CONFIG.STRIPE_PUBLISHABLE_KEY);
            this.isInitialized = true;
            console.log('Stripe initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Stripe:', error);
            Utils.showNotification('Payment system initialization failed', 'error');
        }
    }
    
    // 动态加载 Stripe.js 脚本
    loadStripeScript() {
        return new Promise((resolve, reject) => {
            if (window.Stripe) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://js.stripe.com/v3/';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    // 创建订阅
    async createSubscription(priceId, successUrl, cancelUrl) {
        try {
            if (!this.isInitialized) {
                await this.init();
            }
            
            if (!window.authManager.isAuthenticated()) {
                throw new Error('User must be logged in to subscribe');
            }
            
            // 调用后端 API 创建 Checkout Session
            const response = await this.createCheckoutSession(priceId, successUrl, cancelUrl);
            
            // createCheckoutSession 方法已经处理了重定向逻辑
            if (response.success) {
                return response;
            } else {
                throw new Error(response.error || 'Failed to create checkout session');
            }
            
        } catch (error) {
            console.error('Create subscription error:', error);
            Utils.showNotification(error.message || 'Subscription creation failed', 'error');
            throw error;
        }
    }
    
    // 创建 Checkout Session (通过后端 API)
    async createCheckoutSession(priceId, successUrl, cancelUrl) {
        try {
            const user = window.authManager.getCurrentUser();
            if (!user) {
                throw new Error('User not authenticated');
            }
            
            // 构建完整的 URL
            const fullSuccessUrl = new URL(successUrl.startsWith('http') ? successUrl : successUrl, window.location.origin).toString();
            const fullCancelUrl = new URL(cancelUrl.startsWith('http') ? cancelUrl : cancelUrl, window.location.origin).toString();

            // 获取access token
            const session = window.authManager.getCurrentSession();
            const accessToken = session?.access_token;
            
            if (!accessToken) {
                throw new Error('No access token available. Please log in again.');
            }
            
            const response = await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/create-checkout-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    priceId,
                    successUrl: fullSuccessUrl,
                    cancelUrl: fullCancelUrl
                })
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Failed to create checkout session');
            }

            if (!result.success) {
                throw new Error(result.error || 'Failed to create checkout session');
            }

            // 重定向到 Stripe Checkout
            if (result.url) {
                window.location.href = result.url;
                return { success: true };
            } else if (result.sessionId) {
                // 使用 sessionId 重定向
                const { error } = await this.stripe.redirectToCheckout({
                    sessionId: result.sessionId
                });
                
                if (error) {
                    throw error;
                }
            } else {
                throw new Error('No URL or sessionId provided by checkout session');
            }

            // 存储支付信息以便支付成功后处理
            const pendingData = {
                priceId,
                timestamp: Date.now(),
                customerId: user.id
            };
            sessionStorage.setItem('pendingSubscription', JSON.stringify(pendingData));

            return {
                success: true
            };
        } catch (error) {
            console.error('Create checkout session error:', error);
            return { success: false, error: error.message };
        }
    }
    
    // 获取用户订阅状态
    async getSubscriptionStatus() {
        try {
            const user = window.authManager.getCurrentUser();
            if (!user) {
                return { success: true, subscription: null };
            }
            
            // 从 Supabase 获取订阅状态
            const result = await window.supabaseClient.getUserSubscription();
            return result;
        } catch (error) {
            console.error('Get subscription status error:', error);
            return { success: false, error };
        }
    }
    
    // 检查用户是否有有效订阅
    async hasValidSubscription() {
        try {
            const result = await this.getSubscriptionStatus();
            if (!result.success || !result.subscription) {
                return false;
            }
            
            const subscription = result.subscription;
            const now = new Date();
            const expiryDate = new Date(subscription.current_period_end);
            
            return subscription.status === 'active' && expiryDate > now;
        } catch (error) {
            console.error('Check subscription error:', error);
            return false;
        }
    }
    
    // 取消订阅
    async cancelSubscription() {
        try {
            const user = window.authManager.getCurrentUser();
            if (!user) {
                throw new Error('User not authenticated');
            }
            
            const response = await fetch('/api/cancel-subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.access_token}`
                },
                body: JSON.stringify({
                    userId: user.id
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to cancel subscription');
            }
            
            const result = await response.json();
            
            if (result.success) {
                Utils.showNotification('Subscription cancelled successfully', 'success');
                // 刷新订阅状态
                window.dispatchEvent(new CustomEvent('subscriptionChanged'));
            }
            
            return result;
        } catch (error) {
            console.error('Cancel subscription error:', error);
            Utils.showNotification('Failed to cancel subscription', 'error');
            return { success: false, error };
        }
    }
    
    // 管理订阅（跳转到客户门户）
    async manageSubscription() {
        try {
            const user = window.authManager.getCurrentUser();
            if (!user) {
                throw new Error('User not authenticated');
            }
            
            // 获取access token
            const session = window.authManager.getCurrentSession();
            const accessToken = session?.access_token;
            
            if (!accessToken) {
                throw new Error('No access token available. Please log in again.');
            }
            
            const response = await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/create-portal-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    userId: user.id,
                    returnUrl: window.location.origin + '/app.html#profile'
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create portal session');
            }
            
            const result = await response.json();
            
            if (result.success && result.url) {
                window.location.href = result.url;
            } else {
                throw new Error(result.error || 'Failed to create portal session');
            }
            
            return result;
        } catch (error) {
            console.error('Manage subscription error:', error);
            Utils.showNotification('Unable to access subscription management', 'error');
            return { success: false, error };
        }
    }
    
    // 格式化价格显示
    formatPrice(amount, currency = 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    }
    
    // 获取订阅计划信息
    getSubscriptionPlans() {
        return [
            {
                id: 'monthly',
                name: 'Monthly Subscription',
                description: 'Access all novels, unlimited reading',
                price: CONFIG.SUBSCRIPTION_PRICES.monthly.amount,
                currency: CONFIG.SUBSCRIPTION_PRICES.monthly.currency,
                interval: 'month',
                priceId: CONFIG.STRIPE_MONTHLY_PRICE_ID,
                features: [
                    'Unlimited access to all novels',
                    'Read beyond first 3 chapters',
                    'No ads',
                    'Early access to new releases'
                ]
            },
            {
                id: 'yearly',
                name: 'Yearly Subscription',
                description: 'Best value - 2 months free!',
                price: CONFIG.SUBSCRIPTION_PRICES.yearly.amount,
                currency: CONFIG.SUBSCRIPTION_PRICES.yearly.currency,
                interval: 'year',
                priceId: CONFIG.STRIPE_YEARLY_PRICE_ID,
                features: [
                    'Unlimited access to all novels',
                    'Read beyond first 3 chapters',
                    'No ads',
                    'Early access to new releases',
                    'Save 17% compared to monthly'
                ],
                popular: true
            }
        ];
    }
    
    // 显示订阅选择模态框
    showSubscriptionModal() {
        console.log('=== showSubscriptionModal called ===');
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        const confirmBtn = document.getElementById('modal-confirm');
        const cancelBtn = document.getElementById('modal-cancel');
        
        modalTitle.textContent = 'Choose Your Subscription Plan';
        
        const plans = this.getSubscriptionPlans();
        const plansHtml = plans.map(plan => `
            <div class="subscription-plan ${plan.popular ? 'popular' : ''}" data-plan-id="${plan.id}">
                ${plan.popular ? '<div class="plan-badge">Most Popular</div>' : ''}
                <h3 class="plan-name">${plan.name}</h3>
                <div class="plan-price">
                    ${this.formatPrice(plan.price, plan.currency)}
                    <span class="plan-interval">/${plan.interval}</span>
                </div>
                <p class="plan-description">${plan.description}</p>
                <ul class="plan-features">
                    ${plan.features.map(feature => `<li><i class="fas fa-check"></i> ${feature}</li>`).join('')}
                </ul>
                <button class="plan-select-btn" data-price-id="${plan.priceId}">
                    Select ${plan.name}
                </button>
            </div>
        `).join('');
        
        modalBody.innerHTML = `
            <div class="subscription-plans">
                ${plansHtml}
            </div>
            <div class="subscription-note">
                <p><i class="fas fa-info-circle"></i> You can cancel anytime. No commitment required.</p>
            </div>
        `;
        
        // 添加样式
        if (!document.querySelector('.subscription-modal-styles')) {
            const styles = document.createElement('style');
            styles.className = 'subscription-modal-styles';
            styles.textContent = `
                .subscription-plans {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 20px;
                    margin-bottom: 20px;
                }
                
                .subscription-plan {
                    position: relative;
                    border: 2px solid #e0e0e0;
                    border-radius: 12px;
                    padding: 24px;
                    text-align: center;
                    transition: all 0.3s ease;
                    background: white;
                }
                
                .subscription-plan:hover {
                    border-color: #C0392B;
                    box-shadow: 0 4px 12px rgba(192, 57, 43, 0.1);
                }
                
                .subscription-plan.popular {
                    border-color: #C0392B;
                    box-shadow: 0 4px 12px rgba(192, 57, 43, 0.1);
                }
                
                .plan-badge {
                    position: absolute;
                    top: -10px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #C0392B;
                    color: white;
                    padding: 4px 16px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                }
                
                .plan-name {
                    font-size: 20px;
                    font-weight: 600;
                    color: #2C3E50;
                    margin-bottom: 12px;
                }
                
                .plan-price {
                    font-size: 32px;
                    font-weight: 700;
                    color: #C0392B;
                    margin-bottom: 8px;
                }
                
                .plan-interval {
                    font-size: 16px;
                    color: #666;
                    font-weight: normal;
                }
                
                .plan-description {
                    color: #666;
                    margin-bottom: 20px;
                    font-size: 14px;
                }
                
                .plan-features {
                    list-style: none;
                    padding: 0;
                    margin: 0 0 24px 0;
                    text-align: left;
                }
                
                .plan-features li {
                    padding: 6px 0;
                    color: #333;
                    font-size: 14px;
                }
                
                .plan-features i {
                    color: #28a745;
                    margin-right: 8px;
                    width: 16px;
                }
                
                .plan-select-btn {
                    width: 100%;
                    background: #C0392B;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background-color 0.3s ease;
                }
                
                .plan-select-btn:hover {
                    background: #A93226;
                }
                
                .subscription-note {
                    text-align: center;
                    color: #666;
                    font-size: 14px;
                    padding: 16px;
                    background: #f8f9fa;
                    border-radius: 8px;
                }
                
                .subscription-note i {
                    color: #17a2b8;
                    margin-right: 8px;
                }
            `;
            document.head.appendChild(styles);
        }
        
        // 隐藏默认按钮
        confirmBtn.style.display = 'none';
        cancelBtn.textContent = 'Close';
        
        // 绑定位于卡片内的选择按钮
        modalBody.querySelectorAll('.plan-select-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const priceId = btn.getAttribute('data-price-id');
                modal.classList.add('hidden');
                await this.startSubscriptionFlow(priceId);
            });
        });

        // 绑定右上角 X 和底部 Close 按钮
        const closeBtn = document.querySelector('.notification-close') || cancelBtn; // 兜底
        const bindClose = (el) => el && el.addEventListener('click', () => modal.classList.add('hidden'));
        bindClose(cancelBtn);
        // 模态头可能有 X，若无仅保留 cancelBtn 即可
        
        // 显示模态框
        modal.classList.remove('hidden');
    }
    
    // 开始订阅流程
    async startSubscriptionFlow(priceId) {
        try {
            Utils.showNotification('Redirecting to payment...', 'info');
            
            // 使用绝对 URL，直接跳转到 profile 页面，并包含 session_id
            const successUrl = new URL('/app.html?subscription=success&session_id={CHECKOUT_SESSION_ID}', window.location.origin).toString();
            const cancelUrl = new URL('/app.html?subscription=cancelled', window.location.origin).toString();
            
            const result = await this.createSubscription(priceId, successUrl, cancelUrl);
            
            // 检查结果
            if (result && result.success) {
                // 如果createSubscription返回成功，说明已经跳转到Stripe，不需要做其他事情
                return;
            } else {
                Utils.showNotification('Failed to start subscription process', 'error');
            }
        } catch (error) {
            console.error('Subscription flow error:', error);
            Utils.showNotification('Failed to start subscription process', 'error');
        }
    }

    // 处理支付成功
    handlePaymentSuccess() {
        // 刷新用户订阅状态
        this.getSubscriptionStatus().then(result => {
            if (result.success && result.subscription) {
                Utils.showNotification('Subscription activated successfully!', 'success');
                // 触发订阅状态变化事件
                window.dispatchEvent(new CustomEvent('subscriptionChanged', {
                    detail: { subscription: result.subscription }
                }));
            }
        });
    }

    // 处理支付取消
    handlePaymentCancelled() {
        Utils.showNotification('Subscription process cancelled', 'info');
    }
}

// 创建全局 Stripe 服务实例
window.stripeService = new StripeService();


