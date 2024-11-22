const { required } = require('joi');
const mongoose =  require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose'); //It will define username and passpword automatically in schema so we dont need to define them in our userSChema

const userSchema = new Schema({
    email:{
        type:String,
        required:true,
    },
});

userSchema.plugin(passportLocalMongoose); //Implements username,salting, hashing and hashed passwords

module.exports = mongoose.model("User", userSchema);