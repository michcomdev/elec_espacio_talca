export default {
    method: ['GET'],
    path: '/macro',
    options: {
        handler: (request, h) => {
            let credentials = request.auth.credentials
            credentials[credentials.scope] = true

            return h.view('macro', { credentials })
        }
    }
}