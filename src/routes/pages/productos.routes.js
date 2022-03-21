export default {
    method: ['GET'],
    path: '/productos',
    options: {
        auth: false,
        handler: (request, h) => {
            let publico = 'ok'
            return h.view('productos', { publico }, { layout: 'no-logged-layout' })
        }
    }
}