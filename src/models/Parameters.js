import mongoose from 'mongoose'

const Schema = mongoose.Schema

const parametersSchema = new Schema({
    memberNumber: { type: Number, required: true },
    consumptionLimit: { type: Number },
    subsidyLimit: { type: Number },
    meterValue: { type: Number },
    charge: { type: Number },
    email: { type: String },
    phone: { type: String },
    committee: {
        rut: { type: String },
        name: { type: String },
        category: { type: String },
        acteco: { type: String },
        address: { type: String },
        commune: { type: String },
        phone: { type: String },
        siiCode: { type: String }
    },
    municipality: {
        subsidyCode: { type: Number },
        code: { type: Number }
    },
    apikey: { type: String }
}, {
    versionKey: false
})

const Parameters = mongoose.model('parameters', parametersSchema)

export default Parameters