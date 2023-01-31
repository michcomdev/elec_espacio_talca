import mongoose from 'mongoose'

const Schema = mongoose.Schema

const paymentsSchema = new Schema({
    members: { type: Schema.Types.ObjectId, ref: 'members' },
    date: { type: Date, default: Date.now() },
    paymentMethod: { type: String },
    transaction: { type: String },
    amount: { type: Number },
    invoices: [{
        invoices: { type: Schema.Types.ObjectId, ref: 'invoices' },
        amount: { type: Number },
        positive: { type: Boolean }
    }]
}, {
    versionKey: false
})

const Payments = mongoose.model('payments', paymentsSchema)

export default Payments