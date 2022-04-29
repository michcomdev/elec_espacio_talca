export default {
    method: ['GET'],
    path: '/lectures',
    options: {
        handler: (request, h) => {
            let credentials = request.auth.credentials
            credentials[credentials.scope] = true

            return h.view('lectures', { credentials })
        }
    }
}