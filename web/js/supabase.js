// Supabase 客户端配置
class SupabaseClient {
    constructor() {
        this.client = null;
        this.user = null;
        this.session = null;
        this.initClient();
    }
    
    // 初始化 Supabase 客户端
    initClient() {
        try {
            this.client = supabase.createClient(
                CONFIG.SUPABASE_URL, 
                CONFIG.SUPABASE_ANON_KEY,
                {
                    auth: {
                        autoRefreshToken: true,
                        persistSession: true,
                        detectSessionInUrl: false,
                        storage: {
                            getItem: (key) => Utils.storage.get(key),
                            setItem: (key, value) => Utils.storage.set(key, value),
                            removeItem: (key) => Utils.storage.remove(key)
                        }
                    }
                }
            );
            
            // 监听认证状态变化
            this.client.auth.onAuthStateChange((event, session) => {
                console.log('Auth state changed:', event, session);
                this.session = session;
                this.user = session?.user || null;
                
                // 触发自定义事件
                window.dispatchEvent(new CustomEvent('authStateChange', {
                    detail: { event, session, user: this.user }
                }));
            });
            
            console.log('Supabase client initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Supabase client:', error);
            Utils.showNotification('Initialization failed, please refresh the page and try again', 'error');
        }
    }
    
    // 获取当前会话
    async getSession() {
        try {
            const { data, error } = await this.client.auth.getSession();
            if (error) throw error;
            
            this.session = data.session;
            this.user = data.session?.user || null;
            
            return { session: this.session, user: this.user };
        } catch (error) {
            console.error('Get session error:', error);
            return { session: null, user: null };
        }
    }
    
    // 用户注册
    async signUp(email, password, username = null) {
        try {
            // 获取当前域名作为回调URL基础
            const baseUrl = window.location.origin;
            const redirectUrl = `${baseUrl}/auth-callback.html`;
            
            const { data, error } = await this.client.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username: username
                    },
                    emailRedirectTo: redirectUrl
                }
            });
            
            if (error) throw error;
            
            Utils.showNotification('Registration successful! Please check your email for verification link', 'success');
            return { success: true, data };
        } catch (error) {
            console.error('Sign up error:', error);
            Utils.showNotification(this.getErrorMessage(error), 'error');
            return { success: false, error };
        }
    }
    
    // 用户登录
    async signIn(email, password) {
        try {
            const { data, error } = await this.client.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) throw error;
            
            Utils.showNotification('Login successful!', 'success');
            return { success: true, data };
        } catch (error) {
            console.error('Sign in error:', error);
            Utils.showNotification(this.getErrorMessage(error), 'error');
            return { success: false, error };
        }
    }
    
    // 用户登出
    async signOut() {
        try {
            const { error } = await this.client.auth.signOut();
            if (error) throw error;
            
            Utils.showNotification('Logged out successfully', 'info');
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            Utils.showNotification('Logout failed', 'error');
            return { success: false, error };
        }
    }
    
    // 获取用户资料
    async getProfile(userId = null) {
        try {
            const id = userId || this.user?.id;
            if (!id) throw new Error('User not authenticated');
            
            const { data, error } = await this.client
                .from('profiles')
                .select('*')
                .eq('id', id)
                .single();
                
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Get profile error:', error);
            return { success: false, error };
        }
    }
    
    // 更新用户资料
    async updateProfile(updates) {
        try {
            if (!this.user) throw new Error('User not authenticated');
            
            const { data, error } = await this.client
                .from('profiles')
                .update(updates)
                .eq('id', this.user.id)
                .select()
                .single();
                
            if (error) throw error;
            
            Utils.showNotification('Profile updated successfully', 'success');
            return { success: true, data };
        } catch (error) {
            console.error('Update profile error:', error);
            Utils.showNotification('Profile update failed', 'error');
            return { success: false, error };
        }
    }
    
    // 获取小说列表
    async getNovels(options = {}) {
        try {
            let query = this.client
                .from('novels')
                .select('*');
                
            // 应用筛选条件
            if (options.category) {
                query = query.eq('category', options.category);
            }
            
            if (options.search) {
                query = query.or(`title.ilike.%${options.search}%,author.ilike.%${options.search}%,description.ilike.%${options.search}%`);
            }
            
            // 应用排序
            const orderBy = options.orderBy || 'created_at';
            const ascending = options.ascending !== undefined ? options.ascending : false;
            query = query.order(orderBy, { ascending });
            
            // 应用分页
            if (options.limit) {
                query = query.limit(options.limit);
            }
            
            if (options.offset) {
                query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
            }
            
            const { data, error } = await query;
            if (error) throw error;
            
            return { success: true, data };
        } catch (error) {
            console.error('Get novels error:', error);
            return { success: false, error };
        }
    }
    
    // 获取单个小说详情
    async getNovel(novelId) {
        try {
            const { data, error } = await this.client
                .from('novels')
                .select('*')
                .eq('id', novelId)
                .single();
                
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Get novel error:', error);
            return { success: false, error };
        }
    }
    
    // 获取章节列表
    async getChapters(novelId) {
        try {
            const { data, error } = await this.client
                .from('chapters')
                .select('*')
                .eq('novel_id', novelId)
                .order('chapter_number', { ascending: true });
                
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Get chapters error:', error);
            return { success: false, error };
        }
    }
    
    // 获取单个章节
    async getChapter(novelId, chapterNumber) {
        try {
            const { data, error } = await this.client
                .from('chapters')
                .select('*')
                .eq('novel_id', novelId)
                .eq('chapter_number', chapterNumber)
                .single();
                
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Get chapter error:', error);
            return { success: false, error };
        }
    }
    
    // 获取用户书架
    async getBookshelf() {
        try {
            if (!this.user) throw new Error('User not authenticated');
            
            const { data, error } = await this.client
                .from('user_bookshelf')
                .select(`
                    *,
                    novel:novels(*)
                `)
                .eq('user_id', this.user.id)
                .order('added_at', { ascending: false });
                
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Get bookshelf error:', error);
            return { success: false, error };
        }
    }
    
    // 添加到书架
    async addToBookshelf(novelId, showNotification = true) {
        try {
            if (!this.user) throw new Error('User not authenticated');
            
            const { data, error } = await this.client
                .from('user_bookshelf')
                .insert({
                    user_id: this.user.id,
                    novel_id: novelId
                })
                .select()
                .single();
                
            if (error) throw error;
            
            if (showNotification) {
                Utils.showNotification('Added to bookshelf', 'success');
            }
            return { success: true, data };
        } catch (error) {
            console.error('Add to bookshelf error:', error);
            if (error.code === '23505') {
                // 书籍已经在书架中，不显示警告弹窗
                if (showNotification) {
                    Utils.showNotification('This novel is already in your bookshelf', 'warning');
                }
                return { success: true, data: null, alreadyExists: true };
            } else {
                if (showNotification) {
                    Utils.showNotification('Failed to add to bookshelf', 'error');
                }
            }
            return { success: false, error };
        }
    }
    
    // 从书架移除
    async removeFromBookshelf(novelId) {
        try {
            if (!this.user) throw new Error('User not authenticated');
            
            const { error } = await this.client
                .from('user_bookshelf')
                .delete()
                .eq('user_id', this.user.id)
                .eq('novel_id', novelId);
                
            if (error) throw error;
            
            Utils.showNotification('Removed from bookshelf', 'success');
            return { success: true };
        } catch (error) {
            console.error('Remove from bookshelf error:', error);
            Utils.showNotification('Failed to remove from bookshelf', 'error');
            return { success: false, error };
        }
    }
    
    // 更新阅读进度
    async updateReadingProgress(novelId, chapterNumber) {
        try {
            if (!this.user) throw new Error('User not authenticated');
            
            const { data, error } = await this.client
                .from('user_bookshelf')
                .update({ last_read_chapter: chapterNumber })
                .eq('user_id', this.user.id)
                .eq('novel_id', novelId)
                .select()
                .single();
                
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Update reading progress error:', error);
            return { success: false, error };
        }
    }
    
    // 检查是否可阅读（订阅制：有有效订阅即可阅读全部非免费章节）
    async checkPurchase(novelId) {
        try {
            if (!this.user) return { success: true, purchased: false };
            const sub = await this.hasValidSubscription();
            if (!sub.success) return { success: false, error: sub.error };
            return { success: true, purchased: sub.hasSubscription };
        } catch (error) {
            console.error('Check purchase error:', error);
            return { success: false, error };
        }
    }

    // 购买小说（订阅制下不再支持逐本购买，统一提示走订阅）
    async purchaseNovel() {
        Utils.showNotification('Please subscribe to unlock all novels', 'info');
        return { success: false, error: 'subscription_required' };
    }
    
    // 获取用户统计信息
    async getUserStats() {
        try {
            if (!this.user) throw new Error('User not authenticated');
            
            // 并行获取统计数据
            const [bookshelfResult, purchaseResult, subscriptionResult] = await Promise.all([
                this.client
                    .from('user_bookshelf')
                    .select('id')
                    .eq('user_id', this.user.id),
                this.client
                    .from('user_purchases')
                    .select('id')
                    .eq('user_id', this.user.id),
                this.getUserSubscription()
            ]);
            
            if (bookshelfResult.error) throw bookshelfResult.error;
            if (purchaseResult.error) throw purchaseResult.error;
            
            return {
                success: true,
                data: {
                    bookshelfCount: bookshelfResult.data.length,
                    purchaseCount: purchaseResult.data.length,
                    hasSubscription: subscriptionResult.success && subscriptionResult.subscription?.status === 'active'
                }
            };
        } catch (error) {
            console.error('Get user stats error:', error);
            return { success: false, error };
        }
    }
    
    // 获取用户订阅信息
    async getUserSubscription() {
        try {
            if (!this.user) {
                console.log('getUserSubscription: User not authenticated');
                return { success: true, subscription: null };
            }
            
            console.log('getUserSubscription: Querying for user_id:', this.user.id);
            
            // 使用 .maybeSingle() 而不是 .single() 来避免 PGRST116 错误
            const { data, error } = await this.client
                .from('user_subscriptions')
                .select('*')
                .eq('user_id', this.user.id)
                .maybeSingle();
                
            console.log('getUserSubscription: Query result:', { data, error });
            
            if (error) {
                console.error('getUserSubscription: Database error:', error);
                throw error;
            }
            
            // data 为 null 表示没有找到记录，这是正常的
            return { success: true, subscription: data };
        } catch (error) {
            console.error('Get user subscription error:', error);
            return { success: false, error };
        }
    }
    
    // 创建或更新用户订阅
    async upsertUserSubscription(subscriptionData) {
        try {
            if (!this.user) {
                console.error('upsertUserSubscription: User not authenticated');
                throw new Error('User not authenticated');
            }
            
            const subscriptionRecord = {
                user_id: this.user.id,
                ...subscriptionData
            };
            
            console.log('upsertUserSubscription: Upserting subscription:', subscriptionRecord);
            
            const { data, error } = await this.client
                .from('user_subscriptions')
                .upsert(subscriptionRecord)
                .select()
                .maybeSingle();
                
            console.log('upsertUserSubscription: Upsert result:', { data, error });
            
            if (error) {
                console.error('upsertUserSubscription: Database error:', error);
                throw error;
            }
            
            console.log('upsertUserSubscription: Successfully upserted subscription:', data);
            return { success: true, data };
        } catch (error) {
            console.error('Upsert user subscription error:', error);
            return { success: false, error };
        }
    }
    
    // 检查用户是否有有效订阅
    async hasValidSubscription() {
        try {
            const result = await this.getUserSubscription();
            if (!result.success || !result.subscription) {
                return { success: true, hasSubscription: false };
            }
            
            const subscription = result.subscription;
            const now = new Date();
            const expiryDate = new Date(subscription.current_period_end);
            
            const isValid = subscription.status === 'active' && expiryDate > now;
            
            return { success: true, hasSubscription: isValid };
        } catch (error) {
            console.error('Check valid subscription error:', error);
            return { success: false, error };
        }
    }
    
    // 获取错误消息
    getErrorMessage(error) {
        const errorMessages = {
            'Invalid login credentials': 'Incorrect email or password',
            'Email not confirmed': 'Please verify your email first',
            'User not found': 'User does not exist',
            'Invalid email': 'Invalid email format',
            'Password should be at least 6 characters': 'Password must be at least 6 characters',
            'User already registered': 'User already exists',
            'Email already registered': 'Email is already registered',
            'Network request failed': 'Network connection failed, please check your connection',
            'Timeout': 'Request timeout, please try again'
        };
        
        return errorMessages[error.message] || error.message || 'Operation failed, please try again later';
    }
}

// 创建全局 Supabase 客户端实例
window.supabaseClient = new SupabaseClient();
