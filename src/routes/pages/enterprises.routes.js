export default {
    method: ['GET'],
    path: '/enterprises',
    options: {
        handler: (request, h) => {
            let credentials = request.auth.credentials
            credentials[credentials.scope] = true

            return h.view('enterprises', { credentials })
        }
    }
}