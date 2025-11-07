// 🔥 Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBLfN9o3K3XOkkSI5zLaHZfRyGbN9GF_5o",
  authDomain: "solo-leveling-quest-bb313.firebaseapp.com",
  projectId: "solo-leveling-quest-bb313",
  storageBucket: "solo-leveling-quest-bb313.firebasestorage.app",
  messagingSenderId: "672116410209",
  appId: "1:672116410209:web:b2e93077532d8669d3e720",
  measurementId: "G-CWDEG3T8E7"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Elements
const loginSection = document.getElementById("login-section");
const questSection = document.getElementById("quest-section");
const usernameDisplay = document.getElementById("username");
const pointsDisplay = document.getElementById("points");
const quests = document.querySelectorAll(".quest");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");

let currentUser = null;

// 🔹 Login with Google
loginBtn.addEventListener("click", () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).then(result => {
    console.log("User logged in:", result.user);
  }).catch(error => {
    alert("Login failed: " + error.message);
  });
});

// 🔹 Logout
logoutBtn.addEventListener("click", () => {
  auth.signOut();
});

// 🔹 Auth state change listener
auth.onAuthStateChanged(async (user) => {
  if (user) {
    currentUser = user;
    loginSection.style.display = "none";
    questSection.style.display = "block";
    usernameDisplay.textContent = user.displayName;

    // Check if user exists in Firestore
    const userRef = db.collection("users").doc(user.uid);
    const doc = await userRef.get();

    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

    if (!doc.exists) {
      // New user create karo
      await userRef.set({
        username: user.displayName,
        points: 0,
        lastReset: today,
        completed: {}
      });
    } else {
      // Daily quest reset check
      const data = doc.data();
      if (data.lastReset !== today) {
        await userRef.update({
          completed: {},
          lastReset: today
        });
      }
    }

    updateUserData();
  } else {
    currentUser = null;
    loginSection.style.display = "block";
    questSection.style.display = "none";
  }
});

// 🔹 Update UI with user data
async function updateUserData() {
  if (!currentUser) return;
  const userRef = db.collection("users").doc(currentUser.uid);
  const doc = await userRef.get();
  const data = doc.data();
  pointsDisplay.textContent = data.points;

  quests.forEach(q => {
    const questName = q.getAttribute("data-quest");
    if (data.completed && data.completed[questName]) {
      q.classList.add("completed");
      q.querySelector("button").disabled = true;
      q.querySelector("button").textContent = "Completed ✅";
    } else {
      q.classList.remove("completed");
      q.querySelector("button").disabled = false;
      q.querySelector("button").textContent = "Complete Quest";
    }
  });
}

// 🔹 Quest completion
quests.forEach(q => {
  const btn = q.querySelector("button");
  btn.addEventListener("click", async () => {
    if (!currentUser) return alert("Please log in first!");

    const questName = q.getAttribute("data-quest");
    const reward = parseInt(q.getAttribute("data-reward"));

    const userRef = db.collection("users").doc(currentUser.uid);
    const doc = await userRef.get();
    const data = doc.data();

    if (data.completed && data.completed[questName]) {
      alert("Quest already completed for today!");
      return;
    }

    const newPoints = data.points + reward;
    const newCompleted = { ...data.completed, [questName]: true };

    await userRef.update({
      points: newPoints,
      completed: newCompleted
    });

    updateUserData();
  });
});