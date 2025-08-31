/* Run this file when maps does not show up for the already created listings */

require("dotenv").config();

//imports
const mongoose = require("mongoose");
const Listing = require("./models/listing");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const geocoder = mbxGeocoding({ accessToken: process.env.MAP_TOKEN });

// updateList function
async function updatedListings() {
  await mongoose.connect("mongodb://127.0.0.1:27017/wanderlust"); // mongodb server connection

  const listings = await Listing.find({
    "geometry.coordinates": { $size: 0 },
  }); // fetches empty coordinates
  console.log(`Found ${listings.length} listings to update`);

  // main logic -- loops through each listing and calls MapBox api for these listings
  for (listing of listings) {
    const geoData = await geocoder
      .forwardGeocode({
        query: listing.location,
        limit: 1,
      })
      .send();

    if (geoData.body.features.length > 0) {
      listing.geometry = geoData.body.features[0].geometry;
      await listing.save();
      console.log(`Updated: ${listing.title}`);
    } else {
      console.log(`Not Updated: ${listing.title}`);
    }
  }
}

updatedListings();
