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
    sewerage: { type: Number },
    fine: { type: Number },
    invoiceSubTotal: { type: Number },
    invoiceDebt: { type: Number },
    invoicePositive: { type: Number },
    debtFine: { type: Number },
    invoicePaid: { type: Number },
    invoiceTotal: { type: Number },
    services: [{
        services: { type: Schema.Types.ObjectId, ref: 'services' },
        other: { type: String },
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
    resolution: {
        fecha: {type: String },
        numero: {type: Number }
    },
    annulment: {
        type: { type: Number },
        number: { type: Number },
        seal: { type: String },
        token: { type: String },
        date: { type: Date },
        resolution: {
            fecha: {type: String },
            numero: {type: Number }
        }
    },
    agreements: [{ //A resolver, se debe identificar si se registrará acá además de la cuota del convenio
        agreements: { type: String },
        text: { type: String },
        number: { type: Number },
        dueLength: { type: Number },
        amount: { type: Number }
    }],
    text1: { type: String },
    text2: { type: String },
    text3: { type: String }
}, {
    versionKey: false
})

const Invoices = mongoose.model('invoices', invoicesSchema)

export default Invoices