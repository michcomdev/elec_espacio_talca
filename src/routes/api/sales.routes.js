import Sales from '../../models/Sales'
import Products from '../../models/Products'
import Joi from 'joi'
import dotEnv from 'dotenv'

const fs = require("fs")
const { promisify } = require("util");
const writeFile = promisify(fs.writeFile)
const readFile = promisify(fs.readFile)

dotEnv.config()

export default [
    {
        method: 'GET',
        path: '/api/sales',
        options: {
            auth: false,
            description: 'get all sales data',
            notes: 'return all data from sales',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let sales = await Sales.find().lean()
                    
                    /*inventory = inventory.reduce((acc, el, i) => {
                        let lastPurchase = el.purchases.length - 1
                        acc.push({
                            _id: el._id,
                            name: el.name,
                            stock: el.stock,
                            cost: el.purchases[lastPurchase].cost,
                            price: el.price,
                            status: el.status,
                            description: el.description,
                            purchases: el.purchases
                        })
                
                        return acc
                    }, [])*/


                    return sales
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
        path: '/api/saleSingle',
        options: {
            description: 'get one sale',
            notes: 'get one sale',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload   

                    let sale = await Sales.findById(payload.id).lean().populate(['products.products','services.services'])
                
                    return sale

                } catch (error) {
                    console.log(error)

                    return h.response({
                        error: 'Internal Server Error'
                    }).code(500)
                }
            },
            validate: {
                payload: Joi.object().keys({
                    id: Joi.string().optional().allow('')
                })
            }
        }
    },
    {
        method: 'POST',
        path: '/api/saleSave',
        options: {
            description: 'create sale',
            notes: 'create sale',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload   

                    console.log(payload)
                    let query = {
                        date: payload.date,
                        rut: payload.rut,
                        name: payload.name,
                        address: payload.address,
                        status: payload.status,
                        net: payload.net,
                        iva: payload.iva,
                        total: payload.total,
                        payment: payload.payment
                    }

                    if(payload.products){
                        query.products = payload.products
                    }

                    if(payload.services){
                        query.services = payload.services
                    }

                    let product = new Sales(query)
                    const response = await product.save()

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
                    date: Joi.string().optional().allow(''),
                    rut: Joi.string().optional().allow(''),
                    name: Joi.string().optional().allow(''),
                    address: Joi.string().optional().allow(''),
                    status: Joi.string().optional().allow(''),
                    net: Joi.number().allow(0).optional(),
                    iva: Joi.number().allow(0).optional(),
                    total: Joi.number().allow(0).optional(),
                    payment: Joi.string().optional().allow(''),
                    products: Joi.array().items(
                        Joi.object().keys({
                            products: Joi.string().optional(),
                            quantity: Joi.number().allow(0).optional(),
                            value: Joi.number().allow(0).optional()
                        })
                    ).optional(),
                    services: Joi.array().items(
                        Joi.object().keys({
                            services: Joi.string().optional(),
                            quantity: Joi.number().allow(0).optional(),
                            value: Joi.number().allow(0).optional()
                        })
                    ).optional()
                })
            }
        }
    },
    {
        method: 'POST',
        path: '/api/saleUpdate',
        options: {
            description: 'update sale',
            notes: 'update sale',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload   

                    let sales = await Sales.findById(payload.id)
                   
                    sales.date = payload.date
                    sales.rut = payload.rut
                    sales.name = payload.name
                    sales.address = payload.address
                    sales.status = payload.status
                    sales.net = payload.net
                    sales.iva = payload.iva
                    sales.total = payload.total
                    sales.payment = payload.payment

                    if(payload.products){
                        sales.products = payload.products
                    }

                    if(payload.services){
                        sales.services = payload.services
                    }

                    const response = await sales.save()

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
                    id: Joi.string().optional().allow(''),
                    date: Joi.string().optional().allow(''),
                    rut: Joi.string().optional().allow(''),
                    name: Joi.string().optional().allow(''),
                    address: Joi.string().optional().allow(''),
                    status: Joi.string().optional().allow(''),
                    net: Joi.number().allow(0).optional(),
                    iva: Joi.number().allow(0).optional(),
                    total: Joi.number().allow(0).optional(),
                    payment: Joi.string().optional().allow(''),
                    products: Joi.array().items(
                        Joi.object().keys({
                            products: Joi.string().optional(),
                            quantity: Joi.number().allow(0).optional(),
                            value: Joi.number().allow(0).optional()
                        })
                    ).optional(),
                    services: Joi.array().items(
                        Joi.object().keys({
                            services: Joi.string().optional(),
                            quantity: Joi.number().allow(0).optional(),
                            value: Joi.number().allow(0).optional()
                        })
                    ).optional()
                })
            }
        }
    }
]