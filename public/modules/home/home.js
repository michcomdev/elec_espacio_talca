let switchboards = [];
let metersSelected = [];
const data = [
  { year: 2010, count: 10 },
  { year: 2011, count: 20 },
  { year: 2012, count: 15 },
  { year: 2013, count: 25 },
  { year: 2014, count: 22 },
  { year: 2015, count: 30 },
  { year: 2016, count: 28 },
];
// let meters
$(document).ready(async function () {
  getSwitchboards();
});

async function getSwitchboards() {
  let switchboardsData = await axios.get("api/switchboards");

  switchboards = switchboardsData.data;
  console.log("switchboards", switchboards);

  for (let i = 0; i < switchboards.length; i++) {
    $("#SwitchBoardList").append(`
        <button 
        id="switchboardButton${i}" 
        class="btn btn-list"  
        onclick="handleShowDataTable('${i}')" 
        style="margin-bottom:5px;margin-right:3px;width:17vw">
        <div style="display:flex; flex-direction:column;align-items: flex-start;">
            <p style="margin-bottom: -3px;font-size: 18px;">${switchboards[i].name}</p>
            <p style="margin-bottom: -2px;font-size: 12px;">${switchboards[i].ip_address}</p>
        </div>
        <i class="fas fa-caret-right"></i>
    </button>
        `);
  }
  console.log("asui va", switchboards[0]);
}

async function handleShowDataTable(index) {
  if ($.fn.DataTable.isDataTable("#tableLectures")) {
    tableMeters.clear().destroy();
  }

  $("#bodyContainer").innerHTML = "";
  $("#imageBody").innerHTML = "";
  $("#imageBody").prop("style", "display:none");
  $("#bodyContainer").show();

  metersSelected = switchboards[index].meters;

  tableMeters = $("#tableLectures").DataTable({
    dom: "Bfrtip",
    buttons: ["excel", "pdf"],
    iDisplayLength: 100,
    responsive: true,
    columnDefs: [{ targets: [0, 1, 3, 4, 5], className: "dt-center" }],
    ordering: true,
    language: {
      url: spanishDataTableLang, // Asegúrate de que spanishDataTableLang esté definido
    },
    data: switchboards[index].meters.map(function (element) {
      console.log("ell", element);
      return {
        address: element.address,
        name: element.name,
        client: element.clients.name + " " + element.clients.lastname, // Asegúrate de que coincida con la propiedad de datos
        lastDate: moment(element.lastDate).format("DD/MM/YYYY HH:mm"),
        serialNumber: element.serialNumber.toString(), // Asegúrate de que coincida con la propiedad de datos
        lastLecture: element.lastLecture, // Asegúrate de que coincida con la propiedad de datos
      };
    }),
    columns: [
      { data: "address" },
      { data: "name" },
      { data: "client" },
      { data: "lastDate" },
      { data: "serialNumber" },
      { data: "lastLecture" },
    ],
  });
  $("#tableLectures tbody").on("click", "tr", function () {
    var data = tableMeters.row(this).data();
    HandleModalInfoCenter(data);
  });
}
function HandleModalInfoCenter(data) {
  const modal = $("#modalInfoCentral");
  const modalTitle = $("#modal_title");
  const modalBody = $("#modal_body");

  console.log("aqui estoy");
  modal.modal("show");
  modalTitle.html("Información de central de medición");

  const infoHtml = /*html*/ `
    <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; width: 100%;">
      <div style="display: flex; flex-direction: row; align-items: center; justify-content: space-around; width: 100%;">
        <div>
          <h2 style="font-size: 15px;">Dirección:</h2>
          <p>${data.address}</p>

          <h2 style="font-size: 15px;">Nombre:</h2>
          <p>${data.name}</p>

          <h2 style="font-size: 15px;">Cliente:</h2>
          <p>${data.client}</p>

          <h2 style="font-size: 15px;">Número de Serie:</h2>
          <p>${data.serialNumber}</p>

        </div>
     
      </div>
    </div>
  `;

  modalBody.html(infoHtml);
}

async function hola(datos) {
  datos.forEach((element) => {
    console.log("el elemnto", element.lastLecture);
  });

  new Chart(document.getElementById("leChart"), {
    type: "bar",
    data: {
      labels: datos.map((row) => row.name),
      datasets: [
        {
          label: "kw/h",
          data: datos.map((row) => row.lastLecture),
        },
      ],
    },
  });
}
