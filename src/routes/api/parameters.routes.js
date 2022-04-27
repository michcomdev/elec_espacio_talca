import Sectors from '../../models/Sectors'
import Villages from '../../models/Villages'
import Towns from '../../models/Towns'
import dotEnv from 'dotenv'
import Parameters from '../../models/Parameters'

dotEnv.config()

export default [
    {
        method: 'GET',
        path: '/api/sectors',
        options: {
            description: 'get all container types data',
            notes: 'return all data from container types',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let sectors = await Sectors.find().lean()
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
        method: 'GET',
        path: '/api/villages',
        options: {
            description: 'get all villages data',
            notes: 'return all data from villages types',
            tags: ['api'],
            handler: async (request, h) => {
                try {                    
                    let villages = await Villages.find().lean()
                    return villages
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
        path: '/api/towns',
        options: {
            description: 'get all map positions data',
            notes: 'return all data from map positions',
            tags: ['api'],
            handler: async (request, h) => {
                try {                    
                    let towns = await Towns.find().lean()
                    return towns
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
        path: '/api/parameters',
        options: {
            description: 'get all parameters data',
            notes: 'return all data from parameters',
            tags: ['api'],
            handler: async (request, h) => {
                try {                    
                    let parameters = await Parameters.findById('6263033665a0afa3096a6a62')
                    return parameters
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