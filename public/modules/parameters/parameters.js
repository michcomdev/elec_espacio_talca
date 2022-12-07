let internals = {
    services: {
        table: {},
        data: []
    },
    dataRowSelected: {}
}


$(document).ready(async function () {
    chargeParameters()
})

async function chargeParameters() {
    let parametersData = await axios.get('api/parameters')
    parameters = parametersData.data
    
    $("#expireDay").val(parameters.expireDay)
    $("#charge").val(parameters.charge)
    $("#meterValue").val(parameters.meterValue)
    $("#meterValueB").val(parameters.meterValueB)
    $("#consumptionLimit").val(parameters.consumptionLimit)
    $("#consumptionLimitValue").val(parameters.consumptionLimitValue)
    $("#committeeEmail").val(parameters.email)
    $("#committeeRut").val(parameters.committee.rut)
    $("#committeeName").val(parameters.committee.name)
    $("#committeeCategory").val(parameters.committee.category)
    $("#committeeAddress").val(parameters.committee.address)
    $("#committeeActeco").val(parameters.committee.acteco)
    $("#committeeCommune").val(parameters.committee.commune)
    $("#committeeCity").val(parameters.committee.city)
    $("#committeePhone").val(parameters.committee.phone)
    $("#committeeSiiCode").val(parameters.committee.siiCode)
    $("#municipalityCode").val(parameters.municipality.code)
    $("#municipalitySubsidyCode").val(parameters.municipality.subsidyCode)
    $("#subsidyLimit").val(parameters.subsidyLimit)
    $("#feePercentageDebt").val(parameters.fees.percentageDebt)
    $("#feePercentageIrregular").val(parameters.fees.percentageIrregular)
    $("#feeReunion").val(parameters.fees.reunion)
    $("#feeVote").val(parameters.fees.vote)
    $("#text1").val(parameters.text1)
    $("#text1b").val(parameters.text1b)
    $("#text2").val(parameters.text2)
    $("#text3").val(parameters.text3)

}

$('#save').on('click', async function () {

    let numericClass = true, committeeClass = true, subsidyClass = true

    $(".numericClass").each(function() {
        if(!$.isNumeric($(this).val())){
            numericClass = false
        }
    })

    $(".committeeClass").each(function() {
        if($(this).val()==''){
            committeeClass = false
        }
    })

    $(".subsidyClass").each(function() {
        if(!$.isNumeric($(this).val())){
            subsidyClass = false
        }
    })

    if(!numericClass){
        toastr.warning('Debe ingresar valores numéricos correctos')
        return
    }
    if(!committeeClass){
        toastr.warning('Debe rellenar todos los datos del Comité')
        return
    }
    if(!subsidyClass){
        toastr.warning('Debe rellenar todos los datos de Subsidio')
        return
    }

    if($("#expireDay").val()>31 || $("#expireDay").val()<1){
        toastr.warning('El día de vencimiento debe ser válido')
        return
    }

    let parameters = {
        expireDay: $("#expireDay").val(),
        charge: $("#charge").val(),
        meterValue: $("#meterValue").val(),
        meterValueB: $("#meterValueB").val(),
        consumptionLimit: $("#consumptionLimit").val(),
        consumptionLimitValue: $("#consumptionLimitValue").val(),
        email: $("#committeeEmail").val(),
        committee: {
            rut: $("#committeeRut").val(),
            name: $("#committeeName").val(),
            category: $("#committeeCategory").val(),
            address: $("#committeeAddress").val(),
            acteco: $("#committeeActeco").val(),
            commune: $("#committeeCommune").val(),
            city: $("#committeeCity").val(),
            phone: $("#committeePhone").val(),
            siiCode: $("#committeeSiiCode").val()
        },
        municipality: {
            code: $("#municipalityCode").val(),
            subsidyCode: $("#municipalitySubsidyCode").val()
        },
        fees: {
            percentageDebt: parseInt($("#feePercentageDebt").val()),
            percentageIrregular: parseInt($("#feePercentageIrregular").val()),
            reunion: parseInt($("#feeReunion").val()),
            vote: parseInt($("#feeVote").val())
        },
        subsidyLimit: $("#subsidyLimit").val(),
        text1: $("#text1").val(),
        text1b: $("#text1b").val(),
        text2: $("#text2").val(),
        text3: $("#text3").val()
    }

    let saveParameters = await axios.post('/api/parametersSave', parameters)
    if(saveParameters.data){
        if(saveParameters.data._id){
            toastr.success('Datos almacenados correctamente')

        }else{
            toastr.error('Error al almacenar, favor reintente')
        }
    }else{
        toastr.error('Error al almacenar, favor reintente')
    }

})



function validateParameterData(serviceData) {
    let errorMessage = ''

    if(serviceData.name==''){
        errorMessage += '<br>Nombre'
    }

    if(!$.isNumeric(serviceData.value)){
        errorMessage += '<br>Valor'
    }
    
    /*if(serviceData.description==''){
        errorMessage += '<br>Descripción'
    }*/

    if (errorMessage.length===0) {
        return { ok: serviceData }
    } else {
        $(document).on('hidden.bs.modal', '.modal', function () { //Soluciona problema de scroll
            $('.modal:visible').length && $(document.body).addClass('modal-open');
        });

        $('#modal').modal('show');
        $('#modal_title').html(`Error al almacenar Ingreso`)
        $('#modal_body').html(`<h5 class="alert-heading">Falta ingresar los siguientes datos:</h5>
                                    <p class="mb-0">${errorMessage}</p>`)

        return { err: serviceData }
    }
}

function createModalBody(){
    let body = `
                <div class="row">
                    <div class="col-md-3">
                        Nombre Servicio
                        <input id="serviceName" type="text" class="form-control form-control-sm border-input">
                    </div>
                    <div class="col-md-3">
                        Tipo
                        <br/>
                        <select id="serviceType" class="form-select form-select-sm">
                            <option value="OTROS">OTROS</option>
                            <option value="ALCANTARILLADO">ALCANTARILLADO</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        Aplica en
                        <br/>
                        <select id="serviceInvoice" class="form-select form-select-sm">
                            <option value="MENSUAL">BOLETA MENSUAL</option>
                            <option value="INGRESO">BOLETA INGRESO</option>
                        </select>
                    </div>
                    <div class="col-md-4">
                        Valor
                        <input id="serviceValue" type="text" class="form-control form-control-sm border-input">
                    </div>
                    <div class="col-md-3">
                        Estado
                        <br/>
                        <select id="serviceStatus" class="form-select form-select-sm">
                            <option value="HABILITADO">HABILITADO</option>
                            <option value="DESHABILITADO">DESHABILITADO</option>
                        </select>
                    </div>

                    <div class="form-group col-md-12">
                        Descripción
                        <br/>
                        <textarea id="serviceDescription" placeholder="EJEMPLO" class="form-control form-control-sm" rows="5"></textarea>
                    </div>

                </div>
            `
    return body
}