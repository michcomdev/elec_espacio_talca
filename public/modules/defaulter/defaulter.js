let internals = {
    defaulter: {
        table: {},
        data: []
    },
    dataRowSelected: {}
}

let sectors, services
let parametersGeneral

$(document).ready(async function () {
    console.log('here')
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
                    className: 'btn-excel',
                    exportOptions: {
                        columns: [ 0, 1, 2, 3, 4, 5 ]
                    }
                },
                {
                    extend: 'pdf',
                    className: 'btn-pdf',
                    exportOptions: {
                        columns: [ 0, 1, 2, 3, 4, 5 ]
                    }
                },
            ],
            iDisplayLength: 10,
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
            rowCallback: function( row, data ) {
          },
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

    let query = {
        sector: $("#searchSector").val()/*, 
        paymentMethod: $("#searchPaymentMethod").val(),
        dateStart: $("#searchDate").data('daterangepicker').startDate.format('YYYY-MM-DD'),
        dateEnd: $("#searchDate").data('daterangepicker').endDate.format('YYYY-MM-DD')*/
    }

    console.log(query)

    let invoicesData = await axios.post('api/defaulters', query)
    let invoices = invoicesData.data

    console.log(invoices)
    
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
            
            return el
        })

        if(formatData.length>0){
            internals.defaulter.table.rows.add(formatData).draw()
        }else{
            toastr.warning('No se han encontrado datos de pagos')
        }
    } else {
        toastr.warning('No se han encontrado datos de pagos')
    }
    $('#loadingDefaulter').empty()
}
