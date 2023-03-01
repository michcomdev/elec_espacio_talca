let internals = {
    members: {
        table: {},
        data: []
    },
    dataRowSelected: {}
}

let sectors, services
let parametersGeneral

$(document).ready(async function () {
    getParameters()
    chargeMembersTable()
    

    $('#searchMembers').on('click', async function () {
        chargeMembersTable()
    })
    
})

function chargeMembersTable() {
    try {

        if ($.fn.DataTable.isDataTable('#tableMembers')) {
            internals.members.table.clear().destroy()
        }

        internals.members.table = $('#tableMembers')
        .DataTable( {
            dom: 'Blfrtip',
            buttons: [
                {
                    extend: 'excel',
                    className: 'btn-excel'
                },
                {
                    extend: 'pdf',
                    className: 'btn-pdf'
                },
            ],
            lengthMenu: [ [10, 25, 50, -1], [10, 25, 50, "Todo"] ],
            iDisplayLength: 10,
            language: {
                url: spanishDataTableLang
            },
            responsive: false,
            columnDefs: [
                { targets: [10], className: 'dt-center' },
            ],
            order: [[ 0, 'asc' ]],
            ordering: true,
            rowCallback: function( row, data ) {
            },
            columns: [
                { data: 'number' },
                { data: 'rut' },
                { data: 'type' },
                { data: 'name' },
                { data: 'sector' },
                { data: 'address' },
                //{ data: 'dateStart' },
                { data: 'status' },
                { data: 'subsidyNumber' },
                { data: 'subsidyActive' },
                { data: 'fine20' },
                { data: 'send' }            ],
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
                internals.members.table.$('tr.selected').removeClass('selected')
                $(this).addClass('selected')
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

    $("#searchSector").append(
        sectors.reduce((acc,el)=>{
            acc += '<option value="'+el._id+'">'+el.name+'</option>'
            return acc
        },'')
    )

    let servicesData = await axios.post('api/servicesByFilter', {invoice: "MENSUAL"})
    services = servicesData.data

    let parametersData = await axios.get('api/parameters')
    parametersGeneral = parametersData.data
}

async function getMembersEnabled() {
    let memberData = await axios.post('api/members', {sector: $("#searchSector").val()})
    
    if (memberData.data.length > 0) {
        let formatData = memberData.data.map(el => {
            el.number = el.number
            el.rut = el.rut
            el.name = el.personal.name + ' ' + el.personal.lastname1 + ' ' + el.personal.lastname2
            if(el.type=='personal'){
                el.type = 'PERSONA'
                el.name = el.personal.name + ' ' + el.personal.lastname1 + ' ' + el.personal.lastname2
            }else{
                el.type = 'EMPRESA'
                el.name = el.enterprise.name
            }
            //el.type = el.type.toUpperCase()

            el.sector = el.address.sector.name
            el.address = el.address.address
            el.dateStart = moment(el.dateStart).utc().format('DD/MM/YYYY')

            if(el.status=='active'){
                el.status = 'ACTIVO'
            }else if(el.status=='inactive'){
                el.status = 'INACTIVO'
            }

            el.subsidyActive = 'NO'
            if(el.subsidies.length>0){
                if(el.subsidies.find(x => x.status=='active')){
                    el.subsidyActive = 'SI'
                }
            }


            el.fine20 = 'NO'
            if(el.fine){
                el.fine20 = 'SI'
            }
            el.send = ''
            if(el.sendEmail){
                el.send = '<i class="fas fa-envelope" title="E-mail"></i>'
            }
            if(el.sendWhatsapp){
                el.send += '<i class="fab fa-whatsapp" title="Whatsapp"></i>'
            }

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

    $('#modalMember').modal('show')
    $('#modalMember_title').html(`Nuevo Socio`)
    setModal('create')
    
    $('#modalMember_footer').html(`
        <button style="border-radius:5px;" class="btn btn-dark" data-dismiss="modal">
            <i ="color:#e74c3c;" class="fas fa-times"></i> Cerrar
        </button>

        <button style="border-radius:5px;" class="btn btn-primary" id="saveMember">
            <i ="color:#3498db;" class="fas fa-check"></i> Guardar
        </button>
    `)

    let parametersData = await axios.get('api/parameters')
    parameters = parametersData.data
    
    $('#memberNumber').val(parameters.memberNumber)
    $('#memberRUT').on('keyup', function () {
        let rut = validateRut($(this).val())
        if (rut) {
            $(this).val(rut)
        }
    })

    $('#memberWaterNumber').val('S/N') //quitar

    $('#memberType').change(function () {
        if ($(this).val() == 'personal') {
            $('#divPersonal').css('display', 'block')
            $('#divEnterprise').css('display', 'none')
        } else {
            $('#divPersonal').css('display', 'none')
            $('#divEnterprise').css('display', 'block')
        }
    })

    $('#memberSector').change(function () {
        $("#memberAddress").val($("#memberSector option:selected").text())
    })

    $("#memberStatus").attr('disabled','disabled')
    $(".divDateEnd").css('visibility','hidden')

    $("#memberSubsidyNumber").val(parametersGeneral.municipality.subsidyCode)

    setTimeout(() => {
        $('#memberRUT').focus()
    }, 500)


    $('#saveMember').on('click', async function () {

        let waterMeters = [{
            number: $('#memberWaterNumber').val(),
            diameter: $('#memberWaterDiameter').val(),
            state: $('#memberWaterState').val(),
            //dateStart: $('#memberWaterDate').data('daterangepicker').startDate.format('YYYY-MM-DD') Devolver a esta línea
            dateStart: $('#memberDateStart').data('daterangepicker').startDate.format('YYYY-MM-DD')
        }]

        let services = []
        let serviceError = false
        if($("#tableBodyServices > tr").length>0){
            $("#tableBodyServices > tr").each(function() {

                if(!$.isNumeric($($($(this).children()[1]).children()[0]).val())){
                    value = 0
                    serviceError = true
                }else{
                    value = $($($(this).children()[1]).children()[0]).val()
                }

                services.push({
                    services: $($($(this).children()[0]).children()[0]).val(),
                    value: value
                })
            })    
        }
        
        if(serviceError){
            toastr.warning('1 o más servicios tienen valores erróneos')
            return
        }
        

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
                sector: $('#memberSector').val()
            },
            waterMeters: waterMeters,
            email: $('#memberEmail').val(),
            phone: $('#memberPhone').val(),
            dateStart: $('#memberDateStart').data('daterangepicker').startDate.format('YYYY-MM-DD'),
            dateEnd: $('#memberDateEnd').data('daterangepicker').startDate.format('YYYY-MM-DD'),
            subsidyNumber: $('#memberSubsidyNumber').val(),
            fine: $('#memberFine').prop('checked'),
            dte: $('#memberDTE').val(),
            sendEmail: $('#memberSendEmail').prop('checked'),
            sendWhatsapp: $('#memberSendWhatsapp').prop('checked')
        }

        const res = validateMemberData(memberData)
        if (res.ok) {
            loadingHandler('start')
            console.log(memberData)
            let saveMember = await axios.post('/api/memberSave', memberData)
            loadingHandler('stop')
            if (saveMember.data) {
                if (saveMember.data._id) {
                    $('#modalMember').modal('hide')
                    toastr.success('Socio almacenado correctamente')

                    chargeMembersTable()

                /*} else if (saveMember.data == 'created') {
                    $('#modal_title').html(`Error`)
                    $('#modal_body').html(`<h7 class="alert-heading">RUT ya registrado, favor corroborar</h7>`)
                */
                }else{
                    $('#modal_title').html(`Error`)
                    $('#modal_body').html(`<h7 class="alert-heading">Error al almacenar, favor reintente</h7>`)
                    toastr.error('Error al almacenar, favor reintente')
                }
            } else {
                toastr.error('Error al almacenar, favor reintente')
            }
            

        } else {

        }

    })

})

$('#optionModMember').on('click', async function () { // CREAR SOCIO

    let memberData = await axios.post('/api/memberSingle', { id: internals.dataRowSelected._id })
    let member = memberData.data
    $('#modalMember').modal('show')
    $('#modalMember_title').html(`Modifica Socio`)
    setModal('update')

    $('#modalMember_footer').html(`
        <button style="border-radius:5px;" class="btn btn-dark" data-dismiss="modal">
            <i ="color:#e74c3c;" class="fas fa-times"></i> Cerrar
        </button>

        <button style="border-radius:5px;" class="btn btn-primary" id="saveMember">
            <i ="color:#3498db;" class="fas fa-check"></i> Guardar
        </button>
    `)

    $('#memberRUT').on('keyup', function () {
        let rut = validateRut($(this).val())
        if (rut) {
            $(this).val(rut)
        }
    })

    $('#memberType').change(function () {
        if ($(this).val() == 'personal') {
            $('#divPersonal').css('display', 'block')
            $('#divEnterprise').css('display', 'none')
        } else {
            $('#divPersonal').css('display', 'none')
            $('#divEnterprise').css('display', 'block')
        }
    })

    $('#memberNumber').val(member.number)
    $('#memberRUT').val(member.rut)
    $('#memberType').val(member.type)
    if(member.type=='enterprise'){
        $('#divPersonal').css('display','none')
        $('#divEnterprise').css('display','block')
    }
    $('#memberName').val(member.personal.name)
    $('#memberLastname1').val(member.personal.lastname1)
    $('#memberLastname2').val(member.personal.lastname2)
    $('#memberEnterpriseName').val(member.enterprise.name)
    $('#memberEnterpriseNameFull').val(member.enterprise.fullName)
    $('#memberEnterpriseCategory').val(member.enterprise.category)
    $('#memberEnterpriseAddress').val(member.enterprise.address)
    $('#memberAddress').val(member.address.address)
    if (member.address.sector) $('#memberSector').val(member.address.sector._id)
    //waterMeters: waterMeters,
    //subsidies: subsidies,
    $('#memberEmail').val(member.email)
    $('#memberPhone').val(member.phone)
    $('#memberDateStart').val(moment(member.dateStart).utc().format('DD/MM/YYYY'))
    if(member.status=='active'){
        $("#spanStatus").text('Activo')
        $("#spanStatus").addClass('bg-primary')
        $(".divDateEnd").css('visibility','hidden')
    }else{
        $("#spanStatus").text('Inactivo')
        $("#spanStatus").addClass('bg-danger')
        $(".divDateEnd").css('visibility','visible')
    }

    $("#memberStatus").val(member.status)
    $("#memberStatusObservation").val(member.inactiveObservation)
    $('#memberDateEnd').val(moment(member.dateEnd).utc().format('DD/MM/YYYY'))

    if (member.fine) $('#memberFine').prop('checked',true)
    if (member.dte) $('#memberDTE').val(member.dte)
    if (member.sendEmail) $('#memberSendEmail').prop('checked',true)
    if (member.sendWhatsapp) $('#memberSendWhatsapp').prop('checked',true)
    

    $('#memberStatus').change(function () {
        if ($(this).val() == 'inactive') {
            $(".divDateEnd").css('visibility','visible')
        } else {
            $(".divDateEnd").css('visibility','hidden')
        }
    })

    $('#memberSector').change(function () {
        $("#memberAddress").val($("#memberSector option:selected").text())
    })

    if (member.waterMeters.length > 0) {
        $('#memberWaterNumber').val(member.waterMeters[0].number)
        $('#memberWaterDiameter').val(member.waterMeters[0].diameter)
        $('#memberWaterState').val(member.waterMeters[0].state)
        $('#memberWaterDate').val(moment(member.waterMeters[0].dateStart).utc().format('DD/MM/YYYY'))
    }

    if (member.services.length > 0) {
        for(let i=0; i<member.services.length; i++){
            $("#tableBodyServices").append(`<tr>
                <td>
                    <select class="form-select form-select-sm custom-select">
                        ${
                            services.reduce((acc, el) => {
                                if(el._id==member.services[i].services._id){
                                    acc += '<option value="' + el._id + '" selected>' + el.name + '</option>'
                                }else{
                                    acc += '<option value="' + el._id + '">' + el.name + '</option>'
                                }
                                return acc
                            }, '')
                        }
                    </select>
                </td>
                <td><input type="text" class="form-control form-control-sm" value="${(member.services[i].value!=0) ? member.services[i].value : '' }"/></td>
                <td><button class="btn btn-sm btn-danger" style="border-radius:5px;" onclick="deleteService(this)"><i class="fas fa-times"></i></button></td>
            </tr>`)
        }
    }

    $('.datepicker').daterangepicker({
        opens: 'left',
        locale: dateRangePickerDefaultLocale,
        singleDatePicker: true,
        autoApply: true
    }, function (start, end, label) {
    })

    loadSubsidies(internals.dataRowSelected._id)
    
    let subsidyNumber = ''
    if(member.subsidyNumber){
        subsidyNumber = member.subsidyNumber.toString()
        while (subsidyNumber.length<11) {
            subsidyNumber = '0' + subsidyNumber
        }
    }else{
        subsidyNumber = parametersGeneral.municipality.subsidyCode
    }
    
    $("#memberSubsidyNumber").val(subsidyNumber)

    setTimeout(() => {
        $('#memberRUT').focus()
    }, 500)

    $('#saveMember').on('click', async function () {
        let waterMeters = [{
            number: $('#memberWaterNumber').val(),
            diameter: $('#memberWaterDiameter').val(),
            state: $('#memberWaterState').val(),
            dateStart: $('#memberWaterDate').data('daterangepicker').startDate.format('YYYY-MM-DD')
        }]

        let services = []
        let serviceError = false
        if($("#tableBodyServices > tr").length>0){
            $("#tableBodyServices > tr").each(function() {

                if(!$.isNumeric($($($(this).children()[1]).children()[0]).val())){
                    value = 0
                    serviceError = true
                }else{
                    value = $($($(this).children()[1]).children()[0]).val()
                }

                services.push({
                    services: $($($(this).children()[0]).children()[0]).val(),
                    value: value
                })
            })    
        }


        if(serviceError){
            toastr.warning('1 o más servicios tienen valores erróneos')
            return
        }

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
                sector: $('#memberSector').val()
            },
            waterMeters: waterMeters,
            email: $('#memberEmail').val(),
            phone: $('#memberPhone').val(),
            dateStart: $('#memberDateStart').data('daterangepicker').startDate.format('YYYY-MM-DD'),
            dateEnd: $('#memberDateEnd').data('daterangepicker').startDate.format('YYYY-MM-DD'),
            status: $("#memberStatus").val(),
            inactiveObservation: ($("#memberStatusObservation").val()) ? $("#memberStatusObservation").val() : '',
            subsidyNumber: $('#memberSubsidyNumber').val(),
            services: services,
            fine: $('#memberFine').prop('checked'),
            dte: $('#memberDTE').val(),
            sendEmail: $('#memberSendEmail').prop('checked'),
            sendWhatsapp: $('#memberSendWhatsapp').prop('checked')
        }

        const res = validateMemberData(memberData)

        if (res.ok) {
            let saveMember = await axios.post('/api/memberUpdate', memberData)

            if (saveMember.data) {
                if (saveMember.data._id) {
                    $('#modalMember').modal('hide')
                    toastr.success('Socio almacenado correctamente')
                    chargeMembersTable()

                } else if (saveMember.data == 'created') {
                    toastr.warning('RUT ya registrado, favor corroborar')
                
                }else{
                    toastr.error('Error al almacenar, favor reintente')
                }
            } else {
                toastr.error('Error al almacenar, favor reintente')
            }

        } else {

        }

    })

})

function validateMemberData(memberData) {
    let validationCounter = 0
    let errorMessage = ''


    if (validateRut(memberData.rut)) {
        validationCounter++
        $('#memberRUT').css('border', '1px solid #E5E5E5')
    } else {
        errorMessage += `<br>RUT válido`
        $('#memberRUT').css('border', '1px solid #e74c3c')
    }

    if(memberData.type=='personal'){
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
    }else{
        if (memberData.enterprise.name.length > 1) {
            validationCounter++
            $('#memberLastname1').css('border', '1px solid #E5E5E5')
        } else {
            errorMessage += `<br>Nombre Empresa</b>`
            $('#memberLastname1').css('border', '1px solid #e74c3c')
        }
    }

    if (memberData.address.address != '') {
        validationCounter++
        $('.address').css('border', '1px solid #E5E5E5')
    } else {
        errorMessage += `<br>Dirección</b>`
        $('.address').css('border', '1px solid #e74c3c')
    }

    if (memberData.address.sector != '0') {
        validationCounter++
        $('.address').css('border', '1px solid #E5E5E5')
    } else {
        errorMessage += `<br>Sector</b>`
        $('.address').css('border', '1px solid #e74c3c')
    }


    if (isEmail(memberData.email) || memberData.email == '') {
        validationCounter++
        $('#memberEmail').css('border', '1px solid #E5E5E5')
    } else {
        errorMessage += `<br>E-Mail válido`
        $('#memberEmail').css('border', '1px solid #e74c3c')
    }
    
    if ($.isNumeric(memberData.subsidyNumber)) {
        validationCounter++
        $('#memberSubsidyNumber').css('border', '1px solid #E5E5E5')
    } else {
        errorMessage += `<br>N° MIDEPLAN`
        $('#memberSubsidyNumber').css('border', '1px solid #e74c3c')
    }

    if (validationCounter >= 6 ) {
        return { ok: memberData }
    } else {
        toastr.warning('Faltan datos:<br>' + errorMessage)
        return { err: memberData }
    }

}

function setModal(type){

    let html = /*html*/`
            <div class="row">
                <div class="col-md-6">
                    <div class="card border-primary">
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-12">
                                    <h6>DATOS GENERALES</h6>
                                </div>
                                <div class="col-md-2">
                                    N° SOCIO
                                    <input id="memberNumber" type="text" class="form-control form-control-sm border-input" disabled>
                                </div>
                                <div class="col-md-3">
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
                                <div class="col-md-3">
                                    Fecha Ingreso
                                    <input id="memberDateStart" type="text" class="form-control form-control-sm border-input datepicker" value="${moment().utc().format('DD/MM/YYYY')}">
                                </div>

                                <div class="col-md-3">
                                    Estado
                                    <select id="memberStatus" class="form-select form-select-sm custom-select">
                                        <option value="active">ACTIVO</option>
                                        <option value="inactive">INACTIVO</option>
                                    </select>
                                </div>
                                <div class="col-md-3 divDateEnd">
                                    Motivo Baja
                                    <select id="memberStatusObservation" class="form-select form-select-sm custom-select">
                                        <option value="unmember">PIERDE CALIDAD</option>
                                        <option value="deceased">FALLECIDO</option>
                                    </select>
                                </div>
                                <div class="col-md-3 divDateEnd">
                                    Fecha Baja
                                    <input id="memberDateEnd" type="text" class="form-control form-control-sm border-input datepicker" value="${moment().utc().format('DD/MM/YYYY')}">
                                </div>

                                <div class="col-md-3">
                                    <br/>
                                    Multa 20%&nbsp;
                                    <input type="checkbox" id="memberFine" />
                                </div>
                                
                                <div class="col-md-3">
                                    Tipo de documento
                                    <select id="memberDTE" class="form-select form-select-sm custom-select">
                                        <option value="BOLETA">BOLETA</option>
                                        <option value="FACTURA">FACTURA</option>
                                        <option value="COMPROBANTE">COMPROBANTE</option>
                                    </select>
                                </div>
                                <div class="col-md-5">
                                    <br/>
                                </div>
                                <div class="col-md-4">
                                    <input type="checkbox" id="memberSendEmail" />
                                    <i class="fas fa-2x fa-envelope"></i>&nbsp;Envío por Correo
                                    <br/>
                                    <input type="checkbox" id="memberSendWhatsapp" />
                                    <i class="fab fa-2x fa-whatsapp"></i>&nbsp;Envío por Whatsapp
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
                        
                <div id="divEnterprise" class="col-md-6" style="display: none;">
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

                <div class="col-md-6">
                    <br/>
                    <div class="card border-primary">
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-12">
                                    <h6>CONTACTO</h6>
                                </div>

                                <div class="col-md-7">
                                    Dirección
                                    <input id="memberAddress" type="text" class="form-control form-control-sm border-input address">
                                </div>
                                <div class="col-md-5">
                                    Sector
                                    <select id="memberSector" class="form-select form-select-sm custom-select address">
                                        <option value="0">-</option>
                                        ${
                                            sectors.reduce((acc, el) => {
                                                acc += '<option value="' + el._id + '">' + el.name + '</option>'
                                                return acc
                                            }, '')
                                        }
                                    </select>
                                </div>
                                <div class="col-md-8">
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

                <div class="col-md-6">
                    <br/>
                    <div class="card border-primary">
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-12">
                                    <h6>MEDIDOR</h6>
                                </div>
                                <div class="col-md-3">
                                    Número de Medidor
                                    <input id="memberWaterNumber" type="text" class="form-control form-control-sm border-input">
                                </div>
                                <div class="col-md-3">
                                    Diámetro
                                    <select id="memberWaterDiameter" class="form-select form-select-sm custom-select">
                                        <option value="Medio">MEDIO</option>
                                        <option value="TresCuartos">3/4</option>
                                    </select>
                                </div>
                                <div class="col-md-3">
                                    Estado
                                    <select id="memberWaterState" class="form-select form-select-sm custom-select">
                                        <option value="Activo">ACTIVO</option>
                                        <option value="Inactivo">INACTIVO</option>
                                    </select>
                                </div>
                                <div class="col-md-3">
                                    Fecha Ingreso
                                    <input id="memberWaterDate" type="text" class="form-control form-control-sm border-input datepicker" value="${moment().utc().format('DD/MM/YYYY')}">
                                </div>
                                
                            </div>
                        </div>
                    </div>
                </div>`

        if(type=='update'){
            html += `<div class="col-md-12">
                    <br/>
                    <div class="card border-primary">
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-2">
                                    <h6>SUBSIDIOS</h6>
                                </div>
                                
                                <div class="col-md-2">
                                    N° MIDEPLAN
                                </div>
                                <div class="col-md-2">
                                    <input id="memberSubsidyNumber" maxlength="11" type="text" class="form-control form-control-sm border-input" style="text-align: center">
                                </div>

                                <div class="col-md-4">
                                    <!--<button class="btn btn-sm btn-primary" style="border-radius:5px; visibility: hidden;" onclick="addSubsidy()"><i class="fas fa-plus-circle"></i> Agregar Subsidio</button>-->
                                </div>

                                
                                <div class="col-md-8">
                                    <div class="card border-primary">
                                        <div class="card-body">
                                            <b id="subsidyTitle" style="display: inline-block">Subsidio Activo</b>

                                            <button id="btnSubsidyNew" class="btn btn-sm btn-primary" style="border-radius:5px; display: inline-block"><i class="fas fa-plus-circle"></i> Agregar Subsidio</button>

                                            <div id="subsidyRow" class="row" style="display: none">
                                                <div class="col-md-3">
                                                    RUT
                                                    <input id="subsidyRUT" type="text" class="form-control form-control-sm border-input">
                                                </div>
                                                <div class="col-md-3">
                                                    Nombres
                                                    <input id="subsidyName" type="text" class="form-control form-control-sm border-input">
                                                </div>
                                                <div class="col-md-3">
                                                    Apellido Paterno
                                                    <input id="subsidyLastname1" type="text" class="form-control form-control-sm border-input">
                                                </div>
                                                <div class="col-md-3">
                                                    Apellido Materno
                                                    <input id="subsidyLastname2" type="text" class="form-control form-control-sm border-input">
                                                </div>
                                                
                                                <div class="col-md-3">
                                                    Municipalidad
                                                    <select id="subsidyMunicipality" class="form-select form-select-sm custom-select">
                                                        <option value="${parametersGeneral.municipality.code}">CURICÓ</option>
                                                    </select>
                                                    </div>
                                                <div class="col-md-3">
                                                    Tipo
                                                    <select id="subsidyType" class="form-select form-select-sm custom-select">
                                                        <option value="1">1 - Municipalidad</option>
                                                        <option value="2">2 - Directiva</option>
                                                    </select>
                                                </div>
                                                <div class="col-md-3">
                                                    N° Decreto
                                                    <input id="subsidyDecreeNumber" type="text" class="form-control form-control-sm border-input">
                                                </div>
                                                <div class="col-md-3">
                                                    Fecha Decreto
                                                    <input id="subsidyDecreeDate" type="text" class="form-control form-control-sm border-input datepicker" value="${moment().utc().format('DD/MM/YYYY')}">
                                                </div>

                                                <div class="col-md-3">
                                                    N° Viviendas
                                                    <input id="subsidyHouseQuantity" type="text" class="form-control form-control-sm border-input">
                                                </div>
                                                <div class="col-md-3">
                                                    Porcentaje
                                                    <input id="subsidyPercentage" type="text" class="form-control form-control-sm border-input">
                                                </div>

                                                <div class="col-md-3">
                                                    Puntaje Ficha CAS
                                                    <input id="subsidyInscriptionScore" type="text" class="form-control form-control-sm border-input">
                                                </div>
                                                <div class="col-md-3">
                                                    Fecha CAS
                                                    <input id="subsidyInscriptionDate" type="text" class="form-control form-control-sm border-input datepicker" value="${moment().utc().format('DD/MM/YYYY')}">
                                                </div>
                                                


                                                <div class="col-md-3">
                                                    <br/>
                                                    <button id="btnSaveSubsidy" class="btn btn-sm btn-success" style="border-radius:5px;">Almacenar</button>
                                                </div>
                                                <div class="col-md-3">
                                                    <br/>
                                                    <button id="btnDeactivateSubsidy" class="btn btn-sm btn-danger" style="border-radius:5px;">Dar de Baja</button>
                                                </div>
                                                <div class="col-md-3">
                                                    Tramo RSH
                                                    <input id="subsidySectionRSH" type="text" class="form-control form-control-sm border-input">
                                                </div>
                                                <div class="col-md-3">
                                                    Fecha Vencimiento
                                                    <input id="subsidyEndDate" type="text" class="form-control form-control-sm border-input datepicker" value="${moment().utc().format('DD/MM/YYYY')}">
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="card border-primary">
                                        <div class="card-body">
                                            <b>Histórico</b>
                                            <table class="table" style="font-size: 12px">
                                                <thead>
                                                    <tr>
                                                        <th>N° Decreto</th>
                                                        <th>Fecha Decreto</th>
                                                        <th>Fecha Inscripción Reg. Social</th>
                                                        <th>Inicio</th>
                                                        <th>Fin</th>
                                                        <th>Porcentaje</th>
                                                    </tr>
                                                </thead>
                                                <tbody id="tableBodySubsidies">
                                                </tbody>

                                            </table>
                                        </div>
                                    </div>
                                </div>
                                
                            </div>
                        </div>
                    </div>
                </div>`
        }else{
            html += `<div class="col-md-12">
                    <br/>
                    <div class="card border-primary">
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-12">
                                    <h6>SUBSIDIOS</h6>
                                </div>
                                <div class="col-md-2">
                                    N° MIDEPLAN
                                </div>
                                <div class="col-md-2">
                                    <input id="memberSubsidyNumber" maxlength="11" type="text" class="form-control form-control-sm border-input" style="text-align: center">
                                </div>
                                <div class="col-md-12">
                                    Debe almacenar los datos de socio para poder agregar subsidios
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`
        }

        html += `<div class="col-md-6">
            <br/>
            <div class="card border-primary">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-4">
                            <h6>SERVICIOS</h6>
                        </div>
                        <div class="col-md-5">
                            <button class="btn btn-sm btn-primary" style="border-radius:5px;" onclick="addService()"><i class="fas fa-plus-circle"></i> Agregar Servicio</button>
                        </div>                        
                        <div class="col-md-12">
                            <table class="table" style="font-size: 12px">
                                <thead>
                                    <tr>
                                        <th>Servicio</th>
                                        <th>Valor (si corresponde)</th>
                                        <th>Quitar</th>
                                    </tr>
                                </thead>
                                <tbody id="tableBodyServices">
                                </tbody>

                            </table>
                        </div>
                        
                    </div>
                </div>
            </div>
        </div>
    </div>`

    $('#modalMember_body').html(html)

    $('.datepicker').daterangepicker({
        opens: 'left',
        locale: dateRangePickerDefaultLocale,
        singleDatePicker: true,
        autoApply: true
    }, function (start, end, label) {
    })
}

async function loadSubsidies(member){
    $("#tableBodySubsidies").html('')

    $("#subsidyTitle").text('Subsidio Inactivo')
    $("#subsidyRow").css('display','none')
    $("#btnSubsidyNew").css('display','inline-block')

    $("#subsidyRUT").val('')
    $("#subsidyName").val('')
    $("#subsidyLastname1").val('')
    $("#subsidyLastname2").val('')
    $("#subsidyHouseQuantity").val('')
    //$("#subsidyMunicipality").val('')
    $("#subsidyType").val(1)
    $("#subsidyDecreeNumber").val('')
    $("#subsidyDecreeDate").val(moment().utc().format('DD/MM/YYYY'))
    $("#subsidyInscriptionDate").val(moment().utc().format('DD/MM/YYYY'))
    $("#subsidyInscriptionScore").val('')
    $("#subsidySectionRSH").val('')
    $("#subsidyStartDate").val(moment().utc().format('DD/MM/YYYY'))
    $("#subsidyEndDate").val(moment().add(3,'years').utc().format('DD/MM/YYYY'))
    $("#subsidyPercentage").val('')
    $("#subsidyStatus").val('')

    let memberSubsidies = await axios.post('/api/memberSingle', {id: internals.dataRowSelected._id})
    let subsidies = memberSubsidies.data.subsidies

    let activeID = 0

    for(let i=0; i<subsidies.length; i++){

        if(subsidies[i].status=='active'){

            $("#subsidyTitle").text('Subsidio Activo')
            $("#subsidyRow").css('display','flex')
            $("#btnSubsidyNew").css('display','none')

            activeID = subsidies[i]._id
            $("#subsidyRUT").val(subsidies[i].rut)
            $("#subsidyName").val(subsidies[i].name)
            $("#subsidyLastname1").val(subsidies[i].lastname1)
            $("#subsidyLastname2").val(subsidies[i].lastname2)
            $("#subsidyHouseQuantity").val(subsidies[i].houseQuantity)
            $("#subsidyMunicipality").val(subsidies[i].municipality)
            $("#subsidyType").val(subsidies[i].type)
            $("#subsidyDecreeNumber").val(subsidies[i].decreeNumber)
            $("#subsidyDecreeDate").val(moment(subsidies[i].decreeDate).utc().format('DD/MM/YYYY'))
            $("#subsidyInscriptionDate").val(moment(subsidies[i].inscriptionDate).utc().format('DD/MM/YYYY'))
            $("#subsidyInscriptionScore").val(subsidies[i].inscriptionScore)
            $("#subsidySectionRSH").val(subsidies[i].sectionRSH)
            $("#subsidyStartDate").val(moment(subsidies[i].startDate).utc().format('DD/MM/YYYY'))
            $("#subsidyEndDate").val(moment(subsidies[i].endDate).utc().format('DD/MM/YYYY'))
            $("#subsidyPercentage").val(subsidies[i].percentage)
            $("#subsidyStatus").val(subsidies[i].status)

        }else{
        
            $("#tableBodySubsidies").append(`<tr>
                        <td>${subsidies[i].decreeNumber}</td>
                        <td>${moment(subsidies[i].decreeDate).utc().format('DD/MM/YYYY')}</td>
                        <td>${moment(subsidies[i].inscriptionDate).utc().format('DD/MM/YYYY')}</td>
                        <td>${moment(subsidies[i].startDate).utc().format('DD/MM/YYYY')}</td>
                        <td>${moment(subsidies[i].endDate).utc().format('DD/MM/YYYY')}</td>
                        <td>${subsidies[i].percentage}</td>
                    </tr>`)

        }
    }
    
    $('.datepicker').daterangepicker({
        opens: 'left',
        locale: dateRangePickerDefaultLocale,
        singleDatePicker: true,
        autoApply: true
    }, function(start, end, label) {
    })

    $('#subsidyRUT').on('keyup', function () {
        let rut = validateRut($(this).val())
        if (rut) {
            $(this).val(rut)
        }
    })

    $('#btnSubsidyNew').on('click', async function () {
        $("#subsidyTitle").text('Subsidio Activo')
        $("#subsidyRow").css('display','flex')

        $("#subsidyRUT").val($("#memberRUT").val())
        $("#subsidyName").val($("#memberName").val())
        $("#subsidyLastname1").val($("#memberLastname1").val())
        $("#subsidyLastname2").val($("#memberLastname2").val())
        $(this).css('display','none')
    })

    $('#btnSaveSubsidy').off('click')
    $('#btnSaveSubsidy').on('click', async function () {
        saveSubsidy(activeID)
    })

    if(activeID==0){
        $('#btnDeactivateSubsidy').css('visibility','hidden')
        $('#btnDeactivateSubsidy').off('click')
    }else{
        $('#btnDeactivateSubsidy').off('click')
        $('#btnDeactivateSubsidy').on('click', async function () {
            deactivateSubsidy(activeID)
        })
    }

}

async function saveSubsidy(id){

    if (!validateRut($("#subsidyRUT").val())) {
        toastr.warning('El RUT ingresado no es válido')
        return
    }

    if(!$.isNumeric($("#subsidyDecreeNumber").val())){
        toastr.warning('N° de Decreto no válido')
        return
    }
    if(!$.isNumeric($("#subsidyInscriptionScore").val())){
        $("#subsidyInscriptionScore").val(0)
        //toastr.warning('Puntaje Ficha CAS')
        return
    }
    if(!$.isNumeric($("#subsidySectionRSH").val())){
        toastr.warning('Debe ingresar Tramo RSH')
        return
    }

    let percentage = $("#subsidyPercentage").val()
    if(!$.isNumeric($("#subsidyPercentage").val() )){
        toastr.warning('Porcentaje no válido (debe ser entre 1% y 100%)')
        return
    }else{
        if(percentage<=0 || percentage>100){
            toastr.warning('Porcentaje no válido (debe ser entre 1% y 100%)')
            return
        }
    }

    let subsidyData = {
        member: internals.dataRowSelected._id,
        rut: $("#subsidyRUT").val(),
        name: $("#subsidyName").val(),
        lastname1: $("#subsidyLastname1").val(),
        lastname2: $("#subsidyLastname2").val(),
        houseQuantity: $("#subsidyHouseQuantity").val(),
        municipality: $("#subsidyMunicipality").val(),
        type: parseInt($("#subsidyType").val()),
        decreeNumber: parseInt($("#subsidyDecreeNumber").val()),
        decreeDate: $("#subsidyDecreeDate").data('daterangepicker').startDate.format('YYYY-MM-DD'),
        inscriptionDate: $("#subsidyInscriptionDate").data('daterangepicker').startDate.format('YYYY-MM-DD'),
        inscriptionScore: parseInt($("#subsidyInscriptionScore").val()),
        sectionRSH: parseInt($("#subsidySectionRSH").val()),
        startDate: $("#subsidyDecreeDate").data('daterangepicker').startDate.format('YYYY-MM-DD'),
        endDate: $("#subsidyEndDate").data('daterangepicker').startDate.format('YYYY-MM-DD'),
        percentage: parseInt($("#subsidyPercentage").val()),
        status: 'active'
    }

    let apiSave = 'subsidySave'
    if(id!=0){
        subsidyData.id = id
        apiSave = 'subsidyUpdate'
    }

    let saveSubsidy = await axios.post('/api/'+apiSave, subsidyData)
    if(saveSubsidy.data){
        if(saveSubsidy.data._id){

            toastr.success('Subsidio almacenado correctamente')
            loadSubsidies(internals.dataRowSelected._id)
        
        }else{
            toastr.error('Error al almacenar, favor reintente')
        }
    }else{
        toastr.error('Error al almacenar, favor reintente')
    }

}

async function deactivateSubsidy(id){

    let subsidyDeactivate = await Swal.fire({
        title: '¿Está seguro de dar de baja el subsidio?',
        customClass: 'swal-wide',
        html: ``,
        showCloseButton: true,
        showCancelButton: true,
        showConfirmButton: true,
        focusConfirm: false,
        confirmButtonText: 'Aceptar',
        cancelButtonText: 'Cancelar'
    })

    if (subsidyDeactivate.value) {
        
        let subsidyData = {
            member: internals.dataRowSelected._id,
            id: id,
            status: 'inactive'
        }

        let saveSubsidy = await axios.post('/api/subsidyDeactivate', subsidyData)
        if(saveSubsidy.data){
            if(saveSubsidy.data._id){
                toastr.success('Subsidio dado de baja correctamente')
                loadSubsidies(internals.dataRowSelected._id)

            }else{
                toastr.error('Error al almacenar, favor reintente')
            }
        }else{
            toastr.error('Error al almacenar, favor reintente')
        }
    }

}

function addService(){
    $("#tableBodyServices").append(`<tr>
                    <td>
                        <select class="form-select form-select-sm custom-select">
                            ${
                                services.reduce((acc, el) => {
                                    acc += '<option value="' + el._id + '">' + el.name + '</option>'
                                    return acc
                                }, '')
                            }
                        </select>
                    </td>
                    <td><input type="text" class="form-control form-control-sm" /></td>
                    <td><button class="btn btn-sm btn-danger" style="border-radius:5px;" onclick="deleteService(this)"><i class="fas fa-times"></i></button></td>
                </tr>`)
}

async function deleteService(btn){
    $(btn).parent().parent().remove()
   
    toastr.success('Registro eliminado correctamente')
}