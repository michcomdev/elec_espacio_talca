import Sectors from '../../models/Sectors'
import dotEnv from 'dotenv'
import Joi from 'joi'
import Parameters from '../../models/Parameters'

dotEnv.config()

export default [
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
    },
    {
        method: 'POST',
        path: '/api/parametersSave',
        options: {
            description: 'create lecture',
            notes: 'create lecture',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload

                    let parameters = await Parameters.findById('6263033665a0afa3096a6a62')


                    parameters.expireDay = payload.expireDay
                    parameters.charge = payload.charge
                    parameters.meterValue = payload.meterValue
                    parameters.meterValueB = payload.meterValueB
                    parameters.consumptionLimit = payload.consumptionLimit
                    parameters.consumptionLimitValue = payload.consumptionLimitValue
                    parameters.email = payload.email
                    parameters.committee.rut = payload.committee.rut
                    parameters.committee.name = payload.committee.name
                    parameters.committee.category = payload.committee.category
                    parameters.committee.address = payload.committee.address
                    parameters.committee.acteco = payload.committee.acteco
                    parameters.committee.commune = payload.committee.commune
                    parameters.committee.city = payload.committee.city
                    parameters.committee.phone = payload.committee.phone
                    parameters.committee.siiCode = payload.committee.siiCode
                    parameters.municipality.code = payload.municipality.code
                    parameters.municipality.subsidyCode = payload.municipality.subsidyCode
                    parameters.subsidyLimit = payload.subsidyLimit
                    parameters.fees.percentageDebt = payload.fees.percentageDebt 
                    parameters.fees.percentageIrregular = payload.fees.percentageIrregular 
                    parameters.fees.reunion = payload.fees.reunion 
                    parameters.fees.vote = payload.fees.vote
                    parameters.text1 = payload.text1
                    parameters.text1b = payload.text1b
                    parameters.text2 = payload.text2
                    parameters.text3 = payload.text3
                    
                    const response = await parameters.save()

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
                    expireDay: Joi.number().allow(0),
                    charge: Joi.number().allow(0),
                    meterValue: Joi.number().allow(0),
                    meterValueB: Joi.number().allow(0),
                    consumptionLimit: Joi.number().allow(0),
                    consumptionLimitValue: Joi.number().allow(0),
                    email: Joi.string().allow(''),
                    committee: Joi.object().keys({
                        rut: Joi.string().allow(''),
                        name: Joi.string().allow(''),
                        category: Joi.string().allow(''),
                        address: Joi.string().allow(''),
                        acteco: Joi.string().allow(''),
                        commune: Joi.string().allow(''),
                        city: Joi.string().allow(''),
                        phone: Joi.string().allow(''),
                        siiCode: Joi.string().allow('')
                    }),
                    municipality: Joi.object().keys({
                        code: Joi.number().allow(0),
                        subsidyCode: Joi.number().allow(0)
                    }),
                    subsidyLimit: Joi.string().allow(''),
                    fees: Joi.object().keys({
                        percentageDebt: Joi.number().allow(0),
                        percentageIrregular: Joi.number().allow(0),
                        reunion: Joi.number().allow(0),
                        vote: Joi.number().allow(0)
                    }),
                    text1: Joi.string().allow(''),
                    text1b: Joi.string().allow(''),
                    text2: Joi.string().allow(''),
                    text3: Joi.string().allow('')
                })
            }
        }
    }
]