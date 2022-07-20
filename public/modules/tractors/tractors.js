let internals = {
    sectors: {
        table: {},
        data: []
    },
    dataRowSelected: {}
}

$(document).ready(async function () {
    getTractors()
})


function chargeLecturesTable() {
    try {

        if ($.fn.DataTable.isDataTable('#tableSectors')) {
            internals.sectors.table.clear().destroy()
        }

        internals.sectors.table = $('#tableSectors')
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
                language: {
                    url: spanishDataTableLang
                },
                responsive: false,
                order: [[0, 'asc']],
                ordering: true,
                rowCallback: function (row, data) {

                },
                columns: [
                    { data: 'name' }
                ],
                initComplete: function (settings, json) {
                    getLectures()
                }
            })

        $('#tableSectors tbody').off("click")

        $('#tableSectors tbody').on('click', 'tr', function () {
            if ($(this).hasClass('selected')) {
                $(this).removeClass('selected')
                $('#updateSector').prop('disabled', true)
            } else {
                internals.sectors.table.$('tr.selected').removeClass('selected');
                $(this).addClass('selected');
                $('#updateSector').prop('disabled', false)
                internals.sectors.data = internals.sectors.table.row($(this)).data()
                internals.dataRowSelected = internals.sectors.table.row($(this)).data()
            }
        })
    } catch (error) {
        console.log(error)
    }
}



$('#updateSector').on('click', function () { //MODIFICAR USUARIO
    handleModal(internals.sectors.data)
    
    $('#saveSector').on('click', async function () {
        internals.sectors.data.name = $('#sectorName').val().trim()

        if (internals.sectors.data.name.length > 1) {
            let sectorUpdateData = await axios.post('api/sectorUpdate', internals.sectors.data)
            if (sectorUpdateData.data.error) {
                toastr.warning(sectorUpdateData.data.error)
            } else {
                toastr.success('Sector modificado correctamente')

                chargeLecturesTable()

                $('#modal').modal('hide')
            }
        }
    })
})

$('#createSector').on('click', async function () { // CREAR SECTOR
    handleModal()

    $('#saveSector').on('click', async function () {
        let sectorData = {
            name: $('#sectorName').val()
        }

        if (sectorData.name.length > 1) {
            let newSectorData = await axios.post('api/createSector', sectorData)
            if (newSectorData.data.error) {
                toastr.warning(newSectorData.data.error)
            } else {
                toastr.success('Sector creado correctamente')
                let sectorAdded = internals.sectors.table.row
                    .add(newSectorData.data)
                    .draw()
                    .node()

                $(sectorAdded).css('color', '#1abc9c')
                setTimeout(() => {
                    $(sectorAdded).css('color', '#484848')
                }, 5000)

                $('#modal').modal('hide')
            }
        }
    })
})

function handleModal(sectorSelected) {
    $('#modal').modal('show');
    $('#modal_title').html(`${(sectorSelected) ? 'Modificar sector ' : 'Nuevo sector'}`)
    $('#modal_body').html( /*html*/`
        <div class="row">
            <div class="col-md-6" style="margin-top:10px;">
                <h6>Nombre del sector</h6>
                <input id="sectorName" type="text" value="${(sectorSelected) ? sectorSelected.name : ''}" class="form-control border-input">
            </div>

            <div class="col-md-6" id="sectorErrorMessage"></div>

        </div>
    `)

    $('#modal_footer').html(`
        <button style="border-radius: 5px;" class="btn btn-dark" data-dismiss="modal">
            <i style="color:#e74c3c;" class="fas fa-times"></i> CANCELAR
        </button>

        <button style="border-radius:5px;" class="btn btn-dark" id="saveSector">
            <i style="color:#3498db;" class="fas fa-check"></i> GUARDAR
        </button>
    `)
}



async function getLectures() {
    let sectorData = await axios.get('api/sectors')
    
    if (sectorData.data.length > 0) {
        let formatData = sectorData.data.map(el => {
            return el
        })

        // formatData.sort((a, b) => (a.name > b.name) * 2 - 1)
        internals.sectors.table.rows.add(formatData).draw()
        $('#loadingSectors').empty()
    } else {
        console.log("pasa a else");
        toastr.warning('No se han encontrado datos de sectores')
        $('#loadingSectors').empty()
    }
}

async function getTractors() {
    let tractorData = await axios.get('api/tractors')
    let data = tractorData.data
    console.log(data)

    for(let i=0; i<data.length; i++){
        $("#list").append(`
            <div class="col-md-6 table-responsive">

                <div class="card border-primary">
                    <div class="card-header text-white bg-primary">
                        <b>Patente ${data[i].plate}</b>
                    </div>
                    <div class="card-body">
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-4" style="text-align: center;">
                                    <img src="${data[i].photo}" style="max-width: 150px; max-height: 150px;"/>
                                </div>
                                <div class="col-md-4">
                                    <table>
                                        <tr>
                                            <td>Marca</td>
                                            <td>&nbsp;</td>
                                            <td>${data[i].brand}</td>
                                        </tr>
                                        <tr>
                                            <td>Modelo</td>
                                            <td>&nbsp;</td>
                                            <td>${data[i].model}</td>
                                        </tr>
                                        <tr>
                                            <td>Patente</td>
                                            <td>&nbsp;</td>
                                            <td>${data[i].plate}</td>
                                        </tr>
                                    </table>
                                </div>
                                <div class="col-md-4">
                                    <div id="${data[i]._id}">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                   
            </div>`
        )

        new QRCode(document.getElementById(data[i]._id), {
            text: `{ id: "${data[i]._id}" }`,
            width: 150,
            height: 150
        })
        
    }
    /*
    if (tractorData.data.length > 0) {
        let formatData = tractorData.data.map(el => {
            return el
        })

        // formatData.sort((a, b) => (a.name > b.name) * 2 - 1)
        internals.sectors.table.rows.add(formatData).draw()
        $('#loadingSectors').empty()
    } else {
        console.log("pasa a else");
        toastr.warning('No se han encontrado datos de sectores')
        $('#loadingSectors').empty()
    }*/
}