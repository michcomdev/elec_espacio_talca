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
        path: '/api/report',
        options: {
            auth: false,
            description: 'get all report data',
            notes: 'return all data from report',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let inventory = await Products.find().lean()

                    let sales = await Sales.find().lean()
                    
                    inventory = inventory.reduce((acc, el, i) => {
                        let cost = 0, sells = 0, price = 0, profitValue = 0, profitPercentage = 0
                        for(let i=0; i<el.purchases.length; i++){
                            cost += el.purchases[i].cost
                        }
                        if(cost>0){
                            cost = cost / el.purchases.length
                        }

                        for(let j=0; j<sales.length; j++){
                            for(let k=0; k<sales[j].products.length; k++){
                                if(sales[j].products[k].products.toString()==el._id.toString()){
                                    sells += sales[j].products[k].quantity
                                    price += sales[j].products[k].value
                                }
                            }
                        }
                        if(sells>0){
                            price = parseInt(price / sells)
                            profitValue = parseInt(price - cost)
                            profitPercentage = parseInt((price - cost) * 100 / cost)

                        }else{
                            price = el.price
                        }


                        acc.push({
                            _id: el._id,
                            image: el.image,
                            name: el.name,
                            stock: el.stock,
                            cost: cost,
                            price: price,
                            status: el.status,
                            description: el.description,
                            purchases: el.purchases,
                            sells: sells,
                            profitValue: profitValue,
                            profitPercentage: profitPercentage
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
    }
]