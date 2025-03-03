// Import Firebase SDK functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getDatabase, ref,push, set } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";


// My Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDyurkD5mkFM_TAi3TmLOE3boehVNtNJFY",
  authDomain: "capstone-92833.firebaseapp.com",
  databaseURL: "https://capstone-92833-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "capstone-92833",
  storageBucket: "capstone-92833.appspot.com",
  messagingSenderId: "824130896942",
  appId: "1:824130896942:web:f2cc74327abd0e9c304bbf",
  measurementId: "G-L57NFDXD3B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Function to handle form submission
document.getElementById('contactForm').addEventListener('submit', function(event) {
  event.preventDefault(); // Prevent page refresh

  // Get form values
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const message = document.getElementById('message').value;

  // Reference to 'contactMessages' in your Firebase Realtime Database
  const contactRef = ref(database, 'contactMessages/');

  // Create a new entry with a unique key using push()
  const newContactRef = push(contactRef);

  // Set the data to the new reference
  set(newContactRef, {
    fullName: name,
    email: email,
    message: message,
    timestamp: Date.now() // Add timestamp for the message
  })
  .then(() => {
    alert('Message sent successfully!');
    document.getElementById('contactForm').reset(); // Reset form after submission
  })
  .catch((error) => {
    console.error('Error sending message:', error);
    alert('There was an error sending your message. Please try again.');
  });
});
