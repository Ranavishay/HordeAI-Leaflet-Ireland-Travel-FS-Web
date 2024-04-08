# HordeAI-Leaflet-Ireland-Travel-FS-Web
Welcome to HordeAI-Leaflet Ireland Travel FS Web, a Full-Stack Web Application that combines the power of HordeAI for image generation and Leaflet for interactive mapping to help you explore travel destinations in Ireland.

## Overview
This project leverages HordeAI's image generation capabilities to create stunning visual representations of travel destinations across Ireland. With Leaflet integration, users can interactively explore these destinations on a map, making trip planning and exploration more engaging and informative.


## Features
Dynamic Image Generation: Utilizes HordeAI to dynamically generate images for various travel destinations in Ireland based on user-selected trip types (foot, bike, car).
Interactive Mapping: Integrates Leaflet mapping functionality to provide users with an interactive map interface for exploring destinations and planning routes.
Trip Data API: Provides an API endpoint to fetch data about travel destinations in Ireland, including information such as name, location, and description.
Country Data Retrieval: Fetches data about Ireland from an external API, including details like capital, population, area, languages, and currency.

## Technologies Used

- **Express.js**: Backend framework for handling server logic and API endpoints.
- **MongoDB**: NoSQL database for storing trip images and other application data.
- **HordeAI**: Artificial intelligence platform for image generation.
- **Leaflet**: JavaScript library for interactive maps.
- **HTML/CSS/JavaScript**: Frontend development technologies for user interface and interaction.
- **Node.js**: JavaScript runtime for server-side development.


## Getting Started
### Prerequisites

#### Before running this project, ensure you have the following installed:

##### Node.js

##### MongoDB

## Installation
```
# Clone the repository
git clone <repository-url>

# Navigate to the backend directory
cd <repository-name>/backend

# Install backend dependencies
npm install

# Navigate to the frontend directory
cd ../frontend

# Install frontend dependencies
npm install
```

### Database Setup

Ensure MongoDB is running on your local machine( I run it as Docker image ).

Create a new MongoDB database named tripImagesDB.

## Running the Application
```
# Start the backend server:
cd ../backend
npm start
```
```
# Start the frontend development server:
cd ../frontend
npm start
```
Open your browser and navigate to the frontend port in my case http://localhost:8080 to view the application.

# Usage
- **Upon accessing the application, you'll be able to see a map showing various destinations in Ireland based on different trip types (By Foot, By Bike, By Car).**
- **Click on your location on the map to mark it.**
- **Select a trip type from the sidebar to view destinations and routes.**
- **You can also view trip images generated by HordeAI in the index.html .**
- **The backend server provides APIs for fetching country data and trip data and save the images in the mongoDB if they are not stored there.**

# License
This project is licensed under the MIT License.

