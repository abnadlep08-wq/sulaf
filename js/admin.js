// Admin Panel JavaScript - Version with Fixed File Upload

// Global variables
let currentPdfFile = null;
let currentCoverFile = null;

// Check admin authentication
document.addEventListener('DOMContentLoaded', () => {
    if (SulafAPI.isAdminLoggedIn()) {
        showAdminDashboard();
        loadAdminData();
    } else {
        showAdminLogin();
    }
    setupAdminEventListeners();
    updateDateTime();
    setInterval(updateDateTime, 1000);
});

function showAdminLogin() {
    const loginForm = document.getElementById('loginForm');
    const dashboard = document.getElementById('adminDashboard');
    if (loginForm) loginForm.style.display = 'flex';
    if (dashboard) dashboard.style.display = 'none';
}

function showAdminDashboard() {
    const loginForm = document.getElementById('loginForm');
    const dashboard = document.getElementById('adminDashboard');
    if (loginForm) loginForm.style.display = 'none';
    if (dashboard) dashboard.style.display = 'block';
    setupFileUpload(); // Setup file upload when dashboard shows
}

function loadAdminData() {
    loadDashboardStats();
    loadBooksList();
    loadUsersList();
    loadReviewsList();
    loadTopBooks();
    loadTopAuthors();
    loadUsersForNotification();
    loadBooksByCategoryChart();
}

function loadDashboardStats() {
    const stats = SulafAPI.getSiteStats();
    const elements = {
        statTotalBooks: stats.totalBooks,
        statTotalUsers: stats.totalUsers,
        statTotalDownloads: stats.totalDownloads,
        statTotalViews: stats.totalViews
    };
    for (const [id, value] of Object.entries(elements)) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }
    const badge = document.getElementById('adminStatsBadge');
    if (badge) badge.textContent = stats.totalBooks;
}

function loadBooksList(searchTerm = '') {
    let books = SulafAPI.getAllBooks();
    if (searchTerm) {
        books = books.filter(b => b.title.includes(searchTerm) || b.author.includes(searchTerm));
    }
    
    const tbody = document.getElementById('adminBooksList');
    if (!tbody) return;
    
    if (books.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">لا توجد كتب</td></tr>';
        return;
    }
    
    tbody.innerHTML = books.map(book => `
        <tr>
            <td><img src="${book.coverImage}" class="book-cover-thumb" onerror="this.src='https://via.placeholder.com/50x70/cccccc?text=No+Cover'"></td>
            <td><strong>${book.title}</strong></td>
            <td>${book.author}</td>
            <td>${getCategoryName(book.category)}</td>
            <td>${book.downloads || 0}</td>
            <td>
                <div class="action-buttons">
                    <button class="edit-btn" onclick="editBook('${book.id}')"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn" onclick="deleteBook('${book.id}')"><i class="fas fa-trash"></i></button>
                    <button class="view-btn" onclick="viewBook('${book.id}')"><i class="fas fa-eye"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

function loadUsersList(searchTerm = '') {
    let users = SulafAPI.getAllUsers();
    if (searchTerm) {
        users = users.filter(u => u.username.includes(searchTerm) || u.email.includes(searchTerm));
    }
    
    const tbody = document.getElementById('adminUsersList');
    if (!tbody) return;
    
    tbody.innerHTML = users.map(user => `
        <tr>
            <td><img src="${user.avatar}" class="user-avatar-thumb"></td>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td><span class="role-badge ${user.role}">${user.role === 'admin' ? 'مشرف' : 'مستخدم'}</span></td>
            <td>${user.booksPublished?.length || 0}</td>
            <td>
                <div class="action-buttons">
                    <button class="edit-btn" onclick="editUser('${user.id}')"><i class="fas fa-edit"></i></button>
                    ${user.role !== 'admin' ? `<button class="delete-btn" onclick="deleteUser('${user.id}')"><i class="fas fa-trash"></i></button>` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

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
            allReviews.push({...review, book, user});
        });
    });
    
    allReviews.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (!reviewsList) return;
    
    if (allReviews.length === 0) {
        reviewsList.innerHTML = '<p style="text-align:center">لا توجد مراجعات</p>';
        return;
    }
    
    reviewsList.innerHTML = allReviews.map(review => `
        <div class="review-card">
            <div class="review-header">
                <img src="${review.user?.avatar || 'https://via.placeholder.com/40'}" onerror="this.src='https://via.placeholder.com/40'">
                <div>
                    <strong>${review.user?.username || 'مستخدم'}</strong>
                    <div class="review-stars">${generateStars(review.rating)}</div>
                </div>
                <small>${new Date(review.date).toLocaleDateString('ar')}</small>
                <button class="delete-btn" onclick="deleteReview('${review.book?.id}', '${review.userId}')" style="margin-right:auto;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <p class="review-comment">${review.comment}</p>
            <div class="review-book">📖 ${review.book?.title || 'كتاب غير معروف'} - ${review.book?.author || 'مؤلف غير معروف'}</div>
        </div>
    `).join('');
}

function loadTopBooks() {
    const books = SulafAPI.getAllBooks();
    const topBooks = [...books].sort((a, b) => (b.downloads || 0) - (a.downloads || 0)).slice(0, 10);
    const container = document.getElementById('topBooksList');
    if (!container) return;
    
    container.innerHTML = topBooks.map((book, i) => `
        <div class="top-book-item">
            <div class="top-book-rank">#${i+1}</div>
            <div class="top-book-title">${book.title}</div>
            <div class="top-book-downloads"><i class="fas fa-download"></i> ${book.downloads || 0}</div>
        </div>
    `).join('');
}

function loadTopAuthors() {
    const books = SulafAPI.getAllBooks();
    const authorStats = {};
    books.forEach(book => {
        if (!authorStats[book.author]) {
            authorStats[book.author] = { name: book.author, books: 0, downloads: 0 };
        }
        authorStats[book.author].books++;
        authorStats[book.author].downloads += book.downloads || 0;
    });
    
    const topAuthors = Object.values(authorStats).sort((a, b) => b.downloads - a.downloads).slice(0, 5);
    const container = document.getElementById('topAuthorsList');
    if (!container) return;
    
    container.innerHTML = topAuthors.map(author => `
        <div class="author-item">
            <div><strong>${author.name}</strong></div>
            <div><i class="fas fa-book"></i> ${author.books} كتب | <i class="fas fa-download"></i> ${author.downloads}</div>
        </div>
    `).join('');
}

function loadBooksByCategoryChart() {
    const books = SulafAPI.getAllBooks();
    const categories = {
        fantasy: 0, romance: 0, mystery: 0, 'science-fiction': 0, horror: 0, historical: 0, general: 0
    };
    
    books.forEach(book => {
        if (categories[book.category] !== undefined) {
            categories[book.category]++;
        }
    });
    
    const container = document.getElementById('booksByCategoryChart');
    if (!container) return;
    
    const maxCount = Math.max(...Object.values(categories), 1);
    
    container.innerHTML = Object.entries(categories).map(([cat, count]) => `
        <div class="chart-bar" style="height: ${(count / maxCount) * 150}px">
            <span>${getCategoryName(cat)}</span>
        </div>
    `).join('');
}

function loadUsersForNotification() {
    const users = SulafAPI.getAllUsers();
    const select = document.getElementById('targetUser');
    if (select) {
        select.innerHTML = '<option value="">اختر مستخدم...</option>' + 
            users.filter(u => u.role !== 'admin').map(u => `<option value="${u.id}">${u.username}</option>`).join('');
    }
}

// ==================== FILE UPLOAD FUNCTIONS (FIXED) ====================

function setupFileUpload() {
    console.log('Setting up file upload...');
    
    // PDF File Input
    const pdfInput = document.getElementById('bookPdfFile');
    if (pdfInput) {
        // Remove old listeners to avoid duplicates
        const newPdfInput = pdfInput.cloneNode(true);
        pdfInput.parentNode.replaceChild(newPdfInput, pdfInput);
        
        newPdfInput.addEventListener('change', function(e) {
            console.log('PDF file selected:', e.target.files);
            if (e.target.files && e.target.files[0]) {
                handlePdfFile(e.target.files[0]);
            }
        });
        
        // Update reference
        window.pdfInputRef = newPdfInput;
    }
    
    // Cover File Input
    const coverInput = document.getElementById('bookCoverFile');
    if (coverInput) {
        const newCoverInput = coverInput.cloneNode(true);
        coverInput.parentNode.replaceChild(newCoverInput, coverInput);
        
        newCoverInput.addEventListener('change', function(e) {
            console.log('Cover file selected:', e.target.files);
            if (e.target.files && e.target.files[0]) {
                handleCoverFile(e.target.files[0]);
            }
        });
        
        window.coverInputRef = newCoverInput;
    }
    
    // Setup upload area clicks
    const pdfUploadArea = document.getElementById('pdfUploadArea');
    if (pdfUploadArea) {
        // Remove old click listener
        const newPdfArea = pdfUploadArea.cloneNode(true);
        pdfUploadArea.parentNode.replaceChild(newPdfArea, pdfUploadArea);
        
        newPdfArea.addEventListener('click', function(e) {
            if (e.target.closest('.upload-btn')) {
                const input = document.getElementById('bookPdfFile');
                if (input) input.click();
            } else if (!e.target.closest('.remove-file')) {
                const input = document.getElementById('bookPdfFile');
                if (input) input.click();
            }
        });
        
        // Drag and drop
        newPdfArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            newPdfArea.classList.add('dragover');
        });
        
        newPdfArea.addEventListener('dragleave', () => {
            newPdfArea.classList.remove('dragover');
        });
        
        newPdfArea.addEventListener('drop', (e) => {
            e.preventDefault();
            newPdfArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length && files[0].type === 'application/pdf') {
                handlePdfFile(files[0]);
            } else {
                showToast('الرجاء إسقاط ملف PDF صالح', 'error');
            }
        });
    }
    
    // Cover upload area
    const coverUploadArea = document.getElementById('coverUploadArea');
    if (coverUploadArea) {
        const newCoverArea = coverUploadArea.cloneNode(true);
        coverUploadArea.parentNode.replaceChild(newCoverArea, coverUploadArea);
        
        newCoverArea.addEventListener('click', function(e) {
            if (e.target.closest('.upload-btn')) {
                const input = document.getElementById('bookCoverFile');
                if (input) input.click();
            } else if (!e.target.closest('.remove-file')) {
                const input = document.getElementById('bookCoverFile');
                if (input) input.click();
            }
        });
        
        newCoverArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            newCoverArea.classList.add('dragover');
        });
        
        newCoverArea.addEventListener('dragleave', () => {
            newCoverArea.classList.remove('dragover');
        });
        
        newCoverArea.addEventListener('drop', (e) => {
            e.preventDefault();
            newCoverArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length && files[0].type.startsWith('image/')) {
                handleCoverFile(files[0]);
            } else {
                showToast('الرجاء إسقاط صورة صالحة', 'error');
            }
        });
    }
}

function handlePdfFile(file) {
    console.log('Handling PDF file:', file.name, file.size);
    
    if (file.type !== 'application/pdf') {
        showToast('الرجاء اختيار ملف PDF صالح', 'error');
        return false;
    }
    
    if (file.size > 50 * 1024 * 1024) {
        showToast('حجم الملف كبير جداً (الحد الأقصى 50MB)', 'error');
        return false;
    }
    
    currentPdfFile = file;
    
    // Create object URL for preview
    const url = URL.createObjectURL(file);
    window.currentPdfUrl = url;
    
    // Hide upload area, show preview
    const uploadArea = document.getElementById('pdfUploadArea');
    const preview = document.getElementById('pdfPreview');
    const fileNameSpan = document.getElementById('pdfFileName');
    const fileInfo = document.getElementById('pdfFileInfo');
    
    if (uploadArea) uploadArea.style.display = 'none';
    if (preview) preview.style.display = 'flex';
    if (fileNameSpan) fileNameSpan.textContent = file.name;
    
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    if (fileInfo) {
        fileInfo.innerHTML = `<i class="fas fa-check-circle"></i> تم الرفع (${sizeMB} MB)`;
        fileInfo.style.color = '#2E7D32';
    }
    
    showToast(`تم رفع ملف PDF: ${file.name}`, 'success');
    return true;
}

function handleCoverFile(file) {
    console.log('Handling cover file:', file.name, file.type);
    
    if (!file.type.startsWith('image/')) {
        showToast('الرجاء اختيار صورة صالحة', 'error');
        return false;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showToast('حجم الصورة كبير جداً (الحد الأقصى 5MB)', 'error');
        return false;
    }
    
    currentCoverFile = file;
    
    // Create object URL for preview
    const url = URL.createObjectURL(file);
    window.currentCoverUrl = url;
    
    // Hide upload area, show preview
    const uploadArea = document.getElementById('coverUploadArea');
    const preview = document.getElementById('coverPreview');
    const previewImg = document.getElementById('coverPreviewImg');
    
    if (uploadArea) uploadArea.style.display = 'none';
    if (preview) preview.style.display = 'block';
    if (previewImg) previewImg.src = url;
    
    showToast('تم رفع صورة الغلاف', 'success');
    return true;
}

function removePdfFile() {
    console.log('Removing PDF file');
    currentPdfFile = null;
    window.currentPdfUrl = null;
    
    const uploadArea = document.getElementById('pdfUploadArea');
    const preview = document.getElementById('pdfPreview');
    const fileInput = document.getElementById('bookPdfFile');
    const fileInfo = document.getElementById('pdfFileInfo');
    
    if (uploadArea) uploadArea.style.display = 'flex';
    if (preview) preview.style.display = 'none';
    if (fileInput) fileInput.value = '';
    if (fileInfo) fileInfo.innerHTML = '';
    
    showToast('تم إلغاء اختيار ملف PDF', 'info');
}

function removeCoverFile() {
    console.log('Removing cover file');
    currentCoverFile = null;
    window.currentCoverUrl = null;
    
    const uploadArea = document.getElementById('coverUploadArea');
    const preview = document.getElementById('coverPreview');
    const fileInput = document.getElementById('bookCoverFile');
    
    if (uploadArea) uploadArea.style.display = 'flex';
    if (preview) preview.style.display = 'none';
    if (fileInput) fileInput.value = '';
    
    showToast('تم إلغاء اختيار صورة الغلاف', 'info');
}

// Convert file to Base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Add book with files
async function addBookWithFiles() {
    const title = document.getElementById('bookTitle')?.value;
    const author = document.getElementById('bookAuthor')?.value;
    const category = document.getElementById('bookCategory')?.value;
    const description = document.getElementById('bookDesc')?.value;
    const tagsInput = document.getElementById('bookTags');
    const tags = tagsInput ? tagsInput.value.split(',').map(t => t.trim()) : [];
    
    if (!title || !author) {
        showToast('الرجاء إدخال عنوان الكتاب واسم المؤلف', 'error');
        return false;
    }
    
    if (!currentPdfFile) {
        showToast('الرجاء رفع ملف PDF للكتاب', 'error');
        return false;
    }
    
    try {
        showToast('جاري رفع الملفات...', 'info');
        
        // Convert files to Base64
        const pdfBase64 = await fileToBase64(currentPdfFile);
        let coverBase64 = null;
        
        if (currentCoverFile) {
            coverBase64 = await fileToBase64(currentCoverFile);
        }
        
        const coverImage = coverBase64 || 'https://via.placeholder.com/300x400/6B4E71/ffffff?text=Book+Cover';
        
        const newBook = {
            id: Date.now().toString(),
            title,
            author,
            category,
            description,
            coverImage: coverImage,
            pdfData: pdfBase64,
            pdfUrl: pdfBase64,
            downloadUrl: pdfBase64,
            tags: tags,
            downloads: 0,
            views: 0,
            rating: 0,
            ratingCount: 0,
            publishedDate: new Date().toISOString(),
            authorId: SulafAPI.getCurrentUser()?.id || 'admin'
        };
        
        // Save to localStorage
        const books = SulafAPI.getAllBooks();
        books.push(newBook);
        localStorage.setItem(STORAGE_KEYS.books, JSON.stringify(books));
        
        return true;
    } catch (error) {
        console.error('Error uploading files:', error);
        showToast('حدث خطأ أثناء رفع الملفات', 'error');
        return false;
    }
}

// ==================== EVENT LISTENERS ====================

function setupAdminEventListeners() {
    // Login
    const loginForm = document.getElementById('adminLoginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const password = document.getElementById('adminPassword')?.value;
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
    
    // Menu tabs
    document.querySelectorAll('.admin-menu li').forEach(item => {
        item.addEventListener('click', () => {
            const tab = item.dataset.tab;
            document.querySelectorAll('.admin-menu li').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            const targetTab = document.getElementById(`${tab}Tab`);
            if (targetTab) targetTab.classList.add('active');
            
            if (tab === 'users') loadUsersList();
            if (tab === 'reviews') loadReviewsList();
            if (tab === 'add') setupFileUpload();
        });
    });
    
    // Add Book Form
    const addBookForm = document.getElementById('addBookForm');
    if (addBookForm) {
        addBookForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const success = await addBookWithFiles();
            if (success) {
                const title = document.getElementById('bookTitle')?.value || '';
                const author = document.getElementById('bookAuthor')?.value || '';
                
                // Send notification
                SulafAPI.sendGlobalNotification(
                    '📚 كتاب جديد',
                    `تمت إضافة كتاب جديد: ${title} للكاتب ${author}`,
                    'book'
                );
                
                showToast('تم نشر الكتاب بنجاح!', 'success');
                
                // Reset form
                addBookForm.reset();
                removePdfFile();
                removeCoverFile();
                loadBooksList();
                loadDashboardStats();
                
                // Switch to books tab
                const booksTab = document.querySelector('.admin-menu li[data-tab="books"]');
                if (booksTab) booksTab.click();
            }
        });
    }
    
    // Global Notification
    const globalNotifForm = document.getElementById('sendGlobalNotificationForm');
    if (globalNotifForm) {
        globalNotifForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = document.getElementById('globalNotifTitle')?.value;
            const message = document.getElementById('globalNotifMessage')?.value;
            if (title && message) {
                SulafAPI.sendGlobalNotification(title, message, 'info');
                alert('تم إرسال الإشعار لجميع المستخدمين');
                globalNotifForm.reset();
            }
        });
    }
    
    // User Notification
    const userNotifForm = document.getElementById('sendUserNotificationForm');
    if (userNotifForm) {
        userNotifForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const userId = document.getElementById('targetUser')?.value;
            const title = document.getElementById('userNotifTitle')?.value;
            const message = document.getElementById('userNotifMessage')?.value;
            if (userId && title && message) {
                SulafAPI.sendNotification(userId, title, message, 'info');
                alert('تم إرسال الإشعار');
                userNotifForm.reset();
            }
        });
    }
    
    // Change Password
    const changePassForm = document.getElementById('changePasswordForm');
    if (changePassForm) {
        changePassForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const current = document.getElementById('currentPassword')?.value;
            const newPass = document.getElementById('newPassword')?.value;
            const confirm = document.getElementById('confirmPassword')?.value;
            
            if (newPass !== confirm) {
                alert('كلمة المرور الجديدة غير متطابقة');
                return;
            }
            
            if (SulafAPI.changeAdminPassword(current, newPass)) {
                alert('تم تغيير كلمة المرور بنجاح');
                changePassForm.reset();
            } else {
                alert('كلمة المرور الحالية غير صحيحة');
            }
        });
    }
    
    // Backup
    const backupBtn = document.getElementById('backupDataBtn');
    if (backupBtn) {
        backupBtn.addEventListener('click', () => {
            const backup = {
                books: SulafAPI.getAllBooks(),
                users: JSON.parse(localStorage.getItem(STORAGE_KEYS.users)),
                reviews: JSON.parse(localStorage.getItem(STORAGE_KEYS.reviews) || '{}'),
                date: new Date().toISOString()
            };
            const dataStr = JSON.stringify(backup, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `sulaf_backup_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            alert('تم تصدير النسخة الاحتياطية');
        });
    }
    
    // Restore
    const restoreBtn = document.getElementById('restoreDataBtn');
    const restoreFile = document.getElementById('restoreFile');
    if (restoreBtn && restoreFile) {
        restoreBtn.addEventListener('click', () => restoreFile.click());
        restoreFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    if (data.books) localStorage.setItem(STORAGE_KEYS.books, JSON.stringify(data.books));
                    if (data.users) localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(data.users));
                    if (data.reviews) localStorage.setItem(STORAGE_KEYS.reviews, JSON.stringify(data.reviews));
                    alert('تم استعادة النسخة الاحتياطية');
                    location.reload();
                } catch (error) {
                    alert('الملف غير صالح');
                }
            };
            reader.readAsText(file);
        });
    }
    
    // Export Report
    const exportBtn = document.getElementById('exportReportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const stats = SulafAPI.getSiteStats();
            const report = {
                generatedAt: new Date().toISOString(),
                stats,
                books: SulafAPI.getAllBooks().length,
                users: SulafAPI.getAllUsers().length
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
    
    // Search
    const adminSearch = document.getElementById('adminSearch');
    if (adminSearch) {
        adminSearch.addEventListener('input', (e) => loadBooksList(e.target.value));
    }
    const userSearch = document.getElementById('userSearch');
    if (userSearch) {
        userSearch.addEventListener('input', (e) => loadUsersList(e.target.value));
    }
}

// ==================== HELPER FUNCTIONS ====================

function getCategoryName(category) {
    const categories = {
        fantasy: 'فانتازيا', romance: 'رومانسي', mystery: 'غموض',
        'science-fiction': 'خيال علمي', horror: 'رعب', historical: 'تاريخي', general: 'عام'
    };
    return categories[category] || category;
}

function generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="fas fa-star"></i>';
        } else if (i - 0.5 <= rating) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    return stars;
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-times-circle' : 'fa-info-circle';
    toast.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function updateDateTime() {
    const now = new Date();
    const dateTimeElement = document.getElementById('currentDateTime');
    if (dateTimeElement) {
        dateTimeElement.textContent = now.toLocaleString('ar');
    }
}

// ==================== CRUD OPERATIONS ====================

window.editBook = function(bookId) {
    const books = SulafAPI.getAllBooks();
    const book = books.find(b => b.id === bookId);
    if (!book) return;
    
    const modal = document.getElementById('editBookModal');
    if (!modal) return;
    
    document.getElementById('editBookId').value = book.id;
    document.getElementById('editTitle').value = book.title;
    document.getElementById('editAuthor').value = book.author;
    document.getElementById('editCategory').value = book.category;
    document.getElementById('editDesc').value = book.description || '';
    
    modal.style.display = 'block';
    
    const editForm = document.getElementById('editBookForm');
    editForm.onsubmit = (e) => {
        e.preventDefault();
        SulafAPI.updateBook(bookId, {
            title: document.getElementById('editTitle').value,
            author: document.getElementById('editAuthor').value,
            category: document.getElementById('editCategory').value,
            description: document.getElementById('editDesc').value
        });
        modal.style.display = 'none';
        loadBooksList();
        showToast('تم تحديث الكتاب', 'success');
    };
};

window.deleteBook = function(bookId) {
    if (confirm('هل أنت متأكد من حذف هذا الكتاب؟')) {
        SulafAPI.deleteBook(bookId);
        loadBooksList();
        loadDashboardStats();
        showToast('تم حذف الكتاب', 'success');
    }
};

window.viewBook = function(bookId) {
    window.open(`index.html?book=${bookId}`, '_blank');
};

window.editUser = function(userId) {
    const users = SulafAPI.getAllUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    if (confirm(`تغيير دور المستخدم إلى ${newRole === 'admin' ? 'مشرف' : 'مستخدم'}؟`)) {
        SulafAPI.updateUserProfile(userId, { role: newRole });
        loadUsersList();
        showToast('تم تحديث دور المستخدم', 'success');
    }
};

window.deleteUser = function(userId) {
    const currentUser = SulafAPI.getCurrentUser();
    if (currentUser?.id === userId) {
        alert('لا يمكن حذف حسابك الحالي');
        return;
    }
    if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users));
        delete users[userId];
        localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
        loadUsersList();
        loadDashboardStats();
        showToast('تم حذف المستخدم', 'success');
    }
};

window.deleteReview = function(bookId, userId) {
    if (confirm('هل أنت متأكد من حذف هذه المراجعة؟')) {
        const reviews = JSON.parse(localStorage.getItem(STORAGE_KEYS.reviews) || '{}');
        if (reviews[bookId]) {
            reviews[bookId] = reviews[bookId].filter(r => r.userId !== userId);
            if (reviews[bookId].length === 0) delete reviews[bookId];
            localStorage.setItem(STORAGE_KEYS.reviews, JSON.stringify(reviews));
            SulafAPI.updateBookRating(bookId);
            loadReviewsList();
            showToast('تم حذف المراجعة', 'success');
        }
    }
};

// Close modals
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('close-edit') || e.target.classList.contains('modal')) {
        const editModal = document.getElementById('editBookModal');
        if (editModal) editModal.style.display = 'none';
    }
});

// Make functions available globally
window.removePdfFile = removePdfFile;
window.removeCoverFile = removeCoverFile;
