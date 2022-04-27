import mongoose from 'mongoose'

const Schema = mongoose.Schema

const memberSchema = new Schema({
    number: { type: Number },
    rut: { type: String },
    type: { type: String },
    personal: {
        name: { type: String },
        lastname1: { type: String },
        lastname2: { type: String }
    },
    enterprise: {
        name: { type: String },
        fullName: { type: String },
        category: { type: String },
        address: { type: String }
    },
    address: {
        address: { type: String },
        sector: { type: Schema.Types.ObjectId, ref: 'sectors' },
        village: { type: Schema.Types.ObjectId, ref: 'villages' },
        town: { type: Schema.Types.ObjectId, ref: 'towns' }
    },
    waterMeters: {
        waterMeter: { type: Schema.Types.ObjectId, ref: 'watermeters' },
    },
    subsidies: {
        subsidy: { type: Schema.Types.ObjectId, ref: 'subsidies' },
    },
    email: { type: String },
    phone: { type: String },
    dateStart: { type: Date },
    dateEnd: { type: Date }
}, {
    versionKey: false
})

const Member = mongoose.model('members', memberSchema)

export default Member