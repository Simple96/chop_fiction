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
            Utils.showNotification('初始化失败，请刷新页面重试', 'error');
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
            const { data, error } = await this.client.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username: username
                    }
                }
            });
            
            if (error) throw error;
            
            Utils.showNotification('注册成功！请检查邮箱验证链接', 'success');
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
            
            Utils.showNotification('登录成功！', 'success');
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
            
            Utils.showNotification('已退出登录', 'info');
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            Utils.showNotification('退出登录失败', 'error');
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
            
            Utils.showNotification('资料更新成功', 'success');
            return { success: true, data };
        } catch (error) {
            console.error('Update profile error:', error);
            Utils.showNotification('资料更新失败', 'error');
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
    async addToBookshelf(novelId) {
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
            
            Utils.showNotification('已添加到书架', 'success');
            return { success: true, data };
        } catch (error) {
            console.error('Add to bookshelf error:', error);
            if (error.code === '23505') {
                Utils.showNotification('该小说已在书架中', 'warning');
            } else {
                Utils.showNotification('添加到书架失败', 'error');
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
            
            Utils.showNotification('已从书架移除', 'success');
            return { success: true };
        } catch (error) {
            console.error('Remove from bookshelf error:', error);
            Utils.showNotification('从书架移除失败', 'error');
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
    
    // 检查是否已购买
    async checkPurchase(novelId) {
        try {
            if (!this.user) return { success: true, purchased: false };
            
            const { data, error } = await this.client
                .from('user_purchases')
                .select('id')
                .eq('user_id', this.user.id)
                .eq('novel_id', novelId)
                .single();
                
            if (error && error.code !== 'PGRST116') throw error;
            
            return { success: true, purchased: !!data };
        } catch (error) {
            console.error('Check purchase error:', error);
            return { success: false, error };
        }
    }
    
    // 购买小说
    async purchaseNovel(novelId) {
        try {
            if (!this.user) throw new Error('User not authenticated');
            
            const { data, error } = await this.client
                .from('user_purchases')
                .insert({
                    user_id: this.user.id,
                    novel_id: novelId
                })
                .select()
                .single();
                
            if (error) throw error;
            
            Utils.showNotification('购买成功！', 'success');
            return { success: true, data };
        } catch (error) {
            console.error('Purchase novel error:', error);
            if (error.code === '23505') {
                Utils.showNotification('您已购买过这本小说', 'warning');
            } else {
                Utils.showNotification('购买失败，请稍后重试', 'error');
            }
            return { success: false, error };
        }
    }
    
    // 获取用户统计信息
    async getUserStats() {
        try {
            if (!this.user) throw new Error('User not authenticated');
            
            // 并行获取统计数据
            const [bookshelfResult, purchaseResult] = await Promise.all([
                this.client
                    .from('user_bookshelf')
                    .select('id')
                    .eq('user_id', this.user.id),
                this.client
                    .from('user_purchases')
                    .select('id')
                    .eq('user_id', this.user.id)
            ]);
            
            if (bookshelfResult.error) throw bookshelfResult.error;
            if (purchaseResult.error) throw purchaseResult.error;
            
            return {
                success: true,
                data: {
                    bookshelfCount: bookshelfResult.data.length,
                    purchaseCount: purchaseResult.data.length
                }
            };
        } catch (error) {
            console.error('Get user stats error:', error);
            return { success: false, error };
        }
    }
    
    // 获取错误消息
    getErrorMessage(error) {
        const errorMessages = {
            'Invalid login credentials': '邮箱或密码错误',
            'Email not confirmed': '请先验证邮箱',
            'User not found': '用户不存在',
            'Invalid email': '邮箱格式不正确',
            'Password should be at least 6 characters': '密码至少需要6个字符',
            'User already registered': '用户已存在',
            'Email already registered': '邮箱已被注册',
            'Network request failed': '网络连接失败，请检查网络',
            'Timeout': '请求超时，请重试'
        };
        
        return errorMessages[error.message] || error.message || '操作失败，请稍后重试';
    }
}

// 创建全局 Supabase 客户端实例
window.supabaseClient = new SupabaseClient();
