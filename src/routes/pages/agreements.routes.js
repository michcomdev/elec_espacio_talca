export default {
    method: ['GET'],
    path: '/agreements',
    options: {
        handler: (request, h) => {
            let credentials = request.auth.credentials
            credentials[credentials.scope] = true

            return h.view('agreements', { credentials })
        }
    }
}