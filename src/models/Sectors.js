import mongoose from 'mongoose'

const Schema = mongoose.Schema

const sectorsSchema = new Schema({
    name: { type: String, required: true }
}, {
    versionKey: false
})

const Sectors = mongoose.model('sectors', sectorsSchema)

export default Sectors