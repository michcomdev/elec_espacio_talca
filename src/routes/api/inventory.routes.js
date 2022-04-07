import Products from '../../models/Products'
import Sales from '../../models/Sales'
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
        path: '/api/inventory',
        options: {
            auth: false,
            description: 'get all inventory data',
            notes: 'return all data from inventory',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let inventory = await Products.find().lean()
                    
                    inventory = inventory.reduce((acc, el, i) => {
                        let lastPurchase = el.purchases.length - 1
                        acc.push({
                            _id: el._id,
                            image: el.image,
                            name: el.name,
                            stock: el.stock,
                            cost: el.purchases[lastPurchase].cost,
                            price: el.price,
                            status: el.status,
                            description: el.description,
                            purchases: el.purchases
                        })
                
                        return acc
                    }, [])


                    return inventory
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
        path: '/api/productSingle',
        options: {
            description: 'get product',
            notes: 'get product',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload   

                    let product = await Products.findById(payload.id)
                
                    return product

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
        path: '/api/productSave',
        options: {
            description: 'create product',
            notes: 'create product',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload   

                    //console.log(payload)

                    let product = new Products({
                        name: payload.name,
                        //image: payload.image,
                        stock: payload.stock,
                        price: payload.price,
                        status: payload.status,
                        description: payload.description,
                        purchases: payload.purchases
                    })

                    const response = await product.save()

                    let format = payload.image.split(';base64,')[0].split('/')[1]
                    let route = 'public/img/products/'+response._id+'.'+format

                    product.image = route
                    product.save()

                    new Promise(resolve => {
                        try {
                            async function main() {
                                //await writeFile('public/img/products/'+response._id+'.txt', payload.image);
                               
                                let base64Image = payload.image.split(';base64,').pop()
                                await writeFile(route, base64Image, {encoding: 'base64'}, function(err) {
                                    console.log('File created')
                                   // let productUpdate = await Products.findById(response._id)
                                })

                            }
                            main().catch(error => console.error(error));
                            resolve({ ok: "Foto subida" });
                        } catch (error) {
                            resolve({ err: "error en la subida" });
                        }
                    })

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
                    name: Joi.string().optional().allow(''),
                    image: Joi.string().optional().allow(''),
                    stock: Joi.number().allow(0).optional(),
                    price: Joi.number().allow(0).optional(),
                    status: Joi.string().optional().allow(''),
                    description: Joi.string().optional().allow(''),
                    purchases: Joi.array().items(
                        Joi.object().keys({
                            date: Joi.string().optional(),
                            cost: Joi.number().allow(0).optional(),
                            quantity: Joi.number().allow(0).optional()
                        })
                    )
                })
            }
        }
    },
    {
        method: 'POST',
        path: '/api/productUpdate',
        options: {
            description: 'update product',
            notes: 'update product',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload   

                    let product = await Products.findById(payload.id)
                   
                    product.name = payload.name
                    product.image = payload.image
                    product.stock = payload.stock
                    product.price = payload.price
                    product.status = payload.status
                    product.description = payload.description
                    product.purchases = payload.purchases

                    const response = await product.save()

                    let format = payload.image.split(';base64,')[0].split('/')[1]
                    let route = 'public/img/products/'+response._id+'.'+format

                    product.image = route
                    product.save()

                    new Promise(resolve => {
                        try {
                            async function main() {
                                //await writeFile('public/img/products/'+response._id+'.txt', payload.image);

                                let base64Image = payload.image.split(';base64,').pop()
                                await writeFile(route, base64Image, {encoding: 'base64'}, function(err) {
                                    console.log('File created')
                                   // let productUpdate = await Products.findById(response._id)
                                })

                            }
                            main().catch(error => console.error(error));
                            resolve({ ok: "Imagen subida" });
                        } catch (error) {
                            resolve({ err: "error en la subida" });
                        }
                    })

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
                    name: Joi.string().optional().allow(''),
                    image: Joi.string().optional().allow(''),
                    stock: Joi.number().allow(0).optional(),
                    price: Joi.number().allow(0).optional(),
                    status: Joi.string().optional().allow(''),
                    description: Joi.string().optional().allow(''),
                    purchases: Joi.array().items(
                        Joi.object().keys({
                            date: Joi.string().optional(),
                            cost: Joi.number().allow(0).optional(),
                            quantity: Joi.number().allow(0).optional()
                        })
                    )
                })
            }
        }
    },
    {
        method: 'POST',
        path: '/api/productSales',
        options: {
            description: 'get sales',
            notes: 'get sales',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload
                    let query = {
                        products: {
                            $elemMatch: {
                                products: payload.id
                            }
                        }
                    }

                    let sales = await Sales.find(query).lean()
                    let total = 0
                    for(let i=0; i<sales.length; i++){
                        for(let j=0; j<sales[i].products.length; j++){
                            if(sales[i].products[j].products==payload.id){
                                total += sales[i].products[j].quantity
                            }
                        }
                    }
                
                    return total

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
    }
]