import mongoose from 'mongoose'

const Schema = mongoose.Schema

const lecturesSchema = new Schema({
    month: { type: Number},
    year: { type: Number},
    member: { type: Schema.Types.ObjectId, ref: 'members' },
    logs: [{
        users: { type: Schema.Types.ObjectId, ref: 'users' },
        date: { type: Date, default: Date.now() },
        lecture: { type: Number }
    }]
}, {
    versionKey: false
})

const Lectures = mongoose.model('lectures', lecturesSchema)

export default Lectures