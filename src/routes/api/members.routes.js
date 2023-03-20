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
                    let member = await Member.findById(payload.id).populate(['address.sector','services.services'])
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

                    //let members = await Member.find({rut: payload.rut})

                    /*if(members.length>0){
                        return 'created'
                    }*/

                    let address = {
                        address: payload.address.address
                    }

                    if(payload.address.sector!=0){
                        address.sector = payload.address.sector
                    }

                    let parameters = await Parameters.findById('6263033665a0afa3096a6a62')
                    let number = parameters.memberNumber

                    let query = {
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
                        subsidyNumber: payload.subsidyNumber,
                        email: payload.email,
                        phone: payload.phone,
                        dateStart: payload.dateStart,
                        dateEnd: payload.dateEnd,
                        status: 'active',
                        inactiveObservation: '',
                        fine: (payload.fine) ? payload.fine : false,
                        dte: payload.dte,
                        sendEmail: payload.sendEmail,
                        sendWhatsapp: payload.sendWhatsapp
                    }

                    if(payload.services){
                        if(payload.services.length>0){
                            query.services = payload.services
                        }
                    }

                    let member = new Member(query)

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
                    dateEnd: Joi.string().optional().allow(''),
                    subsidyNumber: Joi.number().optional().allow(0),
                    services: Joi.array().items(Joi.object().keys({
                        services: Joi.string().optional().allow(''),
                        value: Joi.number().optional().allow(0)
                    })).optional(),
                    fine: Joi.boolean().optional(),
                    dte: Joi.string().optional(),
                    sendEmail: Joi.boolean().optional(),
                    sendWhatsapp: Joi.boolean().optional()
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

                    /*let members = await Member.find({
                        _id: { $ne: payload.id },
                        rut: payload.rut
                    })
                    if(members.length>0){
                        return 'created'
                    }*/

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
                    member.services = payload.services
                    member.fine = (payload.fine) ? payload.fine : false
                    member.dte = payload.dte
                    member.sendEmail = payload.sendEmail
                    member.sendWhatsapp = payload.sendWhatsapp

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
                    subsidyNumber: Joi.number().optional().allow(0),
                    services: Joi.array().items(Joi.object().keys({
                        services: Joi.string().optional().allow(''),
                        value: Joi.number().optional().allow(0)
                    })).optional(),
                    fine: Joi.boolean().optional(),
                    dte: Joi.string().optional(),
                    sendEmail: Joi.boolean().optional(),
                    sendWhatsapp: Joi.boolean().optional()
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
                        rut: payload.rut,
                        name: payload.name,
                        lastname1: payload.lastname1,
                        lastname2: payload.lastname2,
                        houseQuantity: payload.houseQuantity,
                        municipality: payload.municipality,
                        type: payload.type,
                        decreeNumber: payload.decreeNumber,
                        decreeDate: payload.decreeDate,
                        inscriptionDate: payload.inscriptionDate,
                        inscriptionScore: payload.inscriptionScore,
                        sectionRSH: payload.sectionRSH,
                        startDate: payload.startDate,
                        endDate: payload.endDate,
                        percentage: payload.percentage,
                        status: payload.status
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
                    rut: Joi.string().optional().allow(''),
                    name: Joi.string().optional().allow(''),
                    lastname1: Joi.string().optional().allow(''),
                    lastname2: Joi.string().optional().allow(''),
                    houseQuantity: Joi.number().optional().allow(0),
                    municipality: Joi.string().optional().allow(''),
                    type: Joi.number().optional().allow(0),
                    decreeNumber: Joi.number().optional().allow(0),
                    decreeDate: Joi.string().optional().allow(''),
                    inscriptionDate: Joi.string().optional().allow(''),
                    inscriptionScore: Joi.number().optional().allow(0),
                    sectionRSH: Joi.number().optional().allow(0),
                    startDate: Joi.string().optional().allow(''),
                    endDate: Joi.string().optional().allow(''),
                    percentage: Joi.number().optional().allow(0),
                    status: Joi.string().optional().allow('')
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
                            member.subsidies[i].rut = payload.rut
                            member.subsidies[i].name = payload.name
                            member.subsidies[i].lastname1 = payload.lastname1
                            member.subsidies[i].lastname2 = payload.lastname2
                            member.subsidies[i].houseQuantity = payload.houseQuantity
                            member.subsidies[i].municipality = payload.municipality
                            member.subsidies[i].type = payload.type
                            member.subsidies[i].decreeNumber = payload.decreeNumber
                            member.subsidies[i].decreeDate = payload.decreeDate
                            member.subsidies[i].inscriptionDate = payload.inscriptionDate
                            member.subsidies[i].inscriptionScore = payload.inscriptionScore
                            member.subsidies[i].sectionRSH = payload.sectionRSH
                            member.subsidies[i].startDate = payload.startDate
                            member.subsidies[i].endDate = payload.endDate
                            member.subsidies[i].percentage = payload.percentage
                            member.subsidies[i].status = payload.status
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
                    rut: Joi.string().optional().allow(''),
                    name: Joi.string().optional().allow(''),
                    lastname1: Joi.string().optional().allow(''),
                    lastname2: Joi.string().optional().allow(''),
                    houseQuantity: Joi.number().optional().allow(0),
                    municipality: Joi.string().optional().allow(''),
                    type: Joi.number().optional().allow(0),
                    decreeNumber: Joi.number().optional().allow(0),
                    decreeDate: Joi.string().optional().allow(''),
                    inscriptionDate: Joi.string().optional().allow(''),
                    inscriptionScore: Joi.number().optional().allow(0),
                    sectionRSH: Joi.number().optional().allow(0),
                    startDate: Joi.string().optional().allow(''),
                    endDate: Joi.string().optional().allow(''),
                    percentage: Joi.number().optional().allow(0),
                    status: Joi.string().optional().allow('')
                })
            }
        }
    },
    {
        method: 'POST',
        path: '/api/subsidyDeactivate',
        options: {
            description: 'deactivate subsidy',
            notes: 'deactivate subsidy',
            tags: ['api'],
            handler: async (request, h) => {
                try {

                    let payload = request.payload   
                    let member = await Member.findById(payload.member)

                    for(let i=0; i<member.subsidies.length; i++){
                        if(member.subsidies[i]._id.toString()==payload.id){
                            member.subsidies[i].status = payload.status
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
                    status: Joi.string().optional().allow('')
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
    },
    {
        method: 'POST',
        path: '/api/memberOrderUpdate',
        options: {
            description: 'modify member',
            notes: 'modify member',
            tags: ['api'],
            handler: async (request, h) => {
                try {

                    let payload = request.payload
                    let member = await Member.findById(payload.id)

                    member.orderIndex = payload.orderIndex

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
                    orderIndex: Joi.number().optional().allow(0),
                })
            }
        }
    }
]