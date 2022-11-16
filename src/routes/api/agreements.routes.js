import Member from '../../models/Member'
import Invoices from '../../models/Invoices'
import Agreements from '../../models/Agreements'
import Joi from 'joi'
import dotEnv from 'dotenv'

const fs = require("fs")
const { promisify } = require("util");
const writeFile = promisify(fs.writeFile)
const readFile = promisify(fs.readFile)

dotEnv.config()

export default [
    {
        method: 'GET',
        path: '/api/agreements',
        options: {
            auth: false,
            description: 'get all agreements data',
            notes: 'return all data from agreements',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let agreements = await Agreements.find().lean()

                    return agreements
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
        path: '/api/agreementsByFilter',
        options: {
            description: 'get agreements by filters',
            notes: 'get agreements by filters',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload
                    let query = {
                        date: {
                            $gte: `${payload.dateStart}`, //`${payload.startDate}T00:00:00.000Z`,
                            $lt: `${payload.dateEnd}T23:59:59.999` //`${payload.endDate}T23:59:59.999Z`
                        }
                    }

                    if(payload.agreementMethod!=0){
                        query.agreementMethod = payload.agreementMethod
                    }

                    if(payload.sector==0){
                        let agreement = await Agreements.find(query).lean().populate([{ path: 'members', populate: { path: 'address.sector'} }, 'invoices.invoices'])
                        return agreement
                    }else{
                        let agreement = await Agreements.find(query).lean().populate([{ path: 'members', match: { 'address.sector': payload.sector }, populate: { path: 'address.sector'} }, 'invoices.invoices'])
                        return agreement
                    }


                } catch (error) {
                    console.log(error)

                    return h.response({
                        error: 'Internal Server Error'
                    }).code(500)
                }
            },
            validate: {
                payload: Joi.object().keys({
                    sector: Joi.string().optional().allow(''),
                    agreementMethod: Joi.string().optional().allow(''),
                    dateStart: Joi.string().optional().allow(''),
                    dateEnd: Joi.string().optional().allow('')
                })
            }
        }
    },    
    {
        method: 'POST',
        path: '/api/agreementSingle',
        options: {
            description: 'get one agreement',
            notes: 'get one agreement',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload   

                    let agreement = await Agreements.findById(payload.id).lean().populate(['members','services'])

/*
                    let invoices = await Invoices.find(query).lean().populate(['lectures','services.services'])

                    let agreements = await Agreements.find({members: payload.member}).lean()
                    for(let i=0; i<agreements.length; i++){ // Se recorren las boletas pagadas y se asigna su monto cancelado a las boletas generales
                        for(let j=0; j<agreements[i].invoices.length; j++){
                            invoices.find(x => x._id.toString() == agreements[i].invoices[j].invoices.toString()).invoiceDebt += agreements[i].invoices[j].amount
                        }
                    }*/

                    return agreement

                } catch (error) {
                    console.log(error)

                    return h.response({
                        error: 'Internal Server Error'
                    }).code(500)
                }
            },
            validate: {
                payload: Joi.object().keys({
                    id: Joi.string().optional().allow('')
                })
            }
        }
    },
    {
        method: 'POST',
        path: '/api/agreementsSingleMember',
        options: {
            description: 'get one agreement',
            notes: 'get one agreement',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload   

                    let agreement = await Agreements.find({members: payload.member}).lean().populate(['members','services'])

                    return agreement

                } catch (error) {
                    console.log(error)

                    return h.response({
                        error: 'Internal Server Error'
                    }).code(500)
                }
            },
            validate: {
                payload: Joi.object().keys({
                    member: Joi.string().optional().allow('')
                })
            }
        }
    },
    {
        method: 'POST',
        path: '/api/agreementSave',
        options: {
            description: 'create agreement',
            notes: 'create agreement',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload

                    let date = new Date(payload.date)

                    let query = {
                        members: payload.member,
                        date: payload.date,
                        other: payload.other,
                        totalAmount: payload.totalAmount,
                        dues: payload.dues
                    }

                    if(payload.service){
                        query.services = payload.service
                    }else{
                        query.services = undefined
                    }

                    let agreement = new Agreements(query)
                    const response = await agreement.save()

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
                    member: Joi.string().allow(''),
                    service: Joi.string().allow('').optional(),
                    date: Joi.string().allow(''),
                    other: Joi.string().allow(''),
                    totalAmount: Joi.number().allow(0),
                    dues: Joi.array().items(Joi.object().keys({
                        number: Joi.number().optional(),
                        year: Joi.number().optional().allow(0),
                        month: Joi.number().optional().allow(0),
                        amount: Joi.number().optional().allow(0)
                    })).optional()
                })
            }
        }
    },
    {
        method: 'POST',
        path: '/api/agreementUpdate',
        options: {
            description: 'update agreement',
            notes: 'update agreement',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload

                    let agreement = await Agreements.findById(payload.id)

                    agreement.date = payload.date
                    agreement.other = payload.other
                    agreement.totalAmount = payload.totalAmount
                    agreement.dues = payload.dues

                    if(payload.service){
                        agreement.services = payload.service
                    }else{
                        agreement.services = undefined
                    }
                        
                    let response = await agreement.save()

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
                    id: Joi.string().allow(''),
                    member: Joi.string().allow(''),
                    service: Joi.string().allow('').optional(),
                    date: Joi.string().allow(''),
                    other: Joi.string().allow(''),
                    totalAmount: Joi.number().allow(0),
                    dues: Joi.array().items(Joi.object().keys({
                        number: Joi.number().optional(),
                        year: Joi.number().optional().allow(0),
                        month: Joi.number().optional().allow(0),
                        amount: Joi.number().optional().allow(0)
                    })).optional()
                })
            }
        }
    },
    {
        method: 'POST',
        path: '/api/agreementsByDate',
        options: {
            description: 'get agreement by date',
            notes: 'get agreement by date',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload

                    let query = {
                        'dues.year': payload.year, 
                        'dues.month': payload.month, 
                        members: payload.member
                    }
                    if(payload.invoiceID){
                        query.dues.invoices = payload.invoiceID
                    }

                    let agreements = await Agreements.find(query).lean().populate(['services'])
                    for(let i=0; i<agreements.length; i++){
                        for(let j=0; j<agreements[i].dues.length; j++){
                            if(agreements[i].dues[j].year==payload.year && agreements[i].dues[j].month==payload.month){
                                agreements[i].due = agreements[i].dues[j]
                            }
                        }
                    }

                    return agreements

                } catch (error) {
                    console.log(error)

                    return h.response({
                        error: 'Internal Server Error'
                    }).code(500)
                }
            },
            validate: {
                payload: Joi.object().keys({
                    invoiceID: Joi.string().optional().allow(''),
                    member: Joi.string().optional().allow(''),
                    year: Joi.number(),
                    month: Joi.number(),
                })
            }
        }
    },
    {
        method: 'POST',
        path: '/api/agreementsByInvoice',
        options: {
            description: 'get agreement by date',
            notes: 'get agreement by date',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload

                    let agreements = await Agreements.find({'dues.invoices': payload.invoiceID}).lean().populate(['services'])
                    for(let i=0; i<agreements.length; i++){
                        for(let j=0; j<agreements[i].dues.length; j++){
                            if(agreements[i].dues[j].invoices){
                                if(agreements[i].dues[j].invoices.toString()==payload.invoiceID.toString()){
                                    agreements[i].due = agreements[i].dues[j]
                                }
                            }
                        }
                    }

                    return agreements

                } catch (error) {
                    console.log(error)

                    return h.response({
                        error: 'Internal Server Error'
                    }).code(500)
                }
            },
            validate: {
                payload: Joi.object().keys({
                    invoiceID: Joi.string().optional().allow('')
                })
            }
        }
    },
    {
        method: 'POST',
        path: '/api/agreementsPending',
        options: {
            description: 'get agreements by filters',
            notes: 'get agreements by filters',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload
                    let query = {
                        members: payload.member
                    }

                    let agreements = await Agreements.find(query).lean().populate(['services'])//.populate([{ path: 'members', populate: { path: 'address.sector'} }, 'invoices.invoices'])
                    return agreements


                } catch (error) {
                    console.log(error)

                    return h.response({
                        error: 'Internal Server Error'
                    }).code(500)
                }
            },
            validate: {
                payload: Joi.object().keys({
                    member: Joi.string(),
                    invoice: Joi.string().optional()
                })
            }
        }
    }
]