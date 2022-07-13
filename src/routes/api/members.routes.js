import Member from '../../models/Member'
import Parameters from '../../models/Parameters'
import Joi from 'joi'
import dotEnv from 'dotenv'

dotEnv.config()

export default [
    /*{
        method: 'GET',
        path: '/api/members',
        options: {
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
    },*/    
    {
        method: 'POST',
        path: '/api/members',
        options: {
            description: 'get one member',
            notes: 'get one member',
            tags: ['api'],
            handler: async (request, h) => {
                try {

                    let payload = request.payload   
                    let query = {}
                    if(payload.sector!=0){
                        query = {
                            'address.sector': payload.sector
                        }
                    }

                    let members = await Member.find(query).populate(['address.sector'])
                    return members
                                        
                } catch (error) {
                    console.log(error)

                    return h.response({
                        error: 'Internal Server Error'
                    }).code(500)
                }
            },
            validate: {
                payload: Joi.object().keys({
                    sector: Joi.string()
                })
            }
        }
    },
    {
        method: 'POST',
        path: '/api/memberSingle',
        options: {
            description: 'get one member',
            notes: 'get one member',
            tags: ['api'],
            handler: async (request, h) => {
                try {

                    let payload = request.payload   
                    let member = await Member.findById(payload.id)
                    return member

                } catch (error) {
                    console.log(error)

                    return h.response({
                        error: 'Internal Server Error'
                    }).code(500)
                }
            },
            validate: {
                payload: Joi.object().keys({
                    id: Joi.string()
                })
            }
        }
    },
    {
        method: 'POST',
        path: '/api/memberSave',
        options: {
            description: 'create member',
            notes: 'create member',
            tags: ['api'],
            handler: async (request, h) => {
                try {

                    let payload = request.payload   

                    let members = await Member.find({rut: payload.rut})

                    if(members.length>0){
                        return 'created'
                    }

                    let address = {
                        address: payload.address.address
                    }

                    if(payload.address.sector!=0){
                        address.sector = payload.address.sector
                    }

                    console.log(address)

                    let parameters = await Parameters.findById('6263033665a0afa3096a6a62')
                    let number = parameters.memberNumber

                    let member = new Member({
                        number: number,
                        rut: payload.rut,
                        type: payload.type,
                        personal: {
                            name: payload.personal.name,
                            lastname1: payload.personal.lastname1,
                            lastname2: payload.personal.lastname2
                        },
                        enterprise: {
                            name: payload.enterprise.name,
                            fullName: payload.enterprise.fullName,
                            category: payload.enterprise.category,
                            address: payload.enterprise.address
                        },
                        waterMeters: payload.waterMeters,
                        address: address,
                        //FALTA WATERMETER & SUBSIDIES
                        email: payload.email,
                        phone: payload.phone,
                        dateStart: payload.dateStart,
                        dateEnd: payload.dateEnd,
                        status: 'active',
                        inactiveObservation: ''
                    })

                    const response = await member.save()

                    parameters.memberNumber++
                    await parameters.save()

                    return response

                } catch (error) {
                    console.log(error)

                    return h.response({
                        error: 'Internal Server Error'
                    }).code(500)
                }
            },
            validate: {
                payload: Joi.object().keys({
                    id: Joi.string().optional().allow(''),
                    number: Joi.number().optional().allow(0),
                    rut: Joi.string().optional().allow(''),
                    type: Joi.string().optional().allow(''),
                    personal: Joi.object().keys({
                        name: Joi.string().optional().allow(''),
                        lastname1: Joi.string().optional().allow(''),
                        lastname2: Joi.string().optional().allow('')
                    }),
                    enterprise: Joi.object().keys({
                        name: Joi.string().optional().allow(''),
                        fullName: Joi.string().optional().allow(''),
                        category: Joi.string().optional().allow(''),
                        address: Joi.string().optional().allow('')
                    }),
                    address: Joi.object().keys({
                        address: Joi.string().optional().allow(''),
                        sector: Joi.string().optional().allow('')
                    }),
                    waterMeters: Joi.array().items(Joi.object().keys({
                        number: Joi.string().optional().allow(''),
                        diameter: Joi.string().optional().allow(''),
                        state: Joi.string().optional().allow(''),
                        dateStart: Joi.string().optional().allow('')
                    })),
                    email: Joi.string().optional().allow(''),
                    phone: Joi.string().optional().allow(''),
                    dateStart: Joi.string().optional().allow(''),
                    dateEnd: Joi.string().optional().allow('')
                })
            }
        }
    },
    {
        method: 'POST',
        path: '/api/memberUpdate',
        options: {
            description: 'modify member',
            notes: 'modify member',
            tags: ['api'],
            handler: async (request, h) => {
                try {

                    let payload = request.payload

                    let members = await Member.find({
                        _id: { $ne: payload.id },
                        rut: payload.rut
                    })
                    if(members.length>0){
                        return 'created'
                    }

                    let member = await Member.findById(payload.id)

                    member.rut = payload.rut
                    member.type = payload.type
                    member.personal = {
                        name: payload.personal.name,
                        lastname1: payload.personal.lastname1,
                        lastname2: payload.personal.lastname2
                    }
                    member.enterprise = {
                        name: payload.enterprise.name,
                        fullName: payload.enterprise.fullName,
                        category: payload.enterprise.category,
                        address: payload.enterprise.address
                    }


                    let address = {
                        address: payload.address.address
                    }

                    if(payload.address.sector!=0){
                        address.sector = payload.address.sector
                    }
                    member.waterMeters = payload.waterMeters

                    member.address = address
                    //FALTA WATERMETER & SUBSIDIES
                    member.subsidyNumber = payload.subsidyNumber
                    member.email = payload.email
                    member.phone = payload.phone
                    member.dateStart = payload.dateStart
                    member.dateEnd = payload.dateEnd
                    member.status = payload.status
                    member.inactiveObservation = payload.inactiveObservation

                    const response = await member.save()

                    return response

                } catch (error) {
                    console.log(error)

                    return h.response({
                        error: 'Internal Server Error'
                    }).code(500)
                }
            },
            validate: {
                payload: Joi.object().keys({
                    id: Joi.string().optional().allow(''),
                    number: Joi.number().optional().allow(0),
                    rut: Joi.string().optional().allow(''),
                    type: Joi.string().optional().allow(''),
                    personal: Joi.object().keys({
                        name: Joi.string().optional().allow(''),
                        lastname1: Joi.string().optional().allow(''),
                        lastname2: Joi.string().optional().allow('')
                    }),
                    enterprise: Joi.object().keys({
                        name: Joi.string().optional().allow(''),
                        fullName: Joi.string().optional().allow(''),
                        category: Joi.string().optional().allow(''),
                        address: Joi.string().optional().allow('')
                    }),
                    address: Joi.object().keys({
                        address: Joi.string().optional().allow(''),
                        sector: Joi.string().optional().allow('')
                    }),
                    waterMeters: Joi.array().items(Joi.object().keys({
                        number: Joi.string().optional().allow(''),
                        diameter: Joi.string().optional().allow(''),
                        state: Joi.string().optional().allow(''),
                        dateStart: Joi.string().optional().allow('')
                    })),
                    email: Joi.string().optional().allow(''),
                    phone: Joi.string().optional().allow(''),
                    dateStart: Joi.string().optional().allow(''),
                    dateEnd: Joi.string().optional().allow(''),
                    status: Joi.string().optional().allow(''),
                    inactiveObservation: Joi.string().optional().allow(''),
                    subsidyNumber: Joi.number().optional().allow(0)
                })
            }
        }
    },    
    {
        method: 'POST',
        path: '/api/subsidySave',
        options: {
            description: 'create subsidy',
            notes: 'create subsidy',
            tags: ['api'],
            handler: async (request, h) => {
                try {

                    let payload = request.payload   

                    let member = await Member.findById(payload.member)

                    member.subsidies.push({
                        decreeNumber: payload.decreeNumber,
                        decreeDate: payload.decreeDate,
                        inscriptionDate: payload.inscriptionDate,
                        startDate: payload.startDate,
                        endDate: payload.endDate,
                        percentage: payload.percentage
                    })

                    const response = await member.save()

                    return response

                } catch (error) {
                    console.log(error)

                    return h.response({
                        error: 'Internal Server Error'
                    }).code(500)
                }
            },
            validate: {
                payload: Joi.object().keys({
                    member: Joi.string().optional().allow(''),
                    decreeNumber: Joi.number().optional().allow(0),
                    decreeDate: Joi.string().optional().allow(''),
                    inscriptionDate: Joi.string().optional().allow(''),
                    startDate: Joi.string().optional().allow(''),
                    endDate: Joi.string().optional().allow(''),
                    percentage: Joi.number().optional().allow(0)
                })
            }
        }
    },
    {
        method: 'POST',
        path: '/api/subsidyUpdate',
        options: {
            description: 'update subsidy',
            notes: 'update subsidy',
            tags: ['api'],
            handler: async (request, h) => {
                try {

                    let payload = request.payload   
                    let member = await Member.findById(payload.member)

                    for(let i=0; i<member.subsidies.length; i++){
                        console.log(member.subsidies[i]._id,payload.id)
                        if(member.subsidies[i]._id.toString()==payload.id){
                            member.subsidies[i].decreeNumber = payload.decreeNumber
                            member.subsidies[i].decreeDate = payload.decreeDate
                            member.subsidies[i].inscriptionDate = payload.inscriptionDate
                            member.subsidies[i].startDate = payload.startDate
                            member.subsidies[i].endDate = payload.endDate
                            member.subsidies[i].percentage = payload.percentage
                        }
                    }

                    const response = await member.save()

                    return response

                } catch (error) {
                    console.log(error)

                    return h.response({
                        error: 'Internal Server Error'
                    }).code(500)
                }
            },
            validate: {
                payload: Joi.object().keys({
                    member: Joi.string().optional().allow(''),
                    id: Joi.string().optional().allow(''),
                    decreeNumber: Joi.number().optional().allow(0),
                    decreeDate: Joi.string().optional().allow(''),
                    inscriptionDate: Joi.string().optional().allow(''),
                    startDate: Joi.string().optional().allow(''),
                    endDate: Joi.string().optional().allow(''),
                    percentage: Joi.number().optional().allow(0)
                })
            }
        }
    },
    {
        method: 'POST',
        path: '/api/subsidyDelete',
        options: {
            description: 'delete subsidy',
            notes: 'delete subsidy',
            tags: ['api'],
            handler: async (request, h) => {
                try {

                    let payload = request.payload   
                    let member = await Member.findById(payload.member)

                    for(let i=0; i<member.subsidies.length; i++){
                        if(member.subsidies[i]._id.toString()==payload.id){
                            member.subsidies.splice(i, 1)
                        }
                    }

                    const response = await member.save()

                    return response

                } catch (error) {
                    console.log(error)

                    return h.response({
                        error: 'Internal Server Error'
                    }).code(500)
                }
            },
            validate: {
                payload: Joi.object().keys({
                    member: Joi.string().optional().allow(''),
                    id: Joi.string().optional().allow('')
                })
            }
        }
    }
]