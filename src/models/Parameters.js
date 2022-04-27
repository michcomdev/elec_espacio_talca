import mongoose from 'mongoose'

const Schema = mongoose.Schema

const parametersSchema = new Schema({
    memberNumber: { type: Number, required: true }
}, {
    versionKey: false
})

const Parameters = mongoose.model('parameters', parametersSchema)

export default Parameters