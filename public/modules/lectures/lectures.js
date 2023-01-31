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
    //printInvoice('pdf','personal','6321dfae8adffa8c6c36142f','63d7c0a92e1f62467010998b',false,'letter')
    //printInvoice('pdf','personal','6321dfae8adffa8c6c36142f','63d7c0a92e1f62467010998b')
    //printInvoicePortrait('pdf','personal','6321dfae8adffa8c6c36142f','63d7c0a92e1f62467010998b')
    //printVoucher('631b595b386018341861418d','63b876e6a478533d6bfb17fd')
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

}

function chargeMembersTable(invoice) {
    if(invoice){
        if($.isNumeric(invoice)){
            if(invoice<=0){
                toastr.warning('Debe ingresar un número mayor a 0')                
                return false
            }
        }else{
            toastr.warning('Debe ingresar un número válido')
            return false
        }
    }

    try {
        if ($.fn.DataTable.isDataTable('#tableMembers')) {
            internals.members.table.clear().destroy()
        }
        internals.members.table = $('#tableMembers')
            .DataTable({
                dom: 'Blfrtip',
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
                lengthMenu: [ [10, 25, 50, -1], [10, 25, 50, "Todo"] ],
                language: {
                    url: spanishDataTableLang
                },
                responsive: true,
                columnDefs: [{ targets: [0, 1, 4], className: 'dt-center' }],
                order: [[0, 'asc']],
                ordering: true,
                rowCallback: function (row, data) {
                    //$(row).find('td:eq(1)').html(moment.utc(data.date).format('DD/MM/YYYY'))
                    //$(row).find('td:eq(5)').html(dot_separators(data.lastLecture))
                    // $('td', row).css('background-color', 'White');
                },
                columns: [
                    { data: 'number' },
                    { data: 'typeString' },
                    { data: 'name' },
                    { data: 'sector' },
                    { data: 'subsidyActive' }/*,
                    { data: 'lastLecture' },
                    { data: 'paymentStatus' }*/
                ],
                initComplete: function (settings, json) {
                    getMembers(invoice)
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

async function getMembers(invoice) {
    let query = {
        sector: $("#searchSector").val()
    }
    if(invoice){
        query.invoice = invoice
    }
    let lecturesData = await axios.post('api/membersLectures', query)

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

            el.subsidyActive = 'NO'
            if(el.subsidies.length>0){
                if(el.subsidies.find(x => x.status=='active')){
                    el.subsidyActive = 'SI'
                }
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

$('#searchInvoice').on('click', async function () {
    chargeMembersTable($("#searchNumber").val())
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

    loadLectures(member)

})


async function loadLectures(member) {

    let lectureData = await axios.post('/api/lecturesSingleMember', { member: internals.dataRowSelected._id })
    let lectures = lectureData.data

    $('#tableLecturesBody').html('')

    for (i = 0; i < lectures.length; i++) {

        let subtotal = 0, total = 0
        let btn = '', btnPrint = '', btnPrint2 = '', btnGenerate = '', btnSII = '', btnEmail = '', btnAnnulment = '', btnAnnulmentHistory = ''
        let invoiceID = 0
        if (lectures[i].invoice) {
            subtotal = dot_separators(lectures[i].invoice.invoiceSubTotal)
            total = dot_separators(lectures[i].invoice.invoiceTotal)
            btn = `<button class="btn btn-sm btn-info btnLecture" onclick="printInvoicePortrait('preview','${member.type}','${member._id}','${lectures[i].invoice._id}')"><i class="far fa-eye" style="font-size: 14px;"></i></button>`
            //btn = `<button class="btn btn-sm btn-info btnLecture" onclick="printAnnulment('preview','${member.type}','${member._id}','${lectures[i].invoice._id}')"><i class="far fa-eye" style="font-size: 14px;"></i></button>`
            invoiceID = lectures[i].invoice._id
            
            if(lectures[i].invoice.number || lectures[i].invoice.number==0){
                //btnPrint = `<button class="btn btn-sm btn-primary btnLecture" onclick="printInvoice('pdf','${member.type}','${member._id}','${lectures[i].invoice._id}')"><i class="fas fa-print" style="font-size: 14px;"></i> A5</button>`
                btnPrint2 = `<button class="btn btn-sm btn-primary btnLecture" onclick="printInvoice('pdf','${member.type}','${member._id}','${lectures[i].invoice._id}',false,'letter')"><i class="fas fa-print" style="font-size: 14px;"></i> CARTA</button>`
                btnGenerate = `<button class="btn btn-sm btn-danger btnLecture" onclick="printInvoicePortrait('pdf','${member.type}','${member._id}','${lectures[i].invoice._id}')"><i class="far fa-file-pdf" style="font-size: 14px;"></i>${lectures[i].invoice.number}</button>`
                //btnPayment = `<button class="btn btn-sm btn-info btnLecture" onclick="payInvoice('pdf','${member.type}','${member._id}','${lectures[i].invoice._id}')"><i class="fas fa-dollar-sign" style="font-size: 14px;"></i></button>`
                btnEmail = `<button class="btn btn-sm btn-warning btnLecture" onclick="printInvoicePortrait('pdf','${member.type}','${member._id}','${lectures[i].invoice._id}',true)"><i class="fas fa-envelope" style="font-size: 14px;"></i></button>`
                btnAnnulment = `<button class="btn btn-sm btn-info btnLecture" onclick="annulmentInvoice('${member.type}','${member._id}','${lectures[i].invoice._id}')">Anular Boleta</button>`
                
                //if(isEmail(member.email)){
                    btnEmail = `<button class="btn btn-sm btn-warning btnLecture" onclick="printInvoicePortrait('pdf','${member.type}','${member._id}','${lectures[i].invoice._id}',true)"><i class="fas fa-envelope" style="font-size: 14px;"></i></button>`
                //}else{
                    //btnEmail = `<button class="btn btn-sm btn-dark btnLecture" onclick="noEmail()"><i class="fas fa-envelope" style="font-size: 14px;"></i></button>`
                //}
            }else{
                btnGenerate = `<button class="btn btn-sm btn-info btnLecture" onclick="sendData('${member.type}','${member._id}','${lectures[i].invoice._id}')">Generar Boleta</button>`
                btnAnnulment = `<button class="btn btn-sm btn-dark" disabled>Anular</button>`
            }
            if(lectures[i].invoice.token){
                btnSII = `<button class="btn btn-sm btn-warning btnLecture" onclick="showSIIPDF('${lectures[i].invoice.token}')"><img src="/public/img/logo_sii.png" style="width: 24px"/></button>`
            }

        }else{
            subtotal = 'NO CALCULADO'
            total = 'NO CALCULADO'
            btn = `<button class="btn btn-sm btn-dark" disabled><i class="far fa-eye" style="font-size: 14px;"></i></button>`
            btnGenerate = `<button class="btn btn-sm btn-dark" disabled><i class="far fa-file-pdf" style="font-size: 14px;"></i></button>`
        }

        if(lectures[i].invoicesAnnulled){
            btnAnnulmentHistory = `<button class="btn btn-sm btn-info" onclick="showAnnulment('${member.type}','${member._id}','${lectures[i]._id}')"><i class="far fa-eye" style="font-size: 14px;"></i></button>`
        }else{
            btnAnnulmentHistory = `<button class="btn btn-sm btn-dark" disabled><i class="far fa-eye" style="font-size: 14px;"></i></button>`
        }

        $('#tableLecturesBody').append(`
            <tr id="${lectures[i]._id}" data-invoice="${invoiceID}">
                <td style="text-align: center;">
                    ${getMonthString(lectures[i].month)}
                </td>
                <td style="text-align: center;">
                    ${moment(lectures[i].logs[lectures[i].logs.length - 1].date).utc().format('DD/MM/YYYY')}
                </td>
                <td style="text-align: center;">
                    ${dot_separators(lectures[i].logs[lectures[i].logs.length - 1].lecture)}
                </td>
                <td style="text-align: center;">
                    ${subtotal}
                </td>
                <td style="text-align: center;">
                    ${total}
                </td>
                <td style="text-align: center;">
                    <button class="btn btn-sm btn-warning btnLecture" onclick="createInvoice('${lectures[i]._id}','${invoiceID}','${member._id}')"><i class="far fa-edit" style="font-size: 14px;"></i></button>
                </td>
                <td style="text-align: center;">
                    ${btn}
                </td>
                <td style="text-align: center;">
                    ${btnGenerate}
                </td>
                <td style="text-align: center;">
                    ${btnPrint}
                    ${btnPrint2}
                </td>
                <td style="text-align: center;">
                    ${btnEmail}
                </td>
                <td style="text-align: center;">
                    ${btnAnnulmentHistory}
                </td>
            </tr>
        `)

        /*
        <td style="text-align: center;">
            ${btnSII}
        </td>
        <td style="text-align: center;">
            ${btnEmail}
        </td>
        <td style="text-align: center;">
            ${btnAnnulment}
        </td> 
        */
    }

    /*$('#tableLectures tbody').off("click")

    $('#tableLectures tbody').on('click', 'tr', function () {
            $('#tableLecturesBody > tr').removeClass('table-primary')
            $(this).addClass('table-primary')
            $('#divInvoice').css('display', 'block')
            $('#tableLectures tbody').off("click")
            $('.btnLecture').attr('disabled',true)
            createInvoice($(this).attr('id'), $(this).attr('data-invoice'), member)
    
    })*/

}

function noEmail(){
    toastr.error('Socio no tiene correo electrónico')
}

function validateInvoiceData(invoiceData) {

    let errorMessage = ''
    
    /*if(!$.isNumeric(invoiceData.number)){
        errorMessage += '<br>Número de Boleta/Factura'
    }*/
    if(!$.isNumeric(invoiceData.charge)){
        errorMessage += '<br>Cargo Fijo'
    }
    if (!$.isNumeric(invoiceData.lectureActual)) {
        errorMessage += '<br>Lectura Actual'
    }
    if (!$.isNumeric(invoiceData.lectureLast)) {
        errorMessage += '<br>Lectura Anterior'
    }
    if(invoiceData.lectureNewStart !== undefined){
        if (!$.isNumeric(invoiceData.lectureNewStart)) {
            errorMessage += '<br>Lectura Inicio Medidor Nuevo'
        }
        if (!$.isNumeric(invoiceData.lectureNewEnd)) {
            errorMessage += '<br>Lectura Final Medidor Nuevo'
        }
    }
    if (!$.isNumeric(invoiceData.lectureResult)) {
        errorMessage += '<br>Consumo mts<sup>3</sup>'
    }
    if (!$.isNumeric(invoiceData.meterValue)) {
        errorMessage += '<br>Valor mts<sup>3</sup>'
    }
    if (!$.isNumeric(invoiceData.subsidyPercentage)) {
        errorMessage += '<br>Porcentaje Subsidio'
    }
    if (!$.isNumeric(invoiceData.subsidyValue)) {
        errorMessage += '<br>Valor Subsidio'
    }
    if (!$.isNumeric(invoiceData.consumption)) {
        errorMessage += '<br>Consumo a Cobro'
    }
    if (!$.isNumeric(invoiceData.invoiceDebt)) {
        errorMessage += '<br>Deuda Anterior'
    }
    if (!$.isNumeric(invoiceData.invoiceTotal)) {
        errorMessage += '<br>Total'
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


<h5>Lecturas realizadas</h5>
    <div class="col-md-12 table-responsive">
        <br/>
        <br />
        <br />
        <table id="tableLectures" class="display nowrap table table-condensed cell-border" cellspacing="0">
            <thead id="tableLecturesHead">
                <tr class="table-info">
                    <th style="text-align: center; background-color: #3B6FC9; border-top-left-radius: 5px;">Mes</th>
                    <th style="text-align: center; background-color: #3B6FC9;">Fecha</th>
                    <th style="text-align: center; background-color: #3B6FC9;">Lectura</th>
                    <th style="text-align: center; background-color: #3B6FC9;">Sub Total</th>
                    <th style="text-align: center; background-color: #3B6FC9;">Valor Total</th>
                    <th style="text-align: center; background-color: #3B6FC9;">Crear/Editar</th>
                    <th style="text-align: center; background-color: #3B6FC9;">Vista Previa</th>
                    <th style="text-align: center; background-color: #3B6FC9;">PDF Boleta/Fact</th>
                    <th style="text-align: center; background-color: #3B6FC9;">Imprimir</th>
                    <!--<th style="text-align: center; background-color: #3B6FC9;">DTE SII</th>-->
                    <th style="text-align: center; background-color: #3B6FC9;">Enviar</th>
                    <!--<th style="text-align: center; background-color: #3B6FC9;">Anular</th>-->
                    <th style="text-align: center; background-color: #3B6FC9; border-top-right-radius: 5px;">Anulados</th>
                </tr>
            </thead>
            <tbody id="tableLecturesBody">
            </tbody>
        </table>
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
                <b id="invoiceTitle">Registro de Boleta/Factura</b>
            </div>

            <div class="card-body">
                <div class="row">
                    <div class="col-md-2">
                        Tipo Documento
                    </div>
                    <div class="col-md-3">
                        <select id="invoiceType" class="form-control form-select form-control-sm">
                            <option value="41">BOLETA</option>
                            <option value="34">FACTURA</option>
                        </select>
                    </div>
                    <div class="col-md-1">
                        Fecha
                    </div>
                    <div class="col-md-2">
                        <input id="invoiceDate" type="text" class="form-control form-control-sm border-input invoiceDateClass" value="${moment.utc().format('DD/MM/YYYY')}">
                    </div>
                    <div class="col-md-2">
                        Fecha Vencimiento
                    </div>
                    <div class="col-md-2">
                        <input id="invoiceDateExpire" type="text" class="form-control form-control-sm border-input invoiceDateClass" value="${moment.utc().add(15, 'days').format('DD/MM/YYYY')}">
                    </div>
                </div>

                <div class="card border-primary">
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-12" style="text-align: center">
                                <b>Consumos</b>
                            </div>

                            <div class="col-md-8">
                                Cargo Fijo
                            </div>
                            <div class="col-md-1" style="text-align: center">(+)</div>
                            <div class="col-md-3">
                                <input id="invoiceCharge" type="text" class="form-control form-control-sm border-input numericValues money">
                            </div>

                            <div class="col-md-2">
                                <br>
                                Consumo mts<sup>3</sup> 
                            </div>
                            <div class="col-md-3" style="text-align: center">
                                Lectura Actual - Anterior
                                <br>
                                (<input id="invoiceLectureActual" type="text" class="form-control form-control-sm border-input numericValues consumption" style="display: inline-block; width: 40%; text-align: center;">
                                -
                                <input id="invoiceLectureLast" type="text" class="form-control form-control-sm border-input numericValues consumption" style="display: inline-block; width: 40%; text-align: center;">)
                            </div>
                            <div id="divLectureNew" class="col-md-4" style="text-align: center; visibility: hidden">
                                Medidor Nuevo (Actual - Anterior)
                                <br>
                                + (<input id="invoiceLectureNewEnd" type="text" class="form-control form-control-sm border-input numericValues consumption" style="display: inline-block; width: 40%; text-align: center;">
                                -
                                <input id="invoiceLectureNewStart" type="text" class="form-control form-control-sm border-input numericValues consumption" style="display: inline-block; width: 40%; text-align: center;">)
                                =
                            </div>
                            <div class="col-md-3">
                                <br>
                                <input id="invoiceLectureResult" type="text" class="form-control form-control-sm border-input numericValues consumption">
                            </div>

                            <div class="col-md-8">
                                Valor mt<sup>3</sup>
                            </div>
                            <div class="col-md-1" style="text-align: center">(x)</div>
                            <div class="col-md-3">
                                <input id="invoiceMeterValue" type="text" class="form-control form-control-sm border-input numericValues money">
                            </div>

                            <div class="col-md-8">
                                Consumo $
                            </div>
                            <div class="col-md-1" style="text-align: center">(=)</div>
                            <div class="col-md-3">
                                <input id="invoiceConsumption1" type="text" class="form-control form-control-sm border-input numericValues money">
                            </div>

                            <div class="col-md-5">
                                Subsidio
                            </div>
                            <div class="col-md-3">
                                <input id="invoiceSubsidyPercentage" type="text" class="form-control form-control-sm border-input" style="display: inline-block; width: 50%"><span style="display: inline-block">%</span>
                            </div>
                            <div class="col-md-1" style="text-align: center">(-)</div>
                            <div class="col-md-3">
                                <input id="invoiceSubsidyValue" type="text" class="form-control form-control-sm border-input numericValues money" >
                            </div>

                            <div class="col-md-4">
                                Sobreconsumo (<label id="invoiceConsumptionLimitLabel"></label> mts<sup>3</sup>)
                            </div>
                            <div class="col-md-2">
                                <input id="invoiceConsumptionLimit" type="text" class="form-control form-control-sm border-input" style="display: none">
                                <input id="invoiceConsumptionLimitOver" type="text" class="form-control form-control-sm border-input" style="display: inline-block; width: 60%"><span style="display: inline-block">mts<sup>3</sup></span>
                            </div>
                            <div class="col-md-2">
                                <input id="invoiceConsumptionLimitValue" type="text" class="form-control form-control-sm border-input numericValues money">
                            </div>
                            <div class="col-md-1" style="text-align: center">(+)</div>
                            <div class="col-md-3">
                                <input id="invoiceConsumptionLimitTotal" type="text" class="form-control form-control-sm border-input numericValues money" >
                            </div>
                            <div class="col-md-8">
                                Alcantarillado $
                            </div>
                            <div class="col-md-1" style="text-align: center">(+)</div>
                            <div class="col-md-3">
                                <input id="invoiceSewerage" type="text" class="form-control form-control-sm border-input numericValues money">
                            </div>

                            <div class="col-md-8">
                                Consumo $
                            </div>
                            <div class="col-md-1" style="text-align: center">(=)</div>
                            <div class="col-md-3">
                                <input id="invoiceConsumption2a" type="text" class="form-control form-control-sm border-input numericValues money" style="background-color: #b7ebd8">
                            </div>
                            
                            <div class="col-md-8">
                                <input id="invoiceFineCheck" type="checkbox" />
                                Multa 20% $
                            </div>
                            <div class="col-md-1" style="text-align: center">(+)</div>
                            <div class="col-md-3">
                                <input id="invoiceFine" type="text" class="form-control form-control-sm border-input numericValues money">
                            </div>

                            <div class="col-md-8">
                                Consumo a Cobro
                            </div>
                            <div class="col-md-1" style="text-align: center">(=)</div>
                            <div class="col-md-3">
                                <input id="invoiceConsumption2" type="text" class="form-control form-control-sm border-input numericValues money" style="background-color: #b7ebd8">
                            </div>

                        </div>
                    </div>
                </div>

                <div class="card border-primary">
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-12" style="text-align: center">
                                <b>Convenios</b>
                            </div>

                            <div class="col-md-12">
                                <table class="table" style="font-size: 12px">
                                    <thead>
                                        <tr>
                                            <th style="width: 60%">Convenio</th>
                                            <th style="width: 10%; text-align: center">Cuota</th>
                                            <th style="width: 30%; text-align: right">Valor</th>
                                        </tr>
                                    </thead>
                                    <tbody id="tableBodyAgreements">
                                    
                                    </tbody>
                                </table>
                            </div>
                            <div class="col-md-8">
                                Total Convenios $
                            </div>
                            <div class="col-md-1" style="text-align: center"></div>
                            <div class="col-md-3">
                                <input id="invoiceTotalAgreements" type="text" class="form-control form-control-sm border-input numericValues money" style="background-color: #FAE3C2">
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
                            
                            <div class="col-md-8">
                                Consumo
                            </div>
                            <div class="col-md-1" style="text-align: center">(+)</div>
                            <div class="col-md-3">
                                <input id="invoiceConsumption2b" type="text" class="form-control form-control-sm border-input numericValues money" style="background-color: #B7EBD8">
                            </div>
                            <div class="col-md-8">
                                Multa por atraso (3% del saldo anterior)
                            </div>
                            <div class="col-md-1" style="text-align: center">(+)</div>
                            <div class="col-md-3">
                                <input id="invoiceDebtFine" type="text" class="form-control form-control-sm border-input numericValues money" onkeyup="calculateDebt()">
                            </div>

                            <div class="col-md-8">
                                SubTotal Tributable (a generar en boleta SII)
                            </div>
                            <div class="col-md-1" style="text-align: center">(=)</div>
                            <div class="col-md-3">
                                <input id="invoiceSubTotal" type="text" class="form-control form-control-sm border-input numericValues money" style="background-color: #B6D8FF">
                            </div>

                            <div class="col-md-8">
                                Convenios
                            </div>
                            <div class="col-md-1" style="text-align: center">(+)</div>
                            <div class="col-md-3">
                                <input id="invoiceTotalAgreementsb" type="text" class="form-control form-control-sm border-input numericValues money" style="background-color: #FAE3C2">
                            </div>

                            <div class="col-md-8">
                                Saldo Anterior
                            </div>
                            <div class="col-md-1" style="text-align: center">(+)</div>
                            <div class="col-md-3">
                                <input id="invoiceDebt" type="text" class="form-control form-control-sm border-input numericValues money" onkeyup="calculateDebt()">
                            </div>
                            
                            <div class="col-md-8">
                                Total
                            </div>
                            <div class="col-md-1" style="text-align: center">(=)</div>
                            <div class="col-md-3">
                                <input id="invoiceTotal" type="text" class="form-control form-control-sm border-input numericValues money">
                            </div>

                            <div class="col-md-6">
                                Mensaje Corte
                            </div>
                            <div class="col-md-6">
                                <select id="invoiceText1" type="text" class="form-control form-control-sm form-select form-select-sm">">
                                    <option value=""></option>
                                    <option value="${parameters.text1}">${parameters.text1}</option>
                                    <option value="${parameters.text1b}">${parameters.text1b}</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-3" style="text-align: center;">
                        <button style="border-radius:5px" class="btn btn-warning" id="invoiceCancel"><i class="fas fa-arrow-left"></i> Atrás</button></td>
                    </div>
                    <div class="col-md-3" style="text-align: center;">
                    </div>
                    <div class="col-md-3" style="text-align: center;">
                        <button style="border-radius:5px" class="btn btn-info" id="invoiceSave"><i class="fas fa-check"></i> GUARDAR</button></td>
                    </div>
                    <div class="col-md-3" style="text-align: right;">
                        <button style="border-radius:5px; display: none" class="btn btn-danger" id="invoiceDelete"><i class="fas fa-times"></i> ELIMINAR</button></td>
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
    })

}

async function cleanInvoice() {
    $("#tableLecturesBody > tr").removeClass('table-primary')
    $('#divInvoice').css('display', 'none')
    $("#invoiceTitle").text('')
    $(".numericValues").val('')
    $("#invoiceDate").val('')
    $("#invoiceDateExpire").val('')
    $("#invoiceSubsidyPercentage").val('')
    $("#tableBodyAgreements").html('')
    $('.btnLecture').removeAttr('disabled')
}

async function showAnnulment(type,memberID,lecture){
    let invoices = await axios.post('/api/invoicesByLecture', { lecture: lecture })
    $("#tableAnnulmentsBody").html('')

    for(let i=0; i<invoices.data.length; i++){
        if(invoices.data[i].annulment){
            $("#tableAnnulmentsBody").append(`
                <tr>
                    <td>${invoices.data[i].number}</td>
                    <td>${moment(invoices.data[i].date).utc().format('DD/MM/YYYY')}</td>
                    <td><button class="btn btn-sm btn-danger btnLecture" onclick="printInvoicePortrait('pdf','${type}','${memberID}','${invoices.data[i]._id}')"><i class="far fa-file-pdf" style="font-size: 14px;"></i></button></td>
                    <td>${invoices.data[i].annulment.number}</td>
                    <td>${moment(invoices.data[i].annulment.date).utc().format('DD/MM/YYYY')}</td>
                    <td><button class="btn btn-sm btn-danger btnLecture" onclick="showSIIPDF('${invoices.data[i].annulment.token}')"><i class="far fa-file-pdf" style="font-size: 14px;"></i></button></td>
                </tr>
            `)
        }
        
    }

    $('#paymentAnnulled').modal('show')

}

async function addLecture() {
    //date: moment().format('YYYY-MM-DD[T]HH:mm[Z]'),

    let lecture = {
        users: userCredentials._id,
        date: moment().format('YYYY-MM-DD[T]HH:mm:ss.SSS[Z]'),
        member: internals.dataRowSelected._id,
        //lecture: 3513
        lecture: $("#addLectureTest").val()
    }

    let saveLecture = await axios.post('/api/lectureSave', lecture)
}

function calculateTotal(type) {

    let parametersCharge = parameters.charge
    //if(type=='edit'){
        //parametersCharge = $("#invoiceCharge").val()
    //}
    let net = 0
    //Consumos
    let lectureActual = $("#invoiceLectureActual").val()
    let lectureLast = $("#invoiceLectureLast").val()
    let lectureValue = lectureActual - lectureLast

    if($("#divLectureNew").css('visibility') == 'visible'){
        lectureValue += ($("#invoiceLectureNewEnd").val() - $("#invoiceLectureNewStart").val())
    }

    $("#invoiceLectureResult").val(lectureValue)
    let meterValue = $("#invoiceMeterValue").val()
    let consumptionValue = lectureValue * meterValue
    $("#invoiceConsumption1").val(consumptionValue)
    let sewerage = parseInt($("#invoiceSewerage").val())


    let subsidy = $("#invoiceSubsidyPercentage").val()
    let consumptionSubsidy = consumptionValue + parseInt(parametersCharge) + sewerage

    let subsidyValue = 0
    if (subsidy > 0) {
        if (lectureValue <= parameters.subsidyLimit) {
            subsidyValue = Math.round(consumptionSubsidy * (subsidy / 100))
        } else {
            subsidyValue = Math.round(((parameters.subsidyLimit * meterValue) + parseInt(parametersCharge) + sewerage) * (subsidy / 100))
        }
    }
    $("#invoiceSubsidyValue").val(subsidyValue)
    $("#invoiceConsumptionLimitOver").val(0)
    let consumptionLimit = $("#invoiceConsumptionLimit").val()
    let consumptionLimitValue = $("#invoiceConsumptionLimitValue").val()
    let consumptionLimitTotal = 0 //Valor a pagar por sobreconsumo
    if(lectureValue>consumptionLimit){
        consumptionLimitTotal = (lectureValue - consumptionLimit) * consumptionLimitValue
        $("#invoiceConsumptionLimitOver").val(lectureValue - consumptionLimit)
    }
    $("#invoiceConsumptionLimitTotal").val(consumptionLimitTotal)


    let lastConsumptionValue = parseInt(parametersCharge) + consumptionValue - subsidyValue + consumptionLimitTotal + sewerage
    $("#invoiceConsumption2a").val(lastConsumptionValue)

    let fine = 0
    if($("#invoiceFineCheck").prop('checked')){
        fine = (consumptionSubsidy + consumptionLimitTotal)  * 0.2 //Multa actual, parametrizar
        $("#invoiceFine").val(fine)
        lastConsumptionValue += fine
    }else{
        $("#invoiceFine").attr('disabled','disabled')
        $("#invoiceFine").val(fine)
    }

    $("#invoiceConsumption2").val(lastConsumptionValue)
    $("#invoiceConsumption2b").val(lastConsumptionValue)

    //Convenios
    let totalAgreements = 0
    if($("#tableBodyAgreements > tr").length>0){
        $("#tableBodyAgreements > tr").each(function() {
            let value = 0
            if(!$.isNumeric($($($(this).children()[2]).children()[0]).val())){
                value = 0
            }else{
                value = $($($(this).children()[2]).children()[0]).val()
            }
            totalAgreements += parseInt(value)
        })    
    }
    $("#invoiceTotalAgreements").val(totalAgreements)
    $("#invoiceTotalAgreementsb").val(totalAgreements)

    //Montos
    let debt = $("#invoiceDebt").val()
    $("#invoiceDebt").val(debt)
    let debtFine = 0
    if(debt>0){
        debtFine = debt * 0.03

        $("#invoiceText1").val(parameters.text1)
        
    }
    $("#invoiceDebtFine").val(parseInt(debtFine))
    let subTotal = parseInt(lastConsumptionValue) + parseInt(debtFine)
    $("#invoiceSubTotal").val(subTotal)
    $("#invoiceTotal").val(subTotal + parseInt(debt) + parseInt(totalAgreements))

    $(".consumption").each(function() {
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

function calculateDebt() {
    let subTotal = replaceAll($("#invoiceConsumption2b").val(), '.', '').replace(' ', '').replace('$', '')
    let agreements = replaceAll($("#invoiceTotalAgreementsb").val(), '.', '').replace(' ', '').replace('$', '')
    let debt = replaceAll($("#invoiceDebt").val(), '.', '').replace(' ', '').replace('$', '')
    let debtFine = replaceAll($("#invoiceDebtFine").val(), '.', '').replace(' ', '').replace('$', '')
    //let debtFine = debt * 0.03
    //$("#invoiceDebtFine").val('$ ' + dot_separators(parseInt(debtFine)))

    let total = parseInt(subTotal) + parseInt(debt) + parseInt(debtFine) + parseInt(agreements)
    
    $("#invoiceSubTotal").val('$ ' + dot_separators(parseInt(subTotal) + parseInt(debtFine)))
    $("#invoiceTotal").val('$ ' + dot_separators(total))
}

async function createInvoice(lectureID, invoiceID, memberID) {

    $('#tableLecturesBody > tr').removeClass('table-primary')
    $("#"+lectureID).addClass('table-primary')
    $('#divInvoice').css('display', 'block')
    $('.btnLecture').attr('disabled', true)


    let memberData = await axios.post('/api/memberSingle', {id: memberID})
    let member = memberData.data
    
    if (invoiceID == 0) {

        let lectureData = await axios.post('/api/lectureSingle', { id: lectureID })
        let lecture = lectureData.data
        
        $("#invoiceTitle").text("Nueva Boleta/Factura")
        $("#invoiceSave").removeAttr('disabled')
        $("#invoiceSave").removeAttr('title')
        if(member.dte=='BOLETA'){
            $("#invoiceType").val(41)
        }else if(member.dte=='FACTURA'){
            $("#invoiceType").val(34)
        }
        $("#invoiceDate").val(moment.utc().format('DD/MM/YYYY'))

        let year = lecture.year
        let yearDue = lecture.year
        let monthDue = lecture.month
        let month = lecture.month+1
        let day = parameters.expireDay
        if(month>12){
            month = 1
            year++
        }
        if(month<10){
            month = '0' + month
        }
        if(day<10){
            day = '0' + day
        }

        let expireDate = year+''+month+''+day
        
        if(parseInt(day)>28){
            while(!moment(expireDate).isValid()){
                day = parseInt(day)-1
                expireDate = year+''+month+''+day
            }
        }

        if(moment()>=moment(expireDate)){
            $("#invoiceDateExpire").val(moment.utc().add(15, 'days').format('DD/MM/YYYY'))
            /*$('#modal_title').html(`Almacenado`)
            $('#modal_body').html(`<h7 class="alert-heading">Las fechas podrían estar erróneas, favor revisar</h7>`)*/
            toastr.warning('Favor verificar fechas')
            //$('#modal').modal('show')
        }else{
            $("#invoiceDateExpire").val(moment(expireDate).utc().format('DD/MM/YYYY'))
        }
        
        
        $("#invoiceCharge").val(parameters.charge)

        let subsidy = 0
        if (member.subsidies.length > 0) {
            for(let i=0; i<member.subsidies.length; i++){
                /*if(moment.utc()>=moment(member.subsidies[i].startDate) && moment.utc()<=moment(member.subsidies[i].endDate)){
                    subsidy = member.subsidies[i].percentage
                }*/
                if(member.subsidies[i].status=='active'){
                    subsidy = member.subsidies[i].percentage
                }
            }
        }

        $("#invoiceLectureActual").val(lecture.logs[lecture.logs.length - 1].lecture)
        $("#invoiceLectureLast").val(lecture.lastLecture)
        if(lecture.logs[lecture.logs.length - 1].lectureNewStart !== undefined){
            $("#invoiceLectureNewStart").val(lecture.logs[lecture.logs.length - 1].lectureNewStart)
            $("#invoiceLectureNewEnd").val(lecture.logs[lecture.logs.length - 1].lectureNewEnd)
            $("#divLectureNew").css('visibility','visible')
        }else{
            $("#divLectureNew").css('visibility','hidden')
        }

        $("#invoiceSubsidyPercentage").val(subsidy)
        if(member.waterMeters.find(x => x.state === 'Activo').diameter=='TresCuartos'){
            $("#invoiceMeterValue").val(parameters.meterValueB)
        }else{
            $("#invoiceMeterValue").val(parameters.meterValue)
        }

        $("#invoiceConsumptionLimitLabel").text(parameters.consumptionLimit)
        $("#invoiceConsumptionLimit").val(parameters.consumptionLimit)
        $("#invoiceConsumptionLimitValue").val(parameters.consumptionLimitValue)

        $('.invoiceDateClass').daterangepicker({
            opens: 'right',
            locale: dateRangePickerDefaultLocale,
            singleDatePicker: true,
            autoApply: true
        })

        $("#invoiceSewerage").val(0)
        //Servicios
        if (member.services) {
            if (member.services.length > 0) {
                for(let i=0; i<member.services.length; i++){
                    if(member.services[i].services.type=='ALCANTARILLADO'){
                        //$("#invoiceSewerage").val((member.services[i].value!=0) ? member.services[i].value : member.services[i].services.value)
                        $("#invoiceSewerage").val(member.services[i].services.value)
                    }
                }
            }
        }
        
        if(member.fine){
            $("#invoiceFineCheck").prop('checked','checked')
        }

        let agreementData = await axios.post('/api/agreementsByDate', { 
            year: parseInt(yearDue),
            month: parseInt(monthDue),
            member: memberID
        })

        let agreements = agreementData.data

        $("#tableBodyAgreements").html('')

        if (agreements.length > 0) {
            for(let j=0; j<agreements.length; j++){
                if(agreements[j].due){
                    $("#tableBodyAgreements").append(`<tr>
                        <td>
                            <input value="${agreements[j]._id}" style="display: none;" />
                            <span>${(agreements[j].services) ? agreements[j].services.name : agreements[j].other}</span>
                        </td>
                        <td style="text-align: center">${agreements[j].due.number} / ${agreements[j].dues.length}</td>
                        <td><input type="text" class="form-control form-control-sm numericValues money" value="${agreements[j].due.amount}"/></td>
                    </tr>`)
                }
            }
        }

        //Carga de boletas adeudadas
        let invoicesDebtData = await axios.post('/api/invoicesDebt', { member: memberID })
        let invoicesDebt = invoicesDebtData.data

        let debt = 0
        if(invoicesDebt.length>0){
            for(let i=0; i<invoicesDebt.length; i++){
                if(invoicesDebt[i].invoicePaid){
                    debt += invoicesDebt[i].invoiceSubTotal - invoicesDebt[i].invoicePaid
                }else{
                    debt += invoicesDebt[i].invoiceSubTotal
                }
            }
        }

        $("#invoiceDebt").val(debt)
        //$("#invoiceDebtFine").val(0)

        calculateTotal()

        $('#invoiceSave').off("click")

        $("#invoiceSave").on('click', async function () {

            let goSave = false

            let services = []
            /*if($("#tableBodyServices > tr").length>0){
                $("#tableBodyServices > tr").each(function() {
    
                    if(!$.isNumeric(replaceAll($($($(this).children()[2]).children()[0]).val(), '.', '').replace(' ', '').replace('$', ''))){
                        value = 0
                    }else{
                        value = replaceAll($($($(this).children()[2]).children()[0]).val(), '.', '').replace(' ', '').replace('$', '')
                    }
    
                    services.push({
                        services: $($($(this).children()[0]).children()[0]).val(),
                        value: value
                    })
                })
            }*/
            let agreements = []
            if($("#tableBodyAgreements > tr").length>0){
                $("#tableBodyAgreements > tr").each(function() {
                    agreements.push({
                        agreements: $($($(this).children()[0]).children()[0]).val(),
                        text: $($($(this).children()[0]).children()[1]).text(),
                        number: parseInt($($(this).children()[1]).text().split(' / ')[0]),
                        dueLength: parseInt($($(this).children()[1]).text().split(' / ')[1]),
                        amount: replaceAll($($($(this).children()[2]).children()[0]).val(), '.', '').replace(' ', '').replace('$', '')
                    })
                })
            }

            let text1 = ''
            let text2 = parameters.text2
            let text3 = parameters.text3
            if(parseInt(replaceAll($("#invoiceDebt").val(), '.', '').replace(' ', '').replace('$', ''))>0){
                text1 = parameters.text1
            }
            if($("#invoiceText1").val()!=''){
                text1 = $("#invoiceText1").val()
            }

            let invoiceData = {
                lectures: lectureID,
                member: member._id,
                //number: replaceAll($("#invoiceNumber").val(), '.', '').replace(' ', ''),
                type: $("#invoiceType").val(),
                date: $("#invoiceDate").data('daterangepicker').startDate.format('YYYY-MM-DD'),
                dateExpire: $("#invoiceDateExpire").data('daterangepicker').startDate.format('YYYY-MM-DD'),
                charge: replaceAll($("#invoiceCharge").val(), '.', '').replace(' ', '').replace('$', ''),
                lectureActual: replaceAll($("#invoiceLectureActual").val(), '.', '').replace(' ', '').replace('$', ''),
                lectureLast: replaceAll($("#invoiceLectureLast").val(), '.', '').replace(' ', '').replace('$', ''),
                lectureResult: replaceAll($("#invoiceLectureResult").val(), '.', '').replace(' ', '').replace('$', ''),
                meterValue: replaceAll($("#invoiceMeterValue").val(), '.', '').replace(' ', '').replace('$', ''),
                subsidyPercentage: replaceAll($("#invoiceSubsidyPercentage").val(), '.', '').replace(' ', '').replace('$', ''),
                subsidyValue: replaceAll($("#invoiceSubsidyValue").val(), '.', '').replace(' ', '').replace('$', ''),
                consumptionLimit: replaceAll($("#invoiceConsumptionLimit").val(), '.', '').replace(' ', '').replace('$', ''),
                consumptionLimitValue: replaceAll($("#invoiceConsumptionLimitValue").val(), '.', '').replace(' ', '').replace('$', ''),
                consumptionLimitTotal: replaceAll($("#invoiceConsumptionLimitTotal").val(), '.', '').replace(' ', '').replace('$', ''),
                //consumption: replaceAll($("#invoiceConsumption2").val(), '.', '').replace(' ', '').replace('$', ''),
                consumption: replaceAll($("#invoiceSubTotal").val(), '.', '').replace(' ', '').replace('$', ''),
                sewerage: replaceAll($("#invoiceSewerage").val(), '.', '').replace(' ', '').replace('$', ''),
                fine: replaceAll($("#invoiceFine").val(), '.', '').replace(' ', '').replace('$', ''),
                invoiceSubTotal: replaceAll($("#invoiceSubTotal").val(), '.', '').replace(' ', '').replace('$', ''),
                invoiceDebt: replaceAll($("#invoiceDebt").val(), '.', '').replace(' ', '').replace('$', ''),
                debtFine: replaceAll($("#invoiceDebtFine").val(), '.', '').replace(' ', '').replace('$', ''),
                invoiceTotal: replaceAll($("#invoiceTotal").val(), '.', '').replace(' ', '').replace('$', ''),
                services: services,
                agreements: agreements,
                text1: text1,
                text2: text2,
                text3: text3
            }

            if($("#divLectureNew").css('visibility') == 'visible'){
                invoiceData.lectureNewStart = replaceAll($("#invoiceLectureNewStart").val(), '.', '').replace(' ', '').replace('$', '')
                invoiceData.lectureNewEnd = replaceAll($("#invoiceLectureNewEnd").val(), '.', '').replace(' ', '').replace('$', '')
            }

            /*if(services.length>0){
                saleData.services = services
            }*/
            console.log('datos',invoiceData)
            
            const res = validateInvoiceData(invoiceData)
            if (res.ok) {
                let saveInvoice = await axios.post('/api/invoiceSave', res.ok)
                console.log('resultado',saveInvoice)
                if (saveInvoice.data) {
                    if (saveInvoice.data._id) {

                        /*$('#modal_title').html(`Almacenado`)
                        $('#modal_body').html(`<h7 class="alert-heading">Boleta almacenada correctamente</h7>`)*/
                        toastr.success('Boleta almacenada correctamente')
                        cleanInvoice()
                        loadLectures(member)
                    } else {
                        /*$('#modal_title').html(`Error`)
                        $('#modal_body').html(`<h7 class="alert-heading">Error al almacenar, favor reintente</h7>`)*/
                        toastr.error('Error al almacenar, favor reintente')
                    }
                } else {
                    /*$('#modal_title').html(`Error`)
                    $('#modal_body').html(`<h7 class="alert-heading">Error al almacenar, favor reintente</h7>`)*/
                    toastr.error('Error al almacenar, favor reintente')
                }
                //$('#modal').modal('show')
            }

        })
    } else {

        let invoiceData = await axios.post('/api/invoiceSingle', { id: invoiceID })
        let invoice = invoiceData.data

        console.log('invoice',invoice)

        if(invoice.number){
            $("#invoiceTitle").text("Boleta/Factura N° " + invoice.number)
            $("#invoiceSave").attr('disabled',true)
            $("#invoiceSave").attr('title','Debe anular la boleta para poder guardar')
        }else{
            $("#invoiceTitle").text("Boleta/Factura por generar")
            $("#invoiceSave").removeAttr('disabled')
            $("#invoiceSave").removeAttr('title')
        }
        //$("#invoiceNumber").val(invoice.number)
        $("#invoiceType").val(invoice.type)
        $("#invoiceDate").val(moment(invoice.date).utc().format('DD/MM/YYYY'))
        $("#invoiceDateExpire").val(moment(invoice.dateExpire).utc().format('DD/MM/YYYY'))
        $("#invoiceCharge").val(invoice.charge)
        $("#invoiceLectureActual").val(invoice.lectureActual)
        $("#invoiceLectureLast").val(invoice.lectureLast)
        if(invoice.lectureNewStart !== undefined){
            $("#invoiceLectureNewStart").val(invoice.lectureNewStart)
            $("#invoiceLectureNewEnd").val(invoice.lectureNewEnd)
            $("#divLectureNew").css('visibility','visible')
        }else{
            $("#divLectureNew").css('visibility','hidden')
        }


        $("#invoiceSubsidyPercentage").val(invoice.subsidyPercentage)
        $("#invoiceMeterValue").val(invoice.meterValue)

        $("#invoiceConsumptionLimitLabel").val(invoice.consumptionLimit)
        $("#invoiceConsumptionLimit").val(invoice.consumptionLimit)
        $("#invoiceConsumptionLimitValue").val(invoice.consumptionLimitValue)
        if(invoice.sewerage){
            $("#invoiceSewerage").val(invoice.sewerage)
        }else{
            $("#invoiceSewerage").val(0)
        }

        $("#invoiceFine").val(0)
        if(invoice.fine){
            if(invoice.fine>0){
                $("#invoiceFineCheck").prop('checked','checked')
                $("#invoiceFine").val(invoice.fine)
            }
        }

        $("#invoiceDebt").val(invoice.invoiceDebt)
        $("#invoiceDebtFine").val(invoice.invoiceDebtFine)
        //$("#invoiceConsumptionLimitTotal").val(invoice.consumptionLimitTotal)
        
        /*
        $("#invoiceLectureResult").val(invoice.lectureResult)
        let consumptionValue = invoice.lectureResult * invoice.meterValue
        $("#invoiceConsumption1").val(consumptionValue)
        $("#invoiceSubsidyValue").val(invoice.subsidyValue)
        $("#invoiceConsumption2").val(invoice.consumption)
        $("#invoiceConsumption2b").val(invoice.consumption)
        $("#invoiceDebt").val(invoice.invoiceDebt)
        $("#invoiceTotal").val(invoice.invoiceTotal)*/

        $('.invoiceDateClass').daterangepicker({
            opens: 'right',
            locale: dateRangePickerDefaultLocale,
            singleDatePicker: true,
            autoApply: true
        })

        $("#tableBodyServices").html('')



        /*STAND BY
        if (invoice.services) {
            if (invoice.services.length > 0) {
                for(let i=0; i<invoice.services.length; i++){

                    if(member.services[i].services.type=='ALCANTARILLADO'){
                        $("#invoiceSewerage").val((member.services[i].value!=0) ? member.services[i].value : member.services[i].services.value)
                    }else{

                        $("#tableBodyServices").append(`<tr>
                            <td>
                                <input type="text" class="form-control form-control-sm" value="${invoice.services[i].services._id}" style="display: none"/>
                                <span>${invoice.services[i].services.name}</span>
                            </td>
                            <td>XX</td>
                            <td><input type="text" class="form-control form-control-sm numericValues money" value="${(invoice.services[i].value!=0) ? invoice.services[i].value : '' }"/></td>
                        </tr>`)
                        //<td><button class="btn btn-sm btn-danger" style="border-radius:5px;" onclick="deleteService(this)"><i class="fas fa-times"></i></button></td>
                    }
                }
            }
        }*/

        let agreementData = await axios.post('/api/agreementsByInvoice', { 
            invoiceID: invoiceID
        })

        let agreements = agreementData.data

        $("#tableBodyAgreements").html('')

        if (agreements.length > 0) {
            for(let j=0; j<agreements.length; j++){
                $("#tableBodyAgreements").append(`<tr>
                    <td>
                        <input value="${agreements[j]._id}" style="display: none;" />
                        <span>${(agreements[j].services) ? agreements[j].services.name : agreements[j].other}</span>
                    </td>
                    <td style="text-align: center">${agreements[j].due.number} / ${agreements[j].dues.length}</td>
                    <td><input type="text" class="form-control form-control-sm numericValues money" value="${agreements[j].due.amount}"/></td>
                </tr>`)
            }
        }

        calculateTotal('edit')

        $('#invoiceSave').off("click")

        $("#invoiceSave").on('click', async function () {

            let goSave = false

            let services = []
            /*if($("#tableBodyServices > tr").length>0){
                $("#tableBodyServices > tr").each(function() {
    
                    if(!$.isNumeric(replaceAll($($($(this).children()[2]).children()[0]).val(), '.', '').replace(' ', '').replace('$', ''))){
                        value = 0
                    }else{
                        value = replaceAll($($($(this).children()[2]).children()[0]).val(), '.', '').replace(' ', '').replace('$', '')
                    }
    
                    services.push({
                        services: $($($(this).children()[0]).children()[0]).val(),
                        value: value
                    })
                })    
            }*/

            let agreements = []
            if($("#tableBodyAgreements > tr").length>0){
                $("#tableBodyAgreements > tr").each(function() {
                    agreements.push({
                        agreements: $($($(this).children()[0]).children()[0]).val(),
                        text: $($($(this).children()[0]).children()[1]).text(),
                        number: parseInt($($(this).children()[1]).text().split(' / ')[0]),
                        dueLength: parseInt($($(this).children()[1]).text().split(' / ')[1]),
                        amount: replaceAll($($($(this).children()[2]).children()[0]).val(), '.', '').replace(' ', '').replace('$', '')
                    })
                })
            }

            let text1 = ''
            let text2 = parameters.text2
            let text3 = parameters.text3
            if(parseInt(replaceAll($("#invoiceDebt").val(), '.', '').replace(' ', '').replace('$', ''))>0){
                text1 = parameters.text1
            }
            if($("#invoiceText1").val()!=''){
                text1 = $("#invoiceText1").val()
            }

            let invoiceData = {
                id: invoiceID,
                lectures: lectureID,
                //member: internals.dataRowSelected._id,
                member: member._id,
                type: $("#invoiceType").val(),
                date: $("#invoiceDate").data('daterangepicker').startDate.format('YYYY-MM-DD'),
                dateExpire: $("#invoiceDateExpire").data('daterangepicker').startDate.format('YYYY-MM-DD'),
                charge: replaceAll($("#invoiceCharge").val(), '.', '').replace(' ', '').replace('$', ''),
                lectureActual: replaceAll($("#invoiceLectureActual").val(), '.', '').replace(' ', '').replace('$', ''),
                lectureLast: replaceAll($("#invoiceLectureLast").val(), '.', '').replace(' ', '').replace('$', ''),
                lectureResult: replaceAll($("#invoiceLectureResult").val(), '.', '').replace(' ', '').replace('$', ''),
                meterValue: replaceAll($("#invoiceMeterValue").val(), '.', '').replace(' ', '').replace('$', ''),
                subsidyPercentage: replaceAll($("#invoiceSubsidyPercentage").val(), '.', '').replace(' ', '').replace('$', ''),
                subsidyValue: replaceAll($("#invoiceSubsidyValue").val(), '.', '').replace(' ', '').replace('$', ''),
                consumptionLimit: replaceAll($("#invoiceConsumptionLimit").val(), '.', '').replace(' ', '').replace('$', ''),
                consumptionLimitValue: replaceAll($("#invoiceConsumptionLimitValue").val(), '.', '').replace(' ', '').replace('$', ''),
                consumptionLimitTotal: replaceAll($("#invoiceConsumptionLimitTotal").val(), '.', '').replace(' ', '').replace('$', ''),
                //consumption: replaceAll($("#invoiceConsumption2").val(), '.', '').replace(' ', '').replace('$', ''),
                consumption: replaceAll($("#invoiceSubTotal").val(), '.', '').replace(' ', '').replace('$', ''),
                sewerage: replaceAll($("#invoiceSewerage").val(), '.', '').replace(' ', '').replace('$', ''),
                fine: replaceAll($("#invoiceFine").val(), '.', '').replace(' ', '').replace('$', ''),
                invoiceSubTotal: replaceAll($("#invoiceSubTotal").val(), '.', '').replace(' ', '').replace('$', ''),
                invoiceDebt: replaceAll($("#invoiceDebt").val(), '.', '').replace(' ', '').replace('$', ''),
                debtFine: replaceAll($("#invoiceDebtFine").val(), '.', '').replace(' ', '').replace('$', ''),
                invoiceTotal: replaceAll($("#invoiceTotal").val(), '.', '').replace(' ', '').replace('$', ''),
                services: services,
                agreements: agreements,
                text1: text1,
                text2: text2,
                text3: text3
            }

            if($("#divLectureNew").css('visibility') == 'visible'){
                invoiceData.lectureNewStart = replaceAll($("#invoiceLectureNewStart").val(), '.', '').replace(' ', '').replace('$', '')
                invoiceData.lectureNewEnd = replaceAll($("#invoiceLectureNewEnd").val(), '.', '').replace(' ', '').replace('$', '')
            }

            /*if ($.isNumeric($("#invoiceNumber").val())) {
                invoiceData.number = $("#invoiceNumber").val()
            }*/

            /*if(services.length>0){
                saleData.services = services
            }*/

            console.log('send',invoiceData)

            const res = validateInvoiceData(invoiceData)
            if (res.ok) {
                let updateInvoice = await axios.post('/api/invoiceUpdate', res.ok)
                if (updateInvoice.data) {
                    if (updateInvoice.data._id) {

                        /*$('#modal_title').html(`Almacenado`)
                        $('#modal_body').html(`<h7 class="alert-heading">Boleta almacenada correctamente</h7>`)*/
                        toastr.success('Boleta almacenada correctamente')
                        cleanInvoice()
                        loadLectures(member)
                    } else {
                        /*$('#modal_title').html(`Error`)
                        $('#modal_body').html(`<h7 class="alert-heading">Error al almacenar, favor reintente</h7>`)*/
                        toastr.error('Error al almacenar, favor reintente')
                    }
                } else {
                    /*$('#modal_title').html(`Error`)
                    $('#modal_body').html(`<h7 class="alert-heading">Error al almacenar, favor reintente</h7>`)*/
                    toastr.error('Error al almacenar, favor reintente')
                }
                //$('#modal').modal('show')
            }

        })

        if(invoice.number){
            $("#invoiceDelete").css('display','none')
        }else{
            console.log('here')
            $("#invoiceDelete").css('display','block') 
        }

        $("#invoiceDelete").on('click', async function () {
            let deleteInvoiceMessage = await Swal.fire({
                title: '¿Está seguro de eliminar estos datos?',
                customClass: 'swal-wide',
                html: ``,
                showCloseButton: true,
                showCancelButton: true,
                showConfirmButton: true,
                focusConfirm: false,
                confirmButtonText: 'Aceptar',
                cancelButtonText: 'Cancelar'
            })
        
            if (deleteInvoiceMessage.value) {
                let invoiceData = {
                    id: invoiceID
                }

                let deleteInvoice = await axios.post('/api/invoiceDelete', invoiceData)
                if (deleteInvoice.data) {
                    //$('#modal_title').html(`Eliminado`)
                    //$('#modal_body').html(`<h7 class="alert-heading">Registro eliminado</h7>`)
                    toastr.success('Registro eliminado')
                    cleanInvoice()
                    loadLectures(member)
                } else {
                    //$('#modal_title').html(`Error`)
                    //$('#modal_body').html(`<h7 class="alert-heading">Error al eliminar, favor reintente</h7>`)
                    toastr.error('Error al eliminar, favor reintente')
                }

                //$('#modal').modal('show')
            }
        })
    }
}


async function showSIIPDF(token) {
    loadingHandler('start')
    
    let parametersData = await axios.get('/api/parameters')
    let parameters = parametersData.data

    var settings = {
        "url": "https://"+parameters.emisor.link+"/v2/dte/document/"+token+"/pdf",
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

    
    let memberData = await axios.post('/api/memberSingle', {id: memberID})
    let member = memberData.data

    let invoiceData = await axios.post('/api/invoiceSingle', {id: invoiceID})
    let invoice = invoiceData.data

    let parametersData = await axios.get('/api/parameters')
    let parameters = parametersData.data

    if(parameters.receiptState){
        let generateDoc = await Swal.fire({
            title: 'Generar documento',
            customClass: 'swal-wide',
            html: `Se emitirá comprobante de consumo<br/>¿Desea continuar?`,
            showCloseButton: true,
            showCancelButton: true,
            showConfirmButton: true,
            focusConfirm: false,
            confirmButtonText: 'Aceptar',
            cancelButtonText: 'Cancelar'
        })

        if (generateDoc.value) {

            let dteData = {
                id: invoiceID,
                type: 0,
                number: 0,
                seal: '',
                token: '',
                resolution: {
                    fecha: '',
                    numero: 0
                }
            }
            
            let setDTEInvoice = await axios.post('/api/invoiceUpdateDTE', dteData)
            loadingHandler('stop')

            toastr.success('Documento almacenado correctamente')

            printInvoicePortrait('pdf',member.type,member._id,invoiceID)

            loadLectures(member)

        }

        return
    }else{

        if(invoice.invoiceSubTotal==0){
            let generateDoc = await Swal.fire({
                title: 'Generar documento',
                customClass: 'swal-wide',
                html: `El valor de consumo es 0, por lo que sólo se emitirá un comprobante<br/>¿Desea continuar?`,
                showCloseButton: true,
                showCancelButton: true,
                showConfirmButton: true,
                focusConfirm: false,
                confirmButtonText: 'Aceptar',
                cancelButtonText: 'Cancelar'
            })

            if (generateDoc.value) {

                let dteData = {
                    id: invoiceID,
                    type: 0,
                    number: 0,
                    seal: '',
                    token: '',
                    resolution: {
                        fecha: '',
                        numero: 0
                    }
                }
                
                let setDTEInvoice = await axios.post('/api/invoiceUpdateDTE', dteData)
                loadingHandler('stop')

                toastr.success('Documento almacenado correctamente')

                printInvoicePortrait('pdf',member.type,member._id,invoiceID)

                loadLectures(member)

            }

            return
        }


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
            
            let lecturesData = await axios.post('/api/lecturesSingleMember', {member:  memberID})
            let lectures = lecturesData.data

            let name = '', category = ''
            let document = ''

            /*DETALLE*/

            let detail = [{
                NroLinDet: 1,
                NmbItem: "Servicio de Agua",
                QtyItem: 1,
                PrcItem: invoice.invoiceSubTotal,
                MontoItem: invoice.invoiceSubTotal,
                IndExe: 1 //1=exento o afecto / 2=no facturable
            }]

            let totalAgreement = 0
            if(invoice.agreements){
                for(let i=0; i<invoice.agreements.length; i++){
                    totalAgreement += parseInt(invoice.agreements[i].amount)
                }
            }
            if(totalAgreement>0){
                detail.push({
                    NroLinDet: 2,
                    NmbItem: "Otros",
                    QtyItem: 1,
                    PrcItem: totalAgreement,
                    MontoItem: totalAgreement,
                    IndExe: 2 //1=exento o afecto / 2=no facturable
                })
            }
            
            if(invoice.type==41){

                if(type=='personal'){
                    name = member.personal.name+' '+member.personal.lastname1+' '+member.personal.lastname2
                }else{
                    name = member.enterprise.fullName
                }

                let Emisor = { //emission=real / test
                    RUTEmisor: parameters.emisor.RUTEmisor,
                    RznSocEmisor: parameters.emisor.RznSocEmisor,
                    GiroEmisor: parameters.emisor.GiroEmisor,
                    DirOrigen: parameters.emisor.DirOrigen,
                    CmnaOrigen: parameters.emisor.CmnaOrigen,
                    CdgSIISucur: parameters.emisor.CdgSIISucur
                }

                /////////////////////////
                let debt = 0
                if(invoice.invoiceDebt){
                    debt = invoice.invoiceDebt
                }

                let totals = {
                    MntExe: invoice.invoiceSubTotal, //Facturable, suma de detalle con indicador exento "1"
                    MntTotal: invoice.invoiceSubTotal,
                    MontoNF: totalAgreement, //No facturable, suma de detalle con indicador exento "2"
                    TotalPeriodo: invoice.invoiceSubTotal + totalAgreement, //Monto Total + Monto no Facturable
                    SaldoAnterior: debt, //Saldo anterior, sólo informativo
                    VlrPagar: invoice.invoiceSubTotal + totalAgreement + debt //Valor Total + Saldo anterior
                }
                /////////////////////////////

                document = {
                    response: ["TIMBRE","FOLIO","RESOLUCION",'XML'],
                    dte: {
                        Encabezado: {
                            IdDoc:{
                                TipoDTE: invoice.type,
                                Folio: 0,
                                FchEmis: moment.utc(invoice.date).format('YYYY-MM-DD'),
                                FchVenc: moment.utc(invoice.dateExpire).format('YYYY-MM-DD'),
                                //IndServicio: "3", //1=Servicios periódicos, 2=Serv. periódicos domiciliarios, 3=boleta de venta o servicio
                                IndServicio: "2", //1=Servicios periódicos, 2=Serv. periódicos domiciliarios
                                PeriodoDesde: moment.utc(invoice.lectures.year + '-' + invoice.lectures.month + '-01').startOf('month').format('YYYY-MM-DD'), //Revisar fechas, si corresponde a la toma de estado (desde el 1 al 30 del mes)
                                PeriodoHasta: moment.utc(invoice.lectures.year + '-' + invoice.lectures.month + '-01').endOf('month').format('YYYY-MM-DD')
                            },
                            Emisor: Emisor,
                            Receptor:{
                                RUTRecep: member.rut.split('.').join(''),
                                RznSocRecep: name,
                                DirRecep: member.address.address,
                                CmnaRecep: parameters.committee.commune,
                                CiudadRecep: parameters.committee.city
                            },
                            Totales: totals
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

                let address = member.address.address
                if(member.enterprise.address){
                    address = member.enterprise.address
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

                let Emisor = { //EMISOR DE PRUEBA
                    RUTEmisor: parameters.emisor.RUTEmisor,
                    RznSoc: parameters.emisor.RznSoc,
                    GiroEmis: parameters.emisor.GiroEmisor,
                    Acteco: parameters.emisor.Acteco,
                    DirOrigen: parameters.emisor.DirOrigen,
                    CmnaOrigen: parameters.emisor.CmnaOrigen,
                    Telefono: parameters.emisor.Telefono,
                    CdgSIISucur: parameters.emisor.CdgSIISucur
                }

                /////////////////////////
                let debt = 0
                if(invoice.invoiceDebt){
                    debt = invoice.invoiceDebt
                }

                let totals = {
                    MntExe: invoice.invoiceSubTotal, //Facturable, suma de detalle con indicador exento "1"
                    MntTotal: invoice.invoiceSubTotal,
                    MontoNF: totalAgreement, //No facturable, suma de detalle con indicador exento "2"
                    //TotalPeriodo: invoice.invoiceSubTotal + totalAgreement, //Monto Total + Monto no Facturable
                    MontoPeriodo: invoice.invoiceSubTotal + totalAgreement, //Monto Total + Monto no Facturable
                    SaldoAnterior: debt, //Saldo anterior, sólo informativo
                    VlrPagar: invoice.invoiceSubTotal + totalAgreement + debt //Valor Total + Saldo anterior
                }
                /////////////////////////////

                document = {
                    response: ["TIMBRE","FOLIO","RESOLUCION","XML"],
                    dte: {
                        Encabezado: {
                            IdDoc:{
                                TipoDTE: invoice.type,
                                Folio: 0,
                                FchEmis: moment.utc(invoice.date).format('YYYY-MM-DD'),
                                FchVenc: moment.utc(invoice.dateExpire).format('YYYY-MM-DD'),
                                TpoTranCompra:"1",
                                TpoTranVenta:"1",
                                //FmaPago:"2",
                                FmaPago:"1", //1=Contado 2=Crédito 3=Sin costo (entrega gratuita)
                                IndServicio: "1", //1=Serv. periódicos domiciliarios
                                PeriodoDesde: moment.utc(invoice.lectures.year + '-' + invoice.lectures.month + '-01').startOf('month').format('YYYY-MM-DD'), //Revisar fechas, si corresponde a la toma de estado (desde el 1 al 30 del mes)
                                PeriodoHasta: moment.utc(invoice.lectures.year + '-' + invoice.lectures.month + '-01').endOf('month').format('YYYY-MM-DD')
                            },
                            Emisor: Emisor,
                            Receptor:{
                                RUTRecep: member.rut.split('.').join(''),
                                RznSocRecep: name,
                                GiroRecep: category,
                                CdgIntRecep: member.number,
                                DirRecep: address,
                                CmnaRecep: parameters.committee.commune,
                            },
                            Totales: totals
                        },
                        Detalle: detail
                    }
                }
            }

            
            var settings = {
                "url": "https://"+parameters.emisor.link+"/v2/dte/document",
                "method": "POST",
                "timeout": 0,
                "headers": {
                "apikey": parameters.apikey
                },
                "data": JSON.stringify(document)
            }
            
            $.ajax(settings).fail( function( jqXHR, textStatus, errorThrown ) {
            
                console.log('ERROR', jqXHR.responseJSON.error.message)
                console.log('ERROR', jqXHR.responseJSON.error.details)
                loadingHandler('stop')

            }).done(async function (response) {
                
                console.log('response',response)
                
                let dteData = {
                    id: invoiceID,
                    type: invoice.type,
                    number: response.FOLIO,
                    seal: response.TIMBRE,
                    token: response.TOKEN,
                    resolution: response.RESOLUCION
                }
                

                let setDTEInvoice = await axios.post('/api/invoiceUpdateDTE', dteData)
                loadingHandler('stop')

                /*$('#modal_title').html(`Almacenado`)
                $('#modal_body').html(`<h7 class="alert-heading">Documento generado correctamente</h7>`)
                $('#modal').modal('show')*/
                toastr.success('Documento generado correctamente')

                printInvoicePortrait('pdf',member.type,member._id,invoiceID)

                loadLectures(member)
                
            })
        }
    }
}


async function annulmentInvoice(type,memberID,invoiceID) {

    let generateDTE = await Swal.fire({
        title: '¿Está seguro de anular la boleta?',
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

        let lecturesData = await axios.post('/api/lecturesSingleMember', {member:  memberID})
        let lectures = lecturesData.data

        let parametersData = await axios.get('/api/parameters')
        let parameters = parametersData.data

        let dteType = 61
        let name = '', category = ''
        let document = ''


        let Receptor
        if(type=='personal'){
            name = member.personal.name+' '+member.personal.lastname1+' '+member.personal.lastname2
            Receptor = {
                            RUTRecep: member.rut.split('.').join(''),
                            RznSocRecep: name,
                            DirRecep: member.address.address,
                            CmnaRecep: parameters.committee.commune,
                            CiudadRecep: parameters.committee.city
                        }
        }else{
            name = member.enterprise.fullName
            category = member.enterprise.category

            if(name==''){ //Sólo para efectos de TEST
                name = member.personal.name+' '+member.personal.lastname1+' '+member.personal.lastname2
                category = 'TEST'
            }
            Receptor = {
                            RUTRecep: member.rut.split('.').join(''),
                            RznSocRecep: name,
                            GiroRecep: category,
                            CdgIntRecep: member.number,
                            DirRecep: member.address.address,
                            CmnaRecep: parameters.committee.commune
                        }
        }


        let Emisor = { //EMISOR DE PRUEBA
            RUTEmisor: parameters.emisor.RUTEmisor,
            RznSoc: parameters.emisor.RznSocEmisor,
            GiroEmis: parameters.emisor.GiroEmisor,
            Acteco: parameters.emisor.Acteco,
            DirOrigen: parameters.emisor.DirOrigen,
            CmnaOrigen: parameters.emisor.CmnaOrigen,
            Telefono: parameters.emisor.Telefono,
            CdgSIISucur: parameters.emisor.CdgSIISucur
            /*Acteco: "479100",
            DirOrigen: "ARTURO PRAT 527   CURICO",
            CmnaOrigen: "Curicó",
            Telefono: "0 0",
            CdgSIISucur: "81303347"*/
        }

        document = {
            response: ["TIMBRE","FOLIO","RESOLUCION","PDF"],
            dte: {
                Encabezado: {
                    IdDoc:{
                        TipoDTE: dteType,
                        Folio: 0,
                        FchEmis: moment.utc().format('YYYY-MM-DD'), //Fecha
                        FchVenc: moment().add(15,'days').utc().format('YYYY-MM-DD'),
                        IndServicio: "2", //1=Servicios periódicos, 2=Serv. periódicos domiciliarios
                        PeriodoDesde: moment.utc(invoice.lectures.year + '-' + invoice.lectures.month + '-01').startOf('month').format('YYYY-MM-DD'), //Revisar fechas, si corresponde a la toma de estado (desde el 1 al 30 del mes)
                        PeriodoHasta: moment.utc(invoice.lectures.year + '-' + invoice.lectures.month + '-01').endOf('month').format('YYYY-MM-DD')
                    },
                    Emisor: Emisor,
                    Receptor: Receptor,
                    Totales:{
                        MntExe: invoice.invoiceSubTotal,
                        MntTotal: invoice.invoiceSubTotal,
                        VlrPagar: invoice.invoiceSubTotal
                    }
                },
                Detalle:[
                    {
                        NroLinDet: 1,
                        NmbItem: "Servicio de Agua",
                        QtyItem: 1,
                        PrcItem: invoice.invoiceSubTotal,
                        MontoItem: invoice.invoiceSubTotal,
                        IndExe: 1 //1=exento o afecto / 2=no facturable
                    }
                ],
                Referencia: [
                    {
                        NroLinRef: 1,
                        TpoDocRef: invoice.type.toString(),
                        FolioRef: invoice.number.toString(),
                        FchRef: moment.utc(invoice.date).format('YYYY-MM-DD'),
                        CodRef: "3"
                    }
                ]
            }
        }        

        var settings = {
            "url": "https://"+parameters.emisor.link+"/v2/dte/document",
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
                token: response.TOKEN,
                resolution: response.RESOLUCION
            }

            let setDTEInvoice = await axios.post('/api/invoiceUpdateDTEAnnulment', dteData)
            loadingHandler('stop')

            let pdfWindow = window.open("")
            pdfWindow.document.write("<iframe width='100%' height='100%' src='data:application/pdf;base64, " +encodeURI(response.PDF) + "'></iframe>")

            /*$('#modal_title').html(`Almacenado`)
            $('#modal_body').html(`<h7 class="alert-heading">Documento generado correctamente</h7>`)
            $('#modal').modal('show')*/
            toastr.success('Documento generado correctamente')
            loadLectures(member)
            
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
                <td style="text-align: center;">
                    <button class="btn btn-sm btn-info btnLecture" onclick="printVoucher('${member._id}','${payments[i]._id}')"><i class="fas fa-print" style="font-size: 14px;"></i></button>
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
                            <th style="text-align: center; background-color: #3B6FC9;">Editar</th>
                            <th style="text-align: center; background-color: #3B6FC9; border-top-right-radius: 5px;">Comprobante</th>
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
                                                    <th style="text-align: center">Consumo</th>
                                                    <th style="text-align: center">Convenios/Multas</th>
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
                                                <select id="paymentType" class="form-control form-control-sm form-select form-select-sm">
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
                                <button style="border-radius:5px;" class="btn btn-danger" id="paymentDelete"><i ="color:#3498db;" class="fas fa-times"></i> ELIMINAR</button></td>
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
        $("#paymentDelete").css("display","block")

        let invoicesPaymentData = await axios.post('/api/paymentSingle', { id: paymentID })
        let invoicesPayment = invoicesPaymentData.data

        $("#paymentDate").val(moment(invoicesPayment.date).utc().format('DD/MM/YYYY'))
        $("#paymentType").val(invoicesPayment.paymentMethod)
        $("#paymentNumber").val(invoicesPayment.transaction)
        //$("#paymentToPay").val('')
        $("#paymentAmount").val(invoicesPayment.amount)

        for(let i=0; i<invoicesPayment.invoices.length; i++){
            let agreements = 0
            if(invoicesPayment.invoices[i].invoices.agreements){
                for(let j=0; j<invoicesPayment.invoices[i].invoices.agreements.length; j++){
                    agreements += invoicesPayment.invoices[i].invoices.agreements[j].amount
                }
            }
            $("#tableBodyDebtInvoices").append(`<tr class="table-primary">
                <td style="text-align: center"><input class="checkInvoice" type="checkbox" checked/><input value="${invoicesPayment.invoices[i].invoices._id}" style="display: none;"/></td>
                <td style="text-align: center">${(invoicesPayment.invoices[i].invoices.number) ? invoicesPayment.invoices[i].invoices.number : ''}</td>
                <td style="text-align: center">${moment(invoicesPayment.invoices[i].invoices.date).utc().format('DD/MM/YYYY')}</td>
                <td style="text-align: center">${moment(invoicesPayment.invoices[i].invoices.dateExpire).utc().format('DD/MM/YYYY')}</td>
                <td style="text-align: right">${dot_separators(invoicesPayment.invoices[i].invoices.invoiceSubTotal + agreements)}</td>
                <td style="text-align: right">${dot_separators(agreements)}</td>
                <td style="text-align: right">${dot_separators(invoicesPayment.invoices[i].invoices.invoiceSubTotal + agreements)}</td>
                <td style="text-align: right">${dot_separators((invoicesPayment.invoices[i].invoices.invoiceSubTotal + agreements) - invoicesPayment.invoices[i].invoices.invoicePaid + invoicesPayment.invoices[i].amount)}
                    <input value="${(invoicesPayment.invoices[i].invoices.invoiceSubTotal + agreements) - invoicesPayment.invoices[i].invoices.invoicePaid + invoicesPayment.invoices[i].amount}" style="display: none;"/>
                </td>
                <td style="text-align: right">${dot_separators((invoicesPayment.invoices[i].invoices.invoiceSubTotal + agreements) - invoicesPayment.invoices[i].invoices.invoicePaid + invoicesPayment.invoices[i].amount)}</td>
            </tr>`)
        }


        //Carga de boletas adeudadas
        let invoicesDebtData = await axios.post('/api/invoicesDebt', { member: memberID, paymentID: paymentID})
        let invoicesDebt = invoicesDebtData.data
        
        if(invoicesDebt.length>0){
            for(let i=0; i<invoicesDebt.length; i++){
                let agreements = 0
                if(invoicesDebt[i].agreements){
                    for(let j=0; j<invoicesDebt[i].agreements.length; j++){
                        agreements += invoicesDebt[i].agreements[j].amount
                    }
                }
                $("#tableBodyDebtInvoices").append(`<tr>
                    <td style="text-align: center"><input class="checkInvoice" type="checkbox" /><input value="${invoicesDebt[i]._id}" style="display: none;"/></td>
                    <td style="text-align: center">${(invoicesDebt[i].number) ? invoicesDebt[i].number : ''}</td>
                    <td style="text-align: center">${moment(invoicesDebt[i].date).utc().format('DD/MM/YYYY')}</td>
                    <td style="text-align: center">${moment(invoicesDebt[i].dateExpire).utc().format('DD/MM/YYYY')}</td>
                    <td style="text-align: right">${dot_separators(invoicesDebt[i].invoiceSubTotal + agreements)}</td>
                    <td style="text-align: right">${dot_separators(agreements)}</td>
                    <td style="text-align: right">${dot_separators(invoicesDebt[i].invoiceSubTotal + agreements)}</td>
                    <td style="text-align: right">${dot_separators((invoicesDebt[i].invoiceSubTotal + agreements) - invoicesDebt[i].invoicePaid)}
                        <input value="${(invoicesDebt[i].invoiceSubTotal + agreements) - invoicesDebt[i].invoicePaid}" style="display: none;"/>
                    </td>
                    <td style="text-align: right">${dot_separators((invoicesDebt[i].invoiceSubTotal + agreements) - invoicesDebt[i].invoicePaid)}</td>
                </tr>`)
            }
        }

    }else{
        
        $("#paymentDelete").css("display","none")
        //Carga de boletas adeudadas
        let invoicesDebtData = await axios.post('/api/invoicesDebt', { member: memberID })
        let invoicesDebt = invoicesDebtData.data
        
        if(invoicesDebt.length>0){
            for(let i=0; i<invoicesDebt.length; i++){
                let agreements = 0
                if(invoicesDebt[i].agreements){
                    for(let j=0; j<invoicesDebt[i].agreements.length; j++){
                        agreements += invoicesDebt[i].agreements[j].amount
                    }
                }


                if(!invoicesDebt[i].typeInvoice){
                    $("#tableBodyDebtInvoices").append(`<tr>
                        <td style="text-align: center"><input class="checkInvoice" type="checkbox" /><input value="${invoicesDebt[i]._id}" style="display: none;"/></td>
                        <td style="text-align: center">${(invoicesDebt[i].number) ? invoicesDebt[i].number : ''}</td>
                        <td style="text-align: center">${moment(invoicesDebt[i].date).utc().format('DD/MM/YYYY')}</td>
                        <td style="text-align: center">${moment(invoicesDebt[i].dateExpire).utc().format('DD/MM/YYYY')}</td>
                        <td style="text-align: right">${dot_separators(invoicesDebt[i].invoiceSubTotal)}</td>
                        <td style="text-align: right">${dot_separators(agreements)}</td>
                        <td style="text-align: right">${dot_separators(invoicesDebt[i].invoiceSubTotal + agreements)}</td>
                        <td style="text-align: right">${dot_separators((invoicesDebt[i].invoiceSubTotal + agreements) - invoicesDebt[i].invoicePaid)}
                            <input value="${(invoicesDebt[i].invoiceSubTotal + agreements) - invoicesDebt[i].invoicePaid}" style="display: none;"/>
                        </td>
                        <td style="text-align: right">${dot_separators(invoicesDebt[i].invoiceSubTotal - invoicesDebt[i].invoicePaid)}</td>
                    </tr>`)
                }else{

                    let paid = (invoicesDebt[i].invoicePaid) ? invoicesDebt[i].invoicePaid : 0

                    $("#tableBodyDebtInvoices").append(`<tr>
                        <td style="text-align: center"><input class="checkInvoice" type="checkbox" /><input value="${invoicesDebt[i]._id}" style="display: none;"/></td>
                        <td style="text-align: center">${(invoicesDebt[i].number) ? invoicesDebt[i].number : '' }</td>
                        <td style="text-align: center">${moment(invoicesDebt[i].date).utc().format('DD/MM/YYYY')}</td>
                        <td style="text-align: center">${moment(invoicesDebt[i].dateExpire).utc().format('DD/MM/YYYY')}</td>
                        <td style="text-align: right">${dot_separators(invoicesDebt[i].invoiceTotal)}</td>
                        <td style="text-align: right">${dot_separators(agreements)}</td>
                        <td style="text-align: right">${dot_separators(invoicesDebt[i].invoiceTotal + agreements)}</td>
                        <td style="text-align: right">${dot_separators((invoicesDebt[i].invoiceTotal + agreements) - paid)}
                            <input value="${(invoicesDebt[i].invoiceTotal + agreements) - paid}" style="display: none;"/>
                        </td>
                        <td style="text-align: right">${dot_separators((invoicesDebt[i].invoiceTotal + agreements) - paid)}</td>
                    </tr>`)
                }
            }
        }else{
            //$('#modal_title').html(`Al día`)
            //$('#modal_body').html(`<h7 class="alert-heading">Socio no tiene deuda activa</h7>`)
            toastr.success('Socio no tiene deuda activa')
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
        calculatePaymentBalance(true)
    })


    calculatePaymentBalance()

    $('#paymentSave').off("click")

    $("#paymentSave").on('click', async function () {

        let goSave = false
        let invoices = []
        let amountInvoi0

        if($("#tableBodyDebtInvoices > tr").length>0){
            $("#tableBodyDebtInvoices > tr").each(function() {
                if($($($(this).children()[0]).children()[0]).prop('checked')){
                    goSave = true

                    let invoiceAmount = parseInt($($($(this).children()[7]).children()[0]).val()) - parseInt(replaceAll($($(this).children()[8]).text(), '.',''))
                    amountInvoices += invoiceAmount
                    invoices.push({
                        invoices: $($($(this).children()[0]).children()[1]).val(),
                        amount: invoiceAmount
                    })
                }
            })    
        }

        if(!goSave){
            toastr.warning('Debe seleccionar al menos 1 boleta a cancelar')
            return
        }

        let toPay = parseInt(replaceAll($("#paymentToPay").val(), '.', '').replace(' ', '').replace('$', ''))
        let amount = parseInt(replaceAll($("#paymentAmount").val(), '.', '').replace(' ', '').replace('$', ''))

        if(!$.isNumeric(amount)){
            toastr.warning('Monto no válido')
            return
        }

        if(amount<=0){
            toastr.warning('Monto no válido')
            return
        }

        if($("#paymentType").val()=='SELECCIONE'){
            toastr.warning('Debe seleccionar medio de pago')
            return
        }

        let goToSave = false

        if(amount>toPay){
            //toastr.warning('El monto a pagar no puede ser mayor al saldo')
            //return
            let savePaymentMessage = await Swal.fire({
                title: 'Monto mayor',
                customClass: 'swal-wide',
                html: `El monto a pagar es mayor al adeudado, <br/>¿Desea que se guarde el valor restante como saldo a favor?`,
                showCloseButton: true,
                showCancelButton: true,
                showConfirmButton: true,
                focusConfirm: false,
                confirmButtonText: 'Aceptar',
                cancelButtonText: 'Cancelar'
            })
        
            if (savePaymentMessage.value) {
                goToSave = true
                invoices.push({
                    amount: amountInvoices,
                    positiveBalance: true
                })
            }
        }
        
        if(goToSave==true){
            let paymentData = {
                member: member._id,
                //number: replaceAll($("#invoiceNumber").val(), '.', '').replace(' ', ''),
                date: $("#paymentDate").data('daterangepicker').startDate.format('YYYY-MM-DD'),
                paymentMethod: $("#paymentType").val(),
                transaction: $("#paymentNumber").val(),
                amount: amount,
                invoices: invoices
            }

            let urlSave = 'paymentSave'
            if(paymentID){
                urlSave = 'paymentUpdate'
                paymentData.id = paymentID
            }
            console.log('paymentData',paymentData)
            let savePayment = await axios.post('/api/'+urlSave, paymentData)
            if (savePayment.data) {
                if (savePayment.data._id) {

                    toastr.success('Pago almacenado correctamente')
                    loadPayments(member)
                    cleanPayment()
                } else {
                    toastr.error('Error al almacenar, favor reintente')
                }
            } else {
                toastr.error('Error al almacenar, favor reintente')
            }
        }
    })

    $("#paymentDelete").on('click', async function () {
        let deletePaymentMessage = await Swal.fire({
            title: '¿Está seguro de eliminar este registro?',
            customClass: 'swal-wide',
            html: ``,
            showCloseButton: true,
            showCancelButton: true,
            showConfirmButton: true,
            focusConfirm: false,
            confirmButtonText: 'Aceptar',
            cancelButtonText: 'Cancelar'
        })
    
        if (deletePaymentMessage.value) {
            let paymentData = {
                id: paymentID
            }

            let deletePayment = await axios.post('/api/paymentDelete', paymentData)
            if (deletePayment.data) {
                //$('#modal_title').html(`Eliminado`)
                //$('#modal_body').html(`<h7 class="alert-heading">Registro eliminado</h7>`)
                toastr.success('Registro eliminado')
                cleanPayment()
                loadPayments(member)
            } else {
                //$('#modal_title').html(`Error`)
                //$('#modal_body').html(`<h7 class="alert-heading">Error al eliminar, favor reintente</h7>`)
                toastr.error('Error al eliminar, favor reintente')
            }

            //$('#modal').modal('show')
        }
    })
}

function calculatePaymentBalance(paymentAmount) {

    let totalSelected = 0
    $("#tableBodyDebtInvoices > tr").each(function() {
        let value = 0
        if($($($(this).children()[0]).children()[0]).prop('checked')){
            value = $($($(this).children()[7]).children()[0]).val()
        }
        totalSelected += parseInt(value)

        $($(this).children()[8]).text(dot_separators($($($(this).children()[7]).children()[0]).val()))
    })
    
    $("#paymentToPay").val(dot_separators(totalSelected))
    if(!paymentAmount){
        $("#paymentAmount").val(dot_separators(totalSelected))
    }
    let amount = parseInt(replaceAll($("#paymentAmount").val(), '.', '').replace(' ', '').replace('$', ''))

    if($.isNumeric(amount)){
        $("#tableBodyDebtInvoices > tr").each(function() {
            let value = 0
            if($($($(this).children()[0]).children()[0]).prop('checked')){
                value = parseInt($($($(this).children()[7]).children()[0]).val())

                if(value<=amount){
                    $($(this).children()[8]).text(0)
                    amount -= value
                }else if(amount!=0){
                    $($(this).children()[8]).text(dot_separators(value-amount))
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

}