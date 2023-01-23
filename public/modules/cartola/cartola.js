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
    chargeCartolaTable()
    

    $('#searchCartola').on('click', async function () {
        chargeCartolaTable()
    })
    
})

function chargeCartolaTable() {

    try {

        if ($.fn.DataTable.isDataTable('#tableCartola')) {
            internals.cartola.table.clear().destroy()
        }

        internals.cartola.table = $('#tableCartola')
        .DataTable( {
            dom: 'Blfrtip',
            buttons: [
                {
                    extend: 'excel',
                    className: 'btn-excel',
                    exportOptions: {
                        columns: [ 0, 1, 2, 3, 5 ]
                    }
                },
                {
                    extend: 'pdf',
                    className: 'btn-pdf',
                    exportOptions: {
                        columns: [ 0, 1, 2, 3, 5 ]
                    }
                },
            ],
            iDisplayLength: 50,
            lengthMenu: [ [10, 25, 50, -1], [10, 25, 50, "Todo"] ],
            language: {
                url: spanishDataTableLang
            },
            responsive: false,
            columnDefs: [{ 
                            targets: [0], 
                            className: 'dt-center' 
                        },{
                            targets: [ 2, 3 ], 
                            className: 'dt-right' 
                        },{ 
                            targets: 4, 
                            className: 'dt-right',
                            render: $.fn.dataTable.render.number('.', '.', 0, '$ ') 
                        },{
                            targets: 5,
                            visible: false
                        },],
            order: [[ 0, 'asc' ]],
            ordering: true,
            rowCallback: function( row, data ) {
          },
          columns: [
            { data: 'date' },
            { data: 'paymentMethod' },
            { data: 'detail' },
            { data: 'number' },
            { data: 'amountSeparator' },
            { data: 'amount' }
            /*{ data: 'sector' },
            { data: 'name' },
            { data: 'transaction' },*/
          ],
          footerCallback: function (row, data, start, end, display) {
            var api = this.api();
 
            // Remove the formatting to get integer data for summation
            var intVal = function (i) {
                return typeof i === 'string' ? i.replace(/[\$,]/g, '') * 1 : typeof i === 'number' ? i : 0;
            };
 
            // Total over all pages
            total = api
                .column(5)
                .data()
                .reduce(function (a, b) {
                    return intVal(a) + intVal(b);
                }, 0);
 
            // Total over this page
            pageTotal = api
                .column(5, { page: 'current' })
                .data()
                .reduce(function (a, b) {
                    return intVal(a) + intVal(b);
                }, 0);
 
            // Update footer
            $(api.column(4).footer()).html('$ ' + dot_separators(total) + '');
            //$(api.column(4).footer()).html('$' + pageTotal + ' ( $' + total + ' total)');
        },
          initComplete: function (settings, json) {
            getCartola()
          }
        })

        $('#tableCartola tbody').off("click")

        $('#tableCartola tbody').on('click', 'tr', function () {
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

async function getCartola() {

    let query = {
        sector: $("#searchSector").val(), 
        paymentMethod: $("#searchPaymentMethod").val(),
        dateStart: $("#searchDate").data('daterangepicker').startDate.format('YYYY-MM-DD'),
        dateEnd: $("#searchDate").data('daterangepicker').endDate.format('YYYY-MM-DD')
    }

    console.log(query)

    let paymentData = await axios.post('api/paymentsByFilter', query)
    let payments = paymentData.data

    console.log(payments)
    
    if (payments.length > 0) {
        let formatData = payments.filter(el => {
            if(!el.members){
              return false
            }
            return true
          
        }).map(el => {

            el.date = moment(el.date).utc().format('DD/MM/YYYY')
            el.sector = el.members.address.sector.name
            el.number = el.members.number
            el.name = el.members.personal.name + ' ' + el.members.personal.lastname1 + ' ' + el.members.personal.lastname2
            if(el.members.type!='personal'){
                el.name = el.members.enterprise.name
            }

            el.detail = ''
            //console.log(el.members)
            //console.log(el.invoices)

            for(let i=0; i < el.invoices.length; i++){
                if(i>0){
                    el.detail = ', '
                }
                if(el.invoices[i].invoices){
                    if(el.members.number==157){
                        console.log(i,el.invoices[i].invoices)
                    }

                    if(el.invoices[i].invoices.type==33){
                        el.detail += 'FACTURA '
                    }else{
                        el.detail += 'BOLETA '
                    }
                    if(el.invoices[i].invoices.number){
                        el.detail += ' ' + el.invoices[i].invoices.number
                    }else{
                        el.detail += ' OTROS O SALDO ANTIGUO'
                    }
                }else{
                    el.detail += 'SALDO A FAVOR '
                }

                
            }

            //el.paymentMethod
            //el.transaction
            el.amountSeparator = el.amount
            //el.amount
            
            return el
        })

        if(formatData.length>0){
            internals.cartola.table.rows.add(formatData).draw()
        }else{
            toastr.warning('No se han encontrado datos de pagos')
        }
    } else {
        toastr.warning('No se han encontrado datos de pagos')
    }
    $('#loadingCartola').empty()
}
