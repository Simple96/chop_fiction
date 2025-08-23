// 订阅管理器 - 临时方案，用于在 Webhook 部署前测试
class SubscriptionManager {
    constructor() {
        this.init();
    }
    
    init() {
        // 监听支付成功事件
        window.addEventListener('subscriptionPaymentSuccess', (e) => {
            this.handlePaymentSuccess(e.detail);
        });
        
        // 页面加载时检查是否有待处理的订阅
        this.checkPendingSubscription();
    }
    
    // 检查待处理的订阅
    async checkPendingSubscription() {
        try {
            const pendingSubscription = sessionStorage.getItem('pendingSubscription');
            if (pendingSubscription) {
                const subscriptionData = JSON.parse(pendingSubscription);
                
                // 延迟处理，确保用户已登录
                setTimeout(() => {
                    this.handlePaymentSuccess(subscriptionData);
                }, 2000);
            }
        } catch (error) {
            console.error('检查待处理订阅时出错:', error);
        }
    }
    
    // 处理支付成功（等待webhook处理）
    async handlePaymentSuccess(paymentDetails) {
        try {
            const user = window.authManager.getCurrentUser();
            if (!user) {
                console.error('用户未登录，等待登录后重试');
                // 存储支付详情，等待用户登录后处理
                sessionStorage.setItem('pendingSubscription', JSON.stringify(paymentDetails));
                return;
            }
            
            // 清除待处理的订阅信息
            sessionStorage.removeItem('pendingSubscription');
            
            // 显示等待消息
            Utils.showNotification('支付成功！正在激活订阅，请稍候...', 'info');
            
            // 等待webhook处理（最多等待30秒）
            let attempts = 0;
            const maxAttempts = 30;
            
            const checkSubscription = async () => {
                attempts++;
                
                const result = await window.supabaseClient.getUserSubscription();
                if (result.success && result.subscription && result.subscription.status === 'active') {
                    Utils.showNotification('订阅激活成功！现在可以无限制阅读所有小说。', 'success');
                    
                    // 触发订阅状态变化事件
                    window.dispatchEvent(new CustomEvent('subscriptionChanged', {
                        detail: { subscription: result.subscription }
                    }));
                    
                    // 刷新个人中心
                    if (window.profileManager) {
                        setTimeout(() => {
                            window.profileManager.refresh();
                        }, 1000);
                    }
                    return;
                }
                
                if (attempts < maxAttempts) {
                    // 继续等待
                    setTimeout(checkSubscription, 1000);
                } else {
                    console.error('等待webhook处理超时');
                    Utils.showNotification('订阅激活延迟，请刷新页面查看状态。', 'warning');
                }
            };
            
            // 开始检查
            setTimeout(checkSubscription, 2000); // 等待2秒后开始检查
            
        } catch (error) {
            console.error('处理支付成功事件时出错:', error);
            Utils.showNotification('订阅激活出现问题，请联系客服。', 'error');
        }
    }
    
    // 备用方法创建订阅
    async createSubscriptionFallback(paymentDetails, user) {
        try {
            console.log('使用备用方法创建订阅...');
            
            // 使用更简单的数据结构
            const subscriptionData = {
                user_id: user.id,
                stripe_subscription_id: 'fallback_' + Date.now(),
                stripe_customer_id: user.id,
                status: 'active',
                current_period_start: new Date().toISOString(),
                current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                interval: 'month',
                amount: 9.99,
                currency: 'usd'
            };
            
            console.log('备用订阅数据:', subscriptionData);
            
            // 直接使用Supabase客户端
            const { data, error } = await window.supabaseClient.client
                .from('user_subscriptions')
                .insert(subscriptionData)
                .select()
                .maybeSingle();
            
            if (error) {
                console.error('备用方法数据库错误:', error);
                return { success: false, error };
            }
            
            return { success: true, data };
            
        } catch (error) {
            console.error('备用方法出错:', error);
            return { success: false, error };
        }
    }
    
    // 根据价格 ID 计算订阅结束时间
    calculatePeriodEnd(priceId) {
        const now = new Date();
        
        if (priceId === CONFIG.STRIPE_MONTHLY_PRICE_ID) {
            // 月度订阅：30天后
            return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
        } else if (priceId === CONFIG.STRIPE_YEARLY_PRICE_ID) {
            // 年度订阅：365天后
            return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
        } else {
            // 默认30天
            return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
        }
    }
    
    // 根据价格 ID 获取计费周期
    getIntervalFromPriceId(priceId) {
        if (priceId === CONFIG.STRIPE_MONTHLY_PRICE_ID) {
            return 'month';
        } else if (priceId === CONFIG.STRIPE_YEARLY_PRICE_ID) {
            return 'year';
        } else {
            return 'month';
        }
    }
    
    // 根据价格 ID 获取金额
    getAmountFromPriceId(priceId) {
        if (priceId === CONFIG.STRIPE_MONTHLY_PRICE_ID) {
            return CONFIG.SUBSCRIPTION_PRICES.monthly.amount;
        } else if (priceId === CONFIG.STRIPE_YEARLY_PRICE_ID) {
            return CONFIG.SUBSCRIPTION_PRICES.yearly.amount;
        } else {
            return CONFIG.SUBSCRIPTION_PRICES.monthly.amount;
        }
    }
    
    // 检查是否为测试模式的订阅
    isTestSubscription(subscriptionId) {
        return subscriptionId && (subscriptionId.startsWith('temp_') || subscriptionId.includes('test'));
    }
    
    // 清理测试订阅记录
    async cleanupTestSubscriptions() {
        try {
            const user = window.authManager.getCurrentUser();
            if (!user) return;
            
            console.log('清理测试订阅记录...');
            
            // 这里可以添加清理逻辑，比如删除所有临时订阅记录
            // 在生产环境中应该谨慎使用
            
        } catch (error) {
            console.error('清理测试订阅记录时出错:', error);
        }
    }
    

}

// 创建全局订阅管理器实例
window.subscriptionManager = new SubscriptionManager();

