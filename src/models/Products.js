import mongoose from 'mongoose'

const Schema = mongoose.Schema

const productsSchema = new Schema({
    name: { type: String, required: true },
    image: { type: String },
    stock: { type: Number, required: true },
    status: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, required: true },
    purchases: [{
        date: { type: Date, default: Date.now() },
        cost: { type: Number, required: true },
        quantity: { type: Number, required: true }
    }]
}, {
    versionKey: false
})

const Products = mongoose.model('products', productsSchema)

export default Products