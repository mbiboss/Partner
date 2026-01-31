// IndexedDB for permanent storage
const DB_NAME = 'PartnerDB';
const STORE_NAME = 'ProfileStore';

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
    });
}

async function saveProfilePicPermanent(base64Image) {
    try {
        const db = await initDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(base64Image, 'profilePic');
        return true;
    } catch (e) {
        console.error('DB Error:', e);
        return false;
    }
}

async function getProfilePicPermanent() {
    try {
        const db = await initDB();
        return new Promise((resolve) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const request = tx.objectStore(STORE_NAME).get('profilePic');
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => resolve(null);
        });
    } catch (e) {
        return null;
    }
}

// Common utility functions

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 24px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 9999;
        animation: slideInRight 0.3s ease;
        max-width: 300px;
    `;
    
    if (type === 'success') {
        toast.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    } else if (type === 'error') {
        toast.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
    } else {
        toast.style.background = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
    }
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Format Bangladesh mobile number
function formatPhoneNumber(phone) {
    if (!phone) return '';
    let p = phone.trim();
    if (p.startsWith('+880')) {
        return p.replace('+880', '0');
    }
    if (!p.startsWith('0')) {
        return '0' + p;
    }
    return p;
}

// Validate email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validate Bangladesh mobile number
function validateBDMobile(mobile) {
    const re = /^(?:\+8801|01)[3-9]\d{8}$/;
    return re.test(mobile);
}

// Check if user is logged in
function checkAuth() {
    // In a real app, this would check PHP session
    // For now, sync with localStorage for frontend logic
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return localStorage.getItem('isLoggedIn') === 'true' && !!user.id;
}

// Require authentication for protected pages
function requireAuth() {
    const publicPages = ['index.html', 'auth.html', 'login.php', 'signup.php', '', '/'];
    const path = window.location.pathname;
    const page = path.split('/').pop();
    
    if (!checkAuth() && !publicPages.includes(page)) {
        window.location.href = 'auth.html';
        return false;
    }
    return true;
}

// Initialize PWA
function initPWA() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('service-worker.js');
        });
    }
    
    if ('beforeinstallprompt' in window) {
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            // Show install button
            const installBtn = document.createElement('button');
            installBtn.textContent = 'Install App';
            installBtn.className = 'btn-primary';
            installBtn.style.cssText = 'position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%); z-index: 1001;';
            installBtn.onclick = () => {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('User accepted install');
                    }
                    deferredPrompt = null;
                    installBtn.remove();
                });
            };
            
            setTimeout(() => {
                document.body.appendChild(installBtn);
                setTimeout(() => installBtn.remove(), 10000);
            }, 5000);
        });
    }
}

// Handle offline/online status
function initOfflineDetection() {
    const showOfflineStatus = () => {
        if (!navigator.onLine) {
            showToast('You are offline. Some features may not work.', 'error');
        }
    };
    
    window.addEventListener('online', () => {
        showToast('You are back online!', 'success');
    });
    
    window.addEventListener('offline', showOfflineStatus);
    showOfflineStatus();
}

// Like system logic
function handleLike(profileName) {
    console.log('Liking profile:', profileName);
    const plan = localStorage.getItem('selectedPlan') || 'free';
    let likedProfiles = JSON.parse(localStorage.getItem('likedProfiles') || '[]');
    
    // Check if already liked
    if (likedProfiles.includes(profileName)) {
        showToast(localStorage.getItem('language') === 'bn' ? 'আপনি ইতিমধ্যে এটি পছন্দ করেছেন!' : 'Already liked!', 'info');
        return;
    }

    // Limit check for free users
    if (plan === 'free' && likedProfiles.length >= 5) {
        const modal = document.getElementById('subscriptionModal');
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.remove('hidden');
        } else {
            showToast(localStorage.getItem('language') === 'bn' ? 'আরও লাইক দিতে প্রিমিয়াম নিন!' : 'Upgrade to Premium for more likes!', 'error');
        }
        return;
    }

    likedProfiles.push(profileName);
    localStorage.setItem('likedProfiles', JSON.stringify(likedProfiles));
    showToast(localStorage.getItem('language') === 'bn' ? 'পছন্দ করা হয়েছে!' : 'Liked!', 'success');
    
    // Refresh matches UI if open
    const matchesModal = document.getElementById('matchesModal');
    if (matchesModal && !matchesModal.classList.contains('hidden')) {
        updateMatchesUI();
    }
}

// Show liked profiles in Matches modal
async function updateMatchesUI() {
    console.log('Updating Matches UI');
    const lang = localStorage.getItem('language') || 'bn';
    const likedNames = JSON.parse(localStorage.getItem('likedProfiles') || '[]');
    const matchesModal = document.getElementById('matchesModal');
    if (!matchesModal) return;
    
    const matchesList = matchesModal.querySelector('.modal-body');
    if (!matchesList) return;
    
    if (likedNames.length === 0) {
        matchesList.innerHTML = `
            <div style="text-align: center; padding: 40px 20px;">
                <i class="fas fa-heart-broken" style="font-size: 50px; color: #e5e7eb; margin-bottom: 20px;"></i>
                <h4>${lang === 'bn' ? 'এখনও কোনো ম্যাচ নেই' : 'No Matches Yet'}</h4>
                <p style="color: #6b7280;">${lang === 'bn' ? 'পারফেক্ট ম্যাচ খুঁজে পেতে আরও এক্সপ্লোর করুন!' : 'Keep exploring to find your perfect match!'}</p>
            </div>
        `;
        return;
    }

    try {
        const response = await fetch('get_users_by_gender.php?gender=all', {
            headers: { 'Cache-Control': 'no-cache' }
        });
        const data = await response.json();
        const allProfiles = data.users || [];
        const likedProfiles = allProfiles.filter(p => likedNames.includes(p.name));

        if (likedProfiles.length > 0) {
            matchesList.innerHTML = `
                <div class="matches-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; width: 100%;">
                    ${likedProfiles.map(p => {
                        const img = p.profile_pic || p.img || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=6366f1&color=fff`;
                        return `
                        <div class="match-item" style="text-align: center; background: var(--bg-light); padding: 10px; border-radius: 12px; border: 1px solid var(--border); cursor: pointer;" onclick="location.href='profile-view.html?id=${p.id}'">
                            <img src="${img}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 2px solid var(--primary);">
                            <h5 style="margin-top: 5px; font-size: 14px; color: var(--text-main);">${p.name}</h5>
                            <p style="font-size: 10px; color: var(--text-muted);">${p.location || ''}</p>
                        </div>
                        `;
                    }).join('')}
                </div>
            `;
        }
    } catch (e) {
        console.error('Error updating matches:', e);
    }
}

// Logout function with data cleanup
function logout() {
    const lang = localStorage.getItem('language') || 'bn';
    const confirmMsg = lang === 'bn' ? 'আপনি কি নিশ্চিত যে আপনি লগআউট করতে চান?' : 'Are you sure you want to logout?';
    
    if (confirm(confirmMsg)) {
        // Clear everything
        localStorage.clear();
        sessionStorage.clear();
        
        window.location.href = 'index.html';
    }
}

// Shortcut for Admin Panel (Ctrl+Shift+M)
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.code === 'KeyM') {
        e.preventDefault();
        window.location.href = 'admin.html';
    }
});

// Profile edit mode toggle
function toggleEditMode() {
    const displayList = document.getElementById('profileDisplayList');
    const editForm = document.getElementById('profileEditForm');
    const editBtn = document.getElementById('editModeBtn');
    const lang = localStorage.getItem('language') || 'bn';

    if (editForm.classList.contains('hidden')) {
        // Switching to Edit Mode
        displayList.classList.add('hidden');
        editForm.classList.remove('hidden');
        editBtn.innerHTML = `<i class="fas fa-times"></i> ${lang === 'bn' ? 'বাতিল' : 'Cancel'}`;
        
        // Populate inputs from current data
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        document.getElementById('editAboutInput').value = user.about || '';
        document.getElementById('editEducationInput').value = user.education || '';
        document.getElementById('editLocationInput').value = user.location || '';
        document.getElementById('editStatusInput').value = user.status || 'অবিবাহিত';
    } else {
        // Switching back to Display Mode
        displayList.classList.remove('hidden');
        editForm.classList.add('hidden');
        editBtn.innerHTML = `<i class="fas fa-edit"></i> ${lang === 'bn' ? 'এডিট করুন' : 'Edit Profile'}`;
    }
}

function changeLanguage() {
    const lang = document.getElementById('languageSelect').value;
    localStorage.setItem('language', lang);
    location.reload();
}

// Handle profile update and local sync
async function saveAllProfileFields() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const updatedData = {
        id: user.id,
        about: document.getElementById('editAboutInput').value,
        education: document.getElementById('editEducationInput').value,
        location: document.getElementById('editLocationInput').value,
        status: document.getElementById('editStatusInput').value
    };

    try {
        const response = await fetch('update_profile.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });

        const result = await response.json();
        if (result.success) {
            // Update local storage for immediate UI feedback
            const newUser = { ...user, ...updatedData };
            localStorage.setItem('user', JSON.stringify(newUser));
            
            // Reload from server to ensure data integrity
            await loadUserProfile();
            toggleEditMode();
            showToast(localStorage.getItem('language') === 'bn' ? 'প্রোফাইল আপডেট করা হয়েছে!' : 'Profile updated successfully!', 'success');
        } else {
            showToast(result.message, 'error');
        }
    } catch (e) {
        console.error('Update Error:', e);
        showToast('Error updating profile', 'error');
    }
}

// Update loadUserProfile to handle the new UI structure
async function loadUserProfile() {
    let user = JSON.parse(localStorage.getItem('user') || '{}');
    const lang = localStorage.getItem('language') || 'bn';

    // Immediate UI update from local cache to prevent flicker
    updateProfileImages(user);

    // If user is logged in but doesn't have profile data, or if we want to ensure freshness
    if (user.id) {
        try {
            const response = await fetch(`get_user.php?id=${user.id}`, {
                headers: { 'Cache-Control': 'no-cache' }
            });
            const result = await response.json();
            if (result.success && result.user) {
                // Ensure profilePic is correctly mapped from server's profile_pic
                if (result.user.profile_pic) {
                    result.user.profilePic = result.user.profile_pic;
                }
                // Merge server data with local data
                user = { ...user, ...result.user };
                localStorage.setItem('user', JSON.stringify(user));
                // Update images again with fresh server data
                updateProfileImages(user);
            }
        } catch (e) {
            console.error('Error fetching user data:', e);
        }
    }
    
    const translations = {
        'bn': {
            'profile': 'প্রোফাইল',
            'matches': 'ম্যাচ',
            'likes': 'লাইক',
            'visits': 'ভিজিট',
            'detailsTitle': 'প্রোফাইল বিবরণ',
            'editBtn': '<i class="fas fa-edit"></i> এডিট করুন',
            'aboutLabel': 'আমার সম্পর্কে',
            'educationLabel': 'শিক্ষাগত যোগ্যতা',
            'locationLabel': 'ঠিকানা',
            'statusLabel': 'সম্পর্কের অবস্থা',
            'aboutPlaceholder': 'নিজের সম্পর্কে কিছু লিখুন',
            'educationPlaceholder': 'শিক্ষাগত যোগ্যতা যোগ করুন',
            'locationPlaceholder': 'বর্তমান ঠিকানা যোগ করুন',
            'statusPlaceholder': 'সম্পর্কের অবস্থা সিলেক্ট করুন',
            'preferences': 'পছন্দসমূহ',
            'language': 'ভাষা',
            'languageDesc': 'ভাষা নির্বাচন করুন',
            'theme': 'থিম',
            'themeDesc': 'লাইট বা ডার্ক মোড',
            'notifications': 'নোটিফিকেশন',
            'notificationsDesc': 'নোটিফিকেশন ম্যানেজ করুন',
            'support': 'সাপোর্ট',
            'help': 'সাহায্য ও সাপোর্ট',
            'helpDesc': 'অ্যাপ নিয়ে সাহায্য নিন',
            'privacy': 'প্রাইভেসি ও নিরাপত্তা',
            'privacyDesc': 'আপনার তথ্য ও সুরক্ষা',
            'aboutApp': 'পার্টনার সম্পর্কে',
            'aboutVersion': 'ভার্সন ১.২.০'
        },
        'en': {
            'profile': 'Profile',
            'matches': 'Matches',
            'likes': 'Likes',
            'visits': 'Visits',
            'detailsTitle': 'Profile Details',
            'editBtn': '<i class="fas fa-edit"></i> Edit Profile',
            'aboutLabel': 'About Me',
            'educationLabel': 'Education',
            'locationLabel': 'Location',
            'statusLabel': 'Relationship Status',
            'aboutPlaceholder': 'Write about yourself',
            'educationPlaceholder': 'Add education',
            'locationPlaceholder': 'Add location',
            'statusPlaceholder': 'Select status',
            'preferences': 'Preferences',
            'language': 'Language',
            'languageDesc': 'Select language',
            'theme': 'Theme',
            'themeDesc': 'Light or Dark mode',
            'notifications': 'Notifications',
            'notificationsDesc': 'Manage notifications',
            'support': 'Support',
            'help': 'Help & Support',
            'helpDesc': 'Get help with the app',
            'privacy': 'Privacy & Safety',
            'privacyDesc': 'Your data and security',
            'aboutApp': 'About Partner',
            'aboutVersion': 'Version 1.2.0'
        }
    };

    const t = translations[lang] || translations['en'];

    // Update Premium/VIP Badge
    const badgeEl = document.getElementById('userBadge');
    if (badgeEl) {
        if (user.subscription && user.subscription !== 'free') {
            badgeEl.textContent = user.subscription.toUpperCase();
            badgeEl.className = `user-badge badge-${user.subscription.toLowerCase()}`;
            badgeEl.classList.remove('hidden');
        } else {
            badgeEl.classList.add('hidden');
        }
    }

    // Update Static UI Translations
    const transMap = {
        'profileHeaderTitle': t.profile,
        'profileDetailsTitle': t.detailsTitle,
        'aboutLabel': t.aboutLabel,
        'educationLabel': t.educationLabel,
        'locationLabel': t.locationLabel,
        'statusLabel': t.statusLabel,
        'editAboutLabel': t.aboutLabel,
        'editEducationLabel': t.educationLabel,
        'editLocationLabel': t.locationLabel,
        'editStatusLabel': t.statusLabel,
        'preferencesTitle': t.preferences,
        'langLabel': t.language,
        'langDesc': t.languageDesc,
        'themeLabel': t.theme,
        'themeDesc': t.themeDesc,
        'notifyLabel': t.notifications,
        'notifyDesc': t.notificationsDesc,
        'supportTitle': t.support,
        'helpLabel': t.help,
        'helpDesc': t.helpDesc,
        'privacyLabel': t.privacy,
        'privacyDesc': t.privacyDesc,
        'aboutLinkLabel': t.aboutApp,
        'aboutVersionLabel': t.aboutVersion
    };

    for (const [id, text] of Object.entries(transMap)) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    const editModeBtn = document.getElementById('editModeBtn');
    if (editModeBtn && !document.getElementById('profileEditForm').classList.contains('hidden')) {
        editModeBtn.innerHTML = `<i class="fas fa-times"></i> ${lang === 'bn' ? 'বাতিল' : 'Cancel'}`;
    } else if (editModeBtn) {
        editModeBtn.innerHTML = t.editBtn;
    }

    const elements = {
        'userName': user.name || (lang === 'bn' ? 'নাম নেই' : 'No Name'),
        'userEmail': user.email || user.mobile || '',
        'userAbout': user.about || t.aboutPlaceholder,
        'userEducation': user.education || t.educationPlaceholder,
        'userLocation': user.location || t.locationPlaceholder,
        'userStatus': user.status || t.statusPlaceholder
    };

    for (const [id, value] of Object.entries(elements)) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    const profileImg = document.getElementById('profileImage');
    if (profileImg) {
        // First priority: user.profilePic (client-side cache)
        // Second priority: user.profile_pic (server-side data)
        const photoUrl = user.profilePic || user.profile_pic;
        
        if (photoUrl) {
            profileImg.src = photoUrl;
            // Sync local storage
            if (!user.profilePic && user.profile_pic) {
                user.profilePic = user.profile_pic;
                localStorage.setItem('user', JSON.stringify(user));
            }
        } else {
            // Default avatar
            profileImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=6366f1&color=fff&size=150`;
        }
    }
    
    const langSelect = document.getElementById('languageSelect');
    if (langSelect) {
        langSelect.value = lang;
    }
}

// Theme sync removed
function initTheme() {}
function toggleTheme() {}
function updateProfileImages(user) {
    const profileImg = document.getElementById('profileImage');
    const homeProfileImg = document.querySelector('.profile-preview img');
    const photoUrl = user.profilePic || user.profile_pic;
    
    if (photoUrl) {
        if (profileImg) profileImg.src = photoUrl;
        if (homeProfileImg) homeProfileImg.src = photoUrl;
    } else if (user.name) {
        const defaultUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=fff&size=150`;
        if (profileImg) profileImg.src = defaultUrl;
        if (homeProfileImg) homeProfileImg.src = defaultUrl;
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    requireAuth();
    initTheme();
    await loadUserProfile();
    initPWA();
    initOfflineDetection();
    
    // Add CSS for animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        .toast {
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }
    `;
    document.head.appendChild(style);
});