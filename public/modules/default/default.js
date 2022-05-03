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
        case 1:
            result = 'Enero'
        break
        case 2:
            result = 'Febrero'
        break
        case 3:
            result = 'Marzo'
        break
        case 4:
            result = 'Abril'
        break
        case 5:
            result = 'Mayo'
        break
        case 6:
            result = 'Junio'
        break
        case 7:
            result = 'Julio'
        break
        case 8:
            result = 'Agosto'
        break
        case 9:
            result = 'Septiembre'
        break
        case 10:
            result = 'Octubre'
        break
        case 11:
            result = 'Noviembre'
        break
        case 12:
            result = 'Diciembre'
        break
        default:
            result = 'No Válido'    
    }
    return result
}

function getMonthShortString(month){
    let result = ''
    switch(month) {
        case 1:
            result = 'Ene'
        break
        case 2:
            result = 'Feb'
        break
        case 3:
            result = 'Mar'
        break
        case 4:
            result = 'Abr'
        break
        case 5:
            result = 'May'
        break
        case 6:
            result = 'Jun'
        break
        case 7:
            result = 'Jul'
        break
        case 8:
            result = 'Ago'
        break
        case 9:
            result = 'Sep'
        break
        case 10:
            result = 'Oct'
        break
        case 11:
            result = 'Nov'
        break
        case 12:
            result = 'Dic'
        break
        default:
            result = 'N/A'    
    }
    return result
}