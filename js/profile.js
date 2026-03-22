let profileUser = null;
let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    loadProfile();
    setupProfileEvents();
});

function loadProfile() {
    currentUser = SulafAPI.getCurrentUser();
    
    // Get user ID from URL or use current user
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('user') || currentUser?.id;
    
    if (!userId) {
        window.location.href = 'index.html';
        return;
    }
    
    profileUser = SulafAPI.getUserById(userId);
    if (!profileUser) {
        window.location.href = 'index.html';
        return;
    }
    
    displayProfile();
    loadUserBooks();
    loadUserReviews();
    loadUserQuotes();
    
    // Show edit tab if viewing own profile
    const editTabBtn = document.getElementById('editTabBtn');
    if (currentUser && currentUser.id === profileUser.id) {
        editTabBtn.style.display = 'block';
    } else {
        editTabBtn.style.display = 'none';
    }
}

function displayProfile() {
    document.getElementById('profileAvatar').src = profileUser.avatar;
    document.getElementById('profileUsername').textContent = profileUser.username;
    document.getElementById('profileBio').textContent = profileUser.bio || 'لا يوجد نبذة';
    document.getElementById('followersCount').textContent = profileUser.followers?.length || 0;
    document.getElementById('followingCount').textContent = profileUser.following?.length || 0;
    document.getElementById('booksPublishedCount').textContent = profileUser.booksPublished?.length || 0;
    
    const profileActions = document.getElementById('profileActions');
    
    if (currentUser && currentUser.id !== profileUser.id) {
        const isFollowing = profileUser.followers?.includes(currentUser.id);
        profileActions.innerHTML = `
            <button class="follow-btn ${isFollowing ? 'unfollow-btn' : ''}" onclick="toggleFollow()">
                <i class="fas ${isFollowing ? 'fa-user-minus' : 'fa-user-plus'}"></i>
                ${isFollowing ? 'إلغاء المتابعة' : 'متابعة'}
            </button>
            <button class="message-btn" onclick="sendMessage()">
                <i class="fas fa-envelope"></i> مراسلة
            </button>
        `;
    } else {
        profileActions.innerHTML = '';
    }
}

function toggleFollow() {
    if (!currentUser) {
        showToast('يجب تسجيل الدخول أولاً', 'error');
        return;
    }
    
    const isFollowing = profileUser.followers?.includes(currentUser.id);
    
    if (isFollowing) {
        SulafAPI.unfollowUser(currentUser.id, profileUser.id);
        showToast('تم إلغاء المتابعة', 'info');
    } else {
        SulafAPI.followUser(currentUser.id, profileUser.id);
        showToast('بدأت بمتابعة ' + profileUser.username, 'success');
    }
    
    // Reload profile to update stats
    loadProfile();
}

function sendMessage() {
    showToast('سيتم إضافة خاصية المراسلة قريباً', 'info');
}

function loadUserBooks() {
    const allBooks = SulafAPI.getAllBooks();
    const userBooks = allBooks.filter(book => book.authorId === profileUser.id);
    const booksGrid = document.getElementById('userBooksGrid');
    
    if (userBooks.length === 0) {
        booksGrid.innerHTML = '<p class="empty-state">لا توجد كتب منشورة</p>';
        return;
    }
    
    booksGrid.innerHTML = userBooks.map(book => `
        <div class="book-card" onclick="window.openBookReader('${book.id}')">
            <div class="book-cover">
                <img src="${book.coverImage}" alt="${book.title}">
                <span class="book-category">${getCategoryName(book.category)}</span>
            </div>
            <div class="book-info">
                <h3>${book.title}</h3>
                <p class="book-author">${book.author}</p>
                <div class="book-stats">
                    <i class="fas fa-download"></i> ${book.downloads || 0}
                    <i class="fas fa-eye"></i> ${book.views || 0}
                </div>
            </div>
        </div>
    `).join('');
}

function loadUserReviews() {
    const reviewsList = document.getElementById('userReviewsList');
    const allBooks = SulafAPI.getAllBooks();
    const reviews = JSON.parse(localStorage.getItem(STORAGE_KEYS.reviews) || '{}');
    
    const userReviews = [];
    Object.entries(reviews).forEach(([bookId, bookReviews]) => {
        bookReviews.forEach(review => {
            if (review.userId === profileUser.id) {
                const book = allBooks.find(b => b.id === bookId);
                userReviews.push({ ...review, book });
            }
        });
    });
    
    if (userReviews.length === 0) {
        reviewsList.innerHTML = '<p class="empty-state">لا توجد مراجعات</p>';
        return;
    }
    
    reviewsList.innerHTML = userReviews.map(review => `
        <div class="review-item">
            <div class="review-book">
                <strong>${review.book?.title}</strong> - ${review.book?.author}
            </div>
            <div class="review-stars">${generateStars(review.rating)}</div>
            <p class="review-comment">${review.comment}</p>
            <div class="review-date">${new Date(review.date).toLocaleDateString('ar')}</div>
        </div>
    `).join('');
}

function loadUserQuotes() {
    const quotes = SulafAPI.getUserQuotes(profileUser.id);
    const quotesList = document.getElementById('userQuotesList');
    
    if (quotes.length === 0) {
        quotesList.innerHTML = '<p class="empty-state">لا توجد اقتباسات</p>';
        return;
    }
    
    quotesList.innerHTML = quotes.map(quote => `
        <div class="quote-item">
            <div class="quote-book">
                <strong>${quote.book?.title}</strong> - ${quote.book?.author}
                ${quote.page ? `<span>صفحة ${quote.page}</span>` : ''}
            </div>
            <div class="quote-text">
                <i class="fas fa-quote-right"></i>
                <p>${quote.quote}</p>
            </div>
            <div class="quote-date">${new Date(quote.date).toLocaleDateString('ar')}</div>
        </div>
    `).join('');
}

function setupProfileEvents() {
    // Profile tabs
    document.querySelectorAll('.profile-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.profile-tab-content').forEach(content => content.classList.remove('active'));
            document.getElementById(`${tabName}Tab`).classList.add('active');
        });
    });
    
    // Edit profile form
    const editForm = document.getElementById('editProfileForm');
    if (editForm) {
        editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const updates = {
                username: document.getElementById('editUsername').value,
                email: document.getElementById('editEmail').value,
                bio: document.getElementById('editBio').value,
                avatar: document.getElementById('editAvatar').value
            };
            
            SulafAPI.updateUserProfile(profileUser.id, updates);
            showToast('تم تحديث الملف الشخصي', 'success');
            loadProfile();
        });
        
        // Populate form with current data
        document.getElementById('editUsername').value = profileUser.username;
        document.getElementById('editEmail').value = profileUser.email;
        document.getElementById('editBio').value = profileUser.bio || '';
        document.getElementById('editAvatar').value = profileUser.avatar || '';
    }
    
    // Change password form
    const changePassForm = document.getElementById('changePasswordProfileForm');
    if (changePassForm) {
        changePassForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const currentPass = document.getElementById('currentPass').value;
            const newPass = document.getElementById('newPass').value;
            const confirmNew = document.getElementById('confirmNewPass').value;
            
            if (newPass !== confirmNew) {
                showToast('كلمة المرور الجديدة غير متطابقة', 'error');
                return;
            }
            
            // This would need to verify current password
            // For demo, we'll assume it's correct
            const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users));
            if (users[profileUser.id].password === currentPass) {
                users[profileUser.id].password = newPass;
                localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
                showToast('تم تغيير كلمة المرور بنجاح', 'success');
                changePassForm.reset();
            } else {
                showToast('كلمة المرور الحالية غير صحيحة', 'error');
            }
        });
    }
    
    // Change avatar button
    const changeAvatarBtn = document.getElementById('changeAvatarBtn');
    if (changeAvatarBtn) {
        changeAvatarBtn.addEventListener('click', () => {
            const avatarUrl = prompt('أدخل رابط الصورة الجديدة:');
            if (avatarUrl) {
                SulafAPI.updateUserProfile(profileUser.id, { avatar: avatarUrl });
                showToast('تم تحديث الصورة الشخصية', 'success');
                loadProfile();
            }
        });
    }
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

function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-times-circle'}"></i><span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Make openBookReader available globally
window.openBookReader = function(bookId) {
    window.location.href = `index.html?book=${bookId}`;
};
