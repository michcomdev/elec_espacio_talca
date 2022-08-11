let internals = {
    services: {
        table: {},
        data: []
    },
    dataRowSelected: {}
}


$(document).ready(async function () {
    chargeServiceTable()
})

function chargeServiceTable() {
    try {
        if($.fn.DataTable.isDataTable('#tableServices')){
            internals.services.table.clear().destroy()
        }
        internals.services.table = $('#tableServices')
        .DataTable( {
            dom: 'Bfrtip',
            buttons: [
              {
                extend: 'excel',
                className: 'btn-excel'
              },
              {
                extend: 'pdf',
                className: 'btn-pdf'
              }
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
            //columnDefs: [{targets: [0,1,2], className: 'dt-center'}],
            order: [[ 0, 'desc' ]],
            ordering: true,
            rowCallback: function( row, data ) {
                //$(row).find('td:eq(1)').html(dot_separators(data.value));
            },
            columns: [
                { data: 'name' },
                { data: 'type' },
                { data: 'invoice' },
                { data: 'value' },
                { data: 'status' }
            ],
            initComplete: function (settings, json) {
                getServicesEnabled()
            }
        })

        $('#tableServices tbody').off("click")

        $('#tableServices tbody').on('click', 'tr', function () {
            console.log($(this).hasClass('selected'))
            if ($(this).hasClass('selected')) {
                $(this).removeClass('selected')
                $('#updateService').prop('disabled', true)
            } else {
                internals.services.table.$('tr.selected').removeClass('selected');
                $(this).addClass('selected');
                $('#updateService').prop('disabled', false)
                //internals.services.data = internals.services.table.row($(this)).data()
                internals.dataRowSelected = internals.services.table.row($(this)).data()
            }
        })
      } catch (error) {
        console.log(error)
      }

}

async function getServicesEnabled() {
    let servicesData = await axios.get('api/services')

    if (servicesData.data.length > 0) {
        let formatData= servicesData.data.map(el => {

            /*if(el.invoice){
                el.invoice = '<i style="color: #17A2B8;" class="fas fa-check-circle"></i>'
            }else{
                el.invoice = '<i style="color: #D9534F;" class="fas fa-times-circle"></i>'
            }*/
            if(el.invoice=='MENSUAL'){
                el.invoice = 'Boleta Mensual'
            }else{
                el.invoice = 'Extra'
            }
            

            return el
        })

        internals.services.table.rows.add(formatData).draw()
        $('#loadingServices').empty()
    } else {
        console.log('vacio', servicesData);
        toastr.warning('No se han encontrado datos')
        $('#loadingServices').empty()
    }
}

$('#searchService').on('click', async function () {
    chargeServiceTable()
})

$('#createService').on('click', function () { // CREAR MOVIMIENTO
    $('#serviceModal').modal('show');
    $('#modalService_title').html(`Nuevo Ingreso`)
    $('#modalService_body').html(createModalBody())


    $('#modalService_footer').html(`
        <button class="btn btn-dark" data-dismiss="modal">
            <i class="fas fa-times"></i> CERRAR
        </button>

        <button class="btn btn-info" id="saveService">
            <i class="fas fa-check"></i> GUARDAR
        </button>
    `)

    $('#saveService').on('click', async function () {

        
        let serviceData = {
            name: $('#serviceName').val(),
            type: $('#serviceType').val(),
            invoice: $('#serviceInvoice').val(),
            value: $('#serviceValue').val(),
            status: $('#serviceStatus').val(),
            description: $('#serviceDescription').val()
        }

        console.log(serviceData)

        const res = validateServiceData(serviceData)
        if(res.ok){
            let saveService = await axios.post('/api/serviceSave', res.ok)
            if(saveService.data){
                if(saveService.data._id){
                    $('#serviceModal').modal('hide')

                    $('#modal_title').html(`Almacenado`)
                    $('#modal_body').html(`<h5 class="alert-heading">Servicio almacenado correctamente</h5>`)
                    chargeServiceTable()
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


$('#updateService').on('click', async function () {

    let serviceData = await axios.post('/api/serviceSingle', {id: internals.dataRowSelected._id})
    let service = serviceData.data

    $('#serviceModal').modal('show');
    $('#modalService_title').html(`Modifica Servicio`)
    $('#modalService_body').html(createModalBody())
    
    $('#modalService_footer').html(`
         <button class="btn btn-dark" data-dismiss="modal">
            <i class="fas fa-times"></i> CERRAR
        </button>

        <button class="btn btn-info" id="saveService">
            <i class="fas fa-check"></i> GUARDAR
        </button>
    `)

    $('#serviceName').val(service.name)
    $('#serviceType').val(service.type)
    $('#serviceInvoice').val(service.invoice)
    $('#serviceValue').val(service.value)
    $('#serviceStatus').val(service.status)
    $('#serviceDescription').val(service.description)
    
    $('#saveService').on('click', async function () {
        
        let serviceData = {
            id: internals.dataRowSelected._id,
            name: $('#serviceName').val(),
            type: $('#serviceType').val(),
            invoice: $('#serviceInvoice').val(),
            value: $('#serviceValue').val(),
            status: $('#serviceStatus').val(),
            description: $('#serviceDescription').val()
        }

        const res = validateServiceData(serviceData)
        if(res.ok){
            let saveService = await axios.post('/api/serviceUpdate', res.ok)
            if(saveService.data){
                if(saveService.data._id){
                    $('#serviceModal').modal('hide')

                    $('#modal_title').html(`Almacenado`)
                    $('#modal_body').html(`<h5 class="alert-heading">Datos actualizados correctamente</h5>`)
                    chargeServiceTable()
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


function validateServiceData(serviceData) {
    let errorMessage = ''

    if(serviceData.name==''){
        errorMessage += '<br>Nombre'
    }

    if(!$.isNumeric(serviceData.value)){
        errorMessage += '<br>Valor'
    }
    
    /*if(serviceData.description==''){
        errorMessage += '<br>Descripción'
    }*/

    if (errorMessage.length===0) {
        return { ok: serviceData }
    } else {
        $(document).on('hidden.bs.modal', '.modal', function () { //Soluciona problema de scroll
            $('.modal:visible').length && $(document.body).addClass('modal-open');
        });

        $('#modal').modal('show');
        $('#modal_title').html(`Error al almacenar Ingreso`)
        $('#modal_body').html(`<h5 class="alert-heading">Falta ingresar los siguientes datos:</h5>
                                    <p class="mb-0">${errorMessage}</p>`)

        return { err: serviceData }
    }
}

function createModalBody(){
    let body = `
                <div class="row">
                    <div class="col-md-3">
                        Nombre Servicio
                        <input id="serviceName" type="text" class="form-control form-control-sm border-input">
                    </div>
                    <div class="col-md-3">
                        Tipo
                        <br/>
                        <select id="serviceType" class="form-select form-select-sm">
                            <option value="OTROS">OTROS</option>
                            <option value="ALCANTARILLADO">ALCANTARILLADO</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        Aplica en
                        <br/>
                        <select id="serviceInvoice" class="form-select form-select-sm">
                            <option value="MENSUAL">BOLETA MENSUAL</option>
                            <option value="EXTRA">BOLETA EXTRA</option>
                        </select>
                    </div>
                    <div class="col-md-4">
                        Valor
                        <input id="serviceValue" type="text" class="form-control form-control-sm border-input">
                    </div>
                    <div class="col-md-3">
                        Estado
                        <br/>
                        <select id="serviceStatus" class="form-select form-select-sm">
                            <option value="HABILITADO">HABILITADO</option>
                            <option value="DESHABILITADO">DESHABILITADO</option>
                        </select>
                    </div>

                    <div class="form-group col-md-12">
                        Descripción
                        <br/>
                        <textarea id="serviceDescription" placeholder="EJEMPLO" class="form-control form-control-sm" rows="5"></textarea>
                    </div>

                </div>
            `
    return body
}