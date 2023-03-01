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
            //acc += `<option value="${el._id}" ${(el._id=='62bdd303b2e945b5ee150bf0') ? 'selected' : ''}>${el.name}</option>`
            acc += `<option value="${el._id}" ${(el._id=='62cde501ddcc8b2d6c958339') ? 'selected' : ''}>${el.name}</option>`
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
                            { targets: [0, 1, 2, 3, 4, 15, 16], className: 'dt-center' },
                            { targets: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14], className: 'dt-right' },
                            { targets: [1], visible: false }
                        ],
                order: [[1, 'asc']],
                ordering: true,
                rowCallback: function (row, data) {
                    //$(row).find('td:eq(1)').html(moment.utc(data.date).format('DD/MM/YYYY'))
                    //$(row).find('td:eq(5)').html(dot_separators(data.lastLecture))
                    // $('td', row).css('background-color', 'White');
                },
                columns: [
                    { data: 'select' },
                    { data: 'selectPrint' },
                    { data: 'number' },
                    //{ data: 'typeString' },
                    { data: 'name' },
                    { data: 'consumption' },
                    { data: 'charge' },
                    { data: 'subsidy' },
                    { data: 'sewerage' },
                    { data: 'fine' },
                    { data: 'consumptionValue' },
                    { data: 'others' },
                    { data: 'debt' },
                    { data: 'debtFine' },
                    { data: 'positive' },
                    { data: 'total' },
                    { data: 'detail' },
                    { data: 'pdf' }
                ],
                initComplete: function (settings, json) {
                    getLectures()
                }
            })

       /*$('#tableMembers tbody').off("click")

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
        })*/
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
        month: $("#searchMonth").val()
    }
    let lecturesData = await axios.post('api/lecturesSectorMembers', query)

    internals.members.data = lecturesData.data

    internals.invoices = []

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
                        positive: (el.invoice.invoicePositive) ? el.invoice.invoicePositive : 0,
                        invoiceTotal: el.invoice.invoiceTotal,
                        services: invoiceServices
                    })
                }

                el.consumption = el.invoice.lectureResult
                el.charge = el.invoice.charge
                el.consumptionValue = el.invoice.consumption
                el.subsidy = el.invoice.subsidyValue
                el.sewerage = sewerage
                el.fine = el.invoice.fine
                el.others = others
                el.debt = el.invoice.invoiceDebt
                el.debtFine = el.invoice.debtFine
                el.positive = (el.invoice.invoicePositive) ? el.invoice.invoicePositive : 0
                el.total = el.invoice.invoiceTotal
                el.detail = `<button class="btn btn-sm btn-info" onclick="createInvoice('${el._id}','${el.invoice._id}','${el.members._id}')"><i class="far fa-eye" style="font-size: 14px;"></i></button>`
                
                //if(el.invoice.token){
                if(el.invoice.number){
                    el.select = ''
                    //el.selectPrint = `<input type="checkbox" class="chkPrintClass" id="chkPrint${el.members._id}" data-member-id="${el.members._id}" data-invoice-id="${el.invoice._id}" data-member-type="${el.members.type}"/>`
                    if(el.members.sendEmail || el.members.sendWhatsapp){
                        el.selectPrint = ''
                    }else{
                        el.selectPrint = `<input type="checkbox" class="chkPrintClass" id="chkPrint${el.members._id}" data-member-id="${el.members._id}" data-invoice-id="${el.invoice._id}" data-member-type="${el.members.type}"/>`
                    }

                    el.pdf = `<button class="btn btn-sm btn-danger" onclick="printInvoicePortrait('pdf','${el.members.type}','${el.members._id}','${el.invoice._id}')"><i class="far fa-file-pdf" style="font-size: 14px;"></i>N° ${dot_separators(el.invoice.number)}</button>`
                }else{
                    el.pdf = '<button class="btn btn-sm btn-secondary" disabled><i class="far fa-file-pdf" style="font-size: 14px;"></i></button>'
                }

            }else{
                el.consumption = 0
                el.charge = 0
                el.consumptionValue = 0
                el.subsidy = 0
                el.sewerage = 0
                el.fine = 0
                el.others = 0
                el.debt = 0
                el.debtFine = 0
                el.positive = 0
                el.total = 0
                el.detail = '<button class="btn btn-sm btn-secondary" disabled><i class="far fa-eye" style="font-size: 14px;"></i></button>'
                el.pdf = '<button class="btn btn-sm btn-secondary" disabled><i class="far fa-file-pdf" style="font-size: 14px;"></i></button>'
            }

            return el
        })

        internals.members.table.rows.add(formatData).draw()

        loadingHandler('stop')
        $('#loadingMembers').empty()
    } else {
        loadingHandler('stop')
        //toastr.warning('No se han encontrado ventas en el rango seleccionado')
        $('#loadingMembers').empty()
    }
}

async function calculate(){

    loadingHandler('start')

    let array = internals.members.data
    let newArray = []
    internals.invoices = []

    if(array.length==0){
        loadingHandler('stop')
        return
    }

    for(let i=0; i < array.length; i++){

        let typeString = '', name = '', typeDTE = 41
        if (array[i].members.type == 'personal') {
            typeString = 'PERSONA'
            name = array[i].members.personal.name + ' ' + array[i].members.personal.lastname1 + ' ' + array[i].members.personal.lastname2
        } else {
            typeString = 'EMPRESA'
            name = array[i].members.enterprise.name
        }

        if (array[i].members.dte == 'FACTURA') {
            typeDTE = 34
        }else if (array[i].members.dte == 'BOLETA') {
            typeDTE = 41
        }else {
            typeDTE = 0
        }


        let goCalculate = true
        if(array[i].invoice){
            if(array[i].invoice.token){
                goCalculate = false
            }
        }

        if(!goCalculate){

            let el = array[i]
            
            let invoiceServices = [], sewerage = 0, fine = 0, others = 0, debtFine = 0

            if(el.invoice.sewerage){
                sewerage = el.invoice.sewerage
            }
            if(el.invoice.fine){
                fine = el.invoice.fine
            }
            if(el.invoice.debtFine){
                debtFine = parseInt(el.invoice.debtFine)
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

            for(let j=0; j < el.invoice.agreements.length; j++){
                others += parseInt(el.invoice.agreements[j].amount)
            }


            newArray.push(
                {
                    select: '',
                    selectPrint: `<input type="checkbox" class="chkPrintClass" id="chkPrint${el.members._id}" data-member-id="${el.members._id}" data-invoice-id="${el.invoice._id}" />`,
                    number: el.members.number,
                    typeString: typeString,
                    type: typeDTE,
                    name: name,
                    consumption: el.invoice.lectureResult,
                    charge: el.invoice.charge,
                    consumptionValue: el.invoice.consumption,
                    subsidy: el.invoice.subsidyValue,
                    sewerage: sewerage,
                    fine: fine,
                    others: others,
                    subTotal: el.invoice.invoiceSubTotal,
                    debt: el.invoice.invoiceDebt,
                    debtFine: el.invoice.debtFine,
                    positive: el.invoice.invoicePositive,
                    total: el.invoice.invoiceTotal,
                    detail: `<button class="btn btn-sm btn-info" onclick="createInvoice('${el._id}','${el.invoice._id}','${el.members._id}')"><i class="far fa-eye" style="font-size: 14px;"></i></button>`,
                    pdf: `<button class="btn btn-sm btn-danger" onclick="printInvoicePortrait('pdf','${el.members.type}','${el.members._id}','${el.invoice._id}')"><i class="far fa-file-pdf" style="font-size: 14px;"></i>N° ${dot_separators(el.invoice.number)}</button>`
                }
            )

        }else{

            let net = 0, lectureNewEnd, lectureNewStart
            //Consumos
            let lectureActual = array[i].logs[array[i].logs.length - 1].lecture
            let lectureLast = 0
            if(array[i].lastLecture){
                if(array[i].lastLecture.logs[array[i].lastLecture.logs.length - 1].lectureNewEnd !== undefined){
                    lectureLast = array[i].lastLecture.logs[array[i].lastLecture.logs.length - 1].lectureNewEnd
                }else{
                    lectureLast = array[i].lastLecture.logs[array[i].lastLecture.logs.length - 1].lecture
                }
            }
            let lectureValue = lectureActual - lectureLast

            if(array[i].logs[array[i].logs.length - 1].lectureNewStart !== undefined){
                lectureNewEnd = array[i].logs[array[i].logs.length - 1].lectureNewEnd
                lectureNewStart = array[i].logs[array[i].logs.length - 1].lectureNewStart
                lectureValue += lectureNewEnd - lectureNewStart
            }

            let meterValue = parameters.meterValue
            if(array[i].members.waterMeters.find(x => x.state === 'Activo').diameter=='TresCuartos'){
                meterValue = parameters.meterValueB
            }
            let consumptionValue = lectureValue * meterValue


            //Servicios
            let sewerage = 0
            let others = 0
            let services = [] //Para almacenaje
            if(array[i].members.services){
                for(let j=0; j < array[i].members.services.length; j++){
                    if(array[i].members.services[j].services.type=='ALCANTARILLADO'){
                        //sewerage += (parseInt(array[i].members.services[j].value)!=0) ? parseInt(array[i].members.services[j].value) : parseInt(array[i].members.services[j].services.value)//Indicar valor por defecto en caso de 0
                        sewerage += parseInt(array[i].members.services[j].services.value)//Indicar valor por defecto en caso de 0
                    }
                }
            }

            
            let subsidyPercentage = 0
            if (array[i].members.subsidies.length > 0) {
                let subsidyActive = array[i].members.subsidies.find(x => x.status == 'active')
                if(subsidyActive){
                    subsidyPercentage = subsidyActive.percentage
                }
            }


            let consumptionSubsidy = consumptionValue + parseInt(parameters.charge) + sewerage
            let subsidyValue = 0

            if (subsidyPercentage > 0) {
                if (lectureValue <= parameters.subsidyLimit) {
                    subsidyValue = Math.round(consumptionSubsidy * (subsidyPercentage / 100))
                } else {
                    subsidyValue = Math.round(((parameters.subsidyLimit * meterValue) + parseInt(parameters.charge) + sewerage) * (subsidyPercentage / 100))
                }
            }

            let consumptionLimit = parameters.consumptionLimit
            let consumptionLimitValue = parameters.consumptionLimitValue
            let consumptionLimitTotal = 0 //Valor a pagar por sobreconsumo
            if(lectureValue>consumptionLimit){
                consumptionLimitTotal = (lectureValue - consumptionLimit) * consumptionLimitValue
            }

           

            let lastConsumptionValue = parseInt(parameters.charge) + consumptionValue - subsidyValue + consumptionLimitTotal + sewerage

            let fine = 0
            if(array[i].members.fine){
                fine = (consumptionSubsidy + consumptionLimitTotal) * 0.2 //Parametrizar, valor del 20% actual
                lastConsumptionValue += fine
            }
            

            //Carga de Convenios
            let agreementData = await axios.post('/api/agreementsByDate', { 
                year: parseInt(array[i].year),
                month: parseInt(array[i].month),
                member: array[i].members._id
            })

    
            let agreementsData = agreementData.data
            let agreements = []

            if (agreementsData.length > 0) {
                for(let j=0; j<agreementsData.length; j++){
                    if(agreementsData[j].due){ //Sólo se asignarán cuotas de convenio no asociadas a ingreso (cuotas adelantadas)
                        others += parseInt(agreementsData[j].due.amount)
                        agreements.push({
                            agreements: agreementsData[j]._id,
                            text: (agreementsData[j].services) ? agreementsData[j].services.name : agreementsData[j].other,
                            number: parseInt(agreementsData[j].due.number),
                            dueLength: parseInt(agreementsData[j].dues.length),
                            amount: parseInt(agreementsData[j].due.amount)
                        })
                    }
                }
            }

            //Carga de boletas adeudadas
            let invoicesDebtData = await axios.post('/api/invoicesDebt', { member: array[i].members._id })
            let invoicesDebt = invoicesDebtData.data

            let debt = 0
            if(invoicesDebt.length>0){
                for(let i=0; i<invoicesDebt.length; i++){
                    let agreementValue = 0
                    for(let j=0; j<invoicesDebt[i].agreements.length; j++){
                        agreementValue += invoicesDebt[i].agreements[j].amount
                    }
                    if(invoicesDebt[i].invoicePaid){
                        debt += (invoicesDebt[i].invoiceSubTotal + agreementValue) - invoicesDebt[i].invoicePaid
                    }else{
                        debt += invoicesDebt[i].invoiceSubTotal + agreementValue
                    }
                }
            }
            let debtFine = 0
            if(debt>0){
                debtFine = parseInt(debt * 0.03)
            }

            //Montos
            let subTotal = parseInt(lastConsumptionValue) + parseInt(debtFine) //+ parseInt(sewerage)

            let positive = 0
            if(array[i].members.positiveBalance){
                positive = array[i].members.positiveBalance
            }
            let total = parseInt(subTotal) + parseInt(debt) + parseInt(others) - parseInt(positive)

            newArray.push(
                {
                    select: `<input type="checkbox" class="chkClass" id="chk${array[i].members._id}"/>`,
                    selectPrint: '',
                    number: array[i].members.number,
                    typeString: typeString,
                    type: typeDTE,
                    name: name,
                    consumption: lectureValue,
                    charge: parameters.charge,
                    consumptionValue: lastConsumptionValue,
                    subsidy: subsidyValue,
                    sewerage: sewerage,
                    fine: fine,
                    others: others,
                    subTotal: subTotal,
                    debt: debt,
                    debtFine: debtFine,
                    positive: positive,
                    total: total,
                    detail: `<button class="btn btn-sm btn-info" onclick="createInvoice('${array[i]._id}','0','${array[i].members._id}')"><i class="far fa-eye" style="font-size: 14px;"></i></button>`,
                    pdf: '<button class="btn btn-sm btn-secondary" disabled><i class="far fa-file-pdf" style="font-size: 14px;"></i></button>'
                }
            )

            let text1 = ''
            let text2 = parameters.text2
            let text3 = parameters.text3
            if(debt>0){
                text1 = parameters.text1
            }


            //FECHA DE VENCIMIENTO
            let year = array[i].year
            let month = array[i].month+1
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
                expireDate = moment.utc().add(15, 'days').format('YYYY-MM-DD')
            }else{
                expireDate = moment(expireDate).utc().format('YYYY-MM-DD')
            }

            
            internals.invoices.push({
                lectures: array[i]._id,
                member: array[i].members._id,
                memberType: array[i].members.type,
                type: typeDTE, //Tipo documento: boleta/factura
                //type: array[i].members.dte, //Tipo documento: boleta/factura
                //number: replaceAll($("#invoiceNumber").val(), '.', '').replace(' ', ''),
                date: moment.utc().format('YYYY-MM-DD'),
                dateExpire: expireDate,
                charge: parameters.charge,
                lectureActual: lectureActual,
                lectureLast: lectureLast,
                lectureResult: lectureValue,
                meterValue: meterValue,
                subsidyPercentage: subsidyPercentage,
                subsidyValue: subsidyValue,
                consumptionLimit: consumptionLimit,
                consumptionLimitValue: consumptionLimitValue,
                consumptionLimitTotal: consumptionLimitTotal,
                consumption: lastConsumptionValue,
                sewerage: sewerage,
                fine: fine,
                invoiceSubTotal: subTotal,
                invoiceDebt: debt,
                debtFine: debtFine,
                positive: positive,
                invoiceTotal: total,
                services: services,
                agreements: agreements,
                text1: text1,
                text2: text2,
                text3: text3
            })
            
            if(lectureNewEnd !== undefined){
                internals.invoices[internals.invoices.length-1].lectureNewEnd = lectureNewEnd
                internals.invoices[internals.invoices.length-1].lectureNewStart = lectureNewStart
            }
        }

        if(i+1==array.length){
            internals.members.table.clear()
            internals.members.table.rows.add(newArray)
            internals.members.table.draw()

            loadingHandler('stop')
        }
    }

}

async function saveMultiple(){
    
    let goGenerate = false
    let totalRows = 0
    $(".chkClass").each(function() {
        if($(this).prop('checked')){
            goGenerate = true
            totalRows++
        }
    })

    if(goGenerate){
        //loadingHandler('start')
        console.log(internals.invoices.length)
        progressValue = 0
        progressTotal = totalRows
        //let progressIndex = 1
        $('#modalProgress').modal('show')
        progressBar()
        
        for(let i=0; i<internals.invoices.length; i++){
            if($("#chk"+internals.invoices[i].member).prop('checked')){
                /*console.log(progressIndex,progressIndex%10)
                if(progressIndex%10==0){
                    setTimeout(() => {
                        console.log('waiting 10 seconds...')
                    }, 10000)
                }
                progressIndex++
                progressBar()*/
                
                console.log(internals.invoices[i])
                if(!internals.invoices[i].id){

                    let saveInvoice = await axios.post('/api/invoiceSave', internals.invoices[i])
                    console.log(saveInvoice.data)
                    if (saveInvoice.data) {
                        if (saveInvoice.data._id) {
                            progressIndex++
                            sendData(internals.invoices[i].memberType,internals.invoices[i].member,saveInvoice.data._id)
                        }
                    }
                }else{
                    let updateInvoice = await axios.post('/api/invoiceUpdate', internals.invoices[i])
                    console.log(updateInvoice.data)
                    if (updateInvoice.data) {
                        if (updateInvoice.data._id) {
                            progressIndex++
                            sendData(internals.invoices[i].memberType,internals.invoices[i].member,updateInvoice.data._id)
                        }
                    }
                }
            }

            if(i+1==internals.invoices.length){
                toastr.success('Se están generando las boletas, favor esperar mensaje de confirmación')
            }
        }
    }else{
        toastr.warning('Debe seleccionar al menos un socio')
    }
}

async function sendMultiple(){

    let array = []

    let count = 0
    $(".chkPrintClass").each(function() {
        if($(this).prop('checked')){
            count++
        }
    })
    
    if(count>0){
        let countIndex = 0
        $(".chkPrintClass").each(async function() {
            if($(this).prop('checked')){
                printInvoicePortrait('pdf',$(this).attr('data-member-type'),$(this).attr('data-member-id'),$(this).attr('data-invoice-id'),true)
            }
        })
        
    }else{
        toastr.warning('Debe seleccionar al menos un socio')
    }

}

$('#searchMembers').on('click', async function () {
    if($("#searchSector").val()!=0){
        chargeMembersTable()
    }else{
        toastr.warning('Debe seleccionar un sector')
    }
})

$('#calculateLectures').on('click', async function () {
    calculate()
})



function validateInvoiceData(productData) {

    let errorMessage = ''
    
    /*if(!$.isNumeric(productData.number)){
        errorMessage += '<br>Número de Boleta/Factura'
    }*/
    if(!$.isNumeric(productData.charge)){
        errorMessage += '<br>Cargo Fijo'
    }
    if (!$.isNumeric(productData.lectureActual)) {
        errorMessage += '<br>Lecture Actual'
    }
    if (!$.isNumeric(productData.lectureLast)) {
        errorMessage += '<br>Lecture Anterior'
    }
    if (!$.isNumeric(productData.lectureResult)) {
        errorMessage += '<br>Consumo mts<sup>3</sup>'
    }
    if (!$.isNumeric(productData.meterValue)) {
        errorMessage += '<br>Valor mts<sup>3</sup>'
    }
    if (!$.isNumeric(productData.subsidyPercentage)) {
        errorMessage += '<br>Porcentaje Subsidio'
    }
    if (!$.isNumeric(productData.subsidyValue)) {
        errorMessage += '<br>Valor Subsidio'
    }
    if (!$.isNumeric(productData.consumption)) {
        errorMessage += '<br>Consumo a Cobro'
    }
    if (!$.isNumeric(productData.invoiceDebt)) {
        errorMessage += '<br>Deuda Anterior'
    }
    if (!$.isNumeric(productData.invoiceTotal)) {
        errorMessage += '<br>Total'
    }

    if (errorMessage.length === 0) {
        return { ok: productData }
    } else {
        $(document).on('hidden.bs.modal', '.modal', function () { //Soluciona problema de scroll
            $('.modal:visible').length && $(document.body).addClass('modal-open')
        })

        $('#modal').modal('show')
        $('#modal_title').html(`Error al almacenar ingreso`)
        $('#modal_body').html(`<h7 class="alert-heading">Falta ingresar los siguientes datos:</h7>
                                    <p class="mb-0">${errorMessage}</p>`)

        return { err: productData }
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
                                    <option value="0">COMPROBANTE</option>
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
                                        Saldo a favor
                                    </div>
                                    <div class="col-md-1" style="text-align: center">(-)</div>
                                    <div class="col-md-3">
                                        <input id="invoicePositive" type="text" class="form-control form-control-sm border-input numericValues money">
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
    
    let positive = $("#invoicePositive").val()
    $("#invoiceTotal").val(subTotal + parseInt(debt) + parseInt(totalAgreements) - positive)


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
        }else if(member.dte=='COMPROBANTE'){
            $("#invoiceType").val(0)
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
                let agreementValue = 0
                for(let j=0; j<invoicesDebt[i].agreements.length; j++){
                    agreementValue += invoicesDebt[i].agreements[j].amount
                }
                if(invoicesDebt[i].invoicePaid){
                    debt += (invoicesDebt[i].invoiceSubTotal + agreementValue) - invoicesDebt[i].invoicePaid
                }else{
                    debt += invoicesDebt[i].invoiceSubTotal + agreementValue
                }
            }
        }

        $("#invoiceDebt").val(debt)

        if(member.positiveBalance){
            $("#invoicePositive").val(member.positiveBalance)
        }else{
            $("#invoicePositive").val(0)
        }

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
        
        if(invoice.invoicePositive){
            $("#invoicePositive").val(invoice.invoicePositive)
        }else{
            $("#invoicePositive").val(0)
        }

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
            
    //loadingHandler('start')
    
    let memberData = await axios.post('/api/memberSingle', {id: memberID})
    let member = memberData.data

    let invoiceData = await axios.post('/api/invoiceSingle', {id: invoiceID})
    let invoice = invoiceData.data

    let lecturesData = await axios.post('/api/lecturesSingleMember', {member:  memberID})
    let lectures = lecturesData.data

    let parametersData = await axios.get('/api/parameters')
    let parameters = parametersData.data

    console.log('receiptstate',parameters.receiptState)

    if(parameters.receiptState){

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
        progressBar()

    }else{
        
        let dteType = 34 //Factura exenta electrónica
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
        
        if(invoice.type==0){
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
            progressBar()


        }else if(invoice.type==41){
            dteType = 41

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

            /////////////////////////
            let debt = 0
            if(invoice.invoiceDebt){
                debt = invoice.invoiceDebt
            }

            let totals = {
                MntExe: invoice.invoiceSubTotal,
                MntTotal: invoice.invoiceSubTotal,
                MontoNF: totalAgreement, //No facturable
                TotalPeriodo: invoice.invoiceSubTotal + totalAgreement, //No facturable
                SaldoAnterior: debt,
                VlrPagar: invoice.invoiceSubTotal + totalAgreement + debt
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
                            //IndServicio: "3", //1=Servicios periódicos, 2=Serv. periódicos domiciliarios, 3=Venta o servicios
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
                RznSoc: parameters.emisor.RznSocEmisor,
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
                MntExe: invoice.invoiceSubTotal,
                MntTotal: invoice.invoiceSubTotal,
                MontoNF: totalAgreement, //No facturable
                //TotalPeriodo: invoice.invoiceSubTotal + totalAgreement, //No facturable
                SaldoAnterior: debt,
                VlrPagar: invoice.invoiceSubTotal + totalAgreement + debt
            }
            /////////////////////////////

            document = {
                response: ["TIMBRE","FOLIO","RESOLUCION","XML"],
                dte: {
                    Encabezado: {
                        IdDoc:{
                            TipoDTE: dteType,
                            Folio: 0,
                            FchEmis: moment.utc(invoice.date).format('YYYY-MM-DD'),
                            TpoTranCompra:"1",
                            TpoTranVenta:"1",
                            FmaPago:"2",
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
                            DirRecep: member.address.address,
                            CmnaRecep: parameters.committee.commune,
                        },
                        Totales: totals
                    },
                    Detalle: detail
                }
            }
        }

        console.log(document)
        console.log(JSON.stringify(document))
        var settings = {
            "url": "https://"+parameters.emisor.link+"/v2/dte/document",
            "method": "POST",
            "timeout": 0,
            "headers": {
            "apikey": parameters.apikey
            },
            "data": JSON.stringify(document)
        };  
        //console.log(settings)
        //console.log('Generado Folio:')
    //return
        
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

            console.log(dteData)

            let setDTEInvoice = await axios.post('/api/invoiceUpdateDTE', dteData)
            //loadingHandler('stop')
            progressBar()
            console.log('Generado Folio:',response.FOLIO)
            /*$('#modal_title').html(`Almacenado`)
            $('#modal_body').html(`<h7 class="alert-heading">Documento generado correctamente</h7>`)
            $('#modal').modal('show')*/
            
        })
    }

}

async function printInvoiceMultiple() {
    $(".btn-calculate").css('display','none')
    $(".filterClass").attr('disabled','disabled')
    $(".btn-print").css('display','block')
    internals.members.table.column(0).visible(false)
    internals.members.table.column(1).visible(true)
}

async function printCancel() {
    $(".btn-print").css('display','none')
    $(".btn-calculate").css('display','block')
    $(".filterClass").removeAttr('disabled')
    internals.members.table.column(0).visible(true)
    internals.members.table.column(1).visible(false)
}

async function printMultiple() {

    if(!$.fn.DataTable.isDataTable('#tableMembers')) {
        toastr.warning('Debe filtrar un sector')
        return
    }
    internals.members.table.column(0).visible(false)
    internals.members.table.column(1).visible(true)

    let array = []

    let count = 0
    $(".chkPrintClass").each(function() {
        //if($(this).prop('checked')){
            count++
        //}
    })

    console.log(count)

    
    if(count>0){
        loadingHandler('start')
        let countIndex = 0
        $(".chkPrintClass").each(async function() {
            //if($(this).prop('checked')){
                let object = {}
                let memberData = await axios.post('/api/memberSingle', {id: $(this).attr('data-member-id') })
                object.member = memberData.data

                let invoiceData = await axios.post('/api/invoiceSingle', { id: $(this).attr('data-invoice-id') })
                object.invoice = invoiceData.data

                let lecturesData = await axios.post('/api/lecturesSingleMember', { member: $(this).attr('data-member-id') })
                object.lectures = lecturesData.data
                
                array.push(object)
                countIndex++
                if(countIndex==count){
                    loadingHandler('stop')
                    array.sort((a,b) => (a.member.orderIndex > b.member.orderIndex) ? 1 : ((b.member.orderIndex > a.member.orderIndex) ? -1 : 0))
                    printFinal(array)
                }
            //}
        })
        
    }else{
        toastr.warning('Debe seleccionar al menos un socio')
    }

    internals.members.table.column(0).visible(true)
    internals.members.table.column(1).visible(false)

    return
}



function selectAll(btn){
    if($(btn).text().trim()=='Sel. Todo'){
        $(".chkClass").each(function() {
            $(this).prop('checked',true)
        })
        $(".chkPrintClass").each(function() {
            $(this).prop('checked',true)
        })
        $(btn).html('<i class="far fa-square"></i> Desel. Todo')
    }else{
        $(".chkClass").each(function() {
            $(this).prop('checked',false)
        })
        $(".chkPrintClass").each(function() {
            $(this).prop('checked',false)
        })
        $(btn).html('<i class="far fa-check-square"></i> Sel. Todo')
    }
}

function progressBar(){
    progressValue++

    $("#progressTitle").text('Generando boleta ' + progressValue + ' de '+ progressTotal)
    let percentage = parseInt(100 / progressTotal * progressValue)
    $("#progressBar").css('width', percentage + '%')

    if(progressTotal==progressValue){
        toastr.success('Boletas generadas, favor recargar para mostrar')
    }

}




async function printFinal(array,letter){

    letter = true

    let parametersData = await axios.get('/api/parameters')
    let parameters = parametersData.data

    let pageFormat = 'letter', orientation = 'l', valueWall = 1
    if(letter){
        pageFormat = [1224, 792]
        orientation = 'p'
        valueWall = 2
    }

    let doc = new jsPDF(orientation, 'pt', pageFormat)
    let docType = 'pdf'

    for(let k=0; k<array.length; k++){
        
        doc.setDrawColor(0, 0, 0)
        doc.setTextColor(0, 0, 0)
        doc.setFontType('normal')
        
        let docName1 = '', docName2 = 'EXENTA ELECTRÓNICA', memberName = '', siiValue = 'S.I.I. - CURICO'

        if (array[k].member.type == 'personal') {
            memberName = array[k].member.personal.name + ' ' + array[k].member.personal.lastname1 + ' ' + array[k].member.personal.lastname2
        } else {
            memberName = array[k].member.enterprise.name
        }
        console.log(array[k])
    
        if(array[k].invoice.type==41){
            docName1 = 'BOLETA NO AFECTA O'
        }else if(array[k].invoice.type==34){
            docName1 = 'FACTURA NO AFECTA O'
        }else if(array[k].invoice.type==0){
            docName1 = ''
            docName2 = 'COMPROBANTE DE AVISO'
            siiValue = ''
        }

        //let doc = new jsPDF('p', 'pt', [302, 451])

        let text = '', textMaxWidth = 0
    
        let pdfX = 20
        let pdfY = 582

        doc.setFontSize(12)
        doc.addImage(logoWallImg90, 'PNG', 0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight() / valueWall) //Fondo
        doc.addImage(logoImg90, 'PNG', 20, pdfY - 159, 60, 77)
        pdfX += 60
        textMaxWidth = 252 //Zona título
        text = `COMITÉ DE AGUA POTABLE RURAL`
        doc.text(text, pdfX + 23, offsetY('center', pdfY + 6, textMaxWidth, text, doc), 'left', 90)
        text = `Y SERVICIOS SANITARIOS LOS CRISTALES`
        doc.text(text, pdfX + 36, offsetY('center', pdfY + 6, textMaxWidth, text, doc), 'left', 90)
        text = `Los Cristales S/N - Curicó`
        doc.text(text, pdfX + 49, offsetY('center', pdfY + 6, textMaxWidth, text, doc), 'left', 90)


        pdfX = 35
        pdfY = 282
        
        doc.setDrawColor(249, 51, 6)
        doc.setLineWidth(3)
        doc.line(pdfX - 10, pdfY - 231, pdfX - 10, pdfY - 29)//Línea Superior
        doc.line(pdfX + 60, pdfY - 231, pdfX + 60, pdfY - 29)//Línea Inferior
        doc.line(pdfX - 10, pdfY - 30, pdfX + 60, pdfY - 30)//Línea Izquierda
        doc.line(pdfX - 10, pdfY - 230, pdfX + 60, pdfY - 230)//Línea Derecha
        
        pdfY -= 30
        doc.setFontSize(13)
        doc.setTextColor(249, 51, 6)

        textMaxWidth = 200 //Zona número boleta
        text = 'R.U.T: 71.569.700-9'
        doc.text(text, pdfX + 5, offsetY('center', pdfY, textMaxWidth, text, doc), 'left', 90)
        doc.text(docName1, pdfX + 20, offsetY('center', pdfY, textMaxWidth, docName1, doc), 'left', 90)
        doc.text(docName2, pdfX + 35, offsetY('center', pdfY, textMaxWidth, docName2, doc), 'left', 90)

        doc.setFontType('bold')
        if(array[k].invoice.number ||  array[k].invoice.number==0){
            if(array[k].invoice.number!=0){
                text = 'N° ' + array[k].invoice.number
                doc.text(text, pdfX + 50, offsetY('center', pdfY, textMaxWidth, text, doc), 'left', 90)
            }
        }else{
            text = 'N° -'
            doc.text(text, pdfX + 50, offsetY('center', pdfY, textMaxWidth, text, doc), 'left', 90)
        }
        doc.setFontSize(11)
        doc.text(siiValue, pdfX + 75, offsetY('center', pdfY, textMaxWidth, siiValue, doc), 'left', 90)
    
        doc.setDrawColor(0, 0, 0)
        doc.setTextColor(0, 0, 0)
    
        doc.setFontSize(10)
        doc.setFontType('normal')
        doc.text('Fecha Emisión ', pdfX + 100, pdfY - 10, 'left', 90)
        doc.text('Mes de Pago ', pdfX + 113, pdfY - 10, 'left', 90)

        doc.setFontType('bold')
        doc.text(moment(array[k].invoice.date).utc().format('DD / MM / YYYY'), pdfX + 100, pdfY - 90, 'left', 90)
        doc.text(getMonthString(array[k].invoice.lectures.month) + ' / ' + array[k].invoice.lectures.year, pdfX + 113, pdfY - 90, 'left', 90)

        pdfX = 155
        pdfY = 582
        doc.setFontSize(11)
        doc.text('SOCIO N° ' + array[k].member.number, pdfX, pdfY, 'left', 90)
        doc.text('R.U.T ' + array[k].member.rut, pdfX + 12, pdfY, 'left', 90)
        doc.setFontSize(12)
        doc.text(memberName.toUpperCase(), pdfX + 24, pdfY, 'left', 90)
        let subsidyNumber = array[k].member.subsidyNumber.toString()
        while (subsidyNumber.length<11) {
            subsidyNumber = '0' + subsidyNumber
        }
        doc.setFontSize(11)
        doc.setFontType('normal')
        doc.text('MIDEPLAN ' + subsidyNumber, pdfX + 36, pdfY, 'left', 90)
        doc.text('Sector: ' + array[k].member.address.sector.name, pdfX + 36, pdfY - 300, 'left', 90)
        doc.setFontType('bold')

        pdfX += 50

        //////////////TABLA CONSUMOS//////////////
        doc.setFillColor(26, 117, 187)
        doc.rect(pdfX, pdfY - 262, 13, 265, 'F')

        pdfX += 10
        doc.setFontSize(10)
        doc.setFontType('bold')
        doc.setTextColor(255, 255, 255)
        doc.text('Consumo en m3 (1m3 = 1.000 lts de agua)', pdfX, pdfY, 'left', 90)

        doc.setFontSize(14)
        doc.setFontType('normal')
        doc.setTextColor(0, 0, 0)
        
        let lastInvoice, flagLastInvoice = 0
        for (let j = 0; j < array[k].lectures.length; j++) {
            if(flagLastInvoice==1){
                if (array[k].lectures[j].invoice !== undefined) {
                    lastInvoice = array[k].lectures[j].invoice
                    j = array[k].lectures.length
                }
            }else{
                if (array[k].lectures[j]._id == array[k].invoice.lectures._id) {
                    flagLastInvoice++
                }
            }
        }

        doc.text('Lectura Mes Actual ', pdfX + 20, pdfY, 'left', 90)
        doc.text('Lectura Mes Anterior ', pdfX + 33, pdfY, 'left', 90)
        pdfXLectureNew = 0
        if(array[k].invoice.lectureNewStart!==undefined){
            doc.text('Lectura Medidor Nuevo Inicial ', pdfX + 46, pdfY, 'left', 90)
            doc.text('Lectura Medidor Nuevo Final ', pdfX + 59, pdfY, 'left', 90)
            pdfXLectureNew = 26
        }
        doc.setFontType('bold')
        doc.text('Consumo Calculado', pdfX + 46 + pdfXLectureNew, pdfY, 'left', 90)
        doc.setFontType('normal')

        doc.text('Límite Sobreconsumo (m3)', pdfX + 98, pdfY, 'left', 90)
        doc.text('Sobreconsumo (m3)', pdfX + 111, pdfY, 'left', 90)
        doc.setFontType('bold')
        doc.text('Consumo Facturado', pdfX + 124, pdfY, 'left', 90)

        doc.setFontSize(14)
        doc.setFontType('normal')

        text = dot_separators(array[k].invoice.lectureActual)
        doc.text(text, pdfX + 20, offsetY('right', pdfY - 250, null, text, doc), 'left', 90)
        text = dot_separators(array[k].invoice.lectureLast)
        doc.text(text, pdfX + 33, offsetY('right', pdfY - 250, null, text, doc), 'left', 90)

        if(array[k].invoice.lectureNewStart!==undefined){
            text = dot_separators(array[k].invoice.lectureNewStart)
            doc.text(text, pdfX + 46, offsetY('right', pdfY - 250, null, text, doc), 'left', 90)
            text = dot_separators(array[k].invoice.lectureNewEnd)
            doc.text(text, pdfX + 59, offsetY('right', pdfY - 250, null, text, doc), 'left', 90)
        }
        doc.setFontType('bold')
        text = dot_separators(array[k].invoice.lectureResult)
        doc.text(text, pdfX + 46 + pdfXLectureNew, offsetY('right', pdfY - 250, null, text, doc), 'left', 90)
        doc.setFontType('normal')
        
        text = dot_separators(parameters.consumptionLimit)
        doc.text(text, pdfX + 98, offsetY('right', pdfY - 250, null, text, doc), 'left', 90)
        if(array[k].invoice.lectureResult>parameters.consumptionLimit){
            text = dot_separators(array[k].invoice.lectureResult-parameters.consumptionLimit)
            doc.text(text, pdfX + 111, offsetY('right', pdfY - 250, null, text, doc), 'left', 90)
        }else{
            text = "0"
            doc.text(text, pdfX + 111, offsetY('right', pdfY - 250, null, text, doc), 'left', 90)
        }
        doc.setFontType('bold')
        text = dot_separators(array[k].invoice.lectureResult)
        doc.text(text, pdfX + 124, offsetY('right', pdfY - 250, null, text, doc), 'left', 90) //Consultar diferencia facturado vs calculado



        //////////////TABLA VALORES//////////////
        let value1 = 0 //Valor tributable
        let value2 = 0 //Valor no tributable
        let value3 = 0 //Saldo Anterior
        pdfY = 282
        pdfX -= 10
    
        doc.setFillColor(26, 117, 187)
        doc.rect(pdfX, pdfY - 262, 13, 265, 'F')
        
        pdfX += 10
        doc.setFontSize(12)
        doc.setFontType('bold')
        doc.setTextColor(255, 255, 255)
        doc.text('Detalle de consumos y servicio de este mes', pdfX, pdfY, 'left', 90)
    
        doc.setFontSize(14)
        doc.setFontType('normal')
        doc.setTextColor(0, 0, 0)
        doc.text('Cargo Fijo', pdfX + 20, pdfY, 'left', 90)
        doc.text('Consumo Agua Potable ', pdfX + 33, pdfY, 'left', 90)
        let pdfXTemp = 0
        if (array[k].invoice.subsidyPercentage > 0) {
            pdfXTemp = 13
            doc.setTextColor(249, 51, 6)
            doc.text('Subsidio (' + array[k].invoice.subsidyPercentage.toString() + '%)', pdfX + 33 + pdfXTemp, pdfY, 'left', 90)
        }
        doc.setTextColor(0, 0, 0)
        if (array[k].invoice.consumptionLimitTotal > 0) {
            pdfXTemp += 13
            doc.text('SobreConsumo', pdfX + 33 + pdfXTemp, pdfY, 'left', 90)
        }
        if(array[k].invoice.sewerage){
            pdfXTemp += 13
            doc.text('Alcantarillado', pdfX + 33 + pdfXTemp, pdfY, 'left', 90)
        }
        if(array[k].invoice.debtFine){
            pdfXTemp += 13
            doc.text('Interés por atraso', pdfX + 33 + pdfXTemp, pdfY, 'left', 90)
        }
        if(array[k].invoice.fine){ //Multa 20%
            pdfXTemp += 13
            doc.text('Recargo 20%', pdfX + 33 + pdfXTemp, pdfY, 'left', 90)
        }
    
        doc.setFontType('bold')
        doc.text('SubTotal Consumo Tributable', pdfX + 111, pdfY, 'left', 90)

        index = 85 + 39

        doc.setFontType('normal')
        if(array[k].invoice.agreements){
            let totalAgreement = 0
            for(let i=0; i<array[k].invoice.agreements.length; i++){
                totalAgreement += parseInt(array[k].invoice.agreements[i].amount)
                if(i+1==array[k].invoice.agreements.length && totalAgreement > 0){
                    index += 14
                    doc.setFontType('bold')
                    doc.text('Otros no Tributables', pdfX + index, pdfY, 'left', 90)
                    index += 14
                }
            }
        }
    
        doc.setFontType('bold')
        doc.text('Saldo Anterior', pdfX + index + 14, pdfY, 'left', 90)
    
        if(array[k].invoice.invoicePositive){
            doc.setTextColor(249, 51, 6)
            doc.text('Saldo a favor', pdfX + index + 28, pdfY, 'left', 90)
            doc.setTextColor(0, 0, 0)
        }
    
        doc.setFontSize(14)
        doc.setFontType('normal')
    
        text = dot_separators(array[k].invoice.charge)
        doc.text(text, pdfX + 20, offsetY('right', pdfY - 250, null, text, doc), 'left', 90)
        text = dot_separators(array[k].invoice.lectureResult * array[k].invoice.meterValue)
        doc.text(text, pdfX + 33, offsetY('right', pdfY - 250, null, text, doc), 'left', 90)
    
        pdfYTemp = 0
        if (array[k].invoice.subsidyPercentage > 0) {
            pdfYTemp = 13
            doc.setTextColor(249, 51, 6)
            text = '-' + dot_separators(array[k].invoice.subsidyValue)
            doc.text(text, pdfX + 33 + pdfYTemp, offsetY('right', pdfY - 250, null, text, doc), 'left', 90)
        }
        doc.setTextColor(0, 0, 0)
    
        if (array[k].invoice.consumptionLimitTotal > 0) {
            pdfYTemp += 13
            text = dot_separators(array[k].invoice.consumptionLimitTotal)
            doc.text(text, pdfX + 33 + pdfYTemp, offsetY('right', pdfY - 250, null, text, doc), 'left', 90)
        }
        if(array[k].invoice.sewerage){
            pdfYTemp += 13
            text = dot_separators(array[k].invoice.sewerage)
            doc.text(text, pdfX + 33 + pdfYTemp, offsetY('right', pdfY - 250, null, text, doc), 'left', 90)
        }
        if(array[k].invoice.debtFine){
            pdfYTemp += 13
            text = dot_separators(array[k].invoice.debtFine)
            doc.text(text, pdfX + 33 + pdfYTemp, offsetY('right', pdfY - 250, null, text, doc), 'left', 90)
        }
        if(array[k].invoice.fine){
            pdfYTemp += 13
            text = dot_separators(array[k].invoice.fine)
            doc.text(text, pdfX + 33 + pdfYTemp, offsetY('right', pdfY - 250, null, text, doc), 'left', 90)
        }
    
        doc.setFontType('bold')
        text = dot_separators(array[k].invoice.invoiceSubTotal)
        doc.text(text, pdfX + 111, offsetY('right', pdfY - 250, null, text, doc), 'left', 90)
        value1 = array[k].invoice.invoiceSubTotal
    
        index = 85 + 39


        doc.setFontType('normal')
        let totalAgreement = 0
        if(array[k].invoice.agreements){
            for(let i=0; i<array[k].invoice.agreements.length; i++){
                totalAgreement += parseInt(array[k].invoice.agreements[i].amount)
                if(i+1==array[k].invoice.agreements.length && totalAgreement > 0){
                    index += 14
                    doc.setFontType('bold')
                    text = dot_separators(totalAgreement)
                    doc.text(text, pdfX + index, offsetY('right', pdfY - 250, null, text, doc), 'left', 90)
                    index += 14
                    value2 = totalAgreement
                }
            }
        }
    
        doc.setFontType('bold')
        text = dot_separators(array[k].invoice.invoiceDebt)
        doc.text(text, pdfX + index + 14, offsetY('right', pdfY - 250, null, text, doc), 'left', 90)
        value3 = array[k].invoice.invoiceDebt
    
        if(array[k].invoice.invoicePositive){
            doc.setTextColor(249, 51, 6)
            text = '-' + dot_separators(array[k].invoice.invoicePositive)
            doc.text(text, pdfX + index + 28, offsetY('right', pdfY - 250, null, text, doc), 'left', 90)
            doc.setTextColor(0, 0, 0)
        }

        //////TOTALES Y CÓDIGO SII//////
        pdfX += 50
        
        doc.setFillColor(0, 0, 0)
        doc.rect(pdfX + 164, pdfY - 257, 38, 262, 'F')
        doc.setFillColor(21, 88, 141)
        doc.rect(pdfX + 166, pdfY - 255, 34, 258, 'F')
    
        doc.setFontSize(17)
        doc.setTextColor(255, 255, 255)
    
        doc.text('TOTAL A PAGAR', pdfX + 181, pdfY, 'left', 90)
        doc.text('$ ', pdfX + 181, offsetY('center', pdfY - 80, textMaxWidth, text, doc), 'left', 90)
        doc.setFontSize(20)
        text = dot_separators(array[k].invoice.invoiceTotal)
        doc.text(text, pdfX + 181, offsetY('right', pdfY - 250, null, text, doc), 'left', 90)
    
        doc.setFontSize(13)
        doc.text('FECHA VENCIMIENTO', pdfX + 198, pdfY, 'left', 90)
        text = moment(array[k].invoice.dateExpire).utc().format('DD/MM/YYYY')
        doc.text(text, pdfX + 198, offsetY('right', pdfY - 250, null, text, doc), 'left', 90)
    
        doc.setFontSize(10)
        doc.setFontType('normal')
        doc.setTextColor(0, 0, 0)
    
        if(docType=='preview'){
            doc.addImage(test2DImg, 'PNG', pdfX + 225, pdfY, 260, 106, null, null, 90)
        }else if(docType=='pdf'){
            
            if(array[k].invoice.seal){
                doc.setFillColor(255, 255, 255)
                doc.rect(pdfX + 225, pdfY - 260, 106, 260, 'F')
                doc.addImage(array[k].invoice.seal, 'PNG', pdfX + 326, pdfY - 106, 260, 106, null, null, 90)
            }
            textMaxWidth = 260
            if(docName2!='COMPROBANTE DE AVISO' && array[k].invoice.number!=0){
                text = 'Timbre Electrónico S.I.I.'
                doc.text(text, pdfX + 340, offsetY('center', pdfY, textMaxWidth, text, doc), 'left', 90)
                text = `Res. ${array[k].invoice.resolution.numero} del ${moment(array[k].invoice.resolution.fecha).format('DD-MM-YYYY')} Verifique Documento: www.sii.cl`
                doc.text(text, pdfX + 350, offsetY('center', pdfY, textMaxWidth, text, doc), 'left', 90)
            }else{
                text = 'Documento informativo, no válido como boleta'
                doc.text(text, pdfX + 340, offsetY('center', pdfY, textMaxWidth, text, doc), 'left', 90)
            }
        }
    

        ///////GRÁFICO CONSUMOS///////

        pdfX += 150
        pdfY = 582
        doc.setFontSize(10)
        doc.setFontType('bold')
        doc.setTextColor(0, 0, 0)
        doc.text('Su consumo en m3 durante los últimos 13 meses fue:', pdfX, pdfY, 'left', 90)


        doc.setDrawColor(0, 0, 0)
        doc.setLineWidth(1)
        pdfY -= 10
        doc.line(pdfX + 10, pdfY, pdfX + 120, pdfY)//Línea Izquierda
        doc.line(pdfX + 120, pdfY , pdfX + 120, pdfY - 250)//Línea Inferior

        //DEFINICIÓN DE LECTURAS A MOSTRAR (MÁXIMO 13)
        let lastInvoices = [], flag = 0, maxValue = 0
        for (let j = 0; j < array[k].lectures.length; j++) {
            if (array[k].lectures[j]._id == array[k].invoice.lectures._id) {
                flag++
            }

            if (flag > 0 && flag <= 13) {
                flag++

                if (array[k].lectures[j].invoice !== undefined) {
                    lastInvoices.push(array[k].lectures[j].invoice)
                    if (array[k].lectures[j].invoice.lectureResult > maxValue) {
                        maxValue = array[k].lectures[j].invoice.lectureResult
                    }
                }
            }
        }

        if(maxValue==0){
            maxValue = 1
        }
        let meterPoints = 100 / maxValue //Puntos en PDF por mt3
        
        pdfX += 25
        doc.setFontSize(7)
        doc.setFontType('normal')
    
        doc.setDrawColor(199, 199, 199)
    
        if (maxValue < 5) {
            pdfX -= 5
    
            //Línea límite según lectura máxima
            text = maxValue.toString()
            doc.text(text, pdfX + 2, offsetY('right', pdfY + 2, null, text, doc), 'left', 90)
            doc.line(pdfX, pdfY, pdfX, pdfY - 250)
    
            if (maxValue == 4) {
                text = '3'
                doc.text(text, (pdfX + 2) + 25, offsetY('right', pdfY + 2, null, text, doc), 'left', 90)
                text = '2'
                doc.text(text, (pdfX + 2) + 50, offsetY('right', pdfY + 2, null, text, doc), 'left', 90)
                text = '1'
                doc.text(text, (pdfX + 2) + 77, offsetY('right', pdfY + 2, null, text, doc), 'left', 90)
                doc.line(pdfX + 25, pdfY, pdfX + 25, pdfY - 250)
                doc.line(pdfX + 50, pdfY, pdfX + 50, pdfY - 250)
                doc.line(pdfX + 75, pdfY, pdfX + 75, pdfY - 250)
    
            } else if (maxValue == 3) {
                text = '2'
                doc.text(text, (pdfX + 2) + 34, offsetY('right', pdfY + 2, null, text, doc), 'left', 90)
                text = '1'
                doc.text(text, (pdfX + 2) + 69, offsetY('right', pdfY + 2, null, text, doc), 'left', 90)
                doc.line(pdfX + 34, pdfY, pdfX + 34, pdfY - 250)
                doc.line(pdfX + 69, pdfY, pdfX + 69, pdfY - 250)
            } else if (maxValue == 2) {
                text = '1'
                doc.text(text, (pdfX + 2) + 51, offsetY('right', pdfY + 2, null, text, doc), 'left', 90)
                doc.line(pdfX + 51, pdfY, pdfX + 51, pdfY - 250)
            }
    
            pdfX += 102
    
        } else if (maxValue % 4 == 0) {
            pdfX -= 5
            //Línea límite según lectura máxima
            text = maxValue.toString()
            doc.text(text, pdfX, offsetY('right', pdfY + 2, null, text, doc), 'left', 90)
            doc.line(pdfX, pdfY, pdfX, pdfY - 250)
    
            let min = parseInt(maxValue / 4)
            text = (min * 3).toString()
            doc.text(text, pdfX + (min * meterPoints), offsetY('right', pdfY + 2, null, text, doc), 'left', 90)
            text = (min * 2).toString()
            doc.text(text, pdfX + (min * 2 * meterPoints), offsetY('right', pdfY + 2, null, text, doc), 'left', 90)
            text = (min).toString()
            doc.text(text, pdfX + (min * 3 * meterPoints), offsetY('right', pdfY + 2, null, text, doc), 'left', 90)
    
            doc.line(pdfX + (min * meterPoints), pdfY, pdfX + (min * meterPoints), pdfY - 250)
            doc.line(pdfX + (min * 2 * meterPoints), pdfY, pdfX + (min * 2 * meterPoints), pdfY - 250)
            doc.line(pdfX + (min * 3 * meterPoints), pdfY, pdfX + (min * 3 * meterPoints), pdfY - 250)
    
            pdfX += 102
    
        } else {
            pdfX -= 5
            //Línea límite según lectura máxima
            text = maxValue.toString()
            doc.text(text, pdfX + (102 - (maxValue * meterPoints)), offsetY('right', pdfY + 2, null, text, doc), 'left', 90)
            doc.line(pdfX + (100 - (maxValue * meterPoints)), pdfY, pdfX  + (100 - (maxValue * meterPoints)), pdfY - 250)
    
            let min = parseInt(maxValue / 4)
    
            pdfX += 102
    
            text = (min * 4).toString()
            doc.text(text, (pdfX + 2) - (min * 4 * meterPoints), offsetY('right', pdfY + 2, null, text, doc), 'left', 90)
            text = (min * 3).toString()
            doc.text(text, (pdfX + 2) - (min * 3 * meterPoints), offsetY('right', pdfY + 2, null, text, doc), 'left', 90)
            text = (min * 2).toString()
            doc.text(text, (pdfX + 2) - (min * 2 * meterPoints), offsetY('right', pdfY + 2, null, text, doc), 'left', 90)
            text = (min).toString()
            doc.text(text, (pdfX + 2) - (min * meterPoints), offsetY('right', pdfY + 2, null, text, doc), 'left', 90)
    
            doc.line(pdfX - (min * meterPoints), pdfY, pdfX - (min * meterPoints), pdfY - 250)//Línea Inferior
            doc.line(pdfX - (min * 2 * meterPoints), pdfY, pdfX - (min * 2 * meterPoints), pdfY - 250)//Línea Inferior
            doc.line(pdfX - (min * 3 * meterPoints), pdfY, pdfX - (min * 3 * meterPoints), pdfY - 250)//Línea Inferior
            doc.line(pdfX - (min * 4 * meterPoints), pdfY, pdfX - (min * 4 * meterPoints), pdfY - 250)//Línea Inferior
        }
    
        text = '0'
        doc.text(text, pdfX, offsetY('right', pdfY + 2, null, text, doc), 'left', 90)
    
        //GRÁFICO DE CONSUMOS
        pdfX = 435
        pdfY = 338
        doc.setFontSize(8)

        for (let i = 0; i < lastInvoices.length; i++) {

            if (i == 0) {
                doc.setFillColor(23, 162, 184)
            } else {
                doc.setFillColor(82, 82, 82)
            }

            let offset = 100 - (lastInvoices[i].lectureResult * meterPoints) //Determina posición inicial respecto al máximo del gráfico
            doc.rect(pdfX + offset, pdfY, 99 - offset, 11, 'F')
            
            //Posición X (descendente)
            //Posición Y suma offset según lectura
            //11 = Ancho ~ 99 - offset = Largo
            textMaxWidth = 17 //Máximo de texto entre barras
            text = lastInvoices[i].lectureResult.toString()
            doc.text(text, pdfX + offset - 5, offsetY('center', (pdfY + 14), textMaxWidth, text, doc), 'left', 90)
            text = getMonthShortString(lastInvoices[i].lectures.month)
            doc.text(text, pdfX + 108, offsetY('center', (pdfY + 14), textMaxWidth, text, doc), 'left', 90)
            pdfY += 18
        }

        pdfX = 635
        pdfY = 582
        doc.setFontSize(10)
        doc.setFontType('bold')

        if(array[k].invoice.text1){
            doc.setTextColor(249, 51, 6)
            doc.text(array[k].invoice.text1, pdfX, pdfY, {maxWidth: (doc.internal.pageSize.getHeight() / valueWall) - 30, angle: 90})
        }
        if(array[k].invoice.text2){
            doc.setTextColor(0, 0, 0)
            doc.text(array[k].invoice.text2, pdfX + 12, pdfY, {maxWidth: (doc.internal.pageSize.getHeight() / valueWall) - 30, angle: 90})
            doc.text(array[k].invoice.text3, pdfX + 24, pdfY, {maxWidth: (doc.internal.pageSize.getHeight() / valueWall) - 30, angle: 90})
        }
    
        doc.setFillColor(26, 117, 187)
        //doc.rect(pdfX + 97, pdfY - 550, 17, doc.internal.pageSize.getHeight() - 57, 'F')
        doc.rect(pdfX + 97, pdfY - 550, 17, pdfY - 28, 'F')
    
        doc.setTextColor(255, 255, 255)
        doc.text('N° Teléfono oficina Comité: ' + parameters.phone + ' - Correo electrónico:  ' + parameters.email, doc.internal.pageSize.getWidth() - 48, pdfY, 'left', 90)
        

        if(k+1==array.length){
            window.open(doc.output('bloburl'), '_blank')
        }else{
            doc.addPage()
        }
    }
}


async function printFinalPortrait(array){

    let parametersData = await axios.get('/api/parameters')
    let parameters = parametersData.data

    let doc = new jsPDF('p', 'pt', 'letter')
    let docType = 'pdf'

    for(let k=0; k<array.length; k++){
        
        doc.setDrawColor(0, 0, 0)
        doc.setTextColor(0, 0, 0)
        doc.setFontType('normal')
        
        let docName1 = '', docName2 = 'EXENTA ELECTRÓNICA', memberName = '', siiValue = 'S.I.I. - CURICO'

        if (array[k].member.type == 'personal') {
            memberName = array[k].member.personal.name + ' ' + array[k].member.personal.lastname1 + ' ' + array[k].member.personal.lastname2
        } else {
            memberName = array[k].member.enterprise.name
        }
        console.log(array[k])
    
        if(array[k].invoice.type==41){
            docName1 = 'BOLETA NO AFECTA O'
        }else if(array[k].invoice.type==34){
            docName1 = 'FACTURA NO AFECTA O'
        }else if(array[k].invoice.type==0){
            docName1 = ''
            docName2 = 'COMPROBANTE DE AVISO'
            siiValue = ''
        }

        //let doc = new jsPDF('p', 'pt', [302, 451])

        let pdfX = 150
        let pdfY = 20

        doc.setFontSize(12)
        doc.addImage(logoWallImg, 'PNG', 0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight()) //Fondo

        doc.addImage(logoImg, 'PNG', 112, pdfY, 77, 60)
        pdfY += 60
        doc.text(`COMITÉ DE AGUA POTABLE RURAL`, pdfX, pdfY + 23, 'center')
        doc.text(`Y SERVICIOS SANITARIOS LOS CRISTALES`, pdfX, pdfY + 36, 'center')
        doc.text(`Los Cristales S/N - Curicó`, pdfX, pdfY + 49, 'center')


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
        if(array[k].invoice.number){
            doc.text('N° ' + array[k].invoice.number, pdfX + 310, pdfY + 50, 'center')
        }else{
            doc.text('N° -', pdfX + 310, pdfY + 50, 'center')
        }
        doc.setFontSize(11)
        doc.text(siiValue, pdfX + 310, pdfY + 75, 'center')

        doc.setDrawColor(0, 0, 0)
        doc.setTextColor(0, 0, 0)

        doc.setFontSize(10)
        doc.setFontType('normal')
        doc.text('Fecha Emisión ', pdfX + 220, pdfY + 100)
        doc.text('Mes de Pago ', pdfX + 220, pdfY + 113)

        doc.setFontType('bold')
        doc.text(moment(array[k].invoice.date).utc().format('DD / MM / YYYY'), pdfX + 300, pdfY + 100)
        doc.text(getMonthString(array[k].invoice.lectures.month) + ' / ' + array[k].invoice.lectures.year, pdfX + 300, pdfY + 113)


        pdfX = 30
        pdfY += 120
        doc.setFontSize(11)
        doc.text('SOCIO N° ' + array[k].member.number, pdfX, pdfY)
        doc.text('R.U.T ' + array[k].member.rut, pdfX, pdfY + 12)
        doc.setFontSize(12)
        doc.text(memberName.toUpperCase(), pdfX, pdfY + 24)
        let subsidyNumber = array[k].member.subsidyNumber.toString()
        while (subsidyNumber.length<11) {
            subsidyNumber = '0' + subsidyNumber
        }
        doc.setFontSize(11)
        doc.setFontType('normal')
        doc.text('MIDEPLAN ' + subsidyNumber, pdfX, pdfY + 36)
        doc.text('Sector: ' + array[k].member.address.sector.name, pdfX + 300, pdfY + 36)
        doc.setFontType('bold')

        pdfY += 60

        //////////////TABLA CONSUMOS//////////////
        doc.setFillColor(26, 117, 187)
        doc.rect(pdfX - 3, pdfY - 10, 265, 13, 'F')

        doc.setFontSize(12)
        doc.setFontType('bold')
        doc.setTextColor(255, 255, 255)
        doc.text('Consumo en m3 (1m3 = 1.000 lts de agua)', pdfX, pdfY)

        doc.setFontSize(14)
        doc.setFontType('normal')
        doc.setTextColor(0, 0, 0)
        
        let lastInvoice, flagLastInvoice = 0
        for (let j = 0; j < array[k].lectures.length; j++) {
            if(flagLastInvoice==1){
                if (array[k].lectures[j].invoice !== undefined) {
                    lastInvoice = array[k].lectures[j].invoice
                    j = array[k].lectures.length
                }
            }else{
                if (array[k].lectures[j]._id == array[k].invoice.lectures._id) {
                    flagLastInvoice++
                }
            }
        }

        //doc.text('Lectura Mes Actual ' + moment(array[k].invoice.date).utc().format('DD/MM/YYYY'), pdfX, pdfY + 20)
        //doc.text('Lectura Mes Anterior ' + ((lastInvoice) ? moment(lastInvoice.date).utc().format('DD/MM/YYYY') : ''), pdfX, pdfY + 33)
        doc.text('Lectura Mes Actual ', pdfX, pdfY + 20)
        doc.text('Lectura Mes Anterior ', pdfX, pdfY + 33)
        pdfYLectureNew = 0
        if(array[k].invoice.lectureNewStart!==undefined){
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


        doc.setFontSize(14)
        doc.setFontType('normal')

        doc.text(dot_separators(array[k].invoice.lectureActual), pdfX + 250, pdfY + 20, 'right')
        doc.text(dot_separators(array[k].invoice.lectureLast), pdfX + 250, pdfY + 33, 'right')

        if(array[k].invoice.lectureNewStart!==undefined){
            doc.text(dot_separators(array[k].invoice.lectureNewStart), pdfX + 250, pdfY + 46, 'right')
            doc.text(dot_separators(array[k].invoice.lectureNewEnd), pdfX + 250, pdfY + 59, 'right')
        }
        doc.setFontType('bold')
        doc.text(dot_separators(array[k].invoice.lectureResult), pdfX + 250, pdfY + 46 + pdfYLectureNew, 'right')
        doc.setFontType('normal')
        
        doc.text(dot_separators(parameters.consumptionLimit), pdfX + 250, pdfY + 98, 'right')
        if(array[k].invoice.lectureResult>parameters.consumptionLimit){
            doc.text(dot_separators(array[k].invoice.lectureResult-parameters.consumptionLimit), pdfX + 250, pdfY + 111, 'right')
        }else{
            doc.text("0", pdfX + 250, pdfY + 111, 'right')
        }
        doc.setFontType('bold')
        doc.text(dot_separators(array[k].invoice.lectureResult), pdfX + 250, pdfY + 124, 'right') //Consultar diferencia facturado vs calculado




        //////////////TABLA VALORES//////////////
        let value1 = 0 //Valor tributable
        let value2 = 0 //Valor no tributable
        let value3 = 0 //Saldo Anterior
        pdfX += 300

        doc.setFillColor(26, 117, 187)
        doc.rect(pdfX - 3, pdfY - 10, 265, 13, 'F')

        doc.setFontSize(12)
        doc.setFontType('bold')
        doc.setTextColor(255, 255, 255)
        doc.text('Detalle de consumos y servicios de este mes', pdfX, pdfY)

        doc.setFontSize(14)
        doc.setFontType('normal')
        doc.setTextColor(0, 0, 0)
        doc.text('Cargo Fijo', pdfX, pdfY + 20)
        doc.text('Consumo Agua Potable ', pdfX, pdfY + 33)
        let pdfYTemp = 0
        if (array[k].invoice.subsidyPercentage > 0) {
            pdfYTemp = 13
            doc.setTextColor(249, 51, 6)
            doc.text('Subsidio (' + array[k].invoice.subsidyPercentage.toString() + '%)', pdfX, pdfY + 33 + pdfYTemp)
        }
        doc.setTextColor(0, 0, 0)
        if (array[k].invoice.consumptionLimitTotal > 0) {
            pdfYTemp += 13
            doc.text('SobreConsumo', pdfX, pdfY + 33 + pdfYTemp)
        }
        if(array[k].invoice.sewerage){
            pdfYTemp += 13
            doc.text('Alcantarillado', pdfX, pdfY + 33 + pdfYTemp)
        }
        if(array[k].invoice.debtFine){
            pdfYTemp += 13
            doc.text('Interés por atraso', pdfX, pdfY + 33 + pdfYTemp)
        }
        if(array[k].invoice.fine){
            pdfYTemp += 13
            doc.text('Recargo 20%', pdfX, pdfY + 33 + pdfYTemp)
        }
        doc.setFontType('bold')
        doc.text('SubTotal Consumo Tributable', pdfX, pdfY + 111)

        index = 85 + 39

        doc.setFontType('normal')    
        if(array[k].invoice.agreements){
            let totalAgreement = 0
            for(let i=0; i<array[k].invoice.agreements.length; i++){
                totalAgreement += parseInt(array[k].invoice.agreements[i].amount)
                if(i+1==array[k].invoice.agreements.length && totalAgreement > 0){
                    //doc.text('Otros', pdfX, pdfY + index)
                    index += 14
                    doc.setFontType('bold')
                    doc.text('Otros no Tributables', pdfX, pdfY + index)
                    index += 14
                }
            }
        }

        doc.setFontType('bold')
        doc.text('Saldo Anterior', pdfX, pdfY + index + 14)
        if(array[k].invoice.invoicePositive){
            doc.setTextColor(249, 51, 6)
            doc.text('Saldo a favor', pdfX, pdfY + index + 28)
            doc.setTextColor(0, 0, 0)
        }

        doc.setFontSize(14)
        doc.setFontType('normal')

        doc.text(dot_separators(array[k].invoice.charge), pdfX + 250, pdfY + 20, 'right')
        doc.text(dot_separators(array[k].invoice.lectureResult * array[k].invoice.meterValue), pdfX + 250, pdfY + 33, 'right')

        pdfYTemp = 0
        if (array[k].invoice.subsidyPercentage > 0) {
            pdfYTemp = 13
            doc.setTextColor(249, 51, 6)
            doc.text('-' + dot_separators(array[k].invoice.subsidyValue), pdfX + 250, pdfY + 33 + pdfYTemp, 'right')
        }
        doc.setTextColor(0, 0, 0)
        if (array[k].invoice.consumptionLimitTotal > 0) {
            pdfYTemp += 13
            doc.text(dot_separators(array[k].invoice.consumptionLimitTotal), pdfX + 250, pdfY + 33 + pdfYTemp, 'right')
        }
        
        if(array[k].invoice.sewerage){
            pdfYTemp += 13
            doc.text(dot_separators(array[k].invoice.sewerage), pdfX + 250, pdfY + 33 + pdfYTemp, 'right')
        }
        if(array[k].invoice.debtFine){
            pdfYTemp += 13
            doc.text(dot_separators(array[k].invoice.debtFine), pdfX + 250, pdfY + 33 + pdfYTemp, 'right')
        }

        if(array[k].invoice.fine){
            pdfYTemp += 13
            doc.text(dot_separators(array[k].invoice.fine), pdfX + 250, pdfY + 33 + pdfYTemp, 'right')
        }
        doc.setFontType('bold')
        doc.text(dot_separators(array[k].invoice.invoiceSubTotal), pdfX + 250, pdfY + 111, 'right')
        value1 = array[k].invoice.invoiceSubTotal

        index = 85 + 39
        doc.setFontType('normal')
        let totalAgreement = 0
        if(array[k].invoice.agreements){
            for(let i=0; i<array[k].invoice.agreements.length; i++){
                totalAgreement += parseInt(array[k].invoice.agreements[i].amount)
                if(i+1==array[k].invoice.agreements.length && totalAgreement > 0){
                    //doc.text(dot_separators(totalAgreement), pdfX + 250, pdfY + index, 'right')
                    index += 14
                    doc.setFontType('bold')
                    doc.text(dot_separators(totalAgreement), pdfX + 250, pdfY + index, 'right')
                    index += 14
                    value2 = totalAgreement
                }
            }
        }

        doc.setFontType('bold')
        doc.text(dot_separators(array[k].invoice.invoiceDebt), pdfX + 250, pdfY + index + 14, 'right')
        value3 = array[k].invoice.invoiceDebt

        if(array[k].invoice.invoicePositive){
            doc.setTextColor(249, 51, 6)
            doc.text('-' + dot_separators(array[k].invoice.invoicePositive), pdfX, pdfY + index + 28)
            doc.setTextColor(0, 0, 0)
        }

        //////TOTALES Y CÓDIGO SII//////
        pdfY += 50
        /*doc.setFillColor(23, 162, 184)
        doc.rect(pdfX - 3, pdfY + 118, 260, 43, 'F')
    
        doc.text('Valor Tributable', pdfX, pdfY + 130)
        doc.text('Valor No Tributable', pdfX, pdfY + 143)
        doc.text('Saldo Anterior', pdfX, pdfY + 156)
        doc.text('+ $ ', pdfX + 180, pdfY + 130, 'center')
        doc.text('+ $ ', pdfX + 180, pdfY + 143, 'center')
        doc.text('+ $ ', pdfX + 180, pdfY + 156, 'center')
        doc.text(dot_separators(value1), pdfX + 250, pdfY + 130, 'right')
        doc.text(dot_separators(value2), pdfX + 250, pdfY + 143, 'right')
        doc.text(dot_separators(value3), pdfX + 250, pdfY + 156, 'right')*/
        
        doc.setFillColor(0, 0, 0)
        doc.rect(pdfX - 4, pdfY + 169, 262, 38, 'F')
        doc.setFillColor(21, 88, 141)
        doc.rect(pdfX - 2, pdfY + 171, 258, 34, 'F')
        doc.setFontSize(17)
        doc.setTextColor(255, 255, 255)
        doc.text('TOTAL A PAGAR', pdfX, pdfY + 185)
        doc.text('$ ', pdfX + 155, pdfY + 185, 'center')
        doc.setFontSize(20)
        doc.text(dot_separators(array[k].invoice.invoiceTotal), pdfX + 250, pdfY + 185, 'right')

        doc.setFontSize(13)
        doc.text('FECHA VENCIMIENTO', pdfX, pdfY + 203)
        doc.text(moment(array[k].invoice.dateExpire).utc().format('DD/MM/YYYY'), pdfX + 250, pdfY + 203, 'right')


        doc.setFontSize(10)
        doc.setFontType('normal')
        doc.setTextColor(0, 0, 0)

        if(docType=='preview'){
            doc.addImage(test2DImg, 'PNG', pdfX, pdfY + 220, 260, 106)
        }else if(docType=='pdf'){
            console.log(array[k].invoice.seal)
            if(array[k].invoice.seal){
                doc.setFillColor(255, 255, 255)
                doc.rect(pdfX, pdfY + 225, 260, 106, 'F')
                doc.addImage(array[k].invoice.seal, 'PNG', pdfX, pdfY + 225, 260, 106)

                //doc.text('Timbre Electrónico S.I.I. ', pdfX + 130, pdfY + 335, 'center')
                //doc.text(`Res. ${array[k].invoice.resolution.numero} del ${moment(array[k].invoice.resolution.fecha).format('DD-MM-YYYY')} Verifique Documento: www.sii.cl`, pdfX + 130, pdfY + 345, 'center')
            }

            if(docName2!='COMPROBANTE DE AVISO'){
                text = 'Timbre Electrónico S.I.I.'
                doc.text(text, pdfX + 130, pdfY + 340, 'center')
                text = `Res. ${array[k].invoice.resolution.numero} del ${moment(array[k].invoice.resolution.fecha).format('DD-MM-YYYY')} Verifique Documento: www.sii.cl`
                doc.text(text, pdfX + 130, pdfY + 350, 'center')
            }else{
                text = 'Documento informativo, no válido como boleta'
                doc.text(text, pdfX + 130, pdfY + 340, 'center')
            }
        }

        ///////GRÁFICO CONSUMOS///////

        pdfX = 30
        pdfY += 150
        doc.setFontSize(10)
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
        for (let j = 0; j < array[k].lectures.length; j++) {
            if (array[k].lectures[j]._id == array[k].invoice.lectures._id) {
                flag++
            }

            if (flag > 0 && flag <= 13) {
                flag++

                if (array[k].lectures[j].invoice !== undefined) {
                    lastInvoices.push(array[k].lectures[j].invoice)
                    if (array[k].lectures[j].invoice.lectureResult > maxValue) {
                        maxValue = array[k].lectures[j].invoice.lectureResult
                    }
                }
            }
        }

        if(maxValue==0){
            maxValue = 1
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
    console.log('Num',array[k].invoice.number)
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
        pdfY += 210
        doc.setFontSize(10)
        doc.setFontType('bold')
        //doc.text('CORTE EN TRÁMITE A PARTIR DEL DÍA: ', pdfX, pdfY)
        /*if(array[k].invoice.text1){
            doc.setTextColor(249, 51, 6)
            doc.text(array[k].invoice.text1, pdfX, pdfY, {maxWidth: doc.internal.pageSize.getWidth() - 60})
        }
        if(array[k].invoice.text2){
            doc.setTextColor(0, 0, 0)
            doc.text(array[k].invoice.text2, pdfX, pdfY + 12, {maxWidth: doc.internal.pageSize.getWidth() - 60})
            doc.text(array[k].invoice.text3, pdfX, pdfY + 24, {maxWidth: doc.internal.pageSize.getWidth() - 60})
        }*/

        if(array[k].invoice.text1){
            doc.setTextColor(249, 51, 6)
            doc.text(array[k].invoice.text1, pdfX, pdfY, {maxWidth: doc.internal.pageSize.getWidth() - 30})
        }
        if(array[k].invoice.text2){
            doc.setTextColor(0, 0, 0)
            doc.text(array[k].invoice.text2, pdfX, pdfY + 12, {maxWidth: doc.internal.pageSize.getWidth() - 30})
            doc.text(array[k].invoice.text3, pdfX, pdfY + 24, {maxWidth: doc.internal.pageSize.getWidth() - 30})
        }
        
        doc.setFillColor(26, 117, 187)
        doc.rect(pdfX - 3, doc.internal.pageSize.getHeight() - 60, doc.internal.pageSize.getWidth() - 57, 17, 'F')

        doc.setTextColor(255, 255, 255)
        doc.text('N° Teléfono oficina Comité: ' + parameters.phone + ' - Correo electrónico:  ' + parameters.email, pdfX, doc.internal.pageSize.getHeight() - 48)


        if(k+1==array.length){
            window.open(doc.output('bloburl'), '_blank')
        }else{
            doc.addPage()
        }
    }

}