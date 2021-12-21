const express = require("express")
const cors = require("cors")
const { join } = require("path")
const listEndpoints = require("express-list-endpoints")
const mongoose = require("mongoose")
const profileRouter = require("./services/profiles/index")
const postsRouter = require("./services/posts")
const commentRouter = require("./services/comments")
const experienceRouter = require("./services/experience")
const jwt = require("jsonwebtoken")
require("dotenv/config")
const {
	notFoundHandler,
	badRequestHandler,
	genericErrorHandler,
} = require("./errorHandlers")

server = express()

const port = process.env.PORT

server.use(express.json())
const staticFolderPath = join(__dirname, "../public")
server.use(express.static(staticFolderPath))

server.use(cors())

server.use("/profile", profileRouter)
server.use("/posts", postsRouter)
server.use("/profile", authenticateToken, experienceRouter)
server.use("/cmnt",commentRouter)

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

server.use(badRequestHandler)
server.use(notFoundHandler)
server.use(genericErrorHandler)
console.log(process.env.MONGO_CONNECTION)
console.log(listEndpoints(server))

mongoose
	.connect(
		process.env.MONGO_CONNECTION ||
			"mongodb+srv://mirelaek:QnZsNvfRobxedmlX@linkedlnapi.fp5m9.mongodb.net/linkedln?retryWrites=true&w=majority",
		{
			useNewUrlParser: true,
			useUnifiedTopology: true,
		}
	)
	.then(
		server.listen(port, () => {
			console.log("Running on port", port)
		})
	)
	.catch((err) => console.log(err))
