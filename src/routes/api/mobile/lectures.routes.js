import Lectures from '../../../models/Lectures'
import Member from '../../../models/Member'
import Joi from 'joi'
import dotEnv from 'dotenv'

dotEnv.config()

export default [
    {
        method: 'POST',
        path: '/api/mobile/lectureSave',
        options: {
            auth: false,
            description: 'create lecture',
            notes: 'create lecture',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload

                    let queryMember = {
                        waterMeters: {
                            $elemMatch: {
                                number: payload.number,
                                state: 'Activo'
                            }
                        }
                    }
                    let member = await Member.find(queryMember).lean()

                    if(member.length==0){
                        return 'Medidor no registrado'
                    }
                    
                    let query = {
                        users: payload.users,
                        //date: date,
                        member: member[0]._id,
                        lecture: payload.lecture
                    }

                    let lecture = new Lectures(query)
                    const response = await lecture.save()

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
                    users: Joi.string(),
                    number: Joi.number(),
                    lecture: Joi.number()
                })
            }
        }
    }
]