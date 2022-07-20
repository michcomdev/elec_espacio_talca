import mongoose from 'mongoose'

const Schema = mongoose.Schema

const tractorSchema = new Schema({
    brand: { type: String },
    model: { type: String },
    color: { type: String },
    plate: { type: String },
    photo: { type: String }
}, {
    versionKey: false
})

const Tractor = mongoose.model('tractors', tractorSchema)

export default Tractor