// API Configuration
const API_CONFIG = {
    googleBooksBase: 'https://www.googleapis.com/books/v1/volumes',
    localDataFile: 'data/books.json'
};

// Storage Keys
const STORAGE_KEYS = {
    books: 'sulaf_books',
    users: 'sulaf_users',
    currentUser: 'sulaf_current_user',
    reviews: 'sulaf_reviews',
    readingLists: 'sulaf_reading_lists',
    readingProgress: 'sulaf_reading_progress',
    notifications: 'sulaf_notifications',
    adminPassword: 'sulaf_admin_password',
    stats: 'sulaf_stats',
    quotes: 'sulaf_quotes'
};

class SulafAPI {
    static DEFAULT_PASSWORD = 'sulaf2024';
    
    // ==================== USER SYSTEM ====================
    static initUsers() {
        if (!localStorage.getItem(STORAGE_KEYS.users)) {
            const defaultUsers = {
                admin: {
                    id: 'admin',
                    username: 'admin',
                    email: 'admin@sulaf.com',
                    password: this.DEFAULT_PASSWORD,
                    role: 'admin',
                    bio: 'مدير الموقع',
                    avatar: 'https://ui-avatars.com/api/?background=6B4E71&color=fff&name=Admin',
                    joinDate: new Date().toISOString(),
                    booksPublished: [],
                    followers: [],
                    following: []
                }
            };
            localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(defaultUsers));
        }
    }
    
    static register(userData) {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users));
        
        // Check if username or email exists
        const existingUser = Object.values(users).find(
            u => u.username === userData.username || u.email === userData.email
        );
        
        if (existingUser) {
            return { success: false, message: 'اسم المستخدم أو البريد الإلكتروني موجود مسبقاً' };
        }
        
        const userId = Date.now().toString();
        const newUser = {
            id: userId,
            username: userData.username,
            email: userData.email,
            password: userData.password,
            role: 'user',
            bio: userData.bio || '',
            avatar: userData.avatar || `https://ui-avatars.com/api/?background=6B4E71&color=fff&name=${userData.username}`,
            joinDate: new Date().toISOString(),
            booksPublished: [],
            followers: [],
            following: [],
            readingStats: {
                booksRead: 0,
                totalPages: 0,
                readingTime: 0
            }
        };
        
        users[userId] = newUser;
        localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
        
        return { success: true, user: newUser };
    }
    
    static login(emailOrUsername, password) {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users));
        const user = Object.values(users).find(
            u => (u.email === emailOrUsername || u.username === emailOrUsername) && u.password === password
        );
        
        if (user) {
            const { password: _, ...userWithoutPassword } = user;
            localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(userWithoutPassword));
            return { success: true, user: userWithoutPassword };
        }
        
        return { success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
    }
    
    static logout() {
        localStorage.removeItem(STORAGE_KEYS.currentUser);
    }
    
    static getCurrentUser() {
        const user = localStorage.getItem(STORAGE_KEYS.currentUser);
        return user ? JSON.parse(user) : null;
    }
    
    static updateUserProfile(userId, updates) {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users));
        if (users[userId]) {
            users[userId] = { ...users[userId], ...updates };
            localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
            
            // Update current user if it's the same
            const currentUser = this.getCurrentUser();
            if (currentUser && currentUser.id === userId) {
                const { password: _, ...updatedUser } = users[userId];
                localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(updatedUser));
            }
            return true;
        }
        return false;
    }
    
    static getUserById(userId) {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users));
        const { password: _, ...user } = users[userId] || {};
        return user;
    }
    
    static getAllUsers() {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users));
        return Object.values(users).map(({ password: _, ...user }) => user);
    }
    
    // ==================== BOOKS SYSTEM ====================
    static initDefaultBooks() {
        if (!localStorage.getItem(STORAGE_KEYS.books)) {
            const defaultBooks = [
                {
                    id: '1',
                    title: 'ثلاثية غرناطة',
                    author: 'رضوى عاشور',
                    authorId: 'admin',
                    category: 'historical',
                    description: 'رواية تاريخية رائعة تحكي قصة المسلمين في الأندلس',
                    coverImage: 'https://via.placeholder.com/300x400/6B4E71/ffffff?text=غرناطة',
                    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                    downloadUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                    rating: 4.8,
                    ratingCount: 150,
                    downloads: 1250,
                    views: 5000,
                    publishedDate: new Date().toISOString(),
                    tags: ['تاريخ', 'أندلس', 'رواية']
                },
                {
                    id: '2',
                    title: 'أرض زيكولا',
                    author: 'عمرو عبد الحميد',
                    authorId: 'admin',
                    category: 'fantasy',
                    description: 'رواية فانتازيا مثيرة تدخل في عالم الخيال',
                    coverImage: 'https://via.placeholder.com/300x400/4A3A4F/ffffff?text=زيكولا',
                    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                    downloadUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                    rating: 4.9,
                    ratingCount: 200,
                    downloads: 2100,
                    views: 8000,
                    publishedDate: new Date().toISOString(),
                    tags: ['فانتازيا', 'مغامرة', 'خيال']
                }
            ];
            localStorage.setItem(STORAGE_KEYS.books, JSON.stringify(defaultBooks));
        }
    }
    
    static getAllBooks() {
        const books = localStorage.getItem(STORAGE_KEYS.books);
        return books ? JSON.parse(books) : [];
    }
    
    static addBook(book, userId) {
        const books = this.getAllBooks();
        const newBook = {
            ...book,
            id: Date.now().toString(),
            authorId: userId,
            rating: 0,
            ratingCount: 0,
            downloads: 0,
            views: 0,
            publishedDate: new Date().toISOString(),
            tags: book.tags || []
        };
        books.push(newBook);
        localStorage.setItem(STORAGE_KEYS.books, JSON.stringify(books));
        
        // Update user's published books
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users));
        if (users[userId]) {
            users[userId].booksPublished.push(newBook.id);
            localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
        }
        
        return newBook;
    }
    
    static updateBook(id, updatedBook) {
        const books = this.getAllBooks();
        const index = books.findIndex(b => b.id === id);
        if (index !== -1) {
            books[index] = { ...books[index], ...updatedBook };
            localStorage.setItem(STORAGE_KEYS.books, JSON.stringify(books));
            return true;
        }
        return false;
    }
    
    static deleteBook(id) {
        const books = this.getAllBooks();
        const filtered = books.filter(b => b.id !== id);
        localStorage.setItem(STORAGE_KEYS.books, JSON.stringify(filtered));
        return true;
    }
    
    static incrementBookViews(bookId) {
        const books = this.getAllBooks();
        const book = books.find(b => b.id === bookId);
        if (book) {
            book.views = (book.views || 0) + 1;
            localStorage.setItem(STORAGE_KEYS.books, JSON.stringify(books));
        }
    }
    
    static incrementBookDownloads(bookId) {
        const books = this.getAllBooks();
        const book = books.find(b => b.id === bookId);
        if (book) {
            book.downloads = (book.downloads || 0) + 1;
            localStorage.setItem(STORAGE_KEYS.books, JSON.stringify(books));
        }
    }
    
    // ==================== REVIEWS SYSTEM ====================
    static addReview(bookId, userId, rating, comment) {
        const reviews = JSON.parse(localStorage.getItem(STORAGE_KEYS.reviews) || '{}');
        if (!reviews[bookId]) reviews[bookId] = [];
        
        const existingReview = reviews[bookId].find(r => r.userId === userId);
        if (existingReview) {
            existingReview.rating = rating;
            existingReview.comment = comment;
            existingReview.date = new Date().toISOString();
        } else {
            reviews[bookId].push({
                userId,
                rating,
                comment,
                date: new Date().toISOString()
            });
        }
        
        localStorage.setItem(STORAGE_KEYS.reviews, JSON.stringify(reviews));
        
        // Update book rating
        this.updateBookRating(bookId);
        
        return true;
    }
    
    static getBookReviews(bookId) {
        const reviews = JSON.parse(localStorage.getItem(STORAGE_KEYS.reviews) || '{}');
        const bookReviews = reviews[bookId] || [];
        
        // Add user info to reviews
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users));
        return bookReviews.map(review => ({
            ...review,
            user: users[review.userId] ? {
                username: users[review.userId].username,
                avatar: users[review.userId].avatar
            } : null
        }));
    }
    
    static updateBookRating(bookId) {
        const reviews = JSON.parse(localStorage.getItem(STORAGE_KEYS.reviews) || '{}');
        const bookReviews = reviews[bookId] || [];
        
        if (bookReviews.length > 0) {
            const totalRating = bookReviews.reduce((sum, r) => sum + r.rating, 0);
            const averageRating = totalRating / bookReviews.length;
            
            const books = this.getAllBooks();
            const book = books.find(b => b.id === bookId);
            if (book) {
                book.rating = averageRating;
                book.ratingCount = bookReviews.length;
                localStorage.setItem(STORAGE_KEYS.books, JSON.stringify(books));
            }
        }
    }
    
    // ==================== READING LISTS ====================
    static addToReadingList(userId, bookId, listType = 'wantToRead') {
        const lists = JSON.parse(localStorage.getItem(STORAGE_KEYS.readingLists) || '{}');
        if (!lists[userId]) {
            lists[userId] = {
                wantToRead: [],
                reading: [],
                read: [],
                favorites: []
            };
        }
        
        if (!lists[userId][listType].includes(bookId)) {
            lists[userId][listType].push(bookId);
            localStorage.setItem(STORAGE_KEYS.readingLists, JSON.stringify(lists));
            return true;
        }
        return false;
    }
    
    static removeFromReadingList(userId, bookId, listType) {
        const lists = JSON.parse(localStorage.getItem(STORAGE_KEYS.readingLists) || '{}');
        if (lists[userId]) {
            lists[userId][listType] = lists[userId][listType].filter(id => id !== bookId);
            localStorage.setItem(STORAGE_KEYS.readingLists, JSON.stringify(lists));
            return true;
        }
        return false;
    }
    
    static getUserReadingLists(userId) {
        const lists = JSON.parse(localStorage.getItem(STORAGE_KEYS.readingLists) || '{}');
        return lists[userId] || {
            wantToRead: [],
            reading: [],
            read: [],
            favorites: []
        };
    }
    
    static moveBetweenLists(userId, bookId, fromList, toList) {
        this.removeFromReadingList(userId, bookId, fromList);
        this.addToReadingList(userId, bookId, toList);
    }
    
    // ==================== READING PROGRESS ====================
    static saveReadingProgress(userId, bookId, page, totalPages) {
        const progress = JSON.parse(localStorage.getItem(STORAGE_KEYS.readingProgress) || '{}');
        if (!progress[userId]) progress[userId] = {};
        
        progress[userId][bookId] = {
            page,
            totalPages,
            lastRead: new Date().toISOString(),
            percentage: (page / totalPages) * 100
        };
        
        localStorage.setItem(STORAGE_KEYS.readingProgress, JSON.stringify(progress));
        
        // Update reading stats
        this.updateReadingStats(userId);
    }
    
    static getReadingProgress(userId, bookId) {
        const progress = JSON.parse(localStorage.getItem(STORAGE_KEYS.readingProgress) || '{}');
        return progress[userId]?.[bookId] || null;
    }
    
    static updateReadingStats(userId) {
        const progress = JSON.parse(localStorage.getItem(STORAGE_KEYS.readingProgress) || '{}');
        const userProgress = progress[userId] || {};
        
        let booksRead = 0;
        let totalPages = 0;
        
        Object.values(userProgress).forEach(p => {
            if (p.percentage >= 100) booksRead++;
            totalPages += p.page;
        });
        
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users));
        if (users[userId]) {
            users[userId].readingStats = {
                booksRead,
                totalPages,
                readingTime: Math.floor(totalPages * 2) // Assuming 2 minutes per page
            };
            localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
            
            // Update current user if it's the same
            const currentUser = this.getCurrentUser();
            if (currentUser && currentUser.id === userId) {
                const { password: _, ...updatedUser } = users[userId];
                localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(updatedUser));
            }
        }
    }
    
    // ==================== NOTIFICATIONS ====================
    static sendNotification(userId, title, message, type = 'info', link = null) {
        const notifications = JSON.parse(localStorage.getItem(STORAGE_KEYS.notifications) || '{}');
        if (!notifications[userId]) notifications[userId] = [];
        
        notifications[userId].unshift({
            id: Date.now().toString(),
            title,
            message,
            type,
            link,
            read: false,
            date: new Date().toISOString()
        });
        
        // Keep only last 50 notifications
        if (notifications[userId].length > 50) {
            notifications[userId] = notifications[userId].slice(0, 50);
        }
        
        localStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(notifications));
    }
    
    static getUserNotifications(userId) {
        const notifications = JSON.parse(localStorage.getItem(STORAGE_KEYS.notifications) || '{}');
        return notifications[userId] || [];
    }
    
    static markNotificationAsRead(userId, notificationId) {
        const notifications = JSON.parse(localStorage.getItem(STORAGE_KEYS.notifications) || '{}');
        const userNotifications = notifications[userId] || [];
        
        const notification = userNotifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            localStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(notifications));
        }
    }
    
    static markAllNotificationsAsRead(userId) {
        const notifications = JSON.parse(localStorage.getItem(STORAGE_KEYS.notifications) || '{}');
        const userNotifications = notifications[userId] || [];
        
        userNotifications.forEach(n => n.read = true);
        localStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(notifications));
    }
    
    static deleteNotification(userId, notificationId) {
        const notifications = JSON.parse(localStorage.getItem(STORAGE_KEYS.notifications) || '{}');
        notifications[userId] = (notifications[userId] || []).filter(n => n.id !== notificationId);
        localStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(notifications));
    }
    
    // Send notification to all users
    static sendGlobalNotification(title, message, type = 'info', link = null) {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users));
        Object.keys(users).forEach(userId => {
            this.sendNotification(userId, title, message, type, link);
        });
    }
    
    // ==================== QUOTES SYSTEM ====================
    static addQuote(userId, bookId, quote, page) {
        const quotes = JSON.parse(localStorage.getItem(STORAGE_KEYS.quotes) || '{}');
        if (!quotes[userId]) quotes[userId] = [];
        
        quotes[userId].push({
            id: Date.now().toString(),
            bookId,
            quote,
            page,
            date: new Date().toISOString()
        });
        
        localStorage.setItem(STORAGE_KEYS.quotes, JSON.stringify(quotes));
        return true;
    }
    
    static getUserQuotes(userId) {
        const quotes = JSON.parse(localStorage.getItem(STORAGE_KEYS.quotes) || '{}');
        const userQuotes = quotes[userId] || [];
        
        // Add book info
        const books = this.getAllBooks();
        return userQuotes.map(quote => ({
            ...quote,
            book: books.find(b => b.id === quote.bookId)
        }));
    }
    
    // ==================== STATS SYSTEM ====================
    static getSiteStats() {
        const books = this.getAllBooks();
        const users = this.getAllUsers();
        const reviews = JSON.parse(localStorage.getItem(STORAGE_KEYS.reviews) || '{}');
        
        const totalReviews = Object.values(reviews).reduce((sum, bookReviews) => sum + bookReviews.length, 0);
        const totalDownloads = books.reduce((sum, book) => sum + (book.downloads || 0), 0);
        const totalViews = books.reduce((sum, book) => sum + (book.views || 0), 0);
        
        return {
            totalBooks: books.length,
            totalUsers: users.length,
            totalReviews,
            totalDownloads,
            totalViews,
            topBooks: [...books].sort((a, b) => (b.downloads || 0) - (a.downloads || 0)).slice(0, 10),
            topAuthors: this.getTopAuthors()
        };
    }
    
    static getTopAuthors() {
        const books = this.getAllBooks();
        const authorStats = {};
        
        books.forEach(book => {
            if (!authorStats[book.author]) {
                authorStats[book.author] = {
                    name: book.author,
                    books: 0,
                    downloads: 0,
                    rating: 0
                };
            }
            authorStats[book.author].books++;
            authorStats[book.author].downloads += book.downloads || 0;
            authorStats[book.author].rating += book.rating || 0;
        });
        
        return Object.values(authorStats)
            .map(author => ({
                ...author,
                rating: author.rating / author.books
            }))
            .sort((a, b) => b.downloads - a.downloads)
            .slice(0, 10);
    }
    
    // ==================== SEARCH & FILTER ====================
    static searchBooks(books, searchTerm) {
        if (!searchTerm) return books;
        const term = searchTerm.toLowerCase();
        return books.filter(book => 
            book.title.toLowerCase().includes(term) ||
            book.author.toLowerCase().includes(term) ||
            (book.description && book.description.toLowerCase().includes(term)) ||
            (book.tags && book.tags.some(tag => tag.toLowerCase().includes(term)))
        );
    }
    
    static filterByCategory(books, category) {
        if (category === 'all') return books;
        return books.filter(book => book.category === category);
    }
    
    static sortBooks(books, sortBy) {
        const sorted = [...books];
        switch(sortBy) {
            case 'title':
                return sorted.sort((a, b) => a.title.localeCompare(b.title));
            case 'popular':
                return sorted.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
            case 'rating':
                return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            case 'newest':
            default:
                return sorted.sort((a, b) => new Date(b.publishedDate) - new Date(a.publishedDate));
        }
    }
    
    // ==================== RECOMMENDATIONS ====================
    static getRecommendations(userId, limit = 10) {
        const books = this.getAllBooks();
        const userLists = this.getUserReadingLists(userId);
        const userProgress = JSON.parse(localStorage.getItem(STORAGE_KEYS.readingProgress) || '{}');
        
        // Get books user has already interacted with
        const interactedBooks = new Set([
            ...userLists.wantToRead,
            ...userLists.reading,
            ...userLists.read,
            ...userLists.favorites,
            ...Object.keys(userProgress[userId] || {})
        ]);
        
        // Get user's favorite categories
        const favoriteCategories = {};
        userLists.favorites.forEach(bookId => {
            const book = books.find(b => b.id === bookId);
            if (book) {
                favoriteCategories[book.category] = (favoriteCategories[book.category] || 0) + 1;
            }
        });
        
        const topCategory = Object.keys(favoriteCategories).sort((a, b) => 
            favoriteCategories[b] - favoriteCategories[a]
        )[0];
        
        // Recommend books from favorite category
        let recommendations = books
            .filter(book => !interactedBooks.has(book.id))
            .filter(book => !topCategory || book.category === topCategory)
            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
            .slice(0, limit);
        
        // If not enough recommendations, add popular books
        if (recommendations.length < limit) {
            const popularBooks = books
                .filter(book => !interactedBooks.has(book.id) && !recommendations.includes(book))
                .sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
                .slice(0, limit - recommendations.length);
            recommendations = [...recommendations, ...popularBooks];
        }
        
        return recommendations;
    }
    
    // ==================== FOLLOW SYSTEM ====================
    static followUser(currentUserId, targetUserId) {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users));
        
        if (!users[currentUserId].following.includes(targetUserId)) {
            users[currentUserId].following.push(targetUserId);
            users[targetUserId].followers.push(currentUserId);
            localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
            
            // Send notification
            const targetUser = users[targetUserId];
            const currentUser = users[currentUserId];
            this.sendNotification(
                targetUserId,
                'متابعة جديدة',
                `${currentUser.username} بدأ بمتابعتك!`,
                'follow',
                `/profile.html?user=${currentUserId}`
            );
            
            return true;
        }
        return false;
    }
    
    static unfollowUser(currentUserId, targetUserId) {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users));
        
        users[currentUserId].following = users[currentUserId].following.filter(id => id !== targetUserId);
        users[targetUserId].followers = users[targetUserId].followers.filter(id => id !== currentUserId);
        localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
        
        return true;
    }
    
    // ==================== DARK MODE ====================
    static toggleDarkMode() {
        const isDark = localStorage.getItem('darkMode') === 'true';
        localStorage.setItem('darkMode', (!isDark).toString());
        this.applyDarkMode(!isDark);
        return !isDark;
    }
    
    static applyDarkMode(enabled) {
        if (enabled) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }
    
    static initDarkMode() {
        const isDark = localStorage.getItem('darkMode') === 'true';
        this.applyDarkMode(isDark);
    }
    
    // ==================== ADMIN FUNCTIONS ====================
    static adminLogin(password) {
        const storedPassword = localStorage.getItem(STORAGE_KEYS.adminPassword) || this.DEFAULT_PASSWORD;
        if (password === storedPassword) {
            sessionStorage.setItem('admin_logged_in', 'true');
            return true;
        }
        return false;
    }
    
    static isAdminLoggedIn() {
        return sessionStorage.getItem('admin_logged_in') === 'true';
    }
    
    static logoutAdmin() {
        sessionStorage.removeItem('admin_logged_in');
    }
    
    static changeAdminPassword(oldPassword, newPassword) {
        const currentPassword = localStorage.getItem(STORAGE_KEYS.adminPassword) || this.DEFAULT_PASSWORD;
        if (oldPassword === currentPassword) {
            localStorage.setItem(STORAGE_KEYS.adminPassword, newPassword);
            return true;
        }
        return false;
    }
    
    // ==================== INITIALIZATION ====================
    static init() {
        this.initUsers();
        this.initDefaultBooks();
        this.initDarkMode();
        
        // Initialize stats if not exists
        if (!localStorage.getItem(STORAGE_KEYS.stats)) {
            localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify({}));
        }
    }
}

// Initialize on load
SulafAPI.init();
