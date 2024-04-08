const express = require('express');
const https = require('https');
const mongoose = require('mongoose');
const TripImage = require('./models/TripImage'); // reference to the js file script for the MongoDB
const app = express();
const port = 3000; // server port
let imagesGenerated = false; // Flag to check if images have been generated

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/tripImagesDB')
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Error connecting to MongoDB:', err));

// set access to my client to send API request
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// API request for data about Ireland country took from out resource
app.get('/countryData', (req, res) => {
    const options = {
        hostname: 'restcountries.com',
        port: 443,
        path: '/v3.1/alpha/irl?fields=name,capital,population,area,languages,currencies',
        method: 'GET'
    };

    const request = https.request(options, response => {
        let data = '';
        response.on('data', chunk => {
            data += chunk;
        });

        response.on('end', () => {
            try {
                const jsonData = JSON.parse(data);
                const countryName = jsonData.name.common;
                const capital = jsonData.capital[0];
                const population = jsonData.population;
                const area = jsonData.area;
                const languages = Object.values(jsonData.languages).join(', ');
                const currency = jsonData.currencies.EUR.name;

                const countryData = {
                    countryName,
                    capital,
                    population,
                    area,
                    languages,
                    currency
                };

                res.json(countryData);
            } catch (error) {
                console.error('Error parsing country data as JSON:', error);
                res.status(500).json({ error: 'Failed to parse country data' });
            }
        });
    });

    request.on('error', error => {
        console.error('Error fetching country data:', error);
        res.status(500).json({ error: 'Failed to fetch country data' });
    });

    request.end();
});

// API request about Trip data that written below by your trip type
app.get('/tripData/:tripType', (req, res) => {
    const tripType = req.params.tripType;
    const destinations = fetchDestinations(tripType);
    res.json(destinations);
});

function fetchDestinations(tripType) {
    switch (tripType) {
        case 'ByFoot':
            return [
                { name: 'Trinity College Dublin', lat: 53.343270, lng: -6.254400, info: 'Trinity College Dublin is Ireland\'s oldest university.' },
                { name: 'Dublin Castle', lat: 53.343600, lng: -6.266700, info: 'Dublin Castle is a historic landmark and government complex.' },
                { name: 'Grafton Street', lat: 53.343700, lng: -6.259600, info: 'Grafton Street is one of Dublin\'s premier shopping streets.' },
                { name: 'St. Stephen\'s Green', lat: 53.337200, lng: -6.259100, info: 'St. Stephen\'s Green is a large public park in Dublin city center.' }
            ];
        case 'ByBike':
            return [
                { name: 'Cliffs of Moher', lat: 52.9719, lng: -9.4245, info: 'The Cliffs of Moher are sea cliffs located in County Clare.' },
                { name: 'Gap of Dunloe', lat: 52.0170, lng: -9.5842, info: 'The Gap of Dunloe is a scenic mountain pass in County Kerry.' },
                { name: 'Connemara National Park', lat: 53.5537, lng: -9.9036, info: 'Connemara National Park is located in County Galway.' },
                { name: 'Ring of Kerry', lat: 51.9995, lng: -9.7428, info: 'The Ring of Kerry is a scenic drive around the Iveragh Peninsula in County Kerry.' }
            ];
        case 'ByCar':
            return [
                { name: 'The Giant\'s Causeway', lat: 55.2406, lng: -6.5111, info: 'The Giant\'s Causeway is an area of about 40,000 interlocking basalt columns located in County Antrim.' },
                { name: 'Blarney Castle', lat: 51.9291, lng: -8.5705, info: 'Blarney Castle is a medieval stronghold in Blarney, near Cork.' },
                { name: 'Rock of Cashel', lat: 52.5219, lng: -7.8909, info: 'The Rock of Cashel is a historic site located at Cashel, County Tipperary.' },
                { name: 'Kylemore Abbey', lat: 53.5606, lng: -9.8892, info: 'Kylemore Abbey is a Benedictine monastery founded in 1920 on the grounds of Kylemore Castle, in Connemara, County Galway.' }
            ];
        default:
            return [];
    }
}

async function generateTripImage(tripType) {
    //success or failed result based on the operation
    return new Promise((resolve, reject) => {
        const requestData = JSON.stringify({
            prompt: `The best trip in Ireland ${tripType}`,
            params: {
                cfg_scale: 7.5,
                denoising_strength: 0.75,
                seed: "312912",
                height: 512,
                width: 512,
                seed_variation: 1,
                steps: 10
            }
        });
        // hordeAI configuration request for send post request to get the image ID
        const options = {
            hostname: 'stablehorde.net',
            port: 443,
            path: '/api/v2/generate/async',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'accept': 'application/json',
                'apikey': '0000000000',
                'Client-Agent': 'unknown:0:unknown',
                'Content-Length': requestData.length
            }
        };
//send request , get image ID response then check status of image creation
        const req = https.request(options, response => {
            let data = '';
            response.on('data', chunk => {
                data += chunk;
            });
            response.on('end', () => {
                const responseData = JSON.parse(data);
                const imageId = responseData.id;
                console.log("tripType ",tripType + " - " + imageId);
                checkImageStatus(imageId, tripType, resolve, reject);
            });
        });

        req.on('error', error => {
            console.error('Error generating trip image:', error);
            reject(error);
        });

        req.write(requestData);
        req.end();
    });
}
// send GET request to check if the image is created send the message only after get image ID 
function checkImageStatus(imageId, tripType, resolve, reject) {
    const options = {
        hostname: 'stablehorde.net',
        port: 443,
        path: `/api/v2/generate/status/${imageId}`,
        method: 'GET',
        headers: {
            'accept': 'application/json',
            'Client-Agent': 'unknown:0:unknown'
        }
    };

    const req = https.request(options, response => {
        let data = '';
        response.on('data', chunk => {
            data += chunk;
        });
        response.on('end', async () => {
            const statusData = JSON.parse(data);
            if (statusData.done && statusData.generations && statusData.generations.length > 0) {
                const imageUrl = statusData.generations[0].img;
                console.log("Generated image URL:", imageUrl);
                if (imageUrl) {
                    try {
                        const savedImage = await downloadAndSaveImage(tripType, imageUrl);
                        resolve(savedImage);
                    } catch (error) {
                        console.error('Error downloading and saving image:', error);
                        reject(error);
                    }
                } else {
                    setTimeout(() => {
                        checkImageStatus(imageId, tripType, resolve, reject);
                    }, 5000);
                }
            } else {
                setTimeout(() => {
                    checkImageStatus(imageId, tripType, resolve, reject);
                }, 5000);
            }
        });
    });

    req.on('error', error => {
        console.error('Error checking image status:', error);
        reject(error);
    });

    req.end();
}

// download the image and save it in the DB based on his type Foot/Bike/Car
async function downloadAndSaveImage(tripType, imageUrl) {
    const imageFileName = `${tripType}_${Date.now()}.jpg`;

    // Download image file as binary data
    const imageBinaryData = await downloadImage(imageUrl);

    // Save binary image data to MongoDB
    const tripImage = new TripImage({
        tripType: tripType,
        image: {
            data: imageBinaryData,
            contentType: 'image/jpeg'
        }
    });
    await tripImage.save();

    return tripImage;
}

function downloadImage(imageUrl) {
    return new Promise((resolve, reject) => {
        https.get(imageUrl, response => {
            let imageData = Buffer.from([]);
            response.on('data', chunk => {
                imageData = Buffer.concat([imageData, chunk]);
            });
            response.on('end', () => {
                resolve(imageData);
            });
        }).on('error', error => {
            console.error('Error downloading image:', error);
            reject(error);
        });
    });
}

// Check if trip images are present in the database
async function checkTripImagesInDB() {
    const tripImages = await TripImage.find();
    return tripImages.length > 0;
}

// Generate trip images if not present in the database
async function generateTripImagesIfNotPresent() {
    console.log("Generate images if not exists in DB");
    const tripImagesExist = await checkTripImagesInDB();
    if (!tripImagesExist) {
        try {
            console.log("Trip images are not exists");
            const footImageUrl = await generateTripImage('foot');
            const bikeImageUrl = await generateTripImage('bike');
            const carImageUrl = await generateTripImage('car');
            console.log("Trip images generated successfully");
            imagesGenerated = true;
        } catch (error) {
            console.error('Error generating trip images:', error);
        }
    }
}

// Add a new route to api request get images
app.get('/tripImages/:tripType', async (req, res) => {
    const tripType = req.params.tripType;
    try {
        // Query the database for the image data based on trip type
        const tripImage = await TripImage.findOne({ tripType });

        if (!tripImage) {
            return res.status(404).json({ error: 'Image not found' });
        }

        // Send the image data back to the client
        res.set('Content-Type', tripImage.contentType);
        res.send(tripImage.image.data);

    } catch (error) {
        console.error('Error fetching image:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Run the function to generate trip images when the server starts
generateTripImagesIfNotPresent();

app.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`);
});
