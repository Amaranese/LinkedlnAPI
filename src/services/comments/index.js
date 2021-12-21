const express = require("express");
const commentSchema = require("./schema")

const PostSchema = require("../posts/schema")
//const authenticateToken = require("../../authentication")
const router = express.Router();

router.post("/:postId",async (req, res, next) => {
    try {
      const comment = new commentSchema({...req.body})
      const commentToInsert = { ...comment.toObject()}
      
  
      const updated = await PostSchema.findByIdAndUpdate(
        req.params.postId,
        {
          $push: {
            comments: commentToInsert,
          },
        },
        { runValidators: true, new: true }
      )
      
      res.status(201).send(updated)
    } catch (error) {
        console.log(error)
      next(error)
    }
  })
  router.get("/:postId",async (req, res, next) => {

	try {
		const { comments } = await PostSchema.findById(req.params.postId, {
			comments: 1,
			_id: 0,
		})

		res.send(comments)
	} catch (error) {
		console.log(error)
		next(error)
	}
})
module.exports = router;