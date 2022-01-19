let internals = {
    inventory: {
        table: {},
        data: []
    },
    dataRowSelected: {}
}

let clients = {}
let containerTypes = {}
let sites = {}
let cranes = {}

$(document).ready(async function () {
    chargeInventoryTable()
    //getParameters()
})

async function getParameters() {
    let clientsData = await axios.get('api/clients')
    clients = clientsData.data

}

function chargeInventoryTable() {
    try {
        if($.fn.DataTable.isDataTable('#tableInventory')){
            internals.inventory.table.clear().destroy()
        }
        internals.inventory.table = $('#tableInventory')
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
            getInventoryEnabled()
          }
        })

        $('#tableInventory tbody').off("click");

        $('#tableInventory tbody').on('click', 'tr', function () {
            console.log($(this).hasClass('selected'))
            if ($(this).hasClass('selected')) {
                $(this).removeClass('selected')
                $('#updateProduct').prop('disabled', true)
            } else {
                internals.inventory.table.$('tr.selected').removeClass('selected');
                $(this).addClass('selected');
                $('#updateProduct').prop('disabled', false)
                //internals.inventory.data = internals.inventory.table.row($(this)).data()
                internals.dataRowSelected = internals.inventory.table.row($(this)).data()
            }
        })
      } catch (error) {
        console.log(error)
      }

}

async function getInventoryEnabled() {
    let inventoryData = await axios.get('api/inventory')

    if (inventoryData.data.length > 0) {
        let formatData= inventoryData.data.map(el => {
            el.datetime = moment(el.datetime).format('DD/MM/YYYY HH:mm')

            return el
        })

        internals.inventory.table.rows.add(formatData).draw()
        $('#loadingInventory').empty()
    } else {
        console.log('vacio', inventoryData);
        toastr.warning('No se han encontrado datos de usuarios')
        $('#loadingInventory').empty()
    }
}

$('#searchProduct').on('click', async function () {
    chargeInventoryTable()
})

$('#createProduct').on('click', function () { // CREAR MOVIMIENTO
    $('#productModal').modal('show');
    $('#modalProd_title').html(`Nuevo Ingreso`)
    $('#modalProd_body').html(createModalBody())

    document.getElementById('fileToUpload').addEventListener('change', handleFileSelect, false);

    $('#modalProd_footer').html(`
        <button class="btn btn-dark" data-dismiss="modal">
            <i ="color:#E74C3C;" class="fas fa-times"></i> CERRAR
        </button>

        <button class="btn btn-info" id="saveProduct">
            <i ="color:#3498db;" class="fas fa-check"></i> GUARDAR
        </button>
    `)

    getSold(0)

    $('#saveProduct').on('click', async function () {

        let purchases = []
        let stockTotal = 0
        let goSave = true
        $("#tableProductBody tr").each(function(){
            if($($($(this).children()[0]).children()[0])){

                if(!$.isNumeric($($($(this).children()[1]).children()[0]).val()) || !$.isNumeric($($($(this).children()[2]).children()[0]).val())){
                    goSave = false
                }else{
                    stockTotal+=parseInt($($($(this).children()[1]).children()[0]).val())
                }
                let date = $($($(this).children()[0]).children()[0]).val().split('/')
                purchases.push({
                    date: date[2]+'-'+date[1]+'-'+date[0],
                    cost: parseInt($($($(this).children()[2]).children()[0]).val()),
                    quantity: parseInt($($($(this).children()[1]).children()[0]).val())
                })
            }
        });

        if(!goSave){
            toastr.warning('Debe ingresar valores correctos')
            return
        }
        
        let productData = {
            name: $('#productName').val(),
            //image: $('#productImage').prop('src'),
            image: b64img,
            stock: stockTotal,
            price: $('#productPrice').val(),
            status: $('#productStatus').val(),
            description: $('#productDescription').val(),
            purchases: purchases
        }

        const res = validateProductData(productData)
        if(res.ok){
            let saveProduct = await axios.post('/api/productSave', res.ok)
            if(saveProduct.data){
                if(saveProduct.data._id){
                    $('#productModal').modal('hide')

                    $('#modal_title').html(`Almacenado`)
                    $('#modal_body').html(`<h5 class="alert-heading">Producto almacenado correctamente</h5>`)
                    chargeInventoryTable()
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


$('#updateProduct').on('click', async function () {

    let productData = await axios.post('/api/productSingle', {id: internals.dataRowSelected._id})
    let product = productData.data

    $('#productModal').modal('show');
    $('#modalProd_title').html(`Modifica Producto`)
    $('#modalProd_body').html(createModalBody())
    
    document.getElementById('fileToUpload').addEventListener('change', handleFileSelect, false);

    $('#modalProd_footer').html(`
         <button class="btn btn-dark" data-dismiss="modal">
            <i ="color:#E74C3C;" class="fas fa-times"></i> CERRAR
        </button>

        <button class="btn btn-info" id="saveProduct">
            <i ="color:#3498db;" class="fas fa-check"></i> GUARDAR
        </button>
    `)

    $('#productName').val(product.name)
    $('#productImage').prop('src',product.image)
    $('#productStock').val(product.stock)
    $('#productPrice').val(product.price)
    $('#productStatus').val(product.status)
    $('#productDescription').val(product.description)

    getSold(internals.dataRowSelected._id)

    for(i=0;i<product.purchases.length;i++){
        $('#tableProductBody').append(`
            <tr>
                <td><input type="text" class="form-control border-input" style="text-align: center" value="${moment(product.purchases[i].date).format('DD/MM/YYYY')}" disabled></td>
                <td><input type="text" class="form-control border-input" style="text-align: right" onkeyup="calculateStock()" value="${product.purchases[i].quantity}"></td>
                <td><input type="text" class="form-control border-input" style="text-align: right" value="${product.purchases[i].cost}"></td>
                <td><button class="btn btn-danger" onclick="deletePurchase(this)"><i class="fas fa-times"></i></button></td>
            </tr>
        `)
    }

    
    $('#saveProduct').on('click', async function () {
        let purchases = []
        let stockTotal = 0
        let goSave = true
        $("#tableProductBody tr").each(function(){
            if($($($(this).children()[0]).children()[0])){

                if(!$.isNumeric($($($(this).children()[1]).children()[0]).val()) || !$.isNumeric($($($(this).children()[2]).children()[0]).val())){
                    goSave = false
                }else{
                    stockTotal+=parseInt($($($(this).children()[1]).children()[0]).val())
                }
                let date = $($($(this).children()[0]).children()[0]).val().split('/')
                purchases.push({
                    date: date[2]+'-'+date[1]+'-'+date[0],
                    cost: parseInt($($($(this).children()[2]).children()[0]).val()),
                    quantity: parseInt($($($(this).children()[1]).children()[0]).val())
                })
            }
        });

        if(!goSave){
            toastr.warning('Debe ingresar valores correctos')
            return
        }
        
        let productData = {
            id: internals.dataRowSelected._id,
            name: $('#productName').val(),
            image: $('#productImage').prop('src'),
            stock: stockTotal,
            price: $('#productPrice').val(),
            status: $('#productStatus').val(),
            description: $('#productDescription').val(),
            purchases: purchases
        }

        const res = validateProductData(productData)
        if(res.ok){
            let saveProduct = await axios.post('/api/productUpdate', res.ok)
            if(saveProduct.data){
                if(saveProduct.data._id){
                    $('#productModal').modal('hide')

                    $('#modal_title').html(`Almacenado`)
                    $('#modal_body').html(`<h5 class="alert-heading">Datos actualizados correctamente</h5>`)
                    chargeInventoryTable()
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


function validateProductData(productData) {
    let errorMessage = ''

    if(productData.name==''){
        errorMessage += '<br>Nombre'
    }
    if(productData.price.length==0){
        if(!$.isNumeric(productData.price)){
            errorMessage += '<br>Precio'
        }else{
            productData.price = parseInt(productData.price)
        }
    }

    if(productData.purchases.length==0){
        errorMessage += '<br>Ningún registro de Stock'
    }
    
    if(productData.description==''){
        errorMessage += '<br>Descripción'
    }

    if (errorMessage.length===0) {
        return { ok: productData }
    } else {
        $(document).on('hidden.bs.modal', '.modal', function () { //Soluciona problema de scroll
            $('.modal:visible').length && $(document.body).addClass('modal-open');
        });

        $('#modal').modal('show');
        $('#modal_title').html(`Error al almacenar Ingreso`)
        $('#modal_body').html(`<h5 class="alert-heading">Falta ingresar los siguientes datos:</h5>
                                    <p class="mb-0">${errorMessage}</p>`)

        return { err: productData }
    }
}

function createModalBody(){
    let body = `
    <div class="row">

        <div class="col-md-6">
            <h6>DATOS GENERALES</h6>
        </div>
        <div class="col-md-6">
            <button class="btn btn-primary" onclick="testing()">Rellenar</button>
        </div>
        <div class="col-md-8">
            <div class="row">
                <div class="col-md-4">
                    Nombre Producto
                    <input id="productName" type="text" class="form-control border-input">
                </div>
                <div class="col-md-4">
                    Precio de Venta
                    <input id="productPrice" type="text" class="form-control border-input">
                </div>
                <div class="col-md-4">
                    Estado
                    <br/>
                    <select id="productStatus" class="form-select">
                        <option value="HABILITADO">HABILITADO</option>
                        <option value="DESHABILITADO">DESHABILITADO</option>
                    </select>
                </div>

                <div class="col-md-12">
                    <br/>
                    <button class="btn btn-primary" onclick="addStock()"><i class="fas fa-plus-circle"></i> Agregar stock</button>
                </div>
                <div class="col-md-12" style="height:300px; overflow-y:scroll;">
                    <table id="tableProduct" class="display nowrap table table-condensed" cellspacing="0">
                        <thead id="tableProductHead">
                            <tr class="table-info">
                                <th style="text-align: center">Fecha</th>
                                <th style="text-align: center">Cantidad</th>
                                <th style="text-align: center">Costo Unitario</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody id="tableProductBody">
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        <div class="col-md-4">
            <div class="row">
                <div class="col-md-12">
                    <div class="card" style="width: 350px;">
                        <img id="productImage" class="card-img-top" src="/public/img/no_available.png" style="height: 262px;"/>
                        <div class="card-body">
                            <input class="btn btn-primary" type="file" name="fileToUpload" id="fileToUpload">
                            <!--<input class="btn btn-primary" type="file" name="fileToUpload" id="fileToUpload" onchange="readURL(this)">-->
                        </div>
                    </div>
                </div>
                <div class="col-md-12">
                    <table>
                        <tr>
                            <td>Cantidad Vendida</td>
                            <td><input id="productSold" type="text" class="form-control border-input" style="text-align: right" disabled></td>
                        </tr>
                        <tr>
                            <td>Stock Restante</td>
                            <td><input id="productStock" type="text" class="form-control border-input" style="text-align: right" disabled></td>
                        </tr>
                    </table>
                </div>
            </div>
        </div>


        <div class="form-group col-md-12">
            <h6 class="card-title">&nbsp;Descripción</h6>
            <textarea id="productDescription" placeholder="EJEMPLO" class="form-control" rows="5"></textarea>
        </div>

    </div>
`
    return body
}

function readURL(input) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();

        reader.onload = function (e) {
            $('#productImage').attr('src', e.target.result);
        };

        reader.readAsDataURL(input.files[0]);
    }
}


function addStock(){

    $('#tableProductBody').append(`
        <tr>
            <td><input type="text" class="form-control border-input" style="text-align: center" value="${moment().format('DD/MM/YYYY')}" disabled></td>
            <td><input type="text" class="form-control border-input" style="text-align: right" onkeyup="calculateStock()"></td>
            <td><input type="text" class="form-control border-input" style="text-align: right"></td>
            <td><button class="btn btn-danger" onclick="deletePurchase(this)"><i class="fas fa-times"></i></button></td>
        </tr>
    `)
}

function deletePurchase(btn){
    $(btn).parent().parent().remove()
}

function calculateStock(){
    let sold = 0
    let stock = 0

    if($.isNumeric($("#productSold").val())){
        sold = parseInt($("#productSold").val())
    }

    $("#tableProductBody tr").each(function(){
        if($.isNumeric($($($(this).children()[1]).children()[0]).val())){
            stock+=parseInt($($($(this).children()[1]).children()[0]).val())
        }
    });

    $("#productStock").val(stock-sold)
}

async function getSold(id){
    if(id==0){
        $("#productSold").val(0)
    }else{
        $("#productSold").val(0)
    }
}

function handleFileSelect(evt) {

    console.log(evt)
       
    if (check_multifile_extension(evt.target.files[0].type)) {
        let files = evt.target.files;
        var reader = new FileReader();

        let tam = (evt.target.files[0].size)/1024

        if (tam > 10000){

           
            b64img = ''
            var span = document.createElement('span');
            span.innerHTML = ['<span class="badge badge-pill badge-danger">Error: Tamaño supera 10MB </span>'].join('');
            
            $('#list').html(span)
            toastr.error("Foto supera tamaño máximo, favor reducir tamaño")
            b64img = ''

        }else{

            reader.onload = (function(theFile) {
                return function(e) {
                    console.log("here",e.result)
                    b64img = e.target.result
                    $('#productImage').attr('src', e.target.result);
                };
            })(files[0]);

            // Read in the image file as a data URL.
            reader.readAsDataURL(files[0]);
        }
      
    } else {
        var span = document.createElement('span');
        span.innerHTML = ['<span class="badge badge-pill badge-danger">Error: Debe subir una imagen</span>'].join('');
        
        $('#list').html(span)
        toastr.warning('Debe subir una imagen')
        b64img = ''
    }  
}

function check_multifile_extension(extension) {
    if (extension === 'image/jpeg' || extension === 'image/jpg' || extension === 'image/png') {
        return true;
    } else {
        return false;
    }
}

function testing(){

    $('#productName').val('VENDA'),
    $('#productImage').prop('src','/public/img/logo.png'),
    $('#productPrice').val(4000),
    $('#productDescription').val('Rollo de 3mts'),
    $('#tableProductBody').append(`
    <tr>
        <td><input type="text" class="form-control border-input" style="text-align: center" value="${moment().format('DD/MM/YYYY')}" disabled></td>
        <td><input type="text" class="form-control border-input" style="text-align: right" onkeyup="calculateStock()" value="20"></td>
        <td><input type="text" class="form-control border-input" style="text-align: right" value="3000"></td>
        <td><button class="btn btn-danger" onclick="deletePurchase(this)"><i class="fas fa-times"></i></button></td>
    </tr>
`)
}