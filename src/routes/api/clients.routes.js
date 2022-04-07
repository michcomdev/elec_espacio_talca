import Joi from 'joi'
import Client from '../../models/Client'
import dotEnv from 'dotenv'

dotEnv.config()

export default [
    {
        method: 'GET',
        path: '/api/clients',
        options: {
            description: 'get all clients data',
            notes: 'return all data from clients',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let clients = await Client.find().lean()
                    return clients
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
        path: '/api/clients',
        options: {
            description: 'save client',
            notes: 'create or modify client',
            tags: ['api'],
            handler: async (request) => {
                try {
                    let payload = request.payload
                    console.log('payload', payload)
                    if (payload._id) { // modificar cliente
                        let findClient = await Client.findById(payload._id)

                        findClient.name = payload.name
                        findClient.lastname = payload.lastname
                        findClient.email = payload.email
                        findClient.status = payload.status

                        await findClient.save()

                        return findClient

                    } else {  // crear cliente
                        // const originalPass = payload.password
                        payload.status = 'enabled'

                        let newClient = new Client(payload)

                        await newClient.save()

                        return newClient
                    }

                } catch (error) {
                    console.log(error)

                    return {
                        error: 'Ha ocurrido un error al guardar datos de usuario'
                    }
                }
            },
            validate: {
                payload: Joi.object().keys({
                    _id: Joi.string().optional(),
                    rut: Joi.string().required(),
                    name: Joi.string().required(),
                    phone: Joi.string().optional().allow(''),
                    email: Joi.string().optional().allow(''),
                    status: Joi.string().required()
                })
            }
        }
    }
]