import Member from '../../models/Member'
import Invoices from '../../models/Invoices'
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

                    let invoice = await Invoices.findById(payload.id).lean().populate(['lectures'])

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

                    let date = new Date(payload.date)

                    let query = {
                        lectures: payload.lectures,
                        member: payload.member,
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
                        invoiceDebt: payload.invoiceDebt,
                        invoiceTotal: payload.invoiceTotal
                    }

                    if(payload.number){
                        query.number = payload.number
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
                    invoiceDebt: Joi.number().allow(0),
                    invoiceTotal: Joi.number().allow(0)
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
                    invoices.member = payload.member
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
                    invoices.invoiceDebt = payload.invoiceDebt
                    invoices.invoiceTotal = payload.invoiceTotal

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
                    invoiceDebt: Joi.number().allow(0),
                    invoiceTotal: Joi.number().allow(0)
                })
            }
        }
    }
]