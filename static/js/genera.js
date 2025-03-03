import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-analytics.js";

// Firebase configuration
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
const analytics = getAnalytics(app);
const db = getDatabase(app);

let genusData = []; // Store fetched data globally

// Function to fetch and display data
async function fetchData() {
  try {
    const snapshot = await get(ref(db, 'species/genera')); // Fetch data from species/genera
    if (snapshot.exists()) {
      const generaData = snapshot.val();
      genusData = []; // Reset genus data array

      // Process each genus and their species
      for (const genusKey in generaData) {
        const genus = generaData[genusKey];
        for (const speciesKey in genus) {
          const species = genus[speciesKey];
          
          // Construct full name, using speciesKey if speciesName is not available
          const speciesName = species.speciesName ? species.speciesName : speciesKey;
          const fullName = `${genusKey} ${speciesName}`;
          
          genusData.push({
            name: fullName,
            imageUrls: species.imageUrls || [], // Expect imageUrls array
            imageUrl: species.imageUrl || '',  // Fallback single imageUrl if imageUrls is not available
            key: speciesKey
          });
        }
      }
      displayData(genusData); // Display fetched data
    } else {
      console.log('No data available');
    }
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

// Function to display data in the gallery with highlighted search term
function displayData(data, searchTerm = '') {
  const galleryContainer = document.getElementById('gallery');
  galleryContainer.innerHTML = ''; // Clear any existing content

  data.forEach(item => {
    // Create HTML elements for each item
    const colDiv = document.createElement('div');
    colDiv.className = 'col-xl-3 col-lg-4 col-md-6';

    const galleryItem = document.createElement('div');
    galleryItem.className = 'gallery-item h-100 position-relative';

    const img = document.createElement('img');

    // Use first image in imageUrls if available, otherwise use fallback imageUrl
    if (item.imageUrls && item.imageUrls.length > 0) {
      img.src = item.imageUrls[0]; // Display the first image from the imageUrls array
    } else {
      img.src = item.imageUrl || ''; // Fallback to imageUrl if imageUrls is not available
    }

    img.alt = item.name;
    img.className = 'img-fluid';

    const linksDiv = document.createElement('div');
    linksDiv.className = 'gallery-links d-flex align-items-center justify-content-center';

    const previewLink = document.createElement('a');
    previewLink.href = item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls[0] : item.imageUrl;
    previewLink.title = item.name;
    previewLink.className = 'glightbox preview-link';
    previewLink.innerHTML = '<i class="bi bi-arrows-angle-expand"></i>';
    linksDiv.appendChild(previewLink);

    const detailsLink = document.createElement('a');
    detailsLink.href = `/genusdetails/${encodeURIComponent(item.key)}`;
    detailsLink.className = 'details-link';
    detailsLink.innerHTML = '<i class="bi bi-link-45deg"></i>';
    linksDiv.appendChild(detailsLink);

    const nameDiv = document.createElement('div');
    nameDiv.className = 'gallery-name';

    // Highlight search term
    if (searchTerm) {
      const regex = new RegExp(`(${searchTerm})`, 'gi');
      nameDiv.innerHTML = item.name.replace(regex, '<span class="highlight">$1</span>');
    } else {
      nameDiv.innerText = item.name;
    }

    galleryItem.appendChild(img);
    galleryItem.appendChild(linksDiv);
    galleryItem.appendChild(nameDiv);

    colDiv.appendChild(galleryItem);
    galleryContainer.appendChild(colDiv);
  });
}

// Function to handle input and show suggestions
const suggestionsList = document.getElementById('suggestions-list');

function searchImage() {
  const searchInput = document.getElementById('imageSearch').value.toLowerCase();
  const filteredData = genusData.filter(item => item.name.toLowerCase().includes(searchInput));

  displayData(filteredData, searchInput); // Display the filtered results with highlight

  const notification = document.getElementById('notification'); // Get the notification element
  if (filteredData.length === 0) {
    notification.innerHTML = `Sorry! No Results Found for <span class="red-text">(${searchInput})</span><br>Please use exact or shortest keyword...<br>to get better search results`;
    notification.style.display = 'block'; // Show notification
  } else {
    notification.style.display = 'none'; // Hide notification if results found
  }

  // Show suggestions as the user types
  showSuggestions(searchInput);
}


// Function to show suggestions based on the input
function showSuggestions(input) {
  suggestionsList.innerHTML = ''; // Clear previous suggestions

  if (input.length > 0) {
    const filteredNames = genusData.filter(item => item.name.toLowerCase().includes(input)); // Filter based on the input

    // Display suggestions if there are matches
    if (filteredNames.length > 0) {
      filteredNames.forEach(item => {
        const li = document.createElement('li');
        
        // Create a regular expression to match the input in the item name
        const regex = new RegExp(`(${input})`, 'gi');
        
        // Highlight the matching part of the name by wrapping it in a <span>
        li.innerHTML = item.name.replace(regex, '<span style="color: #FF6347; font-weight: bold;">$1</span>'); // Change color as needed
        
        li.addEventListener('click', () => {
          document.getElementById('imageSearch').value = item.name; // Set input value to selected suggestion
          suggestionsList.style.display = 'none'; // Hide suggestions after selection
          searchImage(); // Trigger the search based on the selected name
        });
        
        suggestionsList.appendChild(li);
      });
      suggestionsList.style.display = 'block'; // Show suggestions
    } else {
      suggestionsList.style.display = 'none'; // Hide suggestions if no matches
    }
  } else {
    suggestionsList.style.display = 'none'; // Hide suggestions if input is empty
  }
}


// Event listener for Enter key press to trigger the search when the user presses Enter
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('imageSearch');
  searchInput.addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
      searchImage(); // Trigger search on Enter key press
    }
  });
});

// Event listener for input changes to show suggestions
document.getElementById('imageSearch').addEventListener('input', function () {
  const query = this.value.toLowerCase();
  showSuggestions(query); // Show suggestions as the user types
});

// Fetch data when the window loads
window.onload = fetchData;
