$(document).ready(async function () {});
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

function HandleModalReports() {
  $("#modalReports").modal("show");
  $("#modal_title").html(`Añadir EQmeter`);
  $("#modal_body").html(/*html*/ `
          <div style="display:flex; flex-direction:column; justify-content:center; align-items:center;">

                <div style="display:flex; flex-direction:row; justify-content:flex-start; align-items:center;width:80%">
                    <label for="modalMeterName" class="form-label" style="width:20%">Total valor CGE</label>
                    <input type="number" class="form-control" id="modalMeterAddress" style="width:40%" placeholder="">
                </div>

                <div style="display:flex; flex-direction:row; justify-content:flex-start; align-items:center;width:80%">
                    <label for="modalMeterAddress" class="form-label" style="width:20%">Total K.W.H</label>
                    <input type="number" class="form-control" id="modalMeterAddress" style="width:40%" placeholder="">
                </div>
         
                <div style="display:flex; flex-direction:row; justify-content:flex-start; align-items:center;width:80%">
                    <label for="modalMeterAddress" class="form-label" style="width:20%">Valor X Kw</label>
                    <input type="text" class="form-control" id="modalMeterAddress" style="width:40%" placeholder="">
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
                        <th style="text-align: center">N° Dirección</th>
                        <th style="text-align: center">Última Lectura obtenida (kW/h)</th>
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
