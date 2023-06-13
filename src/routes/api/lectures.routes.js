import Member from '../../models/Member'
import Sector from '../../models/Sectors'
import Lectures from '../../models/Lectures'
import Invoices from '../../models/Invoices'
import Payments from '../../models/Payments'
import Joi from 'joi'
import dotEnv from 'dotenv'
import { jsonSchema } from 'uuidv4'

const fs = require("fs")
const { promisify } = require("util");
const writeFile = promisify(fs.writeFile)
const readFile = promisify(fs.readFile)

dotEnv.config()

export default [
    {
        method: 'GET',
        path: '/api/lectures',
        options: {
            auth: false,
            description: 'get all lectures data',
            notes: 'return all data from lectures',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let lectures = await Lectures.find().lean()

                    return lectures
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
        path: '/api/membersLectures',
        options: {
            description: 'get one member',
            notes: 'get one member',
            tags: ['api'],
            handler: async (request, h) => {
                try {

                    let payload = request.payload   
                    let query = {}
                    if(payload.sector!=0){
                        query = {
                            'address.sector': payload.sector
                        }
                    }

                    if(payload.invoice){
                        let invoices = await Invoices.find({number: payload.invoice})
                        //query._id = 0
                        if(invoices){
                            //if(invoices[0]){
                                query._id = invoices[0].members
                            //}
                        }
                    }

                    let members = await Member.find(query).populate(['address.sector'])
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
                    sector: Joi.string(),
                    invoice: Joi.number().optional()
                })
            }
        }
    },
    {
        method: 'POST',
        path: '/api/lecturesSectorMembers',
        options: {
            description: 'get all lectures from single member',
            notes: 'get all lectures from single member',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload

                    let querySector = {}
                    if(payload.sector!='0'){
                        querySector = {
                            'address.sector': payload.sector
                        }
                    }

                    let members = await Member.find(querySector).populate(['address.sector'])
                    let array = []
                    for(let i=0; i<members.length ; i++){
                        array.push(members[i]._id)
                    }

                    let query = {
                        members: { $in: array },
                        month: payload.month,
                        year: payload.year
                    }
                    let queryLast = {
                        members: { $in: array },
                        month: (payload.month==1) ? 12 : payload.month - 1,
                        year: (payload.month==1) ? payload.year - 1 : payload.year, 
                    }
                    let queryInvoice = {
                        members: { $in: array },
                        typeInvoice: { $exists : false },
                        lectures: { $ne: null }
                    }

                    let lectures = await Lectures.find(query).populate([{ path: 'members', populate: { path: 'services.services'} }]).sort({'members.number' : 'ascending'}).lean()
                    let lecturesLast = await Lectures.find(queryLast).populate([{ path: 'members', populate: { path: 'services.services'} }]).sort({'members.number' : 'ascending'}).lean()
                    let invoices = await Invoices.find(queryInvoice).sort({'date' : 'descending'}).lean().populate(['lectures','services.services'])
                    for(let i=0;i<lectures.length;i++){
                        if(invoices){
                            lectures[i].invoice = invoices.find(x => x.lectures._id.toString() === lectures[i]._id.toString())
                            
                            if(lecturesLast.find(x => x.members._id.toString() == lectures[i].members._id.toString())){
                                lectures[i].lastLecture = lecturesLast.find(x => x.members._id.toString() == lectures[i].members._id.toString())
                            }
                        }
                        if (lectures[i].members.type == 'personal') {
                            lectures[i].name = lectures[i].members.personal.name + ' ' + lectures[i].members.personal.lastname1 + ' ' + lectures[i].members.personal.lastname2
                        } else {
                            lectures[i].name = lectures[i].members.enterprise.name
                        }
                    }


                    /*let order = {orderIndex: 'asc'}
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
                    }*/
                    if(payload.order){
                        if(payload.order=="1"){
                            lectures.sort((a,b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0))
                        }
                    }

                    return lectures

                } catch (error) {
                    console.log(error)

                    return h.response({
                        error: 'Internal Server Error'
                    }).code(500)
                }
            },
            validate: {
                payload: Joi.object().keys({
                    sector: Joi.string().optional().allow(''),
                    month: Joi.number().allow(0),
                    year: Joi.number().allow(0),
                    order: Joi.string().optional().allow('')
                })
            }
        }
    },
    {
        method: 'POST',
        path: '/api/lecturesSectorMembersManual',
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

                    let query = {
                        members: { $in: array },
                        month: payload.month,
                        year: payload.year
                    }
                    let queryLast = {
                        members: { $in: array },
                        month: (payload.month==1) ? 12 : payload.month - 1,
                        year: (payload.month==1) ? payload.year - 1 : payload.year, 
                    }
                    /*let queryInvoice = {
                        members: { $in: array },
                        typeInvoice: { $exists : false }
                    }*/

                    let lectures = await Lectures.find(query).lean()
                    let lecturesLast = await Lectures.find(queryLast).lean()
                    //let invoices = await Invoices.find(queryInvoice).sort({'date' : 'descending'}).lean().populate(['lectures','services.services'])

                    for(let j=0;j<members.length;j++){
                        
                        members[j].lectures = lectures.find(x => x.members.toString() === members[j]._id.toString())
                        members[j].lectureLast = lecturesLast.find(x => x.members.toString() === members[j]._id.toString())

                        if(!members[j].lectures && members[j].status=='inactive'){
                            members.splice(j,1)
                            j--
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
                    sector: Joi.string().optional().allow(''),
                    month: Joi.number().allow(0),
                    year: Joi.number().allow(0),
                    order: Joi.string().optional().allow('')
                })
            }
        }
    },
    {
        method: 'POST',
        path: '/api/lecturesSectorMembersPayment',
        options: {
            description: 'get all lectures from single member',
            notes: 'get all lectures from single member',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload

                    let querySector = {}
                    if(payload.sector!='0'){
                        querySector = {
                            'address.sector': payload.sector
                        }
                    }

                    let members = await Member.find(querySector).populate(['address.sector'])
                    let array = []
                    for(let i=0; i<members.length ; i++){
                        array.push(members[i]._id)
                    }

                    let query = {
                        members: { $in: array },
                        month: payload.month,
                        year: payload.year
                    }
                    let queryLast = {
                        members: { $in: array },
                        month: (payload.month==1) ? 12 : payload.month - 1,
                        year: (payload.month==1) ? payload.year - 1 : payload.year, 
                    }
                    let queryInvoice = {
                        members: { $in: array },
                        typeInvoice: { $exists : false },
                        lectures: { $ne: null }
                    }
                    let queryPayment = {
                        members: { $in: array }
                    }

                    let lectures = await Lectures.find(query).populate([{ path: 'members', populate: { path: 'services.services'} }]).sort({'members.number' : 'ascending'}).lean()
                    let lecturesLast = await Lectures.find(queryLast).populate([{ path: 'members', populate: { path: 'services.services'} }]).sort({'members.number' : 'ascending'}).lean()
                    let invoices = await Invoices.find(queryInvoice).sort({'date' : 'descending'}).lean().populate(['lectures','services.services'])
                    let payments = await Payments.find(queryPayment).lean()
                    
                    for(let i=0;i<lectures.length;i++){
                        
                        if(invoices){
                            lectures[i].invoice = invoices.find(x => x.lectures._id.toString() === lectures[i]._id.toString())
                            
                            let lectureLast = lecturesLast.find(x => x.members._id.toString() == lectures[i].members._id.toString())
                            if(lectureLast){
                                lectures[i].lastLecture = lectureLast
                            }

                            let paymentsMember = payments.find(x => x.members.toString() == lectures[i].members._id.toString())
                            if(paymentsMember){
                                let payment = paymentsMember.invoices.find(x => x.invoices.toString() == lectures[i].invoice._id.toString())
                                if(payment){
                                    lectures[i].payment = paymentsMember
                                }
                            }
                        }
                        if (lectures[i].members.type == 'personal') {
                            lectures[i].name = lectures[i].members.personal.name + ' ' + lectures[i].members.personal.lastname1 + ' ' + lectures[i].members.personal.lastname2
                        } else {
                            lectures[i].name = lectures[i].members.enterprise.name
                        }
                    }

                    if(payload.order){
                        if(payload.order=="1"){
                            lectures.sort((a,b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0))
                        }
                    }

                    return lectures

                } catch (error) {
                    console.log(error)

                    return h.response({
                        error: 'Internal Server Error'
                    }).code(500)
                }
            },
            validate: {
                payload: Joi.object().keys({
                    sector: Joi.string().optional().allow(''),
                    month: Joi.number().allow(0),
                    year: Joi.number().allow(0),
                    order: Joi.string().optional().allow('')
                })
            }
        }
    },
    {
        method: 'POST',
        path: '/api/lecturesAllInvoices',
        options: {
            description: 'get all lectures from single member',
            notes: 'get all lectures from single member',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload

                    let queryLectures = {
                        month: payload.month,
                        year: payload.year
                    }
                    if(payload.month==0 && payload.year==0){
                        queryLectures = {}
                    }

                    let lectures = await Lectures.find(queryLectures)
                    let arrayLectures = []
                    for(let i=0; i<lectures.length ; i++){
                        arrayLectures.push(lectures[i]._id)
                    }


                    let querySector = {}
                    if(payload.sector!='0'){
                        querySector = {
                            'address.sector': payload.sector
                        }
                    }

                    let members = await Member.find(querySector).populate(['address.sector'])
                    let array = []
                    for(let i=0; i<members.length ; i++){
                        array.push(members[i]._id)
                    }

                    let queryInvoice = {
                        members: { $in: array },
                        typeInvoice: { $exists : false },
                        /*lectures: { $ne: null }*/
                        lectures: { $in: arrayLectures }
                    }
                    if(payload.onlyToken){
                        queryInvoice.token = { $exists: true }
                    }
                    
                    let queryPayment = {
                        members: { $in: array }
                    }
                    const c = new Date();
                    console.log('time1', c.getMinutes() + ':' + c.getSeconds())

                    let invoices = await Invoices.find(queryInvoice).sort({'number' : 'ascending'}).lean().populate(['lectures','members','services.services'])
                    let payments = await Payments.find(queryPayment).lean()
                    const d = new Date();
                    console.log('time2', d.getMinutes() + ':' + d.getSeconds())
                    
                    for(let i=0;i<invoices.length;i++){
                        if (invoices[i].members.type == 'personal') {
                            invoices[i].name = invoices[i].members.personal.name + ' ' + invoices[i].members.personal.lastname1 + ' ' + invoices[i].members.personal.lastname2
                        } else {
                            invoices[i].name = invoices[i].members.enterprise.name
                        }

                        let paymentsMember = payments.filter(x => x.members.toString() == invoices[i].members._id.toString())

                        if(paymentsMember){

                            for(let k=0;k<paymentsMember.length;k++){
                                for(let j=0;j<paymentsMember[k].invoices.length;j++){
                                    if(paymentsMember[k].invoices[j].invoices){
                                        if(paymentsMember[k].invoices[j].invoices.toString()==invoices[i]._id.toString()){
                                            invoices[i].paymentVoucher = paymentsMember[k]
                                            if(!invoices[i].payment){
                                                invoices[i].payment = paymentsMember[k].invoices[j]
                                            }else{
                                                invoices[i].payment.amount += paymentsMember[k].invoices[j].amount
                                                invoices[i].payment.amountMonth += paymentsMember[k].invoices[j].amountMonth
                                                invoices[i].payment.amountAgreement += paymentsMember[k].invoices[j].amountAgreement
                                            }
                                        }
                                    }
                                }
                            }
                            

                            /*let payment = paymentsMember.invoices.find(x => (x.invoices.toString()) ? x.invoices.toString() : '' == invoices[i]._id.toString())
                            
                            if(payment){
                                invoices[i].paymentVoucher = paymentsMember
                                invoices[i].payment = payment
                            }*/
                        }

                    }

                    if(payload.order){
                        if(payload.order=="2"){
                            invoices.sort((a,b) => (a.number > b.number) ? 1 : ((b.number > a.number) ? -1 : 0))
                        }
                    }

                    return invoices
                    for(let i=0;i<lectures.length;i++){
                        
                        if(invoices){
                            lectures[i].invoice = invoices.find(x => x.lectures._id.toString() === lectures[i]._id.toString())
                            
                            let lectureLast = lecturesLast.find(x => x.members._id.toString() == lectures[i].members._id.toString())
                            if(lectureLast){
                                lectures[i].lastLecture = lectureLast
                            }

                            let paymentsMember = payments.find(x => x.members.toString() == lectures[i].members._id.toString())
                            if(paymentsMember){
                                let payment = paymentsMember.invoices.find(x => x.invoices.toString() == lectures[i].invoice._id.toString())
                                if(payment){
                                    lectures[i].payment = paymentsMember
                                }
                            }
                        }
                        if (lectures[i].members.type == 'personal') {
                            lectures[i].name = lectures[i].members.personal.name + ' ' + lectures[i].members.personal.lastname1 + ' ' + lectures[i].members.personal.lastname2
                        } else {
                            lectures[i].name = lectures[i].members.enterprise.name
                        }
                    }

                    if(payload.order){
                        if(payload.order=="1"){
                            lectures.sort((a,b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0))
                        }
                    }

                    return lectures

                } catch (error) {
                    console.log(error)

                    return h.response({
                        error: 'Internal Server Error'
                    }).code(500)
                }
            },
            validate: {
                payload: Joi.object().keys({
                    sector: Joi.string().optional().allow(''),
                    month: Joi.number().allow(0),
                    year: Joi.number().allow(0),
                    order: Joi.string().optional().allow(''),
                    onlyToken: Joi.boolean().optional()
                })
            }
        }
    },
    {
        method: 'POST',
        path: '/api/lecturesAllPayments',
        options: {
            description: 'get all lectures from single member',
            notes: 'get all lectures from single member',
            tags: ['api'],
            handler: async (request, h) => {
                try {

                    //////////CARGA DE BOLETAS DE CONSUMO/////////////////
                    let payload = request.payload


                    let dateStart = new Date(payload.yearPayment+'-'+payload.monthPayment+'-01')
                    dateStart.setTime(dateStart.getTime() - dateStart.getTimezoneOffset()*60*1000 )

                    let datePivot = new Date(payload.yearPayment+'-'+payload.monthPayment+'-01')
                    var dateEnd = new Date(datePivot.getFullYear(), datePivot.getMonth()+1, 0)


                    let queryLectures = {
                        year: payload.year
                    }

                    if(payload.month){
                        queryLectures.month = payload.month
                    }

                    let lectures = await Lectures.find(queryLectures)
                    let arrayLectures = []
                    for(let i=0; i<lectures.length ; i++){
                        arrayLectures.push(lectures[i]._id)
                    }


                    let querySector = {}
                    if(payload.sector!='0'){
                        querySector = {
                            'address.sector': payload.sector
                        }
                    }

                    let members = await Member.find(querySector).populate(['address.sector'])
                    let array = []
                    for(let i=0; i<members.length ; i++){
                        array.push(members[i]._id)
                    }

                    let queryInvoice = {
                        members: { $in: array },
                        typeInvoice: { $exists : false },
                        /*lectures: { $ne: null }*/
                        lectures: { $in: arrayLectures },
                        date: { //Editado
                            $gte: dateStart, 
                            $lt: dateEnd
                        }
                    }


                    

                    if(payload.onlyToken){
                        //queryInvoice.token = { $exists: true }
                        queryInvoice.type = { $ne: 0 }
                    }
                    let queryPayment = {
                        members: { $in: array },
                        date: { 
                            $lt: dateEnd
                        }
                    }

                    let invoices = await Invoices.find(queryInvoice).sort({'number' : 'ascending'}).lean().populate(['lectures','members','services.services'])
                    let payments = await Payments.find(queryPayment).lean()
                    
                    for(let i=0;i<invoices.length;i++){
                        if (invoices[i].members.type == 'personal') {
                            invoices[i].name = invoices[i].members.personal.name + ' ' + invoices[i].members.personal.lastname1 + ' ' + invoices[i].members.personal.lastname2
                        } else {
                            invoices[i].name = invoices[i].members.enterprise.name
                        }

                        let paymentsMember = payments.filter(x => x.members.toString() == invoices[i].members._id.toString())

                        if(paymentsMember){

                            for(let k=0;k<paymentsMember.length;k++){
                                for(let j=0;j<paymentsMember[k].invoices.length;j++){
                                    if(paymentsMember[k].invoices[j].invoices){
                                        if(paymentsMember[k].invoices[j].invoices.toString()==invoices[i]._id.toString()){
                                            invoices[i].paymentVoucher = paymentsMember[k]
                                            invoices[i].payment = paymentsMember[k].invoices[j]
                                        }
                                    }
                                }
                            }

                        }

                    }


                    //////////PAGOS//////////
                    if(!payload.noPayment){
                    
                        let queryPaymentExt = {
                            members: { $in: array },
                            date: { 
                                $gte: dateStart, 
                                $lt: dateEnd
                            }
                        }

                        let paymentsExt = await Payments.find(queryPaymentExt).lean().populate(['invoices.invoices'])
                        //let invoices = []
                        
                        for(let i=0;i<paymentsExt.length;i++){
                            for(let j=0;j<paymentsExt[i].invoices.length;j++){
                                if(paymentsExt[i].invoices[j].invoices){
                                    if(!paymentsExt[i].invoices[j].invoices.token || paymentsExt[i].invoices[j].invoices.token==''){

                                        let amount = (paymentsExt[i].invoices[j].amountMonth) ? paymentsExt[i].invoices[j].amountMonth : paymentsExt[i].amount

                                        invoices.push({
                                            date: paymentsExt[i].date,
                                            number: paymentsExt[i].transaction,
                                            total: amount,
                                            paymentAmount: amount,
                                            //total: paymentsExt[i].amount,
                                            //paymentAmount: paymentsExt[i].amount,
                                            balance: 0,
                                            status: 'VÁLIDA'
                                        })
                                    }
                                }
                            }
                        }
                        
                        ////REGISTROS MANUALES TEMPORALES, SE DEBEN INGRESAR POR BASE DE DATOS////
                        if(payload.monthPayment=='03'){
                            invoices.push({
                                date: '2023-03-14',
                                number: '61964',
                                total: 18570,
                                paymentAmount: 0,
                                balance: 18570,
                                status: 'ANULADA'
                            },{
                                date: '2023-03-23',
                                number: '62006',
                                total: 6600,
                                paymentAmount: 0,
                                balance: 6600,
                                status: 'ANULADA'
                            })
                        }
                    }



                    invoices.sort((a,b) => (parseInt(a.number) > parseInt(b.number)) ? 1 : ((parseInt(b.number) > parseInt(a.number)) ? -1 : 0))
                    //invoices.sort((a,b) => (a.date > b.date) ? 1 : ((b.date > a.date) ? -1 : 0))


                    return invoices

                } catch (error) {
                    console.log(error)

                    return h.response({
                        error: 'Internal Server Error'
                    }).code(500)
                }
            },
            validate: {
                payload: Joi.object().keys({
                    sector: Joi.string().optional().allow(''),
                    month: Joi.number().allow(0),
                    year: Joi.number().allow(0),
                    monthPayment: Joi.number().allow(0),
                    yearPayment: Joi.number().allow(0),
                    order: Joi.string().optional().allow(''),
                    onlyToken: Joi.boolean().optional(),
                    noPayment: Joi.boolean().optional()
                })
            }
        }
    },
    {
        method: 'POST',
        path: '/api/lecturesAllPaymentsConsumed',
        options: {
            description: 'get all lectures from single member',
            notes: 'get all lectures from single member',
            tags: ['api'],
            handler: async (request, h) => {
                try {

                    //////////CARGA DE BOLETAS DE CONSUMO/////////////////
                    let payload = request.payload

                    let queryInvoices = {
                        date: {
                            $gte: payload.year + '-01-01',
                            $lt: (payload.year + 1) + '-01-01'
                        },
                        annulment: { $exists : false },
                        $and: [{token: { $exists : true }}, {token: {$ne: '' }}],
                        number: { $exists : true }
                    }

                    let invoices = await Invoices.find(queryInvoices).lean()
                    let array = []
                    for(let a=0; a<12; a++){
                        array.push({
                            month: a+1,
                            total: 0,
                            paid: 0,
                            balance: 0,
                            data: []
                        })
                    }

                    

                    let queryPayment = {
                        date: {
                            $gte: payload.year + '-01-01',
                            $lte: payload.datePayment
                            //$lt: (payload.year + 1) + '-01-01'
                        }
                    }

                    let payments = await Payments.find(queryPayment).lean()
                    for(let i=0; i<invoices.length; i++){

                        invoices[i].paid = 0
                        invoices[i].balance = invoices[i].invoiceSubTotal
                        let paymentsMember = payments.filter(x => x.members.toString() == invoices[i].members.toString())
                        for(let j=0; j<paymentsMember.length; j++){
                            for(let k=0; k<paymentsMember[j].invoices.length; k++){
                                if(paymentsMember[j].invoices[k].invoices){
                                    if(paymentsMember[j].invoices[k].invoices.toString()==invoices[i]._id){
                                        invoices[i].paid += (paymentsMember[j].invoices[k].amountMonth || paymentsMember[j].invoices[k].amountMonth == 0) ? paymentsMember[j].invoices[k].amountMonth : paymentsMember[j].invoices[k].amount 
                                        invoices[i].balance -= (paymentsMember[j].invoices[k].amountMonth || paymentsMember[j].invoices[k].amountMonth == 0) ? paymentsMember[j].invoices[k].amountMonth : paymentsMember[j].invoices[k].amount 
                                    }
                                }
                            }
                        }
                        
                        //Por desfase UTC
                        let userTimezoneOffset = invoices[i].date.getTimezoneOffset() * 60000;
                        let invoiceDate = new Date(invoices[i].date.getTime() + userTimezoneOffset);
                        
                        array[invoiceDate.getMonth()].data.push(invoices[i])
                        array[invoiceDate.getMonth()].total += invoices[i].invoiceSubTotal
                        array[invoiceDate.getMonth()].paid += invoices[i].paid
                        array[invoiceDate.getMonth()].balance += (invoices[i].invoiceSubTotal - invoices[i].paid)
                    }
                    

                    return array

                } catch (error) {
                    console.log(error)

                    return h.response({
                        error: 'Internal Server Error'
                    }).code(500)
                }
            },
            validate: {
                payload: Joi.object().keys({
                    year: Joi.number().allow(0),
                    datePayment: Joi.string().allow('')
                })
            }
        }
    },
    {
        method: 'POST',
        path: '/api/lecturesSingleMember',
        options: {
            description: 'get all lectures from single member',
            notes: 'get all lectures from single member',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload

                    let query = {
                        members: payload.member
                    }
                    let queryInvoice = {
                        members: payload.member,
                        typeInvoice: { $exists : false },
                        annulment: { $exists : false }
                    }
                    let queryInvoiceAnnulled = {
                        members: payload.member,
                        typeInvoice: { $exists : false },
                        annulment: { $exists : true }
                    }

                    let lectures = await Lectures.find(query).sort({'year' : 'descending', 'month' : 'descending'}).lean()
                    //let invoices = await Invoices.find(query).sort({'date' : 'descending'}).populate(['lectures']).lean()
                    let invoices = await Invoices.find(queryInvoice).sort({'date' : 'descending'}).lean().populate(['lectures'])
                    let invoicesAnnulled = await Invoices.find(queryInvoiceAnnulled).sort({'date' : 'descending'}).lean().populate(['lectures'])

                    for(let i=0;i<lectures.length;i++){
                        lectures[i].invoice = invoices.find(x => x.lectures._id.toString() === lectures[i]._id.toString())
                        lectures[i].invoicesAnnulled = invoicesAnnulled.find(x => x.lectures._id.toString() === lectures[i]._id.toString())
                    }

                    return lectures

                } catch (error) {
                    console.log(error)

                    return h.response({
                        error: 'Internal Server Error'
                    }).code(500)
                }
            },
            validate: {
                payload: Joi.object().keys({
                    member: Joi.string().optional().allow('')
                })
            }
        }
    },
    {
        method: 'POST',
        path: '/api/lectureSingle',
        options: {
            description: 'get one lecture',
            notes: 'get one lecture',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload

                    let lecture = await Lectures.findById(payload.id).populate(['members']).lean()
                    let lecturesLast = await Lectures.find({members: lecture.members}).sort({'year' : 'ascending', 'month' : 'ascending'}).lean()
                    let lastLecture = 0
                    
                    for(let i=0;i<lecturesLast.length;i++){
                        if(lecturesLast[i]._id.toString()===lecture._id.toString()){
                            if(i>0){
                                lastLecture = lecturesLast[i-1].logs[lecturesLast[i-1].logs.length-1].lecture
                                if(lecturesLast[i-1].logs[lecturesLast[i-1].logs.length-1].lectureNewEnd !== undefined){
                                    lastLecture = lecturesLast[i-1].logs[lecturesLast[i-1].logs.length-1].lectureNewEnd
                                }
                            }
                            i = lecturesLast.length
                        }
                    }

                    lecture.lastLecture = lastLecture

                    return lecture

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
        path: '/api/lectureSave',
        options: {
            description: 'create lecture',
            notes: 'create lecture',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload   
                    let date = new Date(payload.date)

                    let year = (payload.year) ? payload.year : date.getFullYear() + 1
                    let month = (payload.month) ? payload.month : date.getMonth() + 1

                    let lectures = await Lectures.find({members: payload.member, month: month, year: year}).lean()

                    if(lectures[0]){
                        let lecture = await Lectures.findById(lectures[0]._id)
                        lecture.logs.push({
                            users: payload.users,
                            date: date,
                            lecture: payload.lecture
                        })
                        const response = await lecture.save()
                        return response

                    }else{
                        let query = {
                            members: payload.member,
                            month: month,
                            year: year,
                            logs: [{
                                users: payload.users,
                                date: date,
                                lecture: payload.lecture
                            }]
                        }
                        let lecture = new Lectures(query)
                        const response = await lecture.save()
                        return response
                    }

    
                } catch (error) {
                    console.log(error)

                    return h.response({
                        error: 'Internal Server Error'
                    }).code(500)
                }
            },
            validate: {
                payload: Joi.object().keys({
                    users: Joi.string().allow(''),
                    date: Joi.string().allow(''),
                    year: Joi.number().allow(0).optional(),
                    month: Joi.number().allow(0).optional(),
                    member: Joi.string().allow(''),
                    lecture: Joi.number().allow(0)
                })
            }
        }
    },
    {
        method: 'POST',
        path: '/api/lectureUpdate',
        options: {
            description: 'update lecture',
            notes: 'update lecture',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload   

                    let lectures = await Lectures.findById(payload.id)
                   
                    lectures.date = payload.date
                    lectures.rut = payload.rut
                    lectures.name = payload.name
                    lectures.address = payload.address
                    lectures.status = payload.status
                    lectures.net = payload.net
                    lectures.iva = payload.iva
                    lectures.total = payload.total
                    lectures.payment = payload.payment
                    lectures.paymentVoucher = payload.paymentVoucher
                    lectures.type = payload.type

                    if(payload.products){
                        lectures.products = payload.products
                    }

                    if(payload.services){
                        lectures.services = payload.services
                    }

                    const response = await lectures.save()

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
                    paymentVoucher: Joi.string().optional().allow(''),
                    type: Joi.string().optional().allow(''),
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
        path: '/api/lectureSaveManual',
        options: {
            description: 'create lecture',
            notes: 'create lecture',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload
                    let date = new Date(payload.date)

                    let year = (payload.year) ? payload.year : date.getFullYear()
                    let month = (payload.month) ? payload.month : date.getMonth() + 1

                    let lectures = await Lectures.find({members: { $in: payload.members}, month: month, year: year}).lean()

                    for(let i=0; i<payload.lectures.length; i++){

                        let go = lectures.find(x => x.members.toString() === payload.lectures[i].member.toString())

                        if(go){
                            let lecture = await Lectures.findById(lectures.find(x => x.members.toString() === payload.lectures[i].member.toString())._id)
                            
                            if(payload.lectures[i].lectureNewStart !== undefined){
                                lecture.logs.push({
                                    users: payload.users,
                                    date: date,
                                    lecture: payload.lectures[i].lecture,
                                    lectureNewStart: payload.lectures[i].lectureNewStart,
                                    lectureNewEnd: payload.lectures[i].lectureNewEnd
                                })
                            }else{
                                lecture.logs.push({
                                    users: payload.users,
                                    date: date,
                                    lecture: payload.lectures[i].lecture
                                })
                            }
                            await lecture.save()

                        }else{

                            let log = []
                            if(payload.lectures[i].lectureNewStart !== undefined){
                                log.push({
                                    users: payload.users,
                                    date: date,
                                    lecture: payload.lectures[i].lecture,
                                    lectureNewStart: payload.lectures[i].lectureNewStart,
                                    lectureNewEnd: payload.lectures[i].lectureNewEnd
                                })
                            }else{
                                log.push({
                                    users: payload.users,
                                    date: date,
                                    lecture: payload.lectures[i].lecture
                                })
                            }

                            let query = {
                                members: payload.lectures[i].member,
                                month: month,
                                year: year,
                                logs: log
                            }
                            let lecture = new Lectures(query)
                            await lecture.save()
                        }

                        let member = await Member.findById(payload.lectures[i].member)
                        member.fine = payload.lectures[i].fine
                        await member.save()
                        
                        /*if(lectures[0]){
                            let lecture = await Lectures.findById(lectures[0]._id)
                            lecture.logs.push({
                                users: payload.users,
                                date: date,
                                lecture: payload.lecture
                            })
                            const response = await lecture.save()
                            return response

                        }else{
                            let query = {
                                members: payload.member,
                                month: month,
                                year: year,
                                logs: [{
                                    users: payload.users,
                                    date: date,
                                    lecture: payload.lecture
                                }]
                            }
                            let lecture = new Lectures(query)
                            const response = await lecture.save()
                            return response
                        }*/
                    }

                    return 'OK'

    
                } catch (error) {
                    console.log(error)

                    return h.response({
                        error: 'Internal Server Error'
                    }).code(500)
                }
            },
            validate: {
                payload: Joi.object().keys({
                    users: Joi.string().allow(''),
                    date: Joi.string().allow(''),
                    year: Joi.number().allow(0).optional(),
                    month: Joi.number().allow(0).optional(),
                    lectures: Joi.array().items(
                        Joi.object().keys({
                            member: Joi.string().allow(''),
                            lecture: Joi.number().allow(0),
                            lectureNewStart: Joi.number().allow(0).optional(),
                            lectureNewEnd: Joi.number().allow(0).optional(),
                            fine: Joi.boolean().optional()
                        })
                    ),
                    members: Joi.array().items()
                })
            }
        }
    },
    {
        method: 'POST',
        path: '/api/lecturesMacro',
        options: {
            description: 'get all lectures from single member',
            notes: 'get all lectures from single member',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload

                    let array = []
                    /*for(let i=0; i<members.length ; i++){
                        array.push(members[i]._id)
                    }*/

                    let query = {
                        month: payload.month,
                        year: payload.year
                    }
                    let queryInvoice = {
                        typeInvoice: { $exists : false },
                        lectures: { $ne: null }
                    }
                    let queryMembers = {
                        'subsidies.status' : 'active',
                        'subsidies.type': 1
                    }

                    let lectures = await Lectures.find(query).populate([{ path: 'members', populate: { path: 'services.services'} }]).sort({'members.number' : 'ascending'}).lean()
                    let invoices = await Invoices.find(queryInvoice).sort({'date' : 'descending'}).lean().populate(['lectures','services.services'])
                    let members = await Member.find(queryMembers).lean()
                    for(let i=0;i<lectures.length;i++){
                        
                        if(members.find(x => x._id.toString() === lectures[i].members._id.toString())){
                            lectures[i].invoiceDebts = 0
                            if(invoices){
                                lectures[i].invoice = invoices.find(x => x.lectures._id.toString() === lectures[i]._id.toString())
                                
                                let invoicesMember = invoices.filter(x => x.members.toString() === lectures[i].members._id.toString())
                                if(invoicesMember){
                                    for(let j=0; j<invoicesMember.length; j++){
                                        if(invoicesMember[j].invoicePaid<invoicesMember[j].invoiceSubTotal){
                                            lectures[i].invoiceDebts++
                                        }
                                    }
                                }

                            }
                            array.push(lectures[i])
                        }
                    }
                    return array

                    /*for(let i=0;i<lectures.length;i++){
                        if(invoices){
                            lectures[i].invoice = invoices.find(x => x.lectures._id.toString() === lectures[i]._id.toString())
                        }
                    }*/

                    //return lectures

                } catch (error) {
                    console.log(error)

                    return h.response({
                        error: 'Internal Server Error'
                    }).code(500)
                }
            },
            validate: {
                payload: Joi.object().keys({
                    month: Joi.number().allow(0),
                    year: Joi.number().allow(0)
                })
            }
        }
    },
    {
        method: 'POST',
        path: '/api/defaulters',
        options: {
            description: 'get all lectures from single member',
            notes: 'get all lectures from single member',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let payload = request.payload

                    let array = []
                    /*for(let i=0; i<members.length ; i++){
                        array.push(members[i]._id)
                    }*/

                    let query = { 
                        $where: 'this.invoicePaid < this.invoiceSubTotal'
                    }
                    /*let queryInvoice = {
                        typeInvoice: { $exists : false },
                        lectures: { $ne: null }
                    }
                    let queryMembers = {
                        'subsidies.status' : 'active'
                    }*/
                                                                                                // .populate([{ path: 'members', match: { 'address.sector': payload.sector }, populate: { path: 'address.sector'} }])
                    let invoices = await Invoices.find(query).sort({'date' : 'descending'}).lean().populate(['lectures', 'members', { path: 'members.address.sector', model: 'sectors'}])

                    for(let i=0; i<invoices.length; i++){
                        let member = array.find(x => x.member_id.toString() === invoices[i].members._id.toString())
                        if(member){
                            member.toPay += invoices[i].invoiceSubTotal
                            member.paid += invoices[i].invoicePaid
                            member.balance += invoices[i].invoiceSubTotal-invoices[i].invoicePaid
                            member.months++
                        }else{
                            let name = invoices[i].members.personal.lastname1 + ' ' + invoices[i].members.personal.lastname2 + ' ' + invoices[i].members.personal.name
                            if(invoices[i].members.type=='enterprise'){
                                name = invoices[i].members.enterprise.name
                            }
                            array.push({
                                number: invoices[i].members.number,
                                member_id: invoices[i].members._id,
                                name: name,
                                address: invoices[i].members.address.address,
                                sector:  invoices[i].members.address.sector,
                                rut: invoices[i].members.rut,
                                toPay: invoices[i].invoiceSubTotal,
                                paid: invoices[i].invoicePaid,
                                balance: invoices[i].invoiceSubTotal-invoices[i].invoicePaid,
                                months: 1
                            })
                        }


                    }


                    //filtro meses
                    let arrayMonths = []
                    array.forEach(el => {
                        if (payload.months !== '0') {//con filtro
                            if(payload.months[1]=='A' && el.months >= parseInt(payload.months[0])){
                            //if (payload.months == '6' && el.months >= payload.months) { //>5
                                arrayMonths.push(el)
                            } else if (payload.months == el.months) { //valor mandado
                                arrayMonths.push(el) 
                            }
                        } else { //todos
                            arrayMonths.push(el)
                        }
                    })


                    //filtro sector

                    return arrayMonths

                    /*let lectures = await Lectures.find(query).populate([{ path: 'members', populate: { path: 'services.services'} }]).sort({'members.number' : 'ascending'}).lean()
                    let members = await Member.find(queryMembers).lean()
                    for(let i=0;i<lectures.length;i++){
                        
                        if(members.find(x => x._id.toString() === lectures[i].members._id.toString())){
                            lectures[i].invoiceDebts = 0
                            if(invoices){
                                lectures[i].invoice = invoices.find(x => x.lectures._id.toString() === lectures[i]._id.toString())
                                
                                let invoicesMember = invoices.filter(x => x.members.toString() === lectures[i].members._id.toString())
                                if(invoicesMember){
                                    for(let j=0; j<invoicesMember.length; j++){

                                        if(invoicesMember[j].invoicePaid<invoicesMember[j].invoiceSubTotal){
                                            lectures[i].invoiceDebts++
                                        }
                                    }
                                }

                            }
                            array.push(lectures[i])
                        }
                    }
                    return array*/


                } catch (error) {
                    console.log(error)

                    return h.response({
                        error: 'Internal Server Error'
                    }).code(500)
                }
            },
            validate: {
                payload: Joi.object().keys({
                    sector: Joi.string().allow('').optional(),
                    months: Joi.string().allow('').optional()
                })
            }
        }
    },
    {
        method: 'POST',
        path: '/api/lectureDelete',
        options: {
            description: 'delete lecture',
            notes: 'delete lecture',
            tags: ['api'],
            handler: async (request) => {
                try {
                    let payload = request.payload
                    //Falta comprobación de boleta/factura activa

                    await Lectures.deleteOne({members: payload.member, year: payload.year, month: payload.month})

                    return 'OK'


                } catch (error) {
                    console.log(error)

                    return {
                        error: 'Ha ocurrido un error al guardar datos de usuario'
                    }
                }
            },
            validate: {
                payload: Joi.object().keys({
                    member: Joi.string(),
                    year: Joi.number(),
                    month: Joi.number()
                })
            }
        }
    },
    {
        method: 'POST',
        path: '/api/lecturesMacroXLS',
        options: {
            description: 'get all lectures from single member',
            notes: 'get all lectures from single member',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    
                    var XLSX = require('xlsx')
                    console.log("Current directory:", __dirname);
                    //var wb = XLSX.readFile("/../../../public/js/macro.xls")
                    var wb = XLSX.readFile(__dirname+"/macro.xls")
    
                    //change_workbook(wb) // ***

                    XLSX.writeFile(wb, __dirname+"/macroNew.xls")
                    return 'test'


                    let payload = request.payload

                    let array = []
                    /*for(let i=0; i<members.length ; i++){
                        array.push(members[i]._id)
                    }*/

                    let query = {
                        month: payload.month,
                        year: payload.year
                    }
                    let queryInvoice = {
                        typeInvoice: { $exists : false },
                        lectures: { $ne: null }
                    }
                    let queryMembers = {
                        'subsidies.status' : 'active',
                        'subsidies.type': 1
                    }

                    let lectures = await Lectures.find(query).populate([{ path: 'members', populate: { path: 'services.services'} }]).sort({'members.number' : 'ascending'}).lean()
                    let invoices = await Invoices.find(queryInvoice).sort({'date' : 'descending'}).lean().populate(['lectures','services.services'])
                    let members = await Member.find(queryMembers).lean()
                    for(let i=0;i<lectures.length;i++){
                        
                        if(members.find(x => x._id.toString() === lectures[i].members._id.toString())){
                            lectures[i].invoiceDebts = 0
                            if(invoices){
                                lectures[i].invoice = invoices.find(x => x.lectures._id.toString() === lectures[i]._id.toString())
                                
                                let invoicesMember = invoices.filter(x => x.members.toString() === lectures[i].members._id.toString())
                                if(invoicesMember){
                                    for(let j=0; j<invoicesMember.length; j++){
                                        if(invoicesMember[j].invoicePaid<invoicesMember[j].invoiceSubTotal){
                                            lectures[i].invoiceDebts++
                                        }
                                    }
                                }

                            }
                            array.push(lectures[i])
                        }
                    }
                    return array

                    /*for(let i=0;i<lectures.length;i++){
                        if(invoices){
                            lectures[i].invoice = invoices.find(x => x.lectures._id.toString() === lectures[i]._id.toString())
                        }
                    }*/

                    //return lectures

                } catch (error) {
                    console.log(error)

                    return h.response({
                        error: 'Internal Server Error'
                    }).code(500)
                }
            },
            validate: {
                payload: Joi.object().keys({
                    month: Joi.number().allow(0),
                    year: Joi.number().allow(0)
                })
            }
        }
    }
]