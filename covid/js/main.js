// main.js
// Karan Singh Sandhu
// 2022-06-16

// global variables
// let json  = [];
// let dates = [];

let go = {};
// main-entry point

document.addEventListener("DOMContentLoaded", () => {
    log("Page is loaded");
    // 1. init DOM elements
    let comboProv = document.getElementById("comboProv");
    comboProv.selectedIndex = 0;
    comboProv.addEventListener("change", () => changeProvince(comboProv.value));


    // 2. Load & Process JSON 
    const URL = "http://ejd.songho.ca/ios/covid19.json";

    fetch(URL)
        .then(response => response.json())
        .then(json => { go.json = json; parseJson(json) })
        .catch(error => log(error.message));

    // 3. Load & Process the dates from the JSON
    let dateButton = document.querySelectorAll("img");
    let date = document.getElementById("date");
    for (let direction of dateButton) {
        direction.addEventListener("click", () => {
            let name = direction.dataset.name
            log("click");
            if (name == "left") {

                go.weekIndex--;
                if (go.weekIndex < 0)
                    go.weekIndex = 0;
            } else {
                go.weekIndex++;
                if (go.weekIndex >= go.weeks.length)
                    go.weekIndex = go.weeks.length - 1;
            }
            date.innerHTML = go.weeks[go.weekIndex];
            updateConfirmedCases(go.weeks[go.weekIndex]);
        }
        );
    }
});

//change the province
function changeProvince(provName) {
    // 1. get the provintial data (optimization)
    //  Use filter() to get the province data

    go.provinceData = go.json.filter(e => e.prname == provName);
    // 2. Update the comfirmed cases
    updateConfirmedCases(go.weeks[go.weekIndex]);

    // 3. Generate the values array
    values = []; // create/init an empty array
    totals = [];
    deaths = [];
    let count = go.weeks.length; // set iteration count
    for (let i = 0; i < count; i++) {
        let date = go.weeks[i]; // get a searching date
        // search the data from provinceData for a searching date
        let data = go.provinceData.find(e => e.date == date);
        // if data exist (found), put the weekly case into values array
        // if not found, put 0 instead
        if (data) {
            values[i] = data.numtotal_last7;
            totals[i] = data.totalcases;
            deaths[i] = data.numdeaths_last7;
        }
        else {
            values[i] = 0;
            totals[i] = 0;
            deaths[i] = 0;
        }

    }
    go.values = values;
    go.totals = totals;
    go.deaths = deaths;


    // 4. Draw the line graph
    drawChart(go.weeks, values, "Weekly Confirmed Cases", "rgba(3, 132, 252,0.4)", "chart");
    drawChart(go.weeks, deaths, "Weekly Deaths", "rgba(101, 23, 209, 0.4)", "chart2");
    initTable(provName);
    // switchMode();
}

// updates the confirmed cases
function updateConfirmedCases(date) {
  console.log(go.provinceData);
    // 1. get the confirmed cases\
    let confirmedCasesWeekly = go.provinceData.filter(e => e.date == date)[0].numtotal_last7;
    let confirmedCasesTotal = go.provinceData.filter(e => e.date == date)[0].totalcases;
    // 2. update the confirmed cases
    document.getElementById("Weekly").innerHTML = confirmedCasesWeekly.toLocaleString();
    document.getElementById("Total").innerHTML = confirmedCasesTotal.toLocaleString();
}

// draw a line graph
function drawChart(xValues, yValues, chartName, colour, chartId) {
    // NOTE: Must remove the previous chart if exists
    if (chartId == "chart" && go.chart) {
        log("here")
        go.chart.destroy();
    }
    else if (chartId == "chart2" && go.chart2) {
        go.chart2.destroy();
    }

    // get 2D rendering context(RC) from <canvas>
    let context = document.getElementById(chartId).getContext("2d");

    // create new chart object with RC and chart options
    chart = new Chart(context,
        {
            type: "line",                    // type of chart
            data:
            {
                labels: xValues,            // labeles for x-axis
                datasets:
                    [{
                        data: yValues,          // y-values to plot
                        lineTension: 0,         // no Bezier curve

                        fill: true, // fill background
                        fill: {
                            target: 'origin',
                            above: colour,   // Area will be red above the origin
                        },
                        borderColor: colour  // line colour rgb(r,g,b), rgba(r,g,b,a), #rrggbb
                    }]
            },
            options:
            {
                maintainAspectRatio: false, // for responsive
                plugins:
                {
                    title:
                    {
                        display: true,
                        text: chartName   // chart title
                    },
                    legend:
                    {
                        display: false
                    }
                }
            }
        });

    if (chartId == "chart") {
        go.chart = chart;
    }
    else if (chartId == "chart2") {
        go.chart2 = chart;
    }
}


// process JSON data
function parseJson(json) {
    log("JSON is loaded");
    // 1. remember the original JSON, so reference it later
    go.json = json;

    // 2. calculate # of weeks
    const MS_PER_WEEK = 1000 * 60 * 60 * 24 * 7;
    let ms1 = new Date(go.json[0].date).getTime();
    let ms2 = new Date(go.json[go.json.length - 1].date).getTime();
    let weekCount = (ms2 - ms1) / MS_PER_WEEK + 1;
    // 3. generate weeks array
    go.weeks = [];
    for (let i = ms1; i <= ms2; i += MS_PER_WEEK) {
        // generate ISO date string from ms, yyyy-MM-dd
        let dateString = new Date(i).toISOString().substring(0, 10);
        // put it into the weeks array
        go.weeks.push(dateString);
    }
    log("Week Count: " + go.weeks.length);

    // 4. set the current week index to the latest week
    go.weekIndex = go.weeks.length - 1;

    // 5. change province to the default
    initComboProv();
    let date = document.getElementById("date");
    date.innerHTML = go.weeks[go.weekIndex];
    changeProvince("Canada");
}

// initialise the combo box with provinces
function initComboProv() {
    let comboProv = document.getElementById("comboProv");
    let innerHTML = "";
    for (let i = 0; i < go.json.length; i++) {
        if (!innerHTML.includes(go.json[i].prname)) {

            if (go.json[i].prname == "Canada")
                innerHTML += "<option value='Canada' selected>Canada</option>";
            else
                innerHTML += "<option value='" + go.json[i].prname + "'>" + go.json[i].prname + "</option>";

        }
    }


    comboProv.innerHTML = innerHTML;
}

// initialises the table
function initTable(provName){
    let table = document.getElementById("tbody");
    let innerHTML = "";
    for (let i = go.json.length-1; i >=0; i--) {
        if (go.json[i].prname == provName) {
            innerHTML += "<tr>";
            innerHTML += "<td>" + go.json[i].date + "</td>";
            innerHTML += "<td>" + go.json[i].numtotal_last7.toLocaleString() + "</td>";
            innerHTML += "<td>" + go.json[i].totalcases.toLocaleString() + "</td>";
            innerHTML += "<td>" + go.json[i].numdeaths_last7.toLocaleString() + "</td>";
            innerHTML += "<td>"+ go.json[i].numdeaths.toLocaleString() + "</td>";
            innerHTML += "</tr>";
        }
    }
    table.innerHTML = innerHTML;
}
