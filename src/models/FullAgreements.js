import mongoose from 'mongoose'

const Schema = mongoose.Schema

const fullAgreementsSchema = new Schema({
    /*services: { type: Schema.Types.ObjectId, ref: 'services' },
    date: { type: Date, default: Date.now() },*/
    other: { type: String }
    /*totalAmount: { type: Number },
    dues: [{
        number: { type: Number },
        year: { type: Number },
        month: { type: Number },
        amount: { type: Number },
        invoices: { type: Schema.Types.ObjectId, ref: 'invoices' },
        invoicesIngreso: { type: Schema.Types.ObjectId, ref: 'invoices' }
    }],
    members: [{type: Schema.Types.ObjectId, ref: 'members'}]*/
}, {
    versionKey: false
})

const FullAgreements = mongoose.model('fullAgreements', fullAgreementsSchema)

export default FullAgreements