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

let members = []
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

    //chargeMembersTable()
})

async function getParameters() {

    let firstYear = 2021
    for (let i = firstYear; i <= moment().format('YYYY'); i++) {
        $("#searchYear").append(`<option value="${i}">${i}</option>`)
    }
    $("#searchYear").val(moment().format('YYYY'))
    //$("#searchMonth").val(moment().format('MM'))
    $("#searchMonth").val('05')

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
    serviceList += `</select></td><td>
                        <input type="text" class="form-control form-control-sm serviceValue" style="text-align: right" value="0"/>
                    </td></tr>`

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
                    //$(row).find('td:eq(4)').html(dot_separators(data.lastLecture))
                    //$(row).find('td:eq(5)').html(dot_separators(data.lastLecture))
                    // $('td', row).css('background-color', 'White');
                },
                columns: [
                    { data: 'number' },
                    { data: 'typeString' },
                    { data: 'name' },
                    { data: 'address' },
                    { data: 'lastLecture' },
                    { data: 'lecture' },
                    { data: 'value' },
                    { data: 'date' }
                ],
                initComplete: function (settings, json) {
                    getMembers()
                },
                draw: function (){
                    $(".lectureValue").each(function() {
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

                }
            })

        $('#tableMembers tbody').off("click")

        /*$('#tableMembers tbody').on('click', 'tr', function () {
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

async function getMembers() {
    let query = {
        sector: $("#searchSector").val(), 
        year: $("#searchYear").val(), 
        month: $("#searchMonth").val()
    }
    let lecturesData = await axios.post('api/lecturesSectorMembersManual', query)
    members = lecturesData.data

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
            el.address = el.address.address
            
            el.lastLecture = 0
            el.lecture = `<input id="lecture-${el._id}" onkeyup="calculateValue('${el._id}')" class="form-control form-control-sm lectureValue" style="text-align: center" value="0"></input>`
            el.value = 0
            el.date = ''
            if(el.lectureLast){
                el.lastLecture = el.lectureLast.logs[el.lectureLast.logs.length-1].lecture
            }
            if(el.lectures){
                el.lecture = `<input id="lecture-${el._id}" onkeyup="calculateValue('${el._id}')" class="form-control form-control-sm lectureValue" style="text-align: center" value="${dot_separators(el.lectures.logs[el.lectures.logs.length-1].lecture)}"></input>`
                el.date = moment(el.lectures.logs[el.lectures.logs.length-1].date).utc().format('DD/MM/YYYY HH:mm')
                el.value = dot_separators(el.lectures.logs[el.lectures.logs.length-1].lecture - el.lastLecture)
            }

            //el.lastLecture = `<span id="lectureLast-${el._id}">${el.lastLecture}</span>`
            el.lastLecture = `<span id="lectureLast-${el._id}">${dot_separators(el.lastLecture)}</span>`
            //el.lastLecture = `<span id="lectureLast">${el.lastLecture}</span>`
            el.value = `<span id="lectureValue-${el._id}">${el.value}</span>`

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
    if($("#searchSector").val()!=0){
        chargeMembersTable()
    }else{
        toastr.warning('Debe seleccionar un sector')
    }
})

$('#saveLectures').on('click', async function () {

    let array = []
    
    for(let i=0; i < members.length; i++){
        console.log($("#lecture-"+members[i]._id).css('border'))

        //Gris por defecto: rgba(0, 0, 0, 0.1)
        //Rojo: rgb(0, 0, 0, 0.1)
        //Azul: rgb(69, 130, 236)

        if($("#lecture-"+members[i]._id).css('border') == '1px solid rgb(231, 76, 60)'){
            i = members.length
            toastr.error('Debe corregir los registros marcados en rojo antes de almacenar')

        }else if($("#lecture-"+members[i]._id).css('border') == '1px solid rgb(69, 130, 236)'){
            array.push({
                users: userCredentials._id,
                date: moment().format('YYYY-MM-DD[T]HH:mm:ss.SSS[Z]'),
                year: 2022, //MODIFICAR
                month: 5, //MODIFICAR
                member: members[i]._id,
                lecture: replaceAll($("#lecture-"+members[i]._id).val(), '.', '').replace(' ', '')
            })
        }

        if(i+1==members.length){
            console.log(array)
            if(array.length>0){
                //ALMACENADO...
            }else{
                toastr.warning('No se han realizado cambios')
            }
        }
    }
    


    

})

function calculateValue(member){
    
    let lectureLast = replaceAll($("#lectureLast-"+member).text(), '.', '')
    let lecture = 0
    let value = 0

    let lectureInput = replaceAll($("#lecture-"+member).val(), '.', '').replace(' ', '')

    if($.isNumeric(lectureInput)){
        lecture = lectureInput

        if(parseInt(lecture)>=parseInt(lectureLast)){
            value = lecture - lectureLast

            let memberData = members.find(x => x._id.toString() == member)
            if(memberData.lectures){
                if(memberData.lectures.logs[memberData.lectures.logs.length-1].lecture==lectureInput){
                    $("#lecture-"+member).css('border', '')
                }else{
                    $("#lecture-"+member).css('border', '1px solid #4582EC')
                }
            }else{
                $("#lecture-"+member).css('border', '1px solid #4582EC')
            }

        }else{
            $("#lecture-"+member).css('border', '1px solid #E74C3C')
        }

    }else{
        console.log('here')
        $("#lecture-"+member).css('border', '1px solid #E74C3C')
    }

    

    $("#lectureValue-"+member).text(dot_separators(value))
}

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


async function printList() {

    let doc = new jsPDF('p', 'pt', 'letter')
    //let doc = new jsPDF('p', 'pt', [302, 451])

    let pdfX = 30
    let pdfY = 20
    let page = '1'

    doc.setFontSize(24)
    doc.addImage(logoWallImg, 'PNG', 0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight()) //Fondo

    doc.addImage(logoImg, 'PNG', 30, pdfY, 77, 60)
    pdfY += 20
    doc.text(`PLANILLA DE TOMA DE ESTADO`, doc.internal.pageSize.getWidth() / 2, pdfY, 'center')

    doc.setFontSize(10)
    doc.text(`Mes:`, pdfX + 90 , pdfY + 20)
    doc.text(`Año:`, pdfX + 90, pdfY + 33)
    doc.text(`Sector: `, pdfX + 90, pdfY + 46)
    doc.text($("#searchMonth option:selected").text(), pdfX + 140 , pdfY + 20)
    doc.text($("#searchYear option:selected").text(), pdfX + 140, pdfY + 33)
    doc.text($("#searchSector option:selected").text(), pdfX + 140, pdfY + 46)
    doc.text(moment().utc().format('DD-MM-YYYY'), doc.internal.pageSize.getWidth() - 40, pdfY + 20, 'right')
    doc.text(page, doc.internal.pageSize.getWidth() - 40, pdfY + 33, 'right')

    pdfY += 50

    let tableColumns = ['Registro', 'Socio', 'Dirección', 'L. Anterior','L. Actual', 'Observación']
    let tableRows = []

    console.log(members)
    
    for(let i=0; i < members.length; i++){

        let memberName = ''

        if (members[i].type == 'personal') {
            memberName = members[i].personal.name + ' ' + members[i].personal.lastname1 + ' ' + members[i].personal.lastname2
        } else {
            memberName = members[i].enterprise.name
        }

        let lastLecture = 0
        if(members[i].lectureLast){
            lastLecture = dot_separators(members[i].lectureLast.logs[members[i].lectureLast.logs.length-1].lecture)
        }
        tableRows.push([members[i].number, memberName, members[i].address, lastLecture, '', ''])
    }
    

    doc.autoTable(tableColumns, tableRows, {
        /*createdCell: function (cell, data) {
            cell.styles.fillColor = 'rgb(107,165,57)'
            cell.styles.textColor = '#FFFFFF'
            cell.styles.fontStyle = 'bold'
            tableFinal = data.table
        },*/
        theme: 'grid',
        headerStyles: {lineWidth: 0.1, lineColor: [0, 0, 0]},
        bodyStyles: {lineColor: [0, 0, 0]},
        columnStyles:{
            0: {halign:'center'},
            3: {halign:'right'}
        },
        styles: {
            fontSize: 8,
            /*fillColor: 'rgb(107,165,57)',
            textColor: '#000000',
            halign: 'center'*/
        },
        margin: {
            top: pdfY + 5
        }
    })


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