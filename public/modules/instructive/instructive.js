let internals = {
    instructives: {
        table: {},
        data: []
    },
    rowSelected: {}
}

let enterprises

$(document).ready(async function () {
    loadEnterprises()
    loadInstructivesTable()
    disAbleButt(true)
    setTimeout(() => {
        handleModal()
        
    }, 500);
})

async function loadEnterprises() {
    let enterprisesData = await axios.get('api/enterprises')
    let enterprisesArray = enterprisesData.data
    enterprises = `<option value="0">Seleccione...</option>`
    for(let i=0; i<enterprisesArray.length; i++){
        enterprises += `<option 
                            value="${enterprisesArray[i]._id}" 
                            data-rut="${enterprisesArray[i].rut}"
                            data-address="${enterprisesArray[i].address}"
                            data-contact="${enterprisesArray[i].phone}"
                            data-representName="${enterprisesArray[i].representName}"
                            data-representRUT="${enterprisesArray[i].representRUT}"
                        >${enterprisesArray[i].name}</option>`
    }

}

function loadInstructivesTable() {
    try {
        if ($.fn.DataTable.isDataTable('#tableInstructives')) {
            internals.instructives.table.clear().destroy()
        }

        internals.instructives.table = $('#tableInstructives')
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
                    getInstructivesEnabled()
                }
            })

        $('#tableInstructives tbody').on('click', 'tr', function () {
            if ($(this).hasClass('selected')) {
                $(this).removeClass('selected')
                disAbleButt(true)
            } else {
                internals.instructives.table.$('tr.selected').removeClass('selected')
                $(this).addClass('selected')
                disAbleButt(false)
                internals.instructives.data = internals.instructives.table.row($(this)).data()
                internals.rowSelected = internals.instructives.table.row($(this))
            }
        })
    } catch (error) {
        console.log(error)
    }
}

function disAbleButt(actionDis) {
    $('#updateInstructive').prop('disabled', actionDis)
    $('#deleteInstructive').prop('disabled', actionDis)
}

async function getInstructivesEnabled() {
    let instructiveData = await axios.get('api/instructives')

    if (instructiveData.data.length > 0) {
        let formatData = instructiveData.data.map(el => {
            /*if (validateRut(el.rut)) {
                el.rut = `${validateRut(el.rut)}`
            } else {
                el.rut = el.rut
            }

            if (el.scope == 'instructive') {
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

        internals.instructives.table.rows.add(formatData).draw()
        $('#loadingInstructives').empty()
    } else {
        toastr.warning('No se han encontrado datos dentro del rango')
        $('#loadingInstructives').empty()
    }
}

$('#createInstructive').on('click', async function () { // CREAR USUARIO
    handleModal()

    $('#instructiveRUT').on('keyup', function () {
        let rut = $('#instructiveRUT').val()
        if (validateRut(rut) && rut.length >= 6) {
            $('#instructiveRUT').val(validateRut($('#instructiveRUT').val()))
        }
    })

    setTimeout(() => {
        $('#instructiveRUT').focus()
    }, 500)

    $('#saveInstructive').on('click', async function () {
        let instructiveData = {
            rut: removeSpecials($('#instructiveRUT').val()),
            name: $('#instructiveName').val(),
            fantasyName: $('#instructiveFantasyName').val(),
            address: $('#instructiveAddress').val(),
            types: $('#instructiveType').val(),
            phone: $('#instructivePhone').val(),
            email: $('#instructiveEmail').val(),
            status: $('#instructivestatus').val()
        }

        let validate = await validateInstructiveData(instructiveData)

        if (validate.ok) {
            let newInstructiveData = await axios.post('api/instructives', instructiveData)
            if (newInstructiveData.data.error) {
                toastr.warning(newInstructiveData.data.error)
            } else {
                toastr.success('Usuario creado correctamente')

                if (validateRut(newInstructiveData.data.rut)) {
                    newInstructiveData.data.rut = `${validateRut(newInstructiveData.data.rut)}`
                } else {
                    newInstructiveData.data.rut = newInstructiveData.data.rut
                }

                if (newInstructiveData.data.scope == 'instructive') {
                    newInstructiveData.data.scope = 'Usuario'
                } else {
                    newInstructiveData.data.scope = 'Administrador'
                }

                if (newInstructiveData.data.status == 'enabled') {
                    newInstructiveData.data.status = 'Activo'
                } else {
                    newInstructiveData.data.status = 'Desactivado'
                }

                let instructiveAdded = internals.instructives.table.row
                    .add(newInstructiveData.data)
                    .draw()
                    .node()

                $(instructiveAdded).css('color', '#1abc9c')
                setTimeout(() => {
                    $(instructiveAdded).css('color', '#484848')
                }, 5000)

                $('#modal').modal('hide')
            }
        }
    })
})

$('#updateInstructive').on('click', function () { //MODIFICAR USUARIO
    handleModal()
    console.log(internals.instructives.data)
    $('#instructiveRUT').val(internals.instructives.data.rut)
    $('#instructiveName').val(internals.instructives.data.name)
    $('#instructiveFantasyName').val(internals.instructives.data.fantasyName)
    $('#instructiveAddress').val(internals.instructives.data.address)
    $('#instructiveType').val(internals.instructives.data.types._id)
    $('#instructivePhone').val(internals.instructives.data.phone)
    $('#instructiveEmail').val(internals.instructives.data.email)
    $('#instructivestatus').val(internals.instructives.data.status)
   
    $('#saveInstructive').on('click', async function () {

        internals.instructives.data.rut = $('#instructiveRUT').val()
        internals.instructives.data.name = $('#instructiveName').val()
        internals.instructives.data.fantasyName = $('#instructiveFantasyName').val()
        internals.instructives.data.address = $('#instructiveAddress').val()
        internals.instructives.data.types = $('#instructiveType').val()
        internals.instructives.data.phone = $('#instructivePhone').val()
        internals.instructives.data.email = $('#instructiveEmail').val()
        internals.instructives.data.status = $('#instructivestatus').val()

        let instructiveData = {
            _id: internals.instructives.data._id,
            rut: removeSpecials($('#instructiveRUT').val()),
            name: $('#instructiveName').val(),
            fantasyName: $('#instructiveFantasyName').val(),
            address: $('#instructiveAddress').val(),
            types: $('#instructiveType').val(),
            phone: $('#instructivePhone').val(),
            email: $('#instructiveEmail').val(),
            status: $('#instructivestatus').val()
        }

        let validate = await validateInstructiveData(instructiveData)

        console.log(validate)

        if (validate.ok) {
            let newInstructiveData = await axios.post('api/instructives', validate.ok)
            if (newInstructiveData.data.error) {
                toastr.warning(newInstructiveData.data.error)
            } else {
                toastr.success('Usuario creado correctamente')

                if (validateRut(newInstructiveData.data.rut)) {
                    newInstructiveData.data.rut = `${validateRut(newInstructiveData.data.rut)}`
                } else {
                    newInstructiveData.data.rut = newInstructiveData.data.rut
                }

                if (newInstructiveData.data.scope == 'instructive') {
                    newInstructiveData.data.scope = 'Usuario'
                } else {
                    newInstructiveData.data.scope = 'Administrador'
                }

                if (newInstructiveData.data.status == 'enabled') {
                    newInstructiveData.data.status = 'Activo'
                } else {
                    newInstructiveData.data.status = 'Desactivado'
                }

                loadInstructivesTable()

                $('#modal').modal('hide')
            }
        }
    })
})

function handleModal() {
    $('#modal').modal('show');
    $('#modal_title').html(`Confirmación de Carga`)
    console.log(enterprises)
    $('#modal_body').html(`
        <div class="row">
            <div class="col-md-4">
                <div class="card border-primary">
                    <div class="card-body">
                        <table style="width: 100%">
                            <tr>
                                <td>FECHA</td>
                                <td><input id="instructiveDate" class="form-control form-control-sm" /></td>
                            </tr>
                            <tr>
                                <td>INSTRUCTIVO</td>
                                <td><input id="instructiveCode" class="form-control form-control-sm" /></td>
                            </tr>
                            <tr>
                                <td>CORRELATIVO PPS</td>
                                <td><input id="instructiveCorrelative" class="form-control form-control-sm" /></td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card border-primary">
                    <div class="card-body">
                        <h5 class="card-title">Exportador</h5>
                        <table style="width: 100%">
                            <tr>
                                <td>EXPORTADOR</td>
                                <td><select id="exporterList" class="form-control form-control-sm" onchange="loadExporter(this)">${enterprises}</select></td>
                            </tr>
                            <tr>
                                <td>RUT</td>
                                <td><label id="exporterRUT"></label></td>
                            </tr>
                            <tr>
                                <td>DIRECCIÓN</td>
                                <td><label id="exporterAddress"></label></td>
                            </tr>
                            <tr>
                                <td>CONTACTO</td>
                                <td><label id="exporterContact"></label></td>
                            </tr>
                            <tr>
                                <td>REP. LEGAL</td>
                                <td><label id="exporterRepresent"></label></td>
                            </tr>
                            <tr>
                                <td>RUT REP.</td>
                                <td><label id="exporterRepresentRUT"></label></td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card border-primary">
                    <div class="card-body">
                        <h5 class="card-title">Agente de Aduanas</h5>
                            <table style="width: 100%">
                                <tr>
                                    <td>AGENTE</td>
                                    <td><select id="agentList" class="form-control form-control-sm" onchange="loadAgent(this)">${enterprises}</select></td>
                                </tr>
                                <tr>
                                    <td>RUT</td>
                                    <td><label id="agentRUT"></label></td>
                                </tr>
                                <tr>
                                    <td>DIRECCIÓN</td>
                                    <td><label id="agentAddress"></label></td>
                                </tr>
                                <tr>
                                    <td>CONTACTO</td>
                                    <td><label id="agentContact"></label></td>
                                </tr>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `)

    $('#instructiveDate').daterangepicker({
        opens: 'right',
        locale: dateRangePickerDefaultLocale,
        singleDatePicker: true,
        autoApply: true
    })

    $('#modal_footer').html(`
        <button style="border-radius: 5px;" class="btn btn-dark" data-dismiss="modal">
            <i style="color:#e74c3c;" class="fas fa-times"></i> CANCELAR
        </button>

        <button style="border-radius:5px;" class="btn btn-dark" id="saveInstructive">
            <i style="color:#3498db;" class="fas fa-check"></i> GUARDAR
        </button>
    `)
}

async function loadExporter(select) {
    if($(select).val()!=0){
        $("#exporterRUT").text($('option:selected', select).attr('data-rut'))
        $("#exporterAddress").text($('option:selected', select).attr('data-address'))
        $("#exporterContact").text($('option:selected', select).attr('data-contact'))
        $("#exporterRepresent").text($('option:selected', select).attr('data-representName'))
        $("#exporterRepresentRUT").text($('option:selected', select).attr('data-representRUT'))
    }else{
        $("#exporterRUT").text('')
        $("#exporterAddress").text('')
        $("#exporterContact").text('')
        $("#exporterRepresent").text('')
        $("#exporterRepresentRUT").text('')
    }
}

async function loadAgent(select) {
    if($(select).val()!=0){
        $("#agentRUT").text($('option:selected', select).attr('data-rut'))
        $("#agentAddress").text($('option:selected', select).attr('data-address'))
        $("#agentContact").text($('option:selected', select).attr('data-contact'))
    }else{
        $("#agentRUT").text('')
        $("#agentAddress").text('')
        $("#agentContact").text('')
    }
}

async function validateInstructiveData(instructiveData) { // VERIFICACION

    console.log('instructiveDate', instructiveData)
    let errorMessage = ''

    if (instructiveData.rut.length < 6) { // 1
        errorMessage += `<br>* Debe ingresar un <b>rut válido`
        $('#instructiveRUT').css('border', '1px solid #e74c3c')
    }

    if (instructiveData.name.length < 1) { // 2
        errorMessage += `<br>* Debe ingresar un <b>nombre de usuario</b></b>`
        $('#instructiveName').css('border', '1px solid #e74c3c')
    }

    if (instructiveData.fantasyName.length < 1) { // 3
        errorMessage += `<br>* Debe ingresar un <b>apellido de usuario</b>`
        $('#instructiveFantasyName').css('border', '1px solid #e74c3c')
    }

    if (!isEmail(instructiveData.email)) { // 4
        errorMessage += `<br>* Debe ingresar un <b>Email válido</b>`
        $('#instructiveEmail').css('border', '1px solid #e74c3c')
    }

    if (errorMessage == '') {
        $('#instructiveErrorMessage').empty()
        return { ok: instructiveData }
    } else {
        $('#instructiveErrorMessage').html(`
            <div class="alert alert-dismissible alert-warning">
                <button type="button" class="close" data-dismiss="alert">&times;</button>
                <h4 class="alert-heading">Debe solucionar los siguientes errores</h4>
                <p class="mb-0">${errorMessage}</p>
            </div>
            `)
        return { err: instructiveData }
    }
}