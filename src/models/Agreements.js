import mongoose from 'mongoose'

const Schema = mongoose.Schema

const agreementsSchema = new Schema({
    members: { type: Schema.Types.ObjectId, ref: 'members' },
    services: { type: Schema.Types.ObjectId, ref: 'services' },
    date: { type: Date, default: Date.now() },
    other: { type: String },
    totalAmount: { type: Number },
    dues: [{
        number: { type: Number },
        year: { type: Number },
        month: { type: Number },
        amount: { type: Number },
        invoices: { type: Schema.Types.ObjectId, ref: 'invoices' },
        invoicesIngreso: { type: Schema.Types.ObjectId, ref: 'invoices' }
    }]
}, {
    versionKey: false
})

const Agreements = mongoose.model('agreements', agreementsSchema)

export default Agreements