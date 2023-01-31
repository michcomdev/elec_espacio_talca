import Member from '../../models/Member'
import Invoices from '../../models/Invoices'
import Payments from '../../models/Payments'
import Joi from 'joi'
import dotEnv from 'dotenv'
import Lectures from '../../models/Lectures'

const fs = require("fs")
const { promisify } = require("util");
const writeFile = promisify(fs.writeFile)
const readFile = promisify(fs.readFile)

dotEnv.config()

export default [
    {
        method: 'GET',
        path: '/api/payments',
        options: {
            auth: false,
            description: 'get all payments data',
            notes: 'return all data from payments',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payments = await Payments.find().lean()

                    return payments
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
        path: '/api/paymentsByFilter',
        options: {
            description: 'get payments by filters',
            notes: 'get payments by filters',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload
                    let query = {
                        date: {
                            $gte: `${payload.dateStart}`, //`${payload.startDate}T00:00:00.000Z`,
                            $lt: `${payload.dateEnd}T12:00:00.000` //`${payload.endDate}T23:59:59.999Z`
                        }
                    }

                    if(payload.paymentMethod!=0){
                        query.paymentMethod = payload.paymentMethod
                    }

                    if(payload.sector==0){
                        let payment = await Payments.find(query).lean().populate([{ path: 'members', populate: { path: 'address.sector'} }, 'invoices.invoices'])
                        return payment
                    }else{
                        let payment = await Payments.find(query).lean().populate([{ path: 'members', match: { 'address.sector': payload.sector }, populate: { path: 'address.sector'} }, 'invoices.invoices'])
                        return payment
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
                    paymentMethod: Joi.string().optional().allow(''),
                    dateStart: Joi.string().optional().allow(''),
                    dateEnd: Joi.string().optional().allow('')
                })
            }
        }
    },    
    {
        method: 'POST',
        path: '/api/paymentSingle',
        options: {
            description: 'get one payment',
            notes: 'get one payment',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload   

                    let payment = await Payments.findById(payload.id).lean().populate(['members','invoices.invoices'])
                    for(let i=0; i<payment.invoices.length; i++){ // Se recorren las boletas pagadas y se asigna su monto cancelado a las boletas generales
                        
                        if(payment.invoices[i].invoices){
                            let lecture = await Lectures.findById(payment.invoices[i].invoices.lectures).lean()
                            payment.invoices[i].invoices.lectureData = lecture
                        }
                    }
/*
                    let invoices = await Invoices.find(query).lean().populate(['lectures','services.services'])

                    let payments = await Payments.find({members: payload.member}).lean()
                    for(let i=0; i<payments.length; i++){ // Se recorren las boletas pagadas y se asigna su monto cancelado a las boletas generales
                        for(let j=0; j<payments[i].invoices.length; j++){
                            invoices.find(x => x._id.toString() == payments[i].invoices[j].invoices.toString()).invoiceDebt += payments[i].invoices[j].amount
                        }
                    }*/

                    return payment

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
        path: '/api/paymentsSingleMember',
        options: {
            description: 'get one payment',
            notes: 'get one payment',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload   

                    let payment = await Payments.find({members: payload.member}).lean().populate(['members','invoices.invoices'])

                    return payment

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
        path: '/api/paymentSave',
        options: {
            description: 'create payment',
            notes: 'create payment',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload

                    let date = new Date(payload.date)

                    let invoices = payload.invoices

                    let query = {
                        members: payload.member,
                        date: payload.date,
                        paymentMethod: payload.paymentMethod,
                        transaction: payload.transaction,
                        amount: payload.amount,
                        invoices: invoices
                    }

                    let payment = new Payments(query)
                    const response = await payment.save()

                    for(let i=0; i<invoices.length; i++){
                        if(invoices[i].invoices){
                            let invoice = await Invoices.findById(invoices[i].invoices)
                            invoice.invoicePaid += invoices[i].amount
                            await invoice.save()
                        }else{
                            if(invoices[i].positive){
                                let member = await Member.findById(payload.member)
                                if(member.positiveBalance){
                                    member.positiveBalance += invoices[i].amount
                                }else{
                                    member.positiveBalance = invoices[i].amount
                                }
                                await member.save()
                            }
                        }
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
                    paymentMethod: Joi.string().allow(''),
                    transaction: Joi.string().allow(''),
                    amount: Joi.number().allow(0),
                    invoices: Joi.array().items(Joi.object().keys({
                        invoices: Joi.string().optional().allow(''),
                        amount: Joi.number().optional().allow(0),
                        positive: Joi.boolean().optional()
                    })).optional()
                })
            }
        }
    },
    {
        method: 'POST',
        path: '/api/paymentUpdate',
        options: {
            description: 'update payment',
            notes: 'update payment',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload

                    let payment = await Payments.findById(payload.id)
                    
   //Actualización de montos pagados boletas asociadas a pago antiguas, se utiliza por si hubiese alguna boleta que sea eliminada
                    let invoicesOld = payment.invoices
                    for(let i=0; i<invoicesOld.length; i++){

                        let invoiceQuery = {
                            invoices: {
                                $elemMatch: { 
                                    invoices: invoicesOld[i].invoices
                                }
                            }
                        }

                        let invoicePayments = await Payments.find(invoiceQuery) //Obtención de todos los pagos realizados a la boleta
                        let invoice = await Invoices.findById(invoicesOld[i].invoices) //Obtención de registro de boleta
                        
                        for(let j=0; j<invoicePayments.length; j++){
                            if(invoicePayments[j].invoices.find(x => x.invoices == invoicesOld[i].invoices)){
                                invoice.invoicePaid = 0
                            }
                        }
                        for(let k=0; k<invoicePayments.length; k++){
                            if(invoicePayments[k].invoices.find(x => x.invoices == invoicesOld[i].invoices)){
                                invoice.invoicePaid += invoicePayments[k].invoices.find(x => x.invoices == invoicesOld[i].invoices).amount
                            }
                        }
                        
                        await invoice.save()
                    }


////////////////////Actualización de registro//////////////////////


                    let invoices = payload.invoices

                    payment.members = payload.member
                    payment.date = payload.date
                    payment.paymentMethod = payload.paymentMethod
                    payment.transaction = payload.transaction
                    payment.amount = payload.amount
                    payment.invoices = payload.invoices

                    const response = await payment.save()

                    //Actualización de montos pagados boletas asociadas a pago
                    for(let i=0; i<invoices.length; i++){

                        let invoiceQuery = {
                            invoices: {
                                $elemMatch: { 
                                    invoices: invoices[i].invoices
                                }
                            }
                        }

                        //console.log('invoiceQuery',invoiceQuery)
                        let invoicePayments = await Payments.find(invoiceQuery) //Obtención de todos los pagos realizados a la boleta
                        let invoice = await Invoices.findById(invoices[i].invoices) //Obtención de registro de boleta
                        //console.log(invoice)
                        for(let j=0; j<invoicePayments.length; j++){
                            if(invoicePayments[j].invoices.find(x => x.invoices == invoices[i].invoices)){
                                invoice.invoicePaid = 0
                            }
                        }
                        for(let k=0; k<invoicePayments.length; k++){
                            if(invoicePayments[k].invoices.find(x => x.invoices == invoices[i].invoices)){
                                invoice.invoicePaid += invoicePayments[k].invoices.find(x => x.invoices == invoices[i].invoices).amount
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
                    paymentMethod: Joi.string().allow(''),
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
        path: '/api/paymentDelete',
        options: {
            description: 'delete payment',
            notes: 'delete payment',
            tags: ['api'],
            handler: async (request) => {
                try {
                    let payload = request.payload

                    if (payload.id) {

                        let payment = await Payments.findById(payload.id)
                        for(let i=0; i<payment.invoices.length; i++){
                            if(payment.invoices[i].invoices){
                                let invoice = await Invoices.findById(payment.invoices[i].invoices)
                                invoice.invoicePaid -= payment.invoices[i].amount
                                await invoice.save()
                            }else{
                                //CÓDIGO PARA QUITAR SALDO A FAVOR EN CASO QUE CORRESPONDA
                            }
                        }

                        await Payments.deleteOne({_id: payload.id})
                        return true

                    }

                } catch (error) {
                    console.log(error)

                    return {
                        error: 'Ha ocurrido un error al guardar datos de usuario'
                    }
                }
            },
            validate: {
                payload: Joi.object().keys({
                    id: Joi.string()
                })
            }
        }
    }
]