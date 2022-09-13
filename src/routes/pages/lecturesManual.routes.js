export default {
    method: ['GET'],
    path: '/lecturesManual',
    options: {
        handler: (request, h) => {
            let credentials = request.auth.credentials
            credentials[credentials.scope] = true

            return h.view('lecturesManual', { credentials })
        }
    }
}