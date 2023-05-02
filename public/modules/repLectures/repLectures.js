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
let lastMonth = 0

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

    let columns = [], targets = [], header = ''

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

        header = `
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
            <th style="background-color: #3B6FC9; border-top-right-radius: 5px;">PROMEDIO</th>
        `

        targets = [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
    }else{

        let getLastMonth = await axios.post('api/lecturesReportCheckLast',{})
        lastMonth = getLastMonth.data

        let month01 = getMonth('number',lastMonth,2)
        let month02 = getMonth('number',lastMonth,1)
        let month03 = getMonth('number',lastMonth,0)

        let month01String = getMonth('string',lastMonth,2)
        let month02String = getMonth('string',lastMonth,1)
        let month03String = getMonth('string',lastMonth,0)

        if($("#searchMonth").val()==3){
            columns.push(
                { data: 'number' },
                { data: 'name' },
                { data: month01 },
                { data: month02 },
                { data: month03 },
                { data: 'prom' }
            )

            header = `
                <th style="background-color: #3B6FC9; border-top-left-radius: 5px;">N°</th>
                <th style="background-color: #3B6FC9">NOMBRE</th>
                <th style="background-color: #3B6FC9">${month01String}</th>
                <th style="background-color: #3B6FC9">${month02String}</th>
                <th style="background-color: #3B6FC9">${month03String}</th>
                <th style="background-color: #3B6FC9; border-top-right-radius: 5px;">PROMEDIO</th>
            `
            targets = [0, 2, 3, 4, 5]
        }else if($("#searchMonth").val()==6){

            let getLastMonth = await axios.post('api/lecturesReportCheckLast',{})
            let lastMonth = getLastMonth.data

            let month01 = getMonth('number',lastMonth,5)
            let month02 = getMonth('number',lastMonth,4)
            let month03 = getMonth('number',lastMonth,3)
            let month04 = getMonth('number',lastMonth,2)
            let month05 = getMonth('number',lastMonth,1)
            let month06 = getMonth('number',lastMonth,0)

            let month01String = getMonth('string',lastMonth,5)
            let month02String = getMonth('string',lastMonth,4)
            let month03String = getMonth('string',lastMonth,3)
            let month04String = getMonth('string',lastMonth,2)
            let month05String = getMonth('string',lastMonth,1)
            let month06String = getMonth('string',lastMonth,0)


            columns.push(
                { data: 'number' },
                { data: 'name' },
                { data: month01 },
                { data: month02 },
                { data: month03 },
                { data: month04 },
                { data: month05 },
                { data: month06 },
                { data: 'prom' }                    
            )

            header = `
                <th style="background-color: #3B6FC9; border-top-left-radius: 5px;">N°</th>
                <th style="background-color: #3B6FC9">NOMBRE</th>
                <th style="background-color: #3B6FC9">${month01String}</th>
                <th style="background-color: #3B6FC9">${month02String}</th>
                <th style="background-color: #3B6FC9">${month03String}</th>
                <th style="background-color: #3B6FC9">${month04String}</th>
                <th style="background-color: #3B6FC9">${month05String}</th>
                <th style="background-color: #3B6FC9">${month06String}</th>
                <th style="background-color: #3B6FC9; border-top-right-radius: 5px;">PROMEDIO</th>
            `
            targets = [0, 2, 3, 4, 5, 6, 7, 8]

        }else if($("#searchMonth").val()==12){

            let getLastMonth = await axios.post('api/lecturesReportCheckLast',{})
            let lastMonth = getLastMonth.data

            let month01 = getMonth('number',lastMonth,11)
            let month02 = getMonth('number',lastMonth,10)
            let month03 = getMonth('number',lastMonth,9)
            let month04 = getMonth('number',lastMonth,8)
            let month05 = getMonth('number',lastMonth,7)
            let month06 = getMonth('number',lastMonth,6)
            let month07 = getMonth('number',lastMonth,5)
            let month08 = getMonth('number',lastMonth,4)
            let month09 = getMonth('number',lastMonth,3)
            let month10 = getMonth('number',lastMonth,2)
            let month11 = getMonth('number',lastMonth,1)
            let month12 = getMonth('number',lastMonth,0)

            let month01String = getMonth('string',lastMonth,11)
            let month02String = getMonth('string',lastMonth,10)
            let month03String = getMonth('string',lastMonth,9)
            let month04String = getMonth('string',lastMonth,8)
            let month05String = getMonth('string',lastMonth,7)
            let month06String = getMonth('string',lastMonth,6)
            let month07String = getMonth('string',lastMonth,5)
            let month08String = getMonth('string',lastMonth,4)
            let month09String = getMonth('string',lastMonth,3)
            let month10String = getMonth('string',lastMonth,2)
            let month11String = getMonth('string',lastMonth,1)
            let month12String = getMonth('string',lastMonth,0)

            columns.push(
                { data: 'number' },
                { data: 'name' },
                { data: month01 },
                { data: month02 },
                { data: month03 },
                { data: month04 },
                { data: month05 },
                { data: month06 },
                { data: month07 },
                { data: month08 },
                { data: month09 },
                { data: month10 },
                { data: month11 },
                { data: month12 },
                { data: 'prom' }                    
            )

            header = `
                <th style="background-color: #3B6FC9; border-top-left-radius: 5px;">N°</th>
                <th style="background-color: #3B6FC9">NOMBRE</th>
                <th style="background-color: #3B6FC9">${month01String}</th>
                <th style="background-color: #3B6FC9">${month02String}</th>
                <th style="background-color: #3B6FC9">${month03String}</th>
                <th style="background-color: #3B6FC9">${month04String}</th>
                <th style="background-color: #3B6FC9">${month05String}</th>
                <th style="background-color: #3B6FC9">${month06String}</th>
                <th style="background-color: #3B6FC9">${month07String}</th>
                <th style="background-color: #3B6FC9">${month08String}</th>
                <th style="background-color: #3B6FC9">${month09String}</th>
                <th style="background-color: #3B6FC9">${month10String}</th>
                <th style="background-color: #3B6FC9">${month11String}</th>
                <th style="background-color: #3B6FC9">${month12String}</th>
                <th style="background-color: #3B6FC9; border-top-right-radius: 5px;">PROMEDIO</th>
            `
            targets = [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]

        }
    }


    try {
        if ($.fn.DataTable.isDataTable('#tableMembers')) {
            internals.members.table.clear().destroy()
        }

        if($("#searchOrder").val()==1){
            $("#changeOrder").removeAttr('disabled')
        }else{
            $("#changeOrder").attr('disabled','disabled')
        }

        $("#trHead").html(header)
        $("#trHeadExcel").html(header)
        $("#tableMembersExcelBody").html('')

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
    let order = 1, rowIndex = 0

    let query = {
        by: 'month',
        type: type,
        month: monthSelected,
        order: $("#searchOrder").val()
    }

    if($("#rbYear").prop('checked')){
        query = {
            by: 'year',
            type: type,
            year: yearSelected, 
            order: $("#searchOrder").val()
        }
    }

    if(sectorSelected!=0){
        query.sector = sectorSelected
    }

    let lecturesData = await axios.post('api/lecturesReport', query)

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

            let row = `<tr>
                        <td>${el.number}</td>
                        <td>${el.name}</td>`
            
            if($("#rbYear").prop('checked')){
                row += `<td>${el.month01}</td>
                        <td>${el.month02}</td>
                        <td>${el.month03}</td>
                        <td>${el.month04}</td>
                        <td>${el.month05}</td>
                        <td>${el.month06}</td>
                        <td>${el.month07}</td>
                        <td>${el.month08}</td>
                        <td>${el.month09}</td>
                        <td>${el.month10}</td>
                        <td>${el.month11}</td>
                        <td>${el.month12}</td>`
            }else{
                if($("#searchMonth").val()==3){
                    row += `<td>${eval('el.'+getMonth('number',lastMonth,2))}</td>
                        <td>${eval('el.'+getMonth('number',lastMonth,1))}</td>
                        <td>${eval('el.'+getMonth('number',lastMonth,0))}</td>`
                }else if($("#searchMonth").val()==6){
                    row += `<td>${eval('el.'+getMonth('number',lastMonth,5))}</td>
                        <td>${eval('el.'+getMonth('number',lastMonth,4))}</td>
                        <td>${eval('el.'+getMonth('number',lastMonth,3))}</td>
                        <td>${eval('el.'+getMonth('number',lastMonth,2))}</td>
                        <td>${eval('el.'+getMonth('number',lastMonth,1))}</td>
                        <td>${eval('el.'+getMonth('number',lastMonth,0))}</td>`

                }else if($("#searchMonth").val()==12){
                    row += `<td>${eval('el.'+getMonth('number',lastMonth,11))}</td>
                        <td>${eval('el.'+getMonth('number',lastMonth,10))}</td>
                        <td>${eval('el.'+getMonth('number',lastMonth,9))}</td>
                        <td>${eval('el.'+getMonth('number',lastMonth,8))}</td>
                        <td>${eval('el.'+getMonth('number',lastMonth,7))}</td>
                        <td>${eval('el.'+getMonth('number',lastMonth,6))}</td>
                        <td>${eval('el.'+getMonth('number',lastMonth,5))}</td>
                        <td>${eval('el.'+getMonth('number',lastMonth,4))}</td>
                        <td>${eval('el.'+getMonth('number',lastMonth,3))}</td>
                        <td>${eval('el.'+getMonth('number',lastMonth,2))}</td>
                        <td>${eval('el.'+getMonth('number',lastMonth,1))}</td>
                        <td>${eval('el.'+getMonth('number',lastMonth,0))}</td>`
                }   
            }

            row += `<td>${el.prom}</td>
                </tr>`

            $("#tableMembersExcelBody").append(row)

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

    yearSelected = $("#searchYear").val()
    monthSelected = $("#searchMonth").val()
    sectorSelected = $("#searchSector").val()
    monthNameSelected = $("#searchMonth option:selected").text()
    sectorNameSelected = $("#searchSector option:selected").text()
    chargeMembersTable()

})

function getMonth(type,lastMonth,index){

    let monthIndex = lastMonth-index

    if(monthIndex<=0){
        monthIndex += 12
    }

    if(type=='number'){
        switch(monthIndex) {
            case 1:
                return 'month01'
            case 2:
                return 'month02'
            case 3:
                return 'month03'
            case 4:
                return 'month04'
            case 5:
                return 'month05'
            case 6:
                return 'month06'
            case 7:
                return 'month07'
            case 8:
                return 'month08'
            case 9:
                return 'month09'
            case 10:
                return 'month10'
            case 11:
                return 'month11'
            case 12:
                return 'month12'
        }
    }else{
        switch(monthIndex) {
            case 1:
                return 'ENERO'
            case 2:
                return 'FEBRERO'
            case 3:
                return 'MARZO'
            case 4:
                return 'ABRIL'
            case 5:
                return 'MAYO'
            case 6:
                return 'JUNIO'
            case 7:
                return 'JULIO'
            case 8:
                return 'AGOSTO'
            case 9:
                return 'SEPTIEMBRE'
            case 10:
                return 'OCTUBRE'
            case 11:
                return 'NOVIEMBRE'
            case 12:
                return 'DICIEMBRE'
        }
    }
}

function exportToPDF(){
    var doc = new jsPDF('l','pt','letter')
    doc.autoTable({ 
        html: "#tableMembersExcel",
        styles: {
            fontSize: 6,
            valign: 'middle',
            halign: 'center'
        },
        columnStyles: {
            0: {cellWidth: 20},
            1: {cellWidth: 120, halign: 'left'},
            
        },
        didParseCell: (hookData) => {
            if (hookData.section === 'head') {
                if (hookData.column.dataKey === '1') {
                    hookData.cell.styles.halign = 'left';
                }
            }
        }
    })
    doc.save("table.pdf")
}


function exportToPDFSeparate(){
    var doc = new jsPDF('p','pt','letter')

    doc.setFontSize(10)

    for(let i=0; i<months.length; i++){
        let finalY = doc.previousAutoTable.finalY
        let startY = 30

        if(months[i].length>0){

            let text = "Sector: "+(i+1)
            if(i+1>=5){
                text += " y más"
            }
            if(finalY){
                finalY += 20
                startY = finalY + 10
                doc.text(text, 40, finalY)
            }else{
                doc.text(text, 40, 20)
            }

            doc.autoTable({ 
                html: "#tableDefaulterExcel"+(i+1),
                startY: startY,
                //headStyles: {lineWidth: 0.1, lineColor: [0, 0, 0]},
                bodyStyles: {lineColor: [0, 0, 0], textColor: '#000000'},
                styles: {
                    fontSize: 7
                    /*fillColor: 'rgb(107,165,57)',
                    textColor: '#000000',
                    halign: 'center'*/
                },
                /*styles: {
                    fontSize: 6,
                    valign: 'middle',
                    halign: 'right'
                },*/
                columnStyles: {
                    0: {cellWidth: 20, halign: 'center'},
                    1: {cellWidth: 140, halign: 'left'},
                    4: {halign: 'right'},
                    5: {halign: 'right'},
                    6: {halign: 'right'},
                    7: {halign: 'center'},
                },
                didParseCell: (hookData) => {
                    if (hookData.section === 'head') {
                        if (hookData.column.dataKey === '1') {
                            hookData.cell.styles.halign = 'left';
                        }
                    }
                }
            })
        }
    }
    //doc.save("table.pdf")
    window.open(doc.output('bloburl'), '_blank')
}