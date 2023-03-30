let internals = {
    cartola: {
        table: {},
        data: []
    },
    dataRowSelected: {}
}

let arrayObjects = []
let sectors, services
let parametersGeneral

$(document).ready(async function () {
    $('#searchDate').daterangepicker({
        opens: 'left',
        locale: dateRangePickerDefaultLocale,
        startDate: moment().add(-1,'month')
        //endDate: moment()
    }, function(start, end, label) {
        //internals.initDate = start.format('YYYY-MM-DD')
        //internals.endDate = end.format('YYYY-MM-DD')
    })

    getParameters()
    chargeSummaryTable()
    

    $('#searchSummary').on('click', async function () {
        chargeSummaryTable()
    })
    
})

function chargeSummaryTable() {

    try {

        if ($.fn.DataTable.isDataTable('#tableSummary')) {
            internals.cartola.table.clear().destroy()
        }

        internals.cartola.table = $('#tableSummary')
        .DataTable( {
            dom: 'Bfrtip',
            buttons: [
                {
                    extend: 'excel',
                    className: 'btn-excel',
                    exportOptions: {
                        columns: [ 0, 1, 2, 3, 10, 11, 12, 13, 14 ]
                    }
                },
                {
                    extend: 'pdf',
                    className: 'btn-pdf',
                    exportOptions: {
                        columns: [ 0, 1, 2, 3, 10, 11, 12, 13, 14 ]
                    }
                },
            ],
            //iDisplayLength: 10,
            paging: false,
            language: {
                url: spanishDataTableLang
            },
            responsive: false,
            columnDefs: [{ 
                            targets: [ 0, 1, 2, 3 ], 
                            className: 'dt-center' 
                        },{
                            targets: [ 5, 6, 7, 8, 9 ], 
                            className: 'dt-right',
                            render: $.fn.dataTable.render.number('.', '.', 0, '$ ') 
                        },{
                            targets: [ 10, 11, 12, 13, 14 ],
                            visible: false
                        },
                    ],
            order: [[ 0, 'asc' ]],
            ordering: true,
            columns: [
                { data: 'date' },
                { data: 'first' },
                { data: 'last' },
                { data: 'quantity' },
                { data: 'voucher' },
                { data: 'EFECTIVO' },
                { data: 'CHEQUE' },
                { data: 'REDCOMPRA' },
                { data: 'TRANSFERENCIA' },
                { data: 'TOTAL' },
                { data: 'EFECTIVO' },
                { data: 'CHEQUE' },
                { data: 'REDCOMPRA' },
                { data: 'TRANSFERENCIA' },
                { data: 'TOTAL' }
            ],
            initComplete: function (settings, json) {
                getSummary()

                $(this.api().cell(':last', 7, {order:'original'}).node()).css('display', 'none');
            },
            rowCallback: function (row, data) {

                $(row).find('td:eq(3)').html(`<a href="#" onclick="showInvoices('${data.date}')">${data.quantity}</a>`)
                
                if($(row).find('td:eq(0)').text()=='TOTAL'){
                    $(row).find('td:eq(0)').html(`<label style="font-weight: bold">$ ${data.date}</label>`)
                    $(row).find('td:eq(5)').html(`<label style="font-weight: bold">$ ${dot_separators(data.EFECTIVO)}</label>`)
                    $(row).find('td:eq(6)').html(`<label style="font-weight: bold">$ ${dot_separators(data.CHEQUE)}</label>`)
                    $(row).find('td:eq(7)').html(`<label style="font-weight: bold">$ ${dot_separators(data.REDCOMPRA)}</label>`)
                    $(row).find('td:eq(8)').html(`<label style="font-weight: bold">$ ${dot_separators(data.TRANSFERENCIA)}</label>`)
                    $(row).find('td:eq(9)').html(`<label style="font-weight: bold; color: red">$ ${dot_separators(data.TOTAL)}</label>`)
                }
    
                /*let icon7 = '';
                if(data.fromAuth){
                    if(data.fromAuth=='pending'){
                        icon7 = '<i style="color: #D3D3D3;" class="fas fa-user-shield fa-2x" title="Pendiente"></i>'
                    }else if(data.fromAuth=='rejected'){
                        icon7 = '<i style="color: #E60000;" class="fas fa-user-shield fa-2x" title="Rechazada"></i>'
                    }else{
                        icon7 = '<i style="color: #1C508A;" class="fas fa-user-shield fa-2x" title="Autorizada"></i>'
                    }
                }
                $(row).find('td:eq(7)').html(icon7);*/
            }
        })

        $('#tableSummary tbody').off("click")

        $('#tableSummary tbody').on('click', 'tr', function () {
            /*if ($(this).hasClass('selected')) {
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
            }*/
        })
    } catch (error) {
        console.log(error)
    }

}

async function getParameters() {

    let firstYear = 2021
    for (let i = firstYear; i <= moment().format('YYYY'); i++) {
        $("#searchYear").append(`<option value="${i}">${i}</option>`)
    }

    $("#searchYear").val(moment().format('YYYY'))

    $("#searchMonth").val(moment().format('MM'))

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

async function getSummary() {

    let query = {
        sector: $("#searchSector").val(), 
        paymentMethod: "0",
        dateStart: moment($("#searchYear").val()+''+$("#searchMonth").val()+'01', "YYYYMMDD").format('YYYY-MM-DD'),
        dateEnd: moment($("#searchYear").val()+''+$("#searchMonth").val()+'01', "YYYYMMDD").endOf('month').format('YYYY-MM-DD')
    }

    let paymentData = await axios.post('api/paymentsByFilter', query)
    let payments = paymentData.data

    arrayObjects = []
    let lastDay = parseInt(moment($("#searchYear").val()+''+$("#searchMonth").val()+'01', "YYYYMMDD").endOf('month').format('DD'))

    for(let i = 1; i <= lastDay; i++){
        let prefix = ''
        if(i<10){
            prefix = '0'
        }

        //arrayObjects[prefix+i+'-'+$("#searchMonth").val()+'-'+$("#searchYear").val()+''] = {
        arrayObjects.push({
            date: prefix+i+'-'+$("#searchMonth").val()+'-'+$("#searchYear").val()+'',
            payments: [],
            invoices: [],
            first: 0,
            last: 0,
            quantity: 0,
            voucher: '',
            EFECTIVO: 0,
            CHEQUE: 0,
            REDCOMPRA: 0,
            TRANSFERENCIA: 0,
            TOTAL: 0
        })
    }
    arrayObjects.push({
        date: 'TOTAL',
        payments: [],
        invoices: [],
        first: 0,
        last: 0,
        quantity: 0,
        voucher: '',
        EFECTIVO: 0,
        CHEQUE: 0,
        REDCOMPRA: 0,
        TRANSFERENCIA: 0,
        TOTAL: 0
    })
    
    let last = arrayObjects[arrayObjects.length-1]
    
    if (payments.length > 0) {
        let formatData = payments.filter(el => {
            /*if(!el.members){
              return false
            }
            return true*/
            return true
          
        }).map(el => {

            //let actual = arrayObjects[moment(el.date).utc().format('DD-MM-YYYY')]
            
            let actual = arrayObjects.find(x => x.date == moment(el.date).utc().format('DD-MM-YYYY'))
            actual.first = 1
            actual.last = 2
            actual.quantity += el.invoices.length
            actual.voucher = ''
            actual[el.paymentMethod] += el.amount
            actual.TOTAL += el.amount

            actual.payments.push(el)
            actual.invoices.push(el.invoices)


            last.first = ''
            last.last = ''
            last.quantity += el.invoices.length
            last.voucher = ''
            last[el.paymentMethod] += el.amount
            last.TOTAL += el.amount
            
            //return el
        })

        if(arrayObjects.length>0){
            let newArray = arrayObjects.filter(function( obj ) {
                return obj.first !== 0;
            })
            internals.cartola.table.rows.add(newArray).draw()
        }/*else{
            toastr.warning('No se han encontrado datos de pagos')
        }*/
    } else {
        toastr.warning('No se han encontrado datos de pagos')
    }
    $('#loadingSummary').empty()
}

function showInvoices(date){
    console.log(date)
    //console.log(arrayObjects)

    let payments = arrayObjects.find(x => x.date == date).payments
    console.log(payments)

    $("#tableInvoices1Body").html('')
    $("#tableInvoices2Body").html('')
    $("#tableInvoices3Body").html('')
    $("#tableInvoices4Body").html('')
    $("#tableDetailExcelBody").html('')
    let total1 = 0, total2 = 0, total3 = 0, total4 = 0
    let arrayExcel = new Array(4)
    arrayExcel[0] = []
    arrayExcel[1] = []
    arrayExcel[2] = []
    arrayExcel[3] = []

    for(let i=0; i<payments.length; i++){
        for(let j=0; j<payments[i].invoices.length; j++){

            let name = ''
            if(payments[i].members.type=='personal'){
                name = payments[i].members.personal.name+' '+payments[i].members.personal.lastname1+' '+payments[i].members.personal.lastname2
            }else{
                name = payments[i].members.enterprise.fullName
            }

            let number = 'Saldo'
            if(payments[i].invoices[j].invoices){
                if(payments[i].invoices[j].invoices.number){
                    if($.isNumeric(payments[i].invoices[j].invoices.number)){
                        number = payments[i].invoices[j].invoices.number
                    }
                }
            }else{
                number = 'Saldo a favor'
            }

            let idBody = '', arrayIndex = 0

            switch (payments[i].paymentMethod) {
                case 'EFECTIVO':
                    idBody = 'tableInvoices1Body'
                    total1 += payments[i].invoices[j].amount
                    arrayIndex = 0
                    break
                case 'CHEQUE':
                    idBody = 'tableInvoices2Body'
                    total2 += payments[i].invoices[j].amount
                    arrayIndex = 1
                    break
                case 'REDCOMPRA':
                    idBody = 'tableInvoices3Body'
                    total3 += payments[i].invoices[j].amount
                    arrayIndex = 2
                    break
                case 'TRANSFERENCIA':
                    idBody = 'tableInvoices4Body'
                    total4 += payments[i].invoices[j].amount
                    arrayIndex = 3
                    break
                default:
                    break
            }

            $("#"+idBody).append(`
                <tr>
                    <td style="text-align: center">${payments[i].members.number}</td>
                    <td style="text-align: center">${number}</td>
                    <td style="text-align: right">${dot_separators(payments[i].invoices[j].amount)}</td>
                </tr>
            `)

            arrayExcel[arrayIndex].push({
                0: payments[i].members.number,
                1: number,
                2: payments[i].invoices[j].amount
            })

            if(i+1==payments.length && j+1==payments[i].invoices.length){
                $("#tableInvoices1Total").text('$ '+dot_separators(total1))
                $("#tableInvoices2Total").text('$ '+dot_separators(total2))
                $("#tableInvoices3Total").text('$ '+dot_separators(total3))
                $("#tableInvoices4Total").text('$ '+dot_separators(total4))

                //Composición Excel/PDF
                let maxIndex = arrayExcel[0].length
                if(maxIndex<arrayExcel[1].length) maxIndex = arrayExcel[1].length
                if(maxIndex<arrayExcel[2].length) maxIndex = arrayExcel[2].length
                if(maxIndex<arrayExcel[3].length) maxIndex = arrayExcel[3].length

                for(let j=0; j<maxIndex; j++){

                    let row1 = '<td></td><td></td><td></td><td></td>'
                    let row2 = '<td></td><td></td><td></td><td></td>'
                    let row3 = '<td></td><td></td><td></td><td></td>'
                    let row4 = '<td></td><td></td><td></td>'

                    if(arrayExcel[0][j]){
                        row1 = `<td style="text-align: center">${arrayExcel[0][j][0]}</td>
                                <td style="text-align: center">${arrayExcel[0][j][1]}</td>
                                <td style="text-align: right">${arrayExcel[0][j][2]}</td>
                                <td></td>`
                    }
                    if(arrayExcel[1][j]){
                        row2 = `<td style="text-align: center">${arrayExcel[1][j][0]}</td>
                                <td style="text-align: center">${arrayExcel[1][j][1]}</td>
                                <td style="text-align: right">${arrayExcel[1][j][2]}</td>
                                <td></td>`
                    }
                    if(arrayExcel[2][j]){
                        row3 = `<td style="text-align: center">${arrayExcel[2][j][0]}</td>
                                <td style="text-align: center">${arrayExcel[2][j][1]}</td>
                                <td style="text-align: right">${arrayExcel[2][j][2]}</td>
                                <td></td>`
                    }
                    if(arrayExcel[3][j]){
                        row4 = `<td style="text-align: center">${arrayExcel[3][j][0]}</td>
                                <td style="text-align: center">${arrayExcel[3][j][1]}</td>
                                <td style="text-align: right">${arrayExcel[3][j][2]}</td>`
                    }

                    $("#tableDetailExcelBody").append(`
                        <tr>
                            ${row1}
                            ${row2}
                            ${row3}
                            ${row4}
                        </tr>
                    `)

                    if(j+1==maxIndex){
                        $("#tableDetailExcelBody").append(`
                            <tr>
                                <td></td>
                                <td style="text-align: right">TOTAL</td>
                                <td style="text-align: right">${total1}</td>
                                <td></td>
                                <td></td>
                                <td style="text-align: right">TOTAL</td>
                                <td style="text-align: right">${total2}</td>
                                <td></td>
                                <td></td>
                                <td style="text-align: right">TOTAL</td>
                                <td style="text-align: right">${total3}</td>
                                <td></td>
                                <td></td>
                                <td style="text-align: right">TOTAL</td>
                                <td style="text-align: right">${total4}</td>
                            </tr>
                        `)
                    }
                }

            }
            
        }

    }

    $("#modalInvoices").modal('show')

}

function ExportToExcel(type, fn, dl) {
    var elt = document.getElementById('tableDetailExcel')
    var wb = XLSX.utils.table_to_book(elt, { sheet: "Hoja1" })
    return dl ?
      XLSX.write(wb, { bookType: type, bookSST: true, type: 'base64' }):
      XLSX.writeFile(wb, fn || ('Reporte.' + (type || 'xlsx')))
}

function exportToPDF(){
    var doc = new jsPDF('l','pt','letter')
    doc.autoTable({ 
        html: "#tableDetailExcel",
        styles: {
            fontSize: 6,
            valign: 'middle',
            halign: 'center'
        },
        columnStyles: {
            2: { halign: 'right' },
        },
        didParseCell: (hookData) => {
            if (hookData.section === 'head') {
                if (hookData.column.dataKey === '1') {
                    hookData.cell.styles.halign = 'left';
                }
            }
        }
    })
    doc.save("Detalle reporte.pdf")
}