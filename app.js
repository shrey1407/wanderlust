if(process.env.NODE_ENV != "production"){
    require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose  = require("mongoose");
//const Listing = require("./models/listing.js");
const path = require("path");
const ejsMate = require("ejs-mate");
const  methodOverride = require("method-override");
//const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
//const {listingSchema , reviewSchema}= require("./schema.js");  //For error handling
const Review = require("./models/review.js");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const MongoStore = require('connect-mongo');  //mongo session store

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

//const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const dbUrl = process.env.ATLASDB_URL;

main().then(()=>{
    console.log("Connected to MongoDB");
}).catch((err)=>{
    console.log(err);
});

async function main(){
    await mongoose.connect(dbUrl);
    // await mongoose.connect(MONGO_URL);
}

app.set("view engine","ejs");
app.set("views", path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname,"/public")));

app.engine('ejs', ejsMate); //ejs-mate


const store = MongoStore.create({
    mongoUrl : dbUrl,
    crypto : {
  //      secret : "mysupersecretcode" 
         secret : process.env.SECRET ,
    },
    touchAfter : 24 * 3600, // 24 hours as here we have gave in seconds
});

store.on("error", ()=>{
    console.log("Error in MONGO SESSION STORE",err);
});

const sessionOptions = {
    store,                           // line to be written only when using mongostore
    secret: "mysupersecretcode",
    resave: false,
    saveUninitialized: true,
    cookie :  {
        expires : Date.now() + 7*24*60*60*1000,
        maxAge: 7*24*60*60*1000,
        httpOnly : true,
    }
}



app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currentUser = req.user;
    next();
});



// app.get("/demouser", async(req,res)=>{
//     let fakeUser = new User ({
//         email:"student@gmail.com",
//         username: "delta-student",
//     });
//     let registeredUser = await User.register(fakeUser, "helloworld");
//     res.send(registeredUser);
// });


app.use("/listings", listingRouter);
app.use("/listings/:id/reviews",reviewRouter);
app.use("/", userRouter);

app.get("/privacy", (req,res)=>{
    res.render("miscellaneous/privacy.ejs");
});
app.get("/terms", (req,res)=>{
    res.render("miscellaneous/terms.ejs");
});



// app.get("/testListing", async (req,res)=>{
//     let sampleListing = new Listing({
//         title: "My New Villa",
//         description: "By the beach",
//         price: 1200,
//         location: "Calangute, Goa",
//         country: "India",
//     });
//    await sampleListing.save();
//    console.log("sample was saved");
//    res.send("successful testing");
// });

app.all("*", (req,res,next)=>{
    next(new ExpressError(404,"Page Not Found!"));
})

app.use((err,req,res,next) => {
    let {statusCode=500 , message="Something went wrong!"}=err;
    res.status(statusCode).render("error.ejs", {err});
})

app.listen(8080,()=>{
    console.log("Server is listening to the port 8080");
});
