import Joi from 'joi'
import User from '../../models/User'
import dotEnv from 'dotenv'
//import sgMail from '@sendgrid/mail'
// import nodemailer from 'nodemailer'
// import Cryptr from 'cryptr'
import { hashPassword } from '../../utils/passwordHandler'

dotEnv.config()

// const cryptr = new Cryptr(process.env.SECRET_KEY)

//sgMail.setApiKey(process.env.SENDGRID_API_KEY)

export default [
    {
        method: 'GET',
        path: '/api/users',
        options: {
            description: 'get all users data',
            notes: 'return all data from users',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let users = await User.find().lean()
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
        path: '/api/users',
        options: {
            description: 'save user',
            notes: 'create or modify user',
            tags: ['api'],
            handler: async (request) => {
                try {
                    let payload = request.payload
                    if (payload._id) { // modificar usuario
                        let findUser = await User.findById(payload._id)

                        findUser.name = payload.name
                        findUser.lastname = payload.lastname
                        findUser.email = payload.email
                        findUser.status = payload.status
                        findUser.scope = payload.scope
                        if(payload.password){
                            findUser.password = payload.password
                        }
                        // findUser.permissions = {
                        //     superadmin: payload.permissions.superadmin
                        // }

                        await findUser.save()

                        return findUser

                    } else {  // crear usuario
                        // const originalPass = payload.password
                        payload.status = 'enabled'
                        payload.permissions = {
                            superadmin: true
                        }
                        payload.password = hashPassword(payload.password)

                        let newUser = new User(payload)

                        await newUser.save()

                        // await sendEmail(payload.email, payload.name, originalPass)

                        return newUser
                    }

                } catch (error) {
                    console.log(error)

                    return {
                        error: 'Ha ocurrido un error al guardar datos de usuario'
                    }
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/api/usersDelete',
        options: {
            description: 'delete user',
            notes: 'delete user',
            tags: ['api'],
            handler: async (request) => {
                try {
                    let payload = request.payload

                    console.log(payload)
                    if (payload._id) { // modificar usuario
                        await User.deleteOne(payload._id)


                        return true

                    }

                } catch (error) {
                    console.log(error)

                    return {
                        error: 'Ha ocurrido un error al guardar datos de usuario'
                    }
                }
            }
        }
    },
    {
        method: 'GET',
        path: '/api/usersEnabled',
        options: {
            description: 'get all users data',
            notes: 'return all data from users',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let users = await User.find({
                        status: 'enabled'
                    }).lean()
                    return users
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