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

// Format phone number
function formatPhoneNumber(phone) {
    if (phone.startsWith('+880')) {
        return phone.replace('+880', '');
    }
    if (phone.startsWith('01')) {
        return phone.substring(1);
    }
    return phone;
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

// Check if user is logged in (simulated)
function checkAuth() {
    // In a real app, this would check PHP session
    return localStorage.getItem('isLoggedIn') === 'true';
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
        const response = await fetch('get_users_by_gender.php?gender=all');
        const data = await response.json();
        const allProfiles = data.users || [];
        const likedProfiles = allProfiles.filter(p => likedNames.includes(p.name));

        if (likedProfiles.length > 0) {
            matchesList.innerHTML = `
                <div class="matches-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; width: 100%;">
                    ${likedProfiles.map(p => `
                        <div class="match-item" style="text-align: center; background: var(--bg-light); padding: 10px; border-radius: 12px; border: 1px solid var(--border);">
                            <img src="${p.img}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 2px solid var(--primary);">
                            <h5 style="margin-top: 5px; font-size: 14px; color: var(--text-main);">${p.name}</h5>
                            <p style="font-size: 10px; color: var(--text-muted);">${p.location}</p>
                        </div>
                    `).join('')}
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
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const profilePic = user.profilePic;
        const darkMode = localStorage.getItem('darkMode');
        const language = localStorage.getItem('language');
        
        // Clear everything
        localStorage.clear();
        
        // Restore only essential info (login and profile pic)
        if (profilePic) {
            localStorage.setItem('user', JSON.stringify({ profilePic: profilePic }));
        }
        if (darkMode) localStorage.setItem('darkMode', darkMode);
        if (language) localStorage.setItem('language', language);
        
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

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Session cleanup check - if not logged in, clear transient data
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const profilePic = user.profilePic;
        const darkMode = localStorage.getItem('darkMode');
        const language = localStorage.getItem('language');
        
        localStorage.clear();
        
        if (profilePic) localStorage.setItem('user', JSON.stringify({ profilePic: profilePic }));
        if (darkMode) localStorage.setItem('darkMode', darkMode);
        if (language) localStorage.setItem('language', language);
    }

    requireAuth();
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