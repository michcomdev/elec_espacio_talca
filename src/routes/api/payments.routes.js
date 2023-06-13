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

                    /*let query = {
                        members: payload.member,
                        $where: "this.invoiceTotal != this.invoicePaid" //Si el valor de pago no es igual al pago total, la boleta se omitirá
                    }*/
                    let query = {
                        members: payload.member
                    }
                    let invoices = await Invoices.find(query).lean().populate()
                    let queryPayment = {
                        members: payload.member
                    }

                    let payments = await Payments.find(queryPayment).lean()
                    for(let i=0; i<payments.length; i++){ // Se recorren las boletas pagadas y se asigna su monto cancelado a las boletas generales
                        for(let j=0; j<payments[i].invoices.length; j++){
                            //invoices.find(x => x._id.toString() == payments[i].invoices[j].invoices.toString()).invoiceDebt += payments[i].invoices[j].amount
                            if(payments[i].invoices[j].amountMonth){
                                if(invoices.find(x => x._id.toString() == payments[i].invoices[j].invoices.toString()).paidConsumption){
                                    invoices.find(x => x._id.toString() == payments[i].invoices[j].invoices.toString()).paidConsumption += payments[i].invoices[j].amountMonth
                                }else{
                                    invoices.find(x => x._id.toString() == payments[i].invoices[j].invoices.toString()).paidConsumption = payments[i].invoices[j].amountMonth
                                }
                            }
                            if(payments[i].invoices[j].amountAgreement){
                                if(invoices.find(x => x._id.toString() == payments[i].invoices[j].invoices.toString()).paidAgreement){
                                    invoices.find(x => x._id.toString() == payments[i].invoices[j].invoices.toString()).paidAgreement += payments[i].invoices[j].amountAgreement
                                }else{
                                    invoices.find(x => x._id.toString() == payments[i].invoices[j].invoices.toString()).paidAgreement = payments[i].invoices[j].amountAgreement
                                }
                            }
                        }
                    }


                    let payment = await Payments.findById(payload.id).lean().populate(['members','invoices.invoices'])
                    for(let i=0; i<payment.invoices.length; i++){
                        
                        if(payment.invoices[i].invoices){
                            let lecture = await Lectures.findById(payment.invoices[i].invoices.lectures).lean()
                            payment.invoices[i].invoices.lectureData = lecture
                            payment.invoices[i].invoices.paidConsumption = 0
                            payment.invoices[i].invoices.paidAgreement = 0

                            if(invoices.find(x => x._id.toString() == payment.invoices[i].invoices._id.toString()).paidConsumption){
                                payment.invoices[i].invoices.paidConsumption += invoices.find(x => x._id.toString() == payment.invoices[i].invoices._id.toString()).paidConsumption
                            }
                            if(invoices.find(x => x._id.toString() == payment.invoices[i].invoices._id.toString()).paidAgreement){
                                payment.invoices[i].invoices.paidAgreement += invoices.find(x => x._id.toString() == payment.invoices[i].invoices._id.toString()).paidAgreement
                            }
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
                    id: Joi.string().optional().allow(''),
                    member: Joi.string().optional().allow('')
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
                        amountMonth: Joi.number().optional().allow(0),
                        amountAgreement: Joi.number().optional().allow(0),
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
                            for(let l=0; l<invoicePayments[j].invoices.length; l++){
                                if(invoicePayments[j].invoices[l].invoices){
                                    if(invoicePayments[j].invoices[l].invoices.toString() == invoicesOld[i].invoices.toString()){
                                        invoice.invoicePaid = 0
                                    }
                                }
                            }
                        }

                        for(let k=0; k<invoicePayments.length; k++){
                            if(invoicePayments[k]._id.toString()!=payload.id){
                                for(let l=0; l<invoicePayments[k].invoices.length; l++){
                                    if(invoicePayments[k].invoices[l].invoices){
                                        if(invoicePayments[k].invoices[l].invoices.toString() == invoicesOld[i].invoices.toString()){
                                            if(invoicePayments[k].invoices[l].amountMonth || invoicePayments[k].invoices[l].amountAgreement){
                                                invoice.invoicePaid += (invoicePayments[k].invoices[l].amountMonth + invoicePayments[k].invoices[l].amountAgreement)
                                            }else{
                                                invoice.invoicePaid += invoicePayments[k].invoices[l].amount
                                            }
                                        }
                                    }
                                }
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
                        if(invoices[i].invoices){
                            let invoice = await Invoices.findById(invoices[i].invoices)
                            if(invoices[i].amountMonth || invoices[i].amountAgreement){
                                invoice.invoicePaid += (invoices[i].amountMonth + invoices[i].amountAgreement)
                            }else{
                                invoice.invoicePaid += invoices[i].amount
                            }
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

/*
                    for(let i=0; i<invoices.length; i++){

                        let invoiceQuery = {
                            invoices: {
                                $elemMatch: { 
                                    invoices: invoices[i].invoices
                                }
                            }
                        }

                        let invoicePayments = await Payments.find(invoiceQuery) //Obtención de todos los pagos realizados a la boleta
                        let invoice = await Invoices.findById(invoices[i].invoices) //Obtención de registro de boleta

                        for(let j=0; j<invoicePayments.length; j++){
                            if(invoicePayments[j].invoices.invoices){
                                if(invoicePayments[j].invoices.find(x => x.invoices == invoices[i].invoices)){
                                    invoice.invoicePaid = 0
                                }
                            }
                        }
                        for(let k=0; k<invoicePayments.length; k++){
                            if(invoicePayments[k].invoices.invoices){
                                let invoiceSelected = invoicePayments[k].invoices.find(x => x.invoices == invoices[i].invoices)
                                console.log(invoiceSelected)
                                if(invoiceSelected){
                                    if(invoiceSelected.amountMonth || invoiceSelected.amountAgreement){
                                        invoice.invoicePaid += (invoiceSelected.amountMonth + invoiceSelected.amountAgreement)
                                    }else{
                                        invoice.invoicePaid += invoiceSelected.amount
                                    }
                                }
                            }
                        }
                        
                        await invoice.save()
                    }*/

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
                        amount: Joi.number().optional().allow(0),
                        amountMonth: Joi.number().optional().allow(0),
                        amountAgreement: Joi.number().optional().allow(0)
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
                                //invoice.invoicePaid -= payment.invoices[i].amount
                                if(payment.invoices[i].amountMonth || payment.invoices[i].amountAgreement){
                                    invoice.invoicePaid -= (payment.invoices[i].amountMonth + payment.invoices[i].amountAgreement)
                                }else{
                                    invoice.invoicePaid -= payment.invoices[i].amount
                                }
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