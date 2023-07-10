import mongoose from 'mongoose'

const Schema = mongoose.Schema

const clientSchema = new Schema({
    type: { type: String, required: true }
}, {
    versionKey: false
})

const Type = mongoose.model('types', clientSchema)

export default Type