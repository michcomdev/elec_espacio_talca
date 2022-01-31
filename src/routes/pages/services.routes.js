export default {
    method: ['GET'],
    path: '/services',
    options: {
        handler: (request, h) => {
            let credentials = request.auth.credentials
            credentials[credentials.scope] = true

            return h.view('services', { credentials })
        }
    }
}