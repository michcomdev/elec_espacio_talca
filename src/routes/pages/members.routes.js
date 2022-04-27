export default {
    method: ['GET'],
    path: '/members',
    options: {
        handler: (request, h) => {
            let credentials = request.auth.credentials
            credentials[credentials.scope] = true

            return h.view('members', { credentials })
        }
    }
}