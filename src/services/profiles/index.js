/**
PROFILES:
- GET https://yourapi.herokuapp.com/api/profile/
Retrieves list of profiles
- GET https://yourapi.herokuapp.com/api/profile/{userId}
Retrieves the profile with userId = {userId}
- POST https://yourapi.herokuapp.com/api/profile/
Create the user profile with all his details
- PUT https://yourapi.herokuapp.com/api/profile/
Update current user profile details
- POST https://yourapi.herokuapp.com/api/profile/{userId}/picture
Replace user profile picture (name = profile)
- GET https://yourapi.herokuapp.com/api/profile/{userId}/CV
Generates and download a PDF with the CV of the user (details, picture, experiences)
*/

const express = require("express")
const jwt = require("jsonwebtoken")
const profileSchema = require("./mongo")
const multer = require("multer")
const { CloudinaryStorage } = require("multer-storage-cloudinary")
const { cloudinary } = require("../../utils/cloudinary")
const cors = require("cors")
const cloudStorage = new CloudinaryStorage({
	cloudinary: cloudinary,
	params: {
		folder: "linkedln",
	},
})
const cloudMulter = multer({ storage: cloudStorage })
const puppeteer = require("puppeteer")
const fs = require("fs-extra")
const router = express.Router()
require("dotenv/config")

function authenticateToken(req, res, next) {
	const authHeader = req.headers["authorization"]
	const token = authHeader && authHeader.split(" ")[1]
	if (token == null) return res.sendStatus(401)

	jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
		if (err) return res.sendStatus(403)
		req.user = user
		next()
	})
}
router.get("/", authenticateToken, async (req, res, next) => {
	try {
		const profiles = await profileSchema.find()
		res.send(profiles)
	} catch (error) {
		next(error)
	}
})

router.get("/me", authenticateToken, async (req, res, next) => {
	try {
		const profiles = await profileSchema.find()
		const resp = res.json(
			profiles.filter((profile) => profile.username === req.user.name)[0]
		)
		res.send(resp)
	} catch (error) {
		next(error)
	}
})
router.post("/", async (req, res, next) => {
	try {
		const postProfile = new profileSchema({
			...req.body,
			username: req.body.email,
			experiences: [],
		})
		const { _id } = await postProfile.save()
		const username = req.body.email //req.body.username
		console.log("username", username)
		const user = { name: username }
		const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET)
		res.json({ accessToken: accessToken })
		res.status(201).send(_id)
	} catch (error) {
		next(error)
	}
})

router.get("/cv/:id", cors(), async (req, res, next) => {
	try {
		const profile = await profileSchema.findById(req.params.id)
		const browser = await puppeteer.launch({
			args: ["--no-sandbox", "--disable-setuid-sandbox",'--disable-web-security'],
		})
		let experiences = ""
		profile.experiences.forEach((experience) => {
			experiences += `
			<div class="card bg-light my-1">
			<h4 class="card-title">${experience.role}</h4>
			<div class="card-body pl-1">
			  
			  <p class="card-text"><b>for</b> <u>${experience.company}</u> <b>in</b> ${
				experience.area
			}</p>
			  <p class="card-text"><b>from </b>${experience.startDate} <b>to </b>${
				experience.endDate || "[still employed]"
			} </p>
				<h6><b>Main mansions</b></h6>
				<p class="card-text">${experience.description}</p>
			</div>
		  </div>`
		})
		const page = await browser.newPage()

		await page.setContent(`<!DOCTYPE html>
		<html lang="en">
			<head>
				<!-- Required meta tags -->
				<meta charset="utf-8" />
				
		
				<!-- Bootstrap CSS -->
				<link
					href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta1/dist/css/bootstrap.min.css"
					rel="stylesheet"
					integrity="sha384-giJF6kkoqNQ00vy+HMDP7azOuL0xtbfIcaT9wjKHr8RbDVddVHyTfAAsrekwKmP1"
					crossorigin="anonymous"
				/>
				<!-- Optional JavaScript; choose one of the two! -->
		
				<!-- Option 1: Bootstrap Bundle with Popper -->
				<script
					src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta1/dist/js/bootstrap.bundle.min.js"
					integrity="sha384-ygbV9kiqUc6oa4msXn9868pTtWMgiQaeYH7/t7LECLbyPA2x65Kgf80OJFdroafW"
					crossorigin="anonymous"
				></script>
		
				<title>Curriculum</title>
			</head>
			<body>
					<h4 style="color: steelblue">
						___Powered by Linkedln_____________________________________________
					</h4>
					<div class="jumbotron bg-light p-2 m-4 rounded-5">
						<h1 class="display-6">
							${profile.name} ${profile.surname} ${profile.title}
						</h1>
						<span class="m-5"><b>Email: </b>${profile.email}</span>
						<div class="d-flex flex-row">	
								<div class="">
									<img src="${profile.image}" width="200" height="250" />
								</div>
								<div class="p-4">
									<p class="lead">
										<span class=""><b>Location: </b>${profile.area}</span>
										<span class=""
											><h4
												style="
													color: steelblue;
													text-decoration: underline;
													font-weight: bold;
													font-family: Arial, Helvetica, sans-serif;
												"
											>
												ABOUT ME
											</h4>
											<p class="m-3 mt-0">${profile.bio}</p>
										</span>
									</p>
								</div>
						</div>
						<hr class="my-4" />
					</div>
					<h4
						style="
							margin-left:2rem;
							color: steelblue;
							text-decoration: underline;
							font-weight: bold;
							font-family: Arial, Helvetica, sans-serif;
						"
					>
						EXPERIENCE
					</h4>
					<div style="margin-left:2rem;margin-right:2rem;">
					${experiences}
					</div>
					
			</body>
		</html>
		`)
		await page.emulateMediaFeatures("screen")

		const pdf = await page.pdf({
			format: "A4",
			printBackground: true,
		})
		console.log("done")
		res.contentType("application/pdf")
		res.send(pdf)
	} catch (error) {
		console.log(error)
	}
})
router.get("/:id", authenticateToken, async (req, res, next) => {
	try {
		const profile = await profileSchema.findById(req.params.id)
		res.send(profile)
	} catch (error) {
		next(error)
	}
})
//comment here
router.post(
	"/upload/:id",
	authenticateToken,
	cloudMulter.single("image"),
	async (req, res, next) => {
		try {
			const image = { image: req.file.path }
			const profile = await profileSchema.findById(req.params.id, {
				_id: 0,
				username: 1,
			})
			if (profile.username !== req.user.name) {
				const error = new Error(
					`User does not own the Post with id ${req.params.id}`
				)
				error.httpStatusCode = 403
				return next(error)
			}
			const newImg = await profileSchema.findByIdAndUpdate(
				req.params.id,
				image,
				{
					runValidators: true,
					new: true,
				}
			)
			if (newImg) {
				res.status(201).send("image uploaded")
			} else {
				const error = new Error(`Profile with id ${req.params.id} not found`)
				error.httpStatusCode = 404
				next(error)
			}
		} catch (error) {
			console.log("error", error)
			next(error)
		}
	}
)
router.get("/:id", authenticateToken, async (req, res, next) => {
	try {
		const profile = await profileSchema.findById(req.params.id)
		res.send(profile)
	} catch (error) {
		next(error)
	}
})

router.put("/:id", authenticateToken, async (req, res, next) => {
	try {
		const post = { ...req.body }
		const author = await profileSchema.findById(req.params.id, {
			_id: 0,
			username: 1,
		})
		if (author.username !== req.user.name) {
			const error = new Error(
				`Please do not try to change profile with ${req.params.id}`
			)
			error.httpStatusCode = 403
			return next(error)
		}
		const profile = await profileSchema.findByIdAndUpdate(req.params.id, post, {
			runValidators: true,
			new: true,
		})
		if (profile) {
			res.send(profile)
		} else {
			const err = new Error("Profile not found")
			err.httpStatusCode = 404
			next(error)
		}
	} catch (error) {
		next(error)
	}
})
router.delete("/:id", authenticateToken, async (req, res, next) => {
	try {
		const author = await profileSchema.findById(req.params.id, {
			_id: 0,
			username: 1,
		})
		if (author.username !== req.user.name) {
			const error = new Error(
				`Please do not try to delete profile with ${req.params.id}`
			)
			error.httpStatusCode = 403
			return next(error)
		}
		const profile = await profileSchema.findByIdAndDelete(req.params.id)
		if (profile) {
			res.send("deleted")
		} else {
			const error = new Error(`Profile with ${req.params.id} is not found`)
			error.httpStatusCode = 404
			next(error)
		}
	} catch (error) {
		next(error)
	}
})
module.exports = router
