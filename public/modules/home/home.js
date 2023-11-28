let switchboards = [];
let metersSelected = [];
let dataLectures = [];
let lecturasChart;
// const data = [
//   { year: 2010, count: 10 },
//   { year: 2011, count: 20 },
//   { year: 2012, count: 15 },
//   { year: 2013, count: 25 },
//   { year: 2014, count: 22 },
//   { year: 2015, count: 30 },
//   { year: 2016, count: 28 },
// ];
$(document).ready(async function () {
  getSwitchboards();
});

async function getSwitchboards() {
  let switchboardsData = await axios.get("api/switchboards");

  switchboards = switchboardsData.data;
  // console.log("switchboards", switchboards);

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
    data: switchboards[index].meters.map(function (element, i) {
      // console.log("ell", element);
      return {
        index: i,
        id: element._id,
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
    dataLectures = switchboards[index].meters[data.index];
    HandleModalInfoCenter(dataLectures);
    chartLectures(dataLectures.lectures);
  });
}

function dateFilter() {
  let fechaDesde = $("#fechaDesde").val();
  let fechaHasta = $("#fechaHasta").val();

  if (fechaDesde !== "" && fechaHasta !== "") {
    // Convertir las fechas a objetos Date
    const fechaDesdeObj = new Date(fechaDesde);
    const fechaHastaObj = new Date(fechaHasta);

    // Filtrar el array de datos
    const datosFiltrados = dataLectures.lectures.filter((item) => {
      const fechaItem = new Date(item.date);
      return fechaItem >= fechaDesdeObj && fechaItem <= fechaHastaObj;
    });
    lecturasChart.data.labels = datosFiltrados.map((row) => row.date);
    lecturasChart.data.datasets[0].data = datosFiltrados.map(
      (row) => row.value
    );

    lecturasChart.update();
  } else {
    Swal.fire({
      icon: "info",
      title: "Oops...",
      text: "Debe seleccionar ambas fechas para filtrar",
    });
  }
}

async function HandleModalInfoCenter(data) {
  console.log("las lecturas", data);
  const modal = $("#modalInfoCentral");
  const modalTitle = $("#modal_title");
  const modalBody = $("#modal_body");

  // console.log("aqui estoy", data);
  modal.modal("show");
  modalTitle.html("Información de central de medición");

  const infoHtml = /*html*/ `
    <div style="">
      <div style="display: flex; flex-direction: row; justify-content: space-evenly; align-items: center; width: 100%;">
        <div class="form-group">
          <label for="fechaDesde">Desde:</label>
          <input type="date" class="form-control" id="fechaDesde" required>
        </div>

        <div class="form-group">
          <label for="fechaHasta" style="font-size: 18px;">Hasta:</label>
          <input type="date" class="form-control" id="fechaHasta" required>
        </div>

        <button type="button" class="btn btn-primary" onclick="dateFilter()">Filtrar</button>

      </div>
    <br>

      <div style="display: flex; flex-direction: row; justify-content: space-around; align-items: center; width: 100%;">
        <div style="display: flex; flex-direction: column; width:20%;">

        <br>
   
        <label>Dirección:</label>
        <input type="text" style="font-weight: bold; font-size: 15px;" value="${
          data.address
        }" disabled>
    
        <br>

   
        <label>Nombre:</label>
        <input type="text" style="font-weight: bold; font-size: 15px;" value="${
          data.name
        }" disabled>


        <br>

        <label>Cliente:</label>
        <input type="text" style="font-weight: bold; font-size: 15px;" value="${
          data.clients.name + " " + data.clients.lastname
        }" disabled>

        <br>

        <label>Número de Serie:</label>
        <input type="text" style="font-weight: bold; font-size: 15px;" value="${
          data.serialNumber
        }" disabled>
        <br>


        </div>

        <div
          style="
            height: 100%;
            width: 75%;
            display: flex;
            justify-content: flex-end;
            border-left: 1px solid rgba(0, 0, 0, 0.3);
          ">
          <canvas id="leChart" style="min-width: 50%"></canvas>
        </div>
      </div>
      <br>
    </div>
  `;
  modalBody.html(infoHtml);
}

async function chartLectures() {
  dataLectures.lectures.forEach((element) => {
    element.date = moment(element.date).format("YYYY-MM-DD");
    element.hour = moment(element.date).format("HH:mm");
  });

  // Crear el gráfico
  lecturasChart = new Chart(document.getElementById("leChart"), {
    type: "bar",
    data: {
      labels: dataLectures.lectures.map((row) => row.date),
      datasets: [
        {
          label: "kw/h",
          data: dataLectures.lectures.map((row) => row.value),
        },
      ],
    },
  });
}
