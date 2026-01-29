// Authentication Logic
import { auth, googleProvider, signInWithPopup } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode') || 'login';

    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const authTitle = document.getElementById('authTitle');
    const authSubtitle = document.getElementById('authSubtitle');
    const toggleAuthMode = document.getElementById('toggleAuthMode');
    const toggleText = document.getElementById('toggleText');
    const backBtn = document.getElementById('backBtn');

    // Set initial mode
    setAuthMode(mode);

    // Toggle between login and signup
    toggleAuthMode.addEventListener('click', function (e) {
        e.preventDefault();
        const currentMode = loginForm.classList.contains('hidden') ? 'signup' : 'login';
        const newMode = currentMode === 'login' ? 'signup' : 'login';
        setAuthMode(newMode);
    });

    function setAuthMode(mode) {
        if (mode === 'signup') {
            loginForm.classList.add('hidden');
            signupForm.classList.remove('hidden');
            authTitle.textContent = 'Create Account';
            authSubtitle.textContent = 'Start your study abroad journey';
            toggleText.innerHTML = 'Already have an account? <a href="#" id="toggleAuthMode">Login</a>';
        } else {
            signupForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
            authTitle.textContent = 'Welcome Back';
            authSubtitle.textContent = 'Login to continue your journey';
            toggleText.innerHTML = 'Don\'t have an account? <a href="#" id="toggleAuthMode">Sign up</a>';
        }

        // Reattach event listener
        document.getElementById('toggleAuthMode').addEventListener('click', function (e) {
            e.preventDefault();
            const currentMode = loginForm.classList.contains('hidden') ? 'signup' : 'login';
            const newMode = currentMode === 'login' ? 'signup' : 'login';
            setAuthMode(newMode);
        });
    }

    // Back button
    backBtn.addEventListener('click', function () {
        window.location.href = 'index.html';
    });

    // Password toggle
    document.getElementById('toggleLoginPassword').addEventListener('click', function () {
        const passwordField = document.getElementById('loginPassword');
        const type = passwordField.type === 'password' ? 'text' : 'password';
        passwordField.type = type;
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });

    document.getElementById('toggleSignupPassword').addEventListener('click', function () {
        const passwordField = document.getElementById('signupPassword');
        const type = passwordField.type === 'password' ? 'text' : 'password';
        passwordField.type = type;
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });

    // Login form submission
    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        const userData = getUserData(email);

        if (!userData) {
            alert('No account found with this email. Please sign up first.');
            return;
        }

        if (userData.password !== password) {
            alert('Incorrect password. Please try again.');
            return;
        }

        // Set current user and redirect
        localStorage.setItem('currentUser', email);

        if (userData.profileComplete) {
            // Mark that user has logged in (no longer first time)
            // This happens after the first successful login to dashboard from onboarding
            if (userData.firstLogin === true) {
                userData.firstLogin = false;
                saveUserData(email, userData);
            }
            window.location.href = 'dashboard.html';
        } else {
            window.location.href = 'onboarding.html';
        }
    });

    // Signup form submission
    signupForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const name = document.getElementById('signupName').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;

        // Check if user already exists
        if (getUserData(email)) {
            alert('An account with this email already exists. Please login.');
            return;
        }

        // Create new user
        const newUser = {
            name: name,
            email: email,
            password: password,
            profileComplete: false,
            firstLogin: true,
            createdAt: new Date().toISOString(),
            profile: {},
            stage: 'profile',
            shortlistedUniversities: [],
            lockedUniversities: [],
            tasks: []
        };

        saveUserData(email, newUser);
        localStorage.setItem('currentUser', email);

        // Redirect to onboarding
        window.location.href = 'onboarding.html';
    });

    // Google signup/login
    document.getElementById('googleSignupBtn').addEventListener('click', async function () {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            const email = user.email;

            // Check if user already exists in local system
            let userData = getUserData(email);

            if (!userData) {
                // New user - create profile automatically
                const newName = user.displayName || email.split('@')[0];

                userData = {
                    name: newName,
                    email: email,
                    password: 'google_auth_user', // Placeholder, not used for Google Auth
                    profileComplete: false,
                    firstLogin: true,
                    createdAt: new Date().toISOString(),
                    profile: {},
                    stage: 'profile',
                    shortlistedUniversities: [],
                    lockedUniversities: [],
                    tasks: [],
                    authProvider: 'google'
                };

                saveUserData(email, userData);

                // Set as current user
                localStorage.setItem('currentUser', email);

                // Redirect to onboarding
                window.location.href = 'onboarding.html';
            } else {
                // Existing user - login
                localStorage.setItem('currentUser', email);

                if (userData.profileComplete) {
                    if (userData.firstLogin === true) {
                        userData.firstLogin = false;
                        saveUserData(email, userData);
                    }
                    window.location.href = 'dashboard.html';
                } else {
                    window.location.href = 'onboarding.html';
                }
            }

        } catch (error) {
            console.error("Google Sign-In Error:", error);
            // Handle specific error codes if needed
            let errorMessage = "Google Sign-In failed. Please try again.";
            if (error.code === 'auth/popup-closed-by-user') {
                errorMessage = "Sign-in cancelled.";
            } else if (error.code === 'auth/invalid-api-key') {
                errorMessage = "Invalid Firebase configuration. Please check the API key.";
            }
            alert(errorMessage);
        }
    });

    // Forgot password flow
    const forgotPasswordModal = document.getElementById('forgotPasswordModal');
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const closeForgotModal = document.getElementById('closeForgotModal');
    const cancelResetBtn = document.getElementById('cancelResetBtn');
    const sendResetBtn = document.getElementById('sendResetBtn');

    forgotPasswordLink.addEventListener('click', function (e) {
        e.preventDefault();
        forgotPasswordModal.classList.remove('hidden');
    });

    closeForgotModal.addEventListener('click', function () {
        forgotPasswordModal.classList.add('hidden');
    });

    cancelResetBtn.addEventListener('click', function () {
        forgotPasswordModal.classList.add('hidden');
    });

    sendResetBtn.addEventListener('click', function () {
        const resetEmail = document.getElementById('resetEmail').value.trim();
        if (!resetEmail) {
            alert('Please enter your email address.');
            return;
        }

        const userData = getUserData(resetEmail);
        if (!userData) {
            alert('No account found with this email.');
            return;
        }

        // Simulate password reset
        alert(`Password reset instructions have been sent to ${resetEmail}. (This is a simulation - in production, an actual email would be sent)`);
        forgotPasswordModal.classList.add('hidden');
        document.getElementById('resetEmail').value = '';
    });
});
