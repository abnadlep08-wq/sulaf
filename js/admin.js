// Admin Panel JavaScript - Complete Version

// Global variables
let currentAdminUser = null;
let notificationHistory = [];

// Initialize admin panel
document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    setupAdminEventListeners();
    updateDateTime();
    setInterval(updateDateTime, 1000);
});

// Check admin authentication
function checkAdminAuth() {
    if (SulafAPI.isAdminLoggedIn()) {
        showAdminDashboard();
        loadAdminData();
    } else {
        showAdminLogin();
    }
}

function showAdminLogin() {
    document.getElementById('loginForm').style.display = 'flex';
    document.getElementById('adminDashboard').style.display = 'none';
}

function showAdminDashboard() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
    currentAdminUser = SulafAPI.getCurrentUser();
}

// Load all admin data
function loadAdminData() {
    loadDashboardStats();
    loadBooksList();
    loadUsersList();
    loadReviewsList();
    loadTopBooks();
    loadRecentActivity();
    loadTopAuthors();
    loadUserActivityStats();
    loadTopRatedBooks();
    loadNotificationHistory();
    loadUsersForNotification();
}

// Load dashboard statistics
function loadDashboardStats() {
    const stats = SulafAPI.getSiteStats();
    document.getElementById('statTotalBooks').textContent = stats.totalBooks;
    document.getElementById('statTotalUsers').textContent = stats.totalUsers;
    document.getElementById('statTotalDownloads').textContent = stats.totalDownloads;
    document.getElementById('statTotalViews').textContent = stats.totalViews;
    document.getElementById('statTotalReviews').textContent = stats.totalReviews;
    
    // Calculate average rating
    const books = SulafAPI.getAllBooks();
    const avgRating = books.reduce((sum, book) => sum + (book.rating || 0), 0) / books.length;
    document.getElementById('statAvgRating').textContent = avgRating.toFixed(1);
    document.getElementById('adminStatsBadge').textContent = stats.totalBooks;
}

// Load books list
function loadBooksList(searchTerm = '') {
    let books = SulafAPI.getAllBooks();
    
    if (searchTerm) {
        books = books.filter(book => 
            book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            book.author.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    
    const tbody = document.getElementById('adminBooksList');
    if (!tbody) return;
    
    if (books.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">لا توجد كتب</td></tr>';
        return;
    }
    
    tbody.innerHTML = books.map(book => `
        <tr>
            <td><img src="${book.coverImage}" alt="${book.title}" class="book-cover-thumb" onerror="this.src='https://via.placeholder.com/50x70/cccccc/666666?text=No+Cover'"></td>
            <td><strong>${book.title}</strong></td>
            <td>${book.author}</td>
            <td>${getCategoryName(book.category)}</td>
            <td>${book.downloads || 0}</td>
            <td>${book.views || 0}</td>
            <td>${book.rating ? book.rating.toFixed(1) : '0'} ⭐ (${book.ratingCount || 0})</td>
            <td>
                <div class="action-buttons">
                    <button class="edit-btn" onclick="editBook('${book.id}')">
                        <i class="fas fa-edit"></i> تعديل
                    </button>
                    <button class="delete-btn" onclick="deleteBook('${book.id}')">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Load users list
function loadUsersList(searchTerm = '') {
    let users = SulafAPI.getAllUsers();
    
    if (searchTerm) {
        users = users.filter(user => 
            user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    
    const tbody = document.getElementById('adminUsersList');
    if (!tbody) return;
    
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">لا يوجد مستخدمين</td></tr>';
        return;
    }
    
    tbody.innerHTML = users.map(user => `
        <tr>
            <td><img src="${user.avatar}" alt="${user.username}" class="user-avatar-thumb"></td>
            <td><strong>${user.username}</strong></td>
            <td>${user.email}</td>
            <td><span class="role-badge ${user.role === 'admin' ? 'admin' : 'user'}">${user.role === 'admin' ? 'مشرف' : 'مستخدم'}</span></td>
            <td>${new Date(user.joinDate).toLocaleDateString('ar')}</td>
            <td>${user.booksPublished?.length || 0}</td>
            <td>${user.followers?.length || 0}</td>
            <td>
                <div class="action-buttons">
                    <button class="edit-btn" onclick="editUser('${user.id}')">
                        <i class="fas fa-edit"></i> تعديل
                    </button>
                    <button class="delete-btn" onclick="deleteUser('${user.id}')">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Load reviews list
function loadReviewsList() {
    const reviewsList = document.getElementById('adminReviewsList');
    const allBooks = SulafAPI.getAllBooks();
    const users = SulafAPI.getAllUsers();
    const reviews = JSON.parse(localStorage.getItem(STORAGE_KEYS.reviews) || '{}');
    
    let allReviews = [];
    Object.entries(reviews).forEach(([bookId, bookReviews]) => {
        const book = allBooks.find(b => b.id === bookId);
        bookReviews.forEach(review => {
            const user = users.find(u => u.id === review.userId);
            allReviews.push({
                ...review,
                book,
                user
            });
        });
    });
    
    allReviews.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (allReviews.length === 0) {
        reviewsList.innerHTML = '<p style="text-align: center;">لا توجد مراجعات</p>';
        return;
    }
    
    reviewsList.innerHTML = allReviews.map(review => `
        <div class="review-card">
            <div class="review-header">
                <img src="${review.user?.avatar}" alt="${review.user?.username}">
                <div>
                    <strong>${review.user?.username}</strong>
                    <div class="review-stars">${generateStars(review.rating)}</div>
                </div>
                <small>${new Date(review.date).toLocaleDateString('ar')}</small>
                <button class="delete-btn" onclick="deleteReview('${review.book?.id}', '${review.userId}')" style="margin-right: auto;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <p class="review-comment">${review.comment}</p>
            <div class="review-book">
                <i class="fas fa-book"></i> ${review.book?.title} - ${review.book?.author}
            </div>
        </div>
    `).join('');
}

// Load top books
function loadTopBooks() {
    const books = SulafAPI.getAllBooks();
    const topBooks = [...books].sort((a, b) => (b.downloads || 0) - (a.downloads || 0)).slice(0, 10);
    const container = document.getElementById('topBooksList');
    
    container.innerHTML = topBooks.map((book, index) => `
        <div class="top-book-item">
            <div class="top-book-rank">#${index + 1}</div>
            <div class="top-book-title">
                <strong>${book.title}</strong>
                <small>${book.author}</small>
            </div>
            <div class="top-book-downloads">
                <i class="fas fa-download"></i> ${book.downloads || 0}
            </div>
        </div>
    `).join('');
}

// Load recent activity
function loadRecentActivity() {
    const books = SulafAPI.getAllBooks();
    const recentBooks = [...books].sort((a, b) => new Date(b.publishedDate) - new Date(a.publishedDate)).slice(0, 10);
    const container = document.getElementById('recentActivity');
    
    container.innerHTML = recentBooks.map(book => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="fas fa-book"></i>
            </div>
            <div class="activity-content">
                <strong>${book.title}</strong> تمت إضافته بواسطة <strong>${book.author}</strong>
                <div class="activity-time">${timeAgo(new Date(book.publishedDate))}</div>
            </div>
        </div>
    `).join('');
}

// Load top authors
function loadTopAuthors() {
    const topAuthors = SulafAPI.getTopAuthors();
    const container = document.getElementById('topAuthorsList');
    
    if (topAuthors.length === 0) {
        container.innerHTML = '<p>لا توجد بيانات</p>';
        return;
    }
    
    container.innerHTML = topAuthors.map((author, index) => `
        <div class="author-item">
            <div><strong>${index + 1}.</strong> ${author.name}</div>
            <div>
                <i class="fas fa-book"></i> ${author.books} كتب
                <i class="fas fa-download"></i> ${author.downloads} تحميل
            </div>
        </div>
    `).join('');
}

// Load user activity stats
function loadUserActivityStats() {
    const users = SulafAPI.getAllUsers();
    const stats = {
        totalUsers: users.length,
        activeUsers: users.filter(u => u.readingStats?.booksRead > 0).length,
        totalBooksRead: users.reduce((sum, u) => sum + (u.readingStats?.booksRead || 0), 0),
        totalPagesRead: users.reduce((sum, u) => sum + (u.readingStats?.totalPages || 0), 0)
    };
    
    const container = document.getElementById('userActivityStats');
    container.innerHTML = `
        <div class="activity-stat">
            <div class="number">${stats.totalUsers}</div>
            <div>إجمالي المستخدمين</div>
        </div>
        <div class="activity-stat">
            <div class="number">${stats.activeUsers}</div>
            <div>مستخدمين نشطين</div>
        </div>
        <div class="activity-stat">
            <div class="number">${stats.totalBooksRead}</div>
            <div>كتب مقروءة</div>
        </div>
        <div class="activity-stat">
            <div class="number">${stats.totalPagesRead}</div>
            <div>صفحة مقروءة</div>
        </div>
    `;
}

// Load top rated books
function loadTopRatedBooks() {
    const books = SulafAPI.getAllBooks();
    const topRated = [...books].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 10);
    const container = document.getElementById('topRatedBooks');
    
    container.innerHTML = topRated.map((book, index) => `
        <div class="book-item">
            <div><strong>${index + 1}.</strong> ${book.title}</div>
            <div>
                ${book.rating ? book.rating.toFixed(1) : '0'} ⭐
                <small>(${book.ratingCount || 0} تقييم)</small>
            </div>
        </div>
    `).join('');
}

// Load users for notification dropdown
function loadUsersForNotification() {
    const users = SulafAPI.getAllUsers();
    const select = document.getElementById('targetUser');
    if (select) {
        select.innerHTML = '<option value="">اختر مستخدم...</option>' + 
            users.filter(u => u.role !== 'admin').map(user => `
                <option value="${user.id}">${user.username} (${user.email})</option>
            `).join('');
    }
}

// Load notification history
function loadNotificationHistory() {
    // Store sent notifications in localStorage
    const history = JSON.parse(localStorage.getItem('admin_notification_history') || '[]');
    const container = document.getElementById('notificationHistory');
    
    if (history.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">لا توجد إشعارات مرسلة بعد</p>';
        return;
    }
    
    container.innerHTML = history.map(notif => `
        <div class="notification-history-item">
            <div class="notification-history-info">
                <h4>${notif.title}</h4>
                <p>${notif.message}</p>
                <small>إلى: ${notif.target === 'all' ? 'جميع المستخدمين' : notif.target}</small>
            </div>
            <div class="notification-history-date">
                ${new Date(notif.date).toLocaleString('ar')}
            </div>
        </div>
    `).join('');
}

// Save notification to history
function saveNotificationToHistory(title, message, target, type) {
    const history = JSON.parse(localStorage.getItem('admin_notification_history') || '[]');
    history.unshift({
        id: Date.now().toString(),
        title,
        message,
        target,
        type,
        date: new Date().toISOString()
    });
    // Keep only last 100 notifications
    if (history.length > 100) history.pop();
    localStorage.setItem('admin_notification_history', JSON.stringify(history));
    loadNotificationHistory();
}

// Setup all admin event listeners
function setupAdminEventListeners() {
    // Login form
    const loginForm = document.getElementById('adminLoginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const password = document.getElementById('adminPassword').value;
            if (SulafAPI.adminLogin(password)) {
                showAdminDashboard();
                loadAdminData();
            } else {
                alert('كلمة المرور غير صحيحة');
            }
        });
    }
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            SulafAPI.logoutAdmin();
            showAdminLogin();
        });
    }
    
    // Admin menu tabs
    document.querySelectorAll('.admin-menu li').forEach(item => {
        item.addEventListener('click', () => {
            const tab = item.dataset.tab;
            document.querySelectorAll('.admin-menu li').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            document.getElementById(`${tab}Tab`).classList.add('active');
            
            // Reload data when switching tabs
            if (tab === 'users') loadUsersList();
            if (tab === 'reviews') loadReviewsList();
            if (tab === 'notifications') loadUsersForNotification();
        });
    });
    
    // Add book form
    const addBookForm = document.getElementById('addBookForm');
    if (addBookForm) {
        addBookForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const currentUser = SulafAPI.getCurrentUser();
            const tags = document.getElementById('bookTags').value.split(',').map(t => t.trim());
            
            const newBook = {
                title: document.getElementById('bookTitle').value,
                author: document.getElementById('bookAuthor').value,
                category: document.getElementById('bookCategory').value,
                description: document.getElementById('bookDesc').value,
                coverImage: document.getElementById('bookCover').value || 'https://via.placeholder.com/300x400/6B4E71/ffffff?text=Book+Cover',
                pdfUrl: document.getElementById('bookPdfUrl').value,
                downloadUrl: document.getElementById('bookDownloadUrl').value || document.getElementById('bookPdfUrl').value,
                tags: tags
            };
            
            SulafAPI.addBook(newBook, currentUser.id);
            
            // Send notification to all users about new book
            SulafAPI.sendGlobalNotification(
                '📚 كتاب جديد',
                `تمت إضافة كتاب جديد: ${newBook.title} للكاتب ${newBook.author}`,
                'book',
                `/index.html?book=${newBook.id}`
            );
            
            saveNotificationToHistory(newBook.title, `تمت إضافة كتاب جديد`, 'all', 'book');
            
            alert('تم إضافة الكتاب بنجاح وإرسال إشعار لجميع المستخدمين');
            addBookForm.reset();
            loadBooksList();
            loadDashboardStats();
        });
    }
    
    // Global notification form
    const globalNotifForm = document.getElementById('sendGlobalNotificationForm');
    if (globalNotifForm) {
        globalNotifForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = document.getElementById('globalNotifTitle').value;
            const message = document.getElementById('globalNotifMessage').value;
            const type = document.getElementById('globalNotifType').value;
            const link = document.getElementById('globalNotifLink').value;
            
            SulafAPI.sendGlobalNotification(title, message, type, link || null);
            saveNotificationToHistory(title, message, 'all', type);
            
            alert('تم إرسال الإشعار لجميع المستخدمين');
            globalNotifForm.reset();
        });
    }
    
    // User notification form
    const userNotifForm = document.getElementById('sendUserNotificationForm');
    if (userNotifForm) {
        userNotifForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const userId = document.getElementById('targetUser').value;
            const title = document.getElementById('userNotifTitle').value;
            const message = document.getElementById('userNotifMessage').value;
            const type = document.getElementById('userNotifType').value;
            
            if (!userId) {
                alert('الرجاء اختيار مستخدم');
                return;
            }
            
            const users = SulafAPI.getAllUsers();
            const targetUser = users.find(u => u.id === userId);
            
            SulafAPI.sendNotification(userId, title, message, type);
            saveNotificationToHistory(title, message, targetUser?.username || userId, type);
            
            alert(`تم إرسال الإشعار للمستخدم ${targetUser?.username}`);
            userNotifForm.reset();
        });
    }
    
    // Change password form
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (newPassword !== confirmPassword) {
                alert('كلمة المرور الجديدة غير متطابقة');
                return;
            }
            
            if (SulafAPI.changeAdminPassword(currentPassword, newPassword)) {
                alert('تم تغيير كلمة المرور بنجاح');
                changePasswordForm.reset();
            } else {
                alert('كلمة المرور الحالية غير صحيحة');
            }
        });
    }
    
    // Site settings form
    const siteSettingsForm = document.getElementById('siteSettingsForm');
    if (siteSettingsForm) {
        siteSettingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const siteName = document.getElementById('siteName').value;
            const siteLogo = document.getElementById('siteLogo').value;
            const primaryColor = document.getElementById('primaryColor').value;
            const secondaryColor = document.getElementById('secondaryColor').value;
            
            localStorage.setItem('site_settings', JSON.stringify({
                siteName,
                siteLogo,
                primaryColor,
                secondaryColor
            }));
            
            // Apply colors
            document.documentElement.style.setProperty('--primary', primaryColor);
            document.documentElement.style.setProperty('--secondary', secondaryColor);
            
            alert('تم حفظ الإعدادات بنجاح');
        });
        
        // Load saved settings
        const savedSettings = JSON.parse(localStorage.getItem('site_settings') || '{}');
        if (savedSettings.siteName) document.getElementById('siteName').value = savedSettings.siteName;
        if (savedSettings.siteLogo) document.getElementById('siteLogo').value = savedSettings.siteLogo;
        if (savedSettings.primaryColor) document.getElementById('primaryColor').value = savedSettings.primaryColor;
        if (savedSettings.secondaryColor) document.getElementById('secondaryColor').value = savedSettings.secondaryColor;
    }
    
    // Backup data
    const backupBtn = document.getElementById('backupDataBtn');
    if (backupBtn) {
        backupBtn.addEventListener('click', () => {
            const backupData = {
                books: SulafAPI.getAllBooks(),
                users: JSON.parse(localStorage.getItem(STORAGE_KEYS.users)),
                reviews: JSON.parse(localStorage.getItem(STORAGE_KEYS.reviews) || '{}'),
                readingLists: JSON.parse(localStorage.getItem(STORAGE_KEYS.readingLists) || '{}'),
                readingProgress: JSON.parse(localStorage.getItem(STORAGE_KEYS.readingProgress) || '{}'),
                quotes: JSON.parse(localStorage.getItem(STORAGE_KEYS.quotes) || '{}'),
                siteSettings: JSON.parse(localStorage.getItem('site_settings') || '{}'),
                backupDate: new Date().toISOString()
            };
            
            const dataStr = JSON.stringify(backupData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `sulaf_backup_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            alert('تم تصدير النسخة الاحتياطية بنجاح');
        });
    }
    
    // Restore data
    const restoreBtn = document.getElementById('restoreDataBtn');
    const restoreFile = document.getElementById('restoreFile');
    if (restoreBtn && restoreFile) {
        restoreBtn.addEventListener('click', () => {
            restoreFile.click();
        });
        
        restoreFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const backupData = JSON.parse(event.target.result);
                    
                    if (confirm('تحذير: استعادة النسخة الاحتياطية ستستبدل جميع البيانات الحالية. هل أنت متأكد؟')) {
                        if (backupData.books) localStorage.setItem(STORAGE_KEYS.books, JSON.stringify(backupData.books));
                        if (backupData.users) localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(backupData.users));
                        if (backupData.reviews) localStorage.setItem(STORAGE_KEYS.reviews, JSON.stringify(backupData.reviews));
                        if (backupData.readingLists) localStorage.setItem(STORAGE_KEYS.readingLists, JSON.stringify(backupData.readingLists));
                        if (backupData.readingProgress) localStorage.setItem(STORAGE_KEYS.readingProgress, JSON.stringify(backupData.readingProgress));
                        if (backupData.quotes) localStorage.setItem(STORAGE_KEYS.quotes, JSON.stringify(backupData.quotes));
                        if (backupData.siteSettings) localStorage.setItem('site_settings', JSON.stringify(backupData.siteSettings));
                        
                        alert('تم استعادة النسخة الاحتياطية بنجاح');
                        location.reload();
                    }
                } catch (error) {
                    alert('الملف غير صالح');
                }
            };
            reader.readAsText(file);
        });
    }
    
    // Export report
    const exportReportBtn = document.getElementById('exportReportBtn');
    if (exportReportBtn) {
        exportReportBtn.addEventListener('click', () => {
            const stats = SulafAPI.getSiteStats();
            const report = {
                generatedAt: new Date().toISOString(),
                statistics: stats,
                topBooks: stats.topBooks,
                topAuthors: stats.topAuthors,
                users: SulafAPI.getAllUsers().map(u => ({
                    username: u.username,
                    email: u.email,
                    joinDate: u.joinDate,
                    booksPublished: u.booksPublished?.length || 0
                }))
            };
            
            const dataStr = JSON.stringify(report, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `sulaf_report_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        });
    }
    
    // Admin search
    const adminSearch = document.getElementById('adminSearch');
    if (adminSearch) {
        adminSearch.addEventListener('input', (e) => {
            loadBooksList(e.target.value);
        });
    }
    
    // User search
    const userSearch = document.getElementById('userSearch');
    if (userSearch) {
        userSearch.addEventListener('input', (e) => {
            loadUsersList(e.target.value);
        });
    }
}

// Edit book function
window.editBook = function(bookId) {
    const books = SulafAPI.getAllBooks();
    const book = books.find(b => b.id === bookId);
    if (!book) return;
    
    document.getElementById('editBookId').value = book.id;
    document.getElementById('editTitle').value = book.title;
    document.getElementById('editAuthor').value = book.author;
    document.getElementById('editCategory').value = book.category;
    document.getElementById('editDesc').value = book.description || '';
    document.getElementById('editCover').value = book.coverImage || '';
    document.getElementById('editPdfUrl').value = book.pdfUrl || '';
    document.getElementById('editDownloadUrl').value = book.downloadUrl || '';
    
    const modal = document.getElementById('editBookModal');
    modal.style.display = 'block';
    
    const editForm = document.getElementById('editBookForm');
    editForm.onsubmit = (e) => {
        e.preventDefault();
        const updatedBook = {
            title: document.getElementById('editTitle').value,
            author: document.getElementById('editAuthor').value,
            category: document.getElementById('editCategory').value,
            description: document.getElementById('editDesc').value,
            coverImage: document.getElementById('editCover').value,
            pdfUrl: document.getElementById('editPdfUrl').value,
            downloadUrl: document.getElementById('editDownloadUrl').value
        };
        
        SulafAPI.updateBook(bookId, updatedBook);
        alert('تم تحديث الكتاب بنجاح');
        modal.style.display = 'none';
        loadBooksList();
        loadDashboardStats();
    };
};

// Delete book function
window.deleteBook = function(bookId) {
    if (confirm('هل أنت متأكد من حذف هذا الكتاب؟')) {
        SulafAPI.deleteBook(bookId);
        alert('تم حذف الكتاب بنجاح');
        loadBooksList();
        loadDashboardStats();
    }
};

// Edit user function
window.editUser = function(userId) {
    const users = SulafAPI.getAllUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    document.getElementById('editUserId').value = user.id;
    document.getElementById('editUsername').value = user.username;
    document.getElementById('editEmail').value = user.email;
    document.getElementById('editRole').value = user.role;
    document.getElementById('editBio').value = user.bio || '';
    
    const modal = document.getElementById('editUserModal');
    modal.style.display = 'block';
    
    const editForm = document.getElementById('editUserForm');
    editForm.onsubmit = (e) => {
        e.preventDefault();
        const updatedUser = {
            username: document.getElementById('editUsername').value,
            email: document.getElementById('editEmail').value,
            role: document.getElementById('editRole').value,
            bio: document.getElementById('editBio').value
        };
        
        SulafAPI.updateUserProfile(userId, updatedUser);
        alert('تم تحديث المستخدم بنجاح');
        modal.style.display = 'none';
        loadUsersList();
        loadDashboardStats();
    };
};

// Delete user function
window.deleteUser = function(userId) {
    const currentUser = SulafAPI.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
        alert('لا يمكن حذف حسابك الحالي');
        return;
    }
    
    if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users));
        delete users[userId];
        localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
        alert('تم حذف المستخدم بنجاح');
        loadUsersList();
        loadDashboardStats();
    }
};

// Delete review function
window.deleteReview = function(bookId, userId) {
    if (confirm('هل أنت متأكد من حذف هذه المراجعة؟')) {
        const reviews = JSON.parse(localStorage.getItem(STORAGE_KEYS.reviews) || '{}');
        if (reviews[bookId]) {
            reviews[bookId] = reviews[bookId].filter(r => r.userId !== userId);
            if (reviews[bookId].length === 0) {
                delete reviews[bookId];
            }
            localStorage.setItem(STORAGE_KEYS.reviews, JSON.stringify(reviews));
            
            // Update book rating
            SulafAPI.updateBookRating(bookId);
            
            alert('تم حذف المراجعة بنجاح');
            loadReviewsList();
            loadDashboardStats();
        }
    }
};

// Helper functions
function getCategoryName(category) {
    const categories = {
        'fantasy': 'فانتازيا',
        'romance': 'رومانسي',
        'mystery': 'غموض',
        'science-fiction': 'خيال علمي',
        'horror': 'رعب',
        'historical': 'تاريخي',
        'general': 'عام'
    };
    return categories[category] || category;
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    let stars = '';
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    for (let i = fullStars; i < 5; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    return stars;
}

function timeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    const intervals = {
        سنة: 31536000,
        شهر: 2592000,
        أسبوع: 604800,
        يوم: 86400,
        ساعة: 3600,
        دقيقة: 60
    };
    
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return `منذ ${interval} ${unit}`;
        }
    }
    return 'الآن';
}

function updateDateTime() {
    const now = new Date();
    const dateTimeElement = document.getElementById('currentDateTime');
    if (dateTimeElement) {
        dateTimeElement.textContent = now.toLocaleString('ar');
    }
}

// Close modals
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('close-edit') || e.target.classList.contains('modal')) {
        const bookModal = document.getElementById('editBookModal');
        const userModal = document.getElementById('editUserModal');
        if (bookModal) bookModal.style.display = 'none';
        if (userModal) userModal.style.display = 'none';
    }
});

// Add styles for role badges
const roleBadgeStyles = document.createElement('style');
roleBadgeStyles.textContent = `
    .role-badge {
        display: inline-block;
        padding: 0.25rem 0.5rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
    }
    .role-badge.admin {
        background: var(--primary);
        color: white;
    }
    .role-badge.user {
        background: #e9ecef;
        color: #495057;
    }
`;
document.head.appendChild(roleBadgeStyles);
