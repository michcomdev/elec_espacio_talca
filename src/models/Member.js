import mongoose from 'mongoose'

const Schema = mongoose.Schema

const memberSchema = new Schema({
    number: { type: Number },
    rut: { type: String },
    type: { type: String },
    personal: {
        name: { type: String },
        lastname1: { type: String },
        lastname2: { type: String }
    },
    enterprise: {
        name: { type: String },
        fullName: { type: String },
        category: { type: String },
        address: { type: String }
    },
    address: {
        address: { type: String },
        sector: { type: Schema.Types.ObjectId, ref: 'sectors' }
    },
    waterMeters: [{
        /*waterMeter: { type: Schema.Types.ObjectId, ref: 'watermeters' },*/
        number: { type: Number },
        diameter: { type: String },
        state: { type: String },
        dateStart: { type: Date },
        dateEnd: { type: Date }
    }],
    subsidyNumber: { type: Number },
    subsidies: [{
        /*subsidy: { type: Schema.Types.ObjectId, ref: 'subsidies' },*/
        rut: { type: String },
        name: { type: String },
        lastname1: { type: String },
        lastname2: { type: String },
        houseQuantity: { type: Number },
        type: { type: Number },
        decreeNumber: { type: Number },
        decreeDate: { type: Date },
        inscriptionDate: { type: Date },
        inscriptionScore: { type: Number },
        startDate: { type: Date },
        endDate: { type: Date },
        percentage: { type: Number },
        status: { type: String }
    }],
    email: { type: String },
    phone: { type: String },
    dateStart: { type: Date },
    dateEnd: { type: Date },
    status: { type: String },
    inactiveObservation: { type: String },
    services: [{
        services: { type: Schema.Types.ObjectId, ref: 'services' },
        value: { type: Number }
    }],
}, {
    versionKey: false
})

const Member = mongoose.model('members', memberSchema)

export default Member