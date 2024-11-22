const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const {listingSchema , reviewSchema}= require("../schema.js");
const Listing = require("../models/listing.js");
const {isLoggedIn, isOwner, validateListing} = require("../middleware.js");
const passport = require("passport");

const listingController = require("../controllers/listings.js");
const multer  = require('multer');
const {storage}=require("../cloudConfig.js")  
const upload = multer({ storage });  //will store files in storage i.e Cloudinary storage


//INDEX ROUTE and Create Route
router.route("/")
     .get(wrapAsync(listingController.index))
     .post(isLoggedIn,upload.single('listing[image]'),validateListing,
      wrapAsync(listingController.createListing));

//NEW ROUTE
router.get("/new",isLoggedIn,listingController.renderNewForm);  //this should be always above the routes containing id as if it is not so then consider "new" as a id

//Route for Search
router.get('/search', wrapAsync(async(req, res) => {
    const { query } = req.query; // Extract the query parameter
    if (!query) {
        req.flash('error', 'Please enter a search term!');
        return res.redirect('/listings');
    }
    // Perform case-insensitive search on the title or description
    const listings = await Listing.find({
        $or: [
            { title: new RegExp(query, 'i') }, 
            { description: new RegExp(query, 'i') },
            { category: new RegExp(query, 'i') },
        ]
    });
    res.render('listings/searchResult.ejs', { listings, query }); // Render search results
}));


//SHOW ROUTE and Update Route and Delete Route
router.route("/:id")
    .get(wrapAsync(listingController.showListing))
    .put(isLoggedIn, isOwner,upload.single('listing[image]'), validateListing , wrapAsync(listingController.updateListing))
    .delete(isLoggedIn,isOwner,wrapAsync(listingController.destroyListing));
    

//EDIT ROUTE
router.get("/:id/edit",isLoggedIn ,isOwner,wrapAsync(listingController.renderEditForm));




module.exports = router;