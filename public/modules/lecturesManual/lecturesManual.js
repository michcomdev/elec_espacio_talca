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

let members = []
let sectors = {}
let serviceList = ''
let yearSelected = 0
let monthSelected = 0
let monthNameSelected = ''
let sectorSelected = 0
let sectorNameSelected = ''

let parameters

$(document).ready(async function () {
    $("#changeOrder").on('click', async function () {
        if ($.fn.DataTable.isDataTable('#tableMembers')) {
            
            if($(this).hasClass('btn-primary')){
                $(this).removeClass('btn-primary').addClass('btn-warning')
                $(this).html('<i class="fas fa-sort"></i> Cancelar')
                $('.searchClass').attr('disabled','disabled')
            }else{
                $(this).removeClass('btn-warning').addClass('btn-primary')
                $(this).html('<i class="fas fa-sort"></i> Modificar Orden')
                $('.searchClass').removeAttr('disabled')
            }
            internals.members.table.column(5).visible(!internals.members.table.column(5).visible())
            internals.members.table.column(6).visible(!internals.members.table.column(6).visible())
            internals.members.table.column(7).visible(!internals.members.table.column(7).visible())
            internals.members.table.column(8).visible(!internals.members.table.column(8).visible())
            internals.members.table.column(9).visible(!internals.members.table.column(9).visible())
            internals.members.table.column(10).visible(!internals.members.table.column(10).visible())
            internals.members.table.column(11).visible(!internals.members.table.column(11).visible())
            internals.members.table.column(12).visible(!internals.members.table.column(11).visible())
        }else{
            toastr.warning('No ha filtrado planilla ')
        }
    })

    getParameters()
})

async function getParameters() {

    let firstYear = 2021
    for (let i = firstYear; i <= moment().format('YYYY'); i++) {
        $("#searchYear").append(`<option value="${i}">${i}</option>`)
    }
    
    let setYear = moment().format('YYYY')
    let setMonth = moment().format('MM')

    if(moment().day()<20){
        if(setMonth=='01'){
            setYear = moment().add(-1,'y').format('YYYY')
            setMonth = '12'
        }else{
            setMonth = moment().add(-1,'M').format('MM')
        }
    }

    $("#searchYear").val(setYear)
    $("#searchMonth").val(setMonth)

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

    let servicesData = await axios.post('/api/servicesByFilter', {invoice: 'INGRESO'})
    let services = servicesData.data

    serviceList = `<tr><td>
                        <select class="form-control form-control-sm form-select" onchange="serviceValue(this)"><option value="0" data-value="0">Seleccione</option>`
    for(let i=0; i<services.length; i++){
        serviceList += `<option value="${services[i]._id}" data-value="${services[i].value}">${services[i].name}</option>`
    }
    serviceList += `</select></td><td>
                        <input type="text" class="form-control form-control-sm serviceValue" style="text-align: right" value="0"/>
                    </td></tr>`

}

function chargeMembersTable() {
    try {
        if ($.fn.DataTable.isDataTable('#tableMembers')) {
            internals.members.table.clear().destroy()
        }

        /*let order = [0, 'asc']

        if($("#searchOrder").val()==2){
            order = [1, 'asc']
        }else if($("#searchOrder").val()==3){
            //order = [3, 'asc']
        }else if($("#searchOrder").val()==4){
            order = [3, 'asc']
        }else if($("#searchOrder").val()==5){
            order = [4, 'asc']
        }*/

        if($("#searchOrder").val()==1){
            $("#changeOrder").removeAttr('disabled')
        }else{
            $("#changeOrder").attr('disabled','disabled')
        }

        internals.members.table = $('#tableMembers')
            .DataTable({
                dom: 'Bfrtip',
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
                iDisplayLength: -1,
                tabIndex: -1,
                oLanguage: {
                    sSearch: 'buscar:'
                },
                lengthMenu: [[50, 100, 500, -1], [50, 100, 500, 'Todos los registros']],
                language: {
                    url: spanishDataTableLang
                },
                responsive: true,
                columnDefs: [
                    { 
                        targets: [0, 1, 4, 5, 6, 7, 8, 9, 10, 11, 12], 
                        className: 'dt-center' 
                    },{
                        targets: [ 11, 12 ],
                        visible: false
                    }
                ],
                //order: [order],
                ordering: false,
                rowCallback: function (row, data) {
                    //$(row).find('td:eq(1)').html(moment.utc(data.date).format('DD/MM/YYYY'))
                    //$(row).find('td:eq(4)').html(dot_separators(data.lastLecture))
                    //$(row).find('td:eq(5)').html(dot_separators(data.lastLecture))
                    // $('td', row).css('background-color', 'White');
                },
                columns: [
                    { data: 'order' },
                    { data: 'number' },
                    { data: 'typeString' },
                    { data: 'name' },
                    { data: 'address' },
                    { data: 'lastLecture' },
                    { data: 'lecture' },
                    { data: 'lectureNew' },
                    { data: 'value' },
                    { data: 'fine' },
                    { data: 'date' },
                    { data: 'up' },
                    { data: 'down' }                    
                ],
                initComplete: function (settings, json) {
                    getMembers()
                },
                draw: function (){
                    $(".lectureValue").each(function() {
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

                }
            })

        $('#tableMembers tbody').off("click")

       
    } catch (error) {
        console.log(error)
    }

}

async function getMembers() {

    let query = {
        sector: sectorSelected, 
        year: yearSelected, 
        month: monthSelected,
        order: $("#searchOrder").val()
    }

    let lecturesData = await axios.post('api/lecturesSectorMembersManual', query)
    members = lecturesData.data
    let order = 1, rowIndex = 0

    if (lecturesData.data.length > 0) {
        let formatData = lecturesData.data.map(el => {

            console.log(el)
            
            //el.datetime = moment(el.datetime).format('DD/MM/YYYY HH:mm')
            if (el.type == 'personal') {
                el.typeString = 'PERSONA'
                if($("#searchOrder").val()==3){
                    el.name = el.personal.lastname1 + ' ' + el.personal.lastname2 + ' ' + el.personal.name
                }else{
                    el.name = el.personal.name + ' ' + el.personal.lastname1 + ' ' + el.personal.lastname2
                }
            } else {
                el.typeString = 'EMPRESA'
                el.name = el.enterprise.name
            }
            el.address = el.address.address
            
            el.lastLecture = 0
            el.lecture = `<input id="lecture-${el._id}" onkeyup="calculateValue('${el._id}')" class="form-control form-control-sm lectureValue" style="text-align: center" value="0"></input>`
            el.value = 0
            el.date = ''
            el.lectureNew = `<i class="fas fa-plus" onclick="addLectureNew(this,'${el._id}')"></i>`

            if(el.lectureLast){
                el.lastLecture = el.lectureLast.logs[el.lectureLast.logs.length-1].lecture
                if(el.lectureLast.logs[el.lectureLast.logs.length-1].lectureNewEnd){
                    el.lastLecture = el.lectureLast.logs[el.lectureLast.logs.length-1].lectureNewEnd
                }
            }
            if(el.lectures){
                el.lecture = `<input id="lecture-${el._id}" onkeyup="calculateValue('${el._id}')" class="form-control form-control-sm lectureValue" style="text-align: center" value="${dot_separators(el.lectures.logs[el.lectures.logs.length-1].lecture)}"></input>`
                el.date = moment(el.lectures.logs[el.lectures.logs.length-1].date).utc().format('DD/MM/YYYY HH:mm')
                el.value = dot_separators(el.lectures.logs[el.lectures.logs.length-1].lecture - el.lastLecture)

                console.log(el.lectures.logs[el.lectures.logs.length-1].lectureNewEnd)

                if(el.lectures.logs[el.lectures.logs.length-1].lectureNewEnd){
                    el.lectureNew = `<input id="lectureNewStart-${el._id}" onkeyup="calculateValue('${el._id}')" class="form-control form-control-sm lectureValue" style="text-align: center; width: 40%; display: inline-block" value="${dot_separators(el.lectures.logs[el.lectures.logs.length-1].lectureNewStart)}"></input>
                                    <input id="lectureNewEnd-${el._id}" onkeyup="calculateValue('${el._id}')" class="form-control form-control-sm lectureValue" style="text-align: center; width: 40%; display: inline-block" value="${dot_separators(el.lectures.logs[el.lectures.logs.length-1].lectureNewEnd)}"></input>
                                    <i class="fas fa-times" style="width: 20%; display: inline-block" onclick="removeLectureNew(this,'${el._id}')"></i>`
                }else if(el.lectures.logs[el.lectures.logs.length-1].lectureNewEnd==0){
                    el.lectureNew = `<input id="lectureNewStart-${el._id}" onkeyup="calculateValue('${el._id}')" class="form-control form-control-sm lectureValue" style="text-align: center; width: 40%; display: inline-block" value="${dot_separators(el.lectures.logs[el.lectures.logs.length-1].lectureNewStart)}"></input>
                                    <input id="lectureNewEnd-${el._id}" onkeyup="calculateValue('${el._id}')" class="form-control form-control-sm lectureValue" style="text-align: center; width: 40%; display: inline-block" value="${dot_separators(el.lectures.logs[el.lectures.logs.length-1].lectureNewEnd)}"></input>
                                    <i class="fas fa-times" style="width: 20%; display: inline-block" onclick="removeLectureNew(this,'${el._id}')"></i>`
                }
            }

            el.date += `<i class="fas fa-times" title="Eliminar registro" style="width: 20%; display: inline-block" onclick="removeLecture(this,'${el._id}',${$("#searchYear").val()},${$("#searchMonth").val()})"></i>`

            //el.lastLecture = `<span id="lectureLast-${el._id}">${el.lastLecture}</span>`
            el.lastLecture = `<span id="lectureLast-${el._id}">${dot_separators(el.lastLecture)}</span>`
            //el.lastLecture = `<span id="lectureLast">${el.lastLecture}</span>`
            el.value = `<span id="lectureValue-${el._id}">${el.value}</span>`

            if(el.fine){
                el.fine = `<input id="lectureFine-${el._id}" type="checkbox" checked />`
            }else{
                el.fine = `<input id="lectureFine-${el._id}" type="checkbox" />`
            }

            el.order = ''
            el.up = ''
            el.down = ''
            if($("#searchOrder").val()==1){

                if(order==1){
                    el.up = ''
                }else{
                    el.up = `<i class="fas fa-2x fa-arrow-alt-circle-up hoverUp" onclick="updateOrder('up',${rowIndex},${order},${lecturesData.data.length})"></i>`
                }
                if(order==lecturesData.data.length){
                    el.down = ''
                }else{
                    el.down = `<i class="fas fa-2x fa-arrow-alt-circle-down hoverDown" onclick="updateOrder('down',${rowIndex},${order},${lecturesData.data.length})"></i>`
                }

                el.order = order
                order++
                rowIndex++
            }

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
    if($("#searchSector").val()!=0){
        yearSelected = $("#searchYear").val()
        monthSelected = $("#searchMonth").val()
        sectorSelected = $("#searchSector").val()
        monthNameSelected = $("#searchMonth option:selected").text()
        sectorNameSelected = $("#searchSector option:selected").text()
        chargeMembersTable()
    }else{
        toastr.warning('Debe seleccionar un sector')
    }
})


$('#saveLectures').on('click', async function () {

    if (members.length==0) {
        toastr.warning('No ha filtrado planilla')
        return
    }
    
    let saveLectures = await Swal.fire({
        title: '¿Está seguro de almacenar lecturas?',
        customClass: 'swal-wide',
        html: `Sector: ${sectorNameSelected}<br/>Año: ${yearSelected}<br/>Mes: ${monthNameSelected}`,
        showCloseButton: true,
        showCancelButton: true,
        showConfirmButton: true,
        focusConfirm: false,
        confirmButtonText: 'Aceptar',
        cancelButtonText: 'Cancelar'
    })

    if (saveLectures.value) {

        let array = {
            users: userCredentials._id,
            date: moment().format('YYYY-MM-DD[T]HH:mm:ss.SSS[Z]'),
            year: yearSelected, //MODIFICAR
            month: monthSelected, //MODIFICAR
            lectures: [],
            members: []
        }
        
        for(let i=0; i < members.length; i++){

            //Gris por defecto: rgba(0, 0, 0, 0.1)
            //Rojo: rgb(0, 0, 0, 0.1)
            //Azul: rgb(69, 130, 236)
            let lectureInputNew = false
            if($("#lectureNewStart-"+members[i]._id).length>0){
                lectureInputNew = true
            }

            if($("#lecture-"+members[i]._id).css('border') == '1px solid rgb(231, 76, 60)'){
                i = members.length
                toastr.error('Debe corregir los registros marcados en rojo antes de almacenar')

            }else if(lectureInputNew){ //En caso que haya medidor nuevo
                if($("#lectureNewStart-"+members[i]._id).css('border') == '1px solid rgb(231, 76, 60)'){
                    i = members.length
                    toastr.error('Debe corregir los registros marcados en rojo antes de almacenar')
                }else{
                    if($("#lecture-"+members[i]._id).css('border') == '1px solid rgb(69, 130, 236)' || $("#lectureNewStart-"+members[i]._id).css('border') == '1px solid rgb(69, 130, 236)'){
                        array.lectures.push({
                            member: members[i]._id,
                            lecture: parseInt(replaceAll($("#lecture-"+members[i]._id).val(), '.', '').replace(' ', '')),
                            lectureNewStart: parseInt(replaceAll($("#lectureNewStart-"+members[i]._id).val(), '.', '').replace(' ', '')),
                            lectureNewEnd: parseInt(replaceAll($("#lectureNewEnd-"+members[i]._id).val(), '.', '').replace(' ', '')),
                            fine: $(`#lectureFine-${members[i]._id}`).prop('checked')
                        })
                        array.members.push(members[i]._id)
                    }
                }

            }else if($("#lecture-"+members[i]._id).css('border') == '1px solid rgb(69, 130, 236)'){
                array.lectures.push({
                    member: members[i]._id,
                    lecture: parseInt(replaceAll($("#lecture-"+members[i]._id).val(), '.', '').replace(' ', '')),
                    fine: $(`#lectureFine-${members[i]._id}`).prop('checked')
                })
                array.members.push(members[i]._id)
            }else if(members[i].lectures){

                if(members[i].lectures.logs[members[i].lectures.logs.length-1].lectureNewStart !== undefined && !lectureInputNew){//Caso en que borren la lectura del medidor nuevo
                    array.lectures.push({
                        member: members[i]._id,
                        lecture: parseInt(replaceAll($("#lecture-"+members[i]._id).val(), '.', '').replace(' ', '')),
                        fine: $(`#lectureFine-${members[i]._id}`).prop('checked')
                    })
                    array.members.push(members[i]._id)
                }else if(members[i].fine!=$(`#lectureFine-${members[i]._id}`).prop('checked')){
                    array.lectures.push({
                        member: members[i]._id,
                        lecture: parseInt(replaceAll($("#lecture-"+members[i]._id).val(), '.', '').replace(' ', '')),
                        fine: $(`#lectureFine-${members[i]._id}`).prop('checked')
                    })
                    array.members.push(members[i]._id)
                }
            }

            if(i+1==members.length){
                console.log(array)
                
                if(array.lectures.length>0){
                    loadingHandler('start')
                    //ALMACENADO...
                    let saveLecture = await axios.post('/api/lectureSaveManual', array)
                    loadingHandler('stop')

                    console.log(saveLecture)
                    if(saveLecture.data=='OK'){
                        chargeMembersTable()
                        toastr.success('Almacenado correctamente')
                    }else{
                        toastr.warning('Ha ocurrido un error al almacenar, favor reintente o contacte al administrador')
                    }
                }else{
                    toastr.warning('No ha realizado cambios, se mantienen los datos actuales')
                }
            }
        }
    }

})

function calculateValue(member){
    
    let lectureLast = replaceAll($("#lectureLast-"+member).text(), '.', '')
    let lecture = 0
    let value = 0

    let lectureInput = replaceAll($("#lecture-"+member).val(), '.', '').replace(' ', '')

    let lectureInputNew = false
    let lectureInputNewValue = 0

    console.log($("#lectureNewStart-"+member).length)
    
    if($("#lectureNewStart-"+member).length>0){
        let lectureNewStart = replaceAll($("#lectureNewStart-"+member).val(), '.', '').replace(' ', '')
        let lectureNewEnd = replaceAll($("#lectureNewEnd-"+member).val(), '.', '').replace(' ', '')
        if($.isNumeric(lectureNewStart) && $.isNumeric(lectureNewEnd)){
            if(parseInt(lectureNewEnd)>=parseInt(lectureNewStart)){
                lectureInputNewValue = lectureNewEnd - lectureNewStart
                
                let memberData = members.find(x => x._id.toString() == member)
                if(memberData.lectures){
                    if(memberData.lectures.logs[memberData.lectures.logs.length-1].lectureNewStart==lectureNewStart){
                        $("#lectureNewStart-"+member).css('border', '')
                    }else{
                        $("#lectureNewStart-"+member).css('border', '1px solid #4582EC')
                    }

                    if(memberData.lectures.logs[memberData.lectures.logs.length-1].lectureNewEnd==lectureNewEnd){
                        $("#lectureNewEnd-"+member).css('border', '')
                    }else{
                        $("#lectureNewEnd-"+member).css('border', '1px solid #4582EC')
                    }

                }else{
                    $("#lectureNewStart-"+member).css('border', '1px solid #4582EC')
                    $("#lectureNewEnd-"+member).css('border', '1px solid #4582EC')
                }
            }else{
                $("#lectureNewStart-"+member).css('border', '1px solid #E74C3C')
                $("#lectureNewEnd-"+member).css('border', '1px solid #E74C3C')
            }
        }else{
            $("#lectureNewStart-"+member).css('border', '1px solid #E74C3C')
            $("#lectureNewEnd-"+member).css('border', '1px solid #E74C3C')
        }
        lectureInputNew = true
    }

    if($.isNumeric(lectureInput)){
        lecture = lectureInput

        if(parseInt(lecture)>=parseInt(lectureLast)){
            value = lecture - lectureLast
            if(lectureInputNew){
                value += lectureInputNewValue
            }

            let memberData = members.find(x => x._id.toString() == member)
            if(memberData.lectures){
                if(memberData.lectures.logs[memberData.lectures.logs.length-1].lecture==lectureInput){
                    $("#lecture-"+member).css('border', '')
                }else{
                    $("#lecture-"+member).css('border', '1px solid #4582EC')
                }
            }else{
                $("#lecture-"+member).css('border', '1px solid #4582EC')
            }

        }else{
            $("#lecture-"+member).css('border', '1px solid #E74C3C')
        }

    }else{
        $("#lecture-"+member).css('border', '1px solid #E74C3C')
    }

    $("#lectureValue-"+member).text(dot_separators(value))
}

$('#updateLectures').on('click', async function () {

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

    loadInvoices(member)

})

function addLectureNew(btn,id){
    $(btn).parent().html(`<input id="lectureNewStart-${id}" onkeyup="calculateValue('${id}')" class="form-control form-control-sm lectureValue" style="text-align: center; width: 40%; display: inline-block"></input>
                        <input id="lectureNewEnd-${id}" onkeyup="calculateValue('${id}')" class="form-control form-control-sm lectureValue" style="text-align: center; width: 40%; display: inline-block"></input>
                        <i class="fas fa-times" style="width: 20%; display: inline-block" onclick="removeLectureNew(this,'${id}')"></i>`)

}

function removeLectureNew(btn,id){
    $(btn).parent().html(`<i class="fas fa-plus" onclick="addLectureNew(this,'${id}')"></i>`)
    calculateValue(id)
}



async function printList() {

    let doc = new jsPDF('p', 'pt', 'letter')
    //let doc = new jsPDF('p', 'pt', [302, 451])

    let pdfX = 30
    let pdfY = 20
    let page = '1'

    doc.setFontSize(24)
    doc.addImage(logoWallImg, 'PNG', 0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight()) //Fondo

    doc.addImage(logoImg, 'PNG', 30, pdfY, 77, 60)
    pdfY += 20
    doc.text(`PLANILLA DE TOMA DE ESTADO`, doc.internal.pageSize.getWidth() / 2, pdfY, 'center')

    doc.setFontSize(10)
    doc.text(`Mes:`, pdfX + 90 , pdfY + 20)
    doc.text(`Año:`, pdfX + 90, pdfY + 33)
    doc.text(`Sector: `, pdfX + 90, pdfY + 46)
    doc.text($("#searchMonth option:selected").text(), pdfX + 140 , pdfY + 20)
    doc.text($("#searchYear option:selected").text(), pdfX + 140, pdfY + 33)
    doc.text($("#searchSector option:selected").text(), pdfX + 140, pdfY + 46)
    doc.text(moment().utc().format('DD-MM-YYYY'), doc.internal.pageSize.getWidth() - 40, pdfY + 20, 'right')
    doc.text(page, doc.internal.pageSize.getWidth() - 40, pdfY + 33, 'right')

    pdfY += 50

    let tableColumns = ['Registro', 'Socio', 'Dirección', 'L. Anterior','L. Actual', 'Observación']
    let tableRows = []

    console.log(members)
    
    for(let i=0; i < members.length; i++){

        let memberName = ''

        if (members[i].type == 'personal') {
            if($("#searchOrder").val()==3){
                memberName = members[i].personal.lastname1 + ' ' + members[i].personal.lastname2 + ' ' + members[i].personal.name
            }else{
                memberName = members[i].personal.name + ' ' + members[i].personal.lastname1 + ' ' + members[i].personal.lastname2
            }
            
        } else {
            memberName = members[i].enterprise.name
        }

        let lastLecture = 0
        if(members[i].lectureLast){
            lastLecture = dot_separators(members[i].lectureLast.logs[members[i].lectureLast.logs.length-1].lecture)
        }
        tableRows.push([members[i].number, memberName, members[i].address, lastLecture, '', ''])
    }
    

    doc.autoTable(tableColumns, tableRows, {
        /*createdCell: function (cell, data) {
            cell.styles.fillColor = 'rgb(107,165,57)'
            cell.styles.textColor = '#FFFFFF'
            cell.styles.fontStyle = 'bold'
            tableFinal = data.table
        },*/
        theme: 'grid',
        headerStyles: {lineWidth: 0.1, lineColor: [0, 0, 0]},
        bodyStyles: {lineColor: [0, 0, 0]},
        columnStyles:{
            0: {halign:'center'},
            3: {halign:'right'}
        },
        styles: {
            fontSize: 8,
            /*fillColor: 'rgb(107,165,57)',
            textColor: '#000000',
            halign: 'center'*/
        },
        margin: {
            top: pdfY + 5
        }
    })


    //doc.autoPrint()
    window.open(doc.output('bloburl'), '_blank')
    //doc.save(`Nota de venta ${internals.newSale.number}.pdf`)
}

async function updateOrder(type, row, actual, max){

    if(type=='up' && actual==1){
        toastr.warning('No puede subir más a este socio')
        return
    }else if(type=='down' && actual==max){
        toastr.warning('No puede bajar más a este socio')
        return
    }

    if(type=='up'){

        let selectedRow = internals.members.table.row(row).data()
        let affectedRow = internals.members.table.row(row-1).data()

        selectedRow.order--
        if(selectedRow.order==1){
            selectedRow.up = ''
        }else{
            selectedRow.up = `<i class="fas fa-2x fa-arrow-alt-circle-up hoverUp" onclick="updateOrder('up',${row-1},${selectedRow.order},${max})"></i>`
        }
        if(selectedRow.order==max){
            selectedRow.down = ''
        }else{
            selectedRow.down = `<i class="fas fa-2x fa-arrow-alt-circle-down hoverDown" onclick="updateOrder('down',${row-1},${selectedRow.order},${max})"></i>`
        }
        internals.members.table.row(row-1).data(selectedRow).draw()
       
        await axios.post('/api/memberOrderUpdate', { id: selectedRow._id, orderIndex: selectedRow.order})

        affectedRow.order++
        if(affectedRow.order==1){
            affectedRow.up = ''
        }else{
            affectedRow.up = `<i class="fas fa-2x fa-arrow-alt-circle-up hoverUp" onclick="updateOrder('up',${row},${affectedRow.order},${max})"></i>`
        }
        if(affectedRow.order==max){
            affectedRow.down = ''
        }else{
            affectedRow.down = `<i class="fas fa-2x fa-arrow-alt-circle-down hoverDown" onclick="updateOrder('down',${row},${affectedRow.order},${max})"></i>`
        }
        internals.members.table.row(row).data(affectedRow).draw()

        await axios.post('/api/memberOrderUpdate', { id: affectedRow._id, orderIndex: affectedRow.order})
        
    }else{

        let selectedRow = internals.members.table.row(row).data()
        let affectedRow = internals.members.table.row(row+1).data()

        selectedRow.order++
        if(selectedRow.order==1){
            selectedRow.up = ''
        }else{    
            selectedRow.up = `<i class="fas fa-2x fa-arrow-alt-circle-up hoverUp" onclick="updateOrder('up',${row+1},${selectedRow.order},${max})"></i>`
        }
        if(selectedRow.order==max){
            selectedRow.down = ''
        }else{    
            selectedRow.down = `<i class="fas fa-2x fa-arrow-alt-circle-down hoverDown" onclick="updateOrder('down',${row+1},${selectedRow.order},${max})"></i>`
        }
        internals.members.table.row(row+1).data(selectedRow).draw()
       
        await axios.post('/api/memberOrderUpdate', { id: selectedRow._id, orderIndex: selectedRow.order})

        affectedRow.order--
        if(affectedRow.order==1){
            affectedRow.up = ''
        }else{    
            affectedRow.up = `<i class="fas fa-2x fa-arrow-alt-circle-up hoverUp" onclick="updateOrder('up',${row},${affectedRow.order},${max})"></i>`
        }
        if(affectedRow.order==max){
            affectedRow.down = ''
        }else{    
            affectedRow.down = `<i class="fas fa-2x fa-arrow-alt-circle-down hoverDown" onclick="updateOrder('down',${row},${affectedRow.order},${max})"></i>`
        }
        internals.members.table.row(row).data(affectedRow).draw()

        await axios.post('/api/memberOrderUpdate', { id: affectedRow._id, orderIndex: affectedRow.order})

    }
}

async function removeLecture(btn,id,year,month){
console.log($(btn).parent().html())
    if(!$.isNumeric($(btn).parent().html()[0])){
        $($(btn).parent().parent().children()[7]).html(`<i class="fas fa-plus" onclick="addLectureNew(this,'${id}')"></i>`)
        $($($(btn).parent().parent().children()[6]).children()[0]).val(0)
        $($($(btn).parent().parent().children()[6]).children()[0]).css('border', '')
        $($(btn).parent().parent().children()[8]).val(0)

    }else{

        let deleteLecture = await Swal.fire({
            title: '¿Está seguro de eliminar esta lectura?',
            customClass: 'swal-wide',
            html: ``,
            showCloseButton: true,
            showCancelButton: true,
            showConfirmButton: true,
            focusConfirm: false,
            confirmButtonText: 'Aceptar',
            cancelButtonText: 'Cancelar'
        })

        if (deleteLecture.value) {
            let lectureData = {
                member: id,
                year: year,
                month: month
            }

            console.log(lectureData)
            let lectureDelete = await axios.post('/api/lectureDelete', lectureData)
            console.log(lectureDelete)
            if (lectureDelete.data == 'OK') {
                $($(btn).parent().parent().children()[7]).html(`<i class="fas fa-plus" onclick="addLectureNew(this,'${id}')"></i>`)
                $($($(btn).parent().parent().children()[6]).children()[0]).val(0)
                $($($(btn).parent().parent().children()[6]).children()[0]).css('border', '')
                $($(btn).parent().parent().children()[8]).html(0)
                $($(btn).parent().parent().children()[10]).html(`<i class="fas fa-times" title="Eliminar registro" style="width: 20%; display: inline-block" onclick="removeLecture(this,'${id}','${year}','${month}')"></i>`)
                toastr.success('No puede eliminar lecturas asociadas a boleta/factura')
            }else if (lectureDelete == 'invoice') {
                toastr.warning('No puede eliminar lecturas asociadas a boleta/factura')
            }else{
                toastr.error('Ha ocurrido un error, favor reintente o llame al administrador')
            }
        }
    }
}