import mongoose from 'mongoose'

const Schema = mongoose.Schema

const servicesSchema = new Schema({
    name: { type: String, required: true },
    type: { type: String, required: true },
    invoice: { type: String, required: true },
    value: { type: Number },
    status: { type: String, required: true },
    description: { type: String }
}, {
    versionKey: false
})

const Services = mongoose.model('services', servicesSchema)

export default Services