let internals = {
    report: {
        table: {},
        data: []
    },
    dataRowSelected: {}
}

let clients = {}
let containerTypes = {}
let sites = {}
let cranes = {}

$(document).ready(async function () {
    chargeReportTable()
    //getParameters()
})

async function getParameters() {
    let clientsData = await axios.get('api/clients')
    clients = clientsData.data

}

function chargeReportTable() {
    try {
        if($.fn.DataTable.isDataTable('#tableReport')){
            internals.report.table.clear().destroy()
        }
        internals.report.table = $('#tableReport')
        .DataTable( {
            dom: 'Bfrtip',
            buttons: [
              'excel'
            ],
            iDisplayLength: 50,
            oLanguage: {
              sSearch: 'buscar: '
            },
            lengthMenu: [[50, 100, 500, -1], [50, 100, 500, 'Todos los registros']],
            language: {
                url: spanishDataTableLang
            },
            responsive: false,
            columnDefs: [{targets: [1,2,3,4,5,6], className: 'dt-right'}],
            order: [[ 0, 'asc' ]],
            ordering: true,
            rowCallback: function( row, data ) {
                $(row).find('td:eq(1)').html(dot_separators(data.stock));
                $(row).find('td:eq(2)').html(dot_separators(data.cost));
                $(row).find('td:eq(3)').html(dot_separators(data.price));
                $(row).find('td:eq(4)').html(dot_separators(data.sells));
                $(row).find('td:eq(5)').html(dot_separators(data.profitValue));
                $(row).find('td:eq(6)').html(dot_separators(data.profitPercentage)+'%');
          },
          columns: [
            { data: 'name' },
            { data: 'stock' },
            { data: 'cost' },
            { data: 'price' },
            { data: 'sells' },
            //{ data: 'monthSells' },
            { data: 'profitValue' },
            { data: 'profitPercentage' }
          ],
          initComplete: function (settings, json) {
            getReportEnabled()
          }
        })

        $('#tableReport tbody').off("click")

        $('#tableReport tbody').on('click', 'tr', function () {
            console.log($(this).hasClass('selected'))
            if ($(this).hasClass('selected')) {
                $(this).removeClass('selected')
                $('#updateProduct').prop('disabled', true)
            } else {
                internals.report.table.$('tr.selected').removeClass('selected');
                $(this).addClass('selected');
                $('#updateProduct').prop('disabled', false)
                //internals.report.data = internals.report.table.row($(this)).data()
                internals.dataRowSelected = internals.report.table.row($(this)).data()
            }
        })
      } catch (error) {
        console.log(error)
      }

}

async function getReportEnabled() {
    let reportData = await axios.get('api/report')
    console.log(reportData.data)
    if (reportData.data.length > 0) {
        let formatData= reportData.data.map(el => {
            el.datetime = moment(el.datetime).format('DD/MM/YYYY HH:mm')

            return el
        })

        internals.report.table.rows.add(formatData).draw()
        $('#loadingReport').empty()
    } else {
        console.log('vacio', reportData);
        toastr.warning('No se han encontrado datos de usuarios')
        $('#loadingReport').empty()
    }
}
