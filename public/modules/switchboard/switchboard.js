let switchboards = [];
let meters = [];
let clients = [];
let switchboardsId;
let meterList = document.getElementById("meterList");
let meterDiv = document.getElementById("meterDiv");
let textIndex = document.getElementById("textIndex");
let containerData = document.getElementById("containerData");
let containerGuia = document.getElementById("containerGuia");
let switchboradList = document.getElementById("SwitchBoardList");

$(document).ready(async function () {
  getSwitchboards();
  getClients();
});
async function getClients() {
  let tempData = await axios.get("/api/getAllClients");
  clients = tempData.data;
  // console.log(tempData);
}
function HandleMeters(i) {
  containerData.style.display = "none";
  containerGuia.style.display = "flex";
  textIndex.innerHTML = "Seleccione una central";
  meterList.innerHTML = "";
  meterDiv.style.display = "flex";
  meters = switchboards[i].meters;
  switchboardsId = switchboards[i]._id;

  console.log(switchboardsId);

  // Añadir el botón "Añadir nuevo cliente" al principio de la lista
  $("#meterList").prepend(/*html*/ `
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
        " onfocus="this.blur();" onclick="HandleModalMeter()">
          <div style="display: flex; flex-direction: column; align-items: flex-start;">
            <p style="margin-bottom: -3px; font-size: 18px">Añadir nuevo EQmeter</p>
          </div>
          <i class="fas fa-plus"></i>
        </button>
      </div>
    `);

  if (meters.length > 0) {
    // Agregar los elementos generados por el forEach
    meters.forEach((e, index) => {
      $("#meterList").append(/*html*/ `
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

function selectCharge1() {
  clients.forEach((e, index) => {
    $("#modalSelectClients").append(`
            <option value="${e._id}">${e.name + " " + e.lastname}</option>
        `);
  });
}

function selectCharge(data) {
  clients.forEach((e, index) => {
    if (e._id == meters[data].clients._id) {
      $("#selectClients").append(`
            <option value="${e._id}" selected>${
        e.name + " " + e.lastname
      }</option>
        `);
    } else {
      $("#selectClients").append(`
            <option value="${e._id}">${e.name + " " + e.lastname}</option>
        `);
    }
  });
}

async function handleNewMeter() {
  let meterName = $("#modalMeterName").val();
  let meterAddress = $("#modalMeterAddress").val();
  let meterClient = $("#modalSelectClients").val();
  let meterNumberSerie = $("#modalMeterNumberSerie").val();
  if (meterName == "" || meterAddress == "" || meterClient == "") {
    Swal.fire({
      icon: "info",
      title: "Oops...",
      text: "Por favor rellene todos los campos",
    });
  } else if (meterNumberSerie.length < 6) {
    Swal.fire({
      icon: "info",
      title: "Oops...",
      text:
        "Ingrese un numero de serie valido" +
        " " +
        `${meterNumberSerie.length}`,
    });
  } else {
    let data = {
      name: meterName,
      address: meterAddress,
      clients: meterClient,
      serialNumber: meterNumberSerie,
      switchId: switchboardsId,
    };
    console.log("data", data);
    switchboradList.innerHTML = "";

    const response = await axios.post("/api/postMeter", data);
    if (response.data) {
      getSwitchboards();
      Swal.fire({
        icon: "success",
        title: "Exito",
        text: "Medidor añadido correctamente",
      });
      console.log("meter saved.🆗🆗🆗", response.data);
    } else {
      Swal.fire({
        icon: "info",
        title: "Oops...",
        text: "Hubo un error al añadir el medidor",
      });
    }
  }
}

async function handleNewSwitchboard() {
  let switchboardName = $("#switchboardName").val();
  let switchboardAddress = $("#switchboardAddress").val();
  let switchboardToken = $("#switchboardToken").val();
  if (
    switchboardName == "" ||
    switchboardAddress == "" ||
    switchboardToken == ""
  ) {
    Swal.fire({
      icon: "info",
      title: "Oops...",
      text: "Por favor rellene todos los campos",
    });
  } else if (switchboardToken.length < 30) {
    Swal.fire({
      icon: "info",
      title: "Oops...",
      text: "Ingrese un token valido",
    });
  } else {
    switchboradList.innerHTML = "";
    let post = await axios.post("/api/createSwitchBoard", {
      name: switchboardName,
      ip_address: switchboardAddress,
      token: switchboardToken,
    });
    console.log("Saved", post.data);
    if (post.data) {
      Swal.fire({
        icon: "success",
        title: "Exito",
        text: "Central añadida correctamente",
      });
      $("#modalAddSwitchboard").modal("hide");
      getSwitchboards();
    } else {
      Swal.fire({
        icon: "info",
        title: "Oops...",
        text: "Hubo un error al añadir la central",
      });
    }
  }
}

function HandleModalMeter() {
  $("#modalAddMeter").modal("show");
  $("#modal_title").html(`Añadir EQmeter`);
  $("#modal_body").html(/*html*/ `
        <div style="display:flex; flex-direction:column; justify-content:center; align-items:center;">
            <div style="display:flex; flex-direction:column; justify-content:center; align-items:flex-start;width:80%">
                <label for="modalMeterName" class="form-label">Nombre del medidor</label>
                <input type="text" class="form-control" id="modalMeterName" placeholder="">
            </div>
            <div style="display:flex; flex-direction:column; justify-content:center; align-items:flex-start;width:80%">
                <label for="modalMeterAddress" class="form-label">Direccion</label>
                <input type="text" class="form-control" id="modalMeterAddress" placeholder="">
            </div>
            <div style="display:flex; flex-direction:column; justify-content:center; align-items:flex-start;width:80%">
                <label for="modalSelectClients" class="form-label">Cliente</label>
                <select id="modalSelectClients" class="form-control" aria-label="Clients">
                    <option value="" selected>Seleccione</option>
                    <!-- Add options dynamically using JavaScript -->
                </select>
            </div>
            <div style="display:flex; flex-direction:column; justify-content:center; align-items:flex-start;width:80%">
                <label for="modalMeterNumberSerie" class="form-label">Numero de serie</label>
                <input type="number" class="form-control" id="modalMeterNumberSerie" placeholder="">
            </div>
        </div>
    `);

  $("#modal_footer").html(/*html*/ `
        <button style="border-radius: 5px;" class="btn btn-dark" data-dismiss="modal">
            <i style="color:#e74c3c;" class="fas fa-times"></i> CANCELAR
        </button>

        <button style="border-radius:5px;" class="btn btn-dark" onclick="handleNewMeter()">
            <i style="color:#3498db;" class="fas fa-check"></i> GUARDAR
        </button>
    `);
  selectCharge1();
}
function HandleModalSwitchboard(index) {
  console.log("aqui estoy");
  $("#modalAddSwitchboard").modal("show");
  $("#modal_title_1").html(`Añadir EQmatic`);
  $("#modal_body_1").html(/*html*/ `
        <div style="display:flex; flex-direction:column; justify-content:center; align-items:center;">
        <br>

            <div style="display:flex; flex-direction:row; justify-content:space-between; align-items:center;width:80%">
                <label for="meterName" class="form-label" style="width:20%;">Nombre :</label>
                <input type="text" class="form-control" id="switchboardName" style="width:80%;">
            </div>
            <br>
            <div style="display:flex; flex-direction:row; justify-content:space-between; align-items:center;width:80%">
                <label for="meterAddress" class="form-label"style="width:20%;">Direccion IP :</label>
                <input type="text" class="form-control" id="switchboardAddress" style="width:80%;">
            </div>
            <br>
      
            <div style="display:flex; flex-direction:row; justify-content:space-between; align-items:center;width:80%">
                <label for="meterNumberSerie" class="form-label"style="width:20%;">Token :</label>
                <input type="text" class="form-control" id="switchboardToken" style="width:80%;">
            </div>
            <br>

        </div>
    `);
  $("#modal_footer_1").html(/*html*/ `
        <button style="border-radius: 5px;" class="btn btn-dark" data-dismiss="modal">
            <i style="color:#e74c3c;" class="fas fa-times"></i> CANCELAR
        </button>

        <button style="border-radius:5px;" class="btn btn-dark" onclick="handleNewSwitchboard()">
            <i style="color:#3498db;" class="fas fa-check"></i> GUARDAR
        </button>
    `);
}

function handleShowMeterinfo(data) {
  containerGuia.style.display = "none";
  containerData.style.display = "flex";
  containerData.innerHTML = "";
  meterId = meters[data]._id;
  $("#containerData").append(/*html*/ `
        <div style="display:flex; flex-direction:column; justify-content:center; align-items:center;">
        <h4>${meters[data].name}</h4>
        <div style="display:flex; flex-direction:column; justify-content:center; align-items:flex-start;">
            <label for="meterName" class="form-label">Nombre del medidor</label>
            <input type="email" class="form-control" id="meterName"  style="width:30vw" disabled readonly value="${meters[data].name}">
        </div>
        <div style="display:flex; flex-direction:column; justify-content:center; align-items:flex-start;">
            <label for="meterAddress" class="form-label">Direccion</label>
            <input type="email" class="form-control" id="meterAddress" placeholder=""style="width:30vw" disabled readonly value="${meters[data].address}"}>
        </div>
        <div style="display:flex; flex-direction:column; justify-content:center; align-items:flex-start;">
        <label for="selectClients" class="form-label">Cliente</label>
        <select id="selectClients" class="form-control" aria-label="Clients" disabled readonly style="width:30vw;">
           
        </select>
        </div>
        <div style="display:flex; flex-direction:column; justify-content:center; align-items:flex-start;">
            <label for="meterSerialNumber" class="form-label">Numero de serie</label>
            <input type="number" class="form-control" id="meterSerialNumber" placeholder=""style="width:30vw" disabled readonly value="${meters[data].serialNumber}">
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
        `);
  selectCharge(data);

  $("#editMeterButton").on("click", function () {
    handleEditClient();
  });
  $("#cancelMeterButton").on("click", function () {
    handleCancelEdit(data);
  });
  $("#saveMeterButton").on("click", function () {
    console.log("save");
    handleSaveEdit(data);
  });
  $("#removeMeterButton").on("click", function () {
    console.log("remove");
    handleRemoveMeter(data);
  });
  $("#selectClients").on("change", function () {
    console.log(this.value);
  });
}

function handleEditClient() {
  $("#editMeterButton").hide();
  $("#cancelMeterButton, #saveMeterButton,#removeMeterButton").show();
  $("#meterName, #meterAddress, #meterSerialNumber,#selectClients").prop(
    "disabled",
    false
  );
  $("#selectClients").prop("style", "width:30vw;background-color:white");
  $("#meterName, #meterAddress, #meterSerialNumber,#selectClients").prop(
    "readonly",
    false
  );
}

function handleCancelEdit(data) {
  $("#meterName, #meterAddress, #meterSerialNumber,#selectClients").prop(
    "disabled",
    true
  );
  $("#selectClients").prop("style", "width:30vw;");
  $("#meterName, #meterAddress, #meterSerialNumber,#selectClients").prop(
    "readonly",
    true
  );
  $("#cancelMeterButton, #saveMeterButton,#removeMeterButton").hide();
  $("#editMeterButton").show();
  $("#meterName").prop("value", meters[data].name);
  $("#meterAddress").prop("value", meters[data].address);
  $("#meterSerialNumber").prop("value", meters[data].serialNumber);
}
async function handleSaveEdit(meterIndex) {
  let meterClient = $("#selectClients").val();
  let meterName = $("#meterName").val();
  let meterAddress = $("#meterAddress").val();
  let meterNumberSerie = $("#meterSerialNumber").val();
  let data = {
    meterId: meterId,
    clients: meterClient,
    name: meterName,
    address: meterAddress,
    serialNumber: meterNumberSerie,
  };
  if (
    meterClient == "" ||
    meterName == "" ||
    meterAddress == "" ||
    meterNumberSerie == ""
  ) {
    Swal.fire({
      icon: "info",
      title: "Oops...",
      text: "Por favor rellene todos los campos",
    });
  } else {
    console.log("data", data);
    switchboradList.innerHTML = "";
    const response = await axios.post("/api/updateMeterById", data);
    if (response.data) {
      await getSwitchboards();
      handleCancelEdit(meterIndex);
      Swal.fire({
        icon: "success",
        title: "Exito",
        text: "Medidor actualizado correctamente",
      });
    } else {
    }
  }
}

async function handleRemoveMeter(index) {
  console.log("central ID", switchboardsId, "meterId", meterId);

  let remove = await axios.post("/api/removeMeterById", {
    switchboardsId,
    meterId,
  });

  console.log("remove", remove);
}
