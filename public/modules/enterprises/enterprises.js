let internals = {
    enterprises: {
        table: {},
        data: []
    },
    rowSelected: {}
}

let types

$(document).ready(async function () {
    loadTypes()
    loadEnterprisesTable()
    disAbleButt(true)
})

async function loadTypes() {
    let typesData = await axios.get('api/types')
    let typesArray = typesData.data
    types = `<option value="0">Seleccione...</option>`
    for(let i=0; i<typesArray.length; i++){
        types += `<option value="${typesArray[i]._id}">${typesArray[i].name}</option>`
    }
}

function loadEnterprisesTable() {
    try {
        if ($.fn.DataTable.isDataTable('#tableEnterprises')) {
            internals.enterprises.table.clear().destroy()
        }

        internals.enterprises.table = $('#tableEnterprises')
            .DataTable({

                dom: 'Bfrtip',
                buttons: ['excel','pdf'],
                iDisplayLength: 50,
                oLanguage: {
                    sSearch: 'buscar: '
                },
                responsive: false,
                order: [[0, 'desc']],
                ordering: true,
                rowCallback: function (row, data) {
                },
                language: {
                    url: spanishDataTableLang
                },
                columns: [
                    { data: 'rut' },
                    { data: 'name' },
                    { data: 'type' }
                ],
                initComplete: function (settings, json) {
                    getEnterprisesEnabled()
                }
            })

        $('#tableEnterprises tbody').on('click', 'tr', function () {
            if ($(this).hasClass('selected')) {
                $(this).removeClass('selected')
                disAbleButt(true)
            } else {
                internals.enterprises.table.$('tr.selected').removeClass('selected')
                $(this).addClass('selected')
                disAbleButt(false)
                internals.enterprises.data = internals.enterprises.table.row($(this)).data()
                internals.rowSelected = internals.enterprises.table.row($(this))
            }
        })
    } catch (error) {
        console.log(error)
    }
}

function disAbleButt(actionDis) {
    $('#updateEnterprise').prop('disabled', actionDis)
    $('#deleteEnterprise').prop('disabled', actionDis)
}

async function getEnterprisesEnabled() {
    let enterpriseData = await axios.get('api/enterprises')

    if (enterpriseData.data.length > 0) {
        let formatData = enterpriseData.data.map(el => {
            /*if (validateRut(el.rut)) {
                el.rut = `${validateRut(el.rut)}`
            } else {
                el.rut = el.rut
            }

            if (el.scope == 'enterprise') {
                el.scope = 'Usuario'
            } else {
                el.scope = 'Administrador'
            }

            if (el.status == 'enabled') {
                el.status = 'Activo'
            } else {
                el.status = 'Desactivado'
            }*/

            return el
        })

        internals.enterprises.table.rows.add(formatData).draw()
        $('#loadingEnterprises').empty()
    } else {
        toastr.warning('No se han encontrado datos de usuarios')
        $('#loadingEnterprises').empty()
    }
}

$('#createEnterprise').on('click', async function () { // CREAR USUARIO
    handleModal()

    $('#enterpriseRUT').on('keyup', function () {
        let rut = $('#enterpriseRUT').val()
        if (validateRut(rut) && rut.length >= 6) {
            $('#enterpriseRUT').val(validateRut($('#enterpriseRUT').val()))
        }
    })

    $('#enterpriseRepresentRUT').on('keyup', function () {
        let rut = $('#enterpriseRepresentRUT').val()
        if (validateRut(rut) && rut.length >= 6) {
            $('#enterpriseRepresentRUT').val(validateRut($('#enterpriseRepresentRUT').val()))
        }
    })

    setTimeout(() => {
        $('#enterpriseRUT').focus()
    }, 500)

    $('#saveEnterprise').on('click', async function () {
        let enterpriseData = {
            //rut: removeSpecials($('#enterpriseRUT').val()),
            rut: $('#enterpriseRUT').val(),
            name: $('#enterpriseName').val(),
            fantasyName: $('#enterpriseFantasyName').val(),
            address: $('#enterpriseAddress').val(),
            types: $('#enterpriseType').val(),
            phone: $('#enterprisePhone').val(),
            email: $('#enterpriseEmail').val(),
            representRUT: removeSpecials($('#enterpriseRepresentRUT').val()),
            representName: $('#enterpriseRepresentName').val(),
            status: $('#enterpriseStatus').val()
        }

        let validate = await validateEnterpriseData(enterpriseData)

        if (validate.ok) {
            let newEnterpriseData = await axios.post('api/enterprises', enterpriseData)
            if (newEnterpriseData.data.error) {
                toastr.warning(newEnterpriseData.data.error)
            } else {
                toastr.success('Usuario creado correctamente')
                loadEnterprisesTable()

                $('#modal').modal('hide')
            }
        }
    })
})

$('#updateEnterprise').on('click', function () { //MODIFICAR USUARIO
    handleModal()

    $('#enterpriseRUT').on('keyup', function () {
        let rut = $('#enterpriseRUT').val()
        if (validateRut(rut) && rut.length >= 6) {
            $('#enterpriseRUT').val(validateRut($('#enterpriseRUT').val()))
        }
    })

    $('#enterpriseRepresentRUT').on('keyup', function () {
        let rut = $('#enterpriseRepresentRUT').val()
        if (validateRut(rut) && rut.length >= 6) {
            $('#enterpriseRepresentRUT').val(validateRut($('#enterpriseRepresentRUT').val()))
        }
    })

    console.log(internals.enterprises.data)
    $('#enterpriseRUT').val(internals.enterprises.data.rut)
    $('#enterpriseName').val(internals.enterprises.data.name)
    $('#enterpriseFantasyName').val(internals.enterprises.data.fantasyName)
    $('#enterpriseAddress').val(internals.enterprises.data.address)
    $('#enterpriseType').val(internals.enterprises.data.types._id)
    $('#enterprisePhone').val(internals.enterprises.data.phone)
    $('#enterpriseEmail').val(internals.enterprises.data.email)
    $('#enterpriseRepresentRUT').val(internals.enterprises.data.representRUT)
    $('#enterpriseRepresentName').val(internals.enterprises.data.representName)
    $('#enterpriseStatus').val(internals.enterprises.data.status)
   
    $('#saveEnterprise').on('click', async function () {

        internals.enterprises.data.rut = $('#enterpriseRUT').val()
        internals.enterprises.data.name = $('#enterpriseName').val()
        internals.enterprises.data.fantasyName = $('#enterpriseFantasyName').val()
        internals.enterprises.data.address = $('#enterpriseAddress').val()
        internals.enterprises.data.types = $('#enterpriseType').val()
        internals.enterprises.data.phone = $('#enterprisePhone').val()
        internals.enterprises.data.email = $('#enterpriseEmail').val()
        internals.enterprises.data.representRUT = $('#enterpriseRepresentRUT').val()
        internals.enterprises.data.representName = $('#enterpriseRepresentName').val()
        internals.enterprises.data.status = $('#enterpriseStatus').val()

        let enterpriseData = {
            _id: internals.enterprises.data._id,
            rut: $('#enterpriseRUT').val(),
            name: $('#enterpriseName').val(),
            fantasyName: $('#enterpriseFantasyName').val(),
            address: $('#enterpriseAddress').val(),
            types: $('#enterpriseType').val(),
            phone: $('#enterprisePhone').val(),
            email: $('#enterpriseEmail').val(),
            representRUT: $('#enterpriseRepresentRUT').val(),
            representName: $('#enterpriseRepresentName').val(),
            status: $('#enterpriseStatus').val()
        }

        let validate = await validateEnterpriseData(enterpriseData)

        console.log(validate)

        if (validate.ok) {
            let newEnterpriseData = await axios.post('api/enterprises', validate.ok)
            if (newEnterpriseData.data.error) {
                toastr.warning(newEnterpriseData.data.error)
            } else {
                toastr.success('Usuario creado correctamente')
                loadEnterprisesTable()

                $('#modal').modal('hide')
            }
        }
    })
})

function handleModal() {
    $('#modal').modal('show');
    $('#modal_title').html(`Registro de Empresa`)
    $('#modal_body').html(`
        <div class="row">
            <div class="col-md-3" style="margin-top:10px;">
                RUT
                <input id="enterpriseRUT" type="text" placeholder="11.111.111-1" class="form-control border-input">
            </div>

            <div class="col-md-5" style="margin-top:10px;">
                Nombre Fantasía
                <input id="enterpriseFantasyName" type="text" class="form-control border-input">
            </div>
            <div class="col-md-4" style="margin-top:10px;">
                Tipo
                <select id="enterpriseType" class="form-control custom-select">
                    ${types}
                </select>
            </div>

            <div class="col-md-8" style="margin-top:10px;">
                Razón Social
                <input id="enterpriseName" type="text" class="form-control border-input">
            </div>

            <div class="col-md-4" style="margin-top:10px;">
                Teléfono Contacto
                <input id="enterprisePhone" type="text" class="form-control border-input">
            </div>

            <div class="col-md-8" style="margin-top:10px;">
                Dirección
                <input id="enterpriseAddress" type="text" class="form-control border-input">
            </div>

            <div class="col-md-4" style="margin-top:10px;">
                Correo
                <input id="enterpriseEmail" type="text" placeholder="ejemplo@correo.cl" class="form-control border-input">
            </div>
            <div class="col-md-4" style="margin-top:10px;">
                RUT Representante Legal
                <input id="enterpriseRepresentRUT" type="text" class="form-control border-input">
            </div>
            <div class="col-md-4" style="margin-top:10px;">
                Nombre Representante
                <input id="enterpriseRepresentName" type="text" class="form-control border-input">
            </div>

            <div class="col-md-4" style="margin-top:10px;">
                Estado
                <select id="enterpriseStatus" class="form-control custom-select">
                    <option value="enabled">Habilitado</option>
                    <option value="disabled">Deshabilitado</option>
                </select>
            </div>


            <div class="col-md-12" id="enterpriseErrorMessage"></div>

        </div>
    `)

    $('#modal_footer').html(`
        <button style="border-radius: 5px;" class="btn btn-dark" data-dismiss="modal">
            <i style="color:#e74c3c;" class="fas fa-times"></i> CANCELAR
        </button>

        <button style="border-radius:5px;" class="btn btn-dark" id="saveEnterprise">
            <i style="color:#3498db;" class="fas fa-check"></i> GUARDAR
        </button>
    `)
}

async function validateEnterpriseData(enterpriseData) { // VERIFICACION

    console.log('enterpriseDate', enterpriseData)
    let errorMessage = ''

    if (enterpriseData.rut.length < 6) { // 1
        errorMessage += `<br>* Debe ingresar un <b>rut válido`
        $('#enterpriseRUT').css('border', '1px solid #e74c3c')
    }

    if (enterpriseData.name.length < 1) { // 2
        errorMessage += `<br>* Debe ingresar un <b>nombre de usuario</b></b>`
        $('#enterpriseName').css('border', '1px solid #e74c3c')
    }

    if (enterpriseData.fantasyName.length < 1) { // 3
        errorMessage += `<br>* Debe ingresar un <b>apellido de usuario</b>`
        $('#enterpriseFantasyName').css('border', '1px solid #e74c3c')
    }

    if (!isEmail(enterpriseData.email)) { // 4
        errorMessage += `<br>* Debe ingresar un <b>Email válido</b>`
        $('#enterpriseEmail').css('border', '1px solid #e74c3c')
    }

    if (errorMessage == '') {
        $('#enterpriseErrorMessage').empty()
        return { ok: enterpriseData }
    } else {
        $('#enterpriseErrorMessage').html(`
            <div class="alert alert-dismissible alert-warning">
                <button type="button" class="close" data-dismiss="alert">&times;</button>
                <h4 class="alert-heading">Debe solucionar los siguientes errores</h4>
                <p class="mb-0">${errorMessage}</p>
            </div>
            `)
        return { err: enterpriseData }
    }
}