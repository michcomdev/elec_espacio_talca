let internals = {
    members: {
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

    //chargeMembersTable()
})

async function getParameters() {

    let firstYear = 2021
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

function chargeMembersTable() {
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
                            //{ targets: [15, 16], className: 'dt-center' },
                            { targets: [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18], className: 'dt-right' }
                        ],
                order: [[$("#searchOrder").val(), 'asc']],
                ordering: true,
                rowCallback: function (row, data) {
                    //$(row).find('td:eq(1)').html(moment.utc(data.date).format('DD/MM/YYYY'))
                    //$(row).find('td:eq(5)').html(dot_separators(data.lastLecture))
                    // $('td', row).css('background-color', 'White');
                },
                columns: [
                    { data: 'number' },
                    { data: 'name' },
                    { data: 'lectureLast' },
                    { data: 'lectureActual' },
                    { data: 'consumption' },
                    { data: 'meterValue' },
                    { data: 'consumptionOnly' },
                    { data: 'charge' },
                    { data: 'sewerage' },
                    { data: 'consumptionSum' }, //Consumo + cargo fijo + alcantarillado
                    { data: 'subsidy' },
                    { data: 'overConsumption' },
                    { data: 'fine' },
                    { data: 'consumptionValue' },
                    { data: 'others' },
                    { data: 'debt' },
                    { data: 'debtFine' },
                    { data: 'positive' },
                    { data: 'total' }
                ],
                initComplete: function (settings, json) {
                    getLectures()
                }
            })

    } catch (error) {
        console.log(error)
    }

}

async function getLectures() {

    loadingHandler('start')
    //let lecturesData = await axios.post('api/membersLectures', {sector: $("#searchSector").val()})
    let query = {
        sector: $("#searchSector").val(), 
        year: $("#searchYear").val(), 
        month: $("#searchMonth").val(),
        order: $("#searchOrder").val()
    }
    let lecturesData = await axios.post('api/lecturesSectorMembers', query)
//console.log(lecturesData.data)
    internals.members.data = lecturesData.data

    internals.invoices = []
    $("#tableMembersExcelBody").html('')

    if (lecturesData.data.length > 0) {
        //let index = 0
        let formatData = lecturesData.data.map(el => {

            el.select = `<input type="checkbox" class="chkClass" id="chk${el.members._id}" />`
            el.selectPrint = ''
            el.number = el.members.number

            if (el.members.type == 'personal') {
                el.typeString = 'PERSONA'
                el.name = el.members.personal.name + ' ' + el.members.personal.lastname1 + ' ' + el.members.personal.lastname2
            } else {
                el.typeString = 'EMPRESA'
                el.name = el.members.enterprise.name
            }

            el.name = `<a href="#" onclick="showInvoices('${el.members.type}','${el.members._id}','${el._id}')">${el.name}</a>`
            
            if(el.invoice){

                let invoiceServices = [], sewerage = 0, fine = 0, others = 0
                if(el.invoice.sewerage){
                    sewerage = el.invoice.sewerage
                }
                if(el.invoice.fine){
                    fine = el.invoice.fine
                }
                /*for(let j=0; j < el.invoice.services.length; j++){
                    if(el.invoice.services[j].services.type=='ALCANTARILLADO'){
                        sewerage += (parseInt(el.invoice.services[j].value)!=0) ? parseInt(el.invoice.services[j].value) : parseInt(el.invoice.services[j].services.value)//Indicar valor por defecto en caso de 0
                    }else{
                        others += (parseInt(el.invoice.services[j].value)!=0) ? parseInt(el.invoice.services[j].value) : parseInt(el.invoice.services[j].services.value) //Indicar valor por defecto en caso de 0
                    }

                    invoiceServices.push({
                        services: el.invoice.services[j].services._id,
                        value: el.invoice.services[j].value
                    })
                }*/
                if(el.invoice.agreements){
                    if(el.invoice.agreements.length>0){
                        for(let j=0; j < el.invoice.agreements.length; j++){
                            others += parseInt(el.invoice.agreements[j].amount)
                        }
                    }
                }

                if(!el.invoice.token){

                    internals.invoices.push({
                        id: el.invoice._id,
                        lectures: el.invoice.lectures._id,
                        member: el.invoice.members,
                        memberType: el.members.type,
                        type: el.invoice.type,
                        date: moment.utc(el.invoice.date).format('YYYY-MM-DD'),
                        dateExpire: moment.utc(el.invoice.dateExpire).format('YYYY-MM-DD'),
                        charge: el.invoice.charge,
                        lectureActual: el.invoice.lectureActual,
                        lectureLast: el.invoice.lectureLast,
                        lectureResult: el.invoice.lectureResult,
                        meterValue: el.invoice.meterValue,
                        subsidyPercentage: el.invoice.subsidyPercentage,
                        subsidyValue: el.invoice.subsidyValue,
                        sewerage: sewerage,
                        fine: fine,
                        //others: others,
                        consumptionLimit: el.invoice.consumptionLimit,
                        consumptionLimitValue: el.invoice.consumptionLimitValue,
                        consumptionLimitTotal: el.invoice.consumptionLimitTotal,
                        consumption: el.invoice.consumption,
                        invoiceSubTotal: el.invoice.invoiceSubTotal,
                        invoiceDebt: el.invoice.invoiceDebt,
                        debtFine: el.invoice.debtFine,
                        positive: el.invoice.invoicePositive,
                        invoiceTotal: el.invoice.invoiceTotal,
                        services: invoiceServices
                    })
                }
                //data-content="<table><tr><td>Lectura Actual</td><td>${el.invoice.lectureResult}</td></tr></table>"

                let values = []

                /*el.lectureLast = el.invoice.lectureLast
                el.lectureActual = el.invoice.lectureActual
                el.consumption = el.invoice.lectureResult
                el.consumptionOnly = el.invoice.meterValue * el.invoice.lectureResult
                el.charge = el.invoice.charge
                el.consumptionValue = el.invoice.consumption
                el.sewerage = sewerage
                el.subsidy = el.invoice.subsidyValue
                el.fine = el.invoice.fine
                el.others = others
                el.debt = el.invoice.invoiceDebt
                el.debtFine = el.invoice.debtFine
                el.total = el.invoice.invoiceTotal*/

                /*el.consumption = `<a href="#" data-toggle="popover" title="Metros Consumidos" 
                                    data-content='<div class="container-fluid">
                                            <div class="row">
                                                <div class="col-md-6">Lectura Actual</div>
                                                <div class="col-md-1 right"></div>
                                                <div class="col-md-4 right">${el.invoice.lectureActual}</div>
                                                <div class="col-md-6">Lectura Anterior</div>
                                                <div class="col-md-1 right">-</div>
                                                <div class="col-md-4 right">${el.invoice.lectureLast}</div>
                                                <div class="col-md-6"></div>
                                                <div class="col-md-1 right"></div>
                                                <div class="col-md-4 right">__________</div>
                                                <div class="col-md-6">Lectura Anterior</div>
                                                <div class="col-md-1 right">=</div>
                                                <div class="col-md-4 right">${el.invoice.lectureResult}</div>
                                            </div>
                                        </div>'
                                    >${el.invoice.lectureResult}<a>`*/

                el.lectureLast = el.invoice.lectureLast
                el.lectureActual = el.invoice.lectureActual

                values = [{title: 'Lectura Actual', symbol: '', value: el.invoice.lectureActual},
                        {title: 'Lectura Anterior', symbol: '-', value: el.invoice.lectureLast},
                        {title: '', symbol: '', value: '__________'},
                        {title: 'Consumo M<sup>3</sup>', symbol: '=', value: el.invoice.lectureResult}]
                el.consumption = setPopover('Metros Consumidos', values, el.invoice.lectureResult,el.members._id)
                
                el.meterValue = el.invoice.meterValue

                let consumptionOnly = el.invoice.meterValue * el.invoice.lectureResult
                values = [{title: 'Valor M<sup>3</sup>', symbol: '', value: el.invoice.meterValue},
                        {title: 'Consumo en M<sup>3</sup>', symbol: 'x', value: el.invoice.lectureResult},
                        {title: '', symbol: '', value: '__________'},
                        {title: 'Consumo en $', symbol: '=', value: consumptionOnly}]
                el.consumptionOnly = setPopover('Valor Consumo', values, consumptionOnly)

                el.charge = el.invoice.charge
                el.sewerage = sewerage

                let consumptionSum = el.invoice.charge + sewerage + consumptionOnly
                values = [{title: 'Consumo $', symbol: '', value: consumptionOnly},
                {title: 'Cargo Fijo', symbol: '+', value: el.invoice.charge},
                {title: 'Alcantarillado', symbol: '+', value: sewerage},
                {title: '', symbol: '', value: '__________'},
                {title: 'Consumo Mes $', symbol: '=', value: consumptionSum}]

                el.consumptionSum = setPopover('Consumo Mes', values, consumptionSum)


                let subsidyConsumption = el.invoice.meterValue * ((el.invoice.lectureResult>el.invoice.consumptionLimit) ? el.invoice.consumptionLimit : el.invoice.lectureResult)
                let subsidyConsumptionTotal = el.invoice.charge + sewerage + subsidyConsumption
                values = [
                    {title: 'Valor M<sup>3</sup>', symbol: '', value: el.invoice.meterValue},
                    {title: 'Cons. M<sup>3</sup>(Máx.'+el.invoice.consumptionLimit+')', symbol: 'x', value: (el.invoice.lectureResult>el.invoice.consumptionLimit) ? el.invoice.consumptionLimit : el.invoice.lectureResult},
                    {title: '', symbol: '', value: '__________'},
                    {title: 'Consumo $', symbol: '=', value: subsidyConsumption},
                    {title: '<br/>', symbol: '', value: ''},
                    {title: 'Consumo $', symbol: '', value: subsidyConsumption},
                    {title: 'Cargo Fijo', symbol: '+', value: el.invoice.charge},
                    {title: 'Alcantarillado', symbol: '+', value: sewerage},
                    {title: '', symbol: '', value: '__________'},
                    {title: 'Consumo Mes $', symbol: '=', value: subsidyConsumptionTotal},
                    {title: '<br/>', symbol: '', value: ''},
                    {title: 'Consumo Base $', symbol: '', value: subsidyConsumptionTotal},
                    {title: 'Porcentaje', symbol: 'x', value: el.invoice.subsidyPercentage + '%'},
                    {title: '', symbol: '', value: '__________'},
                    {title: 'Valor Subsidio $', symbol: '=', value: el.invoice.subsidyValue}]

                el.subsidy = setPopover('Subsidio', values, el.invoice.subsidyValue)

                let overConsumption = ((el.invoice.lectureResult>el.invoice.consumptionLimit) ? el.invoice.lectureResult-el.invoice.consumptionLimit : 0)
                values = [{title: 'M<sup>3</sup> Sobreconsumo', symbol: '', value: overConsumption},
                        {title: '$ Sobreconsumo x M<sup>3</sup>', symbol: 'x', value: el.invoice.consumptionLimitValue},
                        {title: '', symbol: '', value: '__________'},
                        {title: 'Sobreconsumo Mes $', symbol: '=', value: el.invoice.consumptionLimitTotal}]                
                el.overConsumption = setPopover('Subsidio', values, el.invoice.consumptionLimitTotal)

                let consumptionCleanValue = consumptionSum - el.invoice.subsidyValue + el.invoice.consumptionLimitTotal
                values = [{title: 'Valor a Pagar $', symbol: '', value: consumptionCleanValue},
                {title: '% Multa', symbol: 'x', value: '20%'}, //Verificar si dejar valor cerrado
                {title: '', symbol: '', value: '__________'},
                {title: 'Multa $', symbol: '=', value: el.invoice.fine}]
                el.fine = setPopover('Multa por regularización Socio', values, el.invoice.fine)

                values = [{title: 'Consumo $', symbol: '', value: consumptionSum},
                {title: 'Subsidio', symbol: '-', value: el.invoice.subsidyValue},
                {title: 'Sobreconsumo', symbol: '+', value: el.invoice.consumptionLimitTotal},
                {title: '', symbol: '', value: '__________'},
                {title: 'Consumo Mes $', symbol: '=', value: consumptionCleanValue},
                {title: '<br/>', symbol: '', value: ''},
                {title: 'Consumo Mes $', symbol: '', value: consumptionCleanValue},
                {title: 'Multa 20% $', symbol: '+', value: el.invoice.fine},
                {title: '', symbol: '', value: '__________'},
                {title: 'Valor a Pagar $', symbol: '=', value: el.invoice.consumption}]
                el.consumptionValue = setPopover('Valor a Pagar Mes', values, el.invoice.consumption)

                values = [{title: 'Sin Convenio', symbol: '', value: 0}]
                if(el.invoice.agreements){
                    if(el.invoice.agreements.length>0){
                        values = []
                        for(let j=0; j < el.invoice.agreements.length; j++){
                            values.push({title: el.invoice.agreements[j].text, symbol: (j>0) ? '+' : '', value: parseInt(el.invoice.agreements[j].amount)})
                        }
                    }
                }
                values.push({title: '', symbol: '', value: '__________'},
                            {title: 'Total Otros $', symbol: '=', value: others})
                el.others = setPopover('Convenios / Multas', values, others)

                el.debt = el.invoice.invoiceDebt
                el.positive = (el.invoice.invoicePositive) ? el.invoice.invoicePositive : 0

                values = [{title: 'Saldo anterior $', symbol: '', value: el.invoice.invoiceDebt},
                        {title: '% Interés', symbol: 'x', value: '3%'}, //Verificar si dejar valor cerrado
                        {title: '', symbol: '', value: '__________'},
                        {title: 'Interés $', symbol: '=', value: el.invoice.debtFine}]
                el.debtFine = setPopover('Interés por saldo impago', values, el.invoice.debtFine)

                values = [{title: 'Valor a Pagar', symbol: '', value: el.invoice.consumption},
                        {title: 'Interés Saldo', symbol: '+', value: el.invoice.debtFine}, //Verificar si dejar valor cerrado
                        {title: '', symbol: '', value: '__________'},
                        {title: 'Valor Tributable', symbol: '=', value: el.invoice.consumption + el.invoice.debtFine},
                        {title: '<br/>', symbol: '', value: ''},
                        {title: 'Otros (No tributable)', symbol: '', value: others},
                        {title: 'Saldo Anterior', symbol: '+', value: el.invoice.invoiceDebt},
                        {title: 'Saldo a Favor', symbol: '-', value: el.positive},
                        {title: '', symbol: '', value: '__________'},
                        {title: 'Valor Total a Pagar', symbol: '=', value: el.invoice.invoiceTotal}]

                el.total = setPopover('Total', values, el.invoice.invoiceTotal)

                /*el.detail = `<button class="btn btn-sm btn-info" onclick="createInvoice('${el._id}','${el.invoice._id}','${el.members._id}')"><i class="far fa-eye" style="font-size: 14px;"></i></button>`
                
                if(el.invoice.token){
                    el.select = ''
                    el.selectPrint = `<input type="checkbox" class="chkPrintClass" id="chkPrint${el.members._id}" data-member-id="${el.members._id}" data-invoice-id="${el.invoice._id}" data-member-type="${el.members.type}"/>`

                    el.pdf = `<button class="btn btn-sm btn-danger" onclick="printInvoicePortrait('pdf','${el.members.type}','${el.members._id}','${el.invoice._id}')"><i class="far fa-file-pdf" style="font-size: 14px;"></i>N° ${dot_separators(el.invoice.number)}</button>`
                }else{
                    el.pdf = '<button class="btn btn-sm btn-secondary" disabled><i class="far fa-file-pdf" style="font-size: 14px;"></i></button>'
                }*/

                $("#tableMembersExcelBody").append(`
                    <tr>
                        <td>${el.number}</td>
                        <td>${el.name}</td>
                        <td>${el.invoice.lectureLast}</td>
                        <td>${el.invoice.lectureActual}</td>
                        <td>${el.invoice.lectureResult}</td>
                        <td>${el.invoice.meterValue}</td>
                        <td>${consumptionOnly}</td>
                        <td>${el.invoice.charge}</td>
                        <td>${sewerage}</td>
                        <td>${consumptionSum}</td>
                        <td>${el.invoice.subsidyValue}</td>
                        <td>${el.invoice.consumptionLimitTotal}</td>
                        <td>${el.invoice.fine}</td>
                        <td>${el.invoice.consumption}</td>
                        <td>${others}</td>
                        <td>${el.invoice.invoiceDebt}</td>
                        <td>${el.invoice.debtFine}</td>
                        <td>${el.positive}</td>
                        <td>${el.invoice.invoiceTotal}</td>
                    </tr>`)


            }else{
                el.lectureLast = 0
                el.lectureActual = 0
                el.consumption = 0
                el.meterValue = 0
                el.consumptionOnly = 0
                el.charge = 0
                el.sewerage = 0
                el.consumptionSum = 0
                el.subsidy = 0
                el.overConsumption = 0
                el.consumptionCleanValue = 0
                el.fine = 0
                el.others = 0
                el.consumptionValue = 0
                el.debt = 0
                el.debtFine = 0
                el.positive = 0
                el.total = 0
                //el.detail = '<button class="btn btn-sm btn-secondary" disabled><i class="far fa-eye" style="font-size: 14px;"></i></button>'
                //el.pdf = '<button class="btn btn-sm btn-secondary" disabled><i class="far fa-file-pdf" style="font-size: 14px;"></i></button>'
            }

            return el
        })

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
    chargeMembersTable()
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

function ExportToExcel(type, fn, dl) {
    var elt = document.getElementById('tableMembersExcel')
    var wb = XLSX.utils.table_to_book(elt, { sheet: "Hoja1" })
    return dl ?
      XLSX.write(wb, { bookType: type, bookSST: true, type: 'base64' }):
      XLSX.writeFile(wb, fn || ('Macro Subsidios.' + (type || 'xlsx')))
}

function exportToPDF(){
    var doc = new jsPDF('l','pt','letter')
    doc.autoTable({ 
        html: "#tableMembersExcel",
        styles: {
            fontSize: 6,
            valign: 'middle',
            halign: 'right'
        },
        columnStyles: {
            0: {cellWidth: 20},
            1: {cellWidth: 120, halign: 'left'},
            
        },
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

async function showInvoices(type,memberID,lecture){
    let invoices = await axios.post('/api/invoicesByLecture', { lecture: lecture })
    $("#tableInvoicesBody").html('')

    for(let i=0; i<invoices.data.length; i++){
        let row = `
                <tr>
                    <td>${invoices.data[i].number}</td>
                    <td>${moment(invoices.data[i].date).utc().format('DD/MM/YYYY')}</td>
                    <td><button class="btn btn-sm btn-danger btnLecture" onclick="printInvoicePortrait('pdf','${type}','${memberID}','${invoices.data[i]._id}')"><i class="far fa-file-pdf" style="font-size: 14px;"></i></button></td>`

        if(invoices.data[i].annulment){
            row += `<td>${invoices.data[i].annulment.number}</td>
                    <td>${moment(invoices.data[i].annulment.date).utc().format('DD/MM/YYYY')}</td>
                    <td><button class="btn btn-sm btn-danger btnLecture" onclick="showSIIPDF('${invoices.data[i].annulment.token}')"><i class="far fa-file-pdf" style="font-size: 14px;"></i></button></td>
                </tr>`
        }else{
            row += `<td></td>
                    <td></td>
                    <td></td>
                </tr>`
        }

        $("#tableInvoicesBody").append(row)
    }

    $('#modalInvoices').modal('show')

}