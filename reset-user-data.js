// Quick fix script to reset user data and show current state
// Run this in browser console

console.log('=== CURRENT USER DATA ===');
const currentUser = localStorage.getItem('currentUser');
const userData = JSON.parse(localStorage.getItem('user_' + currentUser));

console.log('Shortlisted Universities:', userData.shortlistedUniversities);
console.log('Locked Universities:', userData.lockedUniversities);
console.log('Current Stage:', userData.stage);
console.log('Tasks:', userData.tasks);

console.log('\n=== FIXING DATA ===');

// Clear locked and shortlisted if needed
if (userData.shortlistedUniversities && userData.shortlistedUniversities.length > 0) {
    console.log('Clearing shortlisted universities:', userData.shortlistedUniversities);
    userData.shortlistedUniversities = [];
}

if (userData.lockedUniversities && userData.lockedUniversities.length > 0) {
    console.log('Clearing locked universities:', userData.lockedUniversities);
    userData.lockedUniversities = [];
}

// Reset stage to finalize (so lock task appears)
if (userData.stage === 'apply') {
    console.log('Resetting stage from "apply" to "finalize"');
    userData.stage = 'finalize';
}

// Mark lock task as incomplete
if (userData.tasks) {
    const lockTask = userData.tasks.find(t => t.id === 'lock_final_list');
    if (lockTask && lockTask.completed) {
        console.log('Marking lock task as incomplete');
        lockTask.completed = false;
    }
}

// Save
localStorage.setItem('user_' + currentUser, JSON.stringify(userData));

console.log('\n=== DATA RESET COMPLETE ===');
console.log('Reload the page to see changes');
console.log('You should now see:');
console.log('- No locked universities');
console.log('- "Lock Final University List" task in To-Do');
console.log('- Stage shows "Finalizing Universities"');
