import Member from '../../models/Member'
import Lectures from '../../models/Lectures'
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
        path: '/api/lectures',
        options: {
            auth: false,
            description: 'get all lectures data',
            notes: 'return all data from lectures',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let lectures = await Lectures.find().lean()

                    return lectures
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
        path: '/api/membersLectures',
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
        path: '/api/lecturesSectorMembers',
        options: {
            description: 'get all lectures from single member',
            notes: 'get all lectures from single member',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload

                    let members = await Member.find({'address.sector': payload.sector}).populate(['address.sector'])
                    let array = []
                    for(let i=0; i<members.length ; i++){
                        array.push(members[i]._id)
                    }

                    let query = {
                        members: { $in: array },
                        month: payload.month,
                        year: payload.year
                    }
                    let queryLast = {
                        members: { $in: array },
                        month: (payload.month==1) ? 12 : payload.month - 1,
                        year: (payload.month==1) ? payload.year - 1 : payload.year, 
                    }
                    let queryInvoice = {
                        members: { $in: array }
                    }

                    let lectures = await Lectures.find(query).populate([{ path: 'members', populate: { path: 'services.services'} }]).sort({'members.number' : 'ascending'}).lean()
                    let lecturesLast = await Lectures.find(queryLast).populate([{ path: 'members', populate: { path: 'services.services'} }]).sort({'members.number' : 'ascending'}).lean()
                    let invoices = await Invoices.find(queryInvoice).sort({'date' : 'descending'}).lean().populate(['lectures','services.services'])

                    for(let i=0;i<lectures.length;i++){
                        lectures[i].invoice = invoices.find(x => x.lectures._id.toString() === lectures[i]._id.toString())
                        
                        if(lecturesLast.find(x => x.members._id.toString() == lectures[i].members._id.toString())){
                            lectures[i].lastLecture = lecturesLast.find(x => x.members._id.toString() == lectures[i].members._id.toString())
                        }
                    }

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
                    sector: Joi.string().optional().allow(''),
                    month: Joi.number().allow(0),
                    year: Joi.number().allow(0)
                })
            }
        }
    },
    {
        method: 'POST',
        path: '/api/lecturesSingleMember',
        options: {
            description: 'get all lectures from single member',
            notes: 'get all lectures from single member',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload

                    let query = {
                        members: payload.member
                    }


                    let lectures = await Lectures.find(query).sort({'year' : 'descending', 'month' : 'descending'}).lean()
                    //let invoices = await Invoices.find(query).sort({'date' : 'descending'}).populate(['lectures']).lean()
                    let invoices = await Invoices.find(query).sort({'date' : 'descending'}).lean().populate(['lectures'])

                    for(let i=0;i<lectures.length;i++){
                        lectures[i].invoice = invoices.find(x => x.lectures._id.toString() === lectures[i]._id.toString())
                    }

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
                    member: Joi.string().optional().allow('')
                })
            }
        }
    },
    {
        method: 'POST',
        path: '/api/lectureSingle',
        options: {
            description: 'get one lecture',
            notes: 'get one lecture',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload

                    let lecture = await Lectures.findById(payload.id).populate(['members']).lean()
                    let lecturesLast = await Lectures.find({members: lecture.members}).sort({'year' : 'ascending', 'month' : 'ascending'}).lean()
                    let lastLecture = 0
                    
                    for(let i=0;i<lecturesLast.length;i++){
                        if(lecturesLast[i]._id.toString()===lecture._id.toString()){
                            if(i>0){
                                lastLecture = lecturesLast[i-1].logs[lecturesLast[i-1].logs.length-1].lecture
                            }
                            i = lecturesLast.length
                        }
                    }

                    lecture.lastLecture = lastLecture

                    return lecture

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
        path: '/api/lectureSave',
        options: {
            description: 'create lecture',
            notes: 'create lecture',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload   
                    let date = new Date(payload.date)

                    let lectures = await Lectures.find({members: payload.member, month: date.getMonth() + 1, year: date.getFullYear()}).lean()

                    if(lectures[0]){
                        let lecture = await Lectures.findById(lectures[0]._id)
                        lecture.logs.push({
                            users: payload.users,
                            date: date,
                            lecture: payload.lecture
                        })
                        const response = await lecture.save()
                        return response

                    }else{
                        let query = {
                            members: payload.member,
                            month: date.getMonth() + 1,
                            year: date.getFullYear(),
                            logs: [{
                                users: payload.users,
                                date: date,
                                lecture: payload.lecture
                            }]
                        }
                        let lecture = new Lectures(query)
                        const response = await lecture.save()
                        return response
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
                    users: Joi.string().allow(''),
                    date: Joi.string().allow(''),
                    member: Joi.string().allow(''),
                    lecture: Joi.number().allow(0)
                })
            }
        }
    },
    {
        method: 'POST',
        path: '/api/lectureUpdate',
        options: {
            description: 'update lecture',
            notes: 'update lecture',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload   

                    let lectures = await Lectures.findById(payload.id)
                   
                    lectures.date = payload.date
                    lectures.rut = payload.rut
                    lectures.name = payload.name
                    lectures.address = payload.address
                    lectures.status = payload.status
                    lectures.net = payload.net
                    lectures.iva = payload.iva
                    lectures.total = payload.total
                    lectures.payment = payload.payment
                    lectures.paymentVoucher = payload.paymentVoucher
                    lectures.type = payload.type

                    if(payload.products){
                        lectures.products = payload.products
                    }

                    if(payload.services){
                        lectures.services = payload.services
                    }

                    const response = await lectures.save()

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
                    date: Joi.string().optional().allow(''),
                    rut: Joi.string().optional().allow(''),
                    name: Joi.string().optional().allow(''),
                    address: Joi.string().optional().allow(''),
                    status: Joi.string().optional().allow(''),
                    net: Joi.number().allow(0).optional(),
                    iva: Joi.number().allow(0).optional(),
                    total: Joi.number().allow(0).optional(),
                    payment: Joi.string().optional().allow(''),
                    paymentVoucher: Joi.string().optional().allow(''),
                    type: Joi.string().optional().allow(''),
                    products: Joi.array().items(
                        Joi.object().keys({
                            products: Joi.string().optional(),
                            quantity: Joi.number().allow(0).optional(),
                            value: Joi.number().allow(0).optional()
                        })
                    ).optional(),
                    services: Joi.array().items(
                        Joi.object().keys({
                            services: Joi.string().optional(),
                            quantity: Joi.number().allow(0).optional(),
                            value: Joi.number().allow(0).optional()
                        })
                    ).optional()
                })
            }
        }
    }
]