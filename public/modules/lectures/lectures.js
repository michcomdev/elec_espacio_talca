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

$(document).ready(async function () {
    $('#searchDate').daterangepicker({
        opens: 'left',
        locale: dateRangePickerDefaultLocale,
        startDate: moment().add(-1,'months')
        //endDate: moment()
    }, function(start, end, label) {
        //internals.initDate = start.format('YYYY-MM-DD')
        //internals.endDate = end.format('YYYY-MM-DD')
    })

    chargeMembersTable()
    //getParameters()
})

async function getParameters() {
    let clientsData = await axios.get('api/clients')
    clients = clientsData.data

}

function chargeMembersTable() {
    try {
        if($.fn.DataTable.isDataTable('#tableMembers')){
            internals.members.table.clear().destroy()
        }
        internals.members.table = $('#tableMembers')
        .DataTable( {
            dom: 'Bfrtip',
            buttons: [
              'excel'
            ],
            iDisplayLength: 50,
            oLanguage: {
              sSearch: 'buscar: '
            },
            lengthMenu: [[50, 100, 500, -1], [50, 100, 500, 'Todos los registros']],
            language: {
                url: spanishDataTableLang
            },
            responsive: false,
            columnDefs: [{targets: [0,1,3,4], className: 'dt-center'}],
            order: [[ 0, 'desc' ]],
            ordering: true,
            rowCallback: function( row, data ) {
                //$(row).find('td:eq(1)').html(moment.utc(data.date).format('DD/MM/YYYY'))
                $(row).find('td:eq(3)').html(dot_separators(data.lastLecture))
          },
          columns: [
            { data: 'number' },
            { data: 'typeString' },
            { data: 'name' },
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
            } else {
                internals.members.table.$('tr.selected').removeClass('selected')
                $(this).addClass('selected')
                $('#updateLectures').prop('disabled', false)
                //internals.members.data = internals.members.table.row($(this)).data()
                internals.dataRowSelected = internals.members.table.row($(this)).data()
            }
        })
      } catch (error) {
        console.log(error)
      }

}

async function getMembers() {
    let lecturesData = await axios.get('api/memberLectures')

    if (lecturesData.data.length > 0) {
        let formatData= lecturesData.data.map(el => {
            //el.datetime = moment(el.datetime).format('DD/MM/YYYY HH:mm')
            if(el.type=='personal'){
                el.typeString = 'PERSONA'
                el.name = el.personal.name + ' ' + el.personal.lastname1 + ' ' + el.personal.lastname2
            }else{
                el.typeString = 'EMPRESA'
                el.name = el.enterprise.name
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

    let memberData = await axios.post('/api/memberSingle', {id: internals.dataRowSelected._id})
    let member = memberData.data
    $('#lectureModal').modal('show')

    let name = ''
    let type = ''
    if(member.type=='personal'){
        type = 'PERSONAL'
        name = member.personal.name + ' ' + member.personal.lastname1 + ' ' + member.personal.lastname2
    }else{
        type = 'EMPRESA'
        name = member.enterprise.name
    }

    $('#modalLecture_title').html(`Lecturas Socio N° ${ member.number} - ${ member.personal.name + ' ' + member.personal.lastname1 + ' ' + member.personal.lastname2}`)
    createModalBody()
    
    $('#modalLecture_footer').html(`
        <button class="btn btn-dark" data-dismiss="modal">
            <i ="color:#E74C3C;" class="fas fa-times"></i> CERRAR
        </button>
    `)

    $('#memberNumber').val(member.number)
    $('#memberType').val(type)
    $('#memberRUT').val(member.rut)
    $('#memberName').val(name)
    $('#memberWaterMeter').val(member.waterMeters.find(x => x.state === 'Activo').number)
    $('#memberAddress').val(member.address.address)
    //$('#saleDate').val(moment.utc(sale.date).format('DD/MM/YYYY'))
    //$('#saleNet').val(dot_separators(sale.net))

    loadLectures(member)


    /*
    $('#saleDate').daterangepicker({
        opens: 'left',
        locale: dateRangePickerDefaultLocale,
        singleDatePicker: true,
        autoApply: true
        //endDate: moment()
    }, function(start, end, label) {
        //internals.initDate = start.format('YYYY-MM-DD')
        //internals.endDate = end.format('YYYY-MM-DD')
    })*/

   
    /*$('#saveSale').on('click', async function () {

        let products = []
        let services = []
        let goSave = false

        if($("#tableLecturesBody tr").length>0 || $("#tableServicesBody tr").length>0){
            goSave = true
        }
        $("#tableLecturesBody tr").each(function(){
            if($($($(this).children()[0]).children()[1])){

                if($($($(this).children()[0]).children()[1]).val()==0 || !$.isNumeric($($($(this).children()[2]).children()[1]).val()) || !$.isNumeric($($($(this).children()[3]).children()[0]).val())){
                    goSave = false
                }
                products.push({
                    products: $($($(this).children()[0]).children()[1]).val(),
                    quantity: parseInt($($($(this).children()[2]).children()[1]).val()),
                    value: parseInt($($($(this).children()[3]).children()[0]).val())
                })
            }
        })

        $("#tableServicesBody tr").each(function(){
            if($($($(this).children()[0]).children()[1])){

                if($($($(this).children()[0]).children()[1]).val()==0 || !$.isNumeric($($($(this).children()[2]).children()[1]).val()) || !$.isNumeric($($($(this).children()[3]).children()[0]).val())){
                    goSave = false
                }
                services.push({
                    services: $($($(this).children()[0]).children()[1]).val(),
                    quantity: parseInt($($($(this).children()[2]).children()[1]).val()),
                    value: parseInt($($($(this).children()[3]).children()[0]).val())
                })
            }
        })

        if(!goSave){
            toastr.warning('Debe ingresar productos con valores correctos')
            return
        }

        let saleData = {
            id: internals.dataRowSelected._id,
            date: $("#saleDate").data('daterangepicker').startDate.format('YYYY-MM-DD'),
            rut: $('#saleRUT').val(),
            name: $('#saleName').val(),
            address: $('#saleAddress').val(),
            status: $('#saleStatus').val(),
            net: replaceAll($('#saleNet').val(), '.', '').replace(' ', ''),
            iva: replaceAll($('#saleIVA').val(), '.', '').replace(' ', ''),
            total: replaceAll($('#saleTotal').val(), '.', '').replace(' ', ''),
            payment: $('#salePayment').val(),
            paymentVoucher: $('#salePaymentVoucher').val(),
            type: 'MANUAL'
        }

        
        if(products.length>0){
            saleData.products = products
        }
        if(services.length>0){
            saleData.services = services
        }
        
        
        const res = validateInvoiceData(saleData)
        if(res.ok){
            let updateLectures = await axios.post('/api/saleUpdate', res.ok)
            if(updateLectures.data){
                if(updateLectures.data._id){
                    $('#lectureModal').modal('hide')

                    $('#modal_title').html(`Almacenado`)
                    $('#modal_body').html(`<h5 class="alert-heading">Boleta almacenada correctamente</h5>`)
                    chargeMembersTable()
                }else{
                    $('#modal_title').html(`Error`)
                    $('#modal_body').html(`<h5 class="alert-heading">Error al almacenar, favor reintente</h5>`)
                }
            }else{
                $('#modal_title').html(`Error`)
                $('#modal_body').html(`<h5 class="alert-heading">Error al almacenar, favor reintente</h5>`)
            }
            $('#modal').modal('show')
        }

    })*/
})


async function loadLectures(member){
    console.log("member",member)

    let lectureData = await axios.post('/api/lecturesSingleMember', {member: internals.dataRowSelected._id})
    let lectures = lectureData.data

    console.log("lectures",lectures)

    $('#tableLecturesBody').html('')

    for(i=0;i<lectures.length;i++){

        let total = 0
        let btn = '', btnGenerate = '', btnSII = ''
        let invoiceID = 0
        if(lectures[i].invoice){
            total = dot_separators(lectures[i].invoice.invoiceTotal)
            btn = `<button class="btn btn-sm btn-info" onclick="printInvoice('preview','${member.type}','${member._id}','${lectures[i].invoice._id}')"><i class="far fa-eye" style="font-size: 14px;"></i></button>`
            invoiceID = lectures[i].invoice._id
            
            if(lectures[i].invoice.number){
                btnGenerate = `<button class="btn btn-sm btn-danger" onclick="printInvoice('pdf','${member.type}','${member._id}','${lectures[i].invoice._id}')"><i class="far fa-file-pdf" style="font-size: 14px;"></i></button>`
            }else{
                btnGenerate = `<button class="btn btn-sm btn-info" onclick="sendData('${member.type}','${member._id}','${lectures[i].invoice._id}')">Generar DTE</button>`
            }
            if(lectures[i].invoice.token){
                btnSII = `<button class="btn btn-sm btn-warning" onclick="showSIIPDF('${lectures[i].invoice.token}')"><img src="/public/img/logo_sii.png" style="width: 24px"/></button>`
            }
        }else{
            total = 'NO CALCULADO'
            btn = `<button class="btn btn-sm btn-dark" disabled><i class="far fa-eye" style="font-size: 14px;"></i></button>`
            btnGenerate = `<button class="btn btn-sm btn-dark" disabled><i class="far fa-file-pdf" style="font-size: 14px;"></i></button>`
        }
        
        $('#tableLecturesBody').append(`
            <tr id="${lectures[i]._id}" data-invoice="${invoiceID}">
                <td style="text-align: center;">
                    ${getMonthString(lectures[i].month)}
                </td>
                <td style="text-align: center;">
                    ${moment.utc(lectures[i].logs[lectures[i].logs.length-1].date).format('DD/MM/YYYY')}
                </td>
                <td style="text-align: center;">
                    ${dot_separators(lectures[i].logs[lectures[i].logs.length-1].lecture)}
                </td>
                <td style="text-align: center;">
                    ${total}
                </td>
                <td style="text-align: center;">
                    POR PAGAR
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
            </tr>
        `)
    }

    $('#tableLectures tbody').off("click")

    $('#tableLectures tbody').on('click', 'tr', function () {
        if ($(this).hasClass('table-primary')) {
            $(this).removeClass('table-primary')
            $('#tableInvoice').css('visibility', 'hidden')
        } else {
            $('#tableLecturesBody > tr').removeClass('table-primary')
            $(this).addClass('table-primary')
            $('#tableInvoice').css('visibility', 'visible')
            createInvoice($(this).attr('id'),$(this).attr('data-invoice'),member)
        }
    })

}

function validateInvoiceData(productData) {
    let errorMessage = ''
    
    /*if(!$.isNumeric(productData.number)){
        errorMessage += '<br>Número de Boleta/Factura'
    }*/
    if(!$.isNumeric(productData.charge)){
        errorMessage += '<br>Cargo Fijo'
    }
    if(!$.isNumeric(productData.lectureActual)){
        errorMessage += '<br>Lecture Actual'
    }
    if(!$.isNumeric(productData.lectureLast)){
        errorMessage += '<br>Lecture Anterior'
    }
    if(!$.isNumeric(productData.lectureResult)){
        errorMessage += '<br>Consumo mts<sup>3</sup>'
    }
    if(!$.isNumeric(productData.meterValue)){
        errorMessage += '<br>Valor mts<sup>3</sup>'
    }
    if(!$.isNumeric(productData.subsidyPercentage)){
        errorMessage += '<br>Porcentaje Subsidio'
    }
    if(!$.isNumeric(productData.subsidyValue)){
        errorMessage += '<br>Valor Subsidio'
    }
    if(!$.isNumeric(productData.consumption)){
        errorMessage += '<br>Consumo a Cobro'
    }
    if(!$.isNumeric(productData.invoiceDebt)){
        errorMessage += '<br>Deuda Anterior'
    }
    if(!$.isNumeric(productData.invoiceTotal)){
        errorMessage += '<br>Total'
    }

    if (errorMessage.length===0) {
        return { ok: productData }
    } else {
        $(document).on('hidden.bs.modal', '.modal', function () { //Soluciona problema de scroll
            $('.modal:visible').length && $(document.body).addClass('modal-open')
        })

        $('#modal').modal('show')
        $('#modal_title').html(`Error al almacenar Ingreso`)
        $('#modal_body').html(`<h6 class="alert-heading">Falta ingresar los siguientes datos:</h6>
                                    <p class="mb-0">${errorMessage}</p>`)

        return { err: productData }
    }
}

function createModalBody(){
    let body = `
    <div class="row">
        <div class="col-md-4">
            <div class="row">
                <div class="col-md-4">
                    N° Socio
                    <input id="memberNumber" type="text" class="form-control form-control-sm border-input">
                </div>
                <div class="col-md-4">
                    Tipo
                    <input id="memberType" type="text" class="form-control form-control-sm border-input">
                </div>
                <div class="col-md-4">
                    RUT
                    <input id="memberRUT" type="text" class="form-control form-control-sm border-input">
                </div>
                <div class="col-md-12">
                    Nombre
                    <input id="memberName" type="text" class="form-control form-control-sm border-input">
                </div>
                <div class="col-md-3">
                    N° Medidor
                    <input id="memberWaterMeter" type="text" class="form-control form-control-sm border-input">
                </div>
                <div class="col-md-9">
                    Dirección
                    <input id="memberAddress" type="text" class="form-control form-control-sm border-input">
                </div>
                
                <div class="col-md-12">
                    <br/><br/>
                </div>

                <div class="col-md-12">
                    <table id="tableInvoice" class="display nowrap table table-condensed" cellspacing="0" style="font-size: 13px; visibility: hidden;">
                        <thead>
                            <tr class="table-primary">
                                <th colspan="3" style="text-align: center" id="invoiceTitle">Registro de Boleta/Factura</th>
                            </tr>
                        </thead>
                        <tbody id="tableInvoiceBody">`
                            /*<tr>
                                <td>N° Documento</td>
                                <td><input id="invoiceNumber" type="text" class="form-control form-control-sm border-input"></td>
                                <td></td>
                            </tr>*/
                    body +=`<tr>
                                <td>Fecha</td>
                                <td><input id="invoiceDate" type="text" class="form-control form-control-sm border-input invoiceDateClass" value="${moment.utc().format('DD/MM/YYYY')}"></td>
                                <td></td>
                            </tr>
                            <tr>
                                <td>Fecha Vencimiento</td>
                                <td><input id="invoiceDateExpire" type="text" class="form-control form-control-sm border-input invoiceDateClass" value="${moment.utc().add(15, 'days').format('DD/MM/YYYY')}"></td>
                                <td></td>
                            </tr>
                            <tr>
                                <td></td>
                                <td>Cargo Fijo</td>
                                <td><input id="invoiceCharge" type="text" class="form-control form-control-sm border-input"></td>
                            </tr>
                            <tr>
                                <td>Lectura Actual</td>
                                <td><input id="invoiceLectureActual" type="text" class="form-control form-control-sm border-input"></td>
                                <td></td>
                            </tr>
                            <tr>
                                <td>Lectura Anterior</td>
                                <td><input id="invoiceLectureLast" type="text" class="form-control form-control-sm border-input"></td>
                                <td></td>
                            </tr>
                            <tr>
                                <td>Consumo mts<sup>3</sup></td>
                                <td><input id="invoiceLectureResult" type="text" class="form-control form-control-sm border-input"></td>
                                <td></td>
                            </tr>
                            <tr>
                                <td>Valor mt<sup>3</sup></td>
                                <td><input id="invoiceMeterValue" type="text" class="form-control form-control-sm border-input"></td>
                                <td></td>
                            </tr>
                            <tr>
                                <td>Consumo Mes</td>
                                <td><input id="invoiceConsumption1" type="text" class="form-control form-control-sm border-input"></td>
                                <td></td>
                            </tr>
                            <tr>
                                <td><span style="display: inline-block">Subsidio</span> <input id="invoiceSubsidyPercentage" type="text" class="form-control form-control-sm border-input" style="display: inline-block; width: 50%"><span style="display: inline-block">%</span></td>
                                <td><input id="invoiceSubsidyValue" type="text" class="form-control form-control-sm border-input"></td>
                                <td></td>
                            </tr>
                            <tr>
                                <td>Consumo a Cobro</td>
                                <td><input id="invoiceConsumption2" type="text" class="form-control form-control-sm border-input"></td>
                                <td><input id="invoiceConsumption2b" type="text" class="form-control form-control-sm border-input"></td>
                            </tr>
                            <tr>
                                <td>Deuda Anterior</td>
                                <td></td>
                                <td><input id="invoiceDebt" type="text" class="form-control form-control-sm border-input"></td>
                            </tr>
                            <tr>
                                <td>Total</td>
                                <td></td>
                                <td><input id="invoiceTotal" type="text" class="form-control form-control-sm border-input"></td>
                            </tr>



                            <tr>
                                <td></td>
                                <td></td>
                                <td><button class="btn btn-info" id="invoiceSave"><i ="color:#3498db;" class="fas fa-check"></i> GUARDAR</button></td>
                            </tr>                            
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        <div class="col-md-8">
            <div class="row">
                <div class="col-md-6">
                    <br/>
                    <button class="btn btn-primary" onclick="addLecture()"><i class="fas fa-plus-circle"></i> Agregar Lectura Manual</button>
                    <br/>
                    <br/>
                </div>
                <div class="col-md-12" style="height:300px; overflow-y:scroll;">
                    <table id="tableLectures" class="display nowrap table table-condensed" cellspacing="0">
                        <thead id="tableLecturesHead">
                            <tr class="table-info">
                                <th style="text-align: center">Mes</th>
                                <th style="text-align: center">Fecha</th>
                                <th style="text-align: center">Lectura</th>
                                <th style="text-align: center">Valor Total</th>
                                <th style="text-align: center">Estado Pago</th>
                                <th style="text-align: center">Vista Previa</th>
                                <th style="text-align: center">Boleta/Factura</th>
                                <th style="text-align: center">PDF SII</th>
                            </tr>
                        </thead>
                        <tbody id="tableLecturesBody">
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div class="col-md-4">
            
        </div>

    </div>
`

    $('#modalLecture_body').html(body)
}

async function addLecture(){
    //date: moment().format('YYYY-MM-DD[T]HH:mm[Z]'),

    let lecture = {
        users: userCredentials._id,
        date: moment().format('YYYY-MM-DD[T]HH:mm:ss.SSS[Z]'),
        member: internals.dataRowSelected._id,
        lecture: 3513
    }
   
    let saveLecture = await axios.post('/api/lectureSave', lecture)

    /*$('#tableLecturesBody').append(`
        <tr>
            <td>
                <button class="btn btn-info" onclick="selectProduct(this)"><i class="fas fa-search"></i></button>
                <input type="text" style="display: none;" value="0">
            </td>
            <td style="width: 40%; text-align: center; font-size: 22px;"><label>~SELECCIONE PRODUCTO~</label></td>
            <td style="text-align: center;">
                <button class="btn btn-sm btn-info" onclick="qtyControl(this,'minus')" style="display: inline-block;"><i class="fas fa-minus-circle"></i></button>
                <input type="text" class="form-control border-input" style="text-align: center; display: inline-block; width: 30%" onkeyup="calculateTotal()">
                <button class="btn btn-sm btn-info" onclick="qtyControl(this,'plus')" style="display: inline-block;"><i class="fas fa-plus-circle"></i></button>
            </td>
            <td><input type="text" class="form-control border-input" style="text-align: right" onkeyup="calculateTotal()"></td>
            <td><input type="text" class="form-control border-input" style="text-align: right" disabled></td>
            <td><button class="btn btn-danger" onclick="deletePurchase(this)"><i class="fas fa-times"></i></button></td>
        </tr>
    `)*/
    
}


function deletePurchase(btn){
    $(btn).parent().parent().remove()
    calculateTotal()
}

function qtyControl(btn, type){
    if(!$.isNumeric($($(btn).parent().children()[1]).val())){
        $($(btn).parent().children()[1]).val(0)
    }

    let qty = $($(btn).parent().children()[1]).val()
    if(type=='minus'){
        if(qty>0){
            qty--
        }
        $($(btn).parent().children()[1]).val(qty)
    }else{
        qty++
        $($(btn).parent().children()[1]).val(qty)
    }
    calculateTotal()
}

function calculateTotal(){
    let net = 0

    $("#tableLecturesBody tr").each(function(){
        let qty = $($($(this).children()[2]).children()[1]).val()
        let price = $($($(this).children()[3]).children()[0]).val()
        
        if($.isNumeric(qty,price)){
            $($($(this).children()[4]).children()[0]).val(qty * price)
            net += qty * price
        }
    })


    /*let iva = Math.round(net * 0.19)

    $("#saleNet").val(dot_separators(net))
    $("#saleIVA").val(dot_separators(iva))
    $("#saleTotal").val(dot_separators(net + iva))*/
    $("#saleNet").val(dot_separators(net))
    $("#saleIVA").val(dot_separators(0))
    $("#saleTotal").val(dot_separators(net))
    
}

async function selectProduct(btn) {
    
    let productSelectedData = await Swal.fire({
        title: 'Seleccione producto',
        customClass: 'swal-wide',
        html: `
            <div style="max-height: 400px !important; overflow-y: scroll;">
                <table id="tableSearchProducts" class="display nowrap table table-condensed" cellspacing="0">
                    <thead>
                        <tr class="table-info">
                            <th>IMAGEN</th>
                            <th>PRODUCTO</th>
                            <th>STOCK</th>
                            <th>COSTO UNITARIO (ÚLT)</th>
                            <th>PRECIO</th>
                            <th>ESTADO</th>
                        </tr>
                    </thead>
                    <tbody id="tableSearchProductsBody"></tbody>
                </table>
            </div>
        `,
        onBeforeOpen: () => {
            try {
                if($.fn.DataTable.isDataTable('#tableSearchProducts')){
                    internals.products.table.clear().destroy()
                }
                internals.products.table = $('#tableSearchProducts')
                .DataTable( {
                    dom: 'Bfrtip',
                    buttons: [
                        'excel'
                    ],
                    iDisplayLength: 50,
                    oLanguage: {
                        sSearch: 'buscar: '
                    },
                    lengthMenu: [[50, 100, 500, -1], [50, 100, 500, 'Todos los registros']],
                    language: {
                        url: spanishDataTableLang
                    },
                    responsive: false,
                    columnDefs: [{targets: [1,2,3], className: 'dt-right'},
                                {targets: [4], className: 'dt-center'}],
                    order: [[ 0, 'desc' ]],
                    ordering: true,
                    rowCallback: function( row, data ) {
                        $(row).find('td:eq(0)').html('<img src="'+data.image+'" style="width: 100px; height: 100px;">')
                        $(row).find('td:eq(2)').html(dot_separators(data.stock))
                        $(row).find('td:eq(3)').html(dot_separators(data.cost))
                        $(row).find('td:eq(4)').html(dot_separators(data.price))
                    },
                    columns: [
                        { data: 'image' },
                        { data: 'name' },
                        { data: 'stock' },
                        { data: 'cost' },
                        { data: 'price' },
                        { data: 'status' }
                    ],
                    initComplete: function (settings, json) {
                        getProducts()
                    }
                })
        
                $('#tableSearchProducts tbody').off("click")
        
                $('#tableSearchProducts tbody').on('click', 'tr', function () {
                    if ($(this).hasClass('selected')) {
                        $(this).removeClass('selected')
                    } else {
                        internals.products.table.$('tr.selected').removeClass('selected')
                        $(this).addClass('selected')
                        internals.productRowSelected = internals.products.table.row($(this)).data()
                    }

                })

            } catch (error) {
                loadingHandler('stop')

                console.log(error)
            }
        },
        preConfirm: async () => {
            try {
                let productSelected = internals.productRowSelected

                if (productSelected) {
                    return {
                        ...productSelected
                    }
                }

                throw new Error('Debe seleccionar un producto.')
            } catch (error) {
                Swal.showValidationMessage(error)
            }
        },
        showCloseButton: true,
        showCancelButton: true,
        showConfirmButton: true,
        focusConfirm: false,
        confirmButtonText: 'Seleccionar',
        cancelButtonText: 'Cancelar'
    })

    if (productSelectedData.value) {
        $($(btn).parent().children()[1]).val(productSelectedData.value._id)
        $($($(btn).parent().parent().children()[1]).children()[0]).text(productSelectedData.value.name)
        $($($(btn).parent().parent().children()[2]).children()[1]).val(1)
        $($($(btn).parent().parent().children()[3]).children()[0]).val(productSelectedData.value.price)

        calculateTotal()

    }
}

async function getProducts(){
    let inventoryData = await axios.get('api/inventory')
    if (inventoryData.data.length > 0) {
        internals.products.table.rows.add(inventoryData.data).draw()
    }
}

async function createInvoice(lectureID,invoiceID,member){
    if(invoiceID==0){
        
        let parametersData = await axios.get('/api/parameters')
        let parameters = parametersData.data
        let charge = parameters.charge
        let meterValue = parameters.meterValue
        let subsidyLimit = parameters.subsidyLimit
        
        let lectureData = await axios.post('/api/lectureSingle', {id: lectureID})
        let lecture = lectureData.data
    
        console.log("lecture",lecture)
        //Definir parámetros

        let subsidy=50, debt=0

        $("#invoiceTitle").text("Nueva Boleta/Factura")
        $("#invoiceNumber").val('')
        $("#invoiceDate").val(moment.utc().format('DD/MM/YYYY'))
        $("#invoiceDateExpire").val(moment.utc().add(15,'days').format('DD/MM/YYYY'))
        $("#invoiceCharge").val(charge) 
        $("#invoiceLectureActual").val(lecture.logs[lecture.logs.length-1].lecture)
        $("#invoiceLectureLast").val(lecture.lastLecture)
        let lectureValue = lecture.logs[lecture.logs.length-1].lecture-lecture.lastLecture
        $("#invoiceLectureResult").val(lectureValue)
        $("#invoiceMeterValue").val(meterValue)
        let consumptionValue = lectureValue * meterValue
        $("#invoiceConsumption1").val(consumptionValue)
        
        let subsidyValue = 0
        if(subsidy>0){
            if(lectureValue<=subsidyLimit){
                subsidyValue = Math.round(consumptionValue * (subsidy / 100))
            }else{
                subsidyValue = Math.round((subsidyLimit * meterValue) * (subsidy / 100))
            }
        }
        $("#invoiceSubsidyPercentage").val(subsidy)
        $("#invoiceSubsidyValue").val(subsidyValue)
        let lastConsumptionValue = consumptionValue-subsidyValue
        $("#invoiceConsumption2").val(lastConsumptionValue)
        $("#invoiceConsumption2b").val(lastConsumptionValue)
        $("#invoiceDebt").val(debt) //A asignar
        $("#invoiceTotal").val(parseInt(lastConsumptionValue)+parseInt(debt)+parseInt(charge))
     
        $('.invoiceDateClass').daterangepicker({
            opens: 'right',
            locale: dateRangePickerDefaultLocale,
            singleDatePicker: true,
            autoApply: true
        })

        $('#invoiceSave').off("click")

        $("#invoiceSave").on('click', async function () {

            let goSave = false
    
            /*EJEMPLO PARA POSIBLE UTILIZACIÓN EN SERVICIOS EXTRAS
            if($("#tableServicesBody tr").length>0){
                goSave = true
            }
    
            $("#tableServicesBody tr").each(function(){
                if($($($(this).children()[0]).children()[1])){
    
                    if($($($(this).children()[0]).children()[1]).val()==0 || !$.isNumeric($($($(this).children()[2]).children()[1]).val()) || !$.isNumeric($($($(this).children()[3]).children()[0]).val())){
                        goSave = false
                    }
                    services.push({
                        services: $($($(this).children()[0]).children()[1]).val(),
                        quantity: parseInt($($($(this).children()[2]).children()[1]).val()),
                        value: parseInt($($($(this).children()[3]).children()[0]).val())
                    })
                }
            })
    
            if(!goSave){
                toastr.warning('Debe ingresar productos con valores correctos')
                return
            }*/
    
            let invoiceData = {
                lectures: lectureID,
                member: internals.dataRowSelected._id,
                //number: replaceAll($("#invoiceNumber").val(), '.', '').replace(' ', ''),
                date: $("#invoiceDate").data('daterangepicker').startDate.format('YYYY-MM-DD'),
                dateExpire: $("#invoiceDateExpire").data('daterangepicker').startDate.format('YYYY-MM-DD'),
                charge: replaceAll($("#invoiceCharge").val(), '.', '').replace(' ', ''),
                lectureActual: replaceAll($("#invoiceLectureActual").val(), '.', '').replace(' ', ''),
                lectureLast: replaceAll($("#invoiceLectureLast").val(), '.', '').replace(' ', ''),
                lectureResult: replaceAll($("#invoiceLectureResult").val(), '.', '').replace(' ', ''),
                meterValue: replaceAll($("#invoiceMeterValue").val(), '.', '').replace(' ', ''),
                subsidyPercentage: replaceAll($("#invoiceSubsidyPercentage").val(), '.', '').replace(' ', ''),
                subsidyValue: replaceAll($("#invoiceSubsidyValue").val(), '.', '').replace(' ', ''),
                consumption: replaceAll($("#invoiceConsumption2").val(), '.', '').replace(' ', ''),
                invoiceDebt: replaceAll($("#invoiceDebt").val(), '.', '').replace(' ', ''),
                invoiceTotal: replaceAll($("#invoiceTotal").val(), '.', '').replace(' ', '')
            }

            /*if(services.length>0){
                saleData.services = services
            }*/

            const res = validateInvoiceData(invoiceData)
            if(res.ok){
                let saveInvoice = await axios.post('/api/invoiceSave', res.ok)
                if(saveInvoice.data){
                    if(saveInvoice.data._id){
    
                        $('#modal_title').html(`Almacenado`)
                        $('#modal_body').html(`<h5 class="alert-heading">Boleta almacenada correctamente</h5>`)
                        loadLectures(member)
                    }else{
                        $('#modal_title').html(`Error`)
                        $('#modal_body').html(`<h5 class="alert-heading">Error al almacenar, favor reintente</h5>`)
                    }
                }else{
                    $('#modal_title').html(`Error`)
                    $('#modal_body').html(`<h5 class="alert-heading">Error al almacenar, favor reintente</h5>`)
                }
                $('#modal').modal('show')
            }
    
        })
    }else{

        let invoiceData = await axios.post('/api/invoiceSingle', {id: invoiceID})
        let invoice = invoiceData.data
        
        if(invoice.number){
            $("#invoiceTitle").text("Boleta/Factura N° " + invoice.number)
        }else{
            $("#invoiceTitle").text("Boleta/Factura por generar")
        }
        //$("#invoiceNumber").val(invoice.number)
        $("#invoiceDate").val(moment(invoice.date).utc().format('DD/MM/YYYY'))
        $("#invoiceDateExpire").val(moment(invoice.dateExpire).utc().format('DD/MM/YYYY'))
        $("#invoiceCharge").val(invoice.charge) 
        $("#invoiceLectureActual").val(invoice.lectureActual)
        $("#invoiceLectureLast").val(invoice.lectureLast)
        $("#invoiceLectureResult").val(invoice.lectureResult)
        $("#invoiceMeterValue").val(invoice.meterValue)
        let consumptionValue = invoice.lectureResult * invoice.meterValue
        $("#invoiceConsumption1").val(consumptionValue)
        $("#invoiceSubsidyPercentage").val(invoice.subsidyPercentage)
        $("#invoiceSubsidyValue").val(invoice.subsidyValue)
        $("#invoiceConsumption2").val(invoice.consumption)
        $("#invoiceConsumption2b").val(invoice.consumption)
        $("#invoiceDebt").val(invoice.invoiceDebt) 
        $("#invoiceTotal").val(invoice.invoiceTotal)
     
        $('.invoiceDateClass').daterangepicker({
            opens: 'right',
            locale: dateRangePickerDefaultLocale,
            singleDatePicker: true,
            autoApply: true
        })

        $('#invoiceSave').off("click")

        $("#invoiceSave").on('click', async function () {

            let goSave = false
    
            /*EJEMPLO PARA POSIBLE UTILIZACIÓN EN SERVICIOS EXTRAS
            if($("#tableServicesBody tr").length>0){
                goSave = true
            }
    
            $("#tableServicesBody tr").each(function(){
                if($($($(this).children()[0]).children()[1])){
    
                    if($($($(this).children()[0]).children()[1]).val()==0 || !$.isNumeric($($($(this).children()[2]).children()[1]).val()) || !$.isNumeric($($($(this).children()[3]).children()[0]).val())){
                        goSave = false
                    }
                    services.push({
                        services: $($($(this).children()[0]).children()[1]).val(),
                        quantity: parseInt($($($(this).children()[2]).children()[1]).val()),
                        value: parseInt($($($(this).children()[3]).children()[0]).val())
                    })
                }
            })
    
            if(!goSave){
                toastr.warning('Debe ingresar productos con valores correctos')
                return
            }*/

   
            let invoiceData = {
                id: invoiceID,
                lectures: lectureID,
                member: internals.dataRowSelected._id,
                date: $("#invoiceDate").data('daterangepicker').startDate.format('YYYY-MM-DD'),
                dateExpire: $("#invoiceDateExpire").data('daterangepicker').startDate.format('YYYY-MM-DD'),
                charge: replaceAll($("#invoiceCharge").val(), '.', '').replace(' ', ''),
                lectureActual: replaceAll($("#invoiceLectureActual").val(), '.', '').replace(' ', ''),
                lectureLast: replaceAll($("#invoiceLectureLast").val(), '.', '').replace(' ', ''),
                lectureResult: replaceAll($("#invoiceLectureResult").val(), '.', '').replace(' ', ''),
                meterValue: replaceAll($("#invoiceMeterValue").val(), '.', '').replace(' ', ''),
                subsidyPercentage: replaceAll($("#invoiceSubsidyPercentage").val(), '.', '').replace(' ', ''),
                subsidyValue: replaceAll($("#invoiceSubsidyValue").val(), '.', '').replace(' ', ''),
                consumption: replaceAll($("#invoiceConsumption2").val(), '.', '').replace(' ', ''),
                invoiceDebt: replaceAll($("#invoiceDebt").val(), '.', '').replace(' ', ''),
                invoiceTotal: replaceAll($("#invoiceTotal").val(), '.', '').replace(' ', '')
            }

            if($.isNumeric($("#invoiceNumber").val())){
                invoiceData.number = $("#invoiceNumber").val()
            }

            /*if(services.length>0){
                saleData.services = services
            }*/
            
            const res = validateInvoiceData(invoiceData)
            if(res.ok){
                let updateInvoice = await axios.post('/api/invoiceUpdate', res.ok)
                if(updateInvoice.data){
                    if(updateInvoice.data._id){
    
                        $('#modal_title').html(`Almacenado`)
                        $('#modal_body').html(`<h5 class="alert-heading">Boleta almacenada correctamente</h5>`)
                        loadLectures(member)
                    }else{
                        $('#modal_title').html(`Error`)
                        $('#modal_body').html(`<h5 class="alert-heading">Error al almacenar, favor reintente</h5>`)
                    }
                }else{
                    $('#modal_title').html(`Error`)
                    $('#modal_body').html(`<h5 class="alert-heading">Error al almacenar, favor reintente</h5>`)
                }
                $('#modal').modal('show')
            }
    
        })
    }
}

async function printInvoice(docType,type,memberID,invoiceID) {
    
    let memberData = await axios.post('/api/memberSingle', {id: memberID})
    let member = memberData.data

    let invoiceData = await axios.post('/api/invoiceSingle', {id: invoiceID})
    let invoice = invoiceData.data

    let lecturesData = await axios.post('/api/lecturesSingleMember', {member:  memberID})
    let lectures = lecturesData.data

    let parametersData = await axios.get('/api/parameters')
    let parameters = parametersData.data


    let docName = '', memberName = ''
    if(type=='personal'){
        docName = 'BOLETA ELECTRÓNICA'
        memberName = member.personal.name + ' ' + member.personal.lastname1 + ' ' + member.personal.lastname2
    }else{
        docName = 'FACTURA ELECTRÓNICA'
        memberName = member.enterprise.name
    }

    let doc = new jsPDF('p', 'pt', 'letter')
    //let doc = new jsPDF('p', 'pt', [302, 451])

    let pdfX = 150
    let pdfY = 20

    doc.setFontSize(12)
    doc.addImage(logoWallImg, 'PNG', 0, 0, doc.internal.pageSize.getWidth() , doc.internal.pageSize.getHeight() ) //Fondo

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
    doc.text(docName, pdfX + 310, pdfY + 20, 'center')

    doc.setFontType('bold')
    doc.text('N° '+invoice.number, pdfX + 310, pdfY + 50, 'center')
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
    if(invoice.subsidyPercentage>0){
        doc.text('Subsidio (' + invoice.subsidyPercentage.toString() + '%)', pdfX, pdfY + 46)
    }
    doc.text('SubTotal Consumo Mes', pdfX, pdfY + 72)
    doc.text('Saldo Anterior', pdfX, pdfY + 85)
    doc.setFontType('bold')
    doc.text('Monto Total', pdfX, pdfY + 111)


    doc.setFontSize(10)
    doc.setFontType('normal')

    doc.text(dot_separators(invoice.charge), pdfX + 250, pdfY + 20, 'right')
    doc.text(dot_separators(invoice.lectureResult * invoice.meterValue), pdfX + 250, pdfY + 33, 'right')
    if(invoice.subsidyPercentage>0){
        doc.text('-' + dot_separators(invoice.subsidyValue), pdfX + 250, pdfY + 46, 'right')
    }
    doc.text(dot_separators(invoice.charge + invoice.consumption), pdfX + 250, pdfY + 72, 'right')
    doc.text(dot_separators(invoice.invoiceDebt), pdfX + 250, pdfY + 85, 'right')
    doc.setFontType('bold')
    doc.text(dot_separators(invoice.invoiceTotal), pdfX + 250, pdfY + 111, 'right')
    
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
    doc.text('Datos Tributarios: ', pdfX + 100, pdfY + 180)
    doc.text('Neto ', pdfX + 190, pdfY + 180)
    doc.text('IVA ', pdfX + 190, pdfY + 190)
    doc.text(dot_separators(net), pdfX + 250, pdfY + 180, 'right')
    doc.text(dot_separators(iva), pdfX + 250, pdfY + 190, 'right')

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


    ///////GRÁFICO CONSUMOS/////

    pdfX = 30
    pdfY += 200
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
    for(let j=0; j<lectures.length; j++){
        if(lectures[j]._id==invoice.lectures._id){
            flag++
        }

        if(flag>0 && flag<=13){
            lastInvoices.push(lectures[j].invoice)
            flag++

            if(lectures[j].invoice.lectureResult>maxValue){
                maxValue = lectures[j].invoice.lectureResult
            }
        }
    }
    
    let meterPoints = 100 / maxValue //Puntos en PDF por mt3
    
    pdfY += 25
    doc.setFontSize(7)
    doc.setFontType('normal')
        
    doc.setDrawColor(199, 199, 199)

    if(maxValue < 5) {
        pdfY -= 5
        //Línea límite según lectura máxima
        doc.text(maxValue.toString(), pdfX - 2, pdfY, 'right')
        doc.line(pdfX, pdfY, pdfX + 250, pdfY)
        
        if(maxValue == 4){
            doc.text('3', pdfX - 2, (pdfY + 2) + 25, 'right')
            doc.text('2', pdfX - 2, (pdfY + 2) + 50, 'right')
            doc.text('1', pdfX - 2, (pdfY + 2) + 77, 'right')
            doc.line(pdfX, pdfY + 25, pdfX + 250, pdfY + 25)
            doc.line(pdfX, pdfY + 50, pdfX + 250, pdfY + 50)
            doc.line(pdfX, pdfY + 75, pdfX + 250, pdfY + 75)
        
        }else if(maxValue == 3){
            doc.text('2', pdfX - 2, pdfY + 34, 'right')
            doc.text('1', pdfX - 2, pdfY + 69, 'right')
            doc.line(pdfX, pdfY + 34, pdfX + 250, pdfY + 34)
            doc.line(pdfX, pdfY + 69, pdfX + 250, pdfY + 69)
        }else if(maxValue == 2) {
            doc.text('1', pdfX - 2, pdfY + 51, 'right')
            doc.line(pdfX, pdfY + 51, pdfX + 250, pdfY + 51)
        }
        
        pdfY += 102
    
    }else if(maxValue % 4 == 0){

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
    
    }else{
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



    
    for(let i=0; i<lastInvoices.length; i++){

        if(i==0){
            doc.setFillColor(23, 162, 184)
        }else{
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
    doc.text('N° Teléfono oficina Comité: ' + parameters.phone + ' - Correo electrónico:  ' + parameters.email, pdfX, doc.internal.pageSize.getHeight()-48)

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

        console.log('member',member)
        console.log('invoice',invoice)
        console.log('parameters',parameters)

        //console.log(JSON.stringify(invoice))

        let dteType = 33 //Factura
        let name = '', category = ''
        if(type=='personal'){
            //dteType = 35 //Boleta
            name = member.personal.name+' '+member.personal.lastname1+' '+member.personal.lastname2
            category = 'TEST'
        }else{
            name = member.enterprise.fullName
            category = member.enterprise.category
        }

        let net = parseInt(invoice.invoiceTotal / 1.19)
        let iva = invoice.invoiceTotal - net

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
            RUTEmisor: "76795561-8",
            RznSoc: "HAULMER SPA",
            GiroEmis: "VENTA AL POR MENOR POR CORREO, POR INTERNET Y VIA TELEFONICA",
            Acteco: "479100",
            DirOrigen: "ARTURO PRAT 527   CURICO",
            CmnaOrigen: "Curicó",
            Telefono: "0 0",
            CdgSIISucur: "81303347"
        }



        let document = {
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
                        DirRecep: member.address.address,
                        CmnaRecep: parameters.committee.commune,
                    },
                    Totales:{
                        MntNeto: net,
                        TasaIVA: "19",
                        IVA: iva,
                        MntTotal: invoice.invoiceTotal,
                        MontoPeriodo: invoice.invoiceTotal, //Consultar si se separa monto adeudado anterior
                        VlrPagar: invoice.invoiceTotal
                    }
                },
                Detalle:[
                    {
                        NroLinDet: 1,
                        NmbItem: "Servicio de Agua",
                        QtyItem: 1,
                        PrcItem: net,
                        MontoItem: net
                    }
                ]
            }
        }

        console.log(document)

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
            $('#modal_body').html(`<h5 class="alert-heading">Documento generado correctamente</h5>`)
            $('#modal').modal('show')

            loadLectures(member)
            
        })
    }


}
