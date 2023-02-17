import Joi from 'joi'
import dotEnv from 'dotenv'
import Member from '../../models/Member'
import Lectures from '../../models/Lectures'
import Invoices from '../../models/Invoices'
import Payments from '../../models/Payments'

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
                            if(cost==0) cost=1
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
    },  
    {
        method: 'POST',
        path: '/api/lecturesReport',
        options: {
            description: 'get all lectures from single member',
            notes: 'get all lectures from single member',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload

                    let order = {orderIndex: 'asc'}
                    if(payload.order){
                        if(payload.order=="2"){
                            order = {number: 'asc'}
                        }else if(payload.order=="3"){
                            order = {'personal.lastname1': 'asc'}
                        }else if(payload.order=="4"){
                            order = {'personal.name': 'asc'}
                        }else if(payload.order=="5"){
                            order = {'address.address': 'asc'}
                        }
                    }

                    let members = await Member.find({'address.sector': payload.sector}).populate(['address.sector']).sort(order).lean()
                    let array = []
                    for(let i=0; i<members.length ; i++){
                        array.push(members[i]._id)
                    }

                    let query = {}, queryBefore = {}
                    if(payload.by=='year'){
                        query = {
                            members: { $in: array },
                            year: payload.year
                        }
                        queryBefore = {
                            members: { $in: array },
                            year: parseInt(payload.year) - 1,
                            month: 12
                        }
                    }else{
                        const d = new Date()
                        let actualMonth = d.getMonth() + 1
                        let actualYear = d.getFullYear()

                        let queryCheck = {
                            members: { $in: array },
                            month: actualMonth,
                            year: actualYear
                        }

                        let lecturesCheck = await Lectures.find(queryCheck).lean()
                        if(lecturesCheck){
                            if(lecturesCheck.length==0){
                                actualMonth -= 1
                                if(actualMonth==0){
                                    actualMonth = 12
                                    actualYear -= 1
                                }
                            }
                        }

                        let arrayMonth1 = [], arrayMonth2 = [], yearOnUse = 'actual'

                        for(let m=0; m<payload.month; m++){
                            if(yearOnUse=='actual'){
                                arrayMonth1.push(actualMonth)
                            }else{
                                arrayMonth2.push(actualMonth)
                            }
                            actualMonth--
                            if(actualMonth==0){
                                actualMonth = 12
                                yearOnUse = 'last'
                            }
                        }
                        
                        let arrayMonthFinal = [{
                            year: actualYear,
                            month: {
                                $in: arrayMonth1
                            }
                        }]
                        if(arrayMonth2.length>0){

                            actualYear--
                            arrayMonthFinal.push({
                                year: actualYear,
                                month: {
                                    $in: arrayMonth2
                                }
                            })
                        }

                        query = {
                            members: { $in: array },
                            $or: arrayMonthFinal
                        }

                        let lastYear = actualYear

                        if(actualMonth==1){
                            lastYear -= 1
                            actualMonth = 12
                        }
                        queryBefore = {
                            members: { $in: array },
                            year: lastYear,
                            month: actualMonth
                        }
                    }
                   
                    let lectures = await Lectures.find(query).lean()
                    let lecturesBefore = await Lectures.find(queryBefore).lean()

                    for(let j=0;j<members.length;j++){

                        members[j].lectures = new Array(13)
                        members[j].lecturesNew = new Array(13)
                        members[j].consumption = new Array(13)

                        let arrayBefore = lecturesBefore.find(x => x.members.toString() === members[j]._id.toString())
                        if(arrayBefore){
                            if(payload.type=='consumption'){
                                if(!isNaN(arrayBefore.logs[arrayBefore.logs.length-1].lectureNewEnd)){
                                    members[j].lecturesNew[0] = arrayBefore.logs[arrayBefore.logs.length-1].lectureNewEnd - arrayBefore.logs[arrayBefore.logs.length-1].lectureNewStart
                                }
                            }
                            members[j].lectures[0] = arrayBefore.logs[arrayBefore.logs.length-1].lecture
                        }
                        

                        let array = lectures.filter(x => x.members.toString() === members[j]._id.toString())
                        for(let k=0;k<array.length;k++){
                            if(payload.type=='consumption'){
                                if(!isNaN(array[k].logs[array[k].logs.length-1].lectureNewEnd)){
                                    members[j].lecturesNew[array[k].month] = array[k].logs[array[k].logs.length-1].lectureNewEnd - array[k].logs[array[k].logs.length-1].lectureNewStart
                                }
                            }
                            members[j].lectures[array[k].month] = array[k].logs[array[k].logs.length-1].lecture
                        }

                        if(payload.type=='consumption'){
                            let prom = 0, subtotal = 0
                            for(let l=1;l<members[j].lectures.length;l++){

                                if(payload.by=='year'){
                                    if(!isNaN(members[j].lectures[l]) && !isNaN(members[j].lectures[l-1])){
                                        members[j].consumption[l] = (members[j].lectures[l] - ((members[j].lecturesNew[l-1]) ? members[j].lecturesNew[l-1] : members[j].lectures[l-1])) + ((members[j].lecturesNew[l]) ? members[j].lecturesNew[l] : 0)
                                        subtotal += members[j].consumption[l]
                                        prom++
                                    }
                                }else{
                                    if(l==1){
                                        if(!isNaN(members[j].lectures[l]) && !isNaN(members[j].lectures[12])){
                                            members[j].consumption[l] = (members[j].lectures[l] - ((members[j].lecturesNew[12]) ? members[j].lecturesNew[12] : members[j].lectures[12])) + ((members[j].lecturesNew[l]) ? members[j].lecturesNew[l] : 0)
                                            subtotal += members[j].consumption[l]
                                            prom++
                                        }
                                    }else if(members[j].lectures[l-1]==null){
                                        if(!isNaN(members[j].lectures[l]) && !isNaN(members[j].lectures[0])){
                                            members[j].consumption[l] = (members[j].lectures[l] - ((members[j].lecturesNew[0]) ? members[j].lecturesNew[0] : members[j].lectures[0])) + ((members[j].lecturesNew[l]) ? members[j].lecturesNew[l] : 0)
                                        }
                                    }else{
                                        if(!isNaN(members[j].lectures[l]) && !isNaN(members[j].lectures[l-1])){
                                            members[j].consumption[l] = (members[j].lectures[l] - ((members[j].lecturesNew[l-1]) ? members[j].lecturesNew[l-1] : members[j].lectures[l-1])) + ((members[j].lecturesNew[l]) ? members[j].lecturesNew[l] : 0)
                                            subtotal += members[j].consumption[l]
                                            prom++
                                        }
                                    }
                                }

                                if(l==members[j].lectures.length-1){
                                    members[j].prom = parseInt(subtotal / ((prom) ? prom : 1))
                                }
                            }
                        }
                        

                    }


                    return members

                } catch (error) {
                    console.log(error)

                    return h.response({
                        error: 'Internal Server Error'
                    }).code(500)
                }
            },
            validate: {
                payload: Joi.object().keys({
                    by: Joi.string().optional().allow(''),
                    type: Joi.string().optional().allow(''),
                    sector: Joi.string().optional().allow(''),
                    month: Joi.number().optional().allow(0),
                    year: Joi.number().allow(0),
                    order: Joi.string().optional().allow('')
                })
            }
        }
    },
    {
        method: 'POST',
        path: '/api/lecturesReportCheckLast',
        options: {
            description: 'get all lectures from single member',
            notes: 'get all lectures from single member',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    
                    const d = new Date()
                    let actualMonth = d.getMonth() + 1
                    let actualYear = d.getFullYear()

                    let queryCheck = {
                        month: actualMonth,
                        year: actualYear
                    }

                    let lecturesCheck = await Lectures.find(queryCheck).lean()
                    if(lecturesCheck){
                        if(lecturesCheck.length==0){
                            actualMonth -= 1
                            if(actualMonth==0){
                                actualMonth = 12
                                actualYear -= 1
                            }
                        }
                    }

                    return actualMonth


                } catch (error) {
                    console.log(error)

                    return h.response({
                        error: 'Internal Server Error'
                    }).code(500)
                }
            },
            validate: {
                payload: Joi.object().keys({
                    month: Joi.number().optional().allow(0),
                    year: Joi.number().optional().allow(0)
                })
            }
        }
    }
]