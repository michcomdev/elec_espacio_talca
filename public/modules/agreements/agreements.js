let internals = {
    members: {
        table: {},
        data: []
    },
    lectures: {
        table: {},
        data: []
    },
    dataRowSelected: {},
    productRowSelected: {}
}

let clients = {}
let containerTypes = {}
let sites = {}
let cranes = {}
let sectors = {}
let serviceList = ''

let parameters

$(document).ready(async function () {
    $('#searchDate').daterangepicker({
        opens: 'left',
        locale: dateRangePickerDefaultLocale,
        startDate: moment().add(-1, 'months')
        //endDate: moment()
    }, function (start, end, label) {
        //internals.initDate = start.format('YYYY-MM-DD')
        //internals.endDate = end.format('YYYY-MM-DD')
    })
    getParameters()

    chargeMembersTable()
})

async function getParameters() {

    let parametersData = await axios.get('/api/parameters')
    parameters = parametersData.data

    let sectorsData = await axios.get('api/sectors')
    sectors = sectorsData.data

    $("#searchSector").append(
        sectors.reduce((acc,el)=>{
            acc += '<option value="'+el._id+'">'+el.name+'</option>'
            return acc
        },'')
    )

    let servicesData = await axios.post('/api/servicesByFilter', {type: 'CONVENIO'})
    let services = servicesData.data
    for(let i=0; i<services.length; i++){
        serviceList += `<option value="${services[i]._id}" data-value="${services[i].value}">${services[i].name}</option>`
    }
    serviceList += `<option value="0">OTROS</option>`

}

function chargeMembersTable() {
    try {
        if ($.fn.DataTable.isDataTable('#tableMembers')) {
            internals.members.table.clear().destroy()
        }
        internals.members.table = $('#tableMembers')
            .DataTable({
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
                iDisplayLength: 10,
                lengthMenu: [ [10, 25, 50, -1], [10, 25, 50, "Todo"] ],
                oLanguage: {
                    sSearch: 'buscar:'
                },
                language: {
                    url: spanishDataTableLang
                },
                responsive: true,
                columnDefs: [{ targets: [0, 1, 4, 5], className: 'dt-center' }],
                order: [[0, 'asc']],
                ordering: true,
                rowCallback: function (row, data) {
                    //$(row).find('td:eq(1)').html(moment.utc(data.date).format('DD/MM/YYYY'))
                    $(row).find('td:eq(5)').html(dot_separators(data.lastLecture))
                    // $('td', row).css('background-color', 'White');
                },
                columns: [
                    { data: 'number' },
                    { data: 'typeString' },
                    { data: 'name' },
                    { data: 'sector' },
                    { data: 'subsidyActive' },
                    { data: 'agreementStatus' }
                ],
                initComplete: function (settings, json) {
                    getMembers()
                }
            })

        $('#tableMembers tbody').off("click")

        $('#tableMembers tbody').on('click', 'tr', function () {
            if ($(this).hasClass('selected')) {
                $(this).removeClass('selected')
                $('#updateAgreement').prop('disabled', true)
            } else {
                internals.members.table.$('tr.selected').removeClass('selected')
                $(this).addClass('selected')
                $('#updateAgreement').prop('disabled', false)
                //internals.members.data = internals.members.table.row($(this)).data()
                internals.dataRowSelected = internals.members.table.row($(this)).data()
            }
        })
    } catch (error) {
        console.log(error)
    }

}

async function getMembers() {
    let lecturesData = await axios.post('api/membersLectures', {sector: $("#searchSector").val()})

    if (lecturesData.data.length > 0) {
        let formatData = lecturesData.data.map(el => {
            
            //el.datetime = moment(el.datetime).format('DD/MM/YYYY HH:mm')
            if (el.type == 'personal') {
                el.typeString = 'PERSONA'
                el.name = el.personal.name + ' ' + el.personal.lastname1 + ' ' + el.personal.lastname2
            } else {
                el.typeString = 'EMPRESA'
                el.name = el.enterprise.name
            }
            el.sector = el.address.sector.name
            if(el.subsidies.length>0){
                //Verificar que subsidio esté activo
                el.subsidyActive = 'SI'
            }else{
                el.subsidyActive = 'NO'

            }
            
            el.lastLecture = 0
            el.agreementStatus = 'AL DÍA'

            return el
        })

        internals.members.table.rows.add(formatData).draw()
        $('#loadingMembers').empty()
    } else {
        //toastr.warning('No se han encontrado ventas en el rango seleccionado')
        $('#loadingMembers').empty()
    }
}

$('#searchMembers').on('click', async function () {
    chargeMembersTable()
})

$('#updateAgreement').on('click', async function () {

    let memberData = await axios.post('/api/memberSingle', { id: internals.dataRowSelected._id })
    let member = memberData.data
    $('#lectureModal').modal('show')

    let name = ''
    let type = ''
    if (member.type == 'personal') {
        type = 'PERSONAL'
        name = member.personal.name + ' ' + member.personal.lastname1 + ' ' + member.personal.lastname2
    } else {
        type = 'EMPRESA'
        name = member.enterprise.name
    }

    $('#modalLecture_title').html(`Lecturas Socio N° ${member.number} - ${member.personal.name + ' ' + member.personal.lastname1 + ' ' + member.personal.lastname2}`)
    createModalBody(member)

    $('#modalLecture_footer').html(`
        <button style="border-radius: 5px;" class="btn btn-dark" data-dismiss="modal">
            <i ="color:#E74C3C;" class="fas fa-times"></i> CERRAR
        </button>
    `)

    $('#memberNumber').val(member.number)
    $('#memberType').val(type)
    $('#memberRUT').val(member.rut)
    $('#memberName').val(name)
    $('#memberWaterMeter').val(member.waterMeters.find(x => x.state === 'Activo').number)
    $('#memberAddress').val(member.address.address)

    loadAgreements(member)

})

$('#multipleAgreement').on('click', async function () {
    createModalBodyMultiple()

    $('#lectureModal').modal('show')

    $('#modalLecture_title').html(`Ingreso Masivo de Convenio/Multa`)

    $('#modalLecture_footer').html(`
        <button style="border-radius: 5px;" class="btn btn-dark" data-dismiss="modal">
            <i ="color:#E74C3C;" class="fas fa-times"></i> CERRAR
        </button>
    `)
    


    
    let agreementData = await axios.get('/api/agreementsFull')
    let agreements = agreementData.data

    console.log(agreements)
return
    $('#tableAgreementsBody').html('')

    for (i = 0; i < agreements.length; i++) {

        let total = 0
        let agreementID = 0
        
        total = dot_separators(agreements[i].totalAmount)
        agreementID = agreements[i]._id
        let agreement = ''
        if(agreements[i].services){
            agreement = agreements[i].services.name
        }else{
            agreement = agreements[i].other
        }
        
        $('#tableAgreementsBody').append(`
            <tr id="${agreements[i]._id}" data-agreement="${agreementID}">
                <td style="text-align: center;">
                    ${moment(agreements[i].date).utc().format('DD/MM/YYYY')}
                </td>
                <td style="text-align: center;">
                    ${agreement}
                </td>
                <td style="text-align: center;">
                    ${agreements[i].dues.length}
                </td>
                <td style="text-align: center;">
                    ${total}
                </td>
                <td style="text-align: center;">
                    <button class="btn btn-sm btn-warning btnLecture" onclick="createAgreement('${agreements[i]._id}','${member._id}')"><i class="far fa-edit" style="font-size: 14px;"></i></button>
                </td>
                <td style="text-align: center;">
                    POR PAGAR
                </td>
            </tr>
        `)
    }



})


async function loadAgreements(member) {

    //let agreementData = await axios.post('/api/agreementsSingleMember', { member: internals.dataRowSelected._id })
    let agreementData = await axios.post('/api/agreementsSingleMember', { member: member })
    let agreements = agreementData.data

    console.log(agreements)

    $('#tableAgreementsBody').html('')

    for (i = 0; i < agreements.length; i++) {

        let total = 0
        let agreementID = 0
        
        total = dot_separators(agreements[i].totalAmount)
        agreementID = agreements[i]._id
        let agreement = ''
        if(agreements[i].services){
            agreement = agreements[i].services.name
        }else{
            agreement = agreements[i].other
        }
        
        $('#tableAgreementsBody').append(`
            <tr id="${agreements[i]._id}" data-agreement="${agreementID}">
                <td style="text-align: center;">
                    ${moment(agreements[i].date).utc().format('DD/MM/YYYY')}
                </td>
                <td style="text-align: center;">
                    ${agreement}
                </td>
                <td style="text-align: center;">
                    ${agreements[i].dues.length}
                </td>
                <td style="text-align: center;">
                    ${total}
                </td>
                <td style="text-align: center;">
                    <button class="btn btn-sm btn-warning btnLecture" onclick="createAgreement('${agreements[i]._id}','${member._id}')"><i class="far fa-edit" style="font-size: 14px;"></i></button>
                </td>
                <td style="text-align: center;">
                    POR PAGAR
                </td>
            </tr>
        `)
    }

    /*$('#tableAgreements tbody').off("click")

    $('#tableAgreements tbody').on('click', 'tr', function () {
            $('#tableAgreementsBody > tr').removeClass('table-primary')
            $(this).addClass('table-primary')
            $('#divAgreement').css('display', 'block')
            $('#tableAgreements tbody').off("click")
            $('.btnLecture').attr('disabled',true)
            createAgreement($(this).attr('id'), $(this).attr('data-agreement'), member)
    
    })*/

}


function validateAgreementData(agreementData) {

    let errorMessage = ''
    if (!$.isNumeric(agreementData.agreementTotal)) {
        errorMessage += '<br>Total'
    }

    if (agreementData.services) {
        for(let i=0; i<agreementData.services.length; i++){
            if(agreementData.services[i].services=='0'){
                errorMessage += '<br>Seleccionar servicio(s)'
            }
            if (!$.isNumeric(agreementData.services[i].value) || agreementData.services[i].value==0) {
                errorMessage += '<br>Valor servicio'
            }
        }
    } else {
        errorMessage += '<br>Servicios'
    }


    if (errorMessage.length === 0) {
        return { ok: agreementData }
    } else {
        $(document).on('hidden.bs.modal', '.modal', function () { //Soluciona problema de scroll
            $('.modal:visible').length && $(document.body).addClass('modal-open')
        })

        toastr.error('Falta ingresar datos')

        return { err: agreementData }
    }
}

function createModalBody(member) {

    let body = /*html*/ `
    <div class="row">
    <div class="col-md-12">
    <h5>Datos de socio</h5>
        <div class="row">
            <div class="col-md-2">
                RUT
                <input id="memberRUT" type="text" class="form-control form-control-sm border-input" disabled>
            </div>
            <div class="col-md-3">
                Nombre
                <input id="memberName" type="text" class="form-control form-control-sm border-input" disabled>
            </div>
            <div class="col-md-1">
                N° Medidor
                <input id="memberWaterMeter" type="text" class="form-control form-control-sm border-input" disabled>
            </div>
            <div class="col-md-2">
                Tipo
                <input id="memberType" type="text" class="form-control form-control-sm border-input" disabled>
            </div>
            <div class="col-md-4">
                Dirección
                <input id="memberAddress" type="text" class="form-control form-control-sm border-input" disabled>
            </div>
            
            <!--<div class="col-md-12">
                <br/><br/>
            </div>-->
            
        </div>
    </div>
</div>
<br />
<br />
<div class="row">


<h5>Convenios registrados</h5>
    <div class="col-md-12">
        <div class="row">

            <div class="col-md-3">
                <button style="border-radius: 5px;" class="btn btn-primary" onclick="createAgreement(0,'${member._id}')"><i class="fas fa-plus-circle"></i> Agregar nuevo Convenio</button>
                <br/>
                <br/>
            </div>
            <div class="col-md-8 table-responsive">
            </div>
            <div class="col-md-8 table-responsive">
                <table id="tableAgreements" class="display nowrap table table-condensed cell-border" cellspacing="0">
                    <thead id="tableAgreementsHead">
                        <tr class="table-info">
                            <th style="text-align: center; background-color: #3B6FC9; border-top-left-radius: 5px;">Fecha</th>
                            <th style="text-align: center; background-color: #3B6FC9;">Convenio</th>
                            <th style="text-align: center; background-color: #3B6FC9;">N° Cuotas</th>
                            <th style="text-align: center; background-color: #3B6FC9;">Monto Total</th>
                            <th style="text-align: center; background-color: #3B6FC9;">Editar</th>
                            <th style="text-align: center; background-color: #3B6FC9; border-top-right-radius: 5px;">Estado Pago</th>
                        </tr>
                    </thead>
                    <tbody id="tableAgreementsBody">
                    </tbody>
                </table>
            </div>
            <div class="col-md-4">
                
            </div>

            <div class="col-md-1">
            </div>
            <div class="col-md-10">
                <br />
                <br />
                <br />
                <br />
                <div id="divAgreement" class="card border-primary" style="display: none;">
                    <div class="card-header text-white bg-primary" style="text-align: center">
                        <b id="agreementTitle">Registro de Convenio</b>
                    </div>

                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-2">
                                Fecha
                                <input id="agreementDate" type="text" class="form-control form-control-sm border-input agreementDateClass" value="${moment.utc().format('DD/MM/YYYY')}" onchange="calculateDues()">
                            </div>
                            <div class="col-md-2">
                                Convenio
                                <select id="agreementList" class="form-control form-select form-select-sm" onchange="setAgreement(this)">
                                    <option value="SELECCIONE">SELECCIONE</option>
                                    ${serviceList}
                                </select>
                            </div>
                            <div id="agreementDiv" class="col-md-2" style="display: none">
                                Convenio
                                <input id="agreementOther" type="text" class="form-control form-control-sm border-input">
                            </div>
                            <div class="col-md-2">
                                Monto Total
                                <input id="agreementAmount" type="text" class="form-control form-control-sm border-input" onkeyup="calculateDues()">
                            </div>
                            <div class="col-md-2" style="text-align: center">
                                Cuotas
                                <select id="agreementDues" class="form-control form-select form-select-sm" onchange="calculateDues()">
                                    <option value="1" style="text-align: center">1</option>
                                    <option value="2" style="text-align: center">2</option>
                                    <option value="3" style="text-align: center">3</option>
                                    <option value="4" style="text-align: center">4</option>
                                    <option value="5" style="text-align: center">5</option>
                                    <option value="6" style="text-align: center">6</option>
                                </select>
                            </div>

                            <div class="col-md-12" style="text-align: center">
                                <br/>
                                <br/>
                                <div class="card border-primary">
                                    <table id="tableDues class="table" style="font-size: 12px; margin: 0 auto; width: 70%">
                                        <thead>
                                            <tr>
                                                <th>N° Cuota</th>
                                                <th>Mes</th>
                                                <th>Monto</th>
                                            </tr>
                                        </thead>
                                        <tbody id="tableBodyDues">
                                        
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div class="row">
                            <br/>
                            <br/>
                            <div class="col-md-3" style="text-align: center;">
                                <button style="border-radius:5px; " class="btn btn-warning" id="agreementCancel"><i class="fas fa-arrow-left"></i> Atrás</button></td>
                            </div>
                            <div class="col-md-1" style="text-align: center;">
                            </div>
                            <div class="col-md-3" style="text-align: center;">
                                <button style="border-radius:5px; " class="btn btn-info" id="agreementSave"><i class="fas fa-check"></i> GUARDAR</button></td>
                            </div>
                            <div class="col-md-2" style="text-align: center;">
                            </div>
                            <div class="col-md-3" style="text-align: right;">
                                <button style="border-radius:5px; " class="btn btn-danger" id="agreementDelete"><i class="fas fa-times"></i> ELIMINAR</button></td>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
</div>
    
`

    $('#modalLecture_body').html(body)

    $("#agreementCancel").on('click', async function () {

        cleanAgreement()

    })
}

function createModalBodyMultiple() {

    let body = /*html*/ `
<div class="row">
<h5>Convenios registrados</h5>
    <div class="col-md-12">
        <div class="row">

            <div class="col-md-3">
                <button style="border-radius: 5px;" class="btn btn-primary" onclick="createMultipleAgreement(0)"><i class="fas fa-plus-circle"></i> Agregar nuevo Convenio</button>
                <br/>
                <br/>
            </div>
            <div class="col-md-8 table-responsive">
            </div>
            <div class="col-md-8 table-responsive">
                <table id="tableAgreements" class="display nowrap table table-condensed cell-border" cellspacing="0">
                    <thead id="tableAgreementsHead">
                        <tr class="table-info">
                            <th style="text-align: center; background-color: #3B6FC9; border-top-left-radius: 5px;">Fecha</th>
                            <th style="text-align: center; background-color: #3B6FC9;">Convenio</th>
                            <th style="text-align: center; background-color: #3B6FC9;">N° Cuotas</th>
                            <th style="text-align: center; background-color: #3B6FC9;">Monto Total</th>
                            <th style="text-align: center; background-color: #3B6FC9;">Cant. Socios</th>
                            <th style="text-align: center; background-color: #3B6FC9; border-top-right-radius: 5px;">Editar</th>
                        </tr>
                    </thead>
                    <tbody id="tableAgreementsBody">
                    </tbody>
                </table>
            </div>
            <div class="col-md-4">
                
            </div>

            <div class="col-md-1">
            </div>
            <div class="col-md-10">
                <br />
                <br />
                <br />
                <br />
                <div id="divAgreement" class="card border-primary" style="display: none;">
                    <div class="card-header text-white bg-primary" style="text-align: center">
                        <b id="agreementTitle">Registro de Convenio</b>
                    </div>

                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-2">
                                Fecha
                                <input id="agreementDate" type="text" class="form-control form-control-sm border-input agreementDateClass" value="${moment.utc().format('DD/MM/YYYY')}" onchange="calculateDues()">
                            </div>
                            <div class="col-md-2">
                                Convenio
                                <select id="agreementList" class="form-control form-select form-select-sm" onchange="setAgreement(this)">
                                    <option value="SELECCIONE">SELECCIONE</option>
                                    ${serviceList}
                                </select>
                            </div>
                            <div id="agreementDiv" class="col-md-2" style="display: none">
                                Convenio
                                <input id="agreementOther" type="text" class="form-control form-control-sm border-input">
                            </div>
                            <div class="col-md-2">
                                Monto Total
                                <input id="agreementAmount" type="text" class="form-control form-control-sm border-input" onkeyup="calculateDues()">
                            </div>
                            <div class="col-md-2" style="text-align: center">
                                Cuotas
                                <select id="agreementDues" class="form-control form-select form-select-sm" onchange="calculateDues()">
                                    <option value="1" style="text-align: center">1</option>
                                    <option value="2" style="text-align: center">2</option>
                                    <option value="3" style="text-align: center">3</option>
                                    <option value="4" style="text-align: center">4</option>
                                    <option value="5" style="text-align: center">5</option>
                                    <option value="6" style="text-align: center">6</option>
                                </select>
                            </div>

                            <div class="col-md-12" style="text-align: center">
                                <br/>
                                <br/>
                                <div class="card border-primary">
                                    <table id="tableDues class="table" style="font-size: 12px; margin: 0 auto; width: 70%">
                                        <thead>
                                            <tr>
                                                <th>N° Cuota</th>
                                                <th>Mes</th>
                                                <th>Monto</th>
                                            </tr>
                                        </thead>
                                        <tbody id="tableBodyDues">
                                        
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div class="row">
                            <br/>
                            <br/>
                            <div class="col-md-3" style="text-align: center;">
                                <button style="border-radius:5px; " class="btn btn-warning" id="agreementCancel"><i class="fas fa-arrow-left"></i> Atrás</button></td>
                            </div>
                            <div class="col-md-1" style="text-align: center;">
                            </div>
                            <div class="col-md-3" style="text-align: center;">
                                <button style="border-radius:5px; " class="btn btn-info" id="agreementSave"><i class="fas fa-check"></i> GUARDAR</button></td>
                            </div>
                            <div class="col-md-2" style="text-align: center;">
                            </div>
                            <div class="col-md-3" style="text-align: right;">
                                <button style="border-radius:5px; " class="btn btn-danger" id="agreementDelete"><i class="fas fa-times"></i> ELIMINAR</button></td>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
</div>
    
`

    $('#modalLecture_body').html(body)

    $("#agreementCancel").on('click', async function () {

        cleanAgreement()

    })
}

function setAgreement(select){
    if($("#agreementList").val()==0){
        $("#agreementDiv").css('display','block')
        $("#agreementAmount").val(0)
    }else{
        $("#agreementDiv").css('display','none')
        $("#agreementOther").val('')
        $("#agreementAmount").val($('option:selected', select).attr('data-value'))
    }
    calculateDues()
}

function calculateDues(){

    $("#tableBodyDues").html('')
    let dueValue = 0
    let lastDueValue = 0
    if($.isNumeric($("#agreementAmount").val())){
        dueValue = Math.trunc(parseInt($("#agreementAmount").val()) / parseInt($("#agreementDues").val()))
        lastDueValue = parseInt($("#agreementAmount").val()) - (dueValue * parseInt($("#agreementDues").val()))
    }

    let year = $("#agreementDate").data('daterangepicker').startDate.format('YYYY')
    let month = parseInt($("#agreementDate").data('daterangepicker').startDate.format('MM'))
    let monthList = '<select class="form-control form-select form-select-sm">'

    for(let j=0; j<12; j++){
        monthList += `<option value="${year}_${month}" style="text-align: center;" data-list="${j}">${getMonthString(month)} / ${year}</option>`

        if(month==12){
            month = 1
            year++
        }else{
            month++
        }
    }
    monthList += '</select>'


    for(let i=0; i<parseInt($("#agreementDues").val()); i++){
        $("#tableBodyDues").append(`
            <tr>
                <td>${i+1}</td>
                <td>${monthList.replace(`data-list="${i}"`,`data-list="${i}" selected`)}</td>
                <td><input class="form-control form-control-sm" type="Number" style="text-align: center;" value="${(i+1<parseInt($("#agreementDues").val())) ? dueValue : dueValue + lastDueValue }" /></td>
            </tr>
        `)
    }

}

function addService(id,value){
    if(id){
        $("#tableBodyServices").append(serviceList.replace(`value="${id}"`,`value="${id}" selected`).replace(`style="text-align: right" value="0`,`style="text-align: right" value="${value}`))
    }else{
        $("#tableBodyServices").append(serviceList)
    }

    $(".serviceValue").each(function() {
        new Cleave($(this), {
            prefix: '$ ',
            numeral: true,
            numeralThousandsGroupStyle: 'thousand',
            numeralDecimalScale: 0,
            numeralPositiveOnly: true,
            numeralDecimalMark: ",",
            delimiter: "."
        })
    })
}

function addServiceOther(other,value){
    $("#tableBodyServices").append(`<tr>
                    <td>
                        <input type="text" class="form-control form-control-sm" value="${(other) ? other : ''}"/>
                    </td>
                    <td>
                        <select class="form-select form-select-sm">
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5</option>
                            <option value="6">6</option>
                        </select>
                    </td>
                    <td>
                        <input type="text" class="form-control form-control-sm serviceValue" onkeyup="calculateTotal()" style="text-align: right" value="${(value) ? value : ''}"/>
                    </td>
                    <td>
                        <button style="border-radius:5px;" class="btn btn-sm btn-danger" onclick="deleteService(this)"><i ="color:#3498db;" class="fas fa-times"></i></button>
                    </td>
                </tr>`)

    $(".serviceValue").each(function() {
        new Cleave($(this), {
            prefix: '$ ',
            numeral: true,
            numeralThousandsGroupStyle: 'thousand',
            numeralDecimalScale: 0,
            numeralPositiveOnly: true,
            numeralDecimalMark: ",",
            delimiter: "."
        })
    })
}

function deleteService(btn){
    $(btn).parent().parent().remove()
}


function serviceValue(select){
    
    $($($(select).parent().parent().children()[1]).children()[0]).val($('option:selected', select).attr('data-value'))

    $(".serviceValue").each(function() {
        new Cleave($(this), {
            prefix: '$ ',
            numeral: true,
            numeralThousandsGroupStyle: 'thousand',
            numeralDecimalScale: 0,
            numeralPositiveOnly: true,
            numeralDecimalMark: ",",
            delimiter: "."
        })
    })
    calculateTotal()
}

async function cleanAgreement() {
    $("#tableAgreementsBody > tr").removeClass('table-primary')
    $('#divAgreement').css('display', 'none')
    $("#agreementTitle").text('')
    $("#agreementDate").val('')
    $("#agreementList").val('SELECCIONE')
    $("#agreementDiv").css('display','none')
    $("#agreementOther").val('')
    $("#agreementDues").val('1')
    $("#tableBodyDues").html('')
    $('.btnLecture').removeAttr('disabled')
}

function calculateTotal() {
    
    //Servicios
    let totalServices = 0
    if($("#tableBodyServices > tr").length>0){
        $("#tableBodyServices > tr").each(function() {
            console.log($($($(this).children()[2]).children()[0]).val())
            let value = 0
            if(!$.isNumeric(replaceAll($($($(this).children()[2]).children()[0]).val(), '.', '').replace(' ', '').replace('$', ''))){
                value = 0
            }else{
                value = replaceAll($($($(this).children()[2]).children()[0]).val(), '.', '').replace(' ', '').replace('$', '')
            }
            totalServices += parseInt(value)
        })    
    }
    $("#agreementTotalServices").val(totalServices)
    $("#agreementTotalServicesb").val(totalServices)

    $("#agreementTotal").val(parseInt(totalServices))


    $(".consumption").each(function() {
        //$(this).val(dot_separators($(this).val()))

        new Cleave($(this), {
            prefix: '',
            numeral: true,
            numeralThousandsGroupStyle: 'thousand',
            numeralDecimalScale: 0,
            numeralPositiveOnly: true,
            numeralDecimalMark: ",",
            delimiter: "."
        })
    })

    $(".money").each(function() {
        //$(this).val(dot_separators($(this).val()))

        new Cleave($(this), {
            prefix: '$ ',
            numeral: true,
            numeralThousandsGroupStyle: 'thousand',
            numeralDecimalScale: 0,
            numeralPositiveOnly: true,
            numeralDecimalMark: ",",
            delimiter: "."
        })
    })    

}

async function createAgreement(agreementID, memberID) {
//async function createAgreement(lectureID, agreementID, memberID) {

    $('#tableAgreementsBody > tr').removeClass('table-primary')
    $("#"+agreementID).addClass('table-primary')
    $('#divAgreement').css('display', 'block')
    $('.btnLecture').attr('disabled',true)
    //createAgreement($(this).attr('id'), $(this).attr('data-agreement'), member)

    let memberData = await axios.post('/api/memberSingle', {id: memberID})
    let member = memberData.data

    //let servicesData = await axios.post('/api/servicesByFilter', {agreement: 'INGRESO'})
    //let services = servicesData.data

    if (agreementID == 0) {

        //Definir parámetros
        $("#agreementTitle").text("Nuevo Convenio")
        $("#agreementDelete").css("display","none")
        //$("#agreementNumber").val('')
        $("#agreementDate").val(moment.utc().format('DD/MM/YYYY'))
        $("#agreementDateExpire").val(moment.utc().add(15, 'days').format('DD/MM/YYYY'))

        addService()
        $('.agreementDateClass').daterangepicker({
            opens: 'right',
            locale: dateRangePickerDefaultLocale,
            singleDatePicker: true,
            autoApply: true
        })

        calculateDues() //Agrega 1ra cuota

        calculateTotal()

        $('#agreementSave').off("click")

        $("#agreementSave").on('click', async function () {

            let goSave = true
            let totalAmount = replaceAll($("#agreementAmount").val(), '.', '').replace(' ', '').replace('$', '')
            
            if(!$.isNumeric(totalAmount)){
                toastr.warning('Debe ingresar un monto total válido')
                return
            }else{
                totalAmount = parseInt(totalAmount)
            }

            let dues = []
            let totalDues = 0
            if($("#tableBodyDues > tr").length>0){
                $("#tableBodyDues > tr").each(function() {
                    let amount = replaceAll($($($(this).children()[2]).children()[0]).val(), '.', '').replace(' ', '').replace('$', '')
    
                    if($.isNumeric(amount)){
                        let dueDate = $($($(this).children()[1]).children()[0]).val().split('_')
                        dues.push({
                            number: $($(this).children()[0]).text(),
                            year: dueDate[0],
                            month: dueDate[1],
                            amount: amount
                        })
                        totalDues += parseInt(amount)
                    }else{
                        goSave = false
                    }
                })    
            }

            if(!goSave){
                toastr.warning('1 o más cuotas tienen valores erróneos')
                return
            }

            console.log(totalDues, totalAmount)
            if(totalDues!=totalAmount){
                toastr.warning('Las cuotas no coinciden con el total del convenio')
                return
            }

            let agreementData = {
                member: member._id,
                date: $("#agreementDate").data('daterangepicker').startDate.format('YYYY-MM-DD'),
                other: $("#agreementOther").val(),
                totalAmount: totalAmount,
                dues: dues
            }

            if($("#agreementList").val()!="0" && $("#agreementList").val()!="SELECCIONE"){
                agreementData.service = $("#agreementList").val()
            }

            /*if(services.length>0){
                saleData.services = services
            }*/

            console.log('save',agreementData)
            
            let saveAgreement = await axios.post('/api/agreementSave', agreementData)
            if (saveAgreement.data) {
                if (saveAgreement.data._id) {

                    toastr.success('Convenio almacenado correctamente')
                    cleanAgreement()
                    loadAgreements(member)
                } else {
                    toastr.error('Error al almacenar, favor reintente')
                }
            } else {
                toastr.error('Error al almacenar, favor reintente')
            }
            $('#modal').modal('show')

        })
    } else {

        let agreementData = await axios.post('/api/agreementSingle', { id: agreementID })
        let agreement = agreementData.data
        
        $("#agreementTitle").text("Modificar Convenio")
        $("#agreementDelete").css("display","block")

        //$("#agreementNumber").val(agreement.number)
        $("#agreementDate").val(moment(agreement.date).utc().format('DD/MM/YYYY'))       

        $('.agreementDateClass').daterangepicker({
            opens: 'right',
            locale: dateRangePickerDefaultLocale,
            singleDatePicker: true,
            autoApply: true
        })

        $("#tableBodyDues").html('')

        if (agreement.services) {
            $("#agreementList").val(agreement.services._id)
            $("#agreementDiv").css('display','none')
        }else{
            $("#agreementList").val(0)
            $("#agreementOther").val(agreement.other)
            $("#agreementDiv").css('display','block')
        }
        //setAgreement()

        $("#agreementAmount").val(agreement.totalAmount)
        $("#agreementDues").val(agreement.dues.length)

        let year = $("#agreementDate").data('daterangepicker').startDate.format('YYYY')
        let month = parseInt($("#agreementDate").data('daterangepicker').startDate.format('MM'))
        let monthList = '<select class="form-control form-select form-select-sm">'

        for(let j=0; j<12; j++){
            monthList += `<option value="${year}_${month}" style="text-align: center;" data-list="${j}">${getMonthString(month)} / ${year}</option>`
                if(month==12){
                month = 1
                year++
            }else{
                month++
            }
        }
        monthList += '</select>'

        
        for(let i=0; i<agreement.dues.length; i++){
            let value = agreement.dues[i].year + '_' + agreement.dues[i].month
            $("#tableBodyDues").append(`
                <tr>
                    <td>${agreement.dues[i].number}</td>
                    <td>${monthList.replace(`value="${value}"`,`value="${value}" selected`)}</td>
                    <td><input class="form-control form-control-sm" type="Number" style="text-align: center;" value="${agreement.dues[i].amount}" /></td>
                </tr>
            `)
        }

        $('#agreementSave').off("click")

        $("#agreementSave").on('click', async function () {

            let goSave = true
            let totalAmount = replaceAll($("#agreementAmount").val(), '.', '').replace(' ', '').replace('$', '')
            
            if(!$.isNumeric(totalAmount)){
                toastr.warning('Debe ingresar un monto total válido')
                return
            }else{
                totalAmount = parseInt(totalAmount)
            }

            let dues = []
            let totalDues = 0
            if($("#tableBodyDues > tr").length>0){
                $("#tableBodyDues > tr").each(function() {
                    let amount = replaceAll($($($(this).children()[2]).children()[0]).val(), '.', '').replace(' ', '').replace('$', '')
    
                    if($.isNumeric(amount)){
                        let dueDate = $($($(this).children()[1]).children()[0]).val().split('_')
                        dues.push({
                            number: $($(this).children()[0]).text(),
                            year: dueDate[0],
                            month: dueDate[1],
                            amount: amount
                        })
                        totalDues += parseInt(amount)
                    }else{
                        goSave = false
                    }
                })    
            }

            if(!goSave){
                toastr.warning('1 o más cuotas tienen valores erróneos')
                return
            }

            console.log(totalDues, totalAmount)
            if(totalDues!=totalAmount){
                toastr.warning('Las cuotas no coinciden con el total del convenio')
                return
            }

            let agreementData = {
                id: agreementID,
                member: member._id,
                date: $("#agreementDate").data('daterangepicker').startDate.format('YYYY-MM-DD'),
                other: $("#agreementOther").val(),
                totalAmount: totalAmount,
                dues: dues
            }

            if($("#agreementList").val()!="0" && $("#agreementList").val()!="SELECCIONE"){
                agreementData.service = $("#agreementList").val()
            }
            
            let saveAgreement = await axios.post('/api/agreementUpdate', agreementData)
            if (saveAgreement.data) {
                if (saveAgreement.data._id) {

                    toastr.success('Convenio almacenado correctamente')
                    cleanAgreement()
                    loadAgreements(member)
                } else {
                    toastr.error('Error al almacenar, favor reintente')
                }
            } else {
                toastr.error('Error al almacenar, favor reintente')
            }
            $('#modal').modal('show')

        })


        $("#agreementDelete").on('click', async function () {
            let deleteAgreementMessage = await Swal.fire({
                title: '¿Está seguro de eliminar estos datos?',
                customClass: 'swal-wide',
                html: ``,
                showCloseButton: true,
                showCancelButton: true,
                showConfirmButton: true,
                focusConfirm: false,
                confirmButtonText: 'Aceptar',
                cancelButtonText: 'Cancelar'
            })
        
            if (deleteAgreementMessage.value) {
                let agreementData = {
                    id: agreementID
                }

                let deleteAgreement = await axios.post('/api/agreementDelete', agreementData)
                if (deleteAgreement.data) {
                    toastr.success('Registro eliminado')
                    cleanAgreement()
                    loadAgreements(member)
                } else {
                    toastr.error('Error al eliminar, favor reintente')
                }

                //$('#modal').modal('show')
            }
        })

    }
}

async function printVoucher(memberID,agreementID) {
    loadingHandler('start')
    
    let memberData = await axios.post('/api/memberSingle', {id: memberID})
    let member = memberData.data

    let agreementData = await axios.post('/api/agreementSingle', { id: agreementID })
    let agreement = agreementData.data
    console.log(agreement)

    /*for(let i=0; i<agreementsAgreement.agreements.length; i++){
        $("#tableBodyDebtAgreements").append(`<tr class="table-primary">
            <td style="text-align: center"><input class="checkAgreement" type="checkbox" checked/><input value="${agreementsAgreement.agreements[i].agreements._id}" style="display: none;"/></td>
            <td style="text-align: center">${agreementsAgreement.agreements[i].agreements.number}</td>
            <td style="text-align: center">${moment(agreementsAgreement.agreements[i].agreements.date).utc().format('DD/MM/YYYY')}</td>
            <td style="text-align: center">${moment(agreementsAgreement.agreements[i].agreements.dateExpire).utc().format('DD/MM/YYYY')}</td>
            <td style="text-align: right">${dot_separators(agreementsAgreement.agreements[i].agreements.agreementSubTotal)}</td>
            <td style="text-align: right">${dot_separators(agreementsAgreement.agreements[i].agreements.agreementSubTotal - agreementsAgreement.agreements[i].agreements.agreementPaid + agreementsAgreement.agreements[i].amount)}
                <input value="${agreementsAgreement.agreements[i].agreements.agreementSubTotal - agreementsAgreement.agreements[i].agreements.agreementPaid + agreementsAgreement.agreements[i].amount}" style="display: none;"/>
            </td>
            <td style="text-align: right">${dot_separators(agreementsAgreement.agreements[i].agreements.agreementSubTotal - agreementsAgreement.agreements[i].agreements.agreementPaid + agreementsAgreement.agreements[i].amount)}</td>
        </tr>`)
    }*/

    let parametersData = await axios.get('/api/parameters')
    let parameters = parametersData.data

    if (member.type == 'personal') {
        memberName = member.personal.name + ' ' + member.personal.lastname1 + ' ' + member.personal.lastname2
    } else {
        memberName = member.enterprise.name
    }

    let doc = new jsPDF('p', 'pt', 'letter')
    //let doc = new jsPDF('p', 'pt', [302, 451])

    let pdfX = 150
    let pdfY = 20
    doc.addImage(logoWallImg, 'PNG', 0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight()) //Fondo

    pdfX = 30
    doc.setFontSize(16)
    doc.setFontType('bold')
    doc.text(`COMPROBANTE DE INGRESO`, pdfX, pdfY + 23)
    doc.setFontSize(10)
    doc.setFontType('normal')
    doc.setTextColor(143, 143, 143)
    doc.text(`Código Interno N° ${agreement._id}`, pdfX, pdfY + 38)

    pdfX = 280
    doc.addImage(logoImg, 'PNG', pdfX, pdfY, 77, 60)
    doc.setTextColor(0, 0, 0)
    doc.text(`COMITÉ DE AGUA POTABLE RURAL`, pdfX + 80, pdfY + 23)
    doc.text(`Y SERVICIOS SANITARIOS LOS CRISTALES`, pdfX + 80, pdfY + 36)
    doc.text(`Los Cristales S/N`, pdfX + 80, pdfY + 49)

    pdfX = 30
    pdfY += 80

    doc.setDrawColor(0, 0, 0)
    doc.setTextColor(0, 0, 0)

    doc.line(pdfX, pdfY, doc.internal.pageSize.getWidth() - 30, pdfY )//Línea Superior

    pdfY += 35
    doc.setFontSize(12)
    doc.setFontType('bold')
    doc.text('Socio N° ' + member.number, pdfX, pdfY)
    doc.setFontSize(10)
    doc.setFontType('normal')
    doc.text('R.U.T ' + member.rut, pdfX, pdfY + 15)
    doc.text(memberName, pdfX, pdfY + 28)
    let subsidyNumber = member.subsidyNumber.toString()
    while (subsidyNumber.length<11) {
        subsidyNumber = '0' + subsidyNumber
    }
    doc.text('MIDEPLAN ' + subsidyNumber, pdfX, pdfY + 41)

    doc.setFontSize(12)
    doc.setFontType('bold')
    doc.text('Pago',  + 300, pdfY)
    doc.setFontSize(10)
    doc.setFontType('normal')
    /*doc.text('Medio de Pago: ' + agreement.agreementMethod,  + 300, pdfY + 15)
    doc.text('N° Transacción: ' + agreement.transaction,  + 300, pdfY + 28)
    doc.text('Fecha Pago: ' + moment(agreement.date).utc().format('DD / MM / YYYY'),  + 300, pdfY + 41)*/

    pdfY += 60

    doc.setFillColor(26, 117, 187)
    doc.rect(pdfX - 3, pdfY, doc.internal.pageSize.getWidth() - 57, 14, 'F')
    doc.setFontSize(9)
    doc.setFontType('bold')
    doc.setTextColor(255, 255, 255)
    doc.text('DETALLE', pdfX, pdfY + 10)
    doc.text('SUBTOTAL', doc.internal.pageSize.getWidth() - 40, pdfY + 10, 'right')

    pdfY += 18
    doc.setFontType('normal')
    doc.setTextColor(0, 0, 0)
    for(let i=0; i<agreement.services.length; i++){
        pdfY += 13
        if(agreement.services[i].others){
            doc.text(agreement.services[i].others, pdfX, pdfY)
        }else{
            doc.text(agreement.services[i].services.name, pdfX, pdfY)
        }

        doc.text('$ ' + dot_separators(agreement.services[i].value), doc.internal.pageSize.getWidth() - 40, pdfY, 'right')

    }

    pdfY = 300
    
    doc.setFillColor(0, 0, 0)
    doc.rect(pdfX + 345, pdfY, 200, 15, 'F')

    doc.setFontType('bold')
    doc.setFontSize(10)
    doc.setTextColor(255, 255, 255)
    doc.text(`Total`, pdfX + 350, pdfY + 11)
    doc.text('$ ' + dot_separators(agreement.agreementTotal), doc.internal.pageSize.getWidth() - 40, pdfY + 11, 'right')

    window.open(doc.output('bloburl'), '_blank')

    loadingHandler('stop')
}

async function printAgreement(docType,type,memberID,agreementID) {
    
    let memberData = await axios.post('/api/memberSingle', {id: memberID})
    let member = memberData.data

    let agreementData = await axios.post('/api/agreementSingle', { id: agreementID })
    let agreement = agreementData.data

    let lecturesData = await axios.post('/api/lecturesSingleMember', { member: memberID })
    let lectures = lecturesData.data

    let parametersData = await axios.get('/api/parameters')
    let parameters = parametersData.data


    let docName1 = '', docName2 = 'EXENTA ELECTRÓNICA', memberName = ''
    if (type == 'personal') {
        docName1 = 'BOLETA NO AFECTA O'
        memberName = member.personal.name + ' ' + member.personal.lastname1 + ' ' + member.personal.lastname2
    } else {
        docName1 = 'FACTURA NO AFECTA O'
        memberName = member.enterprise.name
    }

    let doc = new jsPDF('p', 'pt', 'letter')
    //let doc = new jsPDF('p', 'pt', [302, 451])

    let pdfX = 150
    let pdfY = 20

    doc.setFontSize(12)
    doc.addImage(logoWallImg, 'PNG', 0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight()) //Fondo

    doc.addImage(logoImg, 'PNG', 112, pdfY, 77, 60)
    pdfY += 60
    doc.text(`COMITÉ DE AGUA POTABLE RURAL`, pdfX, pdfY + 23, 'center')
    doc.text(`Y SERVICIOS SANITARIOS LOS CRISTALES`, pdfX, pdfY + 36, 'center')
    doc.text(`Los Cristales S/N`, pdfX, pdfY + 49, 'center')


    pdfY = 35
    doc.setDrawColor(249, 51, 6)
    doc.setLineWidth(3)
    doc.line(pdfX + 209, pdfY - 10, pdfX + 411, pdfY - 10)//Línea Superior
    doc.line(pdfX + 209, pdfY + 60, pdfX + 411, pdfY + 60)//Línea Inferior
    doc.line(pdfX + 210, pdfY - 10, pdfX + 210, pdfY + 60)//Línea Izquierda
    doc.line(pdfX + 410, pdfY - 10, pdfX + 410, pdfY + 60)//Línea Derecha

    doc.setFontSize(13)
    doc.setTextColor(249, 51, 6)
    doc.text('R.U.T: 71.569.700-9', pdfX + 310, pdfY + 5, 'center')
    doc.text(docName1, pdfX + 310, pdfY + 20, 'center')
    doc.text(docName2, pdfX + 310, pdfY + 35, 'center')

    doc.setFontType('bold')
    if(agreement.number){
        doc.text('N° ' + agreement.number, pdfX + 310, pdfY + 50, 'center')
    }else{
        doc.text('N° -', pdfX + 310, pdfY + 50, 'center')
    }
    doc.setFontSize(11)
    doc.text('S.I.I. - CURICO', pdfX + 310, pdfY + 75, 'center')

    doc.setDrawColor(0, 0, 0)
    doc.setTextColor(0, 0, 0)

    doc.setFontSize(10)
    doc.setFontType('normal')
    doc.text('Fecha Emisión ', pdfX + 220, pdfY + 100)
    doc.text('Mes de Pago ', pdfX + 220, pdfY + 113)

    doc.setFontType('bold')
    doc.text(moment(agreement.date).utc().format('DD / MM / YYYY'), pdfX + 300, pdfY + 100)
    doc.text(getMonthString(agreement.lectures.month) + ' / ' + agreement.lectures.year, pdfX + 300, pdfY + 113)


    pdfX = 30
    pdfY += 120
    doc.setFontSize(12)
    doc.text('SOCIO N° ' + member.number, pdfX, pdfY)
    doc.text('R.U.T ' + member.rut, pdfX, pdfY + 13)
    doc.setFontSize(13)
    doc.text(memberName.toUpperCase(), pdfX, pdfY + 28)




    pdfY += 60


    //////////////TABLA CONSUMOS//////////////
    doc.setFillColor(26, 117, 187)
    doc.rect(pdfX - 3, pdfY - 10, 265, 13, 'F')

    doc.setFontSize(9)
    doc.setFontType('bold')
    doc.setTextColor(255, 255, 255)
    doc.text('Su consumo en m3 de este mes (1m3 = 1.000 lts de agua)', pdfX, pdfY)

    doc.setFontSize(10)
    doc.setFontType('normal')
    doc.setTextColor(0, 0, 0)
    doc.text('Lectura Actual ' + moment(agreement.date).format('DD/MM/YYYY'), pdfX, pdfY + 20)
    doc.text('Lectura Anterior ' + moment(agreement.date).format('DD/MM/YYYY'), pdfX, pdfY + 33)
    doc.text('Límite Sobreconsumo (m3)', pdfX, pdfY + 46)
    doc.text('Consumo Calculado', pdfX, pdfY + 59)
    doc.setFontType('bold')
    doc.text('Consumo Facturado', pdfX, pdfY + 85)


    doc.setFontSize(10)
    doc.setFontType('normal')

    doc.text(dot_separators(agreement.lectureActual), pdfX + 250, pdfY + 20, 'right')
    doc.text(dot_separators(agreement.lectureLast), pdfX + 250, pdfY + 33, 'right')
    doc.text(dot_separators(parameters.consumptionLimit), pdfX + 250, pdfY + 46, 'right')
    doc.text(dot_separators(agreement.lectureResult), pdfX + 250, pdfY + 59, 'right')
    doc.setFontType('bold')
    doc.text(dot_separators(agreement.lectureResult), pdfX + 250, pdfY + 85, 'right') //Consultar diferencia facturado vs calculado



    //////////////TABLA VALORES//////////////
    pdfX += 300

    doc.setFillColor(26, 117, 187)
    doc.rect(pdfX - 3, pdfY - 10, 265, 13, 'F')

    doc.setFontSize(9)
    doc.setFontType('bold')
    doc.setTextColor(255, 255, 255)
    doc.text('Detalle de consumos y servicios en pesos de este mes', pdfX, pdfY)

    doc.setFontSize(10)
    doc.setFontType('normal')
    doc.setTextColor(0, 0, 0)
    doc.text('Cargo Fijo', pdfX, pdfY + 20)
    doc.text('Consumo Agua Potable ', pdfX, pdfY + 33)
    let pdfYTemp = 0
    if (agreement.subsidyPercentage > 0) {
        pdfYTemp = 13
        doc.text('Subsidio (' + agreement.subsidyPercentage.toString() + '%)', pdfX, pdfY + 33 + pdfYTemp)
    }
    if (agreement.consumptionLimitTotal > 0) {
        pdfYTemp += 13
        doc.text('SobreConsumo', pdfX, pdfY + 33 + pdfYTemp)
    }
    
    doc.text('SubTotal Consumo Mes', pdfX, pdfY + 85)

    let index = 85 + 13
    if(agreement.services){
        for(let i=0; i<agreement.services.length; i++){
            if(agreement.services[i].services.type=='ALCANTARILLADO'){
                doc.text('Alcantarillado', pdfX, pdfY + index)
            }else{
                doc.text(agreement.services[i].services.name, pdfX, pdfY + index)
            }
            index += 13
        }
    }

    doc.text('Saldo Anterior', pdfX, pdfY + index)
    doc.setFontType('bold')
    doc.text('Monto Total', pdfX, pdfY + index + 26)


    doc.setFontSize(10)
    doc.setFontType('normal')

    doc.text(dot_separators(agreement.charge), pdfX + 250, pdfY + 20, 'right')
    doc.text(dot_separators(agreement.lectureResult * agreement.meterValue), pdfX + 250, pdfY + 33, 'right')

    pdfYTemp = 0
    if (agreement.subsidyPercentage > 0) {
        pdfYTemp = 13
        doc.text('-' + dot_separators(agreement.subsidyValue), pdfX + 250, pdfY + 33 + pdfYTemp, 'right')
    }
    if (agreement.consumptionLimitTotal > 0) {
        pdfYTemp += 13
        doc.text(dot_separators(agreement.consumptionLimitTotal), pdfX + 250, pdfY + 33 + pdfYTemp, 'right')
    }


    doc.text(dot_separators(agreement.charge + agreement.consumption), pdfX + 250, pdfY + 85, 'right')
    
    index = 85 + 13
    if(agreement.services){
        for(let i=0; i<agreement.services.length; i++){
            doc.text(dot_separators(agreement.services[i].value), pdfX + 250, pdfY + index, 'right')
            index += 13
        }
    }

    doc.text(dot_separators(agreement.agreementDebt), pdfX + 250, pdfY + index, 'right')
    doc.setFontType('bold')
    doc.text(dot_separators(agreement.agreementTotal), pdfX + 250, pdfY + index + 26, 'right')


    //////TOTALES Y CÓDIGO SII//////
    pdfY += 50
    doc.setFontSize(12)

    doc.setFillColor(23, 162, 184)
    doc.rect(pdfX - 3, pdfY + 137, 260, 35, 'F')

    doc.setTextColor(255, 255, 255)
    doc.text('TOTAL A PAGAR', pdfX, pdfY + 150)
    doc.text('FECHA VENCIMIENTO', pdfX, pdfY + 165)
    doc.text('$ ' + dot_separators(agreement.agreementTotal), pdfX + 250, pdfY + 150, 'right')
    doc.text(moment(agreement.dateExpire).utc().format('DD/MM/YYYY'), pdfX + 250, pdfY + 165, 'right')


    doc.setFontSize(8)
    doc.setFontType('normal')
    doc.setTextColor(0, 0, 0)
    let net = parseInt(agreement.agreementTotal / 1.19)
    let iva = agreement.agreementTotal - net
    //doc.text('Datos Tributarios: ', pdfX + 100, pdfY + 180)
    //doc.text('Neto ', pdfX + 190, pdfY + 180)
    //doc.text('IVA ', pdfX + 190, pdfY + 190)
    //doc.text(dot_separators(net), pdfX + 250, pdfY + 180, 'right')
    //doc.text(dot_separators(iva), pdfX + 250, pdfY + 190, 'right')

    if(docType=='preview'){
        doc.addImage(test2DImg, 'PNG', pdfX, pdfY + 200, 260, 106)
    }else if(docType=='pdf'){
        doc.setFillColor(255, 255, 255)
        doc.rect(pdfX, pdfY + 200, 260, 106, 'F')
        if(agreement.seal){
            doc.addImage(agreement.seal, 'PNG', pdfX, pdfY + 200, 260, 106)

            doc.text('Timbre Electrónico S.I.I. ', pdfX + 130, pdfY + 320, 'center')
            doc.text('Res. 80 del 22-08-2014 Verifique Documento: www.sii.cl', pdfX + 130, pdfY + 330, 'center')
        }
    }


    ///////GRÁFICO CONSUMOS///////

    pdfX = 30
    pdfY += 150
    doc.setFontSize(9)
    doc.setFontType('bold')
    doc.setTextColor(0, 0, 0)
    doc.text('Su consumo en m3 durante los últimos 13 meses fue:', pdfX, pdfY)


    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(1)
    pdfX += 10
    doc.line(pdfX, pdfY + 10, pdfX, pdfY + 120)//Línea Izquierda
    doc.line(pdfX, pdfY + 120, pdfX + 250, pdfY + 120)//Línea Inferior

    //DEFINICIÓN DE LECTURAS A MOSTRAR (MÁXIMO 13)
    let lastAgreements = [], flag = 0, maxValue = 0
    for (let j = 0; j < lectures.length; j++) {
        if (lectures[j]._id == agreement.lectures._id) {
            flag++
        }

        if (flag > 0 && flag <= 13) {
            lastAgreements.push(lectures[j].agreement)
            flag++

            if (lectures[j].agreement.lectureResult > maxValue) {
                maxValue = lectures[j].agreement.lectureResult
            }
        }
    }

    let meterPoints = 100 / maxValue //Puntos en PDF por mt3

    pdfY += 25
    doc.setFontSize(7)
    doc.setFontType('normal')

    doc.setDrawColor(199, 199, 199)

    if (maxValue < 5) {
        pdfY -= 5
        //Línea límite según lectura máxima
        doc.text(maxValue.toString(), pdfX - 2, pdfY, 'right')
        doc.line(pdfX, pdfY, pdfX + 250, pdfY)

        if (maxValue == 4) {
            doc.text('3', pdfX - 2, (pdfY + 2) + 25, 'right')
            doc.text('2', pdfX - 2, (pdfY + 2) + 50, 'right')
            doc.text('1', pdfX - 2, (pdfY + 2) + 77, 'right')
            doc.line(pdfX, pdfY + 25, pdfX + 250, pdfY + 25)
            doc.line(pdfX, pdfY + 50, pdfX + 250, pdfY + 50)
            doc.line(pdfX, pdfY + 75, pdfX + 250, pdfY + 75)

        } else if (maxValue == 3) {
            doc.text('2', pdfX - 2, pdfY + 34, 'right')
            doc.text('1', pdfX - 2, pdfY + 69, 'right')
            doc.line(pdfX, pdfY + 34, pdfX + 250, pdfY + 34)
            doc.line(pdfX, pdfY + 69, pdfX + 250, pdfY + 69)
        } else if (maxValue == 2) {
            doc.text('1', pdfX - 2, pdfY + 51, 'right')
            doc.line(pdfX, pdfY + 51, pdfX + 250, pdfY + 51)
        }

        pdfY += 102

    } else if (maxValue % 4 == 0) {

        //Línea límite según lectura máxima
        doc.text(maxValue.toString(), pdfX - 2, pdfY, 'right')
        doc.line(pdfX, pdfY, pdfX + 250, pdfY)

        let min = parseInt(maxValue / 4)
        doc.text((min * 3).toString(), pdfX - 2, pdfY + (min * meterPoints), 'right')
        doc.text((min * 2).toString(), pdfX - 2, pdfY + (min * 2 * meterPoints), 'right')
        doc.text((min).toString(), pdfX - 2, pdfY + (min * 3 * meterPoints), 'right')

        doc.line(pdfX, pdfY + (min * meterPoints), pdfX + 250, pdfY + (min * meterPoints))
        doc.line(pdfX, pdfY + (min * 2 * meterPoints), pdfX + 250, pdfY + (min * 2 * meterPoints))
        doc.line(pdfX, pdfY + (min * 3 * meterPoints), pdfX + 250, pdfY + (min * 3 * meterPoints))

        pdfY += 102

    } else {
        pdfY -= 5
        //Línea límite según lectura máxima
        doc.text(maxValue.toString(), pdfX - 2, pdfY + (102 - (maxValue * meterPoints)), 'right')
        doc.line(pdfX, pdfY + (100 - (maxValue * meterPoints)), pdfX + 250, pdfY + (100 - (maxValue * meterPoints)))

        let min = parseInt(maxValue / 4)

        pdfY += 102

        doc.text((min * 4).toString(), pdfX - 2, (pdfY + 2) - (min * 4 * meterPoints), 'right')
        doc.text((min * 3).toString(), pdfX - 2, (pdfY + 2) - (min * 3 * meterPoints), 'right')
        doc.text((min * 2).toString(), pdfX - 2, (pdfY + 2) - (min * 2 * meterPoints), 'right')
        doc.text((min).toString(), pdfX - 2, (pdfY + 2) - (min * meterPoints), 'right')

        doc.line(pdfX, pdfY - (min * meterPoints), pdfX + 250, pdfY - (min * meterPoints))//Línea Inferior
        doc.line(pdfX, pdfY - (min * 2 * meterPoints), pdfX + 250, pdfY - (min * 2 * meterPoints))//Línea Inferior
        doc.line(pdfX, pdfY - (min * 3 * meterPoints), pdfX + 250, pdfY - (min * 3 * meterPoints))//Línea Inferior
        doc.line(pdfX, pdfY - (min * 4 * meterPoints), pdfX + 250, pdfY - (min * 4 * meterPoints))//Línea Inferior
    }

    doc.text('0', pdfX - 2, pdfY, 'right')

    //GRÁFICO DE CONSUMOS
    pdfY = 435
    pdfX = 263
    //for(let i=lastAgreements.length; i>0; i--){
    //for(let i=13; i>0; i--){ Max month test
    doc.setFontSize(8)




    for (let i = 0; i < lastAgreements.length; i++) {

        if (i == 0) {
            doc.setFillColor(23, 162, 184)
        } else {
            doc.setFillColor(82, 82, 82)
        }

        let offset = 100 - (lastAgreements[i].lectureResult * meterPoints) //Determina posición inicial respecto al máximo del gráfico

        doc.rect(pdfX, pdfY + offset, 11, 99 - offset, 'F')
        //Posición X (descendente)
        //Posición Y suma offset según lectura
        //11 = Ancho ~ 99 - offset = Largo
        doc.text(lastAgreements[i].lectureResult.toString(), pdfX + 5, pdfY + offset - 5, 'center')
        doc.text(getMonthShortString(lastAgreements[i].lectures.month), pdfX + 7, pdfY + 108, 'center')
        pdfX -= 18
    }

    pdfX = 30
    doc.setFillColor(26, 117, 187)
    doc.rect(pdfX - 3, doc.internal.pageSize.getHeight() - 60, doc.internal.pageSize.getWidth() - 57, 17, 'F')

    doc.setFontSize(10)
    doc.setFontType('bold')
    doc.setTextColor(255, 255, 255)
    doc.text('N° Teléfono oficina Comité: ' + parameters.phone + ' - Correo electrónico:  ' + parameters.email, pdfX, doc.internal.pageSize.getHeight() - 48)

    //doc.autoPrint()
    window.open(doc.output('bloburl'), '_blank')
    //doc.save(`Nota de venta ${internals.newSale.number}.pdf`)
}

async function showSIIPDF(token) {
    loadingHandler('start')
    
    let parametersData = await axios.get('/api/parameters')
    let parameters = parametersData.data

    var settings = {
        "url": "https://dev-api.haulmer.com/v2/dte/document/"+token+"/pdf",
        "method": "GET",
        "timeout": 0,
        "headers": {
          "apikey": parameters.apikey
        }
    }
      
    $.ajax(settings).fail( function( jqXHR, textStatus, errorThrown ) {
    
        console.log('ERROR', jqXHR.responseJSON.error.message)
        console.log('ERROR', jqXHR.responseJSON.error.details)

        loadingHandler('stop')

    }).done(function (response) {
        console.log(response)

        let pdfWindow = window.open("")
        pdfWindow.document.write("<iframe width='100%' height='100%' src='data:application/pdf;base64, " +encodeURI(response.pdf) + "'></iframe>")
        loadingHandler('stop')
    })

    
}

async function sendData(type,memberID,agreementID) {
    console.log(type,memberID,agreementID) 

    let generateDTE = await Swal.fire({
        title: '¿Está seguro de generar documento?',
        customClass: 'swal-wide',
        html: ``,
        showCloseButton: true,
        showCancelButton: true,
        showConfirmButton: true,
        focusConfirm: false,
        confirmButtonText: 'Aceptar',
        cancelButtonText: 'Cancelar'
    })

    if (generateDTE.value) {
        
        loadingHandler('start')
        
        let memberData = await axios.post('/api/memberSingle', {id: memberID})
        let member = memberData.data

        let agreementData = await axios.post('/api/agreementSingle', {id: agreementID})
        let agreement = agreementData.data

        let parametersData = await axios.get('/api/parameters')
        let parameters = parametersData.data

        let dteType = 34 //Factura exenta electrónica
        let name = '', category = ''
        let document = ''

        let detail = []
        for(let i=0; i<agreement.services.length; i++){
            detail.push({
                NroLinDet: i+1,
                NmbItem: agreement.services[i].services.name,
                QtyItem: 1,
                PrcItem: agreement.services[i].value,
                MontoItem: agreement.services[i].value,
                IndExe: 1 //1=exento o afecto / 2=no facturable
            })
        }
        

        if(type=='personal'){

            dteType = 41 //Boleta exenta electrónica
            name = member.personal.name+' '+member.personal.lastname1+' '+member.personal.lastname2

            let Emisor = { //EMISOR DE PRUEBA
                RUTEmisor: "76795561-8",
                RznSocEmisor: "HAULMER SPA",
                GiroEmisor: "VENTA AL POR MENOR POR CORREO, POR INTERNET Y VIA TELEFONICA",
                DirOrigen: "ARTURO PRAT 527   CURICO",
                CmnaOrigen: "Curicó",
                CdgSIISucur: "81303347"
            }


            document = {
                response: ["TIMBRE","FOLIO"],
                dte: {
                    Encabezado: {
                        IdDoc:{
                            TipoDTE: dteType,
                            Folio: 0,
                            FchEmis: moment.utc(agreement.date).format('YYYY-MM-DD'),
                            IndServicio: "3", //1=Servicios periódicos, 2=Serv. periódicos domiciliarios
                        },
                        Emisor: Emisor,
                        Receptor:{
                            RUTRecep: member.rut.split('.').join(''),
                            RznSocRecep: name,
                            DirRecep: member.address.address,
                            CmnaRecep: parameters.committee.commune,
                            CiudadRecep: parameters.committee.city
                        },
                        Totales:{
                            MntExe: agreement.agreementTotal,
                            MntTotal: agreement.agreementTotal,
                            VlrPagar: agreement.agreementTotal
                        }
                    },
                    Detalle: detail
                }
            }


        }else{
            name = member.enterprise.fullName
            category = member.enterprise.category

            if(name==''){ //Sólo para efectos de TEST
                name = member.personal.name+' '+member.personal.lastname1+' '+member.personal.lastname2
                category = 'TEST'
            }

            //let net = parseInt(agreement.agreementTotal / 1.19)
            //let iva = agreement.agreementTotal - net

            /*let Emisor = {
                RUTEmisor: parameters.committee.rut.split('.').join(''),
                RznSoc: parameters.committee.name,
                GiroEmis: parameters.committee.category,
                Acteco: parameters.committee.acteco,
                DirOrigen: parameters.committee.address,
                CmnaOrigen: parameters.committee.commune,
                Telefono: parameters.committee.phone,
                CdgSIISucur: parameters.committee.siiCode
            }*/
            console.log(agreement)


            let Emisor = { //EMISOR DE PRUEBA
                RUTEmisor: "76795561-8",
                RznSoc: "HAULMER SPA",
                GiroEmis: "VENTA AL POR MENOR POR CORREO, POR INTERNET Y VIA TELEFONICA",
                Acteco: "479100",
                DirOrigen: "ARTURO PRAT 527   CURICO",
                CmnaOrigen: "Curicó",
                Telefono: "0 0",
                CdgSIISucur: "81303347"
            }

            document = {
                response: ["TIMBRE","FOLIO"],
                dte: {
                    Encabezado: {
                        IdDoc:{
                            TipoDTE: dteType,
                            Folio: 0,
                            FchEmis: moment.utc(agreement.date).format('YYYY-MM-DD'),
                            TpoTranCompra:"1",
                            TpoTranVenta:"1",
                            FmaPago:"2"
                        },
                        Emisor: Emisor,
                        Receptor:{
                            RUTRecep: member.rut.split('.').join(''),
                            RznSocRecep: name,
                            GiroRecep: category,
                            CdgIntRecep: member.number,
                            DirRecep: member.address.address,
                            CmnaRecep: parameters.committee.commune,
                        },
                        Totales:{
                            //MntNeto: net,
                            //TasaIVA: "19",
                            //IVA: iva,
                            MntExe: agreement.agreementTotal,
                            MntTotal: agreement.agreementTotal,
                            MontoPeriodo: agreement.agreementTotal, //Consultar si se separa monto adeudado anterior
                            VlrPagar: agreement.agreementTotal
                        }
                    },
                    Detalle: detail
                }
            }
        }

        console.log(JSON.stringify(document))
        var settings = {
            "url": "https://dev-api.haulmer.com/v2/dte/document",
            "method": "POST",
            "timeout": 0,
            "headers": {
            "apikey": parameters.apikey
            },
            "data": JSON.stringify(document)
        };  
        
        $.ajax(settings).fail( function( jqXHR, textStatus, errorThrown ) {
        
            console.log('ERROR', jqXHR.responseJSON.error.message)
            console.log('ERROR', jqXHR.responseJSON.error.details)
            loadingHandler('stop')

        }).done(async function (response) {
            
            console.log(response)
            
            let dteData = {
                id: agreementID,
                type: dteType,
                number: response.FOLIO,
                seal: response.TIMBRE,
                token: response.TOKEN
            }

            let setDTEAgreement = await axios.post('/api/agreementUpdateDTE', dteData)
            loadingHandler('stop')

            toastr.success('Documento generado correctamente')


            loadAgreements(member)
            
        })
    }


}

