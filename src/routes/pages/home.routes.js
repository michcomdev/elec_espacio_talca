export default {
    method: ['GET'],
    path: '/',
    options: {
        handler: (request, h) => {
            let credentials = request.auth.credentials
            credentials[credentials.scope] = true

            //return h.view('inventory', { credentials })
            return h.redirect('/lectures')
            return h.view('home', { credentials })
        }
    }
}