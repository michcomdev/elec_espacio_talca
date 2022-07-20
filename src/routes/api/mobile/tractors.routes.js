import Tractor from '../../../models/Tractor'
import Joi from 'joi'
import dotEnv from 'dotenv'

dotEnv.config()

export default [
    { ////////DEMO COPEVAL////////////
        method: 'GET',
        path: '/api/mobile/tractors',
        options: {
            auth: 'jwt',
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
        path: '/api/mobile/tractorsSingle/{id}',
        options: {
            auth: 'jwt',
            description: 'get single tractor data',
            notes: 'return single data from tractor',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    var ObjectId = require('mongoose').Types.ObjectId
                    if(ObjectId.isValid(request.params.id)){
                    
                        let tractors = await Tractor.findOne({_id: request.params.id }).lean()
                        if(tractors){
                            return tractors
                        }else{
                            return 'NOT REGISTERED'
                        }


                    }else{
                        return 'NOT VALID'
                    }
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