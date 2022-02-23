import mongoose from 'mongoose'

const Schema = mongoose.Schema

const salesSchema = new Schema({
    date: { type: Date, default: Date.now() },
    rut: { type: String },
    name: { type: String },
    address: { type: String },
    status: { type: String },
    net: { type: Number },
    iva: { type: Number },
    total: { type: Number },
    payment: { type: String },
    paymentVoucher: { type: String },
    products: [{
        products: { type: Schema.Types.ObjectId, ref: 'products' },
        quantity: { type: Number },
        value: { type: Number }
    }],
    services: [{
        services: { type: Schema.Types.ObjectId, ref: 'services' },
        quantity: { type: Number },
        value: { type: Number }
    }]

}, {
    versionKey: false
})

const Sales = mongoose.model('sales', salesSchema)

export default Sales