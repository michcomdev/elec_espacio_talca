let internals = {
    members: {
        table: {},
        data: []
    },
    dataRowSelected: {}
}

let sectors, villages, towns

$(document).ready(async function () {
    getParameters()
    chargeMembersTable()
})

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
            language: {
                url: spanishDataTableLang
            },
            responsive: false,
            order: [[ 0, 'desc' ]],
            ordering: true,
            rowCallback: function( row, data ) {
          },
          columns: [
            { data: 'number' },
            { data: 'rut' },
            { data: 'type' },
            { data: 'name' },
            { data: 'address' },
            { data: 'dateStart' }
          ],
          initComplete: function (settings, json) {
            getMembersEnabled()
          }
        })

        $('#tableMembers tbody').off("click")

        $('#tableMembers tbody').on('click', 'tr', function () {
            if ($(this).hasClass('selected')) {
                $(this).removeClass('selected')
                $('#optionModMember').prop('disabled', true)
                $('#optionDeleteMember').prop('disabled', true)
            } else {
                internals.members.table.$('tr.selected').removeClass('selected');
                $(this).addClass('selected');
                $('#optionModMember').prop('disabled', false)
                $('#optionDeleteMember').prop('disabled', false)
                internals.members.data = internals.members.table.row($(this)).data()
                internals.dataRowSelected = internals.members.table.row($(this)).data()
            }
        })
      } catch (error) {
        console.log(error)
      }

}

// function cleanData(data) {
//     data.rut = ktoK(cleanRut(data.rut))

//     return data
// }

async function getParameters() {

    let sectorsData = await axios.get('api/sectors')
    sectors = sectorsData.data

    let villagesData = await axios.get('api/villages')
    villages = villagesData.data

    let townsData = await axios.get('api/towns')
    towns = townsData.data
}

async function getMembersEnabled() {
    let memberData = await axios.get('api/members')
    
    if (memberData.data.length > 0) {
        let formatData = memberData.data.map(el => {
            el.number = el.number
            el.rut = el.rut
            el.name = el.personal.name + ' ' + el.personal.lastname1 + ' ' + el.personal.lastname2
            el.type = el.type.toUpperCase()
            el.address = el.address.address
            el.dateStart = moment(el.dateStart).utc().format('DD/MM/YYYY')
            return el
        })

        internals.members.table.rows.add(formatData).draw()
        $('#loadingMembers').empty()
    } else {
        toastr.warning('No se han encontrado datos de socios')
        $('#loadingMembers').empty()
    }
}

$('#optionCreateMember').on('click', async function () { // CREAR SOCIO

    $('#modalMember').modal('show');
    $('#modalMember_title').html(`Nuevo Socio`)
    setModal()
    
    $('#modalMember_footer').html(`
        <button class="btn btn-dark" data-dismiss="modal">
            <i ="color:#e74c3c;" class="fas fa-times"></i> Cancelar
        </button>

        <button class="btn btn-primary" id="saveMember">
            <i ="color:#3498db;" class="fas fa-check"></i> Almacenar
        </button>
    `)

    let parametersData = await axios.get('api/parameters')
    parameters = parametersData.data

    console.log(parameters)

    $('#memberNumber').val(parameters.memberNumber)
    $('#memberRUT').on('keyup', function () {
        let rut = validateRut($(this).val())
        if(rut){
            $(this).val(rut)
        }
    })

    $('#memberType').change(function () {
        if($(this).val()=='personal'){
            $('#divPersonal').css('display','block')
            $('#divEnterprise').css('display','none')
        }else{
            $('#divPersonal').css('display','none')
            $('#divEnterprise').css('display','block')
        }
    })

    setTimeout(() => {
        $('#memberRUT').focus()
    }, 500)


    $('#saveMember').on('click', async function () {

        $("#memberRUT").val('17.172.852-5')
        $("#memberName").val('Enzo')
        $("#memberLastname1").val('Latorre')
        $("#memberLastname2").val('Barra')
        $("#memberAddress").val('Calle Uno 2301')
        $("#memberVillage").val('6263065165a0afa3096a6a6f')

        let waterMeters = []
        let subsidies = []

        let memberData = {
            number: $('#memberNumber').val(),
            rut: $('#memberRUT').val(),
            type: $('#memberType').val(),
            personal: {
                name: $('#memberName').val(),
                lastname1: $('#memberLastname1').val(),
                lastname2: $('#memberLastname2').val()
            },
            enterprise: {
                name: $('#memberEnterpriseName').val(),
                fullName: $('#memberEnterpriseNameFull').val(),
                category: $('#memberEnterpriseCategory').val(),
                address: $('#memberEnterpriseAddress').val()
            },
            address: {
                address: $('#memberAddress').val(),
                sector: $('#memberSector').val(),
                village: $('#memberVillage').val(),
                town: $('#memberTown').val()
            },
            waterMeters: waterMeters,
            subsidies: subsidies,
            email: $('#memberEmail').val(),
            phone: $('#memberPhone').val(),
            dateStart: $('#memberDateStart').val(),
            dateEnd: $('#memberDateEnd').val()
        }

        

        console.log(memberData)

        const res = validateMemberData(memberData)
        if (res.ok) {
            let saveMember = await axios.post('/api/memberSave', memberData)
            if(saveMember.data){
                if(saveMember.data._id){
                    $('#modalMember').modal('hide')

                    $('#modal_title').html(`Almacenado`)
                    $('#modal_body').html(`<h5 class="alert-heading">Socio almacenado correctamente</h5>`)
                    chargeMembersTable()
                
                }else if(saveMember.data=='created'){
                    $('#modal_title').html(`Error`)
                    $('#modal_body').html(`<h5 class="alert-heading">RUT ya registrado, favor corroborar</h5>`)
                
                }else{
                    $('#modal_title').html(`Error`)
                    $('#modal_body').html(`<h5 class="alert-heading">Error al almacenar, favor reintente</h5>`)
                }
            }else{
                $('#modal_title').html(`Error`)
                $('#modal_body').html(`<h5 class="alert-heading">Error al almacenar, favor reintente</h5>`)
            }
            $('#modal').modal('show');

        }else{

        }

    });

});

$('#optionModMember').on('click', async function () { // CREAR SOCIO

    let memberData = await axios.post('/api/memberSingle', {id: internals.dataRowSelected._id})
    let member = memberData.data
    $('#modalMember').modal('show');
    $('#modalMember_title').html(`Modifica Socio`)
    $('#modalMember_body').html(setModal())

    $('#modalMember_footer').html(`
        <button class="btn btn-dark" data-dismiss="modal">
            <i ="color:#e74c3c;" class="fas fa-times"></i> Cancelar
        </button>

        <button class="btn btn-primary" id="saveMember">
            <i ="color:#3498db;" class="fas fa-check"></i> Almacenar
        </button>
    `)

    $('#memberRUT').on('keyup', function () {
        let rut = validateRut($(this).val())
        if(rut){
            $(this).val(rut)
        }
    })

    $('#memberType').change(function () {
        if($(this).val()=='personal'){
            $('#divPersonal').css('display','block')
            $('#divEnterprise').css('display','none')
        }else{
            $('#divPersonal').css('display','none')
            $('#divEnterprise').css('display','block')
        }
    })

    $('#memberNumber').val(member.number)
    $('#memberRUT').val(member.rut)
    $('#memberType').val(member.type)
    $('#memberName').val(member.personal.name)
    $('#memberLastname1').val(member.personal.lastname1)
    $('#memberLastname2').val(member.personal.lastname2)
    $('#memberEnterpriseName').val(member.enterprise.name)
    $('#memberEnterpriseNameFull').val(member.enterprise.fullName)
    $('#memberEnterpriseCategory').val(member.enterprise.category)
    $('#memberEnterpriseAddress').val(member.enterprise.address)
    $('#memberAddress').val(member.address.address)
    if(member.address.sector) $('#memberSector').val(member.address.sector)
    if(member.address.village) $('#memberVillage').val(member.address.village)
    if(member.address.town) $('#memberTown').val(member.address.town)
    //waterMeters: waterMeters,
    //subsidies: subsidies,
    $('#memberEmail').val(member.email)
    $('#memberPhone').val(member.phone)
    $('#memberDateStart').val(moment(member.dateStart).utc().format('DD/MM/YYYY'))
    $('#memberDateEnd').val(moment(member.dateEnd).utc().format('DD/MM/YYYY'))

    $('.datepicker').daterangepicker({
        opens: 'left',
        locale: dateRangePickerDefaultLocale,
        singleDatePicker: true,
        autoApply: true
    }, function(start, end, label) {
    })


    setTimeout(() => {
        $('#memberRUT').focus()
    }, 500)

    $('#saveMember').on('click', async function () {
        let waterMeters = []
        let subsidies = []
        let memberData = {
            id: internals.dataRowSelected._id,
            rut: $('#memberRUT').val(),
            type: $('#memberType').val(),
            personal: {
                name: $('#memberName').val(),
                lastname1: $('#memberLastname1').val(),
                lastname2: $('#memberLastname2').val()
            },
            enterprise: {
                name: $('#memberEnterpriseName').val(),
                fullName: $('#memberEnterpriseNameFull').val(),
                category: $('#memberEnterpriseCategory').val(),
                address: $('#memberEnterpriseAddress').val()
            },
            address: {
                address: $('#memberAddress').val(),
                sector: $('#memberSector').val(),
                village: $('#memberVillage').val(),
                town: $('#memberTown').val()
            },
            waterMeters: waterMeters,
            subsidies: subsidies,
            email: $('#memberEmail').val(),
            phone: $('#memberPhone').val(),
            dateStart: $('#memberDateStart').data('daterangepicker').startDate.format('YYYY-MM-DD'),
            dateEnd: $('#memberDateEnd').data('daterangepicker').startDate.format('YYYY-MM-DD')
        }

        console.log(memberData)
        
        const res = validateMemberData(memberData)
        
        if (res.ok) {
            let saveMember = await axios.post('/api/memberUpdate', memberData)

            if(saveMember.data){
                if(saveMember.data._id){
                    $('#modalMember').modal('hide')

                    $('#modal_title').html(`Almacenado`)
                    $('#modal_body').html(`<h5 class="alert-heading">Socio almacenado correctamente</h5>`)
                    chargeMembersTable()

                }else if(saveMember.data=='created'){
                    $('#modal_title').html(`Error`)
                    $('#modal_body').html(`<h5 class="alert-heading">RUT ya registrado, favor corroborar</h5>`)
                
                }else{
                    $('#modal_title').html(`Error`)
                    $('#modal_body').html(`<h5 class="alert-heading">Error al almacenar, favor reintente</h5>`)
                }
            }else{
                $('#modal_title').html(`Error`)
                $('#modal_body').html(`<h5 class="alert-heading">Error al almacenar, favor reintente</h5>`)
            }
            $('#modal').modal('show');

        }else{

        }

    });

});

function validateMemberData(memberData) {
    let validationCounter = 0
    let errorMessage = ''


    if(validateRut(memberData.rut)){
        validationCounter++
        $('#memberRUT').css('border', '1px solid #E5E5E5')
    } else {
        errorMessage += `<br>RUT válido`
        $('#memberRUT').css('border', '1px solid #e74c3c')
    }

    if (memberData.personal.name.length > 1) {
        validationCounter++
        $('#memberName').css('border', '1px solid #E5E5E5')
    } else {
        errorMessage += `<br>Nombre</b>`
        $('#memberName').css('border', '1px solid #e74c3c')
    }

    if (memberData.personal.lastname1.length > 1) {
        validationCounter++
        $('#memberLastname1').css('border', '1px solid #E5E5E5')
    } else {
        errorMessage += `<br>Apellido Paterno</b>`
        $('#memberLastname1').css('border', '1px solid #e74c3c')
    }

    if (memberData.address.address != '' && (memberData.address.sector != 0 || memberData.address.village != 0 || memberData.address.town != 0)) {
        validationCounter++
        $('.address').css('border', '1px solid #E5E5E5')
    } else {
        errorMessage += `<br>Sector, Villa o Población</b>`
        $('.address').css('border', '1px solid #e74c3c')
    }
    

    if (isEmail(memberData.email) || memberData.email=='') {
        validationCounter++
        $('#memberEmail').css('border', '1px solid #E5E5E5')
    } else {
        errorMessage += `<br>E-Mail válido`
        $('#memberEmail').css('border', '1px solid #e74c3c')
    }

    if (validationCounter >= 5) {
        return { ok: memberData }
    } else {
        toastr.warning('Faltan datos:<br>'+errorMessage)
        return { err: memberData }
    }

}

function setModal(){

    $('#modalMember_body').html(`
            <div class="row">
                <div class="col-md-6">
                    <div class="card border-primary">
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-12">
                                    <h6>DATOS GENERALES</h6>
                                </div>
                                <div class="col-md-2">
                                    N°
                                    <input id="memberNumber" type="text" class="form-control form-control-sm border-input" disabled>
                                </div>
                                <div class="col-md-5">
                                    RUT
                                    <input id="memberRUT" type="text" class="form-control form-control-sm border-input">
                                </div>
                                <div class="col-md-3">
                                    Tipo
                                    <select id="memberType" class="form-select form-select-sm custom-select">
                                        <option value="personal">PERSONA</option>
                                        <option value="enterprise">EMPRESA</option>
                                    </select>
                                </div>
                                <div class="col-md-6">
                                    Fecha Ingreso
                                    <input id="memberDateStart" type="text" class="form-control form-control-sm border-input datepicker" value="${moment().utc().format('DD/MM/YYYY')}">
                                </div>
                                <div class="col-md-6">
                                    Fecha Baja
                                    <input id="memberDateEnd" type="text" class="form-control form-control-sm border-input datepicker" value="${moment().utc().format('DD/MM/YYYY')}">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="divPersonal" class="col-md-6">
                    <div class="card border-primary">
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-12">
                                    <h6>DATOS PERSONALES</h6>
                                </div>
                                <div class="col-md-4">
                                    Nombre
                                    <input id="memberName" type="text" class="form-control form-control-sm border-input">
                                </div>
                                <div class="col-md-4">
                                    Apellido Paterno
                                    <input id="memberLastname1" type="text" class="form-control form-control-sm border-input">
                                </div>
                                <div class="col-md-4">
                                    Apellido Materno
                                    <input id="memberLastname2" type="text" class="form-control form-control-sm border-input">
                                </div>
                                
                            </div>
                        </div>
                    </div>
                </div>
                        
                <div id="divEnterprise" class="col-md-8" style="display: none;">
                    <div class="card border-danger">
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-12">
                                    <h6>DATOS EMPRESA</h6>
                                </div>
                                <div class="col-md-4">
                                    Nombre (o nombre de fantasía SII)
                                    <input id="memberEnterpriseName" type="text" class="form-control form-control-sm border-input">
                                </div>
                                <div class="col-md-8">
                                    Nombre Facturación (nombre completo SII)
                                    <input id="memberEnterpriseNameFull" type="text" class="form-control form-control-sm border-input">
                                </div>
                                <div class="col-md-6">
                                    Giro
                                    <input id="memberEnterpriseCategory" type="text" class="form-control form-control-sm border-input">
                                </div>
                                <div class="col-md-6">
                                    Dirección Facturación
                                    <input id="memberEnterpriseAddress" type="text" class="form-control form-control-sm border-input">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-md-12">
                    <div class="card border-primary">
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-12">
                                    <h6>CONTACTO</h6>
                                </div>

                                <div class="col-md-3">
                                    Dirección
                                    <input id="memberAddress" type="text" class="form-control form-control-sm border-input address">
                                </div>
                                <div class="col-md-3">
                                    Sector
                                    <select id="memberSector" class="form-select form-select-sm custom-select address">
                                        <option value="0">-</option>
                                        ${                      
                                            sectors.reduce((acc,el)=>{
                                                acc += '<option value="'+el._id+'">'+el.name+'</option>'
                                                return acc
                                            },'')
                                        }
                                    </select>
                                </div>
                                <div class="col-md-3">
                                    Villa
                                    <select id="memberVillage" class="form-select form-select-sm custom-select address">
                                        <option value="0">-</option>
                                        ${                      
                                            villages.reduce((acc,el)=>{
                                                acc += '<option value="'+el._id+'">'+el.name+'</option>'
                                                return acc
                                            },'')
                                        }
                                    </select>
                                </div>
                                <div class="col-md-3">
                                    Población
                                    <select id="memberTown" class="form-select form-select-sm custom-select address">
                                        <option value="0">-</option>
                                        ${                      
                                            towns.reduce((acc,el)=>{
                                                acc += '<option value="'+el._id+'">'+el.name+'</option>'
                                                return acc
                                            },'')
                                        }
                                    </select>
                                </div>

                                <div class="col-md-4">
                                    Correo Electrónico
                                    <input id="memberEmail" type="text" class="form-control form-control-sm border-input">
                                </div>

                                <div class="col-md-4">
                                    Teléfono
                                    <input id="memberPhone" type="text" class="form-control form-control-sm border-input">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        `)

    $('.datepicker').daterangepicker({
        opens: 'left',
        locale: dateRangePickerDefaultLocale,
        singleDatePicker: true,
        autoApply: true
    }, function(start, end, label) {
    })
}