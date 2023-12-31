let switchboards
let tableMeters
let tableMeterHistory

$(document).ready(async function () {
    loadSwitchboards()
    //testAjax()
    //loadInstructivesTable()
    //$("#modalMeter").modal('show')

})

async function loadSwitchboards() {
    let switchboardsData = await axios.get('api/switchboards')
    switchboards = switchboardsData.data
    // console.log("aaaaasdas",switchboards)
    for(let i=0; i<switchboards.length; i++){
        $("#listSwitchboards").append(`
            <div class="card col-md-12" style="text-align: center; margin-top:30px;margin-bottom:30px; width:300px; height:300px;">
                <img class="card-img-top mx-auto " src="/public/img/switchboard.png" style="width: 100px">
                <div class="card-body">
                    <h5 class="card-title">${switchboards[i].name}</h5>
                    <p class="card-text">${switchboards[i].ip_address}</p>
                    <button id="switchboardButton${i}" class="btn"  onclick="showMeters(${i})" style="text-align: center; background-color:#F6511D;">
                        Mostrar Medidores
                    </button>
                </div>
            </div>
        `)
    }

}

function showMeters(index) {

    $("#switchboardButton"+index).attr('disabled',true)
    $("#switchboardButton"+index).html('<i class="fa fa-spinner fa-pulse fa-fw"></i>')
    try {
        if ($.fn.DataTable.isDataTable('#tableMeters')) {
            tableMeters.clear().destroy()
        }

        tableMeters = $('#tableMeters')
            .DataTable({
                dom: 'Bfrtip',
                buttons: ['excel','pdf'],
                iDisplayLength: 100,
                responsive: false,
                //order: [[0, 'desc']],
                columnDefs: [{ targets: [0, 1, 3, 4, 5], className: 'dt-center' }],
                ordering: true,
                rowCallback: function (row, data) {
                },
                language: {
                    url: spanishDataTableLang
                },
                columns: [
                    { data: 'address' },
                    { data: 'name' },
                    { data: 'client' },
                    { data: 'lastDate' },
                    { data: 'status' },
                    { data: 'lastLecture' }

                ],
                initComplete: function (settings, json) {
                    getMeters(index)
                }
            })


        $('#tableMeters tbody').off('click')

        $('#tableMeters tbody').on('click', 'tr', function () {

            showMeterData(tableMeters.row($(this)).data())
            /*if ($(this).hasClass('selected')) {
                $(this).removeClass('selected')
                disAbleButt(true)
            } else {
                tableMeters.$('tr.selected').removeClass('selected')
                $(this).addClass('selected')
                disAbleButt(false)
                internals.instructives.data = tableMeters.row($(this)).data()
                internals.rowSelected = tableMeters.row($(this))
            }*/
        })
    } catch (error) {
        console.log(error)
        $("#switchboardButton"+index).removeAttr('disabled')
        $("#switchboardButton"+index).html('Mostrar Medidores')
    }
}

async function getMeters(index) {

    let lecturesData
    try {
        lecturesData = await axios.get('api/allLectures/'+switchboards[index]._id)
    }catch(err) {
        console.log('error',err.message)
    }
    let lectures
    if(lecturesData){
        lectures = lecturesData.data
    }
    //console.log(lectures)


    if (switchboards[index].meters.length > 0) {
        let formatData = switchboards[index].meters.map(el => {
            
            el.client = el.clients.lastname + ' ' + el.clients.name

            if(lectures){
                let lecture = lectures.find(x => x.primaryAddress == el.address)
                el.lastDate = moment().format('DD/MM/YYYY HH:mm')
                el.status = '<i class="fas fa-check-circle" style="color: green"></i> Activo'
                el.lastLecture = (lecture.dataPoints[0].value / 100).toFixed(2)
            }else{
                el.status = '<i class="fas fa-minus-circle" style="color: red"></i> Desconectado'
                el.lastDate = moment(el.lastDate).format('DD/MM/YYYY HH:mm')
                el.lastLecture = (el.lastLecture / 100).toFixed(2)

            }

            
            return el
        })

        tableMeters.rows.add(formatData).draw()
        console.log(formatData)
        //manualSave(index)
        $("#switchboardButton"+index).removeAttr('disabled')
        $("#switchboardButton"+index).html('Mostrar Medidores')
    } else {
        toastr.warning('No se han encontrado datos dentro del rango')
        $("#switchboardButton"+index).removeAttr('disabled')
        $("#switchboardButton"+index).html('Mostrar Medidores')
    }
}

async function showMeterData(meter) {

    ///////////HEADER///////////
    
    //let statusIcon = '<i class="fas fa-check-circle" style="color: green"></i>'
    $("#meterImg").attr('src','/public/img/meter_light.png')
    if(meter.status == '<i class="fas fa-minus-circle" style="color: red"></i> Desconectado'){
        //statusIcon = '<i class="fas fa-minus-circle" style="color: red"></i>'
        $("#meterImg").attr('src','/public/img/meter.png')
    }
    $("#meterValue").css('font-size','34px')


    console.log(meter.lastLecture)

    let meterValue = parseFloat(meter.lastLecture)// / 100
    //let meterValue = 100
    if(meterValue>=100){
        meterValue = meterValue.toFixed(1)
        $("#meterValue").css('font-size','28px')
        if(meterValue>=1000){
            $("#meterValue").css('font-size','25px')
        }
    }else{
        meterValue = meterValue.toFixed(2)
    }

    $("#meterValue").text(meterValue)
    
    $("#modalMeter_title").text(`N° ${meter.address} - ${meter.client}`)
    $("#tableMeter").html(`
        <tr>
            <td>Cliente</td>
            <th>${meter.client}</th>
        </tr>
        <tr>
            <td>N° serie</td>
            <th>${meter.serialNumber}</th>
        </tr>
        <tr>
            <td>Estado</td>
            <th>${meter.status}</th>
        </tr>`)

    /////////TABLA HISTÓRICA/////////
    let meterData = await axios.get('api/meterByID/' + meter._id) //Para obtener datos guardados
    let meterHistory = meterData.data.lectures

    console.log(meterHistory)
    
    //$("#tableMeterHistoryBody").html('')

    if ($.fn.DataTable.isDataTable('#tableMeterHistory')) {
        console.log('here1')
        tableMeterHistory.clear().destroy()
        console.log('here2')
    }

    for(let i=0; i<meterHistory.length; i++){
        $("#tableMeterHistoryBody").append(`
            <tr>
                <td style="text-align: center">${i}</td>
                <td style="text-align: center">${moment(meterHistory[i].date).format('DD/MM/YYYY HH:mm')}</td>
                <td style="text-align: center">${(meterHistory[i].value / 100).toFixed(2)}</td>
            </tr>`)
    }


    

    tableMeterHistory = $('#tableMeterHistory')
        .DataTable({
            dom: 'Bfrtip',
            buttons: ['excel','pdf'],
            iDisplayLength: 10,
            responsive: false,
            order: [[0, 'desc']],
            columnDefs: [
                { targets: 0, visible: false },
                { targets: [1, 2], className: 'dt-center' }
                ],
            //ordering: true,
            rowCallback: function (row, data) {
            },
            language: {
                url: spanishDataTableLang
            }
        })

    $("#modalMeter").modal('show')

}

async function manualSave(index){

    let save = await axios.get('api/allLecturesSave/'+switchboards[index]._id)
    console.log(save)
    if(save){
        toastr.success('Almacenado correctamente')
    }else{
        toastr.danger('Ha ocurrido un error')
    }

    /*let metersArray = switchboards[index].meters
    for(let i=0; i<metersArray.length; i++){
        console.log(metersArray[i])
    }*/


}