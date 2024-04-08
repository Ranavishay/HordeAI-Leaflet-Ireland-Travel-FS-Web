var map = null;
var userLocationMarker = null;
var destinations = [];
var flag = 0;

function initializeMap(zoomLevel) {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
        console.error('Map container not found');
        return;
    }

    map = L.map(mapContainer).setView([53.349805, -6.26031], zoomLevel); // Set Dublin Capital to be the center when Map is load

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
    }).addTo(map);

    if (flag == 0) {
        showAlert('You can click on your location to mark it on the map!');
        flag = 1;
    }
    map.on('click', function(e) {
        if (userLocationMarker) {
            map.removeLayer(userLocationMarker);
        }
        userLocationMarker = L.marker(e.latlng).addTo(map).bindPopup('Your Location');
        drawRoutes();
    });
}

function showAlert(message, duration = 3000) {
    const alertElement = document.createElement('div');
    alertElement.textContent = message;
    alertElement.classList.add('alert');
    map.getContainer().appendChild(alertElement); // Append to map container

    setTimeout(() => {
        alertElement.classList.add('hide');
        setTimeout(() => {
            alertElement.remove();
        }, 300); 
    }, duration); // Remove after duration
}

function addRoutingControl(profile) {
    fetchTripData(profile);
}

let destinationsSet = new Set();
let destinationsAppended = false; // Initialize destinationsAppended variable


function fetchTripData(profile) {
    if (!destinationsAppended) { // Check if destinations have not been appended
        fetch(`http://localhost:3000/tripData/${profile}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Trip data not found');
                }
                return response.json();
            })
            .then(data => {
                if (!map) {
                    initializeMap(getInitialZoomLevel(profile)); // Initialize map with appropriate zoom level
                }

                data.forEach(destination => {
                    if (!destinationsSet.has(destination.name)) { // Check if destination is not already in the Set
                        destinationsSet.add(destination.name); // Add destination name to the Set
                        destinations.push(destination); // Add destination to the array

                        L.marker([destination.lat, destination.lng])
                            .addTo(map)
                            .bindPopup(destination.name + ": " + destination.info) // Added destination information
                            .on('click', function() {
                                if (userLocationMarker) {
                                    drawRoutes();
                                }
                            });

                        // Add destination to sidebar
                        const sidebar = document.getElementById('sidebar');
                        const destinationItem = document.createElement('div');
                        destinationItem.textContent = destination.name;
                        destinationItem.classList.add('destination-item');
                        destinationItem.addEventListener('click', function() {
                            map.setView([destination.lat, destination.lng], 13);
                        });
                        sidebar.appendChild(destinationItem);
                    }
                });

                destinationsAppended = true; // Set flag to true after all destinations finished
            })
            .catch(error => {
                console.error('Error fetching trip data:', error);
            });
    }
}

function fetchCountryData() {
    const countryDataText = document.getElementById('countryData');
    if (!countryDataText) {
        return; 
    }

    fetch('http://localhost:3000/countryData')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch country data');
            }
            return response.json();
        })
        .then(data => {
            const countryName = data.countryName;
            const capital = data.capital;
            const population = data.population;
            const area = data.area;
            const languages = data.languages;
            const currency = data.currency;

            const countryDataString = `Country Name: ${countryName}\nCapital: ${capital}\nPopulation: ${population}\nArea: ${area}\nLanguages: ${languages}\nCurrency: ${currency}`;
            countryDataText.innerText = countryDataString;
        })
        .catch(error => {
            console.error('Error fetching country data:', error);
        });
}

document.addEventListener('DOMContentLoaded', function() { // When the initial HTML document has been completely loaded
    fetchCountryData(); // Always fetch country data on page load

    // If the page is not index.html
    if (document.getElementById('map')) {
        const tripType = window.location.pathname.split('.')[0].replace("/", ""); // Get the trip type from the URL
        addRoutingControl(tripType);
    }
});

// Call fetchTripImages function when the page loads
fetchTripImages();


// Function to fetch trip images once available
async function fetchTripImages() {
    try {
        const tripTypes = ['foot', 'bike', 'car'];
        const imageUrls = [];

        for (const tripType of tripTypes) {
            const response = await fetch(`http://localhost:3000/tripImages/${tripType}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${tripType} trip image`);
            }
            const blob = await response.blob(); // Convert response to BLOb
            const imageUrl = URL.createObjectURL(blob); 
            imageUrls.push(imageUrl); // Add imageUrl to the array
        }

        displayImages(imageUrls);
    } catch (error) {
        console.error('Error fetching or displaying trip images:', error);
    }
}


// Function to display the fetched image
function displayImages(imageUrls) {
    const imagesContainer = document.getElementById('images-container');
    if (imagesContainer) {
    imagesContainer.innerHTML = ''; 

    // Loop each image URL and create an <img> element for display it under thee container
    imageUrls.forEach(url => {
        const imgElement = document.createElement('img');
        imgElement.src = url;
        imagesContainer.appendChild(imgElement);
        });
    }
}


function drawRoutes() {
    if (!userLocationMarker || !destinations || destinations.length === 0) return;

    // Clear existing routes
    map.eachLayer(function(layer) {
        if (layer instanceof L.Polyline) {
            map.removeLayer(layer);
        }
    });

    // Draw lines from user's location to destinations based on there distance
    const sortedDestinations = destinations.slice().sort((a, b) => {
        const distanceToA = userLocationMarker.getLatLng().distanceTo([a.lat, a.lng]);
        const distanceToB = userLocationMarker.getLatLng().distanceTo([b.lat, b.lng]);
        return distanceToA - distanceToB;
    });

    let prevLatLng = userLocationMarker.getLatLng();
    sortedDestinations.forEach(destination => {
        const destinationLatLng = L.latLng(destination.lat, destination.lng);
        L.polyline([prevLatLng, destinationLatLng], { color: 'green' }).addTo(map);
        prevLatLng = destinationLatLng;
    });
}

function getInitialZoomLevel(profile) {
    switch (profile) {
        case 'ByFoot':
            return 13; // Zoom level for foot routes
        case 'ByBike':
            return 6; // Zoom level for bike routes
        case 'ByCar':
            return 6; // Zoom level for car routes
        default:
            return 13; // otherwise
    }
}
