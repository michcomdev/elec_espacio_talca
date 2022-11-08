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

    loadLectures(member)

})


async function loadLectures(member) {

    let lectureData = await axios.post('/api/lecturesSingleMember', { member: internals.dataRowSelected._id })
    let lectures = lectureData.data

    $('#tableLecturesBody').html('')

    for (i = 0; i < lectures.length; i++) {

        let subtotal = 0, total = 0
        let btn = '', btnGenerate = '', btnSII = '', btnPayment = '', btnAnnulment = '', btnAnnulmentHistory = ''
        let invoiceID = 0
        if (lectures[i].invoice) {
            subtotal = dot_separators(lectures[i].invoice.invoiceSubTotal)
            total = dot_separators(lectures[i].invoice.invoiceTotal)
            btn = `<button class="btn btn-sm btn-info btnLecture" onclick="printInvoice('preview','${member.type}','${member._id}','${lectures[i].invoice._id}')"><i class="far fa-eye" style="font-size: 14px;"></i></button>`
            //btn = `<button class="btn btn-sm btn-info btnLecture" onclick="printAnnulment('preview','${member.type}','${member._id}','${lectures[i].invoice._id}')"><i class="far fa-eye" style="font-size: 14px;"></i></button>`
            invoiceID = lectures[i].invoice._id
            
            if(lectures[i].invoice.number){
                btnGenerate = `<button class="btn btn-sm btn-danger btnLecture" onclick="printInvoice('pdf','${member.type}','${member._id}','${lectures[i].invoice._id}')"><i class="far fa-file-pdf" style="font-size: 14px;"></i></button>`
                btnPayment = `<button class="btn btn-sm btn-info btnLecture" onclick="payInvoice('pdf','${member.type}','${member._id}','${lectures[i].invoice._id}')"><i class="fas fa-dollar-sign" style="font-size: 14px;"></i></button>`
                btnAnnulment = `<button class="btn btn-sm btn-info btnLecture" onclick="annulmentInvoice('${member.type}','${member._id}','${lectures[i].invoice._id}')">Anular Boleta</button>`
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
                    ${btnSII}
                </td>
                <td style="text-align: center;">
                    ${btnPayment}
                </td>
                <td style="text-align: center;">
                    POR PAGAR
                </td>
                <td style="text-align: center;">
                    ${btnAnnulment}
                </td>
                <td style="text-align: center;">
                    ${btnAnnulmentHistory}
                </td>
            </tr>
        `)
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
                    <th style="text-align: center; background-color: #3B6FC9;">Ver Boleta/Factura</th>
                    <th style="text-align: center; background-color: #3B6FC9;">DTE SII</th>
                    <th style="text-align: center; background-color: #3B6FC9;">Pago</th>
                    <th style="text-align: center; background-color: #3B6FC9;">Estado Pago</th>
                    <th style="text-align: center; background-color: #3B6FC9;">Anular</th>
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
                                Cargo Fijo
                            </div>
                            <div class="col-md-1" style="text-align: center">(+)</div>
                            <div class="col-md-3">
                                <input id="invoiceCharge" type="text" class="form-control form-control-sm border-input numericValues money">
                            </div>

                            <div class="col-md-8">
                                Consumo
                            </div>
                            <div class="col-md-1" style="text-align: center">(+)</div>
                            <div class="col-md-3">
                                <input id="invoiceConsumption2b" type="text" class="form-control form-control-sm border-input numericValues money" style="background-color: #B7EBD8">
                            </div>

                            <div class="col-md-8">
                                Convenios
                            </div>
                            <div class="col-md-1" style="text-align: center">(+)</div>
                            <div class="col-md-3">
                                <input id="invoiceTotalAgreementsb" type="text" class="form-control form-control-sm border-input numericValues money" style="background-color: #FAE3C2">
                            </div>

                            <div class="col-md-8">
                                SubTotal (a generar en boleta SII)
                            </div>
                            <div class="col-md-1" style="text-align: center">(=)</div>
                            <div class="col-md-3">
                                <input id="invoiceSubTotal" type="text" class="form-control form-control-sm border-input numericValues money" style="background-color: #B6D8FF">
                            </div>

                            <div class="col-md-8">
                                Saldo Anterior
                            </div>
                            <div class="col-md-1" style="text-align: center">(+)</div>
                            <div class="col-md-3">
                                <input id="invoiceDebt" type="text" class="form-control form-control-sm border-input numericValues money">
                            </div>

                            <div class="col-md-8">
                                Total
                            </div>
                            <div class="col-md-1" style="text-align: center">(=)</div>
                            <div class="col-md-3">
                                <input id="invoiceTotal" type="text" class="form-control form-control-sm border-input numericValues money">
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
        $("#tableAnnulmentsBody").append(`
            <tr>
                <td>${invoices.data[i].number}</td>
                <td>${moment(invoices.data[i].date).utc().format('DD/MM/YYYY')}</td>
                <td><button class="btn btn-sm btn-danger btnLecture" onclick="printInvoice('pdf','${type}','${memberID}','${invoices.data[i]._id}')"><i class="far fa-file-pdf" style="font-size: 14px;"></i></button></td>
                <td>${invoices.data[i].annulment.number}</td>
                <td>${moment(invoices.data[i].annulment.date).utc().format('DD/MM/YYYY')}</td>
                <td><button class="btn btn-sm btn-danger btnLecture" onclick="showSIIPDF('${invoices.data[i].annulment.token}')"><i class="far fa-file-pdf" style="font-size: 14px;"></i></button></td>
            </tr>
        `)
        
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

function calculateTotal() {
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
    $("#invoiceConsumptionLimitOver").val(0)
    let consumptionLimit = $("#invoiceConsumptionLimit").val()
    let consumptionLimitValue = $("#invoiceConsumptionLimitValue").val()
    let consumptionLimitTotal = 0 //Valor a pagar por sobreconsumo
    if(lectureValue>consumptionLimit){
        consumptionLimitTotal = (lectureValue - consumptionLimit) * consumptionLimitValue
        $("#invoiceConsumptionLimitOver").val(lectureValue - consumptionLimit)
    }
    $("#invoiceConsumptionLimitTotal").val(consumptionLimitTotal)

    let sewerage = parseInt($("#invoiceSewerage").val())

    let lastConsumptionValue = consumptionValue - subsidyValue + consumptionLimitTotal + sewerage
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
    let subTotal = parseInt(parameters.charge) + parseInt(lastConsumptionValue)
    $("#invoiceSubTotal").val(subTotal)
    $("#invoiceDebt").val(debt)
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

async function createInvoice(lectureID, invoiceID, memberID) {

    $('#tableLecturesBody > tr').removeClass('table-primary')
    $("#"+lectureID).addClass('table-primary')
    $('#divInvoice').css('display', 'block')
    $('.btnLecture').attr('disabled',true)

    let memberData = await axios.post('/api/memberSingle', {id: memberID})
    let member = memberData.data
    
    if (invoiceID == 0) {

        let lectureData = await axios.post('/api/lectureSingle', { id: lectureID })
        let lecture = lectureData.data

        $("#invoiceTitle").text("Nueva Boleta/Factura")
        //$("#invoiceNumber").val('')
        if(member.dte=='BOLETA'){
            $("#invoiceType").val(41)
        }else if(member.dte=='FACTURA'){
            $("#invoiceType").val(34)
        }
        $("#invoiceDate").val(moment.utc().format('DD/MM/YYYY'))

        let year = lecture.year
        let month = lecture.month+1
        let day = parameters.expireDay
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
            $('#modal_title').html(`Almacenado`)
            $('#modal_body').html(`<h7 class="alert-heading">Las fechas podrían estar erróneas, favor revisar</h7>`)
            $('#modal').modal('show')
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
        $("#invoiceMeterValue").val(parameters.meterValue)

        $("#invoiceConsumptionLimitLabel").text(parameters.consumptionLimit)
        $("#invoiceConsumptionLimit").val(parameters.consumptionLimit)
        $("#invoiceConsumptionLimitValue").val(parameters.consumptionLimitValue)

        $('.invoiceDateClass').daterangepicker({
            opens: 'right',
            locale: dateRangePickerDefaultLocale,
            singleDatePicker: true,
            autoApply: true
        })

        //Servicios
        if (member.services) {
            if (member.services.length > 0) {
                for(let i=0; i<member.services.length; i++){
                    if(member.services[i].services.type=='ALCANTARILLADO'){
                        $("#invoiceSewerage").val((member.services[i].value!=0) ? member.services[i].value : member.services[i].services.value)
                    }
                }
            }
        }

        let agreementData = await axios.post('/api/agreementsByDate', { 
            year: parseInt(year),
            month: parseInt(month),
            member: memberID
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
                consumption: replaceAll($("#invoiceConsumption2").val(), '.', '').replace(' ', '').replace('$', ''),
                sewerage: replaceAll($("#invoiceSewerage").val(), '.', '').replace(' ', '').replace('$', ''),
                invoiceSubTotal: replaceAll($("#invoiceSubTotal").val(), '.', '').replace(' ', '').replace('$', ''),
                invoiceDebt: replaceAll($("#invoiceDebt").val(), '.', '').replace(' ', '').replace('$', ''),
                invoiceTotal: replaceAll($("#invoiceTotal").val(), '.', '').replace(' ', '').replace('$', ''),
                services: services,
                agreements: agreements
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

                        $('#modal_title').html(`Almacenado`)
                        $('#modal_body').html(`<h7 class="alert-heading">Boleta almacenada correctamente</h7>`)
                        cleanInvoice()
                        loadLectures(member)
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
        }

        $("#invoiceDebt").val(invoice.invoiceDebt)
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
        console.log(agreements)

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
                consumption: replaceAll($("#invoiceConsumption2").val(), '.', '').replace(' ', '').replace('$', ''),
                sewerage: replaceAll($("#invoiceSewerage").val(), '.', '').replace(' ', '').replace('$', ''),
                invoiceSubTotal: replaceAll($("#invoiceSubTotal").val(), '.', '').replace(' ', '').replace('$', ''),
                invoiceDebt: replaceAll($("#invoiceDebt").val(), '.', '').replace(' ', '').replace('$', ''),
                invoiceTotal: replaceAll($("#invoiceTotal").val(), '.', '').replace(' ', '').replace('$', ''),
                services: services,
                agreements: agreements
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

                        $('#modal_title').html(`Almacenado`)
                        $('#modal_body').html(`<h7 class="alert-heading">Boleta almacenada correctamente</h7>`)
                        cleanInvoice()
                        loadLectures(member)
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

async function printInvoice(docType,type,memberID,invoiceID) {
    loadingHandler('start')
    
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
    
    let lastInvoice, flagLastInvoice = 0
    for (let k = 0; k < lectures.length; k++) {
        if(flagLastInvoice==1){
            if (lectures[k].invoice !== undefined) {
                lastInvoice = lectures[k].invoice
                k = lectures.length
            }
        }else{
            if (lectures[k]._id == invoice.lectures._id) {
                flagLastInvoice++
            }
        }
    }

    doc.text('Lectura Mes Actual ' + moment(invoice.date).utc().format('DD/MM/YYYY'), pdfX, pdfY + 20)
    doc.text('Lectura Mes Anterior ' + ((lastInvoice) ? moment(lastInvoice.date).utc().format('DD/MM/YYYY') : ''), pdfX, pdfY + 33)
    pdfYLectureNew = 0
    if(invoice.lectureNewStart!==undefined){
        doc.text('Lectura Medidor Nuevo Inicial ', pdfX, pdfY + 46)
        doc.text('Lectura Medidor Nuevo Final ', pdfX, pdfY + 59)
        pdfYLectureNew = 26
    }
    doc.setFontType('bold')
    doc.text('Consumo Calculado', pdfX, pdfY + 46 + pdfYLectureNew)
    doc.setFontType('normal')

    doc.text('Límite Sobreconsumo (m3)', pdfX, pdfY + 98)
    doc.text('Sobreconsumo (m3)', pdfX, pdfY + 111)
    doc.setFontType('bold')
    doc.text('Consumo Facturado', pdfX, pdfY + 124)


    doc.setFontSize(10)
    doc.setFontType('normal')

    doc.text(dot_separators(invoice.lectureActual), pdfX + 250, pdfY + 20, 'right')
    doc.text(dot_separators(invoice.lectureLast), pdfX + 250, pdfY + 33, 'right')

    if(invoice.lectureNewStart!==undefined){
        doc.text(dot_separators(invoice.lectureNewStart), pdfX + 250, pdfY + 46, 'right')
        doc.text(dot_separators(invoice.lectureNewEnd), pdfX + 250, pdfY + 59, 'right')
    }
    doc.setFontType('bold')
    doc.text(dot_separators(invoice.lectureResult), pdfX + 250, pdfY + 46 + pdfYLectureNew, 'right')
    doc.setFontType('normal')
    
    doc.text(dot_separators(parameters.consumptionLimit), pdfX + 250, pdfY + 98, 'right')
    if(invoice.lectureResult>parameters.consumptionLimit){
        doc.text(dot_separators(invoice.lectureResult-parameters.consumptionLimit), pdfX + 250, pdfY + 111, 'right')
    }else{
        doc.text("0", pdfX + 250, pdfY + 111, 'right')
    }
    doc.setFontType('bold')
    doc.text(dot_separators(invoice.lectureResult), pdfX + 250, pdfY + 124, 'right') //Consultar diferencia facturado vs calculado



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
    /*if(invoice.services){
        for(let i=0; i<invoice.services.length; i++){
            if(invoice.services[i].services.type=='ALCANTARILLADO'){
                doc.text('Alcantarillado', pdfX, pdfY + index)
            }else{
                doc.text(invoice.services[i].services.name, pdfX, pdfY + index)
            }
            index += 13
        }
    }*/
    if(invoice.sewerage){
        doc.text('Alcantarillado', pdfX, pdfY + index)
        index += 13
    }

    if(invoice.agreements){
        let totalAgreement = 0
        for(let i=0; i<invoice.agreements.length; i++){
            totalAgreement += parseInt(invoice.agreements[i].amount)
            if(i+1==invoice.agreements.length && totalAgreement > 0){
                doc.text('Otros', pdfX, pdfY + index)
                index += 13
            }
        }
    }

    doc.setFontType('bold')
    doc.text('SubTotal', pdfX, pdfY + index)
    doc.setFontType('normal')
    doc.text('Saldo Anterior', pdfX, pdfY + index + 13)
    doc.setFontType('bold')
    doc.text('Monto Total', pdfX, pdfY + index + 39)


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
    /*if(invoice.services){
        for(let i=0; i<invoice.services.length; i++){
            doc.text(dot_separators(invoice.services[i].value), pdfX + 250, pdfY + index, 'right')
            index += 13
        }
    }*/
    if(invoice.sewerage){
        doc.text(dot_separators(invoice.sewerage), pdfX + 250, pdfY + index, 'right')
        index += 13
    }

    let totalAgreement = 0
    if(invoice.agreements){
        for(let i=0; i<invoice.agreements.length; i++){
            totalAgreement += parseInt(invoice.agreements[i].amount)
            if(i+1==invoice.agreements.length && totalAgreement > 0){
                doc.text(dot_separators(totalAgreement), pdfX + 250, pdfY + index, 'right')
                index += 13
            }
        }
    }

    doc.setFontType('bold')
    doc.text(dot_separators(parseInt(invoice.invoiceSubTotal) + parseInt(totalAgreement)), pdfX + 250, pdfY + index, 'right')
    doc.setFontType('normal')
    doc.text(dot_separators(invoice.invoiceDebt), pdfX + 250, pdfY + index + 13, 'right')
    doc.setFontType('bold')
    doc.text(dot_separators(invoice.invoiceTotal), pdfX + 250, pdfY + index + 39, 'right')


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
            flag++

            if (lectures[j].invoice !== undefined) {
                lastInvoices.push(lectures[j].invoice)
                if (lectures[j].invoice.lectureResult > maxValue) {
                    maxValue = lectures[j].invoice.lectureResult
                }
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
        pdfY -= 5
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

    loadingHandler('stop')
}

async function printAnnulment(docType,type,memberID,invoiceID) {
    loadingHandler('start')
    
    let memberData = await axios.post('/api/memberSingle', {id: memberID})
    let member = memberData.data

    let invoiceData = await axios.post('/api/invoiceSingle', { id: invoiceID })
    let invoice = invoiceData.data

    let lecturesData = await axios.post('/api/lecturesSingleMember', { member: memberID })
    let lectures = lecturesData.data

    let parametersData = await axios.get('/api/parameters')
    let parameters = parametersData.data


    let docName1 = 'NOTA DE CRÉDITO', docName2 = 'ELECTRÓNICA', memberName = ''
    if (type == 'personal') {
        memberName = member.personal.name + ' ' + member.personal.lastname1 + ' ' + member.personal.lastname2
    } else {
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
    //doc.text('N° ' + invoice.annulment.number, pdfX + 310, pdfY + 50, 'center')
    doc.text('N° 11', pdfX + 310, pdfY + 50, 'center') //NÚMERO TEST!!!

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
    doc.rect(pdfX - 3, pdfY - 10, doc.internal.pageSize.getWidth() - 57, 14, 'F')

    doc.setFontSize(9)
    doc.setFontType('bold')
    doc.setTextColor(255, 255, 255)
    doc.text('DETALLE', pdfX, pdfY)


    doc.setFontSize(10)
    doc.setFontType('normal')
    doc.setTextColor(0, 0, 0)


    doc.text('Servicio de Agua', pdfX, pdfY + 25)

    pdfX += 300
    doc.text(dot_separators(invoice.invoiceSubTotal), pdfX + 250, pdfY + 25, 'right')
    

    //////TOTALES Y CÓDIGO SII//////
    pdfY += 50
    doc.setFontSize(12)
    doc.setFontType('bold')

    doc.setFillColor(23, 162, 184)
    doc.rect(pdfX - 3, pdfY + 137, 260, 18, 'F')
    doc.setTextColor(255, 255, 255)
    doc.text('TOTAL', pdfX, pdfY + 150)
    doc.text('$ ' + dot_separators(invoice.invoiceTotal), pdfX + 250, pdfY + 150, 'right')


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


    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(1)
    doc.line(pdfX, pdfY - 10, pdfX + 201, pdfY - 10)//Línea Superior
    doc.line(pdfX, pdfY + 60, pdfX + 201, pdfY + 60)//Línea Inferior
    doc.line(pdfX, pdfY - 10, pdfX, pdfY + 60)//Línea Izquierda
    doc.line(pdfX + 201, pdfY - 10, pdfX + 201, pdfY + 60)//Línea Derecha

    let docName3 = 'Factura'
    if(invoice.type==41){
        docName3 = 'Boleta'
    }
    doc.text(`Observaciones:`, pdfX + 5, pdfY)
    doc.setFontType('normal')
    doc.text(`Anulación de ${docName3} N° ${invoice.number}`, pdfX + 5, pdfY + 20)

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

    loadingHandler('stop')
}

async function printVoucher(memberID,paymentID) {
    loadingHandler('start')
    
    let memberData = await axios.post('/api/memberSingle', {id: memberID})
    let member = memberData.data

    let paymentData = await axios.post('/api/paymentSingle', { id: paymentID })
    let payment = paymentData.data
    
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
    doc.text(`COMPROBANTE DE PAGO`, pdfX, pdfY + 23)
    doc.setFontSize(10)
    doc.setFontType('normal')
    doc.setTextColor(143, 143, 143)
    doc.text(`Código Interno N° ${payment._id}`, pdfX, pdfY + 38)

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
    doc.text('Medio de Pago: ' + payment.paymentMethod,  + 300, pdfY + 15)
    doc.text('N° Transacción: ' + payment.transaction,  + 300, pdfY + 28)
    doc.text('Fecha Pago: ' + moment(payment.date).utc().format('DD / MM / YYYY'),  + 300, pdfY + 41)

    pdfY += 60

    doc.setFillColor(26, 117, 187)
    doc.rect(pdfX - 3, pdfY, doc.internal.pageSize.getWidth() - 57, 14, 'F')
    doc.setFontSize(9)
    doc.setFontType('bold')
    doc.setTextColor(255, 255, 255)
    doc.text('DETALLE', pdfX, pdfY + 10)
    doc.text('SUBTOTAL', pdfX + 300, pdfY + 10)
    doc.text('VALOR PAGADO', doc.internal.pageSize.getWidth() - 40, pdfY + 10, 'right')

    pdfY += 18
    doc.setFontType('normal')
    doc.setTextColor(0, 0, 0)
    for(let i=0; i<payment.invoices.length; i++){
        pdfY += 13
        if(payment.invoices[i].invoices.type==41){
            doc.text(`Boleta N° ${payment.invoices[i].invoices.number} - Mes ...`, pdfX, pdfY)
        }else{
            doc.text(`Factura N° ${payment.invoices[i].invoices.number} - Mes ...`, pdfX, pdfY)
        }
        doc.text('$ ' + dot_separators(payment.invoices[i].invoices.invoiceSubTotal), pdfX + 300, pdfY)
        doc.text('$ ' + dot_separators(payment.invoices[i].amount), doc.internal.pageSize.getWidth() - 40, pdfY, 'right')

    }

    pdfY = 300
    
    doc.setFillColor(0, 0, 0)
    doc.rect(pdfX + 345, pdfY, 200, 15, 'F')

    doc.setFontType('bold')
    doc.setFontSize(10)
    doc.setTextColor(255, 255, 255)
    doc.text(`Total Pagado`, pdfX + 350, pdfY + 11)
    doc.text('$ ' + dot_separators(payment.amount), doc.internal.pageSize.getWidth() - 40, pdfY + 11, 'right')


/*
    //////////////TABLA CONSUMOS//////////////
    doc.setFillColor(26, 117, 187)
    doc.rect(pdfX - 3, pdfY - 10, doc.internal.pageSize.getWidth() - 57, 14, 'F')

    doc.setFontSize(9)
    doc.setFontType('bold')
    doc.setTextColor(255, 255, 255)
    doc.text('DETALLE', pdfX, pdfY)


    doc.setFontSize(10)
    doc.setFontType('normal')
    doc.setTextColor(0, 0, 0)


    doc.text('Servicio de Agua', pdfX, pdfY + 25)

    pdfX += 300
    doc.text(dot_separators(invoice.invoiceSubTotal), pdfX + 250, pdfY + 25, 'right')
    

    //////TOTALES Y CÓDIGO SII//////
    pdfY += 50
    doc.setFontSize(12)
    doc.setFontType('bold')

    doc.setFillColor(23, 162, 184)
    doc.rect(pdfX - 3, pdfY + 137, 260, 18, 'F')
    doc.setTextColor(255, 255, 255)
    doc.text('TOTAL', pdfX, pdfY + 150)
    doc.text('$ ' + dot_separators(invoice.invoiceTotal), pdfX + 250, pdfY + 150, 'right')


    doc.setFontSize(8)
    doc.setFontType('normal')
    doc.setTextColor(0, 0, 0)
    let net = parseInt(invoice.invoiceTotal / 1.19)
    let iva = invoice.invoiceTotal - net


    ///////GRÁFICO CONSUMOS///////

    pdfX = 30
    pdfY += 150
    doc.setFontSize(9)
    doc.setFontType('bold')
    doc.setTextColor(0, 0, 0)


    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(1)
    doc.line(pdfX, pdfY - 10, pdfX + 201, pdfY - 10)//Línea Superior
    doc.line(pdfX, pdfY + 60, pdfX + 201, pdfY + 60)//Línea Inferior
    doc.line(pdfX, pdfY - 10, pdfX, pdfY + 60)//Línea Izquierda
    doc.line(pdfX + 201, pdfY - 10, pdfX + 201, pdfY + 60)//Línea Derecha

    let docName3 = 'Factura'
    if(invoice.type==41){
        docName3 = 'Boleta'
    }
    doc.text(`Observaciones:`, pdfX + 5, pdfY)
    doc.setFontType('normal')
    doc.text(`Anulación de ${docName3} N° ${invoice.number}`, pdfX + 5, pdfY + 20)

    pdfX = 30
    doc.setFillColor(26, 117, 187)
    doc.rect(pdfX - 3, doc.internal.pageSize.getHeight() - 60, doc.internal.pageSize.getWidth() - 57, 17, 'F')

    doc.setFontSize(10)
    doc.setFontType('bold')
    doc.setTextColor(255, 255, 255)
    doc.text('N° Teléfono oficina Comité: ' + parameters.phone + ' - Correo electrónico:  ' + parameters.email, pdfX, doc.internal.pageSize.getHeight() - 48)
*/
    //doc.autoPrint()
    window.open(doc.output('bloburl'), '_blank')
    //doc.save(`Nota de venta ${internals.newSale.number}.pdf`)

    loadingHandler('stop')
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

        let lecturesData = await axios.post('/api/lecturesSingleMember', {member:  memberID})
        let lectures = lecturesData.data

        let parametersData = await axios.get('/api/parameters')
        let parameters = parametersData.data

        let name = '', category = ''
        let document = ''

        if(invoice.type==41){

            if(type=='personal'){
                name = member.personal.name+' '+member.personal.lastname1+' '+member.personal.lastname2
            }else{
                name = member.enterprise.fullName
            }

            let Emisor = { //EMISOR DE PRUEBA
                RUTEmisor: parameters.emisor.RUTEmisor,
                RznSocEmisor: parameters.emisor.RznSocEmisor,
                GiroEmisor: parameters.emisor.GiroEmisor,
                DirOrigen: parameters.emisor.DirOrigen,
                CmnaOrigen: parameters.emisor.CmnaOrigen,
                CdgSIISucur: parameters.emisor.CdgSIISucur
            }


            document = {
                response: ["TIMBRE","FOLIO","RESOLUCION"],
                dte: {
                    Encabezado: {
                        IdDoc:{
                            TipoDTE: invoice.type,
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
                    ]
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

            let Emisor = { //EMISOR DE PRUEBA
                RUTEmisor: parameters.emisor.RUTEmisor,
                RznSoc: parameters.emisor.RznSoc,
                GiroEmis: parameters.emisor.GiroEmis,
                Acteco: parameters.emisor.Acteco,
                DirOrigen: parameters.emisor.DirOrigen,
                CmnaOrigen: parameters.emisor.CmnaOrigen,
                Telefono: parameters.emisor.Telefono,
                CdgSIISucur: parameters.emisor.CdgSIISucur
            }

            document = {
                response: ["TIMBRE","FOLIO","RESOLUCION"],
                dte: {
                    Encabezado: {
                        IdDoc:{
                            TipoDTE: invoice.type,
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
                            MntExe: invoice.invoiceSubTotal,
                            MntTotal: invoice.invoiceSubTotal,
                            MontoPeriodo: invoice.invoiceSubTotal, //Consultar si se separa monto adeudado anterior
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
                    ]
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
                type: invoice.type,
                number: response.FOLIO,
                seal: response.TIMBRE,
                token: response.TOKEN,
                resolution: response.RESOLUCION
            }

            let setDTEInvoice = await axios.post('/api/invoiceUpdateDTE', dteData)
            loadingHandler('stop')

            $('#modal_title').html(`Almacenado`)
            $('#modal_body').html(`<h7 class="alert-heading">Documento generado correctamente</h7>`)
            $('#modal').modal('show')

            printInvoice('pdf',member.type,member._id,invoiceID)

            loadLectures(member)
            
        })
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
            RznSocEmisor: parameters.emisor.RznSocEmisor,
            GiroEmisor: parameters.emisor.GiroEmisor,
            DirOrigen: parameters.emisor.DirOrigen,
            CmnaOrigen: parameters.emisor.CmnaOrigen,
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
                        IndServicio: "3", //1=Servicios periódicos, 2=Serv. periódicos domiciliarios
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
                token: response.TOKEN,
                resolution: response.RESOLUCION
            }

            let setDTEInvoice = await axios.post('/api/invoiceUpdateDTEAnnulment', dteData)
            loadingHandler('stop')

            let pdfWindow = window.open("")
            pdfWindow.document.write("<iframe width='100%' height='100%' src='data:application/pdf;base64, " +encodeURI(response.PDF) + "'></iframe>")

            $('#modal_title').html(`Almacenado`)
            $('#modal_body').html(`<h7 class="alert-heading">Documento generado correctamente</h7>`)
            $('#modal').modal('show')

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

        for(let i=0; i<invoicesPayment.invoices.length; i++){
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
                    <td style="text-align: right">${dot_separators(invoicesDebt[i].invoiceSubTotal)}</td>
                    <td style="text-align: right">${dot_separators(invoicesDebt[i].invoiceSubTotal - invoicesDebt[i].invoicePaid)}
                        <input value="${invoicesDebt[i].invoiceSubTotal - invoicesDebt[i].invoicePaid}" style="display: none;"/>
                    </td>
                    <td style="text-align: right">${dot_separators(invoicesDebt[i].invoiceSubTotal - invoicesDebt[i].invoicePaid)}</td>
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
                    <td style="text-align: right">${dot_separators(invoicesDebt[i].invoiceSubTotal)}</td>
                    <td style="text-align: right">${dot_separators(invoicesDebt[i].invoiceSubTotal - invoicesDebt[i].invoicePaid)}
                        <input value="${invoicesDebt[i].invoiceSubTotal - invoicesDebt[i].invoicePaid}" style="display: none;"/>
                    </td>
                    <td style="text-align: right">${dot_separators(invoicesDebt[i].invoiceSubTotal - invoicesDebt[i].invoicePaid)}</td>
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
            if(!$.isNumeric($($($(this).children()[2]).children()[0]).val())){
                value = 0
            }else{
                value = $($($(this).children()[2]).children()[0]).val()
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