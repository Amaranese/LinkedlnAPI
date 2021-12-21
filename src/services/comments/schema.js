const { Schema, model } = require("mongoose")
mongoosePaginate = require("mongoose-paginate-v2")
const commentSchema = new Schema(
	{
		name: {
			type: Object,
			required: true,
		},
		comment: {
			type: String,
			required: true,
			unique: true,
		},
	},
	{ timestamps: true }
)
commentSchema.plugin(mongoosePaginate)
module.exports = model("Comments", commentSchema)
