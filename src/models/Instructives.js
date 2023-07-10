import mongoose from 'mongoose'

const Schema = mongoose.Schema

const clientSchema = new Schema({
    client: { type: Schema.Types.ObjectId, ref: 'enterprises' },
}, {
    versionKey: false
})

const Instructive = mongoose.model('instructives', clientSchema)

export default Instructive