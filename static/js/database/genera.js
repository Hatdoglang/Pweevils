import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js";

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

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Get speciesKey from the URL
function getSpeciesKeyFromPath() {
  const pathParts = window.location.pathname.split('/');
  return pathParts[pathParts.length - 1]; // Extract speciesKey from URL
}

// Fetch species details from genera
async function fetchDetails() {
  const speciesKey = getSpeciesKeyFromPath();
  if (!speciesKey) {
    console.error('Species key is missing');
    document.getElementById('details-container').innerText = 'Invalid request';
    return;
  }

  try {
    // Check in the 'species/genera' path for speciesKey
    const snapshot = await get(ref(db, `species/genera`));
    if (snapshot.exists()) {
      const generaData = snapshot.val();
      let speciesData = null;

      // Search through all genera to find the speciesKey
      for (const genus in generaData) {
        if (generaData[genus][speciesKey]) {
          speciesData = generaData[genus][speciesKey];
          break;
        }
      }

      if (speciesData) {
        displayDetails(speciesData);
      } else {
        console.warn('Species not found');
        document.getElementById('details-container').innerText = 'Species not found';
      }
    } else {
      console.error('Data not found at the path');
      document.getElementById('details-container').innerText = 'Data not found';
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    document.getElementById('details-container').innerText = 'Error fetching data';
  }
}

// Display species details in the UI
function displayDetails(data) {
  const scientificName = document.getElementById('scientificName');
  const scientificAuthorship = document.getElementById('scientificAuthor');
  const taxoRank = document.getElementById('taxonomicRank');
  const taxoStatus = document.getElementById('taxonomicStatus');
  const taxoRemarks = document.getElementById('taxonomicRemarks');
  const reference = document.getElementById('reference');
  const genusImage = document.getElementById('genus-image');
  const genusNameContainer = document.getElementById('genus-name'); // The container for genus name
  const relatedImagesContainer = document.getElementById('related-images'); // Container for related images

  // Create a string with the combined name
  const genusName = data.genusName;
  const speciesName = data.speciesName || data.speciesKey || 'Unknown Species'; // Use speciesKey if speciesName is not available

  // Combine the names
  const combinedName = `<span style="font-style: italic; font-weight: 400">${genusName}</span> <span style="font-style: italic; font-weight: 400">${speciesName}</span>`;

  // Set the inner HTML of the genus name container
  genusNameContainer.innerHTML = combinedName;

  // Set the author name below the genus name
  authorName.innerText = `${data.scientificAuthorship || 'Unknown'}`;

  // Set Scientific Name and Image
  scientificName.innerText = `${genusName} ${speciesName}`;
  scientificAuthorship.innerText = data.scientificAuthorship || 'No authorship available';

  // Check if there is an image array and set the first image
  if (Array.isArray(data.imageUrls) && data.imageUrls.length > 0) {
    genusImage.src = data.imageUrls[0]; // Display the first image in the array
  } else {
    genusImage.src = "{{ url_for('static', filename='img/placeholder-image-url.jpg') }}"; // Fallback to the placeholder image

  }

  // Set Taxonomic Information
  taxoRank.innerText = data.taxoRank || 'Unknown Rank';
  taxoStatus.innerHTML = formatTaxonomicStatus(data.taxoStatus || 'No status available');
  taxoRemarks.innerText = data.taxoRemarks || 'No remarks available';

  // Set Reference Information
  const referenceText = data.reference || 'No reference information available'; // Reference field
  reference.innerText = referenceText;  // Set reference as displayed text

  // Display Related Images (starting from index 1)
  relatedImagesContainer.innerHTML = ''; // Clear previous images if any
  if (Array.isArray(data.imageUrls) && data.imageUrls.length > 1) {
    for (let i = 1; i < data.imageUrls.length; i++) {
      const img = document.createElement('img');
      img.src = data.imageUrls[i]; // Set the image source
      img.alt = `Related Image ${i}`;
      img.style = 'width: 100px; height: auto; display: inline-block; margin-right: 10px; cursor: pointer;'; // Style to make images small and inline
      img.onclick = function() { openModal(img.src); }; // Open modal on image click
      relatedImagesContainer.appendChild(img); // Append the image to the container
    }
  }

  // Initialize Map if latitude and longitude data exists
  if (data.lat && data.lon && data.location) {
    initializeMap(data.lat, data.lon, data.location);
  }
}

// Open the modal and display the clicked image
function openModal(imageSrc) {
  const modal = document.getElementById('imageModal');
  const modalImage = document.getElementById('modalImage');
  modal.style.display = 'block'; // Show the modal
  modalImage.src = imageSrc; // Set the image in the modal

  // When the user clicks on the close button, close the modal
  const closeBtn = document.getElementsByClassName('close')[0];
  closeBtn.onclick = function() {
    modal.style.display = 'none'; // Hide the modal
  }

  // When the user clicks anywhere outside the modal, close the modal
  window.onclick = function(event) {
    if (event.target === modal) {
      modal.style.display = 'none'; // Hide the modal
    }
  }
}




// Format taxonomic status to a list with italicized values for Genus and Species only
function formatTaxonomicStatus(status) {
  // Define the labels you want to match exactly
  const labels = ['Superfamily', 'Subfamily', 'Tribe', 'Genus', 'Species'];

  // Split the input string by spaces and process each label
  const formattedItems = labels.map(label => {
    const regex = new RegExp(`${label}:\\s*([^\\s]+)`, 'i');  // Match each label and capture the following word
    const match = status.match(regex); // Get the matching value for the label

    if (match) {
      const value = match[1]; // Capture the value after the label
      const valueStyle = (label === 'Genus' || label === 'Species') 
                         ? `<span class="taxo-value italic">${value}</span>`  // Italic for Genus and Species
                         : `<span class="taxo-value">${value}</span>`;      // Normal for others

      return `<li><strong>${label}:</strong> ${valueStyle}</li>`;
    } else {
      return ''; // Return empty string if the label is not found
    }
  }).join('');

  // Wrap the formatted items in an unordered list
  return `<ul class="taxo-list">${formattedItems}</ul>`;
}


// Initialize Mapbox map with species location
function initializeMap(latitude, longitude, locationName) {
  mapboxgl.accessToken = 'pk.eyJ1IjoiemVuaXRzdS02IiwiYSI6ImNsejU4Z3Q0ZjQwa2MyanF2dzJ3a2M5YTYifQ.HQjyfHtXRX4Hba4YKlu-qA';
  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [longitude, latitude],
    zoom: 12 // Set zoom level, can adjust to desired level
  });

  // Add navigation controls to the map
  map.addControl(new mapboxgl.NavigationControl());

  // Add the marker at the species location
  const marker = new mapboxgl.Marker()
    .setLngLat([longitude, latitude])
    .addTo(map);

  // Create and add a popup to the marker
  const popup = new mapboxgl.Popup({ offset: 25 })
    .setHTML(`<strong style="color: black;">Location:</strong> <span style="color: black;">${locationName}</span>`)
    .addTo(map);

  // Bind the popup to the marker
  marker.setPopup(popup);
}

// Run the fetch details function on page load
window.onload = fetchDetails;
