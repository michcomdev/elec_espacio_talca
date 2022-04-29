import mongoose from 'mongoose'

const Schema = mongoose.Schema

const invoicesSchema = new Schema({
    lectures: { type: Schema.Types.ObjectId, ref: 'lectures' },
    member: { type: Schema.Types.ObjectId, ref: 'members' },
    date: { type: Date, default: Date.now() },
    charge: { type: Number },
    lectureActual: { type: Number },
    lectureLast: { type: Number },
    lectureResult: { type: Number },
    meterValue: { type: Number },
    subsidyPercentage: { type: Number },
    subsidyValue: { type: Number },
    consumption: { type: Number },
    invoiceDebt: { type: Number },
    invoiceTotal: { type: Number },
    number: { type: Number }
    /*Add Extra Services*/
    /*Add Payment Data*/
    /*Add Invoice data: number - type */
}, {
    versionKey: false
})

const Invoices = mongoose.model('invoices', invoicesSchema)

export default Invoices