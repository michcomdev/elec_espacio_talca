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

    chargeMembersTable()
})

async function getParameters() {

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

function chargeMembersTable() {
    try {
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
                columnDefs: [{ targets: [0, 1, 4, 5, 6], className: 'dt-center' }],
                order: [[0, 'asc']],
                ordering: true,
                rowCallback: function (row, data) {
                    //$(row).find('td:eq(1)').html(moment.utc(data.date).format('DD/MM/YYYY'))
                    $(row).find('td:eq(5)').html(dot_separators(data.lastLecture))
                    // $('td', row).css('background-color', 'White');
                },
                columns: [
                    { data: 'number' },
                    { data: 'typeString' },
                    { data: 'name' },
                    { data: 'sector' },
                    { data: 'subsidyActive' },
                    { data: 'lastLecture' },
                    { data: 'paymentStatus' }
                ],
                initComplete: function (settings, json) {
                    getMembers()
                }
            })

        $('#tableMembers tbody').off("click")

        $('#tableMembers tbody').on('click', 'tr', function () {
            if ($(this).hasClass('selected')) {
                $(this).removeClass('selected')
                $('#updateLectures').prop('disabled', true)
                $('#updatePayment').prop('disabled', true)
            } else {
                internals.members.table.$('tr.selected').removeClass('selected')
                $(this).addClass('selected')
                $('#updateLectures').prop('disabled', false)
                $('#updatePayment').prop('disabled', false)
                //internals.members.data = internals.members.table.row($(this)).data()
                internals.dataRowSelected = internals.members.table.row($(this)).data()
            }
        })
    } catch (error) {
        console.log(error)
    }

}

async function getMembers() {
    let lecturesData = await axios.post('api/membersLectures', {sector: $("#searchSector").val()})

    if (lecturesData.data.length > 0) {
        let formatData = lecturesData.data.map(el => {
            
            //el.datetime = moment(el.datetime).format('DD/MM/YYYY HH:mm')
            if (el.type == 'personal') {
                el.typeString = 'PERSONA'
                el.name = el.personal.name + ' ' + el.personal.lastname1 + ' ' + el.personal.lastname2
            } else {
                el.typeString = 'EMPRESA'
                el.name = el.enterprise.name
            }
            el.sector = el.address.sector.name
            if(el.subsidies.length>0){
                //Verificar que subsidio esté activo
                el.subsidyActive = 'SI'
            }else{
                el.subsidyActive = 'NO'

            }
            
            el.lastLecture = 0
            el.paymentStatus = 'AL DÍA'

            return el
        })

        internals.members.table.rows.add(formatData).draw()
        $('#loadingMembers').empty()
    } else {
        //toastr.warning('No se han encontrado ventas en el rango seleccionado')
        $('#loadingMembers').empty()
    }
}

$('#searchMembers').on('click', async function () {
    chargeMembersTable()
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
        btn = `<button class="btn btn-sm btn-info btnLecture" onclick="printVoucher('${member._id}','${invoiceID}')"><i class="far fa-edit" style="font-size: 14px;"></i></button>`
        
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
            </div>
            <div class="col-md-8 table-responsive">
                <br/>
                <br />
                <br />
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

async function printVoucher(memberID,invoiceID) {
    loadingHandler('start')
    
    let memberData = await axios.post('/api/memberSingle', {id: memberID})
    let member = memberData.data

    let invoiceData = await axios.post('/api/invoiceSingle', { id: invoiceID })
    let invoice = invoiceData.data
    console.log(invoice)

    /*for(let i=0; i<invoicesPayment.invoices.length; i++){
        $("#tableBodyDebtInvoices").append(`<tr class="table-primary">
            <td style="text-align: center"><input class="checkInvoice" type="checkbox" checked/><input value="${invoicesPayment.invoices[i].invoices._id}" style="display: none;"/></td>
            <td style="text-align: center">${invoicesPayment.invoices[i].invoices.number}</td>
            <td style="text-align: center">${moment(invoicesPayment.invoices[i].invoices.date).utc().format('DD/MM/YYYY')}</td>
            <td style="text-align: center">${moment(invoicesPayment.invoices[i].invoices.dateExpire).utc().format('DD/MM/YYYY')}</td>
            <td style="text-align: right">${dot_separators(invoicesPayment.invoices[i].invoices.invoiceSubTotal)}</td>
            <td style="text-align: right">${dot_separators(invoicesPayment.invoices[i].invoices.invoiceSubTotal - invoicesPayment.invoices[i].invoices.invoicePaid + invoicesPayment.invoices[i].amount)}
                <input value="${invoicesPayment.invoices[i].invoices.invoiceSubTotal - invoicesPayment.invoices[i].invoices.invoicePaid + invoicesPayment.invoices[i].amount}" style="display: none;"/>
            </td>
            <td style="text-align: right">${dot_separators(invoicesPayment.invoices[i].invoices.invoiceSubTotal - invoicesPayment.invoices[i].invoices.invoicePaid + invoicesPayment.invoices[i].amount)}</td>
        </tr>`)
    }*/

    let parametersData = await axios.get('/api/parameters')
    let parameters = parametersData.data

    if (member.type == 'personal') {
        memberName = member.personal.name + ' ' + member.personal.lastname1 + ' ' + member.personal.lastname2
    } else {
        memberName = member.enterprise.name
    }

    let doc = new jsPDF('p', 'pt', 'letter')
    //let doc = new jsPDF('p', 'pt', [302, 451])

    let pdfX = 150
    let pdfY = 20
    doc.addImage(logoWallImg, 'PNG', 0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight()) //Fondo

    pdfX = 30
    doc.setFontSize(16)
    doc.setFontType('bold')
    doc.text(`COMPROBANTE DE INGRESO`, pdfX, pdfY + 23)
    doc.setFontSize(10)
    doc.setFontType('normal')
    doc.setTextColor(143, 143, 143)
    doc.text(`Código Interno N° ${invoice._id}`, pdfX, pdfY + 38)

    pdfX = 280
    doc.addImage(logoImg, 'PNG', pdfX, pdfY, 77, 60)
    doc.setTextColor(0, 0, 0)
    doc.text(`COMITÉ DE AGUA POTABLE RURAL`, pdfX + 80, pdfY + 23)
    doc.text(`Y SERVICIOS SANITARIOS LOS CRISTALES`, pdfX + 80, pdfY + 36)
    doc.text(`Los Cristales S/N`, pdfX + 80, pdfY + 49)

    pdfX = 30
    pdfY += 80

    doc.setDrawColor(0, 0, 0)
    doc.setTextColor(0, 0, 0)

    doc.line(pdfX, pdfY, doc.internal.pageSize.getWidth() - 30, pdfY )//Línea Superior

    pdfY += 35
    doc.setFontSize(12)
    doc.setFontType('bold')
    doc.text('Socio N° ' + member.number, pdfX, pdfY)
    doc.setFontSize(10)
    doc.setFontType('normal')
    doc.text('R.U.T ' + member.rut, pdfX, pdfY + 15)
    doc.text(memberName, pdfX, pdfY + 28)
    let subsidyNumber = member.subsidyNumber.toString()
    while (subsidyNumber.length<11) {
        subsidyNumber = '0' + subsidyNumber
    }
    doc.text('MIDEPLAN ' + subsidyNumber, pdfX, pdfY + 41)

    doc.setFontSize(12)
    doc.setFontType('bold')
    doc.text('Pago',  + 300, pdfY)
    doc.setFontSize(10)
    doc.setFontType('normal')
    /*doc.text('Medio de Pago: ' + payment.paymentMethod,  + 300, pdfY + 15)
    doc.text('N° Transacción: ' + payment.transaction,  + 300, pdfY + 28)
    doc.text('Fecha Pago: ' + moment(payment.date).utc().format('DD / MM / YYYY'),  + 300, pdfY + 41)*/

    pdfY += 60

    doc.setFillColor(26, 117, 187)
    doc.rect(pdfX - 3, pdfY, doc.internal.pageSize.getWidth() - 57, 14, 'F')
    doc.setFontSize(9)
    doc.setFontType('bold')
    doc.setTextColor(255, 255, 255)
    doc.text('DETALLE', pdfX, pdfY + 10)
    doc.text('SUBTOTAL', doc.internal.pageSize.getWidth() - 40, pdfY + 10, 'right')

    pdfY += 18
    doc.setFontType('normal')
    doc.setTextColor(0, 0, 0)
    for(let i=0; i<invoice.services.length; i++){
        pdfY += 13
        if(invoice.services[i].others){
            doc.text(invoice.services[i].others, pdfX, pdfY)
        }else{
            doc.text(invoice.services[i].services.name, pdfX, pdfY)
        }

        doc.text('$ ' + dot_separators(invoice.services[i].value), doc.internal.pageSize.getWidth() - 40, pdfY, 'right')

    }

    pdfY = 300
    
    doc.setFillColor(0, 0, 0)
    doc.rect(pdfX + 345, pdfY, 200, 15, 'F')

    doc.setFontType('bold')
    doc.setFontSize(10)
    doc.setTextColor(255, 255, 255)
    doc.text(`Total`, pdfX + 350, pdfY + 11)
    doc.text('$ ' + dot_separators(invoice.invoiceTotal), doc.internal.pageSize.getWidth() - 40, pdfY + 11, 'right')

    window.open(doc.output('bloburl'), '_blank')

    loadingHandler('stop')
}

async function printInvoice(docType,type,memberID,invoiceID) {
    
    let memberData = await axios.post('/api/memberSingle', {id: memberID})
    let member = memberData.data

    let invoiceData = await axios.post('/api/invoiceSingle', { id: invoiceID })
    let invoice = invoiceData.data

    let lecturesData = await axios.post('/api/lecturesSingleMember', { member: memberID })
    let lectures = lecturesData.data

    let parametersData = await axios.get('/api/parameters')
    let parameters = parametersData.data


    let docName1 = '', docName2 = 'EXENTA ELECTRÓNICA', memberName = ''
    if (type == 'personal') {
        docName1 = 'BOLETA NO AFECTA O'
        memberName = member.personal.name + ' ' + member.personal.lastname1 + ' ' + member.personal.lastname2
    } else {
        docName1 = 'FACTURA NO AFECTA O'
        memberName = member.enterprise.name
    }

    let doc = new jsPDF('p', 'pt', 'letter')
    //let doc = new jsPDF('p', 'pt', [302, 451])

    let pdfX = 150
    let pdfY = 20

    doc.setFontSize(12)
    doc.addImage(logoWallImg, 'PNG', 0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight()) //Fondo

    doc.addImage(logoImg, 'PNG', 112, pdfY, 77, 60)
    pdfY += 60
    doc.text(`COMITÉ DE AGUA POTABLE RURAL`, pdfX, pdfY + 23, 'center')
    doc.text(`Y SERVICIOS SANITARIOS LOS CRISTALES`, pdfX, pdfY + 36, 'center')
    doc.text(`Los Cristales S/N`, pdfX, pdfY + 49, 'center')


    pdfY = 35
    doc.setDrawColor(249, 51, 6)
    doc.setLineWidth(3)
    doc.line(pdfX + 209, pdfY - 10, pdfX + 411, pdfY - 10)//Línea Superior
    doc.line(pdfX + 209, pdfY + 60, pdfX + 411, pdfY + 60)//Línea Inferior
    doc.line(pdfX + 210, pdfY - 10, pdfX + 210, pdfY + 60)//Línea Izquierda
    doc.line(pdfX + 410, pdfY - 10, pdfX + 410, pdfY + 60)//Línea Derecha

    doc.setFontSize(13)
    doc.setTextColor(249, 51, 6)
    doc.text('R.U.T: 71.569.700-9', pdfX + 310, pdfY + 5, 'center')
    doc.text(docName1, pdfX + 310, pdfY + 20, 'center')
    doc.text(docName2, pdfX + 310, pdfY + 35, 'center')

    doc.setFontType('bold')
    if(invoice.number){
        doc.text('N° ' + invoice.number, pdfX + 310, pdfY + 50, 'center')
    }else{
        doc.text('N° -', pdfX + 310, pdfY + 50, 'center')
    }
    doc.setFontSize(11)
    doc.text('S.I.I. - CURICO', pdfX + 310, pdfY + 75, 'center')

    doc.setDrawColor(0, 0, 0)
    doc.setTextColor(0, 0, 0)

    doc.setFontSize(10)
    doc.setFontType('normal')
    doc.text('Fecha Emisión ', pdfX + 220, pdfY + 100)
    doc.text('Mes de Pago ', pdfX + 220, pdfY + 113)

    doc.setFontType('bold')
    doc.text(moment(invoice.date).utc().format('DD / MM / YYYY'), pdfX + 300, pdfY + 100)
    doc.text(getMonthString(invoice.lectures.month) + ' / ' + invoice.lectures.year, pdfX + 300, pdfY + 113)


    pdfX = 30
    pdfY += 120
    doc.setFontSize(12)
    doc.text('SOCIO N° ' + member.number, pdfX, pdfY)
    doc.text('R.U.T ' + member.rut, pdfX, pdfY + 13)
    doc.setFontSize(13)
    doc.text(memberName.toUpperCase(), pdfX, pdfY + 28)




    pdfY += 60


    //////////////TABLA CONSUMOS//////////////
    doc.setFillColor(26, 117, 187)
    doc.rect(pdfX - 3, pdfY - 10, 265, 13, 'F')

    doc.setFontSize(9)
    doc.setFontType('bold')
    doc.setTextColor(255, 255, 255)
    doc.text('Su consumo en m3 de este mes (1m3 = 1.000 lts de agua)', pdfX, pdfY)

    doc.setFontSize(10)
    doc.setFontType('normal')
    doc.setTextColor(0, 0, 0)
    doc.text('Lectura Actual ' + moment(invoice.date).format('DD/MM/YYYY'), pdfX, pdfY + 20)
    doc.text('Lectura Anterior ' + moment(invoice.date).format('DD/MM/YYYY'), pdfX, pdfY + 33)
    doc.text('Límite Sobreconsumo (m3)', pdfX, pdfY + 46)
    doc.text('Consumo Calculado', pdfX, pdfY + 59)
    doc.setFontType('bold')
    doc.text('Consumo Facturado', pdfX, pdfY + 85)


    doc.setFontSize(10)
    doc.setFontType('normal')

    doc.text(dot_separators(invoice.lectureActual), pdfX + 250, pdfY + 20, 'right')
    doc.text(dot_separators(invoice.lectureLast), pdfX + 250, pdfY + 33, 'right')
    doc.text(dot_separators(parameters.consumptionLimit), pdfX + 250, pdfY + 46, 'right')
    doc.text(dot_separators(invoice.lectureResult), pdfX + 250, pdfY + 59, 'right')
    doc.setFontType('bold')
    doc.text(dot_separators(invoice.lectureResult), pdfX + 250, pdfY + 85, 'right') //Consultar diferencia facturado vs calculado



    //////////////TABLA VALORES//////////////
    pdfX += 300

    doc.setFillColor(26, 117, 187)
    doc.rect(pdfX - 3, pdfY - 10, 265, 13, 'F')

    doc.setFontSize(9)
    doc.setFontType('bold')
    doc.setTextColor(255, 255, 255)
    doc.text('Detalle de consumos y servicios en pesos de este mes', pdfX, pdfY)

    doc.setFontSize(10)
    doc.setFontType('normal')
    doc.setTextColor(0, 0, 0)
    doc.text('Cargo Fijo', pdfX, pdfY + 20)
    doc.text('Consumo Agua Potable ', pdfX, pdfY + 33)
    let pdfYTemp = 0
    if (invoice.subsidyPercentage > 0) {
        pdfYTemp = 13
        doc.text('Subsidio (' + invoice.subsidyPercentage.toString() + '%)', pdfX, pdfY + 33 + pdfYTemp)
    }
    if (invoice.consumptionLimitTotal > 0) {
        pdfYTemp += 13
        doc.text('SobreConsumo', pdfX, pdfY + 33 + pdfYTemp)
    }
    
    doc.text('SubTotal Consumo Mes', pdfX, pdfY + 85)

    let index = 85 + 13
    if(invoice.services){
        for(let i=0; i<invoice.services.length; i++){
            if(invoice.services[i].services.type=='ALCANTARILLADO'){
                doc.text('Alcantarillado', pdfX, pdfY + index)
            }else{
                doc.text(invoice.services[i].services.name, pdfX, pdfY + index)
            }
            index += 13
        }
    }

    doc.text('Saldo Anterior', pdfX, pdfY + index)
    doc.setFontType('bold')
    doc.text('Monto Total', pdfX, pdfY + index + 26)


    doc.setFontSize(10)
    doc.setFontType('normal')

    doc.text(dot_separators(invoice.charge), pdfX + 250, pdfY + 20, 'right')
    doc.text(dot_separators(invoice.lectureResult * invoice.meterValue), pdfX + 250, pdfY + 33, 'right')

    pdfYTemp = 0
    if (invoice.subsidyPercentage > 0) {
        pdfYTemp = 13
        doc.text('-' + dot_separators(invoice.subsidyValue), pdfX + 250, pdfY + 33 + pdfYTemp, 'right')
    }
    if (invoice.consumptionLimitTotal > 0) {
        pdfYTemp += 13
        doc.text(dot_separators(invoice.consumptionLimitTotal), pdfX + 250, pdfY + 33 + pdfYTemp, 'right')
    }


    doc.text(dot_separators(invoice.charge + invoice.consumption), pdfX + 250, pdfY + 85, 'right')
    
    index = 85 + 13
    if(invoice.services){
        for(let i=0; i<invoice.services.length; i++){
            doc.text(dot_separators(invoice.services[i].value), pdfX + 250, pdfY + index, 'right')
            index += 13
        }
    }

    doc.text(dot_separators(invoice.invoiceDebt), pdfX + 250, pdfY + index, 'right')
    doc.setFontType('bold')
    doc.text(dot_separators(invoice.invoiceTotal), pdfX + 250, pdfY + index + 26, 'right')


    //////TOTALES Y CÓDIGO SII//////
    pdfY += 50
    doc.setFontSize(12)

    doc.setFillColor(23, 162, 184)
    doc.rect(pdfX - 3, pdfY + 137, 260, 35, 'F')

    doc.setTextColor(255, 255, 255)
    doc.text('TOTAL A PAGAR', pdfX, pdfY + 150)
    doc.text('FECHA VENCIMIENTO', pdfX, pdfY + 165)
    doc.text('$ ' + dot_separators(invoice.invoiceTotal), pdfX + 250, pdfY + 150, 'right')
    doc.text(moment(invoice.dateExpire).utc().format('DD/MM/YYYY'), pdfX + 250, pdfY + 165, 'right')


    doc.setFontSize(8)
    doc.setFontType('normal')
    doc.setTextColor(0, 0, 0)
    let net = parseInt(invoice.invoiceTotal / 1.19)
    let iva = invoice.invoiceTotal - net
    //doc.text('Datos Tributarios: ', pdfX + 100, pdfY + 180)
    //doc.text('Neto ', pdfX + 190, pdfY + 180)
    //doc.text('IVA ', pdfX + 190, pdfY + 190)
    //doc.text(dot_separators(net), pdfX + 250, pdfY + 180, 'right')
    //doc.text(dot_separators(iva), pdfX + 250, pdfY + 190, 'right')

    if(docType=='preview'){
        doc.addImage(test2DImg, 'PNG', pdfX, pdfY + 200, 260, 106)
    }else if(docType=='pdf'){
        doc.setFillColor(255, 255, 255)
        doc.rect(pdfX, pdfY + 200, 260, 106, 'F')
        if(invoice.seal){
            doc.addImage(invoice.seal, 'PNG', pdfX, pdfY + 200, 260, 106)

            doc.text('Timbre Electrónico S.I.I. ', pdfX + 130, pdfY + 320, 'center')
            doc.text('Res. 80 del 22-08-2014 Verifique Documento: www.sii.cl', pdfX + 130, pdfY + 330, 'center')
        }
    }


    ///////GRÁFICO CONSUMOS///////

    pdfX = 30
    pdfY += 150
    doc.setFontSize(9)
    doc.setFontType('bold')
    doc.setTextColor(0, 0, 0)
    doc.text('Su consumo en m3 durante los últimos 13 meses fue:', pdfX, pdfY)


    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(1)
    pdfX += 10
    doc.line(pdfX, pdfY + 10, pdfX, pdfY + 120)//Línea Izquierda
    doc.line(pdfX, pdfY + 120, pdfX + 250, pdfY + 120)//Línea Inferior

    //DEFINICIÓN DE LECTURAS A MOSTRAR (MÁXIMO 13)
    let lastInvoices = [], flag = 0, maxValue = 0
    for (let j = 0; j < lectures.length; j++) {
        if (lectures[j]._id == invoice.lectures._id) {
            flag++
        }

        if (flag > 0 && flag <= 13) {
            lastInvoices.push(lectures[j].invoice)
            flag++

            if (lectures[j].invoice.lectureResult > maxValue) {
                maxValue = lectures[j].invoice.lectureResult
            }
        }
    }

    let meterPoints = 100 / maxValue //Puntos en PDF por mt3

    pdfY += 25
    doc.setFontSize(7)
    doc.setFontType('normal')

    doc.setDrawColor(199, 199, 199)

    if (maxValue < 5) {
        pdfY -= 5
        //Línea límite según lectura máxima
        doc.text(maxValue.toString(), pdfX - 2, pdfY, 'right')
        doc.line(pdfX, pdfY, pdfX + 250, pdfY)

        if (maxValue == 4) {
            doc.text('3', pdfX - 2, (pdfY + 2) + 25, 'right')
            doc.text('2', pdfX - 2, (pdfY + 2) + 50, 'right')
            doc.text('1', pdfX - 2, (pdfY + 2) + 77, 'right')
            doc.line(pdfX, pdfY + 25, pdfX + 250, pdfY + 25)
            doc.line(pdfX, pdfY + 50, pdfX + 250, pdfY + 50)
            doc.line(pdfX, pdfY + 75, pdfX + 250, pdfY + 75)

        } else if (maxValue == 3) {
            doc.text('2', pdfX - 2, pdfY + 34, 'right')
            doc.text('1', pdfX - 2, pdfY + 69, 'right')
            doc.line(pdfX, pdfY + 34, pdfX + 250, pdfY + 34)
            doc.line(pdfX, pdfY + 69, pdfX + 250, pdfY + 69)
        } else if (maxValue == 2) {
            doc.text('1', pdfX - 2, pdfY + 51, 'right')
            doc.line(pdfX, pdfY + 51, pdfX + 250, pdfY + 51)
        }

        pdfY += 102

    } else if (maxValue % 4 == 0) {

        //Línea límite según lectura máxima
        doc.text(maxValue.toString(), pdfX - 2, pdfY, 'right')
        doc.line(pdfX, pdfY, pdfX + 250, pdfY)

        let min = parseInt(maxValue / 4)
        doc.text((min * 3).toString(), pdfX - 2, pdfY + (min * meterPoints), 'right')
        doc.text((min * 2).toString(), pdfX - 2, pdfY + (min * 2 * meterPoints), 'right')
        doc.text((min).toString(), pdfX - 2, pdfY + (min * 3 * meterPoints), 'right')

        doc.line(pdfX, pdfY + (min * meterPoints), pdfX + 250, pdfY + (min * meterPoints))
        doc.line(pdfX, pdfY + (min * 2 * meterPoints), pdfX + 250, pdfY + (min * 2 * meterPoints))
        doc.line(pdfX, pdfY + (min * 3 * meterPoints), pdfX + 250, pdfY + (min * 3 * meterPoints))

        pdfY += 102

    } else {
        pdfY -= 5
        //Línea límite según lectura máxima
        doc.text(maxValue.toString(), pdfX - 2, pdfY + (102 - (maxValue * meterPoints)), 'right')
        doc.line(pdfX, pdfY + (100 - (maxValue * meterPoints)), pdfX + 250, pdfY + (100 - (maxValue * meterPoints)))

        let min = parseInt(maxValue / 4)

        pdfY += 102

        doc.text((min * 4).toString(), pdfX - 2, (pdfY + 2) - (min * 4 * meterPoints), 'right')
        doc.text((min * 3).toString(), pdfX - 2, (pdfY + 2) - (min * 3 * meterPoints), 'right')
        doc.text((min * 2).toString(), pdfX - 2, (pdfY + 2) - (min * 2 * meterPoints), 'right')
        doc.text((min).toString(), pdfX - 2, (pdfY + 2) - (min * meterPoints), 'right')

        doc.line(pdfX, pdfY - (min * meterPoints), pdfX + 250, pdfY - (min * meterPoints))//Línea Inferior
        doc.line(pdfX, pdfY - (min * 2 * meterPoints), pdfX + 250, pdfY - (min * 2 * meterPoints))//Línea Inferior
        doc.line(pdfX, pdfY - (min * 3 * meterPoints), pdfX + 250, pdfY - (min * 3 * meterPoints))//Línea Inferior
        doc.line(pdfX, pdfY - (min * 4 * meterPoints), pdfX + 250, pdfY - (min * 4 * meterPoints))//Línea Inferior
    }

    doc.text('0', pdfX - 2, pdfY, 'right')

    //GRÁFICO DE CONSUMOS
    pdfY = 435
    pdfX = 263
    //for(let i=lastInvoices.length; i>0; i--){
    //for(let i=13; i>0; i--){ Max month test
    doc.setFontSize(8)




    for (let i = 0; i < lastInvoices.length; i++) {

        if (i == 0) {
            doc.setFillColor(23, 162, 184)
        } else {
            doc.setFillColor(82, 82, 82)
        }

        let offset = 100 - (lastInvoices[i].lectureResult * meterPoints) //Determina posición inicial respecto al máximo del gráfico

        doc.rect(pdfX, pdfY + offset, 11, 99 - offset, 'F')
        //Posición X (descendente)
        //Posición Y suma offset según lectura
        //11 = Ancho ~ 99 - offset = Largo
        doc.text(lastInvoices[i].lectureResult.toString(), pdfX + 5, pdfY + offset - 5, 'center')
        doc.text(getMonthShortString(lastInvoices[i].lectures.month), pdfX + 7, pdfY + 108, 'center')
        pdfX -= 18
    }

    pdfX = 30
    doc.setFillColor(26, 117, 187)
    doc.rect(pdfX - 3, doc.internal.pageSize.getHeight() - 60, doc.internal.pageSize.getWidth() - 57, 17, 'F')

    doc.setFontSize(10)
    doc.setFontType('bold')
    doc.setTextColor(255, 255, 255)
    doc.text('N° Teléfono oficina Comité: ' + parameters.phone + ' - Correo electrónico:  ' + parameters.email, pdfX, doc.internal.pageSize.getHeight() - 48)

    //doc.autoPrint()
    window.open(doc.output('bloburl'), '_blank')
    //doc.save(`Nota de venta ${internals.newSale.number}.pdf`)
}

async function showSIIPDF(token) {
    loadingHandler('start')
    
    let parametersData = await axios.get('/api/parameters')
    let parameters = parametersData.data

    var settings = {
        "url": "https://dev-api.haulmer.com/v2/dte/document/"+token+"/pdf",
        "method": "GET",
        "timeout": 0,
        "headers": {
          "apikey": parameters.apikey
        }
    }
      
    $.ajax(settings).fail( function( jqXHR, textStatus, errorThrown ) {
    
        console.log('ERROR', jqXHR.responseJSON.error.message)
        console.log('ERROR', jqXHR.responseJSON.error.details)

        loadingHandler('stop')

    }).done(function (response) {
        console.log(response)

        let pdfWindow = window.open("")
        pdfWindow.document.write("<iframe width='100%' height='100%' src='data:application/pdf;base64, " +encodeURI(response.pdf) + "'></iframe>")
        loadingHandler('stop')
    })

    
}

async function sendData(type,memberID,invoiceID) {
    console.log(type,memberID,invoiceID) 

    let generateDTE = await Swal.fire({
        title: '¿Está seguro de generar documento?',
        customClass: 'swal-wide',
        html: ``,
        showCloseButton: true,
        showCancelButton: true,
        showConfirmButton: true,
        focusConfirm: false,
        confirmButtonText: 'Aceptar',
        cancelButtonText: 'Cancelar'
    })

    if (generateDTE.value) {
        
        loadingHandler('start')
        
        let memberData = await axios.post('/api/memberSingle', {id: memberID})
        let member = memberData.data

        let invoiceData = await axios.post('/api/invoiceSingle', {id: invoiceID})
        let invoice = invoiceData.data

        let parametersData = await axios.get('/api/parameters')
        let parameters = parametersData.data

        let dteType = 34 //Factura exenta electrónica
        let name = '', category = ''
        let document = ''

        let detail = []
        for(let i=0; i<invoice.services.length; i++){
            detail.push({
                NroLinDet: i+1,
                NmbItem: invoice.services[i].services.name,
                QtyItem: 1,
                PrcItem: invoice.services[i].value,
                MontoItem: invoice.services[i].value,
                IndExe: 1 //1=exento o afecto / 2=no facturable
            })
        }
        

        if(type=='personal'){

            dteType = 41 //Boleta exenta electrónica
            name = member.personal.name+' '+member.personal.lastname1+' '+member.personal.lastname2

            let Emisor = { //EMISOR DE PRUEBA
                RUTEmisor: "76795561-8",
                RznSocEmisor: "HAULMER SPA",
                GiroEmisor: "VENTA AL POR MENOR POR CORREO, POR INTERNET Y VIA TELEFONICA",
                DirOrigen: "ARTURO PRAT 527   CURICO",
                CmnaOrigen: "Curicó",
                CdgSIISucur: "81303347"
            }


            document = {
                response: ["TIMBRE","FOLIO"],
                dte: {
                    Encabezado: {
                        IdDoc:{
                            TipoDTE: dteType,
                            Folio: 0,
                            FchEmis: moment.utc(invoice.date).format('YYYY-MM-DD'),
                            IndServicio: "3", //1=Servicios periódicos, 2=Serv. periódicos domiciliarios
                        },
                        Emisor: Emisor,
                        Receptor:{
                            RUTRecep: member.rut.split('.').join(''),
                            RznSocRecep: name,
                            DirRecep: member.address.address,
                            CmnaRecep: parameters.committee.commune,
                            CiudadRecep: parameters.committee.city
                        },
                        Totales:{
                            MntExe: invoice.invoiceTotal,
                            MntTotal: invoice.invoiceTotal,
                            VlrPagar: invoice.invoiceTotal
                        }
                    },
                    Detalle: detail
                }
            }


        }else{
            name = member.enterprise.fullName
            category = member.enterprise.category

            if(name==''){ //Sólo para efectos de TEST
                name = member.personal.name+' '+member.personal.lastname1+' '+member.personal.lastname2
                category = 'TEST'
            }

            //let net = parseInt(invoice.invoiceTotal / 1.19)
            //let iva = invoice.invoiceTotal - net

            /*let Emisor = {
                RUTEmisor: parameters.committee.rut.split('.').join(''),
                RznSoc: parameters.committee.name,
                GiroEmis: parameters.committee.category,
                Acteco: parameters.committee.acteco,
                DirOrigen: parameters.committee.address,
                CmnaOrigen: parameters.committee.commune,
                Telefono: parameters.committee.phone,
                CdgSIISucur: parameters.committee.siiCode
            }*/
            console.log(invoice)


            let Emisor = { //EMISOR DE PRUEBA
                RUTEmisor: "76795561-8",
                RznSoc: "HAULMER SPA",
                GiroEmis: "VENTA AL POR MENOR POR CORREO, POR INTERNET Y VIA TELEFONICA",
                Acteco: "479100",
                DirOrigen: "ARTURO PRAT 527   CURICO",
                CmnaOrigen: "Curicó",
                Telefono: "0 0",
                CdgSIISucur: "81303347"
            }

            document = {
                response: ["TIMBRE","FOLIO"],
                dte: {
                    Encabezado: {
                        IdDoc:{
                            TipoDTE: dteType,
                            Folio: 0,
                            FchEmis: moment.utc(invoice.date).format('YYYY-MM-DD'),
                            TpoTranCompra:"1",
                            TpoTranVenta:"1",
                            FmaPago:"2"
                        },
                        Emisor: Emisor,
                        Receptor:{
                            RUTRecep: member.rut.split('.').join(''),
                            RznSocRecep: name,
                            GiroRecep: category,
                            CdgIntRecep: member.number,
                            DirRecep: member.address.address,
                            CmnaRecep: parameters.committee.commune,
                        },
                        Totales:{
                            //MntNeto: net,
                            //TasaIVA: "19",
                            //IVA: iva,
                            MntExe: invoice.invoiceTotal,
                            MntTotal: invoice.invoiceTotal,
                            MontoPeriodo: invoice.invoiceTotal, //Consultar si se separa monto adeudado anterior
                            VlrPagar: invoice.invoiceTotal
                        }
                    },
                    Detalle: detail
                }
            }
        }

        console.log(JSON.stringify(document))
        var settings = {
            "url": "https://dev-api.haulmer.com/v2/dte/document",
            "method": "POST",
            "timeout": 0,
            "headers": {
            "apikey": parameters.apikey
            },
            "data": JSON.stringify(document)
        };  
        
        $.ajax(settings).fail( function( jqXHR, textStatus, errorThrown ) {
        
            console.log('ERROR', jqXHR.responseJSON.error.message)
            console.log('ERROR', jqXHR.responseJSON.error.details)
            loadingHandler('stop')

        }).done(async function (response) {
            
            console.log(response)
            
            let dteData = {
                id: invoiceID,
                type: dteType,
                number: response.FOLIO,
                seal: response.TIMBRE,
                token: response.TOKEN
            }

            let setDTEInvoice = await axios.post('/api/invoiceUpdateDTE', dteData)
            loadingHandler('stop')

            $('#modal_title').html(`Almacenado`)
            $('#modal_body').html(`<h7 class="alert-heading">Documento generado correctamente</h7>`)
            $('#modal').modal('show')

            loadInvoices(member)
            
        })
    }


}




//////////////////ZONA PAGOS//////////////////

$('#updatePayment').on('click', async function () {

    let memberData = await axios.post('/api/memberSingle', { id: internals.dataRowSelected._id })
    let member = memberData.data
    $('#paymentModal').modal('show')

    let name = ''
    let type = ''
    if (member.type == 'personal') {
        type = 'PERSONAL'
        name = member.personal.name + ' ' + member.personal.lastname1 + ' ' + member.personal.lastname2
    } else {
        type = 'EMPRESA'
        name = member.enterprise.name
    }

    $('#modalPayment_title').html(`Pagos Socio N° ${member.number} - ${member.personal.name + ' ' + member.personal.lastname1 + ' ' + member.personal.lastname2}`)
    createModalPayment(member)

    $('#modalPayment_footer').html(`
        <button style="border-radius: 5px;" class="btn btn-dark" data-dismiss="modal">
            <i ="color:#E74C3C;" class="fas fa-times"></i> CERRAR
        </button>
    `)

    console.log(member)

    $('#memberPaymentNumber').val(member.number)
    $('#memberPaymentType').val(type)
    $('#memberPaymentRUT').val(member.rut)
    $('#memberPaymentName').val(name)
    $('#memberPaymentWaterMeter').val(member.waterMeters.find(x => x.state === 'Activo').number)
    $('#memberPaymentAddress').val(member.address.address)

    loadPayments(member)
})

async function loadPayments(member) {

    let paymentData = await axios.post('/api/paymentsSingleMember', { member: member._id })
    let payments = paymentData.data

    $('#tablePaymentsBody').html('')

    for(let i=0; i<payments.length; i++) {

        $('#tablePaymentsBody').append(`
            <tr id="${payments[i]._id}">
                <td style="text-align: center;">
                    ${moment(payments[i].date).utc().format('DD/MM/YYYY')}
                </td>
                <td style="text-align: center;">
                    ${payments[i].paymentMethod}
                </td>
                <td style="text-align: center;">
                    ${payments[i].transaction}
                </td>
                <td style="text-align: center;">
                    ${dot_separators(payments[i].amount)}
                </td>
                <td style="text-align: center;">
                    <button class="btn btn-sm btn-warning btnLecture" onclick="createPayment('${member._id}','${payments[i]._id}')"><i class="far fa-edit" style="font-size: 14px;"></i></button>
                </td>
            </tr>
        `)
    }

}


function createModalPayment(member) {

    let body = /*html*/ `
    <div class="row">
    <div class="col-md-12">
    <h5>Datos de socio</h5>
        <div class="row">
            <div class="col-md-2">
                RUT
                <input id="memberPaymentRUT" type="text" class="form-control form-control-sm border-input" disabled>
            </div>
            <div class="col-md-3">
                Nombre
                <input id="memberPaymentName" type="text" class="form-control form-control-sm border-input" disabled>
            </div>
            <div class="col-md-1">
                N° Medidor
                <input id="memberPaymentWaterMeter" type="text" class="form-control form-control-sm border-input" disabled>
            </div>
            <div class="col-md-2">
                Tipo
                <input id="memberPaymentType" type="text" class="form-control form-control-sm border-input" disabled>
            </div>
            <div class="col-md-4">
                Dirección
                <input id="memberPaymentAddress" type="text" class="form-control form-control-sm border-input" disabled>
            </div>
            
        </div>
    </div>
</div>
<br />
<br />
<div class="row">


<h5>Pagos realizados</h5>
    <div class="col-md-12">
        <div class="row">
            <div class="col-md-8 table-responsive">
                <br/>
                <button style="border-radius: 5px;" class="btn btn-primary" onclick="createPayment('${member._id}')"><i class="fas fa-plus-circle"></i> Agregar pago</button>
                <br />
                <br />
                <table id="tablePayments" class="display nowrap table table-condensed cell-border" cellspacing="0" style="font-size: 12px">
                    <thead id="tablePaymentsHead">
                        <tr class="table-info">
                            <th style="text-align: center; background-color: #3B6FC9; border-top-left-radius: 5px;">Fecha</th>
                            <th style="text-align: center; background-color: #3B6FC9;">Medio Pago</th>
                            <th style="text-align: center; background-color: #3B6FC9;">N° Transacción</th>
                            <th style="text-align: center; background-color: #3B6FC9;">Monto</th>
                            <th style="text-align: center; background-color: #3B6FC9; border-top-right-radius: 5px;">Editar</th>
                        </tr>
                    </thead>
                    <tbody id="tablePaymentsBody">
                    </tbody>
                </table>
            </div>
            <div class="col-md-4">
                
            </div>

            <div class="col-md-12">
                <br />
                <br />
                <br />
                <br />
                <div id="divPayment" class="card border-primary" style="display: none;">
                    <div class="card-header text-white bg-primary" style="text-align: center">
                        <b id="paymentTitle">Registro de Pago</b>
                    </div>

                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-7">
                                <div class="card border-primary">
                                    <div class="card-body">
                                        <table id="tableDebtInvoices" class="display nowrap table table-condensed cell-border" cellspacing="0" style="font-size: 12px">
                                            <thead>
                                                <tr>
                                                    <th style="text-align: center">Sel</th>
                                                    <th style="text-align: center">N° Boleta</th>
                                                    <th style="text-align: center">Fecha</th>
                                                    <th style="text-align: center">Vencimiento</th>
                                                    <th style="text-align: center">Monto Total</th>
                                                    <th style="text-align: center">Saldo Adeudado</th>
                                                    <th style="text-align: center">Saldo Final</th>
                                                </tr>
                                            </thead>
                                            <tbody id="tableBodyDebtInvoices">
                                        
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-5">
                                <div class="card border-primary">
                                    <div class="card-body">
                                        <div class="row">
                                            <div class="col-md-5">
                                                Fecha
                                            </div>
                                            <div class="col-md-1" style="text-align: center"></div>
                                            <div class="col-md-6">
                                                <input id="paymentDate" type="text" class="form-control form-control-sm border-input paymentDateClass" value="${moment.utc().format('DD/MM/YYYY')}">
                                            </div>

                                            <div class="col-md-5">
                                                Medio de Pago
                                            </div>
                                            <div class="col-md-1" style="text-align: center"></div>
                                            <div class="col-md-6">
                                                <select id="paymentType" class="form-select form-select-sm">
                                                    <option value="SELECCIONE">SELECCIONE</option>
                                                    <option value="EFECTIVO">EFECTIVO</option>
                                                    <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                                                    <option value="REDCOMPRA">REDCOMPRA</option>
                                                    <option value="CHEQUE">CHEQUE</option>
                                                </select>
                                            </div>

                                            <div class="col-md-5">
                                                N° Transacción
                                            </div>
                                            <div class="col-md-1" style="text-align: center"></div>
                                            <div class="col-md-6">
                                                <input id="paymentNumber" type="text" class="form-control form-control-sm border-input numericValues">
                                            </div>

                                            <div class="col-md-5">
                                                Saldo máximo a Cancelar
                                            </div>
                                            <div class="col-md-1" style="text-align: center"></div>
                                            <div class="col-md-6">
                                                <input id="paymentToPay" type="text" class="form-control form-control-sm border-input numericValues">
                                            </div>

                                            <div class="col-md-5">
                                                Monto
                                            </div>
                                            <div class="col-md-1" style="text-align: center"></div>
                                            <div class="col-md-6">
                                                <input id="paymentAmount" type="text" class="form-control form-control-sm border-input numericValues">
                                            </div>

                                            

                                        </div>
                                    </div>
                                </div>
                            </div>

                            
                        </div>

                        <div class="row">
                            <div class="col-md-3" style="text-align: center;">
                                <button style="background-color:#3B6FC9; border-radius:5px; " class="btn btn-warning" id="paymentCancel"><i ="color:#3498db;" class="fas fa-arrow-left"></i> Atrás</button></td>
                            </div>
                            <div class="col-md-3" style="text-align: center;">
                            </div>
                            <div class="col-md-3" style="text-align: center;">
                                <button style="background-color:#3B6FC9; border-radius:5px; " class="btn btn-info" id="paymentSave"><i ="color:#3498db;" class="fas fa-check"></i> GUARDAR</button></td>
                            </div>

                            <div class="col-md-3" style="text-align: center;">
                                <button style="border-radius:5px; " class="btn btn-danger" id="paymentDelete"><i ="color:#3498db;" class="fas fa-times"></i> ELIMINAR</button></td>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
            
        </div>
    </div>

    
</div>
    
`

    $('#modalPayment_body').html(body)


    $("#paymentCancel").on('click', async function () {
        cleanPayment()
    })
}

async function cleanPayment() {
    $("#tablePaymentsBody > tr").removeClass('table-primary')
    $('#divPayment').css('display', 'none')
    $("#tableBodyDebtInvoices").html('')
    $("#paymentTitle").text('')
    $(".numericValues").val('')
    $("#paymentDate").val('')
    $("#paymentType").val('SELECCIONE')
    $("#paymentToPay").val('')
    $("#paymentAmount").val('')
    $('.btnPayment').removeAttr('disabled')
}


async function createPayment(memberID,paymentID) {

    $('#tablePaymentsBody > tr').removeClass('table-primary')
    if(paymentID){
        $("#"+paymentID).addClass('table-primary')
    }
    $('#divPayment').css('display', 'block')
    $('.btnPayment').attr('disabled',true)

    let memberData = await axios.post('/api/memberSingle', {id: memberID})
    let member = memberData.data

    $("#tableBodyDebtInvoices").html('')

    $("#paymentDate").val(moment.utc().format('DD/MM/YYYY'))
    $("#paymentType").val('SELECCIONE')
    $("#paymentToPay").val('')
    $("#paymentAmount").val('')

    if(paymentID){
        let invoicesPaymentData = await axios.post('/api/paymentSingle', { id: paymentID })
        let invoicesPayment = invoicesPaymentData.data

        $("#paymentDate").val(moment(invoicesPayment.date).utc().format('DD/MM/YYYY'))
        $("#paymentType").val(invoicesPayment.paymentMethod)
        $("#paymentNumber").val(invoicesPayment.transaction)
        //$("#paymentToPay").val('')
        $("#paymentAmount").val(invoicesPayment.amount)

        console.log(invoicesPayment.invoices)

        for(let i=0; i<invoicesPayment.invoices.length; i++){
            $("#tableBodyDebtInvoices").append(`<tr class="table-primary">
                <td style="text-align: center"><input class="checkInvoice" type="checkbox" checked/><input value="${invoicesPayment.invoices[i].invoices._id}" style="display: none;"/></td>
                <td style="text-align: center">${invoicesPayment.invoices[i].invoices.number}</td>
                <td style="text-align: center">${moment(invoicesPayment.invoices[i].invoices.date).utc().format('DD/MM/YYYY')}</td>
                <td style="text-align: center">${moment(invoicesPayment.invoices[i].invoices.dateExpire).utc().format('DD/MM/YYYY')}</td>
                <td style="text-align: right">${dot_separators(invoicesPayment.invoices[i].invoices.invoiceTotal)}</td>
                <td style="text-align: right">${dot_separators(invoicesPayment.invoices[i].invoices.invoiceTotal - invoicesPayment.invoices[i].invoices.invoicePaid + invoicesPayment.invoices[i].amount)}
                    <input value="${invoicesPayment.invoices[i].invoices.invoiceTotal - invoicesPayment.invoices[i].invoices.invoicePaid + invoicesPayment.invoices[i].amount}" style="display: none;"/>
                </td>
                <td style="text-align: right">${dot_separators(invoicesPayment.invoices[i].invoices.invoiceTotal - invoicesPayment.invoices[i].invoices.invoicePaid + invoicesPayment.invoices[i].amount)}</td>
            </tr>`)
        }


        //Carga de boletas adeudadas
        let invoicesDebtData = await axios.post('/api/invoicesDebt', { member: memberID, paymentID: paymentID})
        let invoicesDebt = invoicesDebtData.data
        
        if(invoicesDebt.length>0){
            for(let i=0; i<invoicesDebt.length; i++){

                $("#tableBodyDebtInvoices").append(`<tr>
                    <td style="text-align: center"><input class="checkInvoice" type="checkbox" /><input value="${invoicesDebt[i]._id}" style="display: none;"/></td>
                    <td style="text-align: center">${invoicesDebt[i].number}</td>
                    <td style="text-align: center">${moment(invoicesDebt[i].date).utc().format('DD/MM/YYYY')}</td>
                    <td style="text-align: center">${moment(invoicesDebt[i].dateExpire).utc().format('DD/MM/YYYY')}</td>
                    <td style="text-align: right">${dot_separators(invoicesDebt[i].invoiceTotal)}</td>
                    <td style="text-align: right">${dot_separators(invoicesDebt[i].invoiceTotal - invoicesDebt[i].invoicePaid)}
                        <input value="${invoicesDebt[i].invoiceTotal - invoicesDebt[i].invoicePaid}" style="display: none;"/>
                    </td>
                    <td style="text-align: right">${dot_separators(invoicesDebt[i].invoiceTotal - invoicesDebt[i].invoicePaid)}</td>
                </tr>`)
            }
        }

    }else{
        
        //Carga de boletas adeudadas
        let invoicesDebtData = await axios.post('/api/invoicesDebt', { member: memberID })
        let invoicesDebt = invoicesDebtData.data
        
        if(invoicesDebt.length>0){
            for(let i=0; i<invoicesDebt.length; i++){

                $("#tableBodyDebtInvoices").append(`<tr>
                    <td style="text-align: center"><input class="checkInvoice" type="checkbox" /><input value="${invoicesDebt[i]._id}" style="display: none;"/></td>
                    <td style="text-align: center">${invoicesDebt[i].number}</td>
                    <td style="text-align: center">${moment(invoicesDebt[i].date).utc().format('DD/MM/YYYY')}</td>
                    <td style="text-align: center">${moment(invoicesDebt[i].dateExpire).utc().format('DD/MM/YYYY')}</td>
                    <td style="text-align: right">${dot_separators(invoicesDebt[i].invoiceTotal)}</td>
                    <td style="text-align: right">${dot_separators(invoicesDebt[i].invoiceTotal - invoicesDebt[i].invoicePaid)}
                        <input value="${invoicesDebt[i].invoiceTotal - invoicesDebt[i].invoicePaid}" style="display: none;"/>
                    </td>
                    <td style="text-align: right">${dot_separators(invoicesDebt[i].invoiceTotal - invoicesDebt[i].invoicePaid)}</td>
                </tr>`)
            }
        }else{
            $('#modal_title').html(`Al día`)
            $('#modal_body').html(`<h7 class="alert-heading">Socio no tiene deuda activa</h7>`)
        }

    }

    
    $('.paymentDateClass').daterangepicker({
        opens: 'right',
        locale: dateRangePickerDefaultLocale,
        singleDatePicker: true,
        autoApply: true
    })

    $('.checkInvoice').change(function () {
        calculatePaymentBalance()
    })

    $("#paymentAmount").keyup(function () {
        calculatePaymentBalance()
    })


    calculatePaymentBalance()

    $('#paymentSave').off("click")

    $("#paymentSave").on('click', async function () {

        let goSave = false
        let invoices = []

        if($("#tableBodyDebtInvoices > tr").length>0){
            $("#tableBodyDebtInvoices > tr").each(function() {
                if($($($(this).children()[0]).children()[0]).prop('checked')){
                    goSave = true

                    let invoiceAmount = parseInt($($($(this).children()[5]).children()[0]).val()) - parseInt(replaceAll($($(this).children()[6]).text(), '.',''))

                    invoices.push({
                        invoices: $($($(this).children()[0]).children()[1]).val(),
                        amount: invoiceAmount
                    })
                }
            })    
        }

        if(!goSave){
            $('#modal').modal('show')
            $('#modal_title').html(`Error al almacenar pago`)
            $('#modal_body').html(`<h7 class="alert-heading">Debe seleccionar al menos 1 boleta a cancelar</h7>`)
            return
        }

        let toPay = parseInt(replaceAll($("#paymentToPay").val(), '.', '').replace(' ', '').replace('$', ''))
        let amount = parseInt(replaceAll($("#paymentAmount").val(), '.', '').replace(' ', '').replace('$', ''))

        if(!$.isNumeric(amount)){
            $('#modal').modal('show')
            $('#modal_title').html(`Error al almacenar pago`)
            $('#modal_body').html(`<h7 class="alert-heading">Monto no válido</h7>`)
            return
        }

        if(amount<=0){
            $('#modal').modal('show')
            $('#modal_title').html(`Error al almacenar pago`)
            $('#modal_body').html(`<h7 class="alert-heading">Monto no válido</h7>`)
            return
        }
        
        if(amount>toPay){
            $('#modal').modal('show')
            $('#modal_title').html(`Error al almacenar pago`)
            $('#modal_body').html(`<h7 class="alert-heading">El monto a pagar no puede ser mayor al saldo</h7>`)
            return
        }
        if($("#paymentType").val()=='SELECCIONE'){
            $('#modal').modal('show')
            $('#modal_title').html(`Error al almacenar pago`)
            $('#modal_body').html(`<h7 class="alert-heading">Debe seleccionar medio de pago</h7>`)
            return
        }
        
        let paymentData = {
            member: member._id,
            //number: replaceAll($("#invoiceNumber").val(), '.', '').replace(' ', ''),
            date: $("#paymentDate").data('daterangepicker').startDate.format('YYYY-MM-DD'),
            paymentMethod: $("#paymentType").val(),
            transaction: $("#paymentNumber").val(),
            amount: amount,
            invoices: invoices
        }

        console.log(paymentData)

        let urlSave = 'paymentSave'
        if(paymentID){
            urlSave = 'paymentUpdate'
            paymentData.id = paymentID
        }
        
        let savePayment = await axios.post('/api/'+urlSave, paymentData)
        if (savePayment.data) {
            if (savePayment.data._id) {

                $('#modal_title').html(`Almacenado`)
                $('#modal_body').html(`<h7 class="alert-heading">Pago almacenado correctamente</h7>`)
                loadPayments(member)
                cleanPayment()
            } else {
                $('#modal_title').html(`Error`)
                $('#modal_body').html(`<h7 class="alert-heading">Error al almacenar, favor reintente</h7>`)
            }
        } else {
            $('#modal_title').html(`Error`)
            $('#modal_body').html(`<h7 class="alert-heading">Error al almacenar, favor reintente</h7>`)
        }
        $('#modal').modal('show')

    })
}

function calculatePaymentBalance() {

    let totalSelected = 0
    $("#tableBodyDebtInvoices > tr").each(function() {
        let value = 0
        if($($($(this).children()[0]).children()[0]).prop('checked')){
            value = $($($(this).children()[5]).children()[0]).val()
        }
        totalSelected += parseInt(value)

        $($(this).children()[6]).text(dot_separators($($($(this).children()[5]).children()[0]).val()))
    })
    
    $("#paymentToPay").val(dot_separators(totalSelected))

    let amount = parseInt(replaceAll($("#paymentAmount").val(), '.', '').replace(' ', '').replace('$', ''))

    if($.isNumeric(amount)){
        $("#tableBodyDebtInvoices > tr").each(function() {
            let value = 0
            if($($($(this).children()[0]).children()[0]).prop('checked')){
                value = parseInt($($($(this).children()[5]).children()[0]).val())

                if(value<=amount){
                    $($(this).children()[6]).text(0)
                    amount -= value
                }else if(amount!=0){
                    $($(this).children()[6]).text(dot_separators(value-amount))
                }
            }
            
        })
    }

    new Cleave($("#paymentAmount"), {
        prefix: '$',
        numeral: true,
        numeralThousandsGroupStyle: 'thousand',
        numeralDecimalScale: 0,
        numeralPositiveOnly: true,
        numeralDecimalMark: ",",
        delimiter: "."
    })

    new Cleave($("#paymentToPay"), {
        prefix: '$',
        numeral: true,
        numeralThousandsGroupStyle: 'thousand',
        numeralDecimalScale: 0,
        numeralPositiveOnly: true,
        numeralDecimalMark: ",",
        delimiter: "."
    })

    return
    let net = 0
    //Consumos
    let lectureActual = $("#invoiceLectureActual").val()
    let lectureLast = $("#invoiceLectureLast").val()
    let lectureValue = lectureActual - lectureLast

    $("#invoiceLectureResult").val(lectureValue)
    let meterValue = $("#invoiceMeterValue").val()
    let consumptionValue = lectureValue * meterValue
    $("#invoiceConsumption1").val(consumptionValue)

    let subsidy = $("#invoiceSubsidyPercentage").val()

    let subsidyValue = 0
    if (subsidy > 0) {
        if (lectureValue <= parameters.subsidyLimit) {
            subsidyValue = Math.round(consumptionValue * (subsidy / 100))
        } else {
            subsidyValue = Math.round((parameters.subsidyLimit * meterValue) * (subsidy / 100))
        }
    }
    $("#invoiceSubsidyValue").val(subsidyValue)
    let consumptionLimit = $("#invoiceConsumptionLimit").val()
    let consumptionLimitValue = $("#invoiceConsumptionLimitValue").val()
    let consumptionLimitTotal = 0 //Valor a pagar por sobreconsumo
    if(lectureValue>consumptionLimit){
        consumptionLimitTotal = (lectureValue - consumptionLimit) * consumptionLimitValue
    }
    $("#invoiceConsumptionLimitTotal").val(consumptionLimitTotal)

    let lastConsumptionValue = consumptionValue - subsidyValue + consumptionLimitTotal
    $("#invoiceConsumption2").val(lastConsumptionValue)
    $("#invoiceConsumption2b").val(lastConsumptionValue)

    //Servicios
    let totalServices = 0
    if($("#tableBodyServices > tr").length>0){
        $("#tableBodyServices > tr").each(function() {
            let value = 0
            if(!$.isNumeric($($($(this).children()[1]).children()[0]).val())){
                value = 0
            }else{
                value = $($($(this).children()[1]).children()[0]).val()
            }
            totalServices += parseInt(value)
        })    
    }
    $("#invoiceTotalServices").val(totalServices)
    $("#invoiceTotalServicesb").val(totalServices)

    //Montos
    let debt = 0
    $("#invoiceDebt").val(debt) //A asignar
    $("#invoiceTotal").val(parseInt(parameters.charge) + parseInt(lastConsumptionValue) + parseInt(debt) + parseInt(totalServices))


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