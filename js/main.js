// Global variables
let allBooks = [];
let currentCategory = 'all';
let currentSearchTerm = '';
let currentSort = 'newest';
let currentTab = 'all';
let currentBookId = null;

// DOM Elements
const booksGrid = document.getElementById('booksGrid');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const modal = document.getElementById('bookModal');
const closeModal = document.querySelector('.close-modal');
const darkModeBtn = document.getElementById('darkModeBtn');
const loginBtn = document.getElementById('loginBtn');
const authModal = document.getElementById('authModal');

// Load books on page load
document.addEventListener('DOMContentLoaded', () => {
    loadBooks();
    loadStats();
    setupEventListeners();
    checkUserAuth();
    loadUserNotifications();
    
    // Start notification interval
    setInterval(loadUserNotifications, 30000); // Check every 30 seconds
});

function setupEventListeners() {
    // Search with debounce
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            currentSearchTerm = e.target.value;
            loadBooks();
        }, 500);
    });
    
    // Sort
    sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        displayBooks(allBooks);
    });
    
    // Category buttons
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            loadBooks();
        });
    });
    
    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTab = btn.dataset.tab;
            loadBooks();
        });
    });
    
    // Dark mode
    darkModeBtn.addEventListener('click', () => {
        SulafAPI.toggleDarkMode();
        updateDarkModeIcon();
    });
    
    // Login button
    loginBtn.addEventListener('click', () => {
        authModal.style.display = 'block';
    });
    
    // Auth tabs
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
            document.getElementById(`${tab.dataset.auth}Form`).classList.add('active');
        });
    });
    
    // Login form
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const result = SulafAPI.login(email, password);
        
        if (result.success) {
            authModal.style.display = 'none';
            checkUserAuth();
            loadBooks();
            showToast('تم تسجيل الدخول بنجاح', 'success');
            loadUserNotifications();
        } else {
            showToast(result.message, 'error');
        }
    });
    
    // Register form
    const registerForm = document.getElementById('registerForm');
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;
        
        if (password !== confirmPassword) {
            showToast('كلمة المرور غير متطابقة', 'error');
            return;
        }
        
        const userData = {
            username: document.getElementById('regUsername').value,
            email: document.getElementById('regEmail').value,
            password: password,
            bio: document.getElementById('regBio').value
        };
        
        const result = SulafAPI.register(userData);
        
        if (result.success) {
            // Auto login after registration
            SulafAPI.login(userData.email, userData.password);
            authModal.style.display = 'none';
            checkUserAuth();
            loadBooks();
            showToast('تم إنشاء الحساب بنجاح', 'success');
        } else {
            showToast(result.message, 'error');
        }
    });
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            SulafAPI.logout();
            checkUserAuth();
            loadBooks();
            showToast('تم تسجيل الخروج', 'info');
        });
    }
    
    // Reading lists link
    const readingListsLink = document.getElementById('readingListsLink');
    if (readingListsLink) {
        readingListsLink.addEventListener('click', (e) => {
            e.preventDefault();
            showReadingLists();
        });
    }
    
    // Quotes link
    const quotesLink = document.getElementById('quotesLink');
    if (quotesLink) {
        quotesLink.addEventListener('click', (e) => {
            e.preventDefault();
            showQuotes();
        });
    }
    
    // Stats link
    const statsLink = document.getElementById('statsLink');
    if (statsLink) {
        statsLink.addEventListener('click', (e) => {
            e.preventDefault();
            showUserStats();
        });
    }
    
    // Modal close
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
        const iframe = document.getElementById('pdfViewer');
        iframe.src = '';
    });
    
    // Close modals on outside click
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            const iframe = document.getElementById('pdfViewer');
            iframe.src = '';
        }
        if (e.target === authModal) {
            authModal.style.display = 'none';
        }
    });
    
    // Reading list select
    const readingListSelect = document.getElementById('readingListSelect');
    if (readingListSelect) {
        readingListSelect.addEventListener('change', (e) => {
            const userId = SulafAPI.getCurrentUser()?.id;
            if (!userId) {
                showToast('يجب تسجيل الدخول أولاً', 'error');
                authModal.style.display = 'block';
                readingListSelect.value = '';
                return;
            }
            
            if (currentBookId && e.target.value) {
                SulafAPI.addToReadingList(userId, currentBookId, e.target.value);
                showToast('تمت إضافة الكتاب إلى القائمة', 'success');
            }
            readingListSelect.value = '';
        });
    }
    
    // Save progress button
    const saveProgressBtn = document.getElementById('saveProgressBtn');
    if (saveProgressBtn) {
        saveProgressBtn.addEventListener('click', () => {
            const userId = SulafAPI.getCurrentUser()?.id;
            if (!userId) {
                showToast('يجب تسجيل الدخول أولاً', 'error');
                return;
            }
            
            // This would need actual page number from PDF viewer
            // For demo, we'll use a prompt
            const page = prompt('أدخل رقم الصفحة التي وصلت إليها:');
            if (page) {
                SulafAPI.saveReadingProgress(userId, currentBookId, parseInt(page), 100);
                showToast('تم حفظ تقدم القراءة', 'success');
                loadReadingProgress();
            }
        });
    }
    
    // Update progress button
    const updateProgressBtn = document.getElementById('updateProgressBtn');
    if (updateProgressBtn) {
        updateProgressBtn.addEventListener('click', () => {
            const userId = SulafAPI.getCurrentUser()?.id;
            if (!userId) return;
            
            const page = document.getElementById('pageInput').value;
            if (page) {
                SulafAPI.saveReadingProgress(userId, currentBookId, parseInt(page), 100);
                showToast('تم تحديث تقدم القراءة', 'success');
                loadReadingProgress();
            }
        });
    }
    
    // Submit review
    const submitReviewBtn = document.getElementById('submitReviewBtn');
    if (submitReviewBtn) {
        submitReviewBtn.addEventListener('click', () => {
            const userId = SulafAPI.getCurrentUser()?.id;
            if (!userId) {
                showToast('يجب تسجيل الدخول أولاً', 'error');
                return;
            }
            
            const rating = document.querySelector('#starsInput .fas')?.dataset.rating || 0;
            const comment = document.getElementById('reviewText').value;
            
            if (rating === 0) {
                showToast('الرجاء اختيار تقييم', 'error');
                return;
            }
            
            SulafAPI.addReview(currentBookId, userId, parseInt(rating), comment);
            showToast('تم نشر المراجعة بنجاح', 'success');
            document.getElementById('reviewText').value = '';
            loadReviews(currentBookId);
        });
    }
    
    // Stars input
    const starsInput = document.getElementById('starsInput');
    if (starsInput) {
        starsInput.querySelectorAll('i').forEach(star => {
            star.addEventListener('click', () => {
                const rating = parseInt(star.dataset.rating);
                starsInput.querySelectorAll('i').forEach((s, i) => {
                    if (i < rating) {
                        s.className = 'fas fa-star';
                    } else {
                        s.className = 'far fa-star';
                    }
                });
            });
            
            star.addEventListener('mouseenter', () => {
                const rating = parseInt(star.dataset.rating);
                starsInput.querySelectorAll('i').forEach((s, i) => {
                    if (i < rating) {
                        s.className = 'fas fa-star';
                    }
                });
            });
            
            star.addEventListener('mouseleave', () => {
                const currentRating = starsInput.querySelector('.fas')?.dataset.rating || 0;
                starsInput.querySelectorAll('i').forEach((s, i) => {
                    if (i < currentRating) {
                        s.className = 'fas fa-star';
                    } else {
                        s.className = 'far fa-star';
                    }
                });
            });
        });
    }
    
    // Dark reader button in modal
    const darkReaderBtn = document.getElementById('darkReaderBtn');
    if (darkReaderBtn) {
        darkReaderBtn.addEventListener('click', () => {
            document.querySelector('.book-reader').classList.toggle('dark-reader');
        });
    }
}

async function loadBooks() {
    showLoading();
    
    try {
        let books = SulafAPI.getAllBooks();
        
        // Filter by category
        books = SulafAPI.filterByCategory(books, currentCategory);
        
        // Filter by search
        books = SulafAPI.searchBooks(books, currentSearchTerm);
        
        // Apply tab filtering
        const currentUser = SulafAPI.getCurrentUser();
        if (currentTab === 'recommended' && currentUser) {
            const recommended = SulafAPI.getRecommendations(currentUser.id);
            books = books.filter(book => recommended.some(r => r.id === book.id));
        } else if (currentTab === 'popular') {
            books = SulafAPI.sortBooks(books, 'popular');
        } else if (currentTab === 'top-rated') {
            books = SulafAPI.sortBooks(books, 'rating');
        } else {
            books = SulafAPI.sortBooks(books, currentSort);
        }
        
        allBooks = books;
        displayBooks(allBooks);
    } catch (error) {
        console.error('Error loading books:', error);
        showError('حدث خطأ في تحميل الكتب');
    }
}

function displayBooks(books) {
    if (books.length === 0) {
        booksGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-book-open"></i>
                <h3>لا توجد كتب</h3>
                <p>لم نعثر على أي كتب مطابقة لبحثك</p>
            </div>
        `;
        return;
    }
    
    booksGrid.innerHTML = books.map(book => `
        <div class="book-card" data-book-id="${book.id}">
            <div class="book-cover">
                <img src="${book.coverImage}" alt="${book.title}" onerror="this.src='https://via.placeholder.com/300x400/cccccc/666666?text=No+Cover'">
                <span class="book-category">${getCategoryName(book.category)}</span>
                <div class="book-rating">
                    ${generateStars(book.rating)} 
                    <span>(${book.ratingCount || 0})</span>
                </div>
            </div>
            <div class="book-info">
                <h3>${book.title}</h3>
                <p class="book-author">✍️ ${book.author}</p>
                <p class="book-stats">
                    <i class="fas fa-download"></i> ${book.downloads || 0} 
                    <i class="fas fa-eye"></i> ${book.views || 0}
                </p>
                <p class="book-desc">${book.description ? book.description.substring(0, 100) + '...' : 'لا يوجد وصف'}</p>
                <div class="book-actions">
                    <button class="read-btn" onclick="openBookReader('${book.id}')">
                        <i class="fas fa-book-reader"></i> قراءة
                    </button>
                    <button class="download-btn-card" onclick="downloadBook('${book.id}')">
                        <i class="fas fa-download"></i> تحميل
                    </button>
                    <button class="quote-btn" onclick="addQuote('${book.id}')">
                        <i class="fas fa-quote-right"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function generateStars(rating) {
    const fullStars = Math.floor(rating || 0);
    const halfStar = (rating || 0) % 1 >= 0.5;
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    if (halfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    for (let i = stars.length / (halfStar ? 2 : 1); i < 5; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    
    return stars;
}

function getCategoryName(category) {
    const categories = {
        'fantasy': 'فانتازيا',
        'romance': 'رومانسي',
        'mystery': 'غموض',
        'science-fiction': 'خيال علمي',
        'horror': 'رعب',
        'historical': 'تاريخي',
        'general': 'عام',
        'all': 'الكل'
    };
    return categories[category] || category;
}

async function openBookReader(bookId) {
    const book = allBooks.find(b => b.id === bookId);
    if (!book) return;
    
    currentBookId = bookId;
    
    // Increment views
    SulafAPI.incrementBookViews(bookId);
    
    const pdfViewer = document.getElementById('pdfViewer');
    const modalCover = document.getElementById('modalCover');
    const modalTitle = document.getElementById('modalTitle');
    const modalAuthor = document.getElementById('modalAuthor');
    const modalDesc = document.getElementById('modalDesc');
    const downloadBtn = document.getElementById('downloadBtn');
    const modalRating = document.getElementById('modalRating');
    
    // Set PDF viewer
    const pdfUrl = book.pdfUrl || book.downloadUrl;
    if (pdfUrl && pdfUrl.includes('http')) {
        pdfViewer.src = pdfUrl;
    } else {
        pdfViewer.src = book.previewLink || 'https://books.google.com/books?id=null';
    }
    
    // Set book info
    modalCover.src = book.coverImage;
    modalTitle.textContent = book.title;
    modalAuthor.textContent = `✍️ ${book.author}`;
    modalDesc.textContent = book.description || 'لا يوجد وصف متاح';
    downloadBtn.href = book.downloadUrl || book.pdfUrl || '#';
    modalRating.innerHTML = generateStars(book.rating);
    
    modal.style.display = 'block';
    
    // Load reviews
    loadReviews(bookId);
    
    // Load reading progress
    loadReadingProgress();
}

function downloadBook(bookId) {
    const book = allBooks.find(b => b.id === bookId);
    if (book && (book.downloadUrl || book.pdfUrl)) {
        const link = document.createElement('a');
        link.href = book.downloadUrl || book.pdfUrl;
        link.download = `${book.title}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Increment downloads
        SulafAPI.incrementBookDownloads(bookId);
        
        showToast('جاري تحميل الكتاب...', 'success');
    } else {
        showToast('عذراً، رابط التحميل غير متاح لهذا الكتاب', 'error');
    }
}

function addQuote(bookId) {
    const userId = SulafAPI.getCurrentUser()?.id;
    if (!userId) {
        showToast('يجب تسجيل الدخول أولاً', 'error');
        authModal.style.display = 'block';
        return;
    }
    
    const quote = prompt('أدخل الاقتباس الذي تريد حفظه:');
    if (quote) {
        const page = prompt('رقم الصفحة (اختياري):');
        SulafAPI.addQuote(userId, bookId, quote, page || null);
        showToast('تم حفظ الاقتباس بنجاح', 'success');
    }
}

function loadReviews(bookId) {
    const reviews = SulafAPI.getBookReviews(bookId);
    const reviewsList = document.getElementById('reviewsList');
    
    if (reviews.length === 0) {
        reviewsList.innerHTML = '<p class="no-reviews">لا توجد مراجعات بعد. كن أول من يقيم هذا الكتاب!</p>';
        return;
    }
    
    reviewsList.innerHTML = reviews.map(review => `
        <div class="review-item">
            <div class="review-header">
                <img src="${review.user?.avatar || 'https://ui-avatars.com/api/?background=6B4E71&color=fff'}" alt="${review.user?.username}">
                <div>
                    <strong>${review.user?.username}</strong>
                    <div class="review-stars">${generateStars(review.rating)}</div>
                </div>
                <small>${new Date(review.date).toLocaleDateString('ar')}</small>
            </div>
            <p class="review-comment">${review.comment}</p>
        </div>
    `).join('');
}

function loadReadingProgress() {
    const userId = SulafAPI.getCurrentUser()?.id;
    if (!userId || !currentBookId) return;
    
    const progress = SulafAPI.getReadingProgress(userId, currentBookId);
    const progressSection = document.getElementById('progressSection');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    if (progress) {
        progressSection.style.display = 'block';
        progressFill.style.width = `${progress.percentage}%`;
        progressText.textContent = `الصفحة ${progress.page} من ${progress.totalPages} (${Math.round(progress.percentage)}%)`;
        document.getElementById('pageInput').value = progress.page;
    } else {
        progressSection.style.display = 'none';
    }
}

function loadStats() {
    const stats = SulafAPI.getSiteStats();
    document.getElementById('totalBooks').textContent = stats.totalBooks;
    document.getElementById('totalUsers').textContent = stats.totalUsers;
    document.getElementById('totalReviews').textContent = stats.totalReviews;
    document.getElementById('totalDownloads').textContent = stats.totalDownloads;
}

function checkUserAuth() {
    const currentUser = SulafAPI.getCurrentUser();
    const loginBtn = document.getElementById('loginBtn');
    const userMenu = document.getElementById('userMenu');
    const adminLink = document.getElementById('adminLink');
    
    if (currentUser) {
        loginBtn.style.display = 'none';
        userMenu.style.display = 'block';
        
        // Update user info in dropdown
        const userInfo = document.getElementById('userInfo');
        userInfo.innerHTML = `
            <div class="user-info">
                <img src="${currentUser.avatar}" alt="${currentUser.username}" class="user-avatar">
                <div>
                    <strong>${currentUser.username}</strong>
                    <small>${currentUser.email}</small>
                </div>
            </div>
        `;
        
        // Show admin link if user is admin
        if (currentUser.role === 'admin') {
            adminLink.style.display = 'block';
        } else {
            adminLink.style.display = 'none';
        }
        
        // Toggle dropdown
        const userIcon = document.getElementById('userIcon');
        const userDropdown = document.getElementById('userDropdown');
        userIcon.addEventListener('click', () => {
            userDropdown.classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!userMenu.contains(e.target)) {
                userDropdown.classList.remove('show');
            }
        });
    } else {
        loginBtn.style.display = 'block';
        userMenu.style.display = 'none';
        adminLink.style.display = 'none';
    }
}

function loadUserNotifications() {
    const currentUser = SulafAPI.getCurrentUser();
    if (!currentUser) return;
    
    const notifications = SulafAPI.getUserNotifications(currentUser.id);
    const notificationsList = document.getElementById('notificationsList');
    const unreadCount = notifications.filter(n => !n.read).length;
    
    // Update notification badge
    const userIcon = document.getElementById('userIcon');
    if (unreadCount > 0) {
        userIcon.classList.add('has-notifications');
        userIcon.setAttribute('data-count', unreadCount);
    } else {
        userIcon.classList.remove('has-notifications');
    }
    
    if (notifications.length === 0) {
        notificationsList.innerHTML = '<p class="no-notifications">لا توجد إشعارات</p>';
        return;
    }
    
    notificationsList.innerHTML = notifications.slice(0, 10).map(notif => `
        <div class="notification-item ${notif.read ? 'read' : 'unread'}" data-id="${notif.id}">
            <div class="notification-icon">
                <i class="fas ${getNotificationIcon(notif.type)}"></i>
            </div>
            <div class="notification-content">
                <strong>${notif.title}</strong>
                <p>${notif.message}</p>
                <small>${timeAgo(new Date(notif.date))}</small>
            </div>
            <button class="delete-notification" onclick="deleteNotification('${notif.id}')">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
    
    // Mark as read when clicked
    notificationsList.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.delete-notification')) {
                const notifId = item.dataset.id;
                SulafAPI.markNotificationAsRead(currentUser.id, notifId);
                item.classList.remove('unread');
                item.classList.add('read');
            }
        });
    });
}

function getNotificationIcon(type) {
    const icons = {
        'info': 'fa-info-circle',
        'success': 'fa-check-circle',
        'warning': 'fa-exclamation-triangle',
        'error': 'fa-times-circle',
        'follow': 'fa-user-plus',
        'book': 'fa-book'
    };
    return icons[type] || 'fa-bell';
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

function deleteNotification(notificationId) {
    const currentUser = SulafAPI.getCurrentUser();
    if (currentUser) {
        SulafAPI.deleteNotification(currentUser.id, notificationId);
        loadUserNotifications();
    }
}

function showReadingLists() {
    const currentUser = SulafAPI.getCurrentUser();
    if (!currentUser) {
        showToast('يجب تسجيل الدخول أولاً', 'error');
        return;
    }
    
    const lists = SulafAPI.getUserReadingLists(currentUser.id);
    const modal = document.getElementById('readingListsModal');
    const content = document.getElementById('readingListsContent');
    const books = SulafAPI.getAllBooks();
    
    const showList = (listType) => {
        const bookIds = lists[listType];
        const listBooks = books.filter(b => bookIds.includes(b.id));
        
        if (listBooks.length === 0) {
            content.innerHTML = '<p class="empty-list">لا توجد كتب في هذه القائمة</p>';
            return;
        }
        
        content.innerHTML = `
            <div class="reading-list-books">
                ${listBooks.map(book => `
                    <div class="reading-list-book">
                        <img src="${book.coverImage}" alt="${book.title}">
                        <div>
                            <h4>${book.title}</h4>
                            <p>${book.author}</p>
                            <button class="small-btn" onclick="openBookReader('${book.id}')">اقرأ</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    };
    
    modal.style.display = 'block';
    showList('wantToRead');
    
    // Setup tabs
    document.querySelectorAll('.list-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.list-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            showList(tab.dataset.list);
        });
    });
}

function showQuotes() {
    const currentUser = SulafAPI.getCurrentUser();
    if (!currentUser) {
        showToast('يجب تسجيل الدخول أولاً', 'error');
        return;
    }
    
    const quotes = SulafAPI.getUserQuotes(currentUser.id);
    const modal = document.getElementById('quotesModal');
    const quotesList = document.getElementById('quotesList');
    
    if (quotes.length === 0) {
        quotesList.innerHTML = '<p class="empty-quotes">لا توجد اقتباسات محفوظة</p>';
    } else {
        quotesList.innerHTML = quotes.map(quote => `
            <div class="quote-item">
                <div class="quote-text">
                    <i class="fas fa-quote-right"></i>
                    <p>${quote.quote}</p>
                </div>
                <div class="quote-info">
                    <strong>${quote.book?.title}</strong>
                    ${quote.page ? `<span>صفحة ${quote.page}</span>` : ''}
                    <small>${new Date(quote.date).toLocaleDateString('ar')}</small>
                </div>
            </div>
        `).join('');
    }
    
    modal.style.display = 'block';
}

function showUserStats() {
    const currentUser = SulafAPI.getCurrentUser();
    if (!currentUser) {
        showToast('يجب تسجيل الدخول أولاً', 'error');
        return;
    }
    
    const stats = currentUser.readingStats || { booksRead: 0, totalPages: 0, readingTime: 0 };
    const lists = SulafAPI.getUserReadingLists(currentUser.id);
    
    const statsHtml = `
        <div class="user-stats-modal">
            <h3>إحصائيات القراءة</h3>
            <div class="stats-grid">
                <div class="stat-card">
                    <i class="fas fa-book-reader"></i>
                    <div class="stat-number">${stats.booksRead || 0}</div>
                    <div class="stat-label">كتاب مقروء</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-file-alt"></i>
                    <div class="stat-number">${stats.totalPages || 0}</div>
                    <div class="stat-label">صفحة مقروءة</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-clock"></i>
                    <div class="stat-number">${Math.floor((stats.readingTime || 0) / 60)}</div>
                    <div class="stat-label">ساعة قراءة</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-heart"></i>
                    <div class="stat-number">${lists.favorites.length}</div>
                    <div class="stat-label">كتب مفضلة</div>
                </div>
            </div>
            <div class="reading-challenge">
                <h4>تحدي القراءة السنوي</h4>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${Math.min(100, (stats.booksRead / 50) * 100)}%"></div>
                </div>
                <p>${stats.booksRead || 0} من 50 كتاب</p>
            </div>
        </div>
    `;
    
    // Create and show modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content small-modal">
            <span class="close-modal">&times;</span>
            ${statsHtml}
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'block';
    
    modal.querySelector('.close-modal').addEventListener('click', () => {
        modal.remove();
    });
}

function updateDarkModeIcon() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    const icon = darkModeBtn.querySelector('i');
    icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
}

function showLoading() {
    booksGrid.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>جاري تحميل الكتب...</p>
        </div>
    `;
}

function showError(message) {
    booksGrid.innerHTML = `
        <div class="error-state">
            <i class="fas fa-exclamation-circle"></i>
            <h3>حدث خطأ</h3>
            <p>${message}</p>
        </div>
    `;
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-times-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Add toast styles
const toastStyles = document.createElement('style');
toastStyles.textContent = `
    .toast {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        gap: 0.5rem;
        z-index: 3000;
        animation: slideIn 0.3s;
    }
    
    .toast-success {
        border-right: 4px solid #2E7D32;
    }
    
    .toast-error {
        border-right: 4px solid #C62828;
    }
    
    .toast-info {
        border-right: 4px solid #6B4E71;
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .dark-mode {
        background: #1a1a2e;
        color: #eee;
    }
    
    .dark-mode .book-card,
    .dark-mode .modal-content,
    .dark-mode .admin-nav,
    .dark-mode .admin-sidebar {
        background: #16213e;
        color: #eee;
    }
    
    .notification-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        border-bottom: 1px solid #eee;
        cursor: pointer;
        transition: background 0.3s;
    }
    
    .notification-item.unread {
        background: #f8f9fa;
    }
    
    .notification-item:hover {
        background: #f0f0f0;
    }
    
    .notification-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: var(--primary);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .notification-content {
        flex: 1;
    }
    
    .notification-content strong {
        display: block;
        margin-bottom: 0.25rem;
    }
    
    .notification-content p {
        margin: 0;
        font-size: 0.85rem;
        color: #666;
    }
    
    .notification-content small {
        font-size: 0.75rem;
        color: #999;
    }
    
    .delete-notification {
        background: none;
        border: none;
        cursor: pointer;
        color: #999;
    }
    
    .delete-notification:hover {
        color: var(--danger);
    }
    
    .user-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 1rem;
    }
    
    .user-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
    }
    
    .user-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(255,255,255,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        position: relative;
    }
    
    .user-icon.has-notifications::after {
        content: attr(data-count);
        position: absolute;
        top: -5px;
        right: -5px;
        background: var(--danger);
        color: white;
        font-size: 0.7rem;
        padding: 2px 5px;
        border-radius: 10px;
    }
    
    .user-dropdown {
        position: absolute;
        top: 100%;
        right: 0;
        width: 300px;
        background: white;
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.2);
        display: none;
        z-index: 1000;
    }
    
    .user-dropdown.show {
        display: block;
    }
    
    .dropdown-item {
        display: block;
        padding: 0.75rem 1rem;
        color: var(--dark);
        text-decoration: none;
        transition: background 0.3s;
    }
    
    .dropdown-item:hover {
        background: #f0f0f0;
    }
    
    .reading-list-book {
        display: flex;
        gap: 1rem;
        padding: 1rem;
        border-bottom: 1px solid #eee;
    }
    
    .reading-list-book img {
        width: 60px;
        height: 80px;
        object-fit: cover;
        border-radius: 5px;
    }
    
    .quote-item {
        padding: 1rem;
        border-bottom: 1px solid #eee;
    }
    
    .quote-text {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
    }
    
    .quote-text i {
        color: var(--secondary);
        font-size: 1.2rem;
    }
    
    .quote-info {
        display: flex;
        gap: 1rem;
        font-size: 0.85rem;
        color: #666;
    }
    
    .stats-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
        margin: 1rem 0;
    }
    
    .stat-card {
        text-align: center;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 10px;
    }
    
    .stat-card i {
        font-size: 2rem;
        color: var(--primary);
    }
    
    .stat-number {
        font-size: 1.5rem;
        font-weight: bold;
        margin: 0.5rem 0;
    }
    
    .reading-challenge {
        margin-top: 1rem;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 10px;
    }
    
    .reader-controls {
        position: absolute;
        top: 10px;
        right: 10px;
        z-index: 10;
        display: flex;
        gap: 0.5rem;
        background: rgba(0,0,0,0.5);
        padding: 0.5rem;
        border-radius: 8px;
    }
    
    .reader-btn {
        background: white;
        border: none;
        padding: 0.5rem;
        border-radius: 5px;
        cursor: pointer;
    }
    
    .dark-reader {
        background: #1a1a2e;
    }
    
    .dark-reader iframe {
        background: white;
    }
`;
document.head.appendChild(toastStyles);
