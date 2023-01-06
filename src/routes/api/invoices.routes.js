import Member from '../../models/Member'
import Invoices from '../../models/Invoices'
import Payments from '../../models/Payments'
import Agreements from '../../models/Agreements'
import Parameters from '../../models/Parameters'
import Joi from 'joi'
import dotEnv from 'dotenv'
import nodemailer from 'nodemailer'

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
        path: '/api/invoicesByLecture',
        options: {
            description: 'get one invoice',
            notes: 'get one invoice',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload
                    let query = {
                        lectures: payload.lecture
                    }

                    let invoices = await Invoices.find(query).lean().populate(['lectures','services.services'])

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
                    lecture: Joi.string().optional().allow('')
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
                        sewerage: payload.sewerage,
                        fine: payload.fine,
                        invoiceSubTotal: payload.invoiceSubTotal,
                        invoiceDebt: payload.invoiceDebt,
                        debtFine: payload.debtFine,
                        invoicePaid: 0,
                        invoiceTotal: payload.invoiceTotal,
                        type: payload.type,
                        text1: payload.text1,
                        text2: payload.text2,
                        text3: payload.text3
                    }

                    if(payload.number){
                        query.number = payload.number
                    }
                    
                    if(payload.services.length>0){
                        query.services = payload.services
                    }

                    if(payload.lectureNewStart !== undefined){
                        query.lectureNewStart = payload.lectureNewStart
                        query.lectureNewEnd = payload.lectureNewEnd
                    }

                    if(payload.agreements.length>0){
                        query.agreements = payload.agreements
                    }

                    let invoice = new Invoices(query)
                    const response = await invoice.save()

                    if(payload.agreements.length>0){
                        for(let i=0; i<payload.agreements.length; i++){
                            let agreement = await Agreements.findById(payload.agreements[i].agreements)
                            for(let j=0; j<agreement.dues.length; j++){
                                if(agreement.dues[j].number==payload.agreements[i].number){
                                    agreement.dues[j].invoices = response._id
                                    await agreement.save()
                                    j = agreement.dues.length
                                }
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
                    number: Joi.number().allow(0).optional(),
                    lectures: Joi.string().allow(''),
                    member: Joi.string().allow(''),
                    memberType: Joi.string().allow('').optional(), //Para efectos de generación múltiple
                    type: Joi.number(),
                    date: Joi.string().allow(''),
                    dateExpire: Joi.string().allow(''),
                    charge: Joi.number().allow(0),
                    lectureActual: Joi.number().allow(0),
                    lectureLast: Joi.number().allow(0),
                    lectureNewStart: Joi.number().allow(0).optional(),
                    lectureNewEnd: Joi.number().allow(0).optional(),
                    lectureResult: Joi.number().allow(0),
                    meterValue: Joi.number().allow(0),
                    subsidyPercentage: Joi.number().allow(0),
                    subsidyValue: Joi.number().allow(0),
                    consumption: Joi.number().allow(0),
                    consumptionLimit: Joi.number().allow(0),
                    consumptionLimitValue: Joi.number().allow(0),
                    consumptionLimitTotal: Joi.number().allow(0),
                    sewerage: Joi.number().allow(0),
                    fine: Joi.number().allow(0),
                    invoiceSubTotal: Joi.number().allow(0),
                    invoiceDebt: Joi.number().allow(0),
                    debtFine: Joi.number().allow(0),
                    invoiceTotal: Joi.number().allow(0),
                    services: Joi.array().items(Joi.object().keys({
                        services: Joi.string().optional().allow(''),
                        value: Joi.number().optional().allow(0)
                    })).optional(),
                    agreements: Joi.array().items(Joi.object().keys({
                        agreements: Joi.string().optional().allow(''),
                        text: Joi.string().allow(''),
                        number: Joi.number().optional().allow(0),
                        dueLength: Joi.number().optional().allow(0),
                        amount: Joi.number().optional().allow(0)
                    })).optional(),
                    text1: Joi.string().optional().allow(''),
                    text2: Joi.string().optional().allow(''),
                    text3: Joi.string().optional().allow('')
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
                    invoices.type = payload.type
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
                    invoices.sewerage = payload.sewerage
                    invoices.fine = payload.fine
                    invoices.invoiceSubTotal = payload.invoiceSubTotal
                    invoices.invoiceDebt = payload.invoiceDebt
                    invoices.debtFine = payload.debtFine
                    //invoices.invoicePaid = payload.invoicePaid
                    invoices.invoiceTotal = payload.invoiceTotal
                    invoices.services = payload.services
                    invoices.agreements = payload.agreements
                    invoices.text1 = payload.text1
                    invoices.text2 = payload.text2
                    invoices.text3 = payload.text3

                    if(payload.lectureNewStart){
                        invoices.lectureNewStart = payload.lectureNewStart
                        invoices.lectureNewEnd = payload.lectureNewEnd
                    }

                    const response = await invoices.save()

                    if(payload.agreements){
                        if(payload.agreements.length>0){
                            for(let i=0; i<payload.agreements.length; i++){
                                let agreement = await Agreements.findById(payload.agreements[i].agreements)

                                for(let j=0; j<agreement.dues.length; j++){
                                    if(agreement.dues[j].number==payload.agreements[i].number){
                                        agreement.dues[j].invoices = response._id
                                        await agreement.save()
                                        j = agreement.dues.length
                                    }
                                }
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
                    id: Joi.string().allow(''),
                    number: Joi.number().allow(0).optional(),
                    lectures: Joi.string().allow(''),
                    member: Joi.string().allow(''),
                    memberType: Joi.string().allow('').optional(), //Para efectos de generación múltiple
                    type: Joi.number().allow(0),
                    date: Joi.string().allow(''),
                    dateExpire: Joi.string().allow(''),
                    charge: Joi.number().allow(0),
                    lectureActual: Joi.number().allow(0),
                    lectureLast: Joi.number().allow(0),
                    lectureNewStart: Joi.number().allow(0).optional(),
                    lectureNewEnd: Joi.number().allow(0).optional(),
                    lectureResult: Joi.number().allow(0),
                    meterValue: Joi.number().allow(0),
                    subsidyPercentage: Joi.number().allow(0),
                    subsidyValue: Joi.number().allow(0),
                    consumption: Joi.number().allow(0),
                    consumptionLimit: Joi.number().allow(0),
                    consumptionLimitValue: Joi.number().allow(0),
                    consumptionLimitTotal: Joi.number().allow(0),
                    sewerage: Joi.number().allow(0),
                    fine: Joi.number().allow(0),
                    invoiceSubTotal: Joi.number().allow(0),
                    invoiceDebt: Joi.number().allow(0),
                    debtFine: Joi.number().allow(0),
                    invoiceTotal: Joi.number().allow(0),
                    services: Joi.array().items(Joi.object().keys({
                        services: Joi.string().optional().allow(''),
                        value: Joi.number().optional().allow(0)
                    })).optional(),
                    agreements: Joi.array().items(Joi.object().keys({
                        agreements: Joi.string().optional().allow(''),
                        text: Joi.string().allow(''),
                        number: Joi.number().optional().allow(0),
                        dueLength: Joi.number().optional().allow(0),
                        amount: Joi.number().optional().allow(0)
                    })).optional(),
                    text1: Joi.string().optional().allow(''),
                    text2: Joi.string().optional().allow(''),
                    text3: Joi.string().optional().allow('')
                })
            }
        }
    },
    {
        method: 'POST',
        path: '/api/invoiceDelete',
        options: {
            description: 'delete invoice',
            notes: 'delete invoice',
            tags: ['api'],
            handler: async (request) => {
                try {
                    let payload = request.payload

                    if (payload.id) {
                        await Invoices.deleteOne({_id: payload.id})
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
                    invoices.resolution = payload.resolution

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
                    type: Joi.number().allow(0),
                    number: Joi.number().allow(0),
                    seal: Joi.string().allow(''),
                    token: Joi.string().allow(''),
                    resolution: Joi.object().keys({
                        fecha: Joi.string().allow(''),
                        numero: Joi.number().allow(0)
                    })
                })
            }
        }
    },
    {
        method: 'POST',
        path: '/api/invoiceUpdateDTEAnnulment',
        options: {
            description: 'update invoice',
            notes: 'update invoice',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload

                    let invoices = await Invoices.findById(payload.id)

                    invoices.annulment = {
                        type: payload.type,
                        number: payload.number,
                        seal: payload.seal,
                        token: payload.token,
                        resolution: payload.resolution
                    }

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
                    token: Joi.string(),
                    resolution: Joi.object().keys({
                        fecha: Joi.string(),
                        numero: Joi.number()
                    })
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
                        /*number: {
                            $exists: true,
                            $ne: 0
                        },*/
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

                    //console.log(invoices)

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
    {
        method: 'POST',
        path: '/api/invoicesSingleMember',
        options: {
            description: 'get unpaid invoices',
            notes: 'get unpaid invoices',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload
                    let query = {
                        members: payload.member,
                        typeInvoice: 'Ingreso'
                    }

                    let invoices = await Invoices.find(query).lean().populate(['services.services'])
                   
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
                    member: Joi.string().optional().allow('')
                })
            }
        }
    },
    {
        method: 'POST',
        path: '/api/invoiceInvoiceSave', //Boleta tipo Ingreso
        options: {
            description: 'create invoice',
            notes: 'create invoice',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload

                    let query = {
                        members: payload.member,
                        dateExpire: payload.dateExpire,
                        date: payload.date,
                        invoiceTotal: payload.invoiceTotal,
                        typeInvoice: 'Ingreso'
                    }

                    if(payload.number){
                        query.number = payload.number
                    }
                    
                    if(payload.agreements.length>0){
                        query.agreements = payload.agreements
                    }


                    let invoice = new Invoices(query)
                    const response = await invoice.save()

                    /*ACTUALIZACIÓN DE CONVENIO ASOCIADO A INGRESO/BOLETA */

                    if(payload.agreements.length>0){
                        for(let i=0; i<payload.agreements.length; i++){
                            let agreement = await Agreements.findById(payload.agreements[i].agreements)
                            for(let j=0; j<agreement.dues.length; j++){
                                if(agreement.dues[j].number==payload.agreements[i].number){
                                    agreement.dues[j].invoicesIngreso = response._id
                                    await agreement.save()
                                    j = agreement.dues.length
                                }
                            }
                        }
                    }

                    /*ACTUALIZACIÓN DE CORRELATIVO*/
                    let parameters = await Parameters.findById('6263033665a0afa3096a6a62')
                    parameters.invoiceCorrelative++
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
                    number: Joi.number().allow(0).optional(),
                    member: Joi.string().allow(''),
                    memberType: Joi.string().allow('').optional(), //Para efectos de generación múltiple
                    date: Joi.string().allow(''),
                    dateExpire: Joi.string().allow(''),
                    invoiceTotal: Joi.number().allow(0),
                    agreements: Joi.array().items(Joi.object().keys({
                        agreements: Joi.string().optional().allow(''),
                        text: Joi.string().allow(''),
                        number: Joi.number().optional().allow(0),
                        dueLength: Joi.number().optional().allow(0),
                        amount: Joi.number().optional().allow(0)
                    })).optional()
                    /*services: Joi.array().items(Joi.object().keys({
                        services: Joi.string().optional().allow(''),
                        other: Joi.string().optional().allow(''),
                        value: Joi.number().optional().allow(0)
                    })).optional()*/
                })
            }
        }
    }, 
    {
        method: 'POST',
        path: '/api/invoiceInvoiceUpdate',
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
                    invoices.invoiceTotal = payload.invoiceTotal
                    //invoices.services = payload.services
                    invoices.agreements = payload.agreements

                    const response = await invoices.save()


                    /*ACTUALIZACIÓN DE CONVENIO ASOCIADO A INGRESO/BOLETA */
                    //Limpieza
                    let agreements = await Agreements.find({ 'dues.invoicesIngreso': payload.id })

                    //Eliminación de asignación, en caso que las cuotas hayan sido desmarcadas
                    for(let k=0; k<agreements.length; k++){

                        let agreement = await Agreements.findById(agreements[k]._id)
                        //Eliminación de asignación, en caso que las cuotas hayan sido desmarcadas
                        for(let j=0; j<agreement.dues.length; j++){
                            if(agreement.dues[j].invoicesIngreso==payload.id){
                                agreement.dues[j].invoicesIngreso = undefined
                                await agreement.save()
                            }
                        }
                    }
                    
                    //Reingreso
                    if(payload.agreements.length>0){
                        for(let i=0; i<payload.agreements.length; i++){
                            let agreement = await Agreements.findById(payload.agreements[i].agreements)

                            for(let j=0; j<agreement.dues.length; j++){
                                if(agreement.dues[j].number==payload.agreements[i].number){
                                    agreement.dues[j].invoicesIngreso = payload.id
                                    await agreement.save()
                                    j = agreement.dues.length
                                }
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
                    id: Joi.string().allow(''),
                    number: Joi.number().allow(0).optional(),
                    member: Joi.string().allow(''),
                    memberType: Joi.string().allow('').optional(), //Para efectos de generación múltiple
                    date: Joi.string().allow(''),
                    dateExpire: Joi.string().allow(''),
                    invoiceTotal: Joi.number().allow(0),
                    agreements: Joi.array().items(Joi.object().keys({
                        agreements: Joi.string().optional().allow(''),
                        text: Joi.string().allow(''),
                        number: Joi.number().optional().allow(0),
                        dueLength: Joi.number().optional().allow(0),
                        amount: Joi.number().optional().allow(0)
                    })).optional()
                    /*services: Joi.array().items(Joi.object().keys({
                        services: Joi.string().optional().allow(''),
                        other: Joi.string().optional().allow(''),
                        value: Joi.number().optional().allow(0)
                    })).optional()*/
                })
            }
        }
    }, 
    {
        method: 'POST',
        path: '/api/sendPdf',
        options: {
            description: 'response auth cot',
            notes: 'response auth cot',
            tags: ['api'],
            payload: {
                maxBytes: 1000 * 1000 * 6 // 4mb
            },
            handler: async (request, h) => {
                try {
                    let payload = request.payload

                    let member = await Member.findById(payload.memberID)
                    member.email = payload.memberMail
                    await member.save()

                    let res = await sendEmail({
                        memberName: payload.memberName,
                        memberMail: payload.memberMail,
                        memberSubject: payload.memberSubject,
                        memberText: payload.memberText,
                        pdf: payload.pdf
                    })

                    return res

                } catch (error) {
                    console.log(error)

                    return h.response({
                        error: 'Internal Server Error'
                    }).code(500)
                }
            },
            validate: {
                payload: Joi.object().keys({
                    memberID: Joi.string().required(),
                    memberName: Joi.string().required(),
                    memberMail: Joi.string().email().required(),
                    memberSubject: Joi.string().required().allow(''),
                    memberText: Joi.string().required().allow(''),
                    pdf: Joi.string().required()
                })
            }
        }
    }
]


const sendEmail = async ({ // sendEmail
    memberName,
    memberMail,
    memberSubject,
    memberText,
    pdf
}) => {
    try {
        
        let transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false, // true for 465, false for other ports
            /*auth: {
                user: 'zeosonic@gmail.com',
                pass: 'mbfsckaczbtjmuek'
            },*/
            auth: {
                user: process.env.EMAIL_SENDER,
                pass: process.env.EMAIL_SENDER_PASSWORD
            },
            tls: {
                // do not fail on invalid certs
                //rejectUnauthorized: false,
                ciphers: 'SSLv3'
            }
        })

        /*
            subject: `Envío de Boleta Agua - Comité de Agua Los Cristales`,
            html: `
                Estimado(a) <b>${memberName}</b>
                <br/>
                <br/>
                Se adjunta boleta de consumo mensual de agua
            `,*/

        let mailData = {
            from: process.env.EMAIL_SENDER, //process.env.EMAIL_SENDER,
            to: [memberMail],//[clientMail],
            subject: memberSubject,
            //text: "Hello world?",
            html: memberText,

            //<img src="cid:logo" />

            /*attachments: [{
                filename: 'logoMail.png',
                path: 'public/img/logoMail.png',
                cid: 'logo' //same cid value as in the html img src
            }]*/
        }

        //mailData.to.push(toEmail)

        mailData.attachments = [{
            filename: `Boleta.pdf`,
            content: pdf,
            encoding: 'base64'
        }]

        

        let info = await transporter.sendMail(mailData)

        return info
    } catch (error) {
        console.log(error)
        return null
    }
}