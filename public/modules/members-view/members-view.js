let internals = {
    lectures: {
        table: {},
        data: []
    },
    dataRowSelected: {}
}


$(document).ready(async function () {
    // getLectures()
    // let sessionResult = await axios('api/session')
    // let userCredentials = sessionResult.data
    chargeClientsTable()
})


function chargeClientsTable() {
    try {
        internals.lectures.table = $('#tableLecturesMember')
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
                iDisplayLength: 50,
                oLanguage: {
                    sSearch: 'buscar: '
                },
                language: {
                    url: spanishDataTableLang
                },
                responsive: false,
                order: [[0, 'desc']],
                ordering: true,
                rowCallback: function (row, data) {
                },
                columns: [
                    { data: '_id' },
                    { data: 'year' },
                    { data: 'month' },
                    { data: 'member' }
                ],
                initComplete: function (settings, json) {
                    getLectures()
                }
            })

        // $('#tableLecturesMember tbody').on('click', 'tr', function () {
        //     if ($(this).hasClass('selected')) {
        //         $(this).removeClass('selected')
        //         disAbleButt(true)
        //     } else {
        //         internals.clients.table.$('tr.selected').removeClass('selected')
        //         $(this).addClass('selected')
        //         disAbleButt(false)
        //         internals.clients.data = internals.clients.table.row($(this)).data()
        //         internals.rowSelected = internals.clients.table.row($(this))
        //     }
        // })
    } catch (error) {
        console.log(error)
    }
}


// function handleModal(sectorSelected) {
//     $('#modal').modal('show');
//     $('#modal_title').html(`${(sectorSelected) ? 'Modificar sector ' : 'Nuevo sector'}`)
//     $('#modal_body').html( /*html*/`
//         <div class="row">
//             <div class="col-md-6" style="margin-top:10px;">
//                 <h6>Nombre del sector</h6>
//                 <input id="sectorName" type="text" value="${(sectorSelected) ? sectorSelected.name : ''}" class="form-control border-input">
//             </div>

//             <div class="col-md-6" id="sectorErrorMessage"></div>

//         </div>
//     `)

//     $('#modal_footer').html( /*html*/`
//         <button style="border-radius: 5px;" class="btn btn-dark" data-dismiss="modal">
//             <i style="color:#e74c3c;" class="fas fa-times"></i> CANCELAR
//         </button>

//         <button style="border-radius:5px;" class="btn btn-dark" id="saveSector">
//             <i style="color:#3498db;" class="fas fa-check"></i> GUARDAR
//         </button>
//     `)
// }



async function getLectures() {
    console.log("a");
    let lecturesData = await axios.post('api/lecturesSingleMember', { member: "62631b789666da52dcc90718" })
    if (lecturesData.data.length > 0) {
        let formatData = lecturesData.data.map(el => {
            return el
        })

        console.log("format data", formatData);

        internals.lectures.table.rows.add(formatData).draw()
        $('#loadingLectureMembers').empty()
    } else {
        console.log("pasa a else");
        toastr.warning('No se han encontrado datos de lecturas')
        $('#loadingLectureMembers').empty()
    }
}