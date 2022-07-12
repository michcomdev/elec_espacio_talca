export default {
    method: ['GET'],
    path: '/membersView',
    options: {
        handler: (request, h) => {
            let credentials = request.auth.credentials
            credentials[credentials.scope] = true

            return h.view('members-view', { credentials })
        }
    }
}