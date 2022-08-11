export default {
    method: ['GET'],
    path: '/cartola',
    options: {
        handler: (request, h) => {
            let credentials = request.auth.credentials
            credentials[credentials.scope] = true

            return h.view('cartola', { credentials })
        }
    }
}