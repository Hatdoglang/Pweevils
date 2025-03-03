// Import Firebase SDK functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";

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
console.log("Initializing Firebase...");
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
console.log("Firebase initialized.");

// Mapbox initialization
mapboxgl.accessToken = 'pk.eyJ1IjoiemVuaXRzdS02IiwiYSI6ImNsejU4Z3Q0ZjQwa2MyanF2dzJ3a2M5YTYifQ.HQjyfHtXRX4Hba4YKlu-qA';
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [125.4416, 7.0419],  // Initial map center coordinates
    zoom: 5,
    projection: 'mercator'  // Ensure mercator projection
});

// Add navigation controls to the map
const nav = new mapboxgl.NavigationControl();
map.addControl(nav, 'top-left');
// Array to store markers for searching
const markers = [];

// Function to get coordinates from a location string using Mapbox Geocoding API
async function getCoordinatesFromLocation(location) {
    const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json?access_token=${mapboxgl.accessToken}`;

    try {
        const response = await fetch(geocodeUrl);
        const data = await response.json();

        if (data.features && data.features.length > 0) {
            const coords = data.features[0].center; // [longitude, latitude]
            return { lat: coords[1], lon: coords[0] };
        } else {
            console.error(`No coordinates found for location: ${location}`);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching coordinates for location: ${location}`, error);
        return null;
    }
}
async function loadMarkers() {
    try {
        // Define a color mapping for each genus
        const genusColors = {
            "Batocera": "red",
            "Enoplocyrtus": "blue",
            "Eumacrocyrtus": "green",
            "Expachyrhynchus": "purple",
            "Macrocyrtus": "orange",
            "Metapocyrtus": "pink",
            "Notapocyrtus": "yellow",
            "Pachyrhynchus": "cyan"
        };

        // Helper function to process species location data
        const processSpeciesLocations = async (speciesData, speciesKey, genusKey, subgenusKey = '') => {
            const speciesName = speciesData?.speciesName || speciesKey;
            const genusLabel = speciesData?.genusName || genusKey || "Unknown Genus";
            const subgenusLabel = speciesData?.subgenusName || subgenusKey;

            // Select a color based on the genus name (default to black if not listed)
            const markerColor = genusColors[genusLabel] || "black";

            const imageUrls = speciesData?.imageUrls || [];
            const imageUrl = Array.isArray(imageUrls) && imageUrls.length > 0 ? imageUrls[0] : 'default_image_url.jpg';

            const scientificName = `${genusLabel} ${subgenusLabel} ${speciesName}`.trim();

            // Check if `locations` exist
            if (speciesData.locations) {
                Object.entries(speciesData.locations).forEach(([locationKey, locationDetails]) => {
                    const locationName = locationDetails?.location || "Unknown Location";
                    const lat = locationDetails?.lat;
                    const lon = locationDetails?.lon;

                    if (lat && lon) {
                        console.log(`Coordinates for ${speciesName} at ${locationName}: [${lat}, ${lon}]`);

                        const popupText = `
                            <div style="font-size: 14px; color: #333; width: 220px; padding: 10px; border: 1px solid #ccc; background-color: #f9f9f9; border-radius: 5px; text-align: center;">
                                <strong style="color: ${markerColor};">Scientific Name:</strong> ${scientificName}<br>
                                <strong style="color: ${markerColor};">Location:</strong> ${locationName}
                                <br><img src="${imageUrl}" alt="${speciesName}" style="width: 100px; height: auto; margin-top: 10px;">
                            </div>
                        `;

                        const marker = createMarker(lat, lon, popupText, imageUrl, scientificName, markerColor);
                        markers.push({ name: speciesName, genus: genusLabel, subgenus: subgenusLabel, marker });
                    } else {
                        console.warn(`Missing coordinates for location: ${locationName}`);
                    }
                });
            } else {
                console.warn(`No location data found for species: ${speciesName}`);
            }
        };

        // Load genus markers
        const genusSnapshot = await get(ref(db, 'species/genera'));
        if (genusSnapshot.exists()) {
            const genera = genusSnapshot.val();
            for (const genusKey in genera) {
                const genus = genera[genusKey];

                for (const speciesKey in genus) {
                    await processSpeciesLocations(genus[speciesKey], speciesKey, genusKey);
                }
            }
        } else {
            console.warn("No genera data found in Firebase.");
        }

        // Load subgenus markers
        const subgenusSnapshot = await get(ref(db, 'species/subgenera'));
        if (subgenusSnapshot.exists()) {
            const subgenera = subgenusSnapshot.val();
            for (const subgenusKey in subgenera) {
                const subgenus = subgenera[subgenusKey];

                for (const speciesKey in subgenus) {
                    await processSpeciesLocations(subgenus[speciesKey], speciesKey, 'Unknown Genus', subgenusKey);
                }
            }
        } else {
            console.warn("No subgenera data found in Firebase.");
        }
    } catch (error) {
        console.error("Error loading markers:", error);
    }
}



// Adjust map view to fit all markers
function fitMapToMarkers() {
    if (markers.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        markers.forEach(markerData => {
            bounds.extend(markerData.marker.getLngLat());
        });
        map.fitBounds(bounds, { padding: 50 });
    }
}

// Function to create a marker with an offset for overlapping markers
function createMarker(lat, lon, popupText, imageUrl, scientificName, color = 'blue') {
    const existingMarker = markers.find(markerData =>
        markerData.marker.getLngLat().lat === lat && markerData.marker.getLngLat().lng === lon
    );

    const offset = existingMarker ? 0.0001 : 0; // Offset to avoid marker overlap

    const marker = new mapboxgl.Marker({ color: color }) // Use dynamic color
        .setLngLat([lon + offset, lat + offset])
        .addTo(map);

        const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML(`
            ${popupText}
            <div style="text-align: center; margin-top: 10px;">
                <div style="margin-top: 5px; font-style: italic !important; font-size:14px; color: black;">
                    <span style="color: black;">Scientific Name: ${scientificName}</span>
                </div>                
            </div>
        `);
        
    marker.setPopup(popup);

    // Adjust map view to position popup at the top when opened
    marker.getPopup().on('open', () => {
        map.easeTo({
            center: [lon + offset, lat + offset],
            zoom: Math.max(map.getZoom(), 9), // Adjust zoom if necessary
            offset: [0, -window.innerHeight / 4], // Offset popup position upwards
        });
    });

    return marker;
}


// Call fitMapToMarkers after loading markers
map.on('load', function () {
    loadMarkers().then(() => {
        fitMapToMarkers();
    });
});
// Debounce utility to limit the frequency of function execution
function debounce(func, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
}
// Global variables for genus and subgenus data
let genusData = null;
let subgenusData = null;
let isUserInteracted = false;

// Array to store weevil names and markers for species
let allWeevilNames = [];
let speciesMarkers = {};

// Function to load weevil names from the database and populate allWeevilNames and speciesMarkers
async function loadWeevilNames() {
    try {
        const genusSnapshot = await get(ref(db, 'species/genera'));
        const subgenusSnapshot = await get(ref(db, 'species/subgenera'));

        genusData = genusSnapshot.exists() ? genusSnapshot.val() : null;
        subgenusData = subgenusSnapshot.exists() ? subgenusSnapshot.val() : null;

        console.log("Genus Snapshot Data:", genusData);
        console.log("Subgenus Snapshot Data:", subgenusData);

        if (genusData) {
            processGeneraData(genusData);
        } else {
            console.warn("No genus data found in the database.");
        }

        if (subgenusData) {
            processSubgeneraData(subgenusData);
        } else {
            console.warn("No subgenus data found in the database.");
        }

        console.log("All Weevil Names Loaded:", allWeevilNames);
    } catch (error) {
        console.error("Error loading weevil names:", error);
    }
}

// Helper function to process genus data
function processGeneraData(genusData) {
    for (const genusKey in genusData) {
        const genus = genusData[genusKey];
        for (const speciesKey in genus) {
            const speciesData = genus[speciesKey];

            console.log(`Processing genus species: ${speciesData?.speciesName}`, speciesData);

            if (speciesData?.location && speciesData?.speciesName) {
                const name = `${genusKey} ${speciesData.speciesName}`;
                allWeevilNames.push({
                    name,
                    format: 'genus',
                    genusName: genusKey,
                    speciesName: speciesData.speciesName
                });

                speciesMarkers[name] = {
                    genusName: genusKey,
                    speciesName: speciesData.speciesName,
                    location: speciesData.location,
                    marker: null // We'll populate this with the actual Mapbox marker later
                };
            }
        }
    }
}

// Helper function to process subgenus data
function processSubgeneraData(subgenusData) {
    for (const subgenusKey in subgenusData) {
        const subgenus = subgenusData[subgenusKey];
        for (const speciesKey in subgenus) {
            const speciesData = subgenus[speciesKey];

            console.log(`Processing subgenus species: ${speciesData?.speciesName}`, speciesData);

            if (speciesData?.location && speciesData?.speciesName && speciesData?.genusName) {
                const name = `${speciesData.genusName} ${subgenusKey} ${speciesData.speciesName}`;
                allWeevilNames.push({
                    name,
                    format: 'subgenus',
                    genusName: speciesData.genusName,
                    subgenusName: subgenusKey,
                    speciesName: speciesData.speciesName
                });

                speciesMarkers[name] = {
                    genusName: speciesData.genusName,
                    subgenusName: subgenusKey,
                    speciesName: speciesData.speciesName,
                    location: speciesData.location,
                    marker: null // We'll populate this with the actual Mapbox marker later
                };
            }
        }
    }
}

// Helper function to sanitize the query by removing unwanted characters (e.g., parentheses)
function sanitizeKeyword(query) {
    return query.replace(/[()]/g, '').trim().toLowerCase();
}


// Function to handle the search input and display suggestions
function handleSearchInput(event) {
    const searchType = document.getElementById('search-type').value; // Get selected search type
    const query = event.target.value.toLowerCase().trim();
    const suggestionsList = document.getElementById('suggestions-list');
    suggestionsList.innerHTML = ''; // Clear previous suggestions

    // Sanitize query to handle special characters like parentheses
    const sanitizedQuery = sanitizeKeyword(query);

    // Avoid searching for short queries like single characters (e.g., "g")
    if (sanitizedQuery.length < 2) {
        suggestionsList.style.display = 'none';  // Don't show suggestions for short queries
        return;
    }

    if (searchType === 'general') {
        const filteredNames = allWeevilNames.filter(item =>
            item.name.toLowerCase().includes(sanitizedQuery)
        );

        if (query.length > 0 && filteredNames.length > 0) {
            filteredNames.forEach(item => {
                const li = document.createElement('li');
                const regex = new RegExp(`(${sanitizedQuery})`, 'gi');
                // Wrap matched text with <span> and apply red color
                li.innerHTML = item.name.replace(regex, '<span style="color: red;">$1</span>');

                li.addEventListener('click', () => {
                    document.getElementById('weevil-search').value = item.name;
                    suggestionsList.style.display = 'none';
                    zoomToSpeciesLocation(item.name);
                    isUserInteracted = true;
                });
                suggestionsList.appendChild(li);
            });
            suggestionsList.style.display = 'block';
        } else {
            // Show notification for no results found
            const noResultLi = document.createElement('li');
            noResultLi.textContent = `Data not found (${query})`;
            noResultLi.style.color = 'red';
            noResultLi.style.fontWeight = 'bold';
            suggestionsList.appendChild(noResultLi);
            suggestionsList.style.display = 'block';
        }
    } else if (searchType === 'search-keyword') {
        fetchSpeciesDataAndHighlight(sanitizedQuery);
    }
}



// Function to highlight markers based on genus
function highlightMarkerByGenus(genusName) {
    markers.forEach(markerData => {
        if (markerData && markerData.marker && markerData.genus) {
            const markerGenus = markerData.genus.toLowerCase(); 

            // Check if the marker belongs to the selected genus
            if (markerGenus === genusName.toLowerCase()) {
                // Create a Font Awesome map marker smile icon
                const pinIconElement = document.createElement('i');
                pinIconElement.classList.add('fas', 'fa-map-marker-alt'); 
                pinIconElement.style.color = 'red'; 
                pinIconElement.style.fontSize = '40px'; 
                pinIconElement.style.backgroundColor = 'white';
                pinIconElement.style.borderRadius = '90%';  
                pinIconElement.style.height = '25px';  
                pinIconElement.style.width = '25px';  
                pinIconElement.style.zIndex = '1000'; 

                const markerElement = markerData.marker.getElement(); 

                // Replace the marker's content with the Font Awesome pin icon
                markerElement.innerHTML = ''; 
                markerElement.appendChild(pinIconElement); 
            } else {
                // Reset non-matching markers to default state
                const markerElement = markerData.marker.getElement();
                markerElement.innerHTML = ''; 
                markerElement.style.zIndex = ''; 
            }
        } else {
            console.warn("Invalid markerData or missing genus:", markerData);
        }
    });
}

// Function to reset marker to default style
function resetMarkerStyle(markerData) {
    if (markerData && markerData.marker) {
        const markerElement = markerData.marker.getElement();
        if (markerElement) {
            markerElement.innerHTML = ''; // Clear any custom content
            const defaultIconElement = document.createElement('i');
            defaultIconElement.classList.add('fas', 'fa-map-marker-alt'); 
            defaultIconElement.style.color = 'blue'; 
            defaultIconElement.style.fontSize = '40px'; 
            defaultIconElement.style.backgroundColor = 'white';
            defaultIconElement.style.borderRadius = '90%';  
            defaultIconElement.style.height = '25px';  
            defaultIconElement.style.width = '25px'; 
            markerElement.appendChild(defaultIconElement);
        }
    }
}

// Event listener to reset markers when input is cleared
document.getElementById('weevil-search').addEventListener('input', (event) => {
    const searchType = document.getElementById('search-type').value; // Get current search type

    if (event.target.value.trim() === '' && searchType === 'search-keyword') {
        markers.forEach(resetMarkerStyle); // Reset markers only for 'search-keyword'
    }
});


// Event listener for marker clicks
markers.forEach(markerData => {
    if (markerData && markerData.marker) {
        markerData.marker.getElement().addEventListener('click', () => {
            console.log(`Marker clicked for genus: ${markerData.genus}`);
            // Add custom behavior here for marker click
        });
    }
});


// Fetch species data and highlight the markers based on search keyword
async function fetchSpeciesDataAndHighlight(keyword) {
    const sanitizedKeyword = sanitizeKeyword(keyword);  // Sanitize the keyword
    console.log("Sanitized Keyword for Highlighting:", sanitizedKeyword);  // Log for debugging

    const suggestionsList = document.getElementById('suggestions-list');
    suggestionsList.innerHTML = '';  // Clear previous suggestions

    if (sanitizedKeyword === '') {
        // Reset all markers to default color when the input is empty
        resetMarkers();
        return;
    }

    try {
        // Filter genus names based on sanitized keyword
        const matchingGenera = Object.keys(genusData).filter(genusKey =>
            genusKey.toLowerCase().includes(sanitizedKeyword)
        );

        // Show suggestions if there are any matching genera
        if (matchingGenera.length > 0) {
            matchingGenera.forEach(genusKey => {
                const genusName = genusKey;

                const li = document.createElement('li');
                const regex = new RegExp(`(${sanitizedKeyword})`, 'gi');
                li.innerHTML = genusName.replace(regex, '<span style="color: red; font-weight: bold;">$1</span>'); // Highlight matching text

                // Add click event for suggestion selection
                li.addEventListener('click', () => {
                    document.getElementById('weevil-search').value = genusName;
                    suggestionsList.style.display = 'none';
                    highlightMarkerByGenus(genusName);
                });

                suggestionsList.appendChild(li);
            });
            suggestionsList.style.display = 'block';  // Show suggestions
        } else {
            suggestionsList.style.display = 'none';  // Hide suggestions if no match
        }
    } catch (error) {
        console.error("Error fetching species data or highlighting markers:", error);
    }
}

// Function to reset all markers to their original positions and icons
function resetMarkers() {
    markers.forEach(markerData => {
        if (markerData && markerData.marker) {
            // Reset the marker position and icon
            markerData.marker.setLngLat(markerData.originalPosition); // Reset position
            markerData.marker.getElement().innerHTML = markerData.originalIcon; // Restore original icon
        }
    });
}

// Event listener for the search input with debounce applied
document.getElementById('weevil-search').addEventListener(
    'input',
    debounce(handleSearchInput, 300) // Debounce delay in milliseconds
);


function zoomToSpeciesLocation(speciesName) {
    const speciesData = speciesMarkers[speciesName];

    if (speciesData && speciesData.location) {
        getCoordinatesFromLocation(speciesData.location).then((coordinates) => {
            if (coordinates) {
                // Move the map to the selected species location
                map.flyTo({
                    center: [coordinates.lon, coordinates.lat],
                    zoom: 10
                });
            }
        });
    } else {
        console.warn(`Species data not found for: ${speciesName}`);
    }
}






// Make map globally accessible
window.map = map; // Ensure the map instance is available globally

// Load weevil names and markers on page load
loadWeevilNames().then(() => {
    console.log("Weevil data loaded successfully.");
});


