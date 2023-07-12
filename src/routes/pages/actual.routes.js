export default {
    method: ['GET'],
    path: '/actual',
    options: {
        handler: (request, h) => {
            let credentials = request.auth.credentials
            credentials[credentials.scope] = true

            return h.view('actual', { credentials })
        }
    }
}