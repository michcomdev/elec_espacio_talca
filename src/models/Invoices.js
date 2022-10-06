import mongoose from 'mongoose'

const Schema = mongoose.Schema

const invoicesSchema = new Schema({
    lectures: { type: Schema.Types.ObjectId, ref: 'lectures' },
    members: { type: Schema.Types.ObjectId, ref: 'members' },
    date: { type: Date, default: Date.now() },
    dateExpire: { type: Date, default: Date.now() },
    charge: { type: Number },
    lectureActual: { type: Number },
    lectureLast: { type: Number },
    lectureNewStart: { type: Number },
    lectureNewEnd: { type: Number },
    lectureResult: { type: Number },
    meterValue: { type: Number },
    subsidyPercentage: { type: Number },
    subsidyValue: { type: Number },
    consumption: { type: Number },
    consumptionLimit: { type: Number },
    consumptionLimitValue: { type: Number },
    consumptionLimitTotal: { type: Number },
    invoiceDebt: { type: Number },
    invoicePaid: { type: Number },
    invoiceTotal: { type: Number },
    services: [{
        services: { type: Schema.Types.ObjectId, ref: 'services' },
        value: { type: Number }
    }],
    typeInvoice: { type: String }, //Para los casos de boleta "ingreso"
    /*Add Payment Data*/
    /*Add Invoice data: number - type */
    //DTE data
    type: { type: Number },
    number: { type: Number },
    seal: { type: String },
    token: { type: String },
    annulment: {
        type: { type: Number },
        number: { type: Number },
        seal: { type: String },
        token: { type: String },
        resolution: { 
            fecha: {type: String },
            numero: {type: Number }
        }
    }
}, {
    versionKey: false
})

const Invoices = mongoose.model('invoices', invoicesSchema)

export default Invoices