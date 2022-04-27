import mongoose from 'mongoose'

const Schema = mongoose.Schema

const townsSchema = new Schema({
    name: { type: String, required: true }
}, {
    versionKey: false
})

const Towns = mongoose.model('towns', townsSchema)

export default Towns