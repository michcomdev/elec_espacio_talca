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
            description: 'get all users data',
            notes: 'return all data from users',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    console.log(request.payload);
                    // let users = await Clients.find().lean()
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
]