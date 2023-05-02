let internals = {
    members: {
        table: {},
        data: []
    },
    lectures: {
        table: {},
        data: []
    },
    invoices: [],
    dataRowSelected: {},
    productRowSelected: {}
}


let parameters
let activeChart

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

    setChart('sectors')
})

async function getParameters() {

    let firstYear = 2022
    for (let i = firstYear; i <= moment().format('YYYY'); i++) {
        $("#searchYear").append(`<option value="${i}">${i}</option>`)
    }
    
    let setYear = moment().format('YYYY')
    let setMonth = moment().format('MM')

    if(parseInt(moment().format('DD'))<25){
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
            acc += `<option value="${el._id}">${el.name}</option>`
            return acc
        },'')
    )

}

async function setChart(type){
    loadingHandler('start')
    $(".classChart").css('display','none')
    $("#btnExcel").css('display','none')
    $("#btnPDF").css('display','none')
    $("#tableSectorsBody").html('')
    $("#tableSectorsExcelBody").html('')
    $(".btnChart").removeClass('btn-success').addClass('btn-primary')

    activeChart = type, postLink = 'api/lecturesAllInvoices'
    let query = {
        sector: $("#searchSector").val(), 
        year: $("#searchYear").val(), 
        month: $("#searchMonth").val(),
        order: '0'
    }

    if(type=='actualPayment'){
        $("#btnActualPayment").removeClass('btn-primary').addClass('btn-success')
        $("#divActualPayment").css('display','block')
    
    }else if(type=='endMonth'){
        $("#btnEndMonth").removeClass('btn-primary').addClass('btn-success')
        $("#divEndMonth").css('display','block')
        postLink = 'api/lecturesAllPayments'
        let yearInvoice = parseInt($("#searchYear").val())
        let monthInvoice = parseInt($("#searchMonth").val()) - 1
        if(monthInvoice<1){
            yearInvoice--
            monthInvoice = 12
        }
        query = {
            sector: $("#searchSector").val(), 
            year: yearInvoice,
            month: monthInvoice,
            yearPayment: parseInt($("#searchYear").val()),
            monthPayment: parseInt($("#searchMonth").val()),
            order: $("#searchOrder").val(),
            onlyToken: true,
            noPayment: true
        }
    }else if(type=='sectors'){
        $("#btnSectors").removeClass('btn-primary').addClass('btn-success')
        $("#divSectors").css('display','block')
        $("#btnExcel").css('display','block')
        $("#btnPDF").css('display','block')
    }

    let allInvoices = await axios.post(postLink, query)

    let totalInvoices = 0, paid = 0, parcial = 0, unpaid = 0
    let sectors = []
    
    $("#searchSector > option").each(async function() {
        if($(this).val()!=0){
            sectors.push({
                sector: $(this).val(),
                name: $(this).text(),
                members: 0,
                meters: 0,
                consumption: 0,
                charge: 0,
                sewerage: 0
            })
        }
    })

    sectors.push({
        sector: '0',
        name: 'TOTAL',
        members: 0,
        meters: 0,
        consumption: 0,
        charge: 0,
        sewerage: 0
    })

    if (allInvoices.data.length > 0) {
        console.log(allInvoices.data)

        let formatData = allInvoices.data.filter(el => {

            let agreementsTotal = 0
            if(el.agreements){
                for(let i=0; i < el.agreements.length; i++){
                    agreementsTotal += parseInt(el.agreements[i].amount)
                }
            }
            
            let creditNote = '', status = 'VÁLIDA'
            if(el.annulment){
                creditNote = el.annulment.number
                status = 'ANULADA'
            }else{
                totalInvoices++

                console.log(totalInvoices, el.number)
                let actualSector = sectors.find(x => x.sector==el.members.address.sector)
                actualSector.members++
                actualSector.meters += el.lectureResult
                actualSector.consumption += el.meterValue * el.lectureResult + el.consumptionLimitTotal
                actualSector.charge += el.charge
                actualSector.sewerage += el.sewerage

                let totalSector = sectors.find(x => x.sector=='0')
                totalSector.members++
                totalSector.meters += el.lectureResult
                totalSector.consumption += el.meterValue * el.lectureResult + el.consumptionLimitTotal
                totalSector.charge += el.charge
                totalSector.sewerage += el.sewerage
            }

            let paymentAmount = 0, balance = el.invoiceSubTotal + agreementsTotal
            if(el.payment){
                paymentAmount = el.payment.amount
                balance -= el.payment.amount 
            }
           
            el.paymentStatus = ''

            if(balance>=paymentAmount){
                if(paymentAmount==0){
                    el.paymentStatus = 'IMPAGO'
                    if(!el.annulment) unpaid++
                }else{
                    el.paymentStatus = 'PARCIAL'
                    if(!el.annulment) parcial++
                }
            }else{
                el.paymentStatus = 'PAGADO'
                if(!el.annulment) paid++
            }

            return el
        })

        console.log(formatData)


        console.log('total: '+totalInvoices, 'paid: '+paid, 'parcial: '+parcial, 'unpaid: '+ unpaid)
        console.log(sectors)

        if(type=='actualPayment'){
            $("#chartActualPayment").css('display','block')

            $("#tableActualPaymentBody").html(`
                <tr><td>Pagadas</td><td>${paid}</td><td>${parseFloat(paid/totalInvoices*100).toFixed(1)} %</td></tr>
                <tr><td>Parciales</td><td>${parcial}</td><td>${parseFloat(parcial/totalInvoices*100).toFixed(1)} %</td></tr>
                <tr><td>Impagas</td><td>${unpaid}</td><td>${parseFloat(unpaid/totalInvoices*100).toFixed(1)} %</td></tr>
                <tr><th>TOTAL</th><th>${totalInvoices}</th><th>100 %</th></tr>
            `)
       
            chart = Highcharts.chart('chartActualPayment', {
                chart: {
                    type: 'pie',
                    options3d: {
                        enabled: true,
                        alpha: 45,
                        beta: 0
                    }
                },
                title: {
                    text: 'Pagos actuales'
                },
                accessibility: {
                    point: {
                        valueSuffix: '%'
                    }
                },
                tooltip: {
                    pointFormat: '{series.name} <b>{point.percentage:.1f}%</b>'
                },
                plotOptions: {
                    pie: {
                        allowPointSelect: true,
                        cursor: 'pointer',
                        depth: 35,
                        dataLabels: {
                            enabled: true,
                            format: '<b>{point.name}</b>: {point.percentage:.1f} %'
                        }
                    }
                },
                series: [{
                    type: 'pie',
                    name: '',
                    data: [
                        {
                            name: 'Pagadas', 
                            y: paid,
                            color: '#02B875'
                        },{
                            name: 'Impagas', 
                            y: unpaid,
                            color: '#F0AD4E'
                        },{
                            name: 'Parciales', 
                            y: parcial,
                            color: '#5AFDC1'
                        }
                    ]
                }]
            })

        }else if(type=='endMonth'){
            $("#chartEndMonth").css('display','block')

            $("#tableEndMonthBody").html(`
                <tr><td>Pagadas</td><td>${paid}</td><td>${parseFloat(paid/totalInvoices*100).toFixed(1)} %</td></tr>
                <tr><td>Parciales</td><td>${parcial}</td><td>${parseFloat(parcial/totalInvoices*100).toFixed(1)} %</td></tr>
                <tr><td>Impagas</td><td>${unpaid}</td><td>${parseFloat(unpaid/totalInvoices*100).toFixed(1)} %</td></tr>
                <tr><th>TOTAL</th><th>${totalInvoices}</th><th>100 %</th></tr>
            `)
        
            chart = Highcharts.chart('chartEndMonth', {
                chart: {
                    type: 'pie',
                    options3d: {
                        enabled: true,
                        alpha: 45,
                        beta: 0
                    }
                },
                title: {
                    text: 'Pagos final de mes'
                },
                accessibility: {
                    point: {
                        valueSuffix: '%'
                    }
                },
                tooltip: {
                    pointFormat: '{series.name} <b>{point.percentage:.1f}%</b>'
                },
                plotOptions: {
                    pie: {
                        allowPointSelect: true,
                        cursor: 'pointer',
                        depth: 35,
                        dataLabels: {
                            enabled: true,
                            format: '<b>{point.name}</b>: {point.percentage:.1f} %'
                        }
                    }
                },
                series: [{
                    type: 'pie',
                    name: '',
                    data: [
                        {
                            name: 'Pagadas', 
                            y: paid,
                            color: '#02B875'
                        },{
                            name: 'Impagas', 
                            y: unpaid,
                            color: '#F0AD4E'
                        },{
                            name: 'Parciales', 
                            y: parcial,
                            color: '#5AFDC1'
                        }
                    ]
                }]
            })

        }else if(type=='sectors'){
            $("#tableSectors").css('display','block')

            for(let j=0; j<sectors.length; j++){
                if(j+1<sectors.length){
                    $("#tableSectorsBody").append(`
                        <tr>
                            <td style="text-align: left">${sectors[j].name}</td>
                            <td style="text-align: center">${sectors[j].members}</td>
                            <td style="text-align: right">${dot_separators(sectors[j].meters)}</td>
                            <td style="text-align: right">${dot_separators(sectors[j].consumption)}</td>
                            <td style="text-align: right">${dot_separators(sectors[j].charge)}</td>
                            <td style="text-align: right">${dot_separators(sectors[j].sewerage)}</td>
                        </tr>
                    `)
                }else{
                    $("#tableSectorsBody").append(`
                        <tr>
                            <th style="text-align: left">${sectors[j].name}</th>
                            <th style="text-align: center">${sectors[j].members}</th>
                            <th style="text-align: right">${dot_separators(sectors[j].meters)}</th>
                            <th style="text-align: right">${dot_separators(sectors[j].consumption)}</th>
                            <th style="text-align: right">${dot_separators(sectors[j].charge)}</th>
                            <th style="text-align: right">${dot_separators(sectors[j].sewerage)}</th>
                        </tr>
                    `)
                }
                $("#tableSectorsExcelBody").append(`
                    <tr>
                        <td>${sectors[j].name}</td>
                        <td>${sectors[j].members}</td>
                        <td>${sectors[j].meters}</td>
                        <td>${sectors[j].consumption}</td>
                        <td>${sectors[j].charge}</td>
                        <td>${sectors[j].sewerage}</td>
                    </tr>
                `)
            }
        }


        loadingHandler('stop')
        $('#loadingMembers').empty()
    } else {
        loadingHandler('stop')
        //toastr.warning('No se han encontrado ventas en el rango seleccionado')
        $('#loadingMembers').empty()
    }
}

$('#searchMembers').on('click', async function () {
    setChart(activeChart)
})

function ExportToExcel(type, fn, dl) {
    let tableName = ''
    if(activeChart=='sectors'){
        tableName = 'tableSectorsExcel'
    }else{
        toastr.warning('No se puede exportar tabla/gráfico seleccionado')
        return
    }


    var elt = document.getElementById(tableName)
    var wb = XLSX.utils.table_to_book(elt, { sheet: "Hoja1" })
    return dl ?
      XLSX.write(wb, { bookType: type, bookSST: true, type: 'base64' }):
      XLSX.writeFile(wb, fn || ('Reporte.' + (type || 'xlsx')))
}

function exportToPDF(){

    let tableName = ''
    let columnStyles 
    if(activeChart=='sectors'){
        tableName = 'tableSectorsExcel'
        columnStyles = {
            //0: {cellWidth: 20},
            //1: {cellWidth: 120, halign: 'left'},
            2: { halign: 'right' },
            3: { halign: 'right' },
            4: { halign: 'right' },
            5: { halign: 'right' }
        }
    }else{
        toastr.warning('No se puede exportar tabla/gráfico seleccionado')
        return
    }

    var doc = new jsPDF('l','pt','letter')
    doc.autoTable({ 
        html: "#"+tableName,
        styles: {
            fontSize: 6,
            valign: 'middle'
            //halign: 'center'
        },
        columnStyles: columnStyles,
        /*didParseCell: (hookData) => {
            if (hookData.section === 'head') {
                if (hookData.column.dataKey === '1') {
                    hookData.cell.styles.halign = 'left';
                }
            }
        }*/
    })
    doc.save("table.pdf")
}


