export default {
    method: ['GET'],
    path: '/sectors',
    options: {
        handler: (request, h) => {
            let credentials = request.auth.credentials
            credentials[credentials.scope] = true

            return h.view('sectors', { credentials })
        }
    }
}