let internals = {
    members: {
        table: {},
        data: []
    },
    summary: {
        table: {},
        data: []
    },
    lectures: {
        table: {},
        data: []
    },
    invoices: [],
    dataRowSelected: {},
    productRowSelected: {}
}

let progressValue = 0
let progressTotal = 0

let clients = {}
let containerTypes = {}
let sites = {}
let cranes = {}

let parameters

$(document).ready(async function () {
    $('#paymentDate').daterangepicker({
        opens: 'right',
        locale: dateRangePickerDefaultLocale,
        singleDatePicker: true,
        autoApply: true
    })

    $("#paymentDate").val(moment.utc().format('DD/MM/YYYY'))
    getParameters()
    //printInvoice('pdf','personal','631b9a63638604718876683a','63b6ce1c8b9c515860d2229a')
    //printInvoicePortrait('pdf','personal','631b9a63638604718876683a','63b6ce1c8b9c515860d2229a')
    //loadSummaryTable()
    //getAllInvoices()
    
    //loadSummaryTable()
})

async function getParameters() {

    let firstYear = 2022
    for (let i = firstYear; i <= moment().format('YYYY'); i++) {
        $("#searchYear").append(`<option value="${i}">${i}</option>`)
    }
    
    let setYear = moment().format('YYYY')
    let setMonth = moment().format('MM')

    if(parseInt(moment().format('DD'))<20){
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
            acc += `<option value="${el._id}">${el.name}</option>`
            return acc
        },'')
    )

}

async function loadSummaryTable() {

    
    loadingHandler('start')

    let yearInvoice = parseInt($("#searchYear").val())
    
    let queryPayment = {
        year: yearInvoice,
        datePayment: $("#paymentDate").data('daterangepicker').startDate.format('YYYY-MM-DD')
    }
    
    let allInvoices = await axios.post('api/lecturesAllPaymentsConsumed', queryPayment)
    internals.summary = allInvoices

    console.log(allInvoices.data)
    
    $("#tableSummaryBody").html('')
    $("#tableSummaryExcelBody").html('')
    if ($.fn.DataTable.isDataTable('#tableMembers')) {
        internals.members.table.clear().destroy()
    }
    $("#tableMembersExcelBody").html('')

    let total1 = 0, total2 = 0, total3 = 0

    if (allInvoices.data.length > 0) {

        let formatData = allInvoices.data.filter(el => {
            
            $("#tableSummaryBody").append(`
                <tr class="trSummary">
                    <td>${getMonthString(el.month)}</td>
                    <td style="text-align: right;">${dot_separators(el.total)}</td>
                    <td style="text-align: right;">${dot_separators(el.paid)}</td>
                    <td style="text-align: right;">${dot_separators(el.balance)}</td>
                    <td style="text-align: center;">${`<button class="btn btn-sm btn-info" onclick="showInvoices(${el.month - 1}, this)"><i class="far fa-eye" style="font-size: 10px;"></i></button>`}</td>
                </tr>`)

            total1 += el.total
            total2 += el.paid
            total3 += el.balance

            $("#tableSummaryExcelBody").append(`
                <tr>
                    <td>${getMonthString(el.month)}</td>
                    <td>${el.total}</td>
                    <td>${el.paid}</td>
                    <td>${el.balance}</td>
                </tr>`)

            return el
        })

        loadingHandler('stop')
        $('#loadingMembers').empty()
    } else {
        loadingHandler('stop')
        //toastr.warning('No se han encontrado ventas en el rango seleccionado')
        $('#loadingMembers').empty()
    }

}


function showInvoices(month,btn) {

    $('.trSummary').removeClass('table-primary')
    $(btn).parent().parent().addClass('table-primary')

    try {
        if ($.fn.DataTable.isDataTable('#tableMembers')) {
            internals.members.table.clear().destroy()
        }
        internals.members.table = $('#tableMembers')
            .DataTable({
                dom: 'frtip',
                iDisplayLength: -1,
                oLanguage: {
                    sSearch: 'buscar:'
                },
                lengthMenu: [[50, 100, 500, -1], [50, 100, 500, 'Todos los registros']],
                language: {
                    url: spanishDataTableLang
                },
                responsive: true,
                columnDefs: [
                            { targets: [0, 1, 5], className: 'dt-center' },
                            { targets: [2, 3, 4], className: 'dt-right' }
                        ],
                order: [[1, 'asc']],
                ordering: true,
                rowCallback: function (row, data) {
                    //$(row).find('td:eq(1)').html(moment.utc(data.date).format('DD/MM/YYYY'))
                    //$(row).find('td:eq(5)').html(dot_separators(data.lastLecture))
                    // $('td', row).css('background-color', 'White');
                },
                columns: [
                    { data: 'date' },
                    { data: 'numberInvoice' },
                    { data: 'total' },
                    { data: 'paid' },
                    { data: 'balance' },
                    { data: 'originType' },
                    { data: 'status' }
                ],
                initComplete: function (settings, json) {
                    getAllInvoices(month)
                }
            })

    } catch (error) {
        console.log(error)
    }

}

async function getAllInvoices(month){
    loadingHandler('start')
    $("#tableMembersExcelBody").html('')

    let total1 = 0, total2 = 0, total3 = 0

    if (internals.summary.data[month].data.length > 0) {

        let formatData = internals.summary.data[month].data.filter(el => {
            let goRow = false
            console.log(el)
            if(el._id){

                let agreementsTotal = 0
                if(el.agreements){
                    for(let i=0; i < el.agreements.length; i++){
                        agreementsTotal += parseInt(el.agreements[i].amount)
                    }
                }
                
                let creditNote = '', status = 'VÁLIDA'
                if(el.annulment){
                    creditNote = el.annulment.number
                    status = 'ANULADA'
                }

                el.year = `${el.lectures.year}<div data-member-id="${el.members._id}" data-invoice-id="${el._id}" data-member-type="${el.members.type}"></div>`

                el.month = el.lectures.month
                el.type = (el.type) ? 'BOLETA' : 'COMPROBANTE'
                el.numberInvoice = (el.number) ? el.number : 0
                el.date = moment.utc(el.date).format('YYYY-MM-DD')
                el.numberMember = el.members.number
                el.name = el.name
                el.consumptionValueFull = dot_separators(el.invoiceSubTotal)
                el.others = dot_separators(agreementsTotal)
                el.total = dot_separators(el.invoiceSubTotal)// + agreementsTotal)//SE MOSTRARÁ SÓLO VALOR TRIBUTABLE
                console.log(el)
                if(el.balance>=el.paid){
                    if(el.paid==0){
                        el.paymentStatus = 'IMPAGO'
                    }else{
                        el.paymentStatus = 'PARCIAL'
                    }
                }else{
                    el.paymentStatus = 'PAGADO'
                }

                el.paid = dot_separators(el.paid)
                el.balance = dot_separators(el.balance)
                el.paymentStatus = ''

                
                el.status = status
                el.invoicePDF = `<button class="btn btn-sm btn-danger" onclick="printSelection('pdf','${el.members.type}','${el.members._id}','${el._id}')"><i class="far fa-file-pdf" style="font-size: 10px;"></i></button>`
                el.paymentPDF = ''
                el.numberAnnulment = creditNote
                el.annulmentPDF = ''

                if(el.payment){
                    el.paymentPDF = `<button class="btn btn-sm btn-primary" onclick="printVoucher('${el.members._id}','${el.paymentVoucher._id}')"><i class="far fa-file-pdf" style="font-size: 10px;"></i></button>`
                }
                if(el.annulment){
                    if(el.annulment.token){
                        el.annulmentPDF = `<button class="btn btn-sm btn-info" onclick="showSIIPDF('${el.annulment.token}')"><i class="far fa-file-pdf" style="font-size: 10px;"></i></button>`
                    }else{
                        el.annulmentPDF = `<button class="btn btn-sm btn-disabled"><i class="far fa-file-pdf" style="font-size: 10px;"></i></button>`
                    }
                }

                el.originType = 'CONSUMO'

                if($("#searchPaymentStatus").val()==0 || $("#searchPaymentStatus").val()==el.paymentStatus){
                    goRow = true
                }else if($("#searchPaymentStatus").val()=='PAGADO_PARCIAL' && (el.paymentStatus=='PAGADO' || el.paymentStatus=='PARCIAL')){
                        goRow = true
                }else if($("#searchPaymentStatus").val()=='IMPAGO_PARCIAL' && (el.paymentStatus=='IMPAGO' || el.paymentStatus=='PARCIAL')){
                        goRow = true
                }
            }else{
                el.originType = 'HAULMER'
                el.numberInvoice = el.number
                el.date = moment.utc(el.date).format('YYYY-MM-DD')
                el.total = dot_separators(el.total)
                el.paymentAmount = dot_separators(el.paymentAmount)
                el.balance = dot_separators(el.balance)
                goRow = true
            }

            if(goRow){

                total1 += parseInt(replaceAll(el.total.toString(), '.', ''))
                total2 += parseInt(replaceAll(el.paid.toString(), '.', ''))
                total3 += parseInt(replaceAll(el.balance.toString(), '.', ''))

                $("#tableMembersExcelBody").append(`
                    <tr>
                        <td>${moment.utc(el.date).add(1,'days').format('YYYY-MM-DD')}</td>
                        <td>${(el.numberInvoice) ? el.numberInvoice : 0}</td>
                        <td>${replaceAll(el.total.toString(), '.', '')}</td>
                        <td>${replaceAll(el.paid.toString(), '.', '')}</td>
                        <td>${replaceAll(el.balance.toString(), '.', '')}</td>
                        <td>${el.originType}</td>
                        <td>${el.status}</td>
                    </tr>`)

                return el
            }
        })

        $("#tableMembersExcelBody").append(`
            <tr>
                <th>TOTAL</th>
                <th></th>
                <th>${total1}</th>
                <th>${total2}</th>
                <th>${total3}</th>
                <th></th>
            </tr>`)

        internals.members.table.rows.add(formatData).draw()

        $('.aPopover').click(function($e) { //Previene que el <a> se mueva al inicio del scroll
            $e.preventDefault()
        })
        
        $('[data-toggle="popover"]').popover({
            html: true,
            trigger: 'focus'
        })


        loadingHandler('stop')
        $('#loadingMembers').empty()
    } else {
        loadingHandler('stop')
        //toastr.warning('No se han encontrado ventas en el rango seleccionado')
        $('#loadingMembers').empty()
    }

}

$('#searchMembers').on('click', async function () {
    loadSummaryTable()
})

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
            
            </div>
        </div>
    </div>
<div class="row">
    <div class="col-md-12">
        <div class="row">
            <div class="col-md-2">
            </div>
            <div class="col-md-8">
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
                                        <b>Convenios (Otros)</b>
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
                                        <input id="invoiceDebtFine" type="text" class="form-control form-control-sm border-input numericValues money">
                                    </div>
                                    <div class="col-md-8">
                                        SubTotal (a generar en boleta SII)
                                    </div>
                                    <div class="col-md-1" style="text-align: center">(=)</div>
                                    <div class="col-md-3">
                                        <input id="invoiceSubTotal" type="text" class="form-control form-control-sm border-input numericValues money" style="background-color: #B6D8FF">
                                    </div>

                                    <div class="col-md-8">
                                        Convenios (Otros)
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
    $("#tableBodyServices").html('')
    $('.btnLecture').removeAttr('disabled')
    
    $("#lecturesModal").modal('hide')
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
    let sewerage = parseInt($("#invoiceSewerage").val())

    let subsidy = $("#invoiceSubsidyPercentage").val()
    let consumptionSubsidy = consumptionValue + parseInt(parameters.charge) + sewerage

    let subsidyValue = 0
    if (subsidy > 0) {
        if (lectureValue <= parameters.subsidyLimit) {
            subsidyValue = Math.round(consumptionSubsidy * (subsidy / 100))
        } else {
            subsidyValue = Math.round(((parameters.subsidyLimit * meterValue) + parseInt(parameters.charge) + sewerage) * (subsidy / 100))
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

    let lastConsumptionValue = parseInt(parameters.charge) + consumptionValue - subsidyValue + consumptionLimitTotal + sewerage
    $("#invoiceConsumption2a").val(lastConsumptionValue)

    let fine = 0
    if($("#invoiceFineCheck").prop('checked')){
        fine = (consumptionSubsidy + consumptionLimitTotal) * 0.2 //Multa actual, parametrizar
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
    $("#invoiceDebt").val(debt) //A asignar
    let debtFine = 0
    if(debt>0){
        debtFine = debt * 0.03
    }
    $("#invoiceDebtFine").val(parseInt(debtFine))
    let subTotal = parseInt(lastConsumptionValue) + parseInt(debtFine)
    $("#invoiceSubTotal").val(subTotal)
    $("#invoiceTotal").val(subTotal + parseInt(debt) + parseInt(totalAgreements))


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

async function createInvoice(lectureID, invoiceID, memberID) {

    createModalBody(memberID)
    $('#lectureModal').modal('show')

    $('#tableLecturesBody > tr').removeClass('table-primary')
    $("#"+lectureID).addClass('table-primary')
    $('#divInvoice').css('display', 'block')
    $('.btnLecture').attr('disabled',true)
    //createInvoice($(this).attr('id'), $(this).attr('data-invoice'), member)

    let memberData = await axios.post('/api/memberSingle', {id: memberID})
    let member = memberData.data

    let name = ''
    let type = ''
    if (member.type == 'personal') {
        type = 'PERSONAL'
        name = member.personal.name + ' ' + member.personal.lastname1 + ' ' + member.personal.lastname2
    } else {
        type = 'EMPRESA'
        name = member.enterprise.name
    }

    $('#memberNumber').val(member.number)
    $('#memberType').val(type)
    $('#memberRUT').val(member.rut)
    $('#memberName').val(name)
    $('#memberWaterMeter').val(member.waterMeters.find(x => x.state === 'Activo').number)
    $('#memberAddress').val(member.address.address)
    
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
        let monthDue = lecture.month
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

        $("#tableBodyServices").html('')

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
            year: parseInt(year),
            month: parseInt(monthDue),
            member: memberID
        })

        let agreements = agreementData.data

        console.log('agreements',agreements)

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

        calculateTotal()

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

        $('.invoiceDateClass').daterangepicker({
            opens: 'right',
            locale: dateRangePickerDefaultLocale,
            singleDatePicker: true,
            autoApply: true
        })

        $("#tableBodyServices").html('')

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

    }
}


function setPopover(title, values, text){
   
    let popover = `<a href="#" class="aPopover" data-toggle="popover" title="${title}" data-content='
                    <div class="container-fluid">
                        <div class="row">`
    for(let i=0; i<values.length; i++){
        popover += `<div class="col-md-6">${values[i]['title']}</div>
                    <div class="col-md-1 right">${values[i]['symbol']}</div>
                    <div class="col-md-4 right">${dot_separators(values[i]['value'])}</div>`
    }
    
    popover += `        </div>
                    </div>'
                >${text}</a>`

    return popover
}

function ExportToExcel(type, table, fn, dl) {
    var elt = document.getElementById(table)
    var wb = XLSX.utils.table_to_book(elt, { sheet: "Hoja1" })
    return dl ?
      XLSX.write(wb, { bookType: type, bookSST: true, type: 'base64' }):
      XLSX.writeFile(wb, fn || ('Reporte.' + (type || 'xlsx')))
}

function exportToPDF(table){
    var doc = new jsPDF('l','pt','letter')
    let columnStyles = {
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'center' },
        5: { halign: 'center' }
    }
    if(table=='tableSummaryExcel'){
        columnStyles = {
            0: { halign: 'left' },
            1: { halign: 'right' },
            2: { halign: 'right' },
            3: { halign: 'right' }
        }
    }

    doc.autoTable({ 
        html: "#"+table,
        styles: {
            fontSize: 6,
            valign: 'middle',
            halign: 'center'
        },
        columnStyles: columnStyles,
        didParseCell: (hookData) => {
            if (hookData.section === 'head') {
                if (hookData.column.dataKey === '1') {
                    hookData.cell.styles.halign = 'left';
                }
            }
        }
    })
    doc.save("table.pdf")
}

async function printMultiple(state) {
    
    if(!$.fn.DataTable.isDataTable('#tableMembers')) {
        toastr.warning('Primero debe filtrar')
        return
    }
    loadingHandler('start')
    let index = 0
    let array = []
    $("#tableMembers > tbody > tr").each(async function() {
      
        let object = {}
        let memberData = await axios.post('/api/memberSingle', {id: $($($(this).children()[0]).children()[0]).attr('data-member-id') })
        object.member = memberData.data

        let invoiceData = await axios.post('/api/invoiceSingle', { id: $($($(this).children()[0]).children()[0]).attr('data-invoice-id') })
        object.invoice = invoiceData.data

        let lecturesData = await axios.post('/api/lecturesSingleMember', { member: $($($(this).children()[0]).children()[0]).attr('data-member-id') })
        object.lectures = lecturesData.data
        index++

        if((state=='valid' && !object.invoice.annulment) || (state=='annulled' && object.invoice.annulment) ){
            array.push(object)
        }

        if(index+1==$("#tableMembers > tbody > tr").length){
            loadingHandler('stop')
            array.sort((a,b) => (a.invoice.number > b.invoice.number) ? 1 : ((b.invoice.number > a.invoice.number) ? -1 : 0))
            printFinal(array)
        }
    })

}

