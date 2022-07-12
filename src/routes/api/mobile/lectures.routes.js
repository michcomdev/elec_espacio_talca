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

                    /*let query = {
                        users: credentials.id,
                        //date: date,
                        member: member[0]._id,
                        lecture: payload.lecture
                    }*/

                    let date = new Date()
                    let lectures = await Lectures.find({ member: member[0]._id, month: date.getMonth() + 1, year: date.getFullYear() }).lean()

                    if (lectures[0]) {
                        let lecture = await Lectures.findById(lectures[0]._id)
                        lecture.logs.push({
                            users: credentials.id,
                            date: date,
                            lecture: payload.lecture,
                            observation: payload.observation
                        })
                        const response = await lecture.save()
                        return response

                    } else {
                        let query = {
                            member: member[0]._id,
                            month: date.getMonth() + 1,
                            year: date.getFullYear(),
                            logs: [{
                                users: credentials.id,
                                date: date,
                                lecture: payload.lecture
                            }]
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
                    lecture: Joi.number(),
                    observation: Joi.string().optional().allow('')
                })
            }
        }
    }
]