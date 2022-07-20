export default {
    method: ['GET'],
    path: '/',
    options: {
        handler: (request, h) => {
            let credentials = request.auth.credentials
            //console.log(credentials);
            credentials[credentials.scope] = true

            if (credentials.scope === 'member') {
                //console.log('go to other')
                return h.redirect('/membersView')
            } else {
                //console.log('go to lectures');
                return h.redirect('/lectures')
            }

            //return h.view('inventory', { credentials })
            return h.view('home', { credentials })
        }
    }
}