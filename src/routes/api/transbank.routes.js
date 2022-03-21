import Joi from 'joi'
import moment from 'moment'
import Transbank from 'transbank-sdk'
import { v4 as uuidv4 } from 'uuid'
// import ShortUniqueId from 'short-unique-id'
import dotEnv from 'dotenv'
import fs from 'fs'

dotEnv.config()

export default [
    {
        method: 'POST',
        path: '/api/initTransaction',
        options: {
            cors: {
                origin: ['*'],
                additionalHeaders: ['cache-control', 'x-requested-with']
            },
            auth: false,
            handler: async request => {
                const payload = request.payload

                //console.log(payload)

                try {
                    let crtPath = `${process.env.TRANSBANK_PATH}/${process.env.TRANSBANK_COMMERCE_CODE}.crt`
                    let keyPath = `${process.env.TRANSBANK_PATH}/${process.env.TRANSBANK_COMMERCE_CODE}.key`

                    let transbank_crt = await fs.readFileSync(crtPath, 'utf8')
                    let transbank_key = await fs.readFileSync(keyPath, 'utf8')

                    let transbankConfiguration = new Transbank.Configuration()
                        .withPrivateCert(transbank_key)
                        .withPublicCert(transbank_crt)
                        .withCommerceCode(process.env.TRANSBANK_COMMERCE_CODE.toString())
                        .usingEnvironment(Transbank.environments.production)

                    const transaction = new Transbank.Webpay(transbankConfiguration).getNormalTransaction()

                    const buyOrder = await incrementAndGetBuyOrder()
                    const sessionId = uuidv4()

                    console.log(buyOrder)

                    let student //= await db.get(clean(payload.rut))

                    let quotasToPay = []
                    let amountToPay = 0

                    if (student) {
                        student.matricula.finance.cuotas.forEach(el => {
                            if (payload.quotas.indexOf(el.num) > -1 && el.status === 'pending') {
                                quotasToPay.push(el)
                                amountToPay += parseInt(el.amount)
                            }

                        })

                        console.log(amountToPay, payload.amount)

                        if ((amountToPay === payload.amount) && amountToPay > 0) {
                            const returnUrl = 'https://intranet.cebal.cl/api/returnTransaction'
                            //const finalUrl = `http://localhost:3310/api/finalTransaction/transactionId=${sessionId}`
                            const finalUrl = `https://cebal.cl/index.html?transactionId=${sessionId}`

                            const response = await transaction.initTransaction(amountToPay, buyOrder, sessionId, returnUrl, finalUrl)

                            const token = response.token
                            const url = response.url

                            console.log(token)
                            console.log(url)

                            /*await db.insert({
                                _id: sessionId,
                                type: 'transaction',
                                date: moment().format('YYYY-MM-DDTHH:mm:ss'),
                                transactionId: sessionId,
                                buyOrder: buyOrder,
                                amountToPay: amountToPay,
                                token: token,
                                url: url,
                                returnUrl: returnUrl,
                                finalUrl: finalUrl,
                                status: 'started',
                                studentRut: payload.rut,
                                quotasToPay: quotasToPay,
                                place: payload.place
                            })*/

                            //return response
                            return {
                                ok: `${url}?token_ws=${token}`
                            }
                        } else {
                            console.log('error 1')
                            return {
                                err: 'Error al pagar, por favor recargue la página e intentelo nuevamente.'
                            }
                        }
                    }

                    console.log('error 2')
                    return {
                        err: 'Error al pagar, por favor recargue la página e intentelo nuevamente.'
                    }

                } catch (error) {
                    console.log(error)

                    return {
                        err: 'Error al pagar, por favor recargue la página e intentelo nuevamente.'
                    }
                }

            },
            validate: {
                payload: Joi.object().keys({
                    rut: Joi.string(),
                    quotas: Joi.array().items(Joi.number()),
                    amount: Joi.number().integer(),
                    place: Joi.string()
                })
            }
        }
    },
    {
        method: 'POST',
        path: '/api/returnTransaction',
        options: {
            cors: {
                origin: ['*'],
                additionalHeaders: ['cache-control', 'x-requested-with']
            },
            auth: false,
            handler: async (request, h) => {
                const payload = request.payload

                try {
                    let crtPath = `${process.env.TRANSBANK_PATH}/${process.env.TRANSBANK_COMMERCE_CODE}.crt`
                    let keyPath = `${process.env.TRANSBANK_PATH}/${process.env.TRANSBANK_COMMERCE_CODE}.key`

                    let transbank_crt = await fs.readFileSync(crtPath, 'utf8')
                    let transbank_key = await fs.readFileSync(keyPath, 'utf8')

                    let transbankConfiguration = new Transbank.Configuration()
                        .withPrivateCert(transbank_key)
                        .withPublicCert(transbank_crt)
                        .withCommerceCode(process.env.TRANSBANK_COMMERCE_CODE.toString())
                        .usingEnvironment(Transbank.environments.production)

                    const transaction = new Transbank.Webpay(transbankConfiguration).getNormalTransaction()

                    const token = payload.token_ws
                    const response = await transaction.getTransactionResult(token)

                    console.log(response)

                    const output = response.detailOutput[0]

                    let originalTransaction// = await db.get(response.sessionId)

                    if (output.responseCode === 0) {
                        if (originalTransaction) {
                            let originalStudent// = await db.get(originalTransaction.studentRut)

                            originalStudent.matricula.finance.cuotas = originalStudent.matricula.finance.cuotas.reduce((acc, el) => {
                                let quotaIndex = originalTransaction.quotasToPay.findIndex(elQuota => elQuota.num === el.num)

                                if (quotaIndex > -1) {
                                    acc.push({
                                        num: el.num,
                                        amount: el.amount,
                                        payday: el.payday,
                                        status: 'payed',
                                        payedDay: moment().format('YYYY-MM-DDTHH:mm:ss.SSSSS'),
                                        ticket: originalTransaction.buyOrder
                                    })
                                } else {
                                    acc.push(el)
                                }

                                return acc
                            }, [])

                            originalTransaction.transactionData = response
                            originalTransaction.status = 'approved'

                            //await db.insert(originalTransaction)

                            /*await db.insert({
                                _id: moment().format('YYYY-MM-DDTHH:mm:ss.SSSSS'),
                                type: 'boleta',
                                numBoleta: originalTransaction.buyOrder,
                                cuotas: originalTransaction.quotasToPay.reduce((acc, el) => {
                                    acc.push({
                                        num: el.num,
                                        monto: el.amount
                                    })

                                    return acc
                                }, []),
                                monto: originalTransaction.amountToPay,
                                rutAlumno: originalTransaction.studentRut,
                                place: originalTransaction.place,
                                rutCreador: originalTransaction.studentRut,
                                formaPago: 'Transferencia'
                            })*/

                            //await db.insert(originalStudent)

                            return `
                            <html>
                                <head><title>Redireccionando...</title></head>
                                <body>
                                    <form method="post" action="${response.urlRedirection}" id="return-form">
                                        <input type="hidden" name="token_ws" value="${token}" />
                                    </form>

                                    <script>
                                        document.getElementById('return-form').submit()
                                    </script>
                                </body>
                            </html>
                        `
                        }

                    }

                    if (output.responseCode === -1 || output.responseCode === -2 || output.responseCode === -3 || output.responseCode === -4 || output.responseCode === -5) {

                        originalTransaction.transactionData = response
                        originalTransaction.status = 'rejected'

                        //await db.insert(originalTransaction)

                        return h.redirect(`https://cebal.cl/index.html?transactionId=${originalTransaction.transactionId}`)
                    }

                    return h.redirect('https://cebal.cl')
                } catch (error) {
                    console.log(error)

                    throw error
                }
            }
        }

    },
    {
        method: 'GET',
        path: '/api/transaction/{transactionId}',
        options: {
            cors: {
                origin: ['*'],
                additionalHeaders: ['cache-control', 'x-requested-with']
            },
            auth: false,
            handler: async request => {
                //const params = request.params
                let a = request//
                console.log(a)//
                try {
                    let originalTransaction// = await db.get(params.transactionId)

                    if (originalTransaction) {

                        if (originalTransaction.type === 'transaction') {
                            return {
                                ok: originalTransaction
                            }
                        }

                        return {
                            err: 'No encontramos la transacción.'
                        }

                    }

                    return {
                        err: 'No encontramos la transacción.'
                    }
                } catch (error) {
                    //console.log(error)

                    return {
                        err: 'No encontramos la transacción.'
                    }
                }
            }
        }
    }
]

const incrementAndGetBuyOrder = async () => {
    let result// = await db.get('buyOrder')

    let suid /*= new ShortUniqueId({
        dictionary: [1, 2, 3, 4, 5, 6, 7, 8, 9, 0],
        shuffle: false,
        debug: false,
        length: 6,
    })*/

    if (result) {
        result.counter += 1

        //await db.insert(result)

        return `${suid()}-${result.counter}`
    }

    throw 'Ha ocurrido un error obteniendo el número de orden.'

}