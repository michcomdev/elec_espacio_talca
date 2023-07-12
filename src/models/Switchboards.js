import mongoose from 'mongoose'

const Schema = mongoose.Schema

const switchboardSchema = new Schema({
    name: { type: String, required: true },
    ip_address: { type: String, required: true },
    token: { type: String, required: true },
    meters: [             
        { type: Schema.Types.ObjectId, ref: 'meters' }
    ]
}, {
    versionKey: false
})

const Switchboards = mongoose.model('switchboards', switchboardSchema)

export default Switchboards