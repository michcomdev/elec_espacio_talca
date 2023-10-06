let clients;
let containerData = document.getElementById("containerClientData");
let containerGuia = document.getElementById("containerClientGuia");
let clientList = document.getElementById("clientList");
let handleSwitch = true
$(document).ready(async function () {
    loadSwitchboards();
    //testAjax()
    //loadInstructivesTable()
    //$("#modalMeter").modal('show')
});

async function loadSwitchboards() {
    let clientsData = await axios.get("api/getAllClients");
    clients = clientsData.data;
    console.log("aaaaasdas", clients);


    clients.forEach((e, index) => {

        $("#clientList").append(`
                <button
                    id="meterButton${index}"
                    class="btn btn-list"
                    onclick="handleShowMeterinfo(${index})" 
                    style="
                    margin-bottom:5px;
                    width: 17vw; 
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    ">
                    <div style="display: flex;
                    flex-direction: column;
                    align-items: flex-start;">
                        <p style="margin-bottom: -3px;font-size: 18px;">${e.name} ${e.lastname}</p>
                        <p style="margin-bottom: -3px;font-size: 12px;">${e.rut} </p>
                    </div>    
                    <i class="fas fa-caret-right"></i>
                </button>
            `);
    });
}

function handleShowMeterinfo(data) {
    console.log('clientName' + data);
    containerGuia.style.display = "none";
    containerData.style.display = "flex";
    containerData.innerHTML = "";

    const client = clients[data]; // Obtén el cliente correspondiente

    $("#containerClientData").append(`
        <div style="display:flex; flex-direction:column; justify-content:center; align-items:center;">
            <h4 style="font-size:35px !important">${client.name} ${client.lastname}</h4>
            
            <div style="display:flex; flex-direction:column; justify-content:center; align-items:flex-start; margin-bottom:25px">
                <label for="clientName"style="font-size:15px"  class="form-label">Nombre</label>
                <input id="clientName" type="text" class="form-control" style="width:30vw; font-size:20px" disabled readonly value="${client.name}">
            </div>

            <div style="display:flex; flex-direction:column; justify-content:center; align-items:flex-start;margin-bottom:25px">
                <label for="clientLastName" style="font-size:15px" class="form-label">Apellido</label>
                <input id="clientLastName" type="text" class="form-control" style="width:30vw;font-size:20px" disabled readonly value="${client.lastname}">
            </div>

            <div style="display:flex; flex-direction:column; justify-content:center; align-items:flex-start;margin-bottom:25px">
                <label for="clientRut" style="font-size:15px" class="form-label">Rut</label>
                <input id="clientRut" type="text" class="form-control" style="width:30vw;font-size:20px" disabled readonly value="${client.rut}">
            </div>
           
            <div style="display:flex; flex-direction:column; justify-content:center; align-items:flex-start;margin-bottom:25px">
                <label for="clientPhoneNumber" style="font-size:15px" class="form-label">Número telefónico</label>
                <input id="clientPhoneNumber" type="text" class="form-control" style="width:30vw;font-size:20px" disabled readonly value="${client.phoneNumber}">
            </div>

            <div style="margin-top: 5vh; display: flex; justify-content: flex-end; width: 100%;">
            <button type="button" class="btn btn-danger" id="cancelButton" style="display: none; margin-right:1vw;">Cancelar</button>
            <button type="button" class="btn btn-primary" id="saveButton" style="display: none;">Guardar</button>
            <button type="button" class="btn btn-primary" style="width:100%" id="editButton">Editar</button>
        </div>
        </div>
    `);

    // Asigna el manejador de eventos al botón de editar
    $("#editButton").on("click", handleEditClient);
    $("#cancelButton").on("click", function () {
        handleCancelEdit(data);
    });
    $("#saveButton").on("click", function () {
        handleSaveEdit(data);
    });
}


function handleEditClient() {
    // handleSwitch = false;

    // Oculta el botón "Editar" y muestra "Cancelar" y "Guardar"
    $("#editButton").hide();
    $("#cancelButton, #saveButton").show();

    // Habilita los campos de edición
    $("#clientName, #clientLastName, #clientRut, #clientPhoneNumber").prop("disabled", false);
    $("#clientName, #clientLastName, #clientRut, #clientPhoneNumber").prop("readonly", false);

}

function handleCancelEdit(index) {

    // Muestra el botón "Editar" y oculta "Cancelar" y "Guardar"


    $("#editButton").show();
    $("#cancelButton, #saveButton").hide();
    $("#clientName").prop("value", data.name);
    $("#clientLastName").prop("value", data.lastname);
    $("#clientRut").prop("value", data.rut);
    $("#clientPhoneNumber").prop("value", data.phoneNumber);

    // Deshabilita los campos de edición
    $("#clientName, #clientLastName, #clientRut, #clientPhoneNumber").prop("disabled", true);
    $("#clientName, #clientLastName, #clientRut, #clientPhoneNumber").prop("readonly", true);


}

async function handleSaveEdit(index) {
    let clientId = clients[index]
    // console.log(data._id);
    let dataName = $("#clientName").val()
    let dataLastName = $("#clientLastName").val()
    let dataRut = $("#clientRut").val()
    let dataPhoneNumber = $("#clientPhoneNumber").val()
    let data = {
        name: dataName,
        lastname: dataLastName,
        rut: dataRut,
        phoneNumber: dataPhoneNumber,
        clientId: clientId
    }
    // Implementa lógica para guardar los cambios si es necesario
    let response = await axios.post("api/updateClientById", data);
    if (response.data) {
        Swal.fire({
            icon: "success",
            title: "Cliente actualizado",
            text: "Los datos del cliente se actualizaron de manera exitosa"

        }).then(async () => {
            clientList.innerHTML = ""
            await loadSwitchboards()
            handleShowMeterinfo(index)

        })
    } else {
        Swal.fire({
            icon: "error",
            title: "upss..",
            text: "Los datos del cliente no se actualizaron correctamente"

        })
    }

    // Muestra el botón "Editar" y oculta "Cancelar" y "Guardar"
    $("#editButton").show();
    $("#cancelButton, #saveButton").hide();

    // Deshabilita los campos de edición
    $("#clientName, #clientLastName, #clientRut, #clientPhoneNumber").prop("disabled", true);
}
function HandleModalClient() {
    console.log("aqui estoy");
    $('#modalAddClient').modal('show');
    $('#modal_title').html(`Añadir Cliente`);
    $('#modal_body').html(/*html*/`
        <div style="display:flex; flex-direction:column; justify-content:center; align-items:center;">
            <div style="display:flex; flex-direction:column; justify-content:center; align-items:flex-start;width:80%; margin-bottom:15px">
                <label for="meterName" class="form-label">Nombre</label>
                <input type="text" class="form-control" id="clientName" placeholder="">
            </div>
            <div style="display:flex; flex-direction:column; justify-content:center; align-items:flex-start;width:80%; margin-bottom:15px">
                <label for="meterAddress" class="form-label">Apellido</label>
                <input type="text" class="form-control" id="clientLastname" placeholder="">
            </div>
            <div style="display:flex; flex-direction:column; justify-content:center; align-items:flex-start;width:80%; margin-bottom:15px">
                <label for="selectClients" class="form-label">Rut</label>
                <input type="text" class="form-control" id="clientRut" placeholder="">
            </div>
            <div style="display:flex; flex-direction:column; justify-content:center; align-items:flex-start;width:80%; margin-bottom:15px>
                <label for="meterNumberSerie" class="form-label">Numero telefonico</label>
                <input type="number" class="form-control" id="clientphoneNumber" placeholder="">
            </div>
        </div>
    `);

    $('#modal_footer').html(`
        <button style="border-radius: 5px;" class="btn btn-dark" data-dismiss="modal">
            <i style="color:#e74c3c;" class="fas fa-times"></i> CANCELAR
        </button>

        <button style="border-radius:5px;" class="btn btn-dark" onclick="handleNewMeter()">
            <i style="color:#3498db;" class="fas fa-check"></i> GUARDAR
        </button>
    `);

}
// function showMeters(index) {

//     $("#switchboardButton" + index).attr('disabled', true)
//     $("#switchboardButton" + index).html('<i class="fa fa-spinner fa-pulse fa-fw"></i>')
//     try {
//         if ($.fn.DataTable.isDataTable('#tableMeters')) {
//             tableMeters.clear().destroy()
//         }
//         tableMeters = $('#tableMeters')
//             .DataTable({
//                 dom: 'Bfrtip',
//                 buttons: ['excel', 'pdf'],
//                 iDisplayLength: 100,
//                 responsive: false,
//                 //order: [[0, 'desc']],
//                 columnDefs: [{ targets: [0, 1, 3, 4, 5], className: 'dt-center' }],
//                 ordering: true,
//                 rowCallback: function (row, data) {
//                 },
//                 language: {
//                     url: spanishDataTableLang
//                 },
//                 columns: [
//                     { data: 'address' },
//                     { data: 'name' },
//                     { data: 'client' },
//                     { data: 'lastDate' },
//                     { data: 'status' },
//                     { data: 'lastLecture' }
//                 ],
//                 initComplete: function (settings, json) {
//                     getMeters(index)
//                 }
//             })
//         $('#tableMeters tbody').off('click')
//         $('#tableMeters tbody').on('click', 'tr', function () {
//             showMeterData(tableMeters.row($(this)).data())
//             /*if ($(this).hasClass('selected')) {
//                 $(this).removeClass('selected')
//                 disAbleButt(true)
//             } else {
//                 tableMeters.$('tr.selected').removeClass('selected')
//                 $(this).addClass('selected')
//                 disAbleButt(false)
//                 internals.instructives.data = tableMeters.row($(this)).data()
//                 internals.rowSelected = tableMeters.row($(this))
//             }*/
//         })
//     } catch (error) {
//         console.log(error)
//         $("#switchboardButton" + index).removeAttr('disabled')
//         $("#switchboardButton" + index).html('Mostrar Medidores')
//     }
// }

// async function getMeters(index) {

//     let lecturesData
//     try {
//         lecturesData = await axios.get('api/allLectures/' + switchboards[index]._id)
//     } catch (err) {
//         console.log('error', err.message)
//     }
//     let lectures
//     if (lecturesData) {
//         lectures = lecturesData.data
//     }
//     //console.log(lectures)

//     if (switchboards[index].meters.length > 0) {
//         let formatData = switchboards[index].meters.map(el => {

//             el.client = el.clients.lastname + ' ' + el.clients.name

//             if (lectures) {
//                 let lecture = lectures.find(x => x.primaryAddress == el.address)
//                 el.lastDate = moment().format('DD/MM/YYYY HH:mm')
//                 el.status = '<i class="fas fa-check-circle" style="color: green"></i> Activo'
//                 el.lastLecture = (lecture.dataPoints[0].value / 100).toFixed(2)
//             } else {
//                 el.status = '<i class="fas fa-minus-circle" style="color: red"></i> Desconectado'
//                 el.lastDate = moment(el.lastDate).format('DD/MM/YYYY HH:mm')
//                 el.lastLecture = (el.lastLecture / 100).toFixed(2)

//             }

//             return el
//         })

//         tableMeters.rows.add(formatData).draw()
//         console.log(formatData)
//         //manualSave(index)
//         $("#switchboardButton" + index).removeAttr('disabled')
//         $("#switchboardButton" + index).html('Mostrar Medidores')
//     } else {
//         toastr.warning('No se han encontrado datos dentro del rango')
//         $("#switchboardButton" + index).removeAttr('disabled')
//         $("#switchboardButton" + index).html('Mostrar Medidores')
//     }
// }

// async function showMeterData(meter) {

//     ///////////HEADER///////////

//     //let statusIcon = '<i class="fas fa-check-circle" style="color: green"></i>'
//     $("#meterImg").attr('src', '/public/img/meter_light.png')
//     if (meter.status == '<i class="fas fa-minus-circle" style="color: red"></i> Desconectado') {
//         //statusIcon = '<i class="fas fa-minus-circle" style="color: red"></i>'
//         $("#meterImg").attr('src', '/public/img/meter.png')
//     }
//     $("#meterValue").css('font-size', '34px')

//     console.log(meter.lastLecture)

//     let meterValue = parseFloat(meter.lastLecture)// / 100
//     //let meterValue = 100
//     if (meterValue >= 100) {
//         meterValue = meterValue.toFixed(1)
//         $("#meterValue").css('font-size', '28px')
//         if (meterValue >= 1000) {
//             $("#meterValue").css('font-size', '25px')
//         }
//     } else {
//         meterValue = meterValue.toFixed(2)
//     }

//     $("#meterValue").text(meterValue)

//     $("#modalMeter_title").text(`N° ${meter.address} - ${meter.client}`)
//     $("#tableMeter").html(`
//         <tr>
//             <td>Cliente</td>
//             <th>${meter.client}</th>
//         </tr>
//         <tr>
//             <td>N° serie</td>
//             <th>${meter.serialNumber}</th>
//         </tr>
//         <tr>
//             <td>Estado</td>
//             <th>${meter.status}</th>
//         </tr>`)

//     /////////TABLA HISTÓRICA/////////
//     let meterData = await axios.get('api/meterByID/' + meter._id) //Para obtener datos guardados
//     let meterHistory = meterData.data.lectures

//     console.log(meterHistory)

//     //$("#tableMeterHistoryBody").html('')

//     if ($.fn.DataTable.isDataTable('#tableMeterHistory')) {
//         console.log('here1')
//         tableMeterHistory.clear().destroy()
//         console.log('here2')
//     }

//     for (let i = 0; i < meterHistory.length; i++) {
//         $("#tableMeterHistoryBody").append(`
//             <tr>
//                 <td style="text-align: center">${i}</td>
//                 <td style="text-align: center">${moment(meterHistory[i].date).format('DD/MM/YYYY HH:mm')}</td>
//                 <td style="text-align: center">${(meterHistory[i].value / 100).toFixed(2)}</td>
//             </tr>`)
//     }

//     tableMeterHistory = $('#tableMeterHistory')
//         .DataTable({
//             dom: 'Bfrtip',
//             buttons: ['excel', 'pdf'],
//             iDisplayLength: 10,
//             responsive: false,
//             order: [[0, 'desc']],
//             columnDefs: [
//                 { targets: 0, visible: false },
//                 { targets: [1, 2], className: 'dt-center' }
//             ],
//             //ordering: true,
//             rowCallback: function (row, data) {
//             },
//             language: {
//                 url: spanishDataTableLang
//             }
//         })

//     $("#modalMeter").modal('show')

// }

// async function manualSave(index) {
// name
// lastname
// rut
// phoneNumber

//     let save = await axios.get('api/allLecturesSave/' + switchboards[index]._id)
//     console.log(save)
//     if (save) {
//         toastr.success('Almacenado correctamente')
//     } else {
//         toastr.danger('Ha ocurrido un error')
//     }

//     /*let metersArray = switchboards[index].meters
//     for(let i=0; i<metersArray.length; i++){
//         console.log(metersArray[i])
//     }*/

// }
