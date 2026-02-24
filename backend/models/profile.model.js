import mongoose from "mongoose";

const educationSchema = new mongoose.Schema({
    
    school: {
        type: String,
        required: true,
    },
    degree: {
        type: String,
        required: true,
    },
    fieldOfStudy: {
        type: String,
        default: "",
    },
    year: {
        type: String,
        default: "",
    }
    
});

const workSchema = new mongoose.Schema({
    company: {
        type: String,
        required: true,
    },
    position: {
        type: String,
        required: true, 
    },
    year:{
        type: String,
        required: true,
        default:""
    },

});
 const profileSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required:true,
    },
    bio:{
        type:String,
        default:"",
    },
    location:{
        type:String,
        default:"",
    },
    currentPost:{
        type:String,
        default:"",
    },
    pastWork:{
        type:[workSchema],
        default:[],
    },
    education:{
        type:[educationSchema],
        default:[],

    }

 }, {
    timestamps: true
 });

 const Profile=mongoose.model("Profile",profileSchema);
    export default Profile;
