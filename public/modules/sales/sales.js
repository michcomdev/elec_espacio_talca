let internals = {
    sales: {
        table: {},
        data: []
    },
    products: {
        table: {},
        data: []
    },
    services: {
        table: {},
        data: []
    },
    dataRowSelected: {},
    productRowSelected: {},
    serviceRowSelected: {}
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

    chargeSalesTable()
    //getParameters()
})

async function getParameters() {
    let clientsData = await axios.get('api/clients')
    clients = clientsData.data

}

function chargeSalesTable() {
    try {
        if($.fn.DataTable.isDataTable('#tableSales')){
            internals.sales.table.clear().destroy()
        }
        internals.sales.table = $('#tableSales')
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
                $(row).find('td:eq(0)').html(moment.utc(data.date).format('DD/MM/YYYY'));
                $(row).find('td:eq(2)').html(dot_separators(data.total));
          },
          columns: [
            { data: 'date' },
            { data: 'name' },
            { data: 'total' },
            { data: 'payment' },
            { data: 'status' }
          ],
          initComplete: function (settings, json) {
            getSalesEnabled()
          }
        })

        $('#tableSales tbody').off("click")

        $('#tableSales tbody').on('click', 'tr', function () {
            if ($(this).hasClass('selected')) {
                $(this).removeClass('selected')
                $('#updateSale').prop('disabled', true)
            } else {
                internals.sales.table.$('tr.selected').removeClass('selected');
                $(this).addClass('selected');
                $('#updateSale').prop('disabled', false)
                //internals.sales.data = internals.sales.table.row($(this)).data()
                internals.dataRowSelected = internals.sales.table.row($(this)).data()
            }
        })
      } catch (error) {
        console.log(error)
      }

}

async function getSalesEnabled() {
    let salesData = await axios.get('api/sales')

    if (salesData.data.length > 0) {
        let formatData= salesData.data.map(el => {
            el.datetime = moment(el.datetime).format('DD/MM/YYYY HH:mm')

            return el
        })

        internals.sales.table.rows.add(formatData).draw()
        $('#loadingSales').empty()
    } else {
        //console.log('vacio', salesData);
        //toastr.warning('No se han encontrado ventas en el rango seleccionado')
        $('#loadingSales').empty()
    }
}

$('#searchSales').on('click', async function () {
    chargeSalesTable()
})

$('#createSale').on('click', function () { // CREAR MOVIMIENTO
    $('#saleModal').modal('show');
    $('#modalSale_title').html(`Nueva venta`)
    $('#modalSale_body').html(createModalBody())

    $('#modalSale_footer').html(`
        <button class="btn btn-dark" data-dismiss="modal">
            <i ="color:#E74C3C;" class="fas fa-times"></i> CERRAR
        </button>

        <button class="btn btn-info" id="saveSale">
            <i ="color:#3498db;" class="fas fa-check"></i> GUARDAR
        </button>
    `)

    document.querySelector('#saleRUT').addEventListener('keyup', function () {
        if(validateRut(this.value)){
            $(this).val(validateRut(this.value))
        }
    })

    getSold(0)

    $('#saleDate').daterangepicker({
        opens: 'left',
        locale: dateRangePickerDefaultLocale,
        singleDatePicker: true,
        autoApply: true
        //endDate: moment()
    }, function(start, end, label) {
        //internals.initDate = start.format('YYYY-MM-DD')
        //internals.endDate = end.format('YYYY-MM-DD')
    })

    $('#saveSale').on('click', async function () {

        let products = []
        let services = []
        let goSave = false

        if($("#tableProductsBody tr").length>0 || $("#tableServicesBody tr").length>0){
            goSave = true
        }
        $("#tableProductsBody tr").each(function(){
            console.log($($($(this).children()[0]).children()[1]).val())
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
        });

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
        });

        if(!goSave){
            toastr.warning('Debe ingresar productos con valores correctos')
            return
        }
        
        let saleData = {
            date: $("#saleDate").data('daterangepicker').startDate.format('YYYY-MM-DD'),
            rut: $('#saleRUT').val(),
            name: $('#saleName').val(),
            address: $('#saleAddress').val(),
            status: $('#saleStatus').val(),
            net: replaceAll($('#saleNet').val(), '.', '').replace(' ', ''),
            iva: replaceAll($('#saleIVA').val(), '.', '').replace(' ', ''),
            total: replaceAll($('#saleTotal').val(), '.', '').replace(' ', ''),
            payment: $('#salePayment').val()
        }

        if(products.length>0){
            saleData.products = products
        }
        if(services.length>0){
            saleData.services = services
        }
        
        console.log(saleData)

        const res = validateSaleData(saleData)
        if(res.ok){
            let saveSale = await axios.post('/api/saleSave', res.ok)
            if(saveSale.data){
                if(saveSale.data._id){
                    $('#saleModal').modal('hide')

                    $('#modal_title').html(`Almacenado`)
                    $('#modal_body').html(`<h5 class="alert-heading">Venta almacenada correctamente</h5>`)
                    chargeSalesTable()
                }else{
                    $('#modal_title').html(`Error`)
                    $('#modal_body').html(`<h5 class="alert-heading">Error al almacenar, favor reintente</h5>`)
                }
            }else{
                $('#modal_title').html(`Error`)
                $('#modal_body').html(`<h5 class="alert-heading">Error al almacenar, favor reintente</h5>`)
            }
            $('#modal').modal('show');
        }

    })

})


$('#updateSale').on('click', async function () {

    let saleData = await axios.post('/api/saleSingle', {id: internals.dataRowSelected._id})
    let sale = saleData.data

    console.log(sale)

    $('#saleModal').modal('show');
    $('#modalSale_title').html(`Modifica Venta`)
    $('#modalSale_body').html(createModalBody())
    
    $('#modalSale_footer').html(`
         <button class="btn btn-dark" data-dismiss="modal">
            <i ="color:#E74C3C;" class="fas fa-times"></i> CERRAR
        </button>

        <button class="btn btn-info" id="saveSale">
            <i ="color:#3498db;" class="fas fa-check"></i> GUARDAR
        </button>
    `)

    console.log(moment(sale.date).format('DD/MM/YYYY'))

    $('#saleDate').val(moment.utc(sale.date).format('DD/MM/YYYY'))
    $('#saleRUT').val(sale.rut)
    $('#saleName').val(sale.name)
    $('#saleAddress').val(sale.address)
    $('#saleStatus').val(sale.status)
    $('#salePayment').val(sale.payment)
    $('#saleNet').val(dot_separators(sale.net))
    $('#saleIVA').val(dot_separators(sale.iva))
    $('#saleTotal').val(dot_separators(sale.total))

    for(i=0;i<sale.products.length;i++){
        $('#tableProductsBody').append(`
            <tr>
                <td>
                    <button class="btn btn-info" onclick="selectProduct(this)"><i class="fas fa-search"></i></button>
                    <input type="text" style="display: none;" value="${sale.products[i].products._id}">
                </td>
                <td style="width: 40%; text-align: center; font-size: 22px;"><label>${sale.products[i].products.name}</label></td>
                <td style="text-align: center;">
                    <button class="btn btn-sm btn-info" onclick="qtyControl(this,'minus')" style="display: inline-block;"><i class="fas fa-minus-circle"></i></button>
                    <input type="text" class="form-control border-input" style="text-align: center; display: inline-block; width: 30%" onkeyup="calculateTotal()" value="${sale.products[i].quantity}">
                    <button class="btn btn-sm btn-info" onclick="qtyControl(this,'plus')" style="display: inline-block;"><i class="fas fa-plus-circle"></i></button>
                </td>
                <td><input type="text" class="form-control border-input" style="text-align: right" onkeyup="calculateTotal()" value="${sale.products[i].value}"></td>
                <td><input type="text" class="form-control border-input" style="text-align: right" value="${dot_separators(sale.products[i].quantity * sale.products[i].value)}" disabled></td>
                <td><button class="btn btn-danger" onclick="deletePurchase(this)"><i class="fas fa-times"></i></button></td>
            </tr>
        `)
    }

    for(i=0;i<sale.services.length;i++){
        $('#tableServicesBody').append(`
            <tr>
                <td>
                    <button class="btn btn-warning" onclick="selectProduct(this)"><i class="fas fa-search"></i></button>
                    <input type="text" style="display: none;" value="${sale.services[i].services._id}">
                </td>
                <td style="width: 40%; text-align: center; font-size: 22px;"><label>${sale.services[i].services.name}</label></td>
                <td style="text-align: center;">
                    <button class="btn btn-sm btn-warning" onclick="qtyControl(this,'minus')" style="display: inline-block; visibility: hidden;"><i class="fas fa-minus-circle"></i></button>
                    <input type="text" class="form-control border-input" style="text-align: center; display: inline-block; width: 30%" onkeyup="calculateTotal()" value="${sale.services[i].quantity}" disabled>
                    <button class="btn btn-sm btn-warning" onclick="qtyControl(this,'plus')" style="display: inline-block; visibility: hidden;"><i class="fas fa-plus-circle"></i></button>
                </td>
                <td><input type="text" class="form-control border-input" style="text-align: right" onkeyup="calculateTotal()" value="${sale.services[i].value}"></td>
                <td><input type="text" class="form-control border-input" style="text-align: right" value="${dot_separators(sale.services[i].quantity * sale.services[i].value)}" disabled></td>
                <td><button class="btn btn-danger" onclick="deletePurchase(this)"><i class="fas fa-times"></i></button></td>
            </tr>
        `)
    }

    $('#saleDate').daterangepicker({
        opens: 'left',
        locale: dateRangePickerDefaultLocale,
        singleDatePicker: true,
        autoApply: true
        //endDate: moment()
    }, function(start, end, label) {
        //internals.initDate = start.format('YYYY-MM-DD')
        //internals.endDate = end.format('YYYY-MM-DD')
    })

   
    $('#saveSale').on('click', async function () {

        let products = []
        let services = []
        let goSave = false

        if($("#tableProductsBody tr").length>0 || $("#tableServicesBody tr").length>0){
            goSave = true
        }
        $("#tableProductsBody tr").each(function(){
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
        });

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
        });

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
            payment: $('#salePayment').val()
        }

        
        if(products.length>0){
            saleData.products = products
        }
        if(services.length>0){
            saleData.services = services
        }
        

        console.log(saleData)
        
        const res = validateSaleData(saleData)
        if(res.ok){
            let updateSale = await axios.post('/api/saleUpdate', res.ok)
            if(updateSale.data){
                if(updateSale.data._id){
                    $('#saleModal').modal('hide')

                    $('#modal_title').html(`Almacenado`)
                    $('#modal_body').html(`<h5 class="alert-heading">Venta almacenada correctamente</h5>`)
                    chargeSalesTable()
                }else{
                    $('#modal_title').html(`Error`)
                    $('#modal_body').html(`<h5 class="alert-heading">Error al almacenar, favor reintente</h5>`)
                }
            }else{
                $('#modal_title').html(`Error`)
                $('#modal_body').html(`<h5 class="alert-heading">Error al almacenar, favor reintente</h5>`)
            }
            $('#modal').modal('show');
        }

    })
})


function validateSaleData(productData) {
    let errorMessage = ''

    
    if(!validateRut(productData.rut)){
        errorMessage += '<br>RUT no válido'
    }
    if(productData.name==''){
        errorMessage += '<br>Nombre'
    }
    if(productData.address==''){
        errorMessage += '<br>Dirección'
    }

    if (errorMessage.length===0) {
        return { ok: productData }
    } else {
        $(document).on('hidden.bs.modal', '.modal', function () { //Soluciona problema de scroll
            $('.modal:visible').length && $(document.body).addClass('modal-open');
        });

        $('#modal').modal('show');
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
            RUT Cliente
            <input id="saleRUT" type="text" class="form-control border-input">
        </div>
        <div class="col-md-4">
            Nombre Cliente
            <input id="saleName" type="text" class="form-control border-input">
        </div>
        <div class="col-md-4">
            Fecha
            <input id="saleDate" type="text" class="form-control border-input" value="${moment().format('DD-MM-YYYY')}">
        </div>

        <div class="col-md-8">
            Dirección
            <input id="saleAddress" type="text" class="form-control border-input">
        </div>
        <div class="col-md-4">
            Estado
            <br/>
            <select id="saleStatus" class="form-select">
                <option value="PENDIENTE">PENDIENTE</option>
                <option value="PAGADO" selected>PAGADO</option>
                <option value="CANCELADO">CANCELADO</option>
            </select>
        </div>

        <div class="col-md-3">
            <br/>
            <button class="btn btn-primary" onclick="addProduct()"><i class="fas fa-plus-circle"></i> Agregar Producto</button>
            <br/>
            <br/>
        </div>
        <div class="col-md-3">
            <br/>
            <button class="btn btn-warning" onclick="addService()"><i class="fas fa-plus-circle"></i> Agregar Servicio</button>
            <br/>
            <br/>
        </div>
        <div class="col-md-12" style="height:300px; overflow-y:scroll;">
            <table id="tableProducts" class="display nowrap table table-condensed" cellspacing="0">
                <thead id="tableProductsHead">
                    <tr class="table-info">
                        <th></th>
                        <th style="text-align: center">Producto</th>
                        <th style="text-align: center">Cantidad</th>
                        <th style="text-align: center">Costo Unitario</th>
                        <th style="text-align: center">SubTotal</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody id="tableProductsBody">
                </tbody>
                <tbody id="tableServicesBody">
                </tbody>
            </table>
        </div>


        <div class="col-md-6">
        </div>
        <div class="col-md-2">
            Forma de Pago
            <br/>
            <select id="salePayment" class="form-select">
                <option value="EFECTIVO">EFECTIVO</option>
                <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                <option value="WEBPAY">WEBPAY</option>
            </select>
        </div>
        <div class="col-md-4">
            <table>
                <tr>
                    <td>Neto</td>
                    <td><input id="saleNet" type="text" class="form-control border-input" style="text-align: right" disabled></td>
                </tr>
                <tr>
                    <td>IVA</td>
                    <td><input id="saleIVA" type="text" class="form-control border-input" style="text-align: right" disabled></td>
                </tr>
                <tr>
                    <td>Total</td>
                    <td><input id="saleTotal" type="text" class="form-control border-input" style="text-align: right" disabled></td>
                </tr>
            </table>
        </div>

    </div>
`
    return body
}

function addProduct(){

    $('#tableProductsBody').append(`
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
    `)
    
}

function addService(){

    $('#tableServicesBody').append(`
        <tr>
            <td>
                <button class="btn btn-warning" onclick="selectService(this)"><i class="fas fa-search"></i></button>
                <input type="text" style="display: none;" value="0">
            </td>
            <td style="width: 40%; text-align: center; font-size: 22px;"><label>~SELECCIONE SERVICIO~</label></td>
            <td style="text-align: center;">
                <button class="btn btn-sm btn-warning" style="display: inline-block; visibility: hidden;"><i class="fas fa-minus-circle"></i></button>
                <input type="text" class="form-control border-input" style="text-align: center; display: inline-block; width: 30%" value="1" disabled>
                <button class="btn btn-sm btn-warning" style="display: inline-block; visibility: hidden;"><i class="fas fa-plus-circle"></i></button>
            </td>
            <td><input type="text" class="form-control border-input" style="text-align: right" onkeyup="calculateTotal()"></td>
            <td><input type="text" class="form-control border-input" style="text-align: right" disabled></td>
            <td><button class="btn btn-danger" onclick="deletePurchase(this)"><i class="fas fa-times"></i></button></td>
        </tr>
    `)
    
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

    $("#tableProductsBody tr").each(function(){

        let qty = $($($(this).children()[2]).children()[1]).val()
        let price = $($($(this).children()[3]).children()[0]).val()

        console.log(qty,price)
        
        if($.isNumeric(qty,price)){
            $($($(this).children()[4]).children()[0]).val(qty * price)
            net += qty * price
        }
    });

    $("#tableServicesBody tr").each(function(){
        let price = $($($(this).children()[3]).children()[0]).val()

        if($.isNumeric(price)){
            $($($(this).children()[4]).children()[0]).val(price)
            net += parseInt(price)
        }
    });

    let iva = Math.round(net * 0.19)

    $("#saleNet").val(dot_separators(net))
    $("#saleIVA").val(dot_separators(iva))
    $("#saleTotal").val(dot_separators(net + iva))
}

async function getSold(id){
    if(id==0){
        $("#productSold").val(0)
    }else{
        $("#productSold").val(0)
    }
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
                        $(row).find('td:eq(0)').html('<img src="'+data.image+'" style="width: 100px; height: 100px;">');
                        $(row).find('td:eq(2)').html(dot_separators(data.stock));
                        $(row).find('td:eq(3)').html(dot_separators(data.cost));
                        $(row).find('td:eq(4)').html(dot_separators(data.price));
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
                        internals.products.table.$('tr.selected').removeClass('selected');
                        $(this).addClass('selected');
                        internals.productRowSelected = internals.products.table.row($(this)).data()
                    }

                    console.log(internals.productRowSelected)
                })

            } catch (error) {
                loadingHandler('stop')

                console.log(error)
            }
        },
        preConfirm: async () => {
            try {
                let productSelected = internals.productRowSelected

                console.log("selected", productSelected)
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


async function selectService(btn) {
    
    let serviceSelectedData = await Swal.fire({
        title: 'Seleccione Servicio',
        customClass: 'swal-wide',
        html: `
            <div style="max-height: 400px !important; overflow-y: scroll;">
                <table id="tableSearchServices" class="display nowrap table table-condensed" cellspacing="0">
                    <thead>
                        <tr class="table-info">
                            <th>SERVICIO</th>
                            <th>VALOR</th>
                            <th>ESTADO</th>
                        </tr>
                    </thead>
                    <tbody id="tableSearchServicesBody"></tbody>
                </table>
            </div>
        `,
        onBeforeOpen: () => {
            try {
                if($.fn.DataTable.isDataTable('#tableSearchServices')){
                    internals.services.table.clear().destroy()
                }
                internals.services.table = $('#tableSearchServices')
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
                    columnDefs: [{targets: [1], className: 'dt-right'},
                                {targets: [2], className: 'dt-center'}],
                    order: [[ 0, 'desc' ]],
                    ordering: true,
                    rowCallback: function( row, data ) {
                        $(row).find('td:eq(1)').html(dot_separators(data.value));
                    },
                    columns: [
                        { data: 'name' },
                        { data: 'value' },
                        { data: 'status' }
                    ],
                    initComplete: function (settings, json) {
                        getServices()
                    }
                })
        
                $('#tableSearchServices tbody').off("click")
        
                $('#tableSearchServices tbody').on('click', 'tr', function () {
                    if ($(this).hasClass('selected')) {
                        $(this).removeClass('selected')
                    } else {
                        internals.services.table.$('tr.selected').removeClass('selected');
                        $(this).addClass('selected');
                        internals.serviceRowSelected = internals.services.table.row($(this)).data()
                    }

                    console.log(internals.serviceRowSelected)
                })

            } catch (error) {
                loadingHandler('stop')

                console.log(error)
            }
        },
        preConfirm: async () => {
            try {
                let serviceSelected = internals.serviceRowSelected

                console.log("selected", serviceSelected)
                if (serviceSelected) {
                    return {
                        ...serviceSelected
                    }
                }

                throw new Error('Debe seleccionar un serviceo.')
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

    if (serviceSelectedData.value) {
        $($(btn).parent().children()[1]).val(serviceSelectedData.value._id)
        $($($(btn).parent().parent().children()[1]).children()[0]).text(serviceSelectedData.value.name)
        $($($(btn).parent().parent().children()[2]).children()[1]).val(1)
        $($($(btn).parent().parent().children()[3]).children()[0]).val(serviceSelectedData.value.value)

        calculateTotal()

    }
}

async function getServices(){
    let serviceData = await axios.get('api/services')
    if (serviceData.data.length > 0) {
        internals.services.table.rows.add(serviceData.data).draw()
    }
}


function testing(){

    $('#saleRUT').val('17.172.852-5')
    $('#saleName').val('ENZO')
    $('#saleAddress').val('CALLE UNO #2301')
    /*$('#productPrice').val(4000)
    $('#productDescription').val('Rollo de 3mts')
    $('#tableProductsBody').append(`
    <tr>
        <td><input type="text" class="form-control border-input" style="text-align: center" value="${moment().format('DD/MM/YYYY')}" disabled></td>
        <td><input type="text" class="form-control border-input" style="text-align: right" onkeyup="calculateStock()" value="20"></td>
        <td><input type="text" class="form-control border-input" style="text-align: right" value="3000"></td>
        <td><button class="btn btn-danger" onclick="deletePurchase(this)"><i class="fas fa-times"></i></button></td>
    </tr>
`)*/
}