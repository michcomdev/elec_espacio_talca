import Joi from 'joi'
import Clients from '../../models/Clients'
import dotEnv from 'dotenv'
//import sgMail from '@sendgrid/mail'
// import nodemailer from 'nodemailer'
// import Cryptr from 'cryptr'
// import { hashPassword } from '../../utils/passwordHandler'

dotEnv.config()

// const cryptr = new Cryptr(process.env.SECRET_KEY)

//sgMail.setApiKey(process.env.SENDGRID_API_KEY)

export default [
    {
        method: 'GET',
        path: '/api/getAllClients',
        options: {
            description: 'get all users data',
            notes: 'return all data from users',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let users = await Clients.find().lean()
                    return users
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
        path: '/api/postClient',
        options: {
            description: 'Create new client',
            notes: 'return true or false if client is created',
            tags: ['api'],
            handler: async (request, h) => {
                console.log("aqui estoy 3333", request.payload);

                try {
                    let queryClient = request.payload
                    console.log("aaaaaaaa", queryClient);
                    let clientSave = new Clients(queryClient)
                    const res = await clientSave.save()
                    console.log("resss", res);
                    return res
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
        path: '/api/updateClientById',
        options: {
            description: 'get all users data',
            notes: 'return all data from users',
            tags: ['api'],
            handler: async (request, h) => {
                // console.log("request", request.payload);
                let clientData = {
                    name: request.payload.name,
                    lastname: request.payload.lastname,
                    rut: request.payload.rut,
                    phoneNumber: request.payload.phoneNumber
                }
                let clientId = request.payload.clientId
                try {
                    // console.log("client data == ", clientData);
                    await Clients.findByIdAndUpdate(clientId, clientData)
                    return true
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
        path: '/api/DeleteClientById',
        options: {
            description: 'Delete client',
            notes: 'Client is deleted by _id',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    const idClient = request.payload;
                    const result = await Clients.deleteOne({ _id: idClient });
                    console.log("result", result);
                    if (result.deletedCount === 1) {
                        // Éxito: Se eliminó el cliente
                        return true;
                    } else {
                        // El cliente no se encontró o no se eliminó
                        return h.response({
                            error: 'Cliente no encontrado o no se pudo eliminar'
                        }).code(404);
                    }
                } catch (error) {
                    console.error(error);
                    return h.response({
                        error: 'Error interno del servidor'
                    }).code(500);
                }
            }
        }
    }

]