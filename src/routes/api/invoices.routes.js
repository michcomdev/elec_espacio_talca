import Member from '../../models/Member'
import Invoices from '../../models/Invoices'
import Payments from '../../models/Payments'
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
        path: '/api/invoices',
        options: {
            auth: false,
            description: 'get all invoices data',
            notes: 'return all data from invoices',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let invoices = await Invoices.find().lean()

                    return invoices
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
        path: '/api/invoiceSingle',
        options: {
            description: 'get one invoice',
            notes: 'get one invoice',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload   

                    let invoice = await Invoices.findById(payload.id).lean().populate(['lectures','services.services'])

                    return invoice

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
        path: '/api/invoiceSave',
        options: {
            description: 'create invoice',
            notes: 'create invoice',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload

                    let query = {
                        lectures: payload.lectures,
                        members: payload.member,
                        dateExpire: payload.dateExpire,
                        date: payload.date,
                        charge: payload.charge,
                        lectureActual: payload.lectureActual,
                        lectureLast: payload.lectureLast,
                        lectureResult: payload.lectureResult,
                        meterValue: payload.meterValue,
                        subsidyPercentage: payload.subsidyPercentage,
                        subsidyValue: payload.subsidyValue,
                        consumption: payload.consumption,
                        consumptionLimit: payload.consumptionLimit,
                        consumptionLimitValue: payload.consumptionLimitValue,
                        consumptionLimitTotal: payload.consumptionLimitTotal,
                        invoiceDebt: payload.invoiceDebt,
                        invoicePaid: 0,
                        invoiceTotal: payload.invoiceTotal
                    }

                    if(payload.number){
                        query.number = payload.number
                    }
                    
                    if(payload.services.length>0){
                        query.services = payload.services
                    }

                    let invoice = new Invoices(query)
                    const response = await invoice.save()

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
                    number: Joi.number().allow(0).optional(),
                    lectures: Joi.string().allow(''),
                    member: Joi.string().allow(''),
                    memberType: Joi.string().allow('').optional(), //Para efectos de generación múltiple
                    date: Joi.string().allow(''),
                    dateExpire: Joi.string().allow(''),
                    charge: Joi.number().allow(0),
                    lectureActual: Joi.number().allow(0),
                    lectureLast: Joi.number().allow(0),
                    lectureResult: Joi.number().allow(0),
                    meterValue: Joi.number().allow(0),
                    subsidyPercentage: Joi.number().allow(0),
                    subsidyValue: Joi.number().allow(0),
                    consumption: Joi.number().allow(0),
                    consumptionLimit: Joi.number().allow(0),
                    consumptionLimitValue: Joi.number().allow(0),
                    consumptionLimitTotal: Joi.number().allow(0),
                    invoiceDebt: Joi.number().allow(0),
                    invoiceTotal: Joi.number().allow(0),
                    services: Joi.array().items(Joi.object().keys({
                        services: Joi.string().optional().allow(''),
                        value: Joi.number().optional().allow(0)
                    })).optional()
                })
            }
        }
    },
    {
        method: 'POST',
        path: '/api/invoiceUpdate',
        options: {
            description: 'update invoice',
            notes: 'update invoice',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload

                    let invoices = await Invoices.findById(payload.id)

                    invoices.lectures = payload.lectures
                    if(payload.number){
                        invoices.number = payload.number
                    }
                    invoices.members = payload.member
                    invoices.date = payload.date
                    invoices.dateExpire = payload.dateExpire
                    invoices.charge = payload.charge
                    invoices.lectureActual = payload.lectureActual
                    invoices.lectureLast = payload.lectureLast
                    invoices.lectureResult = payload.lectureResult
                    invoices.meterValue = payload.meterValue
                    invoices.subsidyPercentage = payload.subsidyPercentage
                    invoices.subsidyValue = payload.subsidyValue
                    invoices.consumption = payload.consumption
                    invoices.consumptionLimit = payload.consumptionLimit
                    invoices.consumptionLimitValue = payload.consumptionLimitValue
                    invoices.consumptionLimitTotal = payload.consumptionLimitTotal
                    invoices.invoiceDebt = payload.invoiceDebt
                    //invoices.invoicePaid = payload.invoicePaid
                    invoices.invoiceTotal = payload.invoiceTotal
                    invoices.services = payload.services

                    const response = await invoices.save()

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
                    number: Joi.number().allow(0).optional(),
                    lectures: Joi.string().allow(''),
                    member: Joi.string().allow(''),
                    memberType: Joi.string().allow('').optional(), //Para efectos de generación múltiple
                    date: Joi.string().allow(''),
                    dateExpire: Joi.string().allow(''),
                    charge: Joi.number().allow(0),
                    lectureActual: Joi.number().allow(0),
                    lectureLast: Joi.number().allow(0),
                    lectureResult: Joi.number().allow(0),
                    meterValue: Joi.number().allow(0),
                    subsidyPercentage: Joi.number().allow(0),
                    subsidyValue: Joi.number().allow(0),
                    consumption: Joi.number().allow(0),
                    consumptionLimit: Joi.number().allow(0),
                    consumptionLimitValue: Joi.number().allow(0),
                    consumptionLimitTotal: Joi.number().allow(0),
                    invoiceDebt: Joi.number().allow(0),
                    invoiceTotal: Joi.number().allow(0),
                    services: Joi.array().items(Joi.object().keys({
                        services: Joi.string().optional().allow(''),
                        value: Joi.number().optional().allow(0)
                    })).optional()
                })
            }
        }
    },
    {
        method: 'POST',
        path: '/api/invoiceUpdateDTE',
        options: {
            description: 'update invoice',
            notes: 'update invoice',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload

                    let invoices = await Invoices.findById(payload.id)

                    invoices.type = payload.type
                    invoices.number = payload.number
                    invoices.seal = payload.seal
                    invoices.token = payload.token

                    const response = await invoices.save()

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
                    id: Joi.string(),
                    type: Joi.number(),
                    number: Joi.number(),
                    seal: Joi.string(),
                    token: Joi.string()
                })
            }
        }
    },
    {
        method: 'POST',
        path: '/api/invoicesDebt',
        options: {
            description: 'get unpaid invoices',
            notes: 'get unpaid invoices',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload
                    let query = {
                        members: payload.member,
                        number: {
                            $exists: true,
                            $ne: 0
                        },
                        $where: "this.invoiceTotal != this.invoicePaid" //Si el valor de pago no es igual al pago total, la boleta se omitirá
                        
                    }
                    /*if(payload.paymentID){
                        query._id = { $ne: payload.paymentID }
                    }*/

                    let invoices = await Invoices.find(query).lean().populate(['lectures','services.services'])
                    /*console.log(invoices)
                    let queryPayment = {
                        members: payload.member
                    }

                    let payments = await Payments.find(queryPayment).lean()
                    for(let i=0; i<payments.length; i++){ // Se recorren las boletas pagadas y se asigna su monto cancelado a las boletas generales
                        for(let j=0; j<payments[i].invoices.length; j++){
                            invoices.find(x => x._id.toString() == payments[i].invoices[j].invoices.toString()).invoiceDebt += payments[i].invoices[j].amount
                        }
                    }*/

                    if(payload.paymentID){

                        let payments = await Payments.findById(payload.paymentID).lean()
                        for(let i=0; i<payments.invoices.length; i++){
                            let index = invoices.map(x => x._id.toString()).indexOf(payments.invoices[i].invoices.toString())
                            invoices.splice(index,1)
                        }
                    }

                    return invoices

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
                    paymentID: Joi.string().optional().allow('')
                })
            }
        }
    },
]