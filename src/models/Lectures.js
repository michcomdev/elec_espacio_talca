import mongoose from 'mongoose'

const Schema = mongoose.Schema

const lectureSchema = new Schema({
    meters: { type: Schema.Types.ObjectId, ref: 'meters' },
    year: { type: Number, required: true },
    month: { type: Number, required: true },
    lectures: [{     
        date: { type: Date, default: Date.now },
        value: { type: Number, required: true }
    }]
}, {
    versionKey: false
})

const Lectures = mongoose.model('lectures', lectureSchema)

export default Lectures