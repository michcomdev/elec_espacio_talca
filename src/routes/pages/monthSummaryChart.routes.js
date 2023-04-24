export default {
    method: ['GET'],
    path: '/monthSummaryChart',
    options: {
        handler: (request, h) => {
            let credentials = request.auth.credentials
            credentials[credentials.scope] = true

            return h.view('monthSummaryChart', { credentials })
        }
    }
}