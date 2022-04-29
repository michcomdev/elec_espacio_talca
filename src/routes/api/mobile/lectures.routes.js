import Lectures from '../../../models/Lectures'
import Joi from 'joi'
import dotEnv from 'dotenv'

dotEnv.config()

export default [
    {
        method: 'POST',
        path: '/api/mobile/lectureSave',
        options: {
            auth: false,
            description: 'create lecture',
            notes: 'create lecture',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload   
                    let date = new Date()
                    let query = {
                        users: payload.users,
                        date: date,
                        member: payload.member,
                        lecture: payload.lecture
                    }

                    let lecture = new Lectures(query)
                    const response = await lecture.save()

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
                    users: Joi.string().allow(''),
                    member: Joi.string().allow(''),
                    lecture: Joi.number().allow(0)
                })
            }
        }
    }
]