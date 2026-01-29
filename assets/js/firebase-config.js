// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDNYU02V3qOVXikSBPU8Bgcf7h9Y6VPl9Y",
    authDomain: "studypath-dd71a.firebaseapp.com",
    projectId: "studypath-dd71a",
    storageBucket: "studypath-dd71a.firebasestorage.app",
    messagingSenderId: "776877004822",
    appId: "1:776877004822:web:72a0d61b2422bc35e8fd37",
    measurementId: "G-N16F4DF0RP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth and Provider
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Export these so they can be used in your main login script
export { auth, googleProvider, signInWithPopup };