let internals = {
    users: {
        table: {},
        data: []
    },
    rowSelected: {}
}

$(document).ready(async function () {
    chargeUsersTable()
    disAbleButt(true)
})

function chargeUsersTable() {
    try {
        if ($.fn.DataTable.isDataTable('#tableUsers')) {
            internals.users.table.clear().destroy()
        }


        internals.users.table = $('#tableUsers')
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
                    { data: 'lastname' },
                    { data: 'email' },
                    { data: 'scope' },
                    { data: 'status' }
                ],
                initComplete: function (settings, json) {
                    getUsersEnabled()
                }
            })

        $('#tableUsers tbody').on('click', 'tr', function () {
            if ($(this).hasClass('selected')) {
                $(this).removeClass('selected')
                disAbleButt(true)
            } else {
                internals.users.table.$('tr.selected').removeClass('selected')
                $(this).addClass('selected')
                disAbleButt(false)
                internals.users.data = internals.users.table.row($(this)).data()
                internals.rowSelected = internals.users.table.row($(this))
                
            }
        })
    } catch (error) {
        console.log(error)
    }
}

function disAbleButt(actionDis) {
    $('#updateUser').prop('disabled', actionDis)
    $('#deleteUser').prop('disabled', actionDis)
}

async function getUsersEnabled() {
    let userData = await axios.get('api/users')

    if (userData.data.length > 0) {
        let formatData = userData.data.map(el => {
            if (validateRut(el.rut)) {
                el.rut = `${validateRut(el.rut)}`
            } else {
                el.rut = el.rut
            }

            if (el.scope == 'user') {
                el.scope = 'Usuario'
            } else {
                el.scope = 'Administrador'
            }

            if (el.status == 'enabled') {
                el.status = 'Activo'
            } else {
                el.status = 'Desactivado'
            }

            return el
        })

        internals.users.table.rows.add(formatData).draw()
        $('#loadingUsers').empty()
    } else {
        toastr.warning('No se han encontrado datos de usuarios')
        $('#loadingUsers').empty()
    }
}

$('#createUser').on('click', async function () { // CREAR USUARIO
    handleModal()

    $('#userRUT').on('keyup', function () {
        let rut = $('#userRUT').val()
        if (validateRut(rut) && rut.length >= 6) {
            $('#userRUT').val(validateRut($('#userRUT').val()))
        }
    })

    setTimeout(() => {
        $('#userRUT').focus()
    }, 500)

    $('#saveUser').on('click', async function () {
        let userData = {
            rut: removeSpecials($('#userRUT').val()),
            name: $('#userName').val(),
            lastname: $('#userLastname').val(),
            password: $('#userPassword').val(),
            scope: $('#userRole').val(),
            email: ($('#userEmail').val()).trim(),
        }

        let validate = await validateUserData(userData)

        if (validate.ok) {
            let newUserData = await axios.post('api/users', userData)
            if (newUserData.data.error) {
                toastr.warning(newUserData.data.error)
            } else {
                toastr.success('Usuario creado correctamente')

                if (validateRut(newUserData.data.rut)) {
                    newUserData.data.rut = `${validateRut(newUserData.data.rut)}`
                } else {
                    newUserData.data.rut = newUserData.data.rut
                }

                if (newUserData.data.scope == 'user') {
                    newUserData.data.scope = 'Usuario'
                } else {
                    newUserData.data.scope = 'Administrador'
                }

                if (newUserData.data.status == 'enabled') {
                    newUserData.data.status = 'Activo'
                } else {
                    newUserData.data.status = 'Desactivado'
                }

                let userAdded = internals.users.table.row
                    .add(newUserData.data)
                    .draw()
                    .node()

                $(userAdded).css('color', '#1abc9c')
                setTimeout(() => {
                    $(userAdded).css('color', '#484848')
                }, 5000)

                $('#modal').modal('hide')
            }
        }
    })
})

$('#updateUser').on('click', function () { //MODIFICAR USUARIO
    handleModal(internals.users.data)
    console.log('adas', internals);

    if (internals.users.data.scope == 'Usuario') {
        internals.users.data.scope = 'user'
    } else {
        internals.users.data.scope = 'admin'
    }

    $('#userRole').val(internals.users.data.scope)

    $('#saveUser').on('click', async function () {

        internals.users.data.rut = $('#userRUT').val()
        internals.users.data.name = $('#userName').val().trim()
        internals.users.data.lastname = $('#userLastname').val().trim()
        internals.users.data.password = $('#userPassword').val().trim()
        internals.users.data.scope = $('#userRole').val()
        internals.users.data.email = ($('#userEmail').val()).trim()
        internals.users.data.status = 'enabled'


        let validate = await validateUserData(internals.users.data)

        console.log(validate)

        if (validate.ok) {
            let newUserData = await axios.post('api/users', validate.ok)
            if (newUserData.data.error) {
                toastr.warning(newUserData.data.error)
            } else {
                toastr.success('Usuario creado correctamente')

                if (validateRut(newUserData.data.rut)) {
                    newUserData.data.rut = `${validateRut(newUserData.data.rut)}`
                } else {
                    newUserData.data.rut = newUserData.data.rut
                }

                if (newUserData.data.scope == 'user') {
                    newUserData.data.scope = 'Usuario'
                } else {
                    newUserData.data.scope = 'Administrador'
                }

                if (newUserData.data.status == 'enabled') {
                    newUserData.data.status = 'Activo'
                } else {
                    newUserData.data.status = 'Desactivado'
                }

                /*let userAdded = internals.users.table.row
                    .add(newUserData.data)
                    .draw()
                    .node()

                $(userAdded).css('color', '#1abc9c')
                setTimeout(() => {
                    $(userAdded).css('color', '#484848')
                }, 5000)*/
                chargeUsersTable()

                $('#modal').modal('hide')
            }
        }
    })
})

function handleModal(userSelected) {
    $('#modal').modal('show');
    $('#modal_title').html(`${(userSelected) ? 'Modificar usuario ' : 'Nuevo Usuario'}`)
    $('#modal_body').html( /*html*/`
        <div class="row">
            <div class="col-md-4" style="margin-top:10px;">
                RUT
                <input id="userRUT" type="text" placeholder="11.111.111-1" value="${(userSelected) ? userSelected.rut : ''}" class="form-control border-input">
            </div>

            <div class="col-md-4" style="margin-top:10px;">
                Nombre
                <input id="userName" type="text" value="${(userSelected) ? userSelected.name : ''}" class="form-control border-input">
            </div>

            <div class="col-md-4" style="margin-top:10px;">
                Apellido
                <input id="userLastname" type="text" value="${(userSelected) ? userSelected.lastname : ''}" class="form-control border-input">
            </div>

            <div class="col-md-4" style="margin-top:10px;">
                Contraseña
                <input id="userPassword" type="password" placeholder="******" class="form-control border-input">
            </div>

            <div class="col-md-4" style="margin-top:10px;">
                Rol
                <select id="userRole" class="form-control custom-select">
                    <option value="user">Usuario</option>
                    <option value="admin">Administrador</option>
                </select>
            </div>

            <div class="col-md-4" style="margin-top:10px;">
                Correo
                <input id="userEmail" type="text" placeholder="ejemplo@correo.cl" value="${(userSelected) ? userSelected.email : ''}" class="form-control border-input">
            </div>

            <!-- <div class="col-md-12 form-group">
                <fieldset class="form-group">
                    <legend class="mt-4">Permisos</legend>

                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="check1">
                            Permiso 1
                        </label>
                    </div>

                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="check2">
                            Permiso 2
                        </label>
                    </div>

                </fieldset>
            </div> -->

            <div class="col-md-12" id="userErrorMessage"></div>

        </div>
    `)

    $('#modal_footer').html(`
        <button style="border-radius: 5px;" class="btn btn-dark" data-dismiss="modal">
            <i style="color:#e74c3c;" class="fas fa-times"></i> CANCELAR
        </button>

        <button style="border-radius:5px;" class="btn btn-dark" id="saveUser">
            <i style="color:#3498db;" class="fas fa-check"></i> GUARDAR
        </button>
    `)
}

async function validateUserData(userData) { // VERIFICACION
    let validationCounter = 0
    let errorMessage = ''

    // 5 puntos
    if (userData.rut.length >= 6) { // 1
        validationCounter++
        $('#userRUT').css('border', '1px solid #3498db')
    } else {
        errorMessage += `<br>* Debe ingresar un <b>rut válido`
        $('#userRUT').css('border', '1px solid #e74c3c')
    }

    if (userData.name.length > 1) { // 2
        validationCounter++
        $('#userName').css('border', '1px solid #3498db')
    } else {
        errorMessage += `<br>* Debe ingresar un <b>nombre de usuario</b></b>`
        $('#userName').css('border', '1px solid #e74c3c')
    }

    if (userData.lastname.length > 1) { // 3
        validationCounter++
        $('#userLastname').css('border', '1px solid #3498db')
    } else {
        errorMessage += `<br>* Debe ingresar un <b>apellido de usuario</b>`
        $('#userLastname').css('border', '1px solid #e74c3c')
    }

    if (isEmail(userData.email)) { // 4
        validationCounter++
        $('#userEmail').css('border', '1px solid #3498db')
    } else {
        errorMessage += `<br>* Debe ingresar un <b>Email válido</b>`
        $('#userEmail').css('border', '1px solid #e74c3c')
    }

    if (userData.password !== '') {
        if (userData.password.length >= 6) { // 5
            validationCounter++
            $('userPassword').css('border', '1px solid #3498db')
        } else {
            errorMessage += `<br>* Debe ingresar una <b>contraseña de usuario válida</b>`
            $('#userPassword').css('border', '1px solid #e74c3c')
        }
    } else {
        validationCounter++
    }

    if (validationCounter == 5) {
        $('#userErrorMessage').empty()
        return { ok: userData }
    } else {
        $('#userErrorMessage').html(`
            <div class="alert alert-dismissible alert-warning">
                <button type="button" class="close" data-dismiss="alert">&times;</button>
                <h4 class="alert-heading">Debe solucionar los siguientes errores</h4>
                <p class="mb-0">${errorMessage}</p>
            </div>
            `)
        return { err: userData }
    }
}