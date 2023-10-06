export default {
    method: ['GET'],
    path: '/clients',
    options: {
        handler: (request, h) => {
            let credentials = request.auth.credentials
            credentials[credentials.scope] = true

            return h.view('clients', { credentials })
        }
    }
}