import Lectures from '../../../models/Lectures'
import Member from '../../../models/Member'
import Joi from 'joi'
import dotEnv from 'dotenv'

dotEnv.config()

export default [
    {
        method: 'POST',
        path: '/api/mobile/lectureSave',
        options: {
            auth: 'jwt',
            description: 'create lecture',
            notes: 'create lecture',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload
                    let credentials = request.auth.credentials

                    let queryMember = {
                        number: payload.number
                        // waterMeters: {
                        //     $elemMatch: {
                        //         number: payload.number,
                        //         state: 'Activo'
                        //     }
                        // }
                    }
                    let member = await Member.find(queryMember).lean()

                    if (member.length == 0) {
                        return 'Medidor no registrado'
                    }

                    let date = new Date()
                    let year = (payload.year) ? payload.year : date.getFullYear()
                    let month = (payload.month) ? payload.month : date.getMonth() + 1
                    let lectures = await Lectures.find({ members: member[0]._id, month: month, year: year }).lean()

                    if (lectures[0]) {
                        let lecture = await Lectures.findById(lectures[0]._id)
                        if(payload.lectureNewStart !== undefined){
                            lecture.logs.push({
                                users: credentials.id,
                                date: date,
                                lecture: payload.lecture,
                                lectureNewStart: payload.lectureNewStart,
                                lectureNewEnd: payload.lectureNewEnd,
                                observation: payload.observation
                            })
                        }else{
                            lecture.logs.push({
                                users: credentials.id,
                                date: date,
                                lecture: payload.lecture,
                                observation: payload.observation
                            })
                        }
                        const response = await lecture.save()
                        return response

                    } else {
                        let query

                        if(payload.lectureNewStart !== undefined){
                            query = {
                                members: member[0]._id,
                                month: month,
                                year: year,
                                logs: [{
                                    users: credentials.id,
                                    date: date,
                                    lecture: payload.lecture,
                                    lectureNewStart: payload.lectureNewStart,
                                    lectureNewEnd: payload.lectureNewEnd,
                                    observation: payload.observation
                                }]
                            }
                        }else{
                            query = {
                                members: member[0]._id,
                                month: month,
                                year: year,
                                logs: [{
                                    users: credentials.id,
                                    date: date,
                                    lecture: payload.lecture,
                                    observation: payload.observation
                                }]
                            }
                        }
                        let lecture = new Lectures(query)
                        const response = await lecture.save()
                        return response
                    }

                    return 'Error'

                } catch (error) {
                    console.log(error)

                    return h.response({
                        error: 'Internal Server Error'
                    }).code(500)
                }
            },
            validate: {
                payload: Joi.object().keys({
                    number: Joi.number(),
                    lecture: Joi.number().allow(0),
                    lectureNewStart: Joi.number().allow(0).optional(),
                    lectureNewEnd: Joi.number().allow(0).optional(),
                    observation: Joi.string().optional().allow(''),
                    year: Joi.number().allow(0).optional(),
                    month: Joi.number().allow(0).optional()
                })
            }
        }
    }
]