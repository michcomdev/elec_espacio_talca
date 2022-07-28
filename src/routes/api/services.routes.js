import Services from '../../models/Services'
import Joi from 'joi'
import dotEnv from 'dotenv'

dotEnv.config()

export default [
    {
        method: 'GET',
        path: '/api/services',
        options: {
            auth: false,
            description: 'get all services data',
            notes: 'return all data from services',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let services = await Services.find().lean()
                    
                    return services
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
        path: '/api/servicesByFilter',
        options: {
            description: 'get services',
            notes: 'get services',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload
                    let query = {
                        type: payload.type
                    }
                    let service = await Services.find(query)
                
                    return service

                } catch (error) {
                    console.log(error)

                    return h.response({
                        error: 'Internal Server Error'
                    }).code(500)
                }
            },
            validate: {
                payload: Joi.object().keys({
                    type: Joi.string().optional().allow('')
                })
            }
        }
    },
    {
        method: 'POST',
        path: '/api/serviceSingle',
        options: {
            description: 'get service',
            notes: 'get service',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload

                    let service = await Services.findById(payload.id)
                
                    return service

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
        path: '/api/serviceSave',
        options: {
            description: 'create service',
            notes: 'create service',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload

                    let service = new Services({
                        name: payload.name,
                        type: payload.type,
                        status: payload.status,
                        description: payload.description
                    })

                    const response = await service.save()

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
                    name: Joi.string().optional().allow(''),
                    type: Joi.string().optional().allow(''),
                    status: Joi.string().optional().allow(''),
                    description: Joi.string().optional().allow('')
                })
            }
        }
    },
    {
        method: 'POST',
        path: '/api/serviceUpdate',
        options: {
            description: 'update service',
            notes: 'update service',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload   

                    let service = await Services.findById(payload.id)
                   
                    service.name = payload.name
                    service.type = payload.type
                    service.status = payload.status
                    service.description = payload.description
                    
                    const response = await service.save()

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
                    name: Joi.string().optional().allow(''),
                    type: Joi.string().optional().allow(''),
                    status: Joi.string().optional().allow(''),
                    description: Joi.string().optional().allow('')
                })
            }
        }
    }
]