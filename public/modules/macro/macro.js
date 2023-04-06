let internals = {
    members: {
        table: {},
        data: []
    },
    lectures: {
        table: {},
        data: []
    },
    dataRowSelected: {},
    productRowSelected: {}
}

let clients = {}
let containerTypes = {}
let sites = {}
let cranes = {}
let sectors = {}
let serviceList = ''

let parameters

$(document).ready(async function () {
    $('#searchDate').daterangepicker({
        opens: 'left',
        locale: dateRangePickerDefaultLocale,
        startDate: moment().add(-1, 'months')
        //endDate: moment()
    }, function (start, end, label) {
        //internals.initDate = start.format('YYYY-MM-DD')
        //internals.endDate = end.format('YYYY-MM-DD')
    })
    
    getParameters()

    //loadMacro()
})

async function getParameters() {

    let firstYear = 2021
    for (let i = firstYear; i <= moment().format('YYYY'); i++) {
        $("#searchYear").append(`<option value="${i}">${i}</option>`)
    }
    
    let setYear = moment().format('YYYY')
    let setMonth = moment().format('MM')

    if(moment().day()<20){
        if(setMonth=='01'){
            setYear = moment().add(-1,'y').format('YYYY')
            setMonth = '12'
        }else{
            setMonth = moment().add(-1,'M').format('MM')
        }
    }

    $("#searchYear").val(setYear)
    $("#searchMonth").val(setMonth)


    let parametersData = await axios.get('/api/parameters')
    parameters = parametersData.data

    let sectorsData = await axios.get('api/sectors')
    sectors = sectorsData.data

    $("#searchSector").append(
        sectors.reduce((acc,el)=>{
            acc += '<option value="'+el._id+'">'+el.name+'</option>'
            return acc
        },'')
    )

    let servicesData = await axios.post('/api/servicesByFilter', {invoice: 'INGRESO'})
    let services = servicesData.data

    serviceList = `<tr><td>
                        <select class="form-control form-control-sm form-select" onchange="serviceValue(this)"><option value="0" data-value="0">Seleccione</option>`
    for(let i=0; i<services.length; i++){
        serviceList += `<option value="${services[i]._id}" data-value="${services[i].value}">${services[i].name}</option>`
    }
    serviceList += `</select></td>
                    <td>
                        <input type="text" class="form-control form-control-sm serviceValue" style="text-align: right" value="0"/>
                    </td>
                    <td>
                        <button style="border-radius:5px;" class="btn btn-sm btn-danger" onclick="deleteService(this)"><i ="color:#3498db;" class="fas fa-times"></i></button>
                    </td>
                </tr>`

}

function loadMacro() {
    /*try {
        if ($.fn.DataTable.isDataTable('#tableMembers')) {
            internals.members.table.clear().destroy()
        }
        internals.members.table = $('#tableMembers')
            .DataTable({
                dom: 'Bfrtip',
                buttons: [
                    {
                        extend: 'excel',
                        className: 'btn-excel'
                    },
                    {
                        extend: 'pdf',
                        className: 'btn-pdf'
                    },

                ],
                iDisplayLength: 10,
                oLanguage: {
                    sSearch: 'buscar:'
                },
                lengthMenu: [[50, 100, 500, -1], [50, 100, 500, 'Todos los registros']],
                language: {
                    url: spanishDataTableLang
                },
                responsive: true,
                //columnDefs: [{ targets: [0, 1, 4, 5, 6], className: 'dt-center' }],
                order: [[0, 'asc']],
                ordering: true,
                rowCallback: function (row, data) {
                    //$(row).find('td:eq(1)').html(moment.utc(data.date).format('DD/MM/YYYY'))
                    //$(row).find('td:eq(5)').html(dot_separators(data.lastLecture))
                    // $('td', row).css('background-color', 'White');
                },
                columns: [
                    { data: 'U' },
                    { data: 'ORIGEN' },
                    { data: 'RUT' },
                    { data: 'DV_RUT' },
                    { data: 'AP_PATERNO' },
                    { data: 'AP_MATERNO' },
                    { data: 'NOMBRES' },
                    { data: 'DIRECCION' },
                    { data: 'NUM_DEC' },
                    { data: 'FEC_DEC' },
                    { data: 'TRAMO_RSH' },
                    { data: 'FEC_ENC' },
                    { data: 'NUMUNICO' },
                    { data: 'DV_NUMUNICO' },
                    { data: 'NUMVIVTOT' },
                    { data: 'CONSUMO' },
                    { data: 'MONSUBS' },
                    { data: 'MONCOBEN' },
                    { data: 'NUMDEUD' },
                    { data: 'MONDEUD' },
                    { data: 'OBSERVACION' }
                ],
                initComplete: function (settings, json) {
                    getMembers()
                }
            })

    } catch (error) {
        console.log(error)
    }*/
    getMembers()

}

async function getMembers() {
    loadingHandler('start')
    let lecturesData = await axios.post('api/lecturesMacro', { year: $("#searchYear").val(), month: $("#searchMonth").val() })
   //console.log(lecturesData.data)
    if (lecturesData.data.length > 0) {
        let formatData = lecturesData.data.map(el => {
        
            el.U = '0'+parameters.municipality.code
            el.ORIGEN = 'CURICO'
            
            
            el.DIRECCION = el.members.address.address

            let subsidy
            for(let i=0; i<el.members.subsidies.length; i++){
                if(el.members.subsidies[i].status=='active'){
                    subsidy = el.members.subsidies[i]
                }
            }

            let rut = replaceAll(subsidy.rut, '.', '').split('-')
            while (rut[0].length<11) {
                rut[0] = '0' + rut[0]
            }
            el.RUT = rut[0]
            el.DV_RUT = rut[1]
            el.AP_PATERNO = subsidy.lastname1
            el.AP_MATERNO = subsidy.lastname2
            el.NOMBRES = subsidy.name

            while (subsidy.decreeNumber.toString().length<9) {
                subsidy.decreeNumber = '0' + subsidy.decreeNumber.toString()
            }
            el.NUM_DEC = subsidy.decreeNumber.toString()
            el.FEC_DEC = moment(subsidy.decreeDate).utc().format('DD-MM-YYYY')
            while (subsidy.sectionRSH.toString().length<6) {
                subsidy.sectionRSH = '0' + subsidy.sectionRSH.toString()
            }
            el.TRAMO_RSH = subsidy.sectionRSH.toString()
            el.FEC_ENC = moment(subsidy.inscriptionDate).utc().format('DD-MM-YYYY')
            while (el.members.subsidyNumber.toString().length<11) {
                el.members.subsidyNumber = '0' + el.members.subsidyNumber.toString()
            }
            el.NUMUNICO = el.members.subsidyNumber.toString()
            el.DV_NUMUNICO = '0'
            while (subsidy.houseQuantity.toString().length<2) {
                subsidy.houseQuantity = '0' + subsidy.houseQuantity.toString()
            }
            el.NUMVIVTOT = subsidy.houseQuantity.toString()
            if(el.invoice){

                let consumo = el.invoice.lectureResult
                while (consumo.toString().length<3) {
                    consumo = '0' + consumo.toString()
                }
                let monsubs = el.invoice.subsidyValue
                while (monsubs.toString().length<6) {
                    monsubs = '0' + monsubs.toString()
                }

                let moncoben = el.invoice.charge + el.invoice.sewerage + (el.invoice.lectureResult * el.invoice.meterValue)
                while (moncoben.toString().length<6) {
                    moncoben = '0' + moncoben.toString()
                }
                let numdeud = el.invoiceDebts
                while (numdeud.toString().length<6) {
                    numdeud = '0' + numdeud.toString()
                }
                let mondeud = el.invoice.invoiceTotal
                while (mondeud.toString().length<6) {
                    mondeud = '0' + mondeud.toString()
                }

                el.CONSUMO = consumo
                el.MONSUBS = monsubs
                el.MONCOBEN = moncoben
                el.NUMDEUD = numdeud
                el.MONDEUD = mondeud
            }else{
                el.CONSUMO = ''
                el.MONSUBS = ''
                el.MONCOBEN = ''
                el.NUMDEUD = ''
                el.MONDEUD = ''
            }
            if(subsidy.percentage==50){
                el.OBSERVACION = '10'
            }else{
                el.OBSERVACION = '20'
            }

            return el
        })

        formatData.sort((a,b) => (a.AP_MATERNO > b.AP_MATERNO) ? 1 : ((b.AP_MATERNO > a.AP_MATERNO) ? -1 : 0))
        formatData.sort((a,b) => (a.AP_PATERNO > b.AP_PATERNO) ? 1 : ((b.AP_PATERNO > a.AP_PATERNO) ? -1 : 0))


        //internals.members.table.rows.add(formatData).draw()
        if(formatData.length==0){
            loadingHandler('stop')
        }
        $("#tableMembersBody").html('')

        for(let i=0; i<formatData.length; i++){
            $("#tableMembersBody").append(`
                <tr>
                    <td class="stringMS">${formatData[i].U}</td>
                    <td class="stringMS">${formatData[i].ORIGEN}</td>
                    <td class="stringMS">${formatData[i].RUT}</td>
                    <td class="stringMS">${formatData[i].DV_RUT}</td>
                    <td class="stringMS">${formatData[i].AP_PATERNO}</td>
                    <td class="stringMS">${formatData[i].AP_MATERNO}</td>
                    <td class="stringMS">${formatData[i].NOMBRES}</td>
                    <td class="stringMS">${formatData[i].DIRECCION}</td>
                    <td class="stringMS">${formatData[i].NUM_DEC}</td>
                    <td class="stringMS">${formatData[i].FEC_DEC}</td>
                    <td class="stringMS">${formatData[i].TRAMO_RSH}</td>
                    <td class="stringMS">${formatData[i].FEC_ENC}</td>
                    <td class="stringMS">${formatData[i].NUMUNICO}</td>
                    <td class="stringMS">${formatData[i].DV_NUMUNICO}</td>
                    <td class="stringMS">${formatData[i].NUMVIVTOT}</td>
                    <td class="stringMS">${formatData[i].CONSUMO}</td>
                    <td class="stringMS">${formatData[i].MONSUBS}</td>
                    <td class="stringMS">${formatData[i].MONCOBEN}</td>
                    <td class="stringMS">${formatData[i].NUMDEUD}</td>
                    <td class="stringMS">${formatData[i].MONDEUD}</td>
                    <td class="stringMS">${formatData[i].OBSERVACION}</td>
                </tr>            
            `)
            if(i+1==formatData.length){
                loadingHandler('stop')
            }
        }

        $('#loadingMembers').empty()
    } else {
        toastr.warning('No hay boletas creadas en este período')
        loadingHandler('stop')
        $('#loadingMembers').empty()
    }
}

$('#searchMembers').on('click', async function () {
    loadMacro()
})

$('#updateLectures').on('click', async function () {

    let memberData = await axios.post('/api/memberSingle', { id: internals.dataRowSelected._id })
    let member = memberData.data
    $('#lectureModal').modal('show')

    let name = ''
    let type = ''
    if (member.type == 'personal') {
        type = 'PERSONAL'
        name = member.personal.name + ' ' + member.personal.lastname1 + ' ' + member.personal.lastname2
    } else {
        type = 'EMPRESA'
        name = member.enterprise.name
    }

    $('#modalLecture_title').html(`Lecturas Socio N° ${member.number} - ${member.personal.name + ' ' + member.personal.lastname1 + ' ' + member.personal.lastname2}`)
    createModalBody(member)

    $('#modalLecture_footer').html(`
        <button style="border-radius: 5px;" class="btn btn-dark" data-dismiss="modal">
            <i ="color:#E74C3C;" class="fas fa-times"></i> CERRAR
        </button>
    `)

    $('#memberNumber').val(member.number)
    $('#memberType').val(type)
    $('#memberRUT').val(member.rut)
    $('#memberName').val(name)
    $('#memberWaterMeter').val(member.waterMeters.find(x => x.state === 'Activo').number)
    $('#memberAddress').val(member.address.address)

    loadInvoices(member)

})


async function loadInvoices(member) {

    let invoiceData = await axios.post('/api/invoicesSingleMember', { member: internals.dataRowSelected._id })
    let invoices = invoiceData.data

    console.log(invoices)

    $('#tableInvoicesBody').html('')

    for (i = 0; i < invoices.length; i++) {

        let total = 0
        let btn = '', btnGenerate = '', btnSII = '', btnPayment = ''
        let invoiceID = 0
        
        total = dot_separators(invoices[i].invoiceTotal)
        //btn = `<button class="btn btn-sm btn-info btnLecture" onclick="printInvoice('preview','${member.type}','${member._id}','${invoices[i]._id}')"><i class="far fa-eye" style="font-size: 14px;"></i></button>`
        
        invoiceID = invoices[i]._id
        btn = `<button class="btn btn-sm btn-info btnLecture" onclick="printVoucher('${member._id}','${invoiceID}')"><i class="fas fa-print" style="font-size: 14px;"></i></button>`
        
        /*if(invoices[i].number){
            btnGenerate = `<button class="btn btn-sm btn-danger btnLecture" onclick="printInvoice('pdf','${member.type}','${member._id}','${invoices[i]._id}')"><i class="far fa-file-pdf" style="font-size: 14px;"></i></button>`
            btnPayment = `<button class="btn btn-sm btn-info btnLecture" onclick="payInvoice('pdf','${member.type}','${member._id}','${invoices[i]._id}')"><i class="fas fa-dollar-sign" style="font-size: 14px;"></i></button>`
        }else{
            btnGenerate = `<button class="btn btn-sm btn-info btnLecture" onclick="sendData('${member.type}','${member._id}','${invoices[i]._id}')">Generar DTE</button>`
        }
        if(invoices[i].token){
            btnSII = `<button class="btn btn-sm btn-warning btnLecture" onclick="showSIIPDF('${invoices[i].token}')"><img src="/public/img/logo_sii.png" style="width: 24px"/></button>`
        }*/
        
        $('#tableInvoicesBody').append(`
            <tr id="${invoices[i]._id}" data-invoice="${invoiceID}">
                <td style="text-align: center;">
                    ${moment(invoices[i].date).utc().format('DD/MM/YYYY')}
                </td>
                <td style="text-align: center;">
                    ${total}
                </td>
                <td style="text-align: center;">
                    <button class="btn btn-sm btn-warning btnLecture" onclick="createInvoice('${invoices[i]._id}','${member._id}')"><i class="far fa-edit" style="font-size: 14px;"></i></button>
                </td>
                <td style="text-align: center;">
                    ${btn}
                </td>
                <td style="text-align: center;">
                    POR PAGAR
                </td>
            </tr>
        `)
    }

    /*$('#tableInvoices tbody').off("click")

    $('#tableInvoices tbody').on('click', 'tr', function () {
            $('#tableInvoicesBody > tr').removeClass('table-primary')
            $(this).addClass('table-primary')
            $('#divInvoice').css('display', 'block')
            $('#tableInvoices tbody').off("click")
            $('.btnLecture').attr('disabled',true)
            createInvoice($(this).attr('id'), $(this).attr('data-invoice'), member)
    
    })*/

}


function validateInvoiceData(invoiceData) {

    let errorMessage = ''
    if (!$.isNumeric(invoiceData.invoiceTotal)) {
        errorMessage += '<br>Total'
    }

    if (invoiceData.services) {
        for(let i=0; i<invoiceData.services.length; i++){
            if(invoiceData.services[i].services=='0'){
                errorMessage += '<br>Seleccionar servicio(s)'
            }
            if (!$.isNumeric(invoiceData.services[i].value) || invoiceData.services[i].value==0) {
                errorMessage += '<br>Valor servicio'
            }
        }
    } else {
        errorMessage += '<br>Servicios'
    }


    if (errorMessage.length === 0) {
        return { ok: invoiceData }
    } else {
        $(document).on('hidden.bs.modal', '.modal', function () { //Soluciona problema de scroll
            $('.modal:visible').length && $(document.body).addClass('modal-open')
        })

        $('#modal').modal('show')
        $('#modal_title').html(`Error al almacenar ingreso`)
        $('#modal_body').html(`<h7 class="alert-heading">Falta ingresar los siguientes datos:</h7>
                                    <p class="mb-0">${errorMessage}</p>`)

        return { err: invoiceData }
    }
}

function createModalBody(member) {

    let body = /*html*/ `
    <div class="row">
    <div class="col-md-12">
    <h5>Datos de socio</h5>
        <div class="row">
            <div class="col-md-2">
                RUT
                <input id="memberRUT" type="text" class="form-control form-control-sm border-input" disabled>
            </div>
            <div class="col-md-3">
                Nombre
                <input id="memberName" type="text" class="form-control form-control-sm border-input" disabled>
            </div>
            <div class="col-md-1">
                N° Medidor
                <input id="memberWaterMeter" type="text" class="form-control form-control-sm border-input" disabled>
            </div>
            <div class="col-md-2">
                Tipo
                <input id="memberType" type="text" class="form-control form-control-sm border-input" disabled>
            </div>
            <div class="col-md-4">
                Dirección
                <input id="memberAddress" type="text" class="form-control form-control-sm border-input" disabled>
            </div>
            
            <!--<div class="col-md-12">
                <br/><br/>
            </div>-->
            
        </div>
    </div>
</div>
<br />
<br />
<div class="row">


<h5>Boletas de Ingresos realizadas</h5>
    <div class="col-md-12">
        <div class="row">

            <div class="col-md-3">
                <button style="border-radius: 5px;" class="btn btn-primary" onclick="createInvoice(0,'${member._id}')"><i class="fas fa-plus-circle"></i> Agregar nuevo Ingreso</button>
                <br/>
                <br/>
            </div>
            <div class="col-md-8 table-responsive">
            </div>
            <div class="col-md-8 table-responsive">
                <table id="tableInvoices" class="display nowrap table table-condensed cell-border" cellspacing="0">
                    <thead id="tableInvoicesHead">
                        <tr class="table-info">
                            <th style="text-align: center; background-color: #3B6FC9; border-top-left-radius: 5px;">Fecha</th>
                            <th style="text-align: center; background-color: #3B6FC9;">Valor Total</th>
                            <th style="text-align: center; background-color: #3B6FC9;">Crear/Editar</th>
                            <th style="text-align: center; background-color: #3B6FC9;">Ver Comprobante Previa</th>
                            <th style="text-align: center; background-color: #3B6FC9; border-top-right-radius: 5px;">Estado Pago</th>
                        </tr>
                    </thead>
                    <tbody id="tableInvoicesBody">
                    </tbody>
                </table>
            </div>
            <div class="col-md-4">
                
            </div>

            <div class="col-md-2">
            </div>
            <div class="col-md-8">
                <br />
                <br />
                <br />
                <br />
                <div id="divInvoice" class="card border-primary" style="display: none;">
                    <div class="card-header text-white bg-primary" style="text-align: center">
                        <b id="invoiceTitle">Registro de Ingreso</b>
                    </div>

                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-3">
                                Fecha
                            </div>
                            <div class="col-md-3">
                                <input id="invoiceDate" type="text" class="form-control form-control-sm border-input invoiceDateClass" value="${moment.utc().format('DD/MM/YYYY')}">
                            </div>
                            <div class="col-md-3">
                                Fecha Vencimiento
                            </div>
                            <div class="col-md-3">
                                <input id="invoiceDateExpire" type="text" class="form-control form-control-sm border-input invoiceDateClass" value="${moment.utc().add(15, 'days').format('DD/MM/YYYY')}">
                            </div>
                        </div>

                        <div class="card border-primary">
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-12" style="text-align: center">
                                        <b>Servicios</b>
                                    </div>

                                    <div class="col-md-6" style="text-align: center;">
                                        <button style="border-radius: 5px;" class="btn btn-sm btn-primary" onclick="addService()"><i class="fas fa-plus-circle"></i> Agregar Servicio</button>
                                    </div>
                                    <div class="col-md-6" style="text-align: center;">
                                        <button style="border-radius: 5px;" class="btn btn-sm btn-info" onclick="addServiceOther()"><i class="fas fa-plus-circle"></i> Agregar Otro</button>
                                    </div>

                                    <div class="col-md-12">

                                        <table class="table" style="font-size: 12px">
                                            <thead>
                                                <tr>
                                                    <th>Servicio</th>
                                                    <th>Valor</th>
                                                    <th>Quitar</th>
                                                </tr>
                                            </thead>
                                            <tbody id="tableBodyServices">
                                           
                                            </tbody>
                                        </table>
                                    </div>
                                    <div class="col-md-6">
                                        Total Servicios $
                                    </div>
                                    <div class="col-md-1" style="text-align: center"></div>
                                    <div class="col-md-4">
                                        <input id="invoiceTotalServices" type="text" class="form-control form-control-sm border-input numericValues money" style="background-color: #FAE3C2">
                                    </div>
                                    
                                </div>
                            </div>
                        </div>

                        <div class="card border-primary">
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-12" style="text-align: center">
                                        <b>Montos $</b>
                                    </div>
                                    

                                    <div class="col-md-6">
                                        Servicios
                                    </div>
                                    <div class="col-md-1" style="text-align: center">(+)</div>
                                    <div class="col-md-4">
                                        <input id="invoiceTotalServicesb" type="text" class="form-control form-control-sm border-input numericValues money" style="background-color: #FAE3C2">
                                    </div>

                                    <div class="col-md-6">
                                        Total
                                    </div>
                                    <div class="col-md-1" style="text-align: center">(=)</div>
                                    <div class="col-md-4">
                                        <input id="invoiceTotal" type="text" class="form-control form-control-sm border-input numericValues money">
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-3" style="text-align: center;">
                                <button style="background-color:#3B6FC9; border-radius:5px; " class="btn btn-warning" id="invoiceCancel"><i ="color:#3498db;" class="fas fa-arrow-left"></i> Atrás</button></td>
                            </div>
                            <div class="col-md-3" style="text-align: center;">
                            </div>
                            <div class="col-md-3" style="text-align: center;">
                                <button style="background-color:#3B6FC9; border-radius:5px; " class="btn btn-info" id="invoiceSave"><i ="color:#3498db;" class="fas fa-check"></i> GUARDAR</button></td>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
</div>
    
`

    $('#modalLecture_body').html(body)


    $("#invoiceCancel").on('click', async function () {

        cleanInvoice()

/*
        $('#tableInvoices tbody').on('click', 'tr', function () {
            if ($(this).hasClass('table-primary')) {
                $(this).removeClass('table-primary')
                $('#tableInvoice').css('visibility', 'hidden')
            } else {
                $('#tableInvoicesBody > tr').removeClass('table-primary')
                $(this).addClass('table-primary')
                $('#divInvoice').css('display', 'block')
                $('#tableInvoices tbody').off("click")
                $('.btnLecture').attr('disabled',true)
                createInvoice($(this).attr('id'), $(this).attr('data-invoice'), member)
            //}
        })*/
    })
}

function addService(id,value){
    if(id){
        $("#tableBodyServices").append(serviceList.replace(`value="${id}"`,`value="${id}" selected`).replace(`style="text-align: right" value="0`,`style="text-align: right" value="${value}`))
    }else{
        $("#tableBodyServices").append(serviceList)
    }

    $(".serviceValue").each(function() {
        new Cleave($(this), {
            prefix: '$ ',
            numeral: true,
            numeralThousandsGroupStyle: 'thousand',
            numeralDecimalScale: 0,
            numeralPositiveOnly: true,
            numeralDecimalMark: ",",
            delimiter: "."
        })
    })
}

function addServiceOther(other,value){
    $("#tableBodyServices").append(`<tr>
                    <td>
                        <input type="text" class="form-control form-control-sm" value="${(other) ? other : ''}"/>
                    </td>
                    <td>
                        <input type="text" class="form-control form-control-sm serviceValue" onkeyup="calculateTotal()" style="text-align: right" value="${(value) ? value : ''}"/>
                    </td>
                    <td>
                        <button style="border-radius:5px;" class="btn btn-sm btn-danger" onclick="deleteService(this)"><i ="color:#3498db;" class="fas fa-times"></i></button>
                    </td>
                </tr>`)

    $(".serviceValue").each(function() {
        new Cleave($(this), {
            prefix: '$ ',
            numeral: true,
            numeralThousandsGroupStyle: 'thousand',
            numeralDecimalScale: 0,
            numeralPositiveOnly: true,
            numeralDecimalMark: ",",
            delimiter: "."
        })
    })
}

function deleteService(btn){
    $(btn).parent().parent().remove()
}


function serviceValue(select){
    
    $($($(select).parent().parent().children()[1]).children()[0]).val($('option:selected', select).attr('data-value'))

    $(".serviceValue").each(function() {
        new Cleave($(this), {
            prefix: '$ ',
            numeral: true,
            numeralThousandsGroupStyle: 'thousand',
            numeralDecimalScale: 0,
            numeralPositiveOnly: true,
            numeralDecimalMark: ",",
            delimiter: "."
        })
    })
    calculateTotal()
}

async function cleanInvoice() {
    $("#tableInvoicesBody > tr").removeClass('table-primary')
    $('#divInvoice').css('display', 'none')
    $("#invoiceTitle").text('')
    $(".numericValues").val('')
    $("#invoiceDate").val('')
    $("#invoiceDateExpire").val('')
    $("#invoiceSubsidyPercentage").val('')
    $("#tableBodyServices").html('')
    $('.btnLecture').removeAttr('disabled')
}

function calculateTotal() {
    
    //Servicios
    let totalServices = 0
    if($("#tableBodyServices > tr").length>0){
        $("#tableBodyServices > tr").each(function() {
            console.log($($($(this).children()[1]).children()[0]).val())
            let value = 0
            if(!$.isNumeric(replaceAll($($($(this).children()[1]).children()[0]).val(), '.', '').replace(' ', '').replace('$', ''))){
                value = 0
            }else{
                value = replaceAll($($($(this).children()[1]).children()[0]).val(), '.', '').replace(' ', '').replace('$', '')
            }
            totalServices += parseInt(value)
        })    
    }
    $("#invoiceTotalServices").val(totalServices)
    $("#invoiceTotalServicesb").val(totalServices)

    $("#invoiceTotal").val(parseInt(totalServices))


    $(".consumption").each(function() {
        //$(this).val(dot_separators($(this).val()))

        new Cleave($(this), {
            prefix: '',
            numeral: true,
            numeralThousandsGroupStyle: 'thousand',
            numeralDecimalScale: 0,
            numeralPositiveOnly: true,
            numeralDecimalMark: ",",
            delimiter: "."
        })
    })

    $(".money").each(function() {
        //$(this).val(dot_separators($(this).val()))

        new Cleave($(this), {
            prefix: '$ ',
            numeral: true,
            numeralThousandsGroupStyle: 'thousand',
            numeralDecimalScale: 0,
            numeralPositiveOnly: true,
            numeralDecimalMark: ",",
            delimiter: "."
        })
    })    

}

async function createInvoice(invoiceID, memberID) {
//async function createInvoice(lectureID, invoiceID, memberID) {

    $('#tableInvoicesBody > tr').removeClass('table-primary')
    $("#"+invoiceID).addClass('table-primary')
    $('#divInvoice').css('display', 'block')
    $('.btnLecture').attr('disabled',true)
    //createInvoice($(this).attr('id'), $(this).attr('data-invoice'), member)

    let memberData = await axios.post('/api/memberSingle', {id: memberID})
    let member = memberData.data

    //let servicesData = await axios.post('/api/servicesByFilter', {invoice: 'INGRESO'})
    //let services = servicesData.data

    if (invoiceID == 0) {

        //Definir parámetros
        $("#invoiceTitle").text("Nuevo Ingreso")
        //$("#invoiceNumber").val('')
        $("#invoiceDate").val(moment.utc().format('DD/MM/YYYY'))
        $("#invoiceDateExpire").val(moment.utc().add(15, 'days').format('DD/MM/YYYY'))

        addService()

        $('.invoiceDateClass').daterangepicker({
            opens: 'right',
            locale: dateRangePickerDefaultLocale,
            singleDatePicker: true,
            autoApply: true
        })
        
        calculateTotal()

        $('#invoiceSave').off("click")

        $("#invoiceSave").on('click', async function () {

            let goSave = false

            let services = []
            if($("#tableBodyServices > tr").length>0){
                $("#tableBodyServices > tr").each(function() {
    
                    if(!$.isNumeric(replaceAll($($($(this).children()[1]).children()[0]).val(), '.', '').replace(' ', '').replace('$', ''))){
                        value = 0
                    }else{
                        value = replaceAll($($($(this).children()[1]).children()[0]).val(), '.', '').replace(' ', '').replace('$', '')
                    }

                    if($($($(this).children()[0]).children()[0]).is('select')){
                        services.push({
                            services: $($($(this).children()[0]).children()[0]).val(),
                            value: value
                        })
                    }else{
                        services.push({
                            other: $($($(this).children()[0]).children()[0]).val(),
                            value: value
                        })
                    }
                })    
            }

            let invoiceData = {
                //lectures: lectureID,
                member: member._id,
                //number: replaceAll($("#invoiceNumber").val(), '.', '').replace(' ', ''),
                date: $("#invoiceDate").data('daterangepicker').startDate.format('YYYY-MM-DD'),
                dateExpire: $("#invoiceDateExpire").data('daterangepicker').startDate.format('YYYY-MM-DD'),
                /*charge: replaceAll($("#invoiceCharge").val(), '.', '').replace(' ', '').replace('$', ''),
                lectureActual: replaceAll($("#invoiceLectureActual").val(), '.', '').replace(' ', '').replace('$', ''),
                lectureLast: replaceAll($("#invoiceLectureLast").val(), '.', '').replace(' ', '').replace('$', ''),
                lectureResult: replaceAll($("#invoiceLectureResult").val(), '.', '').replace(' ', '').replace('$', ''),
                meterValue: replaceAll($("#invoiceMeterValue").val(), '.', '').replace(' ', '').replace('$', ''),
                subsidyPercentage: replaceAll($("#invoiceSubsidyPercentage").val(), '.', '').replace(' ', '').replace('$', ''),
                subsidyValue: replaceAll($("#invoiceSubsidyValue").val(), '.', '').replace(' ', '').replace('$', ''),
                consumptionLimit: replaceAll($("#invoiceConsumptionLimit").val(), '.', '').replace(' ', '').replace('$', ''),
                consumptionLimitValue: replaceAll($("#invoiceConsumptionLimitValue").val(), '.', '').replace(' ', '').replace('$', ''),
                consumptionLimitTotal: replaceAll($("#invoiceConsumptionLimitTotal").val(), '.', '').replace(' ', '').replace('$', ''),
                consumption: replaceAll($("#invoiceConsumption2").val(), '.', '').replace(' ', '').replace('$', ''),
                invoiceDebt: replaceAll($("#invoiceDebt").val(), '.', '').replace(' ', '').replace('$', ''),*/
                invoiceTotal: replaceAll($("#invoiceTotal").val(), '.', '').replace(' ', '').replace('$', ''),
                services: services
            }

            /*if(services.length>0){
                saleData.services = services
            }*/

            console.log(invoiceData)

            const res = validateInvoiceData(invoiceData)
            if (res.ok) {
                let saveInvoice = await axios.post('/api/invoiceInvoiceSave', res.ok)
                if (saveInvoice.data) {
                    if (saveInvoice.data._id) {

                        $('#modal_title').html(`Almacenado`)
                        $('#modal_body').html(`<h7 class="alert-heading">Ingreso almacenada correctamente</h7>`)
                        cleanInvoice()
                        loadInvoices(member)
                    } else {
                        $('#modal_title').html(`Error`)
                        $('#modal_body').html(`<h7 class="alert-heading">Error al almacenar, favor reintente</h7>`)
                    }
                } else {
                    $('#modal_title').html(`Error`)
                    $('#modal_body').html(`<h7 class="alert-heading">Error al almacenar, favor reintente</h7>`)
                }
                $('#modal').modal('show')
            }

        })
    } else {

        let invoiceData = await axios.post('/api/invoiceSingle', { id: invoiceID })
        let invoice = invoiceData.data
        
        $("#invoiceTitle").text("Ingreso N° " + invoice.number)

        //$("#invoiceNumber").val(invoice.number)
        $("#invoiceDate").val(moment(invoice.date).utc().format('DD/MM/YYYY'))
        $("#invoiceDateExpire").val(moment(invoice.dateExpire).utc().format('DD/MM/YYYY'))
       

        $('.invoiceDateClass').daterangepicker({
            opens: 'right',
            locale: dateRangePickerDefaultLocale,
            singleDatePicker: true,
            autoApply: true
        })

        $("#tableBodyServices").html('')

        console.log(invoice)

        if (invoice.services) {
            if (invoice.services.length > 0) {
                for(let i=0; i<invoice.services.length; i++){
                    if(invoice.services[i].other){
                        addServiceOther(invoice.services[i].other,invoice.services[i].value)
                    }else{
                        addService(invoice.services[i].services._id,invoice.services[i].value)
                    }
                }
            }
        }

        calculateTotal()

        $('#invoiceSave').off("click")

        $("#invoiceSave").on('click', async function () {

            let goSave = false

            let services = []
            if($("#tableBodyServices > tr").length>0){
                $("#tableBodyServices > tr").each(function() {
    
                    if(!$.isNumeric(replaceAll($($($(this).children()[1]).children()[0]).val(), '.', '').replace(' ', '').replace('$', ''))){
                        value = 0
                    }else{
                        value = replaceAll($($($(this).children()[1]).children()[0]).val(), '.', '').replace(' ', '').replace('$', '')
                    }
    
                    if($($($(this).children()[0]).children()[0]).is('select')){
                        services.push({
                            services: $($($(this).children()[0]).children()[0]).val(),
                            value: value
                        })
                    }else{
                        services.push({
                            other: $($($(this).children()[0]).children()[0]).val(),
                            value: value
                        })
                    }
                })    
            }

            let invoiceData = {
                id: invoiceID,
                //member: internals.dataRowSelected._id,
                member: member._id,
                date: $("#invoiceDate").data('daterangepicker').startDate.format('YYYY-MM-DD'),
                dateExpire: $("#invoiceDateExpire").data('daterangepicker').startDate.format('YYYY-MM-DD'),
                invoiceTotal: parseInt(replaceAll($("#invoiceTotal").val(), '.', '').replace(' ', '').replace('$', '')),
                services: services
            }

            const res = validateInvoiceData(invoiceData)
            if (res.ok) {
                let updateInvoice = await axios.post('/api/invoiceInvoiceUpdate', res.ok)
                if (updateInvoice.data) {
                    if (updateInvoice.data._id) {

                        $('#modal_title').html(`Almacenado`)
                        $('#modal_body').html(`<h7 class="alert-heading">Ingreso almacenada correctamente</h7>`)
                        cleanInvoice()
                        loadInvoices(member)
                    } else {
                        $('#modal_title').html(`Error`)
                        $('#modal_body').html(`<h7 class="alert-heading">Error al almacenar, favor reintente</h7>`)
                    }
                } else {
                    $('#modal_title').html(`Error`)
                    $('#modal_body').html(`<h7 class="alert-heading">Error al almacenar, favor reintente</h7>`)
                }
                $('#modal').modal('show')
            }

        })
    }
}

function ExportToExcel(type, fn, dl) {
    var elt = document.getElementById('tableMembers');
    var wb = XLSX.utils.table_to_book(elt, { sheet: "Hoja1" });
    return dl ?
      XLSX.write(wb, { bookType: type, bookSST: true, type: 'base64' }):
      XLSX.writeFile(wb, fn || ('Macro Subsidios.' + (type || 'xlsx')));
}