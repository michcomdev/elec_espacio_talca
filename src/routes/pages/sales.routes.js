export default {
    method: ['GET'],
    path: '/sales',
    options: {
        handler: (request, h) => {
            let credentials = request.auth.credentials
            credentials[credentials.scope] = true

            return h.view('sales', { credentials })
        }
    }
}