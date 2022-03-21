import mongoose from 'mongoose'

const Schema = mongoose.Schema

const clientSchema = new Schema({
    rut:  {type: String, required: true },
    name: { type: String, required: true },
    phone: { type: String },
    email: { type: String, required: true },
    status: { type: String, required: true },
    // password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now()},
}, {
    versionKey: false
})

const Client = mongoose.model('Clients', clientSchema)

export default Client