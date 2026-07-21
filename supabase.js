// ============================================
// GRADETRACK - Supabase Configuration & Auth
// ============================================

// Supabase Configuration
const SUPABASE_CONFIG = {
    url: 'https://qehjlacszztwcnvyakyj.supabase.co',
    anonKey: 'sb_publishable_c66L79smyztSC73jmOeDHQ_Jldp1OXx',
    options: {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false
        }
    }
};

// Initialize Supabase Client
const supabase = window.supabase.createClient(
    SUPABASE_CONFIG.url,
    SUPABASE_CONFIG.anonKey,
    SUPABASE_CONFIG.options
);

// ============================================
// AUTH SERVICE
// ============================================

class AuthService {
    constructor() {
        this.user = null;
        this.session = null;
        this.isAuthenticated = false;
    }

    // Initialize authentication with Telegram
    async initAuth() {
        try {
            // Check if Telegram WebApp is available
            if (!window.Telegram || !window.Telegram.WebApp) {
                console.warn('Telegram WebApp not detected, using demo mode');
                return await this.initDemoMode();
            }

            const tg = window.Telegram.WebApp;
            const initData = tg.initData || '';
            const initDataUnsafe = tg.initDataUnsafe || {};

            // Extract user data from Telegram
            const telegramUser = initDataUnsafe.user;
            
            if (!telegramUser || !telegramUser.id) {
                console.warn('No Telegram user data, using demo mode');
                return await this.initDemoMode();
            }

            // Set user data from Telegram
            const userData = {
                telegram_id: telegramUser.id,
                first_name: telegramUser.first_name || '',
                last_name: telegramUser.last_name || '',
                username: telegramUser.username || '',
                photo_url: telegramUser.photo_url || ''
            };

            // Authenticate with Supabase
            return await this.authenticateUser(userData);

        } catch (error) {
            console.error('Auth initialization error:', error);
            return await this.initDemoMode();
        }
    }

    // Authenticate user with Supabase
    async authenticateUser(userData) {
        try {
            // Check if user exists
            let { data: existingUser, error: fetchError } = await supabase
                .from('users')
                .select('*')
                .eq('telegram_id', userData.telegram_id)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                console.error('Error fetching user:', fetchError);
                throw fetchError;
            }

            if (existingUser) {
                // User exists, update info
                const { data: updatedUser, error: updateError } = await supabase
                    .from('users')
                    .update({
                        first_name: userData.first_name,
                        last_name: userData.last_name,
                        username: userData.username,
                        photo_url: userData.photo_url,
                        updated_at: new Date().toISOString()
                    })
                    .eq('telegram_id', userData.telegram_id)
                    .select()
                    .single();

                if (updateError) {
                    console.error('Error updating user:', updateError);
                    throw updateError;
                }

                this.user = updatedUser;
            } else {
                // Create new user
                const { data: newUser, error: insertError } = await supabase
                    .from('users')
                    .insert([{
                        telegram_id: userData.telegram_id,
                        first_name: userData.first_name,
                        last_name: userData.last_name,
                        username: userData.username,
                        photo_url: userData.photo_url,
                        total_credits: 0,
                        completed_credits: 0,
                        current_cgpa: 0.00,
                        target_cgpa: 4.00
                    }])
                    .select()
                    .single();

                if (insertError) {
                    console.error('Error creating user:', insertError);
                    throw insertError;
                }

                this.user = newUser;
            }

            this.isAuthenticated = true;
            this.saveUserToLocal();
            
            console.log('✅ User authenticated:', this.user);
            return this.user;

        } catch (error) {
            console.error('Authentication error:', error);
            return await this.initDemoMode();
        }
    }

    // Demo mode for testing without Telegram
    async initDemoMode() {
        console.log('🔄 Running in Demo Mode');
        
        const demoUser = {
            id: 'demo-user-123',
            telegram_id: 123456789,
            first_name: 'Demo',
            last_name: 'Student',
            username: 'demostudent',
            photo_url: '',
            university: 'Demo University',
            department: 'Computer Science',
            total_credits: 120,
            completed_credits: 0,
            current_cgpa: 0.00,
            target_cgpa: 4.00,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        this.user = demoUser;
        this.isAuthenticated = true;
        this.saveUserToLocal();
        
        return this.user;
    }

    // Save user to localStorage as cache
    saveUserToLocal() {
        if (this.user) {
            localStorage.setItem('gradetrack_user', JSON.stringify(this.user));
        }
    }

    // Get user from cache
    getUserFromCache() {
        const cached = localStorage.getItem('gradetrack_user');
        return cached ? JSON.parse(cached) : null;
    }

    // Get current user
    getCurrentUser() {
        return this.user || this.getUserFromCache();
    }

    // Update user profile
    async updateUserProfile(updates) {
        try {
            if (!this.user) throw new Error('No user authenticated');

            const { data, error } = await supabase
                .from('users')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', this.user.id)
                .select()
                .single();

            if (error) throw error;

            this.user = data;
            this.saveUserToLocal();
            return data;
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    }

    // Sign out (clear cache)
    signOut() {
        this.user = null;
        this.session = null;
        this.isAuthenticated = false;
        localStorage.removeItem('gradetrack_user');
    }
}

// ============================================
// DATABASE SERVICE
// ============================================

class DatabaseService {
    constructor(authService) {
        this.auth = authService;
    }

    // Get current user ID
    getUserId() {
        const user = this.auth.getCurrentUser();
        return user ? user.id : null;
    }

    // ============================================
    // SEMESTER OPERATIONS
    // ============================================

    // Get all semesters
    async getSemesters() {
        try {
            const userId = this.getUserId();
            if (!userId) return [];

            const { data, error } = await supabase
                .from('semesters')
                .select('*')
                .eq('user_id', userId)
                .order('semester_order', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching semesters:', error);
            return [];
        }
    }

    // Add semester
    async addSemester(semesterData) {
        try {
            const userId = this.getUserId();
            if (!userId) throw new Error('No user authenticated');

            // Get current max order
            const { data: existingSemesters } = await supabase
                .from('semesters')
                .select('semester_order')
                .eq('user_id', userId)
                .order('semester_order', { ascending: false })
                .limit(1);

            const newOrder = existingSemesters && existingSemesters.length > 0 
                ? existingSemesters[0].semester_order + 1 
                : 1;

            const { data, error } = await supabase
                .from('semesters')
                .insert([{
                    user_id: userId,
                    name: semesterData.name,
                    semester_credit: 0,
                    semester_gpa: 0.00,
                    is_completed: false,
                    semester_order: newOrder
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error adding semester:', error);
            throw error;
        }
    }

    // Update semester
    async updateSemester(semesterId, updates) {
        try {
            const { data, error } = await supabase
                .from('semesters')
                .update(updates)
                .eq('id', semesterId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error updating semester:', error);
            throw error;
        }
    }

    // Delete semester
    async deleteSemester(semesterId) {
        try {
            // Delete associated courses first
            const { error: coursesError } = await supabase
                .from('courses')
                .delete()
                .eq('semester_id', semesterId);

            if (coursesError) throw coursesError;

            // Delete semester
            const { error } = await supabase
                .from('semesters')
                .delete()
                .eq('id', semesterId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting semester:', error);
            throw error;
        }
    }

    // ============================================
    // COURSE OPERATIONS
    // ============================================

    // Get courses for a semester
    async getCourses(semesterId) {
        try {
            const { data, error } = await supabase
                .from('courses')
                .select('*')
                .eq('semester_id', semesterId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching courses:', error);
            return [];
        }
    }

    // Add course
    async addCourse(courseData) {
        try {
            const userId = this.getUserId();
            if (!userId) throw new Error('No user authenticated');

            const { data, error } = await supabase
                .from('courses')
                .insert([{
                    semester_id: courseData.semester_id,
                    user_id: userId,
                    course_name: courseData.course_name,
                    course_code: courseData.course_code || '',
                    credit: courseData.credit,
                    grade: courseData.grade || null,
                    grade_point: courseData.grade_point || 0,
                    is_completed: courseData.is_completed || false
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error adding course:', error);
            throw error;
        }
    }

    // Update course
    async updateCourse(courseId, updates) {
        try {
            const { data, error } = await supabase
                .from('courses')
                .update(updates)
                .eq('id', courseId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error updating course:', error);
            throw error;
        }
    }

    // Delete course
    async deleteCourse(courseId) {
        try {
            const { error } = await supabase
                .from('courses')
                .delete()
                .eq('id', courseId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting course:', error);
            throw error;
        }
    }

    // ============================================
    // GPA HISTORY OPERATIONS
    // ============================================

    // Get GPA history
    async getGPAHistory() {
        try {
            const userId = this.getUserId();
            if (!userId) return [];

            const { data, error } = await supabase
                .from('gpa_history')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching GPA history:', error);
            return [];
        }
    }

    // Add GPA history entry
    async addGPAHistory(historyData) {
        try {
            const userId = this.getUserId();
            if (!userId) throw new Error('No user authenticated');

            const { data, error } = await supabase
                .from('gpa_history')
                .insert([{
                    user_id: userId,
                    semester_id: historyData.semester_id,
                    semester_name: historyData.semester_name,
                    gpa: historyData.gpa,
                    credits: historyData.credits
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error adding GPA history:', error);
            throw error;
        }
    }

    // ============================================
    // DATA RESET
    // ============================================

    // Reset all user data
    async resetAllData() {
        try {
            const userId = this.getUserId();
            if (!userId) throw new Error('No user authenticated');

            // Delete all courses
            const { error: coursesError } = await supabase
                .from('courses')
                .delete()
                .eq('user_id', userId);

            if (coursesError) throw coursesError;

            // Delete all semesters
            const { error: semestersError } = await supabase
                .from('semesters')
                .delete()
                .eq('user_id', userId);

            if (semestersError) throw semestersError;

            // Delete GPA history
            const { error: historyError } = await supabase
                .from('gpa_history')
                .delete()
                .eq('user_id', userId);

            if (historyError) throw historyError;

            // Reset user stats
            const { error: userError } = await supabase
                .from('users')
                .update({
                    total_credits: 0,
                    completed_credits: 0,
                    current_cgpa: 0.00,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);

            if (userError) throw userError;

            return true;
        } catch (error) {
            console.error('Error resetting data:', error);
            throw error;
        }
    }
}

// ============================================
// INITIALIZE SERVICES
// ============================================

const authService = new AuthService();
const dbService = new DatabaseService(authService);

// Make services globally available
window.authService = authService;
window.dbService = dbService;


