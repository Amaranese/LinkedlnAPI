const { Schema, model } = require("mongoose")
const mongoose = require("mongoose")
const mongoosePaginate = require("mongoose-paginate-v2")


// EXPERIENCE Model:
// {
// "_id": "5d925e677360c41e0046d1f5", //server generated
// "role": "CTO",
// "company": "Strive School",
// "startDate": "2019-06-16T22:00:00.000Z",
// "endDate": "2019-06-16T22:00:00.000Z", //could be null
// "description": "Doing stuff here and there",
// "area": "Berlin",
// "username": "admin",
// "createdAt": "2019-09-30T19:58:31.019Z", //server generated
// "updatedAt": "2019-09-30T19:58:31.019Z", //server generated
// "image": ... //server generated on upload, set a default here
// }

const ExperienceSchema  = new Schema (
    {
        role:{
            type:String,
            required:true
        },
        company:{
            type:String,
            required:true
        },
        startDate:{
            type:String,
            required:true
        },
        endDate:{
            type:String
        },
        description:{
            type:String,
            required:true
        },
        area:{
            type:String,
            required:true
        },
        username: {
            type:String,
            required:true
        },
        image:{
            type:String
        }

    },
    {
        timestamps:true
    }

)


ExperienceSchema.plugin(mongoosePaginate)
module.exports = mongoose.model("Experience", ExperienceSchema)
