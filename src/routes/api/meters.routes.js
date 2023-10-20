import Joi from 'joi'
import Meters from '../../models/Meters'
import Switchboards from '../../models/Switchboards'
import Type from '../../models/Types'
import dotEnv from 'dotenv'

dotEnv.config()

export default [

    {
        method: 'POST',
        path: '/api/postMeter',
        options: {
            description: 'get all users data',
            notes: 'return all data from users',
            tags: ['api'],
            handler: async (request, h) => {
                console.log(request.payload);
                let payload = request.payload
                try {
                    let dataQuery = {
                        name: payload.name,
                        address: payload.address,
                        clients: payload.clients,
                        serialNumber: payload.serialNumber
                    }
                    const newUser = new Meters(dataQuery)
                    await newUser.save()

                    let switchboartId = payload.switchId
                    let member = await Switchboards.findById(switchboartId)

                    member.meters.push(newUser._id)

                    const response = await member.save()
                    console.log("meter added", response);

                    // Assuming Meters constructor returns a promise

                    // If all goes well, you can return a success response here
                    return { success: true };
                } catch (error) {
                    console.error(error);

                    // Return an error response
                    return h.response({
                        error: 'Internal Server Error',
                    }).code(500);
                }
            },
        },
    },
    {
        method: 'POST',
        path: '/api/removeMeterById',
        handler: (request, h) => {
            const { switchboardId, meterId } = request.payload;

            // Encuentra el switchboard por su ID
            const switchboard = switchboards.find(s => s.id === switchboardId);

            if (!switchboard) {
                return { error: 'Switchboard no encontrado' };
            }

            // Elimina el medidor por su ID
            const index = switchboard.meters.indexOf(meterId);
            if (index !== -1) {
                switchboard.meters.splice(index, 1);
                return { message: 'Medidor eliminado con éxito' };
            } else {
                return { error: 'Medidor no encontrado en el switchboard' };
            }
        }
    },





















    {
        method: 'GET',
        path: '/api/enterprises',
        options: {
            description: 'get all enterprises data',
            notes: 'return all data from enterprises',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let enterprises = await Enterprise.find().lean().populate(['types'])
                    for (let i = 0; i < enterprises.length; i++) {
                        enterprises[i].type = enterprises[i].types.name
                    }
                    return enterprises
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
        path: '/api/enterprises',
        options: {
            description: 'save enterprise',
            notes: 'create or modify enterprise',
            tags: ['api'],
            handler: async (request) => {
                try {
                    let payload = request.payload
                    if (payload._id) { // modificar empresa
                        let findEnterprise = await Enterprise.findById(payload._id)

                        findEnterprise.rut = payload.rut
                        findEnterprise.fantasyName = payload.fantasyName
                        findEnterprise.name = payload.name
                        findEnterprise.address = payload.address
                        findEnterprise.types = payload.types
                        findEnterprise.phone = payload.phone
                        findEnterprise.email = payload.email
                        findEnterprise.representRUT = payload.representRUT
                        findEnterprise.representName = payload.representName
                        findEnterprise.status = payload.status

                        await findEnterprise.save()

                        return findEnterprise

                    } else {  // crear empresa
                        // const originalPass = payload.password
                        payload.status = 'enabled'

                        let newEnterprise = new Enterprise(payload)

                        await newEnterprise.save()

                        return newEnterprise
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
                    representRUT: Joi.string().required(),
                    representName: Joi.string().required(),
                    status: Joi.string().required()
                })
            }
        }
    }
]