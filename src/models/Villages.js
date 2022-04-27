import mongoose from 'mongoose'

const Schema = mongoose.Schema

const villagesSchema = new Schema({
    name: { type: String, required: true }
}, {
    versionKey: false
})

const Villages = mongoose.model('villages', villagesSchema)

export default Villages