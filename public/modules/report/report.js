let fechaDesde;
let fechaHasta;

$(document).ready(async function () {
  //   await getArrMeters();.
});

async function getArrMeters() {
  let tempData = await axios.post("/api/getActiveMeters");
  console.log(tempData.data);
}
function handleCloseModal() {
  Swal.fire({
    title: "¿Estas seguro?",
    text: "¡No podrás revertir esto!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3498db",
    cancelButtonColor: "#e74c3c",
    confirmButtonText: "Si, eliminar",
    cancelButtonText: "Cancelar",
  }).then((result) => {
    if (result.isConfirmed) {
      $("#modalReports").modal("hide");
    }
  });
}
async function dateFilter() {
  fechaDesde = $("#fechaDesde").val();
  fechaHasta = $("#fechaHasta").val();
  let tempData = await axios.post("/api/getActiveMeters", {
    fechaDesde: fechaDesde,
    fechaHasta: fechaHasta,
  });
  console.log("esta", tempData.data);
}
function HandleModalReports() {
  $("#modalReports").modal("show");
  $("#modal_title").html(`Añadir EQmeter`);
  $("#modal_body").html(/*html*/ `
          <div style="display:flex; flex-direction:column; justify-content:center; align-items:center;">
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
    <br/>


                <div style="display:flex; flex-direction:row; justify-content:flex-start; align-items:center;width:80%">
                    <label for="modalMeterName" class="form-label" style="width:20%">Total valor CGE</label>
                    <input type="number" class="form-control" id="inputCge" style="width:40%" placeholder="" onchange="calcKw()">
                </div>

                <div style="display:flex; flex-direction:row; justify-content:flex-start; align-items:center;width:80%">
                    <label for="modalMeterAddress" class="form-label" style="width:20%">Total K.W.H</label>
                    <input type="number" class="form-control" id="inputTotalKw" style="width:40%" placeholder="" onchange="calcKw()">
                </div>
         
                <div style="display:flex; flex-direction:row; justify-content:flex-start; align-items:center;width:80%">
                    <label for="modalMeterAddress" class="form-label" style="width:20%">Valor X Kw</label>
                    <input type="text" class="form-control" id="inputValorxKw" style="width:40%" placeholder="" disabled> 
                </div>


                <div class="col-md-9 table-responsive">
                <br />
                <table
                  id="tableMeters"
                  class="display nowrap cell-border table-condensed"
                  cellspacing="0"
                  width="100%"
                >
                  <thead>
                    <tr class="table-danger">
                        <th style="text-align: center">Cliente</th>
                        <th style="text-align: center">Recinto</th>
                        <th style="text-align: center">lectura (fecha)</th>
                        <th style="text-align: center">lectura (fecha)</th>
                        <th style="text-align: center">Total cosnumido (Kw/h)</th>
                        <th style="text-align: center">Total a pagar</th>
                    </tr>
                  </thead>
                </table>
                <!--<div id="loadingMeters" style="text-align: center;">
                        <i class="fa fa-spinner fa-pulse fa-2x fa-fw"></i>
                        <span class="sr-only">Cargando...</span>
                    </div>-->
              </div>

          </div>
      `);

  $("#modal_footer").html(/*html*/ `
          <button style="border-radius: 5px;" class="btn btn-dark"  onclick="handleCloseModal()">
              <i style="color:#e74c3c;" class="fas fa-times"></i> Cancelar
          </button>
  
          <button style="border-radius:5px;" class="btn btn-dark"  >
              <i style="color:#3498db;" class="fas fa-check"></i> Generar
          </button>
      `);
}
