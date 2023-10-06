

let switchboards = [];
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
    hola()
});

async function getSwitchboards() {

    let switchboardsData = await axios.get("api/switchboards");
    switchboards = switchboardsData.data;
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
    console.log(switchboards[0]);
}
function handleShowDataTable(index) {
    if ($.fn.DataTable.isDataTable('#tableLectures')) {
        tableMeters.clear().destroy();
    }

    tableMeters = $('#tableLectures')
        .DataTable({
            dom: 'Bfrtip',
            buttons: ['excel', 'pdf'],
            iDisplayLength: 100,
            responsive: false,
            columnDefs: [{ targets: [0, 1, 3, 4, 5], className: 'dt-center' }],
            ordering: true,
            language: {
                url: spanishDataTableLang // Asegúrate de que spanishDataTableLang esté definido
            },
            data: switchboards[index].meters.map(function (element) {
                return {
                    address: element.clients.name + " " + element.clients.lastname,
                    name: element.name,
                    client: element.client, // Asegúrate de que coincida con la propiedad de datos
                    lastDate: moment(element.lastDate).format('DD/MM/YYYY HH:mm'),
                    status: element.status, // Asegúrate de que coincida con la propiedad de datos
                    lastLecture: element.lastLecture // Asegúrate de que coincida con la propiedad de datos
                };
            }),
            columns: [
                { data: 'address' },
                { data: 'name' },
                { data: 'client' },
                { data: 'lastDate' },
                { data: 'status' },
                { data: 'lastLecture' }
            ]
        });
}

async function hola() {
    const data = [
        { year: 2010, count: 10 },
        { year: 2011, count: 20 },
        { year: 2012, count: 15 },
        { year: 2013, count: 25 },
        { year: 2014, count: 22 },
        { year: 2015, count: 30 },
        { year: 2016, count: 28 },
    ];

    new Chart(
        document.getElementById('leChart'),
        {
            type: 'bar',
            data: {
                labels: data.map(row => row.year),
                datasets: [
                    {
                        label: 'Acquisitions by year',
                        data: data.map(row => row.count)
                    }
                ]
            }
        }
    );
}