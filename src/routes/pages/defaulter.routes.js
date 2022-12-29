export default {
    method: ['GET'],
    path: '/defaulter',
    options: {
        handler: (request, h) => {
            let credentials = request.auth.credentials
            credentials[credentials.scope] = true

            return h.view('defaulter', { credentials })
        }
    }
}