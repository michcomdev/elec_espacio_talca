export default {
    method: ['GET'],
    path: '/repInvoices',
    options: {
        handler: (request, h) => {
            let credentials = request.auth.credentials
            credentials[credentials.scope] = true

            return h.view('repInvoices', { credentials })
        }
    }
}