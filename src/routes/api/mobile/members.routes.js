import Member from '../../../models/Member'
import Joi from 'joi'
import dotEnv from 'dotenv'

dotEnv.config()

export default [
    {
        method: 'GET',
        path: '/api/mobile/members',
        options: {
            auth: 'jwt',
            description: 'get all members data',
            notes: 'return all data from members',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let members = await Member.find().lean()
                    return members
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
        path: '/api/mobile/memberSingle',
        options: {
            auth: 'jwt',
            description: 'get one member',
            notes: 'get one member',
            tags: ['api'],
            handler: async (request, h) => {
                try {

                    let payload = request.payload   
                    let member = await Member.findById(payload.id)
                    return member

                } catch (error) {
                    console.log(error)

                    return h.response({
                        error: 'Internal Server Error'
                    }).code(500)
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