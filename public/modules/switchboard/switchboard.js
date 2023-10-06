
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
    containerData.style.display = 'none'
    containerGuia.style.display = "flex"
    textIndex.innerHTML = 'Seleccione una central'
    meterList.innerHTML = ''
    meterDiv.style.display = 'flex'
    meters = switchboards[i].meters
    switchboardsId = switchboards[i]._id

    console.log(switchboardsId);
    // console.log("aaaaaadiasoduasdoi",i);

    if (meters.length === 0) {
        $("#meterList").append(`
                <button
                    id="meterButtonAdd"
                    class="btn btn-list"
                    onclick="HandleModalMeter(0)" 
                    style="margin-bottom:5px;width: 18vw;">
                    <div style="display:flex; flex-direction:column;align-items: flex-start;">
                        <p style="margin-bottom: -3px;font-size: 18px;">Añade</p>
                    </div>
                    <i class="fas fa-plus"></i>
                </button>
            `);
    } else {
        meters.forEach((e, index) => {
            $("#meterList").append(`
                    <button
                        id="meterButton${index}"
                        class="btn btn-list"
                        onclick="handleShowMeterinfo(${index})" 
                        style="margin-bottom:5px;width: 18vw;">
                        <div style="display:flex; flex-direction:column;align-items: flex-start;">
                            <p style="margin-bottom: -3px;font-size: 18px;">${e.name}</p>
                        </div>
                        <i class="fas fa-caret-right"></i>
                    </button>
                `);
            if (meters.length === index + 1) {
                $("#meterList").append(`
                        <button
                            id="meterButton${index}"
                            class="btn btn-list"
                            onclick="HandleModalMeter(${index + 1})" 
                            style="margin-bottom:5px;width: 18vw;">
                            <div style="display:flex; flex-direction:column;align-items: flex-start;">
                                <p style="margin-bottom: -3px;font-size: 18px;">Añade</p>
                            </div>
                            <i class="fas fa-plus"></i>
                        </button>
                    `);
            }
        });
    }

}
async function getSwitchboards() {
    let TempSwitchboards = await axios.get("api/switchboards");
    switchboards = TempSwitchboards.data;
    // console.log(switchboards);

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
        // console.log("aaaaaadiasoduasdoi",i);
        if (switchboards.length == (i + 1)) {

            $("#SwitchBoardList").append(`
            <button 
            id="switchboardButton${i}" 
            class="btn btn-list"  
            onclick="HandleModalSwitchboard()" 
            style="margin-bottom:5px;margin-right:3px;width:17vw">
            <div style="display:flex; flex-direction:column;align-items: flex-start;">
            <p style="margin-bottom: -3px;font-size: 18px;">Añade</p>
        </div>
        <i class="fas fa-plus"></i>
        </button>
        `)

        }
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

    console.log("accione", data);
    containerGuia.style.display = "none"
    containerData.style.display = 'flex'
    containerData.innerHTML = ''
    $("#containerData").append(`
        <div style="display:flex; flex-direction:column; justify-content:center; align-items:center;">
        <h4>${meters[data].name}</h4>
        <div style="display:flex; flex-direction:column; justify-content:center; align-items:flex-start;">
            <label for="exampleFormControlInput1" class="form-label">Nombre del medidor</label>
            <input type="email" class="form-control" id="exampleFormControlInput1" placeholder="" style="width:30vw" disabled readonly value="${meters[data].name}">
        </div>
        <div style="display:flex; flex-direction:column; justify-content:center; align-items:flex-start;">
            <label for="exampleFormControlInput1" class="form-label">Direccion</label>
            <input type="email" class="form-control" id="exampleFormControlInput1" placeholder=""style="width:30vw" disabled readonly value="${meters[data].address}"}>
        </div>
        <div style="display:flex; flex-direction:column; justify-content:center; align-items:flex-start;">
            <label for="exampleFormControlInput1" class="form-label">Cliente</label>
            <input type="email" class="form-control" id="exampleFormControlInput1" placeholder=""style="width:30vw" disabled readonly value="${meters[data].clients.name} ${meters[data].clients.lastname}">
        </div>
        <div style="display:flex; flex-direction:column; justify-content:center; align-items:flex-start;">
            <label for="exampleFormControlInput1" class="form-label">Numero de serie</label>
            <input type="email" class="form-control" id="exampleFormControlInput1" placeholder=""style="width:30vw" disabled readonly value="${meters[data].serialNumber}">
        </div>
    </div>
        `)
}


