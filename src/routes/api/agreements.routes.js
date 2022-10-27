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

                    let invoices = payload.invoices

                    let query = {
                        members: payload.member,
                        date: payload.date,
                        agreementMethod: payload.agreementMethod,
                        transaction: payload.transaction,
                        amount: payload.amount,
                        invoices: invoices
                    }

                    let agreement = new Agreements(query)
                    const response = await agreement.save()

                    for(let i=0; i<invoices.length; i++){
                        let invoice = await Invoices.findById(invoices[i].invoices)
                        invoice.invoicePaid += invoices[i].amount
                        await invoice.save()
                    }

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
                    date: Joi.string().allow(''),
                    agreementMethod: Joi.string().allow(''),
                    transaction: Joi.string().allow(''),
                    amount: Joi.number().allow(0),
                    invoices: Joi.array().items(Joi.object().keys({
                        invoices: Joi.string().optional().allow(''),
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
                    
   //Actualización de montos pagados boletas asociadas a pago antiguas, se utiliza por si hubiese alguna boleta que sea eliminada
                    let invoicesOld = agreement.invoices
                    for(let i=0; i<invoicesOld.length; i++){

                        let invoiceQuery = {
                            invoices: {
                                $elemMatch: { 
                                    invoices: invoicesOld[i].invoices
                                }
                            }
                        }

                        let invoiceAgreements = await Agreements.find(invoiceQuery) //Obtención de todos los pagos realizados a la boleta
                        let invoice = await Invoices.findById(invoicesOld[i].invoices) //Obtención de registro de boleta
                        
                        for(let j=0; j<invoiceAgreements.length; j++){
                            if(invoiceAgreements[j].invoices.find(x => x.invoices == invoicesOld[i].invoices)){
                                invoice.invoicePaid = 0
                            }
                        }
                        for(let k=0; k<invoiceAgreements.length; k++){
                            if(invoiceAgreements[k].invoices.find(x => x.invoices == invoicesOld[i].invoices)){
                                invoice.invoicePaid += invoiceAgreements[k].invoices.find(x => x.invoices == invoicesOld[i].invoices).amount
                            }
                        }
                        
                        await invoice.save()
                    }


////////////////////Actualización de registro//////////////////////


                    let invoices = payload.invoices

                    agreement.members = payload.member
                    agreement.date = payload.date
                    agreement.agreementMethod = payload.agreementMethod
                    agreement.transaction = payload.transaction
                    agreement.amount = payload.amount
                    agreement.invoices = payload.invoices

                    const response = await agreement.save()

                    //Actualización de montos pagados boletas asociadas a pago
                    for(let i=0; i<invoices.length; i++){

                        let invoiceQuery = {
                            invoices: {
                                $elemMatch: { 
                                    invoices: invoices[i].invoices
                                }
                            }
                        }

                        console.log('invoiceQuery',invoiceQuery)
                        let invoiceAgreements = await Agreements.find(invoiceQuery) //Obtención de todos los pagos realizados a la boleta
                        let invoice = await Invoices.findById(invoices[i].invoices) //Obtención de registro de boleta
                        console.log(invoice)
                        for(let j=0; j<invoiceAgreements.length; j++){
                            if(invoiceAgreements[j].invoices.find(x => x.invoices == invoices[i].invoices)){
                                invoice.invoicePaid = 0
                            }
                        }
                        for(let k=0; k<invoiceAgreements.length; k++){
                            if(invoiceAgreements[k].invoices.find(x => x.invoices == invoices[i].invoices)){
                                invoice.invoicePaid += invoiceAgreements[k].invoices.find(x => x.invoices == invoices[i].invoices).amount
                            }
                        }
                        
                        await invoice.save()
                    }

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
                    date: Joi.string().allow(''),
                    agreementMethod: Joi.string().allow(''),
                    transaction: Joi.string().allow(''),
                    amount: Joi.number().allow(0),
                    invoices: Joi.array().items(Joi.object().keys({
                        invoices: Joi.string().optional().allow(''),
                        amount: Joi.number().optional().allow(0)
                    })).optional()
                })
            }
        }
    }
]