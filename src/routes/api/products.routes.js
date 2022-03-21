// const WebpayPlus = require('transbank-sdk').WebpayPlus; // ES5

import Joi from 'joi'
import dotEnv from 'dotenv'
import Product from '../../models/Products'

import { WebpayPlus } from 'transbank-sdk' // ES6

dotEnv.config()

export default [
  {
    method: 'GET',
    path: '/api/products',
    options: {
      auth: false,
      description: 'trae productos',
      tags: ['api'],
      handler: async (request, h) => {
        try {
          let products = await Product.find({
            status: 'HABILITADO'
          }).lean()
          return products
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
    path: '/api/webpayTrans',
    options: {
      auth: false,
      description: 'transaccion webpay',
      notes: 'create or modify client',
      tags: ['api'],
      handler: async (request) => {
        try {
          let payload = request.payload

          const createResponse = await (new WebpayPlus.Transaction()).create(
            payload.buyOrder,
            payload.sessionId,
            payload.amount,
            payload.returnUrl
          )

          // <form action="https://webpay3gint.transbank.cl/webpayserver/initTransaction" method="POST">
          //   <input type="hidden" name="token_ws" value="createResponse.token"/>
          //   <input type="submit" value="Pagar"/>
          // </form>

          //if anuled
          //response
          // {
          //   'token_ws': '',
          //   'tbk_token': 'createResponse.token',
          //   'tbk_orden_compra': 'O-13331',
          //   'tbk_id_sesion': 'S-99531'
          //  }

          return createResponse

        } catch (error) {
          console.log(error)

          return {
            error: 'Ha ocurrido un error al guardar datos de usuario'
          }
        }
      },
      validate: {
        payload: Joi.object().keys({
          buyOrder: Joi.string().required(),
          sessionId: Joi.string().required(),
          amount: Joi.number().required(),
          returnUrl: Joi.string().required(),
        })
      }
    }
  }
]