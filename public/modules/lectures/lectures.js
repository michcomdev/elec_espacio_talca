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
    $('#memberWaterMeter').val(250663) //TEST
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

    let lectureData = await axios.post('/api/lecturesSingleMember', {member: internals.dataRowSelected._id})
    let lectures = lectureData.data

    $('#tableLecturesBody').html('')

    for(i=0;i<lectures.length;i++){

        let total = 0
        let btn = ''
        let invoiceID = 0
        if(lectures[i].invoice){
            total = dot_separators(lectures[i].invoice.invoiceTotal)
            btn = `<button class="btn btn-sm btn-danger" onclick="printInvoice('${member.type}','${lectures[i].invoice._id}')"><i class="far fa-file-pdf" style="font-size: 14px;"></i></button>`
            invoiceID = lectures[i].invoice._id
        }else{
            total = 'NO CALCULADO'
            btn = `<button class="btn btn-sm btn-dark" disabled><i class="far fa-file-pdf" style="font-size: 14px;"></i></button>`
        }
        
        $('#tableLecturesBody').append(`
            <tr id="${lectures[i]._id}" data-invoice="${invoiceID}">
                <td style="text-align: center;">
                    ${getMonthString(moment.utc(lectures[i].date).format('MM'))}
                </td>
                <td style="text-align: center;">
                    ${moment.utc(lectures[i].date).format('DD/MM/YYYY')}
                </td>
                <td style="text-align: center;">
                    ${dot_separators(lectures[i].lecture)}
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
                        <tbody id="tableInvoiceBody">
                            <tr>
                                <td>N° Documento</td>
                                <td><input id="invoiceNumber" type="text" class="form-control form-control-sm border-input"></td>
                                <td></td>
                            </tr>
                            <tr>
                                <td>Fecha</td>
                                <td><input id="invoiceDate" type="text" class="form-control form-control-sm border-input" value="${moment.utc().format('DD/MM/YYYY')}"></td>
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
                                <th style="text-align: center">Ver Boleta/Factura</th>
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
        lecture: 3300
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
        let lectureData = await axios.post('/api/lectureSingle', {id: lectureID})
        let lecture = lectureData.data
    
        //Definir parámetros
        let charge=950, meterValue=440, subsidyLimit = 15
        let subsidy=50, debt=0

        $("#invoiceTitle").text("Nueva Boleta/Factura")
        //$("#invoiceDate").val(moment.utc().format('DD/MM/YYYY'))
        $("#invoiceCharge").val(charge) 
        $("#invoiceLectureActual").val(lecture.lecture)
        $("#invoiceLectureLast").val(lecture.lastLecture)
        let lectureValue = lecture.lecture-lecture.lastLecture
        $("#invoiceLectureResult").val(lectureValue)
        $("#invoiceMeterValue").val(meterValue)
        let consumptionValue = lectureValue * meterValue
        $("#invoiceConsumption1").val(consumptionValue)
        
        let subsidyValue = 0
        if(subsidy>0){
            if(lectureValue<=subsidyLimit){
                subsidyValue = Math.round(consumptionValue * (subsidy / 100))
            }else{
                subsidyValue = Math.round(subsidyLimit * (subsidy / 100))
            }
        }
        $("#invoiceSubsidyPercentage").val(subsidy)
        $("#invoiceSubsidyValue").val(subsidyValue)
        let lastConsumptionValue = consumptionValue-subsidyValue
        $("#invoiceConsumption2").val(lastConsumptionValue)
        $("#invoiceConsumption2b").val(lastConsumptionValue)
        $("#invoiceDebt").val(debt) //A asignar
        $("#invoiceTotal").val(lastConsumptionValue+debt+charge)
     
        $('#invoiceDate').daterangepicker({
            opens: 'right',
            locale: dateRangePickerDefaultLocale,
            singleDatePicker: true,
            autoApply: true
        })


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
                number: replaceAll($("#invoiceNumber").val(), '.', '').replace(' ', ''),
                date: $("#invoiceDate").data('daterangepicker').startDate.format('YYYY-MM-DD'),
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
        
        $("#invoiceTitle").text("Boleta/Factura N° " + invoice.number)
        $("#invoiceDate").val(moment(invoice.date).utc().format('DD/MM/YYYY'))
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
     
        $('#invoiceDate').daterangepicker({
            opens: 'right',
            locale: dateRangePickerDefaultLocale,
            singleDatePicker: true,
            autoApply: true
        })


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

async function printInvoice(type,id) {

    console.log(type,id)

    return

    let movement = await axios.post('api/movementVoucher', {id: id, type: type})
    let voucher = movement.data

    //TESTING//
    if(!voucher.driverGuide) voucher.driverGuide='0'
    if(!voucher.driverSeal) voucher.driverSeal='0'

    //let doc = new jsPDF('p', 'pt', 'letter')
    let doc = new jsPDF('p', 'pt', [302, 451])

    let pdfX = 20
    let pdfY = 20

    doc.setFontSize(10)

    doc.addImage(logoImg, 'PNG', 90, pdfY, 120, 60, 'center')
    pdfY += 60
    doc.text(`DEPÓSITO CONTENEDORES DDMC LTDA.`, doc.internal.pageSize.width/2, pdfY + 20, 'center')
    doc.text(`Los Aromos 451 Aguas Buenas - San Antonio`, doc.internal.pageSize.width/2, pdfY + 30, 'center')

    doc.setFontSize(12)
    doc.setFontType('bold')

    if(type=="in"){
        doc.text(`INGRESO N°: ${(voucher.numberIn) ? (voucher.numberIn) : '-----'}`, doc.internal.pageSize.width/2, pdfY + 45, 'center')
    }else if(type=="out"){
        doc.text(`SALIDA N°: ${(voucher.numberOut) ? (voucher.numberOut) : '-----'}`, doc.internal.pageSize.width/2, pdfY + 45, 'center')
    }else if(type=="transferIn"){
        doc.text(`ENTRADA TRASPASO N°: ${(voucher.transferIn) ? (voucher.transferIn) : '-----'}`, doc.internal.pageSize.width/2, pdfY + 45, 'center')
    }else if(type=="transferOut"){
        doc.text(`SALIDA TRASPASO N°: ${(voucher.transferOut) ? (voucher.transferOut) : '-----'}`, doc.internal.pageSize.width/2, pdfY + 45, 'center')
    }

    pdfY += 72

    doc.text(voucher.containerNumber, pdfX + 90, pdfY + 2)

    doc.setFontSize(10)
    doc.setFontType('normal')
    doc.text(`Contenedor`, pdfX, pdfY)
    doc.text(`Tipo`, pdfX, pdfY + 15)
    doc.text(`Llegada`, pdfX, pdfY + 27)
    doc.text(`Salida`, pdfX, pdfY + 39)
    doc.text(`Tracto`, pdfX, pdfY + 51)
    doc.text(`Guía`, pdfX, pdfY + 63)
    doc.text(`Sello`, pdfX, pdfY + 75)
    doc.text(`RUT Conductor`, pdfX, pdfY + 87)
    doc.text(`Nombre Conductor`, pdfX, pdfY + 99)
    doc.text(`RUT Cliente`, pdfX, pdfY + 111)
    //doc.text(`Cliente`, pdfX, pdfY + 95)
    doc.setFontType('bold')
    //doc.text(voucher.clientName.toUpperCase(), pdfX, pdfY + 127)
    doc.text(voucher.clientName.toUpperCase(), doc.internal.pageSize.width/2, pdfY + 127, 'center')
    doc.setFontType('normal')
    //doc.text(`Ubicación`, pdfX, pdfY + 105)

    doc.text(voucher.containerLarge, pdfX + 90, pdfY + 15)

    console.log("voucher",voucher)

    if(type=="transferIn" || type=="transferOut"){
        doc.text(moment(voucher.datetimeOut).format('DD/MM/YYYY HH:mm'), pdfX + 90, pdfY + 27)
    }else{
        doc.text(moment(voucher.datetimeIn).format('DD/MM/YYYY HH:mm'), pdfX + 90, pdfY + 27)
    }

    if(type=="in"){
        doc.text('-', pdfX + 90, pdfY + 35)
    }else{
        doc.text(moment(voucher.datetimeOut).format('DD/MM/YYYY HH:mm'), pdfX + 90, pdfY + 39)
    }
    
    doc.text(voucher.driverPlate, pdfX + 90, pdfY + 51)
    doc.text(voucher.driverGuide, pdfX + 90, pdfY + 63)
    doc.text(voucher.driverSeal, pdfX + 90, pdfY + 75)
    doc.text(voucher.driverRUT, pdfX + 90, pdfY + 87)
    doc.text(voucher.driverName, pdfX + 90, pdfY + 99)
    doc.text(voucher.clientRUT, pdfX + 90, pdfY + 111)

    
    //doc.text(voucher.clientName.toUpperCase(), pdfX + 90, pdfY + 95)
    //doc.text('', pdfX + 90, pdfY + 105)


    //doc.text(pdfX + 230, pdfY + 30, `Estado: ${internals.newSale.status}`, { align: 'center' }) // status right
    //doc.text(pdfX + 230, pdfY + 45, `Fecha: ${moment(auxHourPdf).format('DD/MM/YYYY HH:mm')}`, { align: 'center' }) // creationDate right
    pdfY += 139

    doc.setLineWidth(0.5)
    doc.line(pdfX, pdfY, pdfX + 220, pdfY)

    if(!voucher.extraDayNet || type=="in"){
        doc.text(`NETO`, pdfX, pdfY + 27)
        doc.text(`IVA`, pdfX, pdfY + 39)
        doc.setFontType('bold')
        doc.text(`TOTAL`, pdfX, pdfY + 51)
        doc.setFontType('normal')

        doc.text(`$`, pdfX + 150, pdfY + 27)
        doc.text(`$`, pdfX + 150, pdfY + 39)
        doc.setFontType('bold')
        doc.text(`$`, pdfX + 150, pdfY + 51)
        doc.setFontType('normal')

        doc.text(voucher.service, pdfX, pdfY + 15)
        doc.text(dot_separators(voucher.net), pdfX + 210, pdfY + 27, 'right')
        doc.text(dot_separators(voucher.iva), pdfX + 210, pdfY + 39, 'right')
        doc.setFontType('bold')
        doc.text(dot_separators(voucher.total), pdfX + 210, pdfY + 51, 'right')
        doc.setFontType('normal')
        pdfY += 63

    }else{

        let extraDays = moment(voucher.datetimeOut).diff(moment(voucher.datetimeIn), 'days')-5

        doc.text(`NETO`, pdfX, pdfY + 27)
        doc.text(`DÍAS EXTRA (${extraDays} x $${dot_separators(voucher.extraDayServiceNet)})`, pdfX, pdfY + 39)
        doc.text(`IVA`, pdfX, pdfY + 51)
        doc.setFontType('bold')
        doc.text(`TOTAL`, pdfX, pdfY + 63)
        doc.setFontType('normal')


        doc.text(`$`, pdfX + 150, pdfY + 27)
        doc.text(`$`, pdfX + 150, pdfY + 39)
        doc.text(`$`, pdfX + 150, pdfY + 51)
        doc.setFontType('bold')
        doc.text(`$`, pdfX + 150, pdfY + 63)
        doc.setFontType('normal')

        doc.text(voucher.service, pdfX, pdfY + 15)
        doc.text(dot_separators(voucher.net), pdfX + 210, pdfY + 27, 'right')
        doc.text(dot_separators(voucher.extraDayNet), pdfX + 210, pdfY + 39, 'right')
        doc.text(dot_separators(voucher.iva+voucher.extraDayIva), pdfX + 210, pdfY + 51, 'right')
        doc.setFontType('bold')
        doc.text(dot_separators(voucher.total+voucher.extraDayTotal), pdfX + 210, pdfY + 63, 'right')
        doc.setFontType('normal')
        pdfY += 75
    }


    doc.setLineWidth(0.5)
    doc.line(pdfX, pdfY, pdfX + 220, pdfY)


    /*doc.setFontType('normal')
    doc.text(pdfX + 380, pdfY + 60, 'TOTAL:')
    doc.text(pdfX + 450, pdfY + 60, '$')
    doc.setFontType('bold')
    doc.setFontSize(12)
    //doc.text(pdfX + 470, pdfY + 60, dot_separators(internals.newSale.total))
    var subtotalvar =  dot_separators(internals.newSale.total) 
    var textWidth = doc.getStringUnitWidth(subtotalvar) * doc.internal.getFontSize() / doc.internal.scaleFactor;
    var textOffset = doc.internal.pageSize.width - textWidth - 50;
    doc.text(textOffset, pdfY + 60, subtotalvar)
*/

    doc.autoPrint()
    window.open(doc.output('bloburl'), '_blank')
    //doc.save(`Nota de venta ${internals.newSale.number}.pdf`)
}
