let userCredentials

ready(async ()=> {
    let sessionResult = await axios('api/session')
    userCredentials = sessionResult.data

    document.querySelector('#userCredentials').innerHTML = sessionResult.data.name+' '+sessionResult.data.lastname/*.split(' ')[0].toUpperCase()*/

    setInterval(()=> {
        checkSession()
    }, 60000)
})

function loadingHandler(status) {
    let loadingSelector = querySelector('#loadingScreen')
    let closeLoadingScreenContainerSelector = querySelector('#closeLoadingScreenContainer')
    let closeLoadingScreenSelector = querySelector('#closeLoadingScreen')

    closeLoadingScreenSelector.addEventListener('click', ()=> {
        loadingSelector.style.display = 'none'
    })

    let closeLoadingTimeout = setTimeout(() => {
        closeLoadingScreenContainerSelector.style.display = 'block'
    }, 6000)

    if (!status != status === 'stop') {
        loadingSelector.style.display = 'none'
        clearTimeout(closeLoadingTimeout)

        console.log('LOADING STOPPED')
    } else if (status === 'start') {
        closeLoadingScreenContainerSelector.style.display = 'none'

        loadingSelector.style.display = 'flex'
        loadingSelector.style.position = 'fixed'
    } else {
        loadingSelector.style.display = 'none'
        console.log('LOADING STOPPED')
    }
}

function getMonthString(month){
    let result = ''
    switch(month) {
        case '01':
            result = 'Enero'
        break
        case '02':
            result = 'Febrero'
        break
        case '03':
            result = 'Marzo'
        break
        case '04':
            result = 'Abril'
        break
        case '05':
            result = 'Mayo'
        break
        case '06':
            result = 'Junio'
        break
        case '07':
            result = 'Julio'
        break
        case '08':
            result = 'Agosto'
        break
        case '09':
            result = 'Septiembre'
        break
        case '10':
            result = 'Octubre'
        break
        case '11':
            result = 'Noviembre'
        break
        case '12':
            result = 'Diciembre'
        break
        default:
            result = 'No Válido'    
    }
    return result
}