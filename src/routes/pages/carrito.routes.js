export default {
    method: ['GET'],
    path: '/carrito',
    options: {
        auth: false,
        handler: (request, h) => {
            let publico = 'ok'
            return h.view('carrito', { publico }, { layout: 'no-logged-layout' })
        }
    }
}