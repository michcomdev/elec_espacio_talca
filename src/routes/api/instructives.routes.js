import Joi from 'joi'
import Instructive from '../../models/Instructives'
import Type from '../../models/Types'
import dotEnv from 'dotenv'

dotEnv.config()

export default [
    {
        method: 'GET',
        path: '/api/instructives',
        options: {
            description: 'get all instructives data',
            notes: 'return all data from instructives',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let instructives = await Instructive.find().lean().populate(['types'])
                    for(let i=0; i<instructives.length; i++){
                        instructives[i].type = instructives[i].types.name
                    }
                    return instructives
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
        path: '/api/instructives',
        options: {
            description: 'save instructive',
            notes: 'create or modify instructive',
            tags: ['api'],
            handler: async (request) => {
                try {
                    let payload = request.payload
                    if (payload._id) { // modificar empresa
                        let findInstructive = await Instructive.findById(payload._id)

                        findInstructive.rut = payload.rut
                        findInstructive.fantasyName = payload.fantasyName
                        findInstructive.name = payload.name
                        findInstructive.address = payload.address
                        findInstructive.types = payload.types
                        findInstructive.phone = payload.phone
                        findInstructive.email = payload.email
                        findInstructive.status = payload.status

                        await findInstructive.save()

                        return findInstructive

                    } else {  // crear empresa
                        // const originalPass = payload.password
                        payload.status = 'enabled'

                        let newInstructive = new Instructive(payload)

                        await newInstructive.save()

                        return newInstructive
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
                    fantasyName: Joi.string().required(),
                    name: Joi.string().required(),
                    address: Joi.string().optional().allow(''),
                    types: Joi.string().optional().allow(''),
                    phone: Joi.string().optional().allow(''),
                    email: Joi.string().optional().allow(''),
                    status: Joi.string().required()
                })
            }
        }
    }
]