import mongoose from 'mongoose'

const Schema = mongoose.Schema

const clientSchema = new Schema({
    rut:  {type: String, required: true },
    fantasyName: { type: String, required: true },
    name: { type: String, required: true },
    address: { type: String, required: true },
    types: { type: Schema.Types.ObjectId, ref: 'types' },
    phone: { type: String },
    email: { type: String, required: true },
    representRUT: { type: String, required: true },
    representName: { type: String, required: true },
    status: { type: String, required: true },
}, {
    versionKey: false
})

const Enterprise = mongoose.model('enterprises', clientSchema)

export default Enterprise