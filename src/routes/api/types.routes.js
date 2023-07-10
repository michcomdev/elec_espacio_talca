import Joi from 'joi'
import Type from '../../models/Types'
import dotEnv from 'dotenv'

dotEnv.config()

export default [
    {
        method: 'GET',
        path: '/api/types',
        options: {
            description: 'get all types data',
            notes: 'return all data from types',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let types = await Type.find().lean()
                    return types
                } catch (error) {
                    console.log(error)

                    return h.response({
                        error: 'Internal Server Error'
                    }).code(500)
                }
            }
        }
    }
]