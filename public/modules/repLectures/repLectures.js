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

    $(".period").on('change', async function () {
        if($("#rbMonth").prop('checked')){
            $("#searchMonth").removeAttr('disabled')
            $("#searchYear").attr('disabled','disabled')
        }else{
            $("#searchYear").removeAttr('disabled')
            $("#searchMonth").attr('disabled','disabled')
        }
    })

    getParameters()
})

async function getParameters() {

    let firstYear = 2022
    for (let i = firstYear; i <= moment().format('YYYY'); i++) {
        $("#searchYear").append(`<option value="${i}">${i}</option>`)
    }
    
    let setYear = moment().format('YYYY')

    $("#searchYear").val(setYear)

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

    $("#searchSector").val('62cde501ddcc8b2d6c958339')

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

async function chargeMembersTable() {

    let columns = [], targets = []

    if($("#rbYear").prop('checked')){
        columns.push(
            { data: 'number' },
            { data: 'name' },
            { data: 'month01' },
            { data: 'month02' },
            { data: 'month03' },
            { data: 'month04' },
            { data: 'month05' },
            { data: 'month06' },
            { data: 'month07' },
            { data: 'month08' },
            { data: 'month09' },
            { data: 'month10' },
            { data: 'month11' },
            { data: 'month12' },
            { data: 'prom' }                    
        )

        $("#trHead").html(`
            <th style="background-color: #3B6FC9; border-top-left-radius: 5px;">N°</th>
            <th style="background-color: #3B6FC9">NOMBRE</th>
            <th style="background-color: #3B6FC9">ENERO</th>
            <th style="background-color: #3B6FC9">FEBRERO</th>
            <th style="background-color: #3B6FC9">MARZO</th>
            <th style="background-color: #3B6FC9">ABRIL</th>
            <th style="background-color: #3B6FC9">MAYO</th>
            <th style="background-color: #3B6FC9">JUNIO</th>
            <th style="background-color: #3B6FC9">JULIO</th>
            <th style="background-color: #3B6FC9">AGOSTO</th>
            <th style="background-color: #3B6FC9">SEPTIEMBRE</th>
            <th style="background-color: #3B6FC9">OCTUBRE</th>
            <th style="background-color: #3B6FC9">NOVIEMBRE</th>
            <th style="background-color: #3B6FC9">DICIEMBRE</th>
            <th style="background-color: #3B6FC9; border-top-right-radius: 5px; display: none;">PROMEDIO</th>
        `)

        targets = [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
    }else{

        let getMonth = await axios.post('api/lecturesReportCheckLast',{})
        console.log(getMonth.data)

        if($("#searchMonth").val()==3){
            columns.push(
                { data: 'number' },
                { data: 'name' },
                { data: 'month01' },
                { data: 'month02' },
                { data: 'month03' },
                { data: 'prom' }                    
            )

            //EN DESARROLLO...
            for(let i=0; i<3; i++){
                
            }

            $("#trHead").html(`
                <th style="background-color: #3B6FC9; border-top-left-radius: 5px;">N°</th>
                <th style="background-color: #3B6FC9">NOMBRE</th>
                <th style="background-color: #3B6FC9">ENERO</th>
                <th style="background-color: #3B6FC9">FEBRERO</th>
                <th style="background-color: #3B6FC9">MARZO</th>
                <th style="background-color: #3B6FC9; border-top-right-radius: 5px; display: none;">PROMEDIO</th>
            `)
            targets = [0, 2, 3, 4, 5]
        }else if($("#searchMonth").val()==6){
            columns.push(
                { data: 'number' },
                { data: 'name' },
                { data: 'month01' },
                { data: 'month02' },
                { data: 'month03' },
                { data: 'month04' },
                { data: 'month05' },
                { data: 'month06' },
                { data: 'prom' }                    
            )
        }else if($("#searchMonth").val()==12){
            columns.push(
                { data: 'number' },
                { data: 'name' },
                { data: 'month01' },
                { data: 'month02' },
                { data: 'month03' },
                { data: 'month04' },
                { data: 'month05' },
                { data: 'month06' },
                { data: 'month07' },
                { data: 'month08' },
                { data: 'month09' },
                { data: 'month10' },
                { data: 'month11' },
                { data: 'month12' },
                { data: 'prom' }                    
            )
        }
    }


    console.log('here')
    try {
        if ($.fn.DataTable.isDataTable('#tableMembers')) {
            internals.members.table.clear().destroy()
        }

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
                        targets: targets, 
                        className: 'dt-center' 
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
                columns: columns,
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

    
    let type = ($("#rbConsumption").prop('checked')) ? 'consumption' : 'lecture'

    let query = {
        by: 'month',
        type: type,
        sector: sectorSelected, 
        month: monthSelected,
        order: $("#searchOrder").val()
    }

    if($("#rbYear").prop('checked')){
        query = {
            by: 'year',
            type: type,
            sector: sectorSelected, 
            year: yearSelected, 
            order: $("#searchOrder").val()
        }
    }

    console.log(query)

    let lecturesData = await axios.post('api/lecturesReport', query)
    let order = 1, rowIndex = 0
    console.log(lecturesData.data)

    if (lecturesData.data.length > 0) {
        let formatData = lecturesData.data.map(el => {
            
            //el.datetime = moment(el.datetime).format('DD/MM/YYYY HH:mm')
            if (el.type == 'personal') {
                if($("#searchOrder").val()==3){
                    el.name = el.personal.lastname1 + ' ' + el.personal.lastname2 + ' ' + el.personal.name
                }else{
                    el.name = el.personal.name + ' ' + el.personal.lastname1 + ' ' + el.personal.lastname2
                }
            } else {
                el.name = el.enterprise.name
            }

            if(type=='consumption'){
                el.month01 = ($.isNumeric(el.consumption[1])) ? el.consumption[1] : '-'
                el.month02 = ($.isNumeric(el.consumption[2])) ? el.consumption[2] : '-'
                el.month03 = ($.isNumeric(el.consumption[3])) ? el.consumption[3] : '-'
                el.month04 = ($.isNumeric(el.consumption[4])) ? el.consumption[4] : '-'
                el.month05 = ($.isNumeric(el.consumption[5])) ? el.consumption[5] : '-'
                el.month06 = ($.isNumeric(el.consumption[6])) ? el.consumption[6] : '-'
                el.month07 = ($.isNumeric(el.consumption[7])) ? el.consumption[7] : '-'
                el.month08 = ($.isNumeric(el.consumption[8])) ? el.consumption[8] : '-'
                el.month09 = ($.isNumeric(el.consumption[9])) ? el.consumption[9] : '-'
                el.month10 = ($.isNumeric(el.consumption[10])) ? el.consumption[10] : '-'
                el.month11 = ($.isNumeric(el.consumption[11])) ? el.consumption[11] : '-'
                el.month12 = ($.isNumeric(el.consumption[12])) ? el.consumption[12] : '-'
            }else{
                el.month01 = ($.isNumeric(el.lectures[1])) ? el.lectures[1] : '-'
                el.month02 = ($.isNumeric(el.lectures[2])) ? el.lectures[2] : '-'
                el.month03 = ($.isNumeric(el.lectures[3])) ? el.lectures[3] : '-'
                el.month04 = ($.isNumeric(el.lectures[4])) ? el.lectures[4] : '-'
                el.month05 = ($.isNumeric(el.lectures[5])) ? el.lectures[5] : '-'
                el.month06 = ($.isNumeric(el.lectures[6])) ? el.lectures[6] : '-'
                el.month07 = ($.isNumeric(el.lectures[7])) ? el.lectures[7] : '-'
                el.month08 = ($.isNumeric(el.lectures[8])) ? el.lectures[8] : '-'
                el.month09 = ($.isNumeric(el.lectures[9])) ? el.lectures[9] : '-'
                el.month10 = ($.isNumeric(el.lectures[10])) ? el.lectures[10] : '-'
                el.month11 = ($.isNumeric(el.lectures[11])) ? el.lectures[11] : '-'
                el.month12 = ($.isNumeric(el.lectures[12])) ? el.lectures[12] : '-'
            }
            
            if(!$.isNumeric(el.prom)){
                el.prom = '-'
            }

            if($("#searchOrder").val()==1){
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

        console.log(members)
        
        for(let i=0; i < members.length; i++){

            //Gris por defecto: rgba(0, 0, 0, 0.1)
            //Rojo: rgb(231, 76, 60)
            //Azul: rgb(69, 130, 236)
            let lectureInputNew = false
            if($("#lectureNewStart-"+members[i]._id).length>0){
                lectureInputNew = true
            }

            if($("#lecture-"+members[i]._id).css('border').includes('solid rgb(231, 76, 60)')){
                i = members.length
                toastr.error('Debe corregir los registros marcados en rojo antes de almacenar')

            }else if(lectureInputNew){ //En caso que haya medidor nuevo
                if($("#lectureNewStart-"+members[i]._id).css('border').includes('solid rgb(231, 76, 60)')){
                    i = members.length
                    toastr.error('Debe corregir los registros marcados en rojo antes de almacenar')
                }else{
                    if($("#lecture-"+members[i]._id).css('border').includes('solid rgb(69, 130, 236)') || $("#lectureNewStart-"+members[i]._id).css('border').includes('solid rgb(69, 130, 236)')){
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

            }else if($("#lecture-"+members[i]._id).css('border').includes('solid rgb(69, 130, 236)')){
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
                console.log('here')
                return
                
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

async function saveOne(member_id){

    let array = {
        users: userCredentials._id,
        date: moment().format('YYYY-MM-DD[T]HH:mm:ss.SSS[Z]'),
        year: yearSelected, //MODIFICAR
        month: monthSelected, //MODIFICAR
        lectures: [],
        members: []
    }

    member = members.find(x => x._id===member_id)

    //Gris por defecto: rgba(0, 0, 0, 0.1)
    //Rojo: rgb(231, 76, 60)
    //Azul: rgb(69, 130, 236)
    let lectureInputNew = false
    if($("#lectureNewStart-"+member._id).length>0){
        lectureInputNew = true
    }

    if($("#lecture-"+member._id).css('border').includes('solid rgb(231, 76, 60)')){
        toastr.error('Debe corregir los registros marcados en rojo antes de almacenar')
        return

    }else if(lectureInputNew){ //En caso que haya medidor nuevo
        if($("#lectureNewStart-"+member._id).css('border').includes('solid rgb(231, 76, 60)')){
            toastr.error('Debe corregir los registros marcados en rojo antes de almacenar')
            return
        }else{
            if($("#lecture-"+member._id).css('border').includes('solid rgb(69, 130, 236)') || $("#lectureNewStart-"+member._id).css('border').includes('solid rgb(69, 130, 236)')){
                array.lectures.push({
                    member: member._id,
                    lecture: parseInt(replaceAll($("#lecture-"+member._id).val(), '.', '').replace(' ', '')),
                    lectureNewStart: parseInt(replaceAll($("#lectureNewStart-"+member._id).val(), '.', '').replace(' ', '')),
                    lectureNewEnd: parseInt(replaceAll($("#lectureNewEnd-"+member._id).val(), '.', '').replace(' ', '')),
                    fine: $(`#lectureFine-${member._id}`).prop('checked')
                })
                array.members.push(member._id)
            }
        }

    }else if($("#lecture-"+member._id).css('border').includes('solid rgb(69, 130, 236)')){
        array.lectures.push({
            member: member._id,
            lecture: parseInt(replaceAll($("#lecture-"+member._id).val(), '.', '').replace(' ', '')),
            fine: $(`#lectureFine-${member._id}`).prop('checked')
        })
        array.members.push(member._id)
    }else if(member.lectures){

        if(member.lectures.logs[member.lectures.logs.length-1].lectureNewStart !== undefined && !lectureInputNew){//Caso en que borren la lectura del medidor nuevo
            array.lectures.push({
                member: member._id,
                lecture: parseInt(replaceAll($("#lecture-"+member._id).val(), '.', '').replace(' ', '')),
                fine: $(`#lectureFine-${member._id}`).prop('checked')
            })
            array.members.push(member._id)
        }else if(member.fine!=$(`#lectureFine-${member._id}`).prop('checked')){
            array.lectures.push({
                member: member._id,
                lecture: parseInt(replaceAll($("#lecture-"+member._id).val(), '.', '').replace(' ', '')),
                fine: $(`#lectureFine-${member._id}`).prop('checked')
            })
            array.members.push(member._id)
        }
    }

    if(array.members.length>0){
        console.log(array)
        console.log('here')
        
        if(array.lectures.length>0){
            //loadingHandler('start')
            //ALMACENADO...
            let saveLecture = await axios.post('/api/lectureSaveManual', array)
            //loadingHandler('stop')

            console.log(saveLecture)

            if(saveLecture.data=='OK'){
                if($("#lectureNewStart-"+member_id)){
                    $("#lectureNewStart-"+member_id).css('border', '')
                    $("#lectureNewEnd-"+member_id).css('border', '')
                }
                $("#lecture-"+member_id).css('border', '')

                let index = $($("#lecture-"+member_id).parent().parent().children()[10]).html().indexOf('<i')
                let text = $($("#lecture-"+member_id).parent().parent().children()[10]).html().slice(index)
                $($("#lecture-"+member_id).parent().parent().children()[10]).html('AHORA '+text)

                toastr.success('Almacenado correctamente')
            }else{
                toastr.warning('Ha ocurrido un error al almacenar, favor reintente o contacte al administrador')
            }
        }else{
            toastr.warning('No ha realizado cambios, se mantienen los datos actuales')
        }
    }

}

function setFocus(e, input, member_id){
    if(e.keyCode==13){
        saveOne(member_id)
        let nextIndex = parseInt($(input).attr('tabindex')) + 1
        $(`[tabindex=${nextIndex}]`).focus()
    }
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
    //saveOne(id)
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
    
    console.log(tableColumns,tableRows)

    doc.autoTable({
        /*createdCell: function (cell, data) {
            cell.styles.fillColor = 'rgb(107,165,57)'
            cell.styles.textColor = '#FFFFFF'
            cell.styles.fontStyle = 'bold'
            tableFinal = data.table
        },*/
        head: [tableColumns],
        body: tableRows,
        theme: 'grid',
        headStyles: {lineWidth: 0.1, lineColor: [0, 0, 0]},
        bodyStyles: {lineColor: [0, 0, 0], textColor: '#000000'},
        columnStyles:{
            0: {halign:'center'},
            3: {halign:'right'}
        },
        styles: {
            fontSize: 9
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
                toastr.success('Lectura eliminado correctamente')
            }else if (lectureDelete == 'invoice') {
                toastr.warning('No puede eliminar lecturas asociadas a boleta/factura')
            }else{
                toastr.error('Ha ocurrido un error, favor reintente o llame al administrador')
            }
        }
    }
}