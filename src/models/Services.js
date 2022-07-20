import mongoose from 'mongoose'

const Schema = mongoose.Schema

const servicesSchema = new Schema({
    name: { type: String, required: true },
    type: { type: String, required: true },
    status: { type: String, required: true },
    value: { type: Number, required: true },
    description: { type: String, required: true }
}, {
    versionKey: false
})

const Services = mongoose.model('services', servicesSchema)

export default Services