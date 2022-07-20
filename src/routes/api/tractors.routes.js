import Tractor from '../../models/Tractor'
import Joi from 'joi'
import dotEnv from 'dotenv'

dotEnv.config()

export default [
    { ////////DEMO COPEVAL////////////
        method: 'GET',
        path: '/api/tractors',
        options: {
            description: 'get all tractors data',
            notes: 'return all data from tractors',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                   
                    let tractors = await Tractor.find().lean()
                    return tractors

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
        method: 'GET',
        path: '/api/tractorsSingle/{id}',
        options: {
            description: 'get single tractor data',
            notes: 'return single data from tractor',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    
                    let tractors = await Tractor.findOne({_id: request.params.id }).lean()
                    return tractors
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