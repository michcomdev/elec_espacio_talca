import mongoose from 'mongoose'

const Schema = mongoose.Schema

const clientsSchema = new Schema({
    name: { type: String, required: true },
    lastname: { type: String, required: true },
    rut: { type: String, required: true },
    phoneNumber: { type: String, required: true }
}, {
    versionKey: false
})

const Clients = mongoose.model('clients', clientsSchema)

export default Clients