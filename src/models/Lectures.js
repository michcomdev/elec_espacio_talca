import mongoose from 'mongoose'

const Schema = mongoose.Schema

const lecturesSchema = new Schema({
    users: { type: Schema.Types.ObjectId, ref: 'users' },
    date: { type: Date, default: Date.now() },
    member: { type: Schema.Types.ObjectId, ref: 'members' },
    lecture: { type: Number }
}, {
    versionKey: false
})

const Lectures = mongoose.model('lectures', lecturesSchema)

export default Lectures