import Sectors from '../../models/Sectors'
import Joi from 'joi'
import dotEnv from 'dotenv'

dotEnv.config()

export default [
    {
        method: 'GET',
        path: '/api/sectors',
        options: {
            description: 'get all sectors data',
            notes: 'return all data from sectors',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let sectors = await Sectors.find().lean()
                    sectors.sort((a, b) => (a.name > b.name) * 2 - 1)
                    
                    return sectors
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
        path: '/api/createSector',
        options: {
            description: 'create sector',
            notes: 'create sector',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload

                    let service = new Sectors({
                        name: payload.name
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
                    name: Joi.string().optional().allow('')
                })
            }
        }
    },
    {
        method: 'POST',
        path: '/api/sectorUpdate',
        options: {
            description: 'update sector',
            notes: 'update sector',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload

                    let sector = await Sectors.findById(payload._id)

                    sector.name = payload.name

                    const response = await sector.save()

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
                    _id: Joi.string().optional().allow(''),
                    name: Joi.string().optional().allow('')
                })
            }
        }
    }
]