export default {
    method: ['GET'],
    path: '/parameters',
    options: {
        handler: (request, h) => {
            let credentials = request.auth.credentials
            credentials[credentials.scope] = true

            return h.view('parameters', { credentials })
        }
    }
}