
let switchboards = []
let meters = []
let clients = []
let switchboardsId
let meterList = document.getElementById('meterList')
let meterDiv = document.getElementById("meterDiv");
let textIndex = document.getElementById("textIndex");
let containerData = document.getElementById("containerData");
let containerGuia = document.getElementById("containerGuia");





$(document).ready(async function () {
    getSwitchboards();
    getClients()
});
async function getClients() {
    let tempData = await axios.get("/api/getAllClients")
    clients = tempData.data
    // console.log(tempData);
}
function HandleMeters(i) {
    containerData.style.display = 'none';
    containerGuia.style.display = "flex";
    textIndex.innerHTML = 'Seleccione una central';
    meterList.innerHTML = '';
    meterDiv.style.display = 'flex';
    meters = switchboards[i].meters;
    switchboardsId = switchboards[i]._id;

    console.log(switchboardsId);

    // Añadir el botón "Añadir nuevo cliente" al principio de la lista
    $("#meterList").prepend(/*html*/`
      <div style="
        background-color: #2c3e50;
        width: 100%;
        height: 60px;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-bottom: 20px;

      ">
        <button id="meterButtonAdd" class="btn btn-list" style="
          margin-bottom: 5px;
          width: 17vw;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #fff;
          background-color: transparent;
        " onfocus="this.blur();" onclick="HandleModalMeter(0)">
          <div style="display: flex; flex-direction: column; align-items: flex-start;">
            <p style="margin-bottom: -3px; font-size: 18px">Añadir nuevo cliente</p>
          </div>
          <i class="fas fa-plus"></i>
        </button>
      </div>
    `);

    if (meters.length > 0) {
        // Agregar los elementos generados por el forEach
        meters.forEach((e, index) => {
            $("#meterList").append(/*html*/`
                <button id="meterButton${index}" class="btn btn-list" onclick="handleShowMeterinfo(${index})" style="margin-bottom: 5px; width: 18vw;">
                    <div style="display: flex; flex-direction: column; align-items: flex-start;">
                        <p style="margin-bottom: -3px; font-size: 18px;">${e.name}</p>
                    </div>
                    <i class="fas fa-caret-right"></i>
                </button>
            `);
        });
    }
}

async function getSwitchboards() {
    let TempSwitchboards = await axios.get("api/switchboards");
    switchboards = TempSwitchboards.data;
    console.log(switchboards);

    for (let i = 0; i < switchboards.length; i++) {
        // const switchboardData = JSON.stringify(switchboards[i]);

        $("#SwitchBoardList").append(`
            <button 
                id="switchboardButton${i}" 
                class="btn btn-list"  
                onclick="HandleMeters('${i}')" 
                style="margin-bottom:5px;margin-right:3px;width:17vw">
                <div style="display:flex; flex-direction:column;align-items: flex-start;">
                    <p style="margin-bottom: -3px;font-size: 18px;">${switchboards[i].name}</p>
                    <p style="margin-bottom: -2px;font-size: 12px;">${switchboards[i].ip_address}</p>
                </div>
                <i class="fas fa-caret-right"></i>
            </button>
        `);

    }
    console.log(switchboards[0]);
}

//============================================= MODAL FUNCTIONS ==============================================================





function selectCharge() {

    clients.forEach((e, index) => {
        $("#selectClients").append(`
            <option value="${e._id}">${e.name + " " + e.lastname}</option>
        `);
        if (clients.length == (index + 1)) {
            $("#selectClients").append(`
            <option value=0>Add</option>
        `);
        }
    })
}
// let meterName = ""
// let meterAddress = ""
// let meterClient
// let meterNumberSerie = 0
async function handleNewMeter() {

    let meterName = $('#meterName').val();
    let meterAddress = $('#meterAddress').val();
    let meterClient = $('#selectClients').val();
    let meterNumberSerie = parseInt($('#meterNumberSerie').val());
    let meterData = {
        name: meterName,
        address: meterAddress,
        clients: meterClient,
        serialNumber: meterNumberSerie,
        switchId: switchboardsId
    }
    let post = await axios.post('/api/postMeter', meterData)
    // console.log("PPOOPOPOPOSTT", post);
    // getSwitchboards();

    // Close the modal if needed
    $('#modalAddMeter').modal('hide');

}
async function handleNewSwitchboard() {
    console.log("ENTREEEE");
    let switchboardName = $('#switchboardName').val();
    let switchboardAddress = $('#switchboardAddress').val();
    let switchboardToken = parseInt($('#switchboardToken').val());
    let switchboardData = {
        name: switchboardName,
        ip_address: switchboardAddress,
        token: switchboardToken,
    }
    let post = await axios.post('/api/createSwitchBoard', switchboardData)
    console.log("PPOOPOPOPOSTT", post);
    // getSwitchboards();

    // Close the modal if needed
    // $('#modalAddMeter').modal('hide');

}
function HandleModalMeter(index) {
    console.log(index, "aqui estoy");
    $('#modalAddMeter').modal('show');
    $('#modal_title').html(`Añadir Medidor`);
    $('#modal_body').html(/*html*/`
        <div style="display:flex; flex-direction:column; justify-content:center; align-items:center;">
            <div style="display:flex; flex-direction:column; justify-content:center; align-items:flex-start;width:80%">
                <label for="meterName" class="form-label">Nombre del medidor</label>
                <input type="text" class="form-control" id="meterName" placeholder="">
            </div>
            <div style="display:flex; flex-direction:column; justify-content:center; align-items:flex-start;width:80%">
                <label for="meterAddress" class="form-label">Direccion</label>
                <input type="text" class="form-control" id="meterAddress" placeholder="">
            </div>
            <div style="display:flex; flex-direction:column; justify-content:center; align-items:flex-start;width:80%">
                <label for="selectClients" class="form-label">Cliente</label>
                <select id="selectClients" class="form-control" aria-label="Clients">
                    <option value="" selected>Seleccione</option>
                    <!-- Add options dynamically using JavaScript -->
                </select>
            </div>
            <div style="display:flex; flex-direction:column; justify-content:center; align-items:flex-start;width:80%">
                <label for="meterNumberSerie" class="form-label">Numero de serie</label>
                <input type="number" class="form-control" id="meterNumberSerie" placeholder="">
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

    selectCharge();
}
function HandleModalSwitchboard(index) {
    console.log("aqui estoy");
    $('#modalAddSwitchboard').modal('show');
    $('#modal_title_1').html(`Añadir Medidor`);
    $('#modal_body_1').html(/*html*/`
        <div style="display:flex; flex-direction:column; justify-content:center; align-items:center;">
            <div style="display:flex; flex-direction:column; justify-content:center; align-items:flex-start;width:80%">
                <label for="meterName" class="form-label">Nombre</label>
                <input type="text" class="form-control" id="switchboardName" placeholder="">
            </div>
            <div style="display:flex; flex-direction:column; justify-content:center; align-items:flex-start;width:80%">
                <label for="meterAddress" class="form-label">Direccion IP</label>
                <input type="text" class="form-control" id="switchboardAddress" placeholder="">
            </div>
      
            <div style="display:flex; flex-direction:column; justify-content:center; align-items:flex-start;width:80%">
                <label for="meterNumberSerie" class="form-label">Token *</label>
                <input type="text" class="form-control" id="switchboardToken" placeholder="">
            </div>
        </div>
    `);

    $('#modal_footer_1').html(`
        <button style="border-radius: 5px;" class="btn btn-dark" data-dismiss="modal">
            <i style="color:#e74c3c;" class="fas fa-times"></i> CANCELAR
        </button>

        <button style="border-radius:5px;" class="btn btn-dark" onclick="handleNewSwitchboard()">
            <i style="color:#3498db;" class="fas fa-check"></i> GUARDAR
        </button>
    `);

    selectCharge();
}

function handleShowMeterinfo(data) {

    console.log("accionehhhhjkgjhg", data);
    containerGuia.style.display = "none"
    containerData.style.display = 'flex'
    containerData.innerHTML = ''
    meterId = meters[data]._id
    $("#containerData").append(`
        <div style="display:flex; flex-direction:column; justify-content:center; align-items:center;">
        <h4>${meters[data].name}</h4>
        <div style="display:flex; flex-direction:column; justify-content:center; align-items:flex-start;">
            <label for="exampleFormControlInput1" class="form-label">Nombre del medidor</label>
            <input type="email" class="form-control" id="meterName" placeholder="" style="width:30vw" disabled readonly value="${meters[data].name}">
        </div>
        <div style="display:flex; flex-direction:column; justify-content:center; align-items:flex-start;">
            <label for="exampleFormControlInput1" class="form-label">Direccion</label>
            <input type="email" class="form-control" id="meterAddress" placeholder=""style="width:30vw" disabled readonly value="${meters[data].address}"}>
        </div>
        <div style="display:flex; flex-direction:column; justify-content:center; align-items:flex-start;">
            <label for="exampleFormControlInput1" class="form-label">Cliente</label>
            <input type="email" class="form-control" id="meterClientName" placeholder=""style="width:30vw" disabled readonly value="${meters[data].clients.name} ${meters[data].clients.lastname}">
        </div>
        <div style="display:flex; flex-direction:column; justify-content:center; align-items:flex-start;">
            <label for="exampleFormControlInput1" class="form-label">Numero de serie</label>
            <input type="email" class="form-control" id="meterSerialNumber" placeholder=""style="width:30vw" disabled readonly value="${meters[data].serialNumber}">
        </div>

        <div style="margin-top: 5vh;  width: 100%;">
        <button type="button" class="btn btn-primary" style="width:100%" id="editMeterButton">Editar</button>
        
        <div style="display: flex; justify-content: flex-end;width: 100%;">
        <div style="display: flex; justify-content: flex-start;width: 100%;">
        <button type="button" class="btn btn-danger" id="removeMeterButton" style="display: none; margin-right:1vw;">Remover</button>
        </div>
        <button type="button" class="btn btn-warning" id="cancelMeterButton" style="display: none; margin-right:1vw;">Cancelar</button>
        <button type="button" class="btn btn-primary" id="saveMeterButton" style="display: none;">Guardar</button>
        </div>
        </div>
    </div>
        `)
    $("#editMeterButton").on("click", function () {
        handleEditClient();
    });
    $("#cancelMeterButton").on("click", function () {
        handleCancelEdit(data)
    });
    $("#saveMeterButton").on("click", function () {
        console.log("save");
    });
    $("#removeMeterButton").on("click", function () {
        console.log("remove");
        handleRemoveMeter(data)
    });
}

function handleEditClient() {
    $("#editMeterButton").hide();
    $("#cancelMeterButton, #saveMeterButton,#removeMeterButton").show();
    $("#meterName, #meterAddress, #meterSerialNumber").prop("disabled", false);
    $("#meterName, #meterAddress, #meterSerialNumber").prop("readonly", false);
}

function handleCancelEdit(data) {
    $("#meterName, #meterAddress, #meterSerialNumber").prop("disabled", true);
    $("#meterName, #meterAddress, #meterSerialNumber").prop("readonly", true);
    $("#cancelMeterButton, #saveMeterButton,#removeMeterButton").hide();
    $("#editMeterButton").show();
    $("#meterName").prop("value", meters[data].name);
    $("#meterAddress").prop("value", meters[data].address);
    $("#meterSerialNumber").prop("value", meters[data].serialNumber);
}

async function handleRemoveMeter(index) {
    console.log("central ID", switchboardsId, "meterId", meterId);

    let remove = await axios.post('/api/removeMeterById', { switchboardsId, meterId })

    console.log("remove", remove);
}