export default {
    method: ['GET'],
    path: '/repInvoicesPayment',
    options: {
        handler: (request, h) => {
            let credentials = request.auth.credentials
            credentials[credentials.scope] = true

            return h.view('repInvoicesPayment', { credentials })
        }
    }
}