export default {
    method: ['GET'],
    path: '/monthSummary',
    options: {
        handler: (request, h) => {
            let credentials = request.auth.credentials
            credentials[credentials.scope] = true

            return h.view('monthSummary', { credentials })
        }
    }
}