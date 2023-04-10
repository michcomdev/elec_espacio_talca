let internals = {
    defaulter: {
        table: {},
        data: []
    },
    dataRowSelected: {}
}

let sectors, services
let parametersGeneral
let months = [[],[],[],[],[],[]]

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
    loadDefaulter()
    

    $('#searchDefaulter').on('click', async function () {
        loadDefaulter()
    })
    
})

function loadDefaulter() {

    try {

        if ($.fn.DataTable.isDataTable('#tableDefaulter')) {
            internals.defaulter.table.clear().destroy()
        }

        internals.defaulter.table = $('#tableDefaulter')
        .DataTable( {
            dom: 'Bfrtip',
            buttons: [
                {
                    extend: 'excel',
                    className: 'btn-excel'/*,
                    exportOptions: {
                        columns: [ 0, 1, 2, 3, 4, 5 ]
                    }*/
                },
                {
                    extend: 'pdf',
                    className: 'btn-pdf'
                },
            ],
            //iDisplayLength: 10,
            paging: false,
            language: {
                url: spanishDataTableLang
            },
            responsive: false,
            columnDefs: [{ 
                            targets: [7], 
                            className: 'dt-center' 
                        },{
                            targets: [0], 
                            className: 'dt-right' 
                        },{ 
                            targets: [4,5,6], 
                            className: 'dt-right',
                            render: $.fn.dataTable.render.number('.', '.', 0, '$ ') 
                        }],
            order: [[ 0, 'asc' ]],
            ordering: true,

            columns: [
                { data: 'number' },
                { data: 'name' },
                { data: 'address' },
                { data: 'rut' },
                { data: 'toPay' },
                { data: 'paid' },
                { data: 'balance' },
                { data: 'months' }
            ],
            initComplete: function (settings, json) {
                getDefaulter()
            },
            rowCallback: function (row, data) {

                if($(row).find('td:eq(0)').text()=='10000'){
                    $(row).find('td:eq(0)').html(``)
                    $(row).find('td:eq(3)').html(`<label style="font-weight: bold">$ ${dot_separators(data.rut)}</label>`)
                    $(row).find('td:eq(4)').html(`<label style="font-weight: bold">$ ${dot_separators(data.toPay)}</label>`)
                    $(row).find('td:eq(5)').html(`<label style="font-weight: bold">$ ${dot_separators(data.paid)}</label>`)
                    $(row).find('td:eq(6)').html(`<label style="font-weight: bold">$ ${dot_separators(data.balance)}</label>`)
                }
            }
        })

        $('#tableDefaulter tbody').off("click")

        $('#tableDefaulter tbody').on('click', 'tr', function () {
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

async function getDefaulter() {
    months = [[],[],[],[],[],[]]

    let query = {
        sector: $("#searchSector").val(),
        months: $("#searchMonths").val(),
        /*
        paymentMethod: $("#searchPaymentMethod").val(),
        dateStart: $("#searchDate").data('daterangepicker').startDate.format('YYYY-MM-DD'),
        dateEnd: $("#searchDate").data('daterangepicker').endDate.format('YYYY-MM-DD')*/
    }

    let invoicesData = await axios.post('api/defaulters', query)
    let invoices = invoicesData.data

    let toPay = 0, paid = 0, balance = 0
    
    if (invoices.length > 0) {
        let formatData = invoices.filter(el => {
            
            return true
          
        }).map(el => {

            /*el.date = moment(el.date).utc().format('DD/MM/YYYY')
            el.sector = el.members.address.sector.name
            el.number = el.members.number
            el.name = el.members.personal.name + ' ' + el.members.personal.lastname1 + ' ' + el.members.personal.lastname2
            if(el.members.type=='personal'){
                el.name = el.members.personal.name + ' ' + el.members.personal.lastname1 + ' ' + el.members.personal.lastname2
            }else{
                el.name = el.members.enterprise.name
            }

            el.detail = ''

            for(let i=0; i < el.invoices.length; i++){
                if(el.detail.length>0){
                    el.detail = ', '
                }
                if(el.invoices[i].invoices.type==33){
                    el.detail += 'FACTURA'
                }else{
                    el.detail += 'BOLETA '
                }

                el.detail += ' ' + el.invoices[i].invoices.number
            }

            //el.paymentMethod
            //el.transaction
            el.amountSeparator = el.amount
            //el.amount*/
            toPay += el.toPay
            paid += el.paid
            balance += el.balance

            if(el.months>5){
                months[5].push(el)
            }else{
                months[el.months-1].push(el)
            }

            
            
            return el
        })

        if(formatData.length>0){
            formatData.push({
                number: '10000',
                name: '',
                address: '',
                rut: 'TOTAL',
                toPay: toPay,
                paid: paid,
                balance: balance,
                months: '',
            })

            internals.defaulter.table.rows.add(formatData).draw()
        }else{
            toastr.warning('No se han encontrado datos de pagos')
        }
    } else {
        toastr.warning('No se han encontrado datos de pagos')
    }
    $('#loadingDefaulter').empty()
}


function exportTo(to){
    
    loadingHandler('start')
    let first = true
    $("#tableDefaulterExcel").html('')

    for(let i=0; i<months.length; i++){

        $("#tableDefaulterExcelBody"+(i+1)).html('')

        if(months[i].length>0){
            let text = "Meses adeudados: "+(i+1)
            if(i+1>=5){
                text += " y más"
            }

            space = `<tr>
                        <th colspan="8"></th>
                    </tr>`

            if(first){
                space = ''
                first = false
            }


            $("#tableDefaulterExcel").append(`
                ${space}
                <tr>
                    <th colspan="8">${text}</th>
                </tr>
                <tr>
                    <th>N° SOCIO</th>
                    <th>NOMBRE</th>
                    <th>DIRECCIÓN</th>
                    <th>RUT</th>
                    <th>TOTAL A PAGAR</th>
                    <th>PAGADO</th>
                    <th>SALDO</th>
                    <th>MESES</th>
                </tr>
            `)
        }

        let toPay = 0, paid = 0, balance = 0

        for(let j=0; j<months[i].length; j++){
            $("#tableDefaulterExcelBody"+(i+1)).append(`
                <tr>
                    <td>${months[i][j]['number']}</td>
                    <td>${months[i][j]['name']}</td>
                    <td>${months[i][j]['address']}</td>
                    <td>${months[i][j]['rut']}</td>
                    <td>${months[i][j]['toPay']}</td>
                    <td>${months[i][j]['paid']}</td>
                    <td>${months[i][j]['balance']}</td>
                    <td>${months[i][j]['months']}</td>
                </tr>`)


            $("#tableDefaulterExcel").append(`
                <tr>
                    <td>${months[i][j]['number']}</td>
                    <td>${months[i][j]['name']}</td>
                    <td>${months[i][j]['address']}</td>
                    <td>${months[i][j]['rut']}</td>
                    <td>${months[i][j]['toPay']}</td>
                    <td>${months[i][j]['paid']}</td>
                    <td>${months[i][j]['balance']}</td>
                    <td>${months[i][j]['months']}</td>
                </tr>`)

            toPay += months[i][j]['toPay']
            paid += months[i][j]['paid']
            balance += months[i][j]['balance']

            if(j+1==months[i].length){
                $("#tableDefaulterExcelBody"+(i+1)).append(`
                    <tr>
                        <td colspan="4">TOTAL</td>
                        <td>${toPay}</td>
                        <td>${paid}</td>
                        <td>${balance}</td>
                        <td></td>
                    </tr>`)

                $("#tableDefaulterExcel").append(`
                    <tr>
                        <td colspan="5">TOTAL</td>
                        <td>${toPay}</td>
                        <td>${paid}</td>
                        <td>${balance}</td>
                        <td></td>
                    </tr>`)
            }
        }
    }

//    setTimeout(() => {
        if(to=='excel'){
            ExportToExcel('xlsx')
        }else{
            exportToPDF()
        }

        loadingHandler('stop')
    //}, 2000)

}


function ExportToExcel(type, fn, dl) {
    var elt = document.getElementById('tableDefaulterExcel')
    var wb = XLSX.utils.table_to_book(elt, { sheet: "Hoja1" })
    return dl ?
      XLSX.write(wb, { bookType: type, bookSST: true, type: 'base64' }):
      XLSX.writeFile(wb, fn || ('Reporte.' + (type || 'xlsx')))
}

function exportToPDF(){
    var doc = new jsPDF('p','pt','letter')

    doc.setFontSize(10)

    for(let i=0; i<months.length; i++){
        let finalY = doc.previousAutoTable.finalY
        let startY = 30

        if(months[i].length>0){

            let text = "Meses adeudados: "+(i+1)
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
                styles: {
                    fontSize: 6,
                    valign: 'middle',
                    halign: 'right'
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
        }
    }
    //doc.save("table.pdf")
    window.open(doc.output('bloburl'), '_blank')
}