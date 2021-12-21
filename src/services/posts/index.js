/**
POST Model:
{
"_id": "5d93ac84b86e220017e76ae1", //server generated
"text": "this is a text 12312 1 3 1", <<--- THIS IS THE ONLY ONE YOU'LL BE SENDING!!!
"username": "admin",
"user": {
"_id": "5d84937322b7b54d848eb41b", //server generated
"name": "Diego",
"surname": "Banovaz",
"email": "diego@strive.school",
"bio": "SW ENG",
"title": "COO @ Strive School",
"area": "Berlin",
"image": ..., //server generated on upload, set a default here
"username": "admin",
"createdAt": "2019-09-20T08:53:07.094Z", //server generated
"updatedAt": "2019-09-20T09:00:46.977Z", //server generated
}
"createdAt": "2019-10-01T19:44:04.496Z", //server generated
"updatedAt": "2019-10-01T19:44:04.496Z", //server generated
"image": ... //server generated on upload, set a default here
}

POSTS:
- GET https://yourapi.herokuapp.com/api/posts/	ok
Retrieve posts
- POST https://yourapi.herokuapp.com/api/posts/	ok
Creates a new post
- GET https://yourapi.herokuapp.com/api/posts/{postId} ok
Retrieves the specified post
- PUT https://yourapi.herokuapp.com/api/posts/{postId}	ok
Edit a given post
- DELETE https://yourapi.herokuapp.com/api/posts/{postId} ok
Removes a post
- POST https://yourapi.herokuapp.com/api/posts/{postId} ok
Add an image to the post under the name of "post"

#EXTRA: Find a way to return also the user with the posts, in order to have the Name / Picture to show it correcly on the frontend ok
*/
require("dotenv").config()
const express = require("express")
const mongoose = require("mongoose")
const q2m = require("query-to-mongo")
const multer = require("multer")
const { CloudinaryStorage } = require("multer-storage-cloudinary")
const { cloudinary } = require("../../utils/cloudinary")
const cloudStorage = new CloudinaryStorage({
	cloudinary: cloudinary,
	params: {
		folder: "linkedin/post",
	},
})

const cloudMulter = multer({ storage: cloudStorage })
const PostSchema = require("./schema")
const profileSchema = require("../profiles/mongo")
const PostRouter = express.Router()
const authenticateToken = require("../../authentication")

PostRouter.post("/", authenticateToken, async (req, res, next) => {
	try {
		console.log("NEW POST")
		const post = { ...req.body, image: "" }
		console.log(post)
		post.userName = req.user.name
		console.log(post.userName)
		post.user = await profileSchema.find(
			{ username: post.userName },
			{ _id: 1 }
		)
		post.user = post.user[0]._id
		console.log(post.user)
		console.log(post)
		const newPost = new PostSchema(post)
		const { _id } = await newPost.save()
		console.log(_id)
		res.status(201).send(_id)
	} catch (error) {
		next(error)
	}
})

PostRouter.get("/", authenticateToken, async (req, res, next) => {
	try {
		const query = q2m(req.query)
		const posts = await PostSchema.find({}).populate("user")
		res.send(posts)
	} catch (error) {
		return next(error)
	}
})

PostRouter.get("/:id", authenticateToken, async (req, res, next) => {
	try {
		const post = await PostSchema.findById(req.params.id)
		if (post) {
			res.send(post)
		} else {
			const error = new Error(`Post with id ${req.params.id} not found`)
			error.httpStatusCode = 404
			next(error)
		}
	} catch (error) {
		return next(error)
	}
})


PostRouter.put("/:id", authenticateToken, async (req, res, next) => {
	try {
		const post = { ...req.body }
		const author = await PostSchema.findById(req.params.id, {
			_id: 0,
			userName: 1,
		})
		if (author.userName !== req.user.name) {
			const error = new Error(
				`User does not own the Post with id ${req.params.id}`
			)
			error.httpStatusCode = 403
			return next(error)
		}
		const newPost = await PostSchema.findByIdAndUpdate(req.params.id, post, {
			runValidators: true,
			new: true,
		})
		if (newPost) {
			res.status(201).send(req.params.id)
		} else {
			const error = new Error(`Post with id ${req.params.id} not found`)
			error.httpStatusCode = 404
			next(error)
		}
	} catch (error) {
		next(error)
	}
})

/**
 * this is for the image upload
 */
PostRouter.post(
	"/:id",
	authenticateToken,
	cloudMulter.single("image"),
	async (req, res, next) => {
		try {
			const post = { imageUrl: req.file.path }
			const author = await PostSchema.findById(req.params.id, {
				_id: 0,
				userName: 1,
			})
			if (author.userName !== req.user.name) {
				const error = new Error(
					`User does not own the Post with id ${req.params.id}`
				)
				error.httpStatusCode = 403
				return next(error)
			}
			console.log(req.body)
			console.log(req.file.buffer)
			console.log("help")
			//res.json({ msg: "image uploaded" })

			const newPost = await PostSchema.findByIdAndUpdate(req.params.id, post, {
				runValidators: true,
				new: true,
			})
			if (newPost) {
				res.status(201).send("immage updated")
			} else {
				const error = new Error(`Post with id ${req.params.id} not found`)
				error.httpStatusCode = 404
				next(error)
			}
		} catch (error) {
			console.log("error", error)
			next(error)
		}
	}
)

PostRouter.delete("/:id", authenticateToken, async (req, res, next) => {
	try {
		const author = await PostSchema.findById(req.params.id, {
			_id: 0,
			userName: 1,
		})
		if (author.userName !== req.user.name) {
			const error = new Error(
				`User does not own the Post with id ${req.params.id}`
			)
			error.httpStatusCode = 403
			return next(error)
		}
		const post = await PostSchema.findByIdAndDelete(req.params.id)
		if (post) {
			res.send("Deleted")
		} else {
			const error = new Error(`Post with id ${req.params.id} not found`)
			error.httpStatusCode = 404
			next(error)
		}
	} catch (error) {
		next(error)
	}
})

module.exports = PostRouter
