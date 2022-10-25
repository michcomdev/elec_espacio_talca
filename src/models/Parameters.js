import mongoose from 'mongoose'

const Schema = mongoose.Schema

const parametersSchema = new Schema({
    memberNumber: { type: Number, required: true },
    consumptionLimit: { type: Number },
    subsidyLimit: { type: Number },
    meterValue: { type: Number },
    meterValueB: { type: Number },
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
    expireDay: { type: Number },
    apikey: { type: String },
    emisor: {
        RUTEmisor: { type: String },
        RznSoc: { type: String },
        RznSocEmisor: { type: String },
        GiroEmis: { type: String },
        Acteco: { type: String },
        DirOrigen: { type: String },
        CmnaOrigen: { type: String },
        Telefono: { type: String },
        CdgSIISucur: { type: String }
    },
    fees: {
        percentageDebt: { type: Number },
        percentageIrregular: { type: Number },
        reunion: { type: Number },
        vote: { type: Number }
    },
    text1: { type: String },
    text2: { type: String },
    text3: { type: String }
}, {
    versionKey: false
})

const Parameters = mongoose.model('parameters', parametersSchema)

export default Parameters