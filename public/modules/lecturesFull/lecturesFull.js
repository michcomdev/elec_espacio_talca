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

                    let typeDTE = el.invoice.type
                    if(el.invoice.invoiceSubTotal==0){
                        typeDTE = 0
                    }
                    internals.invoices.push({
                        id: el.invoice._id,
                        lectures: el.invoice.lectures._id,
                        member: el.invoice.members,
                        memberType: el.members.type,
                        type: typeDTE,
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
                        el.selectPrint = `<input style="display: none" type="checkbox" class="chkPrintClassFull" data-member-id="${el.members._id}" data-invoice-id="${el.invoice._id}" data-member-type="${el.members.type}"/>`
                    }else{
                        el.selectPrint = `<input type="checkbox" class="chkPrintClass" id="chkPrint${el.members._id}" data-member-id="${el.members._id}" data-invoice-id="${el.invoice._id}" data-member-type="${el.members.type}"/>
                        <input style="display: none" type="checkbox" class="chkPrintClassFull" data-member-id="${el.members._id}" data-invoice-id="${el.invoice._id}" data-member-type="${el.members.type}"/>`
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
            let invoicesDebtData = await axios.post('/api/invoicesDebt', { 
                member: array[i].members._id,
                year: parseInt(array[i].year),
                month: parseInt(array[i].month)
            })
            let invoicesDebt = invoicesDebtData.data

            console.log(array[i].members.number, invoicesDebt)

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

            if(subTotal==0){
                typeDTE = 0
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
        let arraySend = []
        
        for(let i=0; i<internals.invoices.length; i++){
            if($("#chk"+internals.invoices[i].member).prop('checked')){


                //TEST DELAY 2 SEGUNDOS POR PETICIÓN
                console.log(internals.invoices[i])
                if(!internals.invoices[i].id){

                    let saveInvoice = await axios.post('/api/invoiceSave', internals.invoices[i])
                    console.log(saveInvoice.data)
                    if (saveInvoice.data) {
                        if (saveInvoice.data._id) {
                            arraySend.push({
                                memberType: internals.invoices[i].memberType,
                                member: internals.invoices[i].member,
                                id: saveInvoice.data._id
                            })
                        }
                    }
                }else{
                    let updateInvoice = await axios.post('/api/invoiceUpdate', internals.invoices[i])
                    console.log(updateInvoice.data)
                    if (updateInvoice.data) {
                        if (updateInvoice.data._id) {
                            arraySend.push({
                                memberType: internals.invoices[i].memberType,
                                member: internals.invoices[i].member,
                                id: updateInvoice.data._id
                            })
                        }
                    }
                }

                if(i+1==internals.invoices.length){
                    console.log(arraySend)
                    let j = 0
                    let interval = setInterval(async () => {
                        await sendData(arraySend[j].memberType,arraySend[j].member,arraySend[j].id)
                        console.log(j,arraySend[j].memberType,arraySend[j].member,arraySend[j].id)
                        progressValue++
                        progressBar()
                        j++
                        if(j==arraySend.length){
                            clearInterval(interval)
                        }
                    }, 2000)
                }
                
                /*CÓDIGO ORIGINAL
                console.log(internals.invoices[i])
                if(!internals.invoices[i].id){

                    let saveInvoice = await axios.post('/api/invoiceSave', internals.invoices[i])
                    console.log(saveInvoice.data)
                    if (saveInvoice.data) {
                        if (saveInvoice.data._id) {
                            //progressIndex++
                            await sendData(internals.invoices[i].memberType,internals.invoices[i].member,saveInvoice.data._id)
                        }
                    }
                }else{
                    let updateInvoice = await axios.post('/api/invoiceUpdate', internals.invoices[i])
                    console.log(updateInvoice.data)
                    if (updateInvoice.data) {
                        if (updateInvoice.data._id) {
                            //progressIndex++
                            await sendData(internals.invoices[i].memberType,internals.invoices[i].member,updateInvoice.data._id)
                        }
                    }
                }
                */
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
        let invoicesDebtData = await axios.post('/api/invoicesDebt', { 
            member: memberID,
            year: parseInt(year),
            month: parseInt(monthDue)
        })
        let invoicesDebt = invoicesDebtData.data

        console.log(memberID, invoicesDebt, parseInt(year), parseInt(month))

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
    console.log('invoicetype', invoice.type)

    if(parameters.receiptState || invoice.type==0){

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
        progressValue++
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
            progressValue++
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
            progressValue++
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

async function printMultiple(chk) {
    let full = ''
    if(chk){
        full = 'Full'
    }

    if(!$.fn.DataTable.isDataTable('#tableMembers')) {
        toastr.warning('Debe filtrar un sector')
        return
    }
    internals.members.table.column(0).visible(false)
    internals.members.table.column(1).visible(true)

    let array = []

    let count = 0
    $(".chkPrintClass"+full).each(function() {
        //if($(this).prop('checked')){
            count++
        //}
    })

    console.log(count)

    
    if(count>0){
        loadingHandler('start')
        let countIndex = 0
        $(".chkPrintClass"+full).each(async function() {
            //if($(this).prop('checked')){
                let object = {}
                let memberData = await axios.post('/api/memberSingle', {id: $(this).attr('data-member-id') })
                object.member = memberData.data

                let invoiceData = await axios.post('/api/invoiceSingle', { id: $(this).attr('data-invoice-id') })
                object.invoice = invoiceData.data

                let lecturesData = await axios.post('/api/lecturesSingleMember', { member: $(this).attr('data-member-id') })
                object.lectures = lecturesData.data

                let invoicesDebtData = await axios.post('/api/invoicesDebt', { 
                    member: $(this).attr('data-member-id'),
                    year: parseInt(object.invoice.lectures.year),
                    month: parseInt(object.invoice.lectures.month),
                    print: object.invoice.date, //Fecha de boleta
                    invoiceID: $(this).attr('data-invoice-id')
                })
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
                object.invoice.debt = debt


                
                array.push(object)
                countIndex++
                if(countIndex==count){
                    loadingHandler('stop')
                    if(!chk){
                        array.sort((a,b) => (a.member.orderIndex > b.member.orderIndex) ? 1 : ((b.member.orderIndex > a.member.orderIndex) ? -1 : 0))
                    }else{
                        array.sort((a,b) => (a.invoice.number > b.invoice.number) ? 1 : ((b.invoice.number > a.invoice.number) ? -1 : 0))
                    }
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

    $("#progressTitle").text('Generando boleta ' + progressValue + ' de '+ progressTotal)
    let percentage = parseInt(100 / progressTotal * progressValue)
    $("#progressBar").css('width', percentage + '%')

    if(progressTotal==progressValue){
        toastr.success('Boletas generadas, se recargarán los registros en 3 segundos')
        setTimeout(async () => {
            $('#modalProgress').modal('hide')
            chargeMembersTable()
        }, 3000)
    }

}




