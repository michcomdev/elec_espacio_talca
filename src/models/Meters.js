import mongoose from 'mongoose'

const Schema = mongoose.Schema

const metersSchema = new Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    clients: { type: Schema.Types.ObjectId, ref: 'clients' },
    serialNumber: { type: Number }
}, {
    versionKey: false
})

const Meters = mongoose.model('meters', metersSchema)

export default Meters