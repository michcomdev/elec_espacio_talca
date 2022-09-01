export default {
    method: ['GET'],
    path: '/lecturesFull',
    options: {
        handler: (request, h) => {
            let credentials = request.auth.credentials
            credentials[credentials.scope] = true

            return h.view('lecturesFull', { credentials })
        }
    }
}