export default {
    method: ['GET'],
    path: '/tractors',
    options: {
        handler: (request, h) => {
            let credentials = request.auth.credentials
            credentials[credentials.scope] = true

            return h.view('tractors', { credentials })
        }
    }
}