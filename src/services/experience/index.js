// EXPERIENCE:
// - GET https://yourapi.herokuapp.com/api/profile/userName/experiences
// Get user experiences
// - POST https://yourapi.herokuapp.com/api/profile/userName/experiences
// Create an experience.
// - GET https://yourapi.herokuapp.com/api/profile/userName/experiences/:expId
// Get a specific experience
// - PUT https://yourapi.herokuapp.com/api/profile/userName/experiences/:expId
// Get a specific experience
// - DELETE https://yourapi.herokuapp.com/api/profile/userName/experiences/:expId
// Get a specific experience
// - POST https://yourapi.herokuapp.com/api/profile/userName/experiences/:expId/picture
// Change the experience picture
// - POST https://yourapi.herokuapp.com/api/profile/userName/experiences/CSV
// Download the experiences as a CSV

const express = require("express")
const experienceSchema = require("./schema")

const profileSchema = require("../profiles/mongo")
const mongoose = require("mongoose")
const multer = require("multer")

const { CloudinaryStorage } = require("multer-storage-cloudinary")
const {cloudinary} = require("../../utils/cloudinary")

const { Parser } = require('json2csv');
const authenticateToken = require("../../authentication")


const cloudStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
      folder: "linkedin"
  }
 })
const cloudMulter =  multer({ storage: cloudStorage})


const router = express.Router();


router.post("/:uid/experience", authenticateToken,async (req, res, next) => {
    try {
   
      const author = await profileSchema.findById(req.params.uid, {
        _id: 0,
        username: 1,
      })
      
      if (author.username !== req.user.name) {
        const error = new Error(
          `Please do not try to change experience with ${req.params.uid}`
        )
        error.httpStatusCode = 403
        return next(error)
      }
      const experience = new experienceSchema({...req.body, image:"",username:req.user.name})
      const experienceToInsert = { ...experience.toObject()}
      
  
      const updated = await profileSchema.findByIdAndUpdate(
        req.params.uid,
        {
          $push: {
            experiences: experienceToInsert,
          },
        },
        { runValidators: true, new: true }
      )
      
      res.status(201).send(updated.experiences[updated.experiences.length-1])
    } catch (error) {
        console.log(error)
      next(error)
    }
  })
  
router.get("/:uid/experience", authenticateToken,async (req, res, next) => {
    try {
       
      const {experiences }= await profileSchema.findById(req.params.uid, {
        experiences: 1,
        _id: 0,
      } )

      res.send(experiences)
    } catch (error) {
      console.log(error)
      next(error)
    }
  })


router.get("/:uid/experience/:expId",authenticateToken, async (req, res, next) => {
    try {
      const {experiences} = await profileSchema.findOne(
        {
          _id: mongoose.Types.ObjectId(req.params.uid),
        },
        {
          _id: 0,
        experiences: {
            $elemMatch: { _id: mongoose.Types.ObjectId(req.params.expId) },
          },
        }
      )
  
      if (experiences && experiences.length > 0) {
        res.send(experiences[0])

      } else {
        const err = new Error("Profile or experience not found");
        err.httpStatusCode = 404;
        next(error);
      }
    } catch (error) {
      console.log(error)
      next(error)
    }
  })
  
router.delete("/:uid/experience/:expId", authenticateToken,async (req, res, next) => {
    try {
      const author = await profileSchema.findById(req.params.uid, {
        _id: 0,
        username: 1,
      })
      if (author.username !== req.user.name) {
        const error = new Error(
          `Please do not try to change experience with ${req.params.uid}`
        )
        error.httpStatusCode = 403
        return next(error)
      }
      const modifiedexperience = await profileSchema.findByIdAndUpdate(
        req.params.uid,
        {
          $pull: {
            experiences: { _id: mongoose.Types.ObjectId(req.params.expId) },
          },
        },
        {
          new: true,
        }
      )
      res.send(modifiedexperience)
    } catch (error) {
      console.log(error)
      next(error)
    }
  })
  
router.put("/:uid/experience/:expId", authenticateToken, async (req, res, next) => {
    try {
      const author = await profileSchema.findById(req.params.uid, {
        _id: 0,
        username: 1,
      })
      
      if (author.username !== req.user.name) {
        const error = new Error(
          `Please do not try to change experience with ${req.params.uid}`
        )
        error.httpStatusCode = 403
        return next(error)
      }
      const { experiences} = await profileSchema.findOne(
        {
          _id: mongoose.Types.ObjectId(req.params.uid),
        },
        {
          _id: 0,
          experiences: {
            $elemMatch: { _id: mongoose.Types.ObjectId(req.params.expId) },
          },
        }
      )
     
  
      if (experiences && experiences.length > 0) {
     

        const experienceToReplace = { ...experiences[0].toObject(), ...req.body }

  
        const modifiedexperience = await profileSchema.findOneAndUpdate(
          {
            _id: mongoose.Types.ObjectId(req.params.uid),
           "experiences._id": mongoose.Types.ObjectId(req.params.expId),
          },
          { $set: { "experiences.$":experienceToReplace }},
          {
            runValidators: true,
            new: true,
          }
        )
        res.send(experienceToReplace)
      } else {
        const err = new Error("Profile or experience not found");
        err.httpStatusCode = 404;
        next(error);
      }
    } catch (error) {
      console.log(error)
      next(error)
    }
  })

router.post("/:uid/experience/:expId/picture", 
cloudMulter.single("image"),authenticateToken,  async (req, res, next) =>{
  console.log("req file",req.file.path)

  try{
    const author = await profileSchema.findById(req.params.uid, {
      _id: 0,
      username: 1,
    })
    console.log(author.username)
    if (author.username !== req.user.name) {

      const error = new Error(
        `Please do not try to change experience with ${req.params.uid}`
      )
      error.httpStatusCode = 403
      return next(error)
    }
   
    const { experiences} = await profileSchema.findOne(
      {
        _id: mongoose.Types.ObjectId(req.params.uid),
      },
      {
        _id: 0,
        experiences: {
          $elemMatch: { _id: mongoose.Types.ObjectId(req.params.expId) },
        },
      }
    )
  

    if (experiences && experiences.length > 0) {
   

      const experienceToReplace = { ...experiences[0].toObject(), image:req.file.path }
    
        const modifiedexperience = await profileSchema.findOneAndUpdate(
          {
            _id: mongoose.Types.ObjectId(req.params.uid),
            "experiences._id": mongoose.Types.ObjectId(req.params.expId),
          },
          { $set:{"experiences.$":experienceToReplace } },
          {
            runValidators: true,
            new: true,
          }
        )
        res.status(201).send(modifiedexperience)
      } else {
        const err = new Error("Profile or experience not found");
        err.httpStatusCode = 404;
        next(error);
      }
  
        }
  catch(ex){
      console.log(ex)
      next(ex)
  }
})

router.get("/:uid/ex/csv",authenticateToken,async (req, res, next) => {
  try {
    const {experiences }= await profileSchema.findById(req.params.uid, {
      experiences: 1,
      _id: 0,
    } )
    console.log(experiences)

  const fields= ['_id', 'role', 'company', 'startDate','endDate','description','area','username','image']
const json2csvParser = new Parser({fields});
  const csv = json2csvParser.parse(experiences);
  
console.log(csv);

res.setHeader("Content-Disposition", "attachment; filename=export.csv")
res.set("Content-Type", "text/csv")
res.status(200).send(csv)

 
  } catch (error) {
    console.log(error)
    next(error)
  }
 })
  
module.exports = router;
