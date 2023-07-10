export default {
    method: ['GET'],
    path: '/instructive',
    options: {
        handler: (request, h) => {
            let credentials = request.auth.credentials
            credentials[credentials.scope] = true

            return h.view('instructive', { credentials })
        }
    }
}