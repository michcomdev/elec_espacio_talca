export default {
    method: ['GET'],
    path: '/repInvoicesPaymentAll',
    options: {
        handler: (request, h) => {
            let credentials = request.auth.credentials
            credentials[credentials.scope] = true

            return h.view('repInvoicesPaymentAll', { credentials })
        }
    }
}