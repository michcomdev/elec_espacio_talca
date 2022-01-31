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
            el.datetime = moment(el.datetime).format('DD/MM/YYYY HH:mm')

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
            <i ="color:#E74C3C;" class="fas fa-times"></i> CERRAR
        </button>

        <button class="btn btn-info" id="saveService">
            <i ="color:#3498db;" class="fas fa-check"></i> GUARDAR
        </button>
    `)

    $('#saveService').on('click', async function () {

        
        let serviceData = {
            name: $('#serviceName').val(),
            value: $('#serviceValue').val(),
            status: $('#serviceStatus').val(),
            description: $('#serviceDescription').val()
        }

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
            <i ="color:#E74C3C;" class="fas fa-times"></i> CERRAR
        </button>

        <button class="btn btn-info" id="saveService">
            <i ="color:#3498db;" class="fas fa-check"></i> GUARDAR
        </button>
    `)

    $('#serviceName').val(service.name)
    $('#serviceValue').val(service.value)
    $('#serviceStatus').val(service.status)
    $('#serviceDescription').val(service.description)
    
    $('#saveService').on('click', async function () {
        
        let serviceData = {
            id: internals.dataRowSelected._id,
            name: $('#serviceName').val(),
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

    if(serviceData.value.length!=0){
        if(!$.isNumeric(serviceData.value)){
            errorMessage += '<br>Precio'
        }else{
            serviceData.value = parseInt(serviceData.value)
        }
    }else{
        errorMessage += '<br>Precio'
    }
    
    if(serviceData.description==''){
        errorMessage += '<br>Descripción'
    }

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
        <div class="col-md-4">
            Nombre Servicio
            <input id="serviceName" type="text" class="form-control border-input">
        </div>
        <div class="col-md-4">
            Precio
            <input id="serviceValue" type="text" class="form-control border-input">
        </div>
        <div class="col-md-4">
            Estado
            <br/>
            <select id="serviceStatus" class="form-select">
                <option value="HABILITADO">HABILITADO</option>
                <option value="DESHABILITADO">DESHABILITADO</option>
            </select>
        </div>

        <div class="form-group col-md-12">
            <h6 class="card-title">&nbsp;Descripción</h6>
            <textarea id="serviceDescription" placeholder="EJEMPLO" class="form-control" rows="5"></textarea>
        </div>

    </div>
`
    return body
}