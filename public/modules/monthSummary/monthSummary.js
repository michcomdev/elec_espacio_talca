let internals = {
    cartola: {
        table: {},
        data: []
    },
    dataRowSelected: {}
}

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
                        columns: [ 0, 1, 2, 3, 9, 10, 11, 12, 13 ]
                    }
                },
                {
                    extend: 'pdf',
                    className: 'btn-pdf',
                    exportOptions: {
                        columns: [ 0, 1, 2, 3, 9, 10, 11, 12, 13 ]
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
                            targets: [0,1,2], 
                            className: 'dt-center' 
                        },{
                            targets: [ 4,5,6,7,8 ], 
                            className: 'dt-right',
                            render: $.fn.dataTable.render.number('.', '.', 0, '$ ') 
                        },{
                            targets: [ 9, 10, 11, 12, 13 ],
                            visible: false
                        },
                    ],
            order: [[ 0, 'asc' ]],
            ordering: true,
            columns: [
                { data: 'date' },
                { data: 'first' },
                { data: 'last' },
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

                console.log(row)
                if($(row).find('td:eq(0)').text()=='TOTAL'){
                    $(row).find('td:eq(0)').html(`<label style="font-weight: bold">$ ${dot_separators(data.date)}</label>`)
                    $(row).find('td:eq(4)').html(`<label style="font-weight: bold">$ ${dot_separators(data.EFECTIVO)}</label>`)
                    $(row).find('td:eq(5)').html(`<label style="font-weight: bold">$ ${dot_separators(data.CHEQUE)}</label>`)
                    $(row).find('td:eq(6)').html(`<label style="font-weight: bold">$ ${dot_separators(data.REDCOMPRA)}</label>`)
                    $(row).find('td:eq(7)').html(`<label style="font-weight: bold">$ ${dot_separators(data.TRANSFERENCIA)}</label>`)
                    $(row).find('td:eq(8)').html(`<label style="font-weight: bold; color: red">$ ${dot_separators(data.TOTAL)}</label>`)
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

// function cleanData(data) {
//     data.rut = ktoK(cleanRut(data.rut))

//     return data
// }

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

    let arrayObjects = []
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
            first: 0,
            last: 0,
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
        first: 0,
        last: 0,
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
                        
            //actual.payments.push()
            actual.first = 1
            actual.last = 2
            actual.voucher = ''
            actual[el.paymentMethod] += el.amount
            actual.TOTAL += el.amount


            last.first = ''
            last.last = ''
            last.voucher = ''
            last[el.paymentMethod] += el.amount
            last.TOTAL += el.amount

            
            //return el
        })

        console.log('formatData',arrayObjects)
        if(arrayObjects.length>0){
            let newArray = arrayObjects.filter(function( obj ) {
                return obj.first !== 0;
            })
            internals.cartola.table.rows.add(newArray).draw()
        }else{
            toastr.warning('No se han encontrado datos de pagos')
        }
    } else {
        toastr.warning('No se han encontrado datos de pagos')
    }
    $('#loadingSummary').empty()
}
