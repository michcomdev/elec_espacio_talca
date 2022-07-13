import Member from '../../../models/Member'
import Sectors from '../../../models/Sectors'
import Lectures from '../../../models/Lectures'
import Invoices from '../../../models/Invoices'
import Joi from 'joi'
import dotEnv from 'dotenv'

dotEnv.config()

export default [
    {
        method: 'GET',
        path: '/api/mobile/members',
        options: {
            auth: 'jwt',
            description: 'get all members data',
            notes: 'return all data from members',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let members = await Member.find().lean()
                    return members
                } catch (error) {
                    console.log(error)

                    return h.response({
                        error: 'Internal Server Error'
                    }).code(500)
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/api/mobile/memberSingle',
        options: {
            auth: 'jwt',
            description: 'get one member',
            notes: 'get one member',
            tags: ['api'],
            handler: async (request, h) => {
                try {

                    let payload = request.payload

                    let query = {
                        number: payload.number
                    }

                    let member = await Member.find(query).lean()

                    if (member.length == 0) {
                        return 'Socio no registrado'
                    }

                    let memberData = member[0]

                    return memberData

                } catch (error) {
                    console.log(error)

                    return h.response({
                        error: 'Internal Server Error'
                    }).code(500)
                }
            },
            validate: {
                payload: Joi.object().keys({
                    number: Joi.number()
                })
            }
        }
    },
    {
        method: 'POST',
        path: '/api/mobile/memberSingleByWatermeter',
        options: {
            auth: 'jwt',
            description: 'get one member',
            notes: 'get one member',
            tags: ['api'],
            handler: async (request, h) => {
                try {

                    let payload = request.payload

                    let query = {
                        waterMeters: {
                            $elemMatch: {
                                number: payload.number,
                                state: 'Activo'
                            }
                        }
                    }

                    let member = await Member.find(query).lean()

                    if (member.length == 0) {
                        return 'Medidor no registrado'
                    }

                    let memberData = member[0]

                    return memberData

                } catch (error) {
                    console.log(error)

                    return h.response({
                        error: 'Internal Server Error'
                    }).code(500)
                }
            },
            validate: {
                payload: Joi.object().keys({
                    number: Joi.number()
                })
            }
        }
    },
    {
        method: 'GET',
        path: '/api/mobile/sectors',
        options: {
            auth: 'jwt',
            description: 'get all sectors data',
            notes: 'return all data from sectors',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let sectors = await Sectors.find().lean()

                    for (let i = 0; i < sectors.length; i++) {
                        let query = { 'address.sector': sectors[i]._id }

                        let members = await Member.find(query).lean()


                        sectors[i].members = members
                    }

                    return sectors
                } catch (error) {
                    console.log(error)

                    return h.response({
                        error: 'Internal Server Error'
                    }).code(500)
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/api/mobile/lecturesMember',
        options: {
            auth: 'jwt',
            description: 'get all lectures from single member',
            notes: 'get all lectures from single member',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload
                    let query = {
                        members: payload.member
                    }

                    let lectures = await Lectures.find(query).sort({ 'year': 'descending', 'month': 'descending' }).lean()
                    /*let invoices = await Invoices.find(query).sort({'date' : 'descending'}).lean().populate(['lectures'])

                    for(let i=0;i<lectures.length;i++){
                        lectures[i].invoice = invoices.find(x => x.lectures._id.toString() === lectures[i]._id.toString())
                    }*/
                    console.log(lectures);
                    return lectures

                } catch (error) {
                    console.log(error)

                    return h.response({
                        error: 'Internal Server Error'
                    }).code(500)
                }
            },
            validate: {
                payload: Joi.object().keys({
                    member: Joi.string()
                })
            }
        }
    }
]