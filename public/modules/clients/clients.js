let internals = {
    clients: {
        table: {},
        data: []
    },
    rowSelected: {}
}

$(document).ready(async function () {
    chargeClientsTable()
    disAbleButt(true)
})

function chargeClientsTable() {
    try {
        internals.clients.table = $('#tableClients')
            .DataTable({
                dom: 'Bfrtip',
                buttons: [
                    'excel'
                ],
                iDisplayLength: 50,
                oLanguage: {
                    sSearch: 'buscar: '
                },
                responsive: false,
                order: [[0, 'desc']],
                ordering: true,
                rowCallback: function (row, data) {
                },
                columns: [
                    { data: 'rut' },
                    { data: 'name' },
                    { data: 'phone' },
                    { data: 'email' }
                ],
                initComplete: function (settings, json) {
                    getClientsEnabled()
                }
            })

        $('#tableClients tbody').on('click', 'tr', function () {
            if ($(this).hasClass('selected')) {
                $(this).removeClass('selected')
                disAbleButt(true)
            } else {
                internals.clients.table.$('tr.selected').removeClass('selected')
                $(this).addClass('selected')
                disAbleButt(false)
                internals.clients.data = internals.clients.table.row($(this)).data()
                internals.rowSelected = internals.clients.table.row($(this))
            }
        })
    } catch (error) {
        console.log(error)
    }
}

function disAbleButt (actionDis) {
    $('#updateClient').prop('disabled', actionDis)
    $('#deleteClient').prop('disabled', actionDis)
}

async function getClientsEnabled() {
    let clientData = await axios.get('api/clients')

    if (clientData.data.length > 0) {
        let formatData = clientData.data.map(el => {
            if (validateRut(el.rut)) {
                el.rut = `${validateRut(el.rut)}`
            } else {
                el.rut = el.rut
            }

            if (el.status == 'enabled') {
                el.status = 'Activo'
            } else {
                el.status = 'Desactivado'
            }

            return el
        })

        internals.clients.table.rows.add(formatData).draw()
        $('#loadingClients').empty()
    } else {
        toastr.warning('No se han encontrado datos de clientes')
        $('#loadingClients').empty()
    }
}

$('#createClient').on('click', async function () { // CREAR USUARIO
    handleModal()

    $('#clientRut').on('keyup', function () {
        let rut = $('#clientRut').val()
        if (validateRut(rut) && rut.length >= 6) {
            $('#clientRut').val(validateRut($('#clientRut').val()))
        }
    })

    setTimeout(() => {
        $('#clientRut').focus()
    }, 500)

    $('#saveClient').on('click', async function () {
        let clientData = {
            rut: removeSpecials($('#clientRut').val()),
            name: $('#clientName').val(),
            email: ($('#clientEmail').val()).trim(),
        }

        console.log('cliente data', clientData);

        let validate = await validateClientData(clientData)
        console.log("validate", validate);

        if (validate.ok) {
            console.log('wat');
            let newClientData = await axios.post('api/clients', clientData)
            console.log('waaaaat', newClientData);
            if (newClientData.data.error) {
                toastr.warning(newClientData.data.error)
            } else {
                toastr.success('Usuario creado correctamente')

                if (validateRut(newClientData.data.rut)) {
                    newClientData.data.rut = `${validateRut(newClientData.data.rut)}`
                } else {
                    newClientData.data.rut = newClientData.data.rut
                }

                if (newClientData.data.scope == 'client') {
                    newClientData.data.scope = 'Usuario'
                } else {
                    newClientData.data.scope = 'Administrador'
                }

                if (newClientData.data.status == 'enabled') {
                    newClientData.data.status = 'Activo'
                } else {
                    newClientData.data.status = 'Desactivado'
                }

                let clientAdded = internals.clients.table.row
                    .add(newClientData.data)
                    .draw()
                    .node()

                $(clientAdded).css('color', '#1abc9c')
                setTimeout(() => {
                    $(clientAdded).css('color', '#484848')
                }, 5000)

                $('#modal').modal('hide')
            }
        }
    })
})

$('#updateClient').on('click', function () { //MODIFICAR USUARIO
    handleModal(internals.clients.data)

    if (internals.clients.data.scope == 'Usuario') {
        internals.clients.data.scope = 'client'
    } else {
        internals.clients.data.scope = 'admin'
    }

    $('#clientRole').val(internals.clients.data.scope)

    $('#saveClient').on('click', async function () {

        internals.clients.data.rut = removeSpecials($('#clientRut').val())
        internals.clients.data.name = $('#clientName').val().trim()
        internals.clients.data.email = ($('#clientEmail').val()).trim()

        let validate = await validateClientData(internals.clients.data)

        if (validate.ok) {
            let newClientData = await axios.post('api/clients', clientData)
            if (newClientData.data.error) {
                toastr.warning(newClientData.data.error)
            } else {
                toastr.success('Usuario creado correctamente')

                if (validateRut(newClientData.data.rut)) {
                    newClientData.data.rut = `${validateRut(newClientData.data.rut)}`
                } else {
                    newClientData.data.rut = newClientData.data.rut
                }

                if (newClientData.data.status == 'enabled') {
                    newClientData.data.status = 'Activo'
                } else {
                    newClientData.data.status = 'Desactivado'
                }

                let clientAdded = internals.clients.table.row
                    .add(newClientData.data)
                    .draw()
                    .node()

                $(clientAdded).css('color', '#1abc9c')
                setTimeout(() => {
                    $(clientAdded).css('color', '#484848')
                }, 5000)

                $('#modal').modal('hide')
            }
        }
    })

    $('#saveClient').on('click', function () {
        let clientData = {
            rut: removeExtraSpaces($('#modClientRut').val()),
            name: $('#modClientName').val(),
            phone: $('#modClientPhone').val(),
            email: removeExtraSpaces($('#modClientEmail').val())
        }

        validateClientData(clientData).then(res => {
            if (res.ok) {

                ajax({
                    url: 'api/modClient',
                    type: 'POST',
                    data: {
                        rut: clientData.rut,
                        name: clientData.name,
                        phone: clientData.phone,
                        email: clientData.email
                    }
                }).then(res => {
                    if (res.err) {
                        toastr.warning(res.err)
                    } else if (res.ok) {
                        toastr.success('Se ha ingresado el cliente de forma exitosa')

                        if (isRut(res.ok._id)) {
                            res.ok.rut = `${rutFunc(res.ok._id)}`
                        } else {
                            res.ok.rut = res.ok._id
                        }

                        $('#updateClient').prop('disabled', true)
                        $('#deleteClient').prop('disabled', true)

                        datatableClients
                            .row(clientRowSelected)
                            .remove()
                            .draw()

                        let modClientAdded = datatableClients
                            .row.add(res.ok)
                            .draw()
                            .node()

                        //datatableClients.search('').draw()

                        $(modClientAdded).css('color', '#1abc9c')
                        setTimeout(() => {
                            $(modClientAdded).css('color', '#484848')
                        }, 5000)

                        $('#modal').modal('hide')
                    }
                })
            }
        })
    })
})

$('#deleteClient').on('click', function () { //ELIMINAR USUARIO
    swal.fire({
        title: '{{ lang.deleteClient.swalDeleteTitle }}',
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonClass: 'btn btn-primary',
        cancelButtonClass: 'btn btn-danger',
        buttonsStyling: false,
        confirmButtonText: '{{ lang.deleteClient.swalConfirmButtonText }}',
        cancelButtonText: '{{ lang.deleteClient.swalCancelButtonText }}',
    }).then((result) => {
        if (result.value) {
            ajax({
                url: 'api/client',
                type: 'DELETE',
                data: {
                    _id: internals.rowSelected._id
                }
            }).then(res => {
                if (res.err) {
                    toastr.warning(res.err)
                } else if (res.ok) {
                    $('#updateClient').prop('disabled', true)
                    $('#deleteClient').prop('disabled', true)

                    toastr.success('{{ lang.deleteClient.swalToastrOK }}')

                    datatableClients
                        .row(clientRowSelected)
                        .remove()
                        .draw()

                    // console.log(res.ok)
                }
            })
        }
    })
})

function handleModal(clientSelected) {
    $('#modal').modal('show');
    $('#modal_title').html(`${(clientSelected) ? 'Modificar cliente ' : 'Nuevo cliente'}`)
    $('#modal_body').html(`
        <div class="row">
            <div class="col-md-4" style="margin-top:10px;">
                Rut
                <input id="clientRut" type="text" placeholder="11.111.111-1" value="${(clientSelected) ? clientSelected.rut : ''}" class="form-control border-input">
            </div>

            <div class="col-md-4" style="margin-top:10px;">
                Nombre
                <input id="clientName" type="text" value="${(clientSelected) ? clientSelected.name : ''}" class="form-control border-input">
            </div>

            <div class="col-md-4" style="margin-top:10px;">
                Correo
                <input id="clientEmail" type="text" placeholder="ejemplo@correo.cl" value="${(clientSelected) ? clientSelected.email : ''}" class="form-control border-input">
            </div>

            <div class="col-md-12" id="clientErrorMessage"></div>

        </div>
    `)

    $('#modal_footer').html(`
        <button class="btn btn-dark" data-dismiss="modal">
            <i style="color:#e74c3c;" class="fas fa-times"></i> CANCELAR
        </button>

        <button class="btn btn-dark" id="saveClient">
            <i style="color:#3498db;" class="fas fa-check"></i> GUARDAR
        </button>
    `)
}

async function validateClientData(clientData) { // VERIFICACION
    let validationCounter = 0
    let errorMessage = ''

    // 5 puntos
    if (clientData.rut.length >= 6) { // 1
        validationCounter++
        $('#clientRut').css('border', '1px solid #3498db')
    } else {
        errorMessage += `<br>* Debe ingresar un <b>rut válido`
        $('#clientRut').css('border', '1px solid #e74c3c')
    }

    if (clientData.name.length > 1) { // 2
        validationCounter++
        $('#clientName').css('border', '1px solid #3498db')
    } else {
        errorMessage += `<br>* Debe ingresar un <b>nombre de cliente</b></b>`
        $('#clientName').css('border', '1px solid #e74c3c')
    }

    if (isEmail(clientData.email)) { // 3
        validationCounter++
        $('#clientEmail').css('border', '1px solid #3498db')
    } else {
        errorMessage += `<br>* Debe ingresar un <b>Email válido</b>`
        $('#clientEmail').css('border', '1px solid #e74c3c')
    }

    if (validationCounter == 3) {
        $('#clientErrorMessage').empty()
        return { ok: clientData }
    } else {
        $('#clientErrorMessage').html(`
            <div class="alert alert-dismissible alert-warning">
                <button type="button" class="close" data-dismiss="alert">&times;</button>
                <h4 class="alert-heading">Debe solucionar los siguientes errores</h4>
                <p class="mb-0">${errorMessage}</p>
            </div>
            `)
        return { err: clientData }
    }
}