
const DOM_ELEMENTS={
    aqiresult:document.getElementById('aqi-value'),
    aqidiv : document.getElementById("aqi"),
    category: document.getElementById("category"),
    target : document.querySelector('#gauge'),
    locationdata:document.getElementById("locationdata"),
    timestamp:document.getElementById('timestamp'),
    pollute:document.getElementById('pollutantsbox'),
    myModal : document.getElementById('exampleModal'),
    selectoption:document.getElementById('selectoption')

}

const MAP_CONFIG={
    defaultLat:12,
    defaultLng:77,
    zoom:8,
    mapId:"a2b83caececb2c1b"
}

const STATE={
    map:null,
    marker:null,
    gaugeChart:null,
    latitude:0,
    longitude:0,
    nextpage:0,
    aqihistory:[],
    count:0,
    guagevalue:0,
    finallocation:''
}

console.log("Script loaded successfully.");

// Make initMap globally available
window.initializeMap = async function() {
    try {
        console.log("Initializing map click event...");
        const { Map } = await google.maps.importLibrary("maps");
        await google.maps.importLibrary("places");
        STATE.map = new Map(document.getElementById("map"), {
            center: { lat: MAP_CONFIG.defaultLat, lng: MAP_CONFIG.defaultLng },
            zoom: MAP_CONFIG.zoom,
            mapId: MAP_CONFIG.mapId
        });

        google.maps.event.addListener(STATE.map, 'click', function(event) {
            const lat = event.latLng.lat();
            const lng = event.latLng.lng();
            console.log(lat, lng);
            STATE.latitude=lat;
            STATE.longitude=lng;

            if (STATE.marker) {
                STATE.marker.map = null;
                STATE.marker = null;
            }

            STATE.marker = new google.maps.marker.AdvancedMarkerElement({
                position: { lat: lat, lng: lng },
                map: STATE.map,
                title: 'User Marker'
            });
            aqi(lat, lng);
            placename(lat,lng);
            gettime(lat,lng);
        });
    } catch (error) {
        console.error('Error initializing map:', error);
        document.getElementById('map').innerHTML = `
            <div class="alert alert-danger" role="alert">
                <h4 class="alert-heading">Error Loading Map</h4>
                <p>There was an error initializing the map. Please try refreshing the page.</p>
            </div>
        `;
    }
}

const placename = async (lat1 = 12, lng1 = 77) => {
    try {
        const response = await axios.post(
            '/api/geocoding',
            {
                address: `${lat1},${lng1}`
            }
        );
        const jsonresult =response;
        console.log(jsonresult);
        let addrlength=jsonresult.data.results.length;        
        const addr=jsonresult.data.plus_code.compound_code || jsonresult.data.results[addrlength-2].formatted_address;
        console.log(addr);
        let pattern=/.*\d.*/gm;
        if(pattern.test(addr)){
            const finallocationresult=addr.slice(8);
            STATE.finallocation=finallocationresult;
        }else{
            console.log(addr);
            STATE.finallocation=addr;
        }
        DOM_ELEMENTS.locationdata.innerText=`Location:${STATE.finallocation}`;



    } catch (error) {
        console.error('Error fetching Geocoding:', error);
        DOM_ELEMENTS.locationdata.innerText = "Not Found";
    }
};

const aqi = async (lat1 = 12, lng1 = 77) => {
    try {
        const response = await axios.post(
            '/api/air-quality',
            {
                location: {
                  latitude: lat1,
                  longitude: lng1,
                }
            }
        );
        console.log(response)
        const jsonresult = (response.data);
        console.log(jsonresult)
        DOM_ELEMENTS.aqiresult.textContent = jsonresult.indexes[0].aqi;
        pollutants(jsonresult.pollutants);
        const totalday=7;
        let finalchartdata;

       
        let categoryvalue = jsonresult.indexes[0].category.split(" ");
        DOM_ELEMENTS.category.textContent = `Category: ${categoryvalue[0]}`;
        STATE.guagevalue=jsonresult.indexes[0].aqi
        spinner();
        displaygauge(STATE.guagevalue);
        const selectvalue=parseInt(DOM_ELEMENTS.selectoption.value);
        if(isNaN(selectvalue)){
            finalchartdata=await chartdata(STATE.nextpage,lat1,lng1,totalday)
        }else{
            finalchartdata=await chartdata(STATE.nextpage,lat1,lng1,selectvalue)
        }
    
        STATE.aqihistory=[];
        console.log("Final AQI History:",finalchartdata);
        chartdisplay(finalchartdata);



    } catch (error) {
        console.error('Error fetching AQI:', error);
        DOM_ELEMENTS.aqiresult.innerText = "Not Found";
        DOM_ELEMENTS.pollute.innerHTML="";
        DOM_ELEMENTS.pollute.innerText="Not Found"
        STATE.gaugeChart.set(0);
        DOM_ELEMENTS.category.textContent = 'Category:N/A';
    }
};

const gettime=async (lat1 = 12, lng1 = 77)=>{
    console.log("in time");
    let now1 = Math.floor(new Date().getTime() / 1000);
    console.log(now1)

    try {
        const response = await axios.post('/api/timezone', {
            latitude: lat1,
            longitude: lng1,
            timestamp: now1
        });
        const rawoffset=response.data.rawOffset || 0;
        const dstoffset=response.data.dstoffset || 0;
        const timeepoch=now1+rawoffset+dstoffset;
        console.log(response);
        console.log("timepoch:",timeepoch);
        let Time = new Date().toLocaleTimeString("en-US", { timeZone:response.data.timeZoneId });; 
        console.log(Time)
        DOM_ELEMENTS.timestamp.innerText=`Time:${Time}`;

    } catch (error) {
        console.error('Error fetching TimeZoneAPI:', error);
    }
}

const displaygauge = (aqiValue) => {
    let opts = {
        angle: 0,
        lineWidth: 0.44,
        radiusScale: 0.83,
        pointer: {
            length: 0.6,
            strokeWidth: 0.035,
            color: '#000000'
        },
        limitMax: false,
        limitMin: false,
        colorStart: '#6FADCF',
        colorStop: '#8FC0DA',
        strokeColor: '#E0E0E0',
        generateGradient: true,
        highDpiSupport: true,
        staticZones: [
            {strokeStyle: "#800000", min: 0, max: 1}, 
            {strokeStyle: "#FF0000", min: 1, max: 19}, 
            {strokeStyle: "#FF8C00", min: 19, max: 39}, 
            {strokeStyle: "#FFFF00", min: 39, max: 59},
            {strokeStyle: "#84CF33", min: 59, max: 79},
            {strokeStyle: "#009E3A", min: 79, max: 100}
        ],
        /*renderTicks: {
          divisions:4 ,
          divWidth: 1.1,
          divLength: 0.7,
          divColor: "#333333",
          subDivisions: 2,
          subLength: 0.5,
          subWidth: 0.6,
          subColor: "#666666"
        }*/
    };
    if (!STATE.gaugeChart) { // Create gauge only once
        STATE.gaugeChart = new Gauge(DOM_ELEMENTS.target).setOptions(opts);
        STATE.gaugeChart.maxValue = 100;
        STATE.gaugeChart.setMinValue(0);
        STATE.gaugeChart.animationSpeed = 32;
    }

    if (aqiValue !== undefined) { // Update gauge value if provided
        STATE.gaugeChart.set(aqiValue);
    }
};


const pollutants=(pollut)=>{
    DOM_ELEMENTS.pollute.innerHTML="";
    DOM_ELEMENTS.pollute.style.display = "flex";
    DOM_ELEMENTS.pollute.style.flexWrap = "wrap";
    DOM_ELEMENTS.pollute.style.gap = "16px";
    DOM_ELEMENTS.pollute.style.justifyContent = "flex-start";
    DOM_ELEMENTS.pollute.style.padding = "16px";
    DOM_ELEMENTS.pollute.style.boxSizing = "border-box";
    DOM_ELEMENTS.pollute.style.width = "100%";

    const cardWidth = `calc((100% - 48px) / 4)`; // 48px accounts for 3 gaps between 4 cards

    for(let i=0;i<pollut.length;i++){
        console.log(pollut[i].additionalInfo.effects);
        DOM_ELEMENTS.pollute.innerHTML+=
        `<div class="dashboard-card" style="
            flex: 0 0 ${cardWidth}; 
            padding: 1.2rem;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 25px;
            transition: all 0.3s ease;
            height: 120px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        ">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="mb-0" style="color: #ffffff; font-size: 1rem;">${pollut[i].displayName}</h5>
                <button type="button" class="btn action-btn btn-sm py-1 px-2" 
                    data-title="${pollut[i].fullName}" 
                    data-content="${pollut[i].additionalInfo.effects}" 
                    data-bs-toggle="modal" 
                    data-bs-target="#exampleModal">
                    <i class="bi bi-arrow-up-right"></i>
                </button>
            </div>
            <div class="d-flex align-items-center">
                <div>
                    <h4 class="mb-1" style="color: #a8b2c1; font-size: 0.9rem;">Concentration: ${pollut[i].concentration.value}</h4>
                </div>
            </div>
        </div>`
    }
}





DOM_ELEMENTS.myModal.addEventListener('show.bs.modal', function (event) {
    const button = event.relatedTarget; // Button that triggered the modal
    const content = button.getAttribute('data-content'); // Get the data-content attribute
    const mtitlecontent=button.getAttribute('data-title'); 
    const modalBody = DOM_ELEMENTS.myModal.querySelector('#modalBodyContent'); // Get the modal body
    const ModalTitle=document.getElementById('exampleModalLabel');

    ModalTitle.textContent=mtitlecontent;
    modalBody.textContent = content; // Set the modal body content
});



displaygauge(50); // Initialize gauge on page load

const spinner=()=>{
    document.querySelector("#chart").innerHTML=
    `<div class="d-flex justify-content-center align-items-center" style="height: 350px;">
        <div class="spinner-border" role="status" style="
            width: 3rem; 
            height: 3rem;
            color: #00f260;
            border-width: 0.25em;
            animation: spin 1s linear infinite, glow 1.5s ease-in-out infinite alternate;
        ">
            <span class="visually-hidden">Loading...</span>
        </div>
        <style>
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            @keyframes glow {
                from { 
                    box-shadow: 0 0 10px rgba(0, 242, 96, 0.3),
                               0 0 20px rgba(0, 242, 96, 0.3),
                               0 0 30px rgba(0, 242, 96, 0.3);
                }
                to { 
                    box-shadow: 0 0 20px rgba(0, 242, 96, 0.6),
                               0 0 30px rgba(0, 242, 96, 0.6),
                               0 0 40px rgba(5, 117, 230, 0.6);
                }
            }
        </style>
    </div>`
}

const chartdata=async (nextoken,lat1=12,lng1=76,daycount=7)=>{
    let response;
    console.log("daycount:",daycount)
    console.log("nextoken before request:",nextoken);
    console.log("count",STATE.count);
    let date1 = new Date();
    const hr=date1.getUTCHours();
    date1.setUTCHours(hr-1, 0, 0, 0); // Ensure UTC and midnight
    const dateiso = date1.toISOString().replace(".000Z", "Z");
    let sevendaysback = new Date(date1 - (daycount * 24 * 60 * 60 * 1000));
    const hrseven=date1.getUTCHours();
    sevendaysback.setUTCHours(hrseven, 0, 0, 0); // Ensure UTC and 08:00:00
    const seveniso = sevendaysback.toISOString().replace(".000Z", "Z");
    console.log("date:",dateiso);
    console.log("7day:",seveniso);
    console.log("aqihistory",STATE.aqihistory);


    if(!nextoken && STATE.count>1){
        STATE.nextpage=0;
        STATE.count=0;

        return STATE.aqihistory;
    }else{
        try {
            response = await axios.post(
                '/api/history',
                {
                    location: {
                        latitude: lat1,
                        longitude: lng1,
                    },
                    period:{
                        "startTime":seveniso,
                        "endTime":dateiso
                    },
                    pageToken:nextoken||"",
    
                }    
            );
            nextoken=response.data.nextPageToken;
            
            console.log("nextoken after request:",nextoken);
            console.log(response);
            let aqivalueindex;
                for(let i=0;i<response.data.hoursInfo.length;i++){
                    if (response.data.hoursInfo[i].indexes) {
                        // Only try to access indexes[0].aqi if indexes exists
                        aqivalueindex = response.data.hoursInfo[i].indexes?.[0]?.aqi ?? 0; // Optional chaining and nullish coalescing
                        console.log("indexes exists for:", response.data.hoursInfo[i].dateTime)
                    } else {
                        aqivalueindex=0;
                        console.log("indexes property missing for:", response.data.hoursInfo[i].dateTime);
                    }
                
                    console.log([response.data.hoursInfo[i].dateTime, aqivalueindex]);
                    STATE.aqihistory.push([response.data.hoursInfo[i].dateTime, aqivalueindex]);
                }
            console.log(STATE.aqihistory)
            STATE.count++;
            return chartdata(nextoken,lat1,lng1,daycount);
        } catch (error) {
            console.error('Error fetching AQI:', error);
        }
    }
    
}

const chartdisplay=(chartvalue)=>{
    document.querySelector("#chart").innerHTML="";
    var options = {
        series: [{
            name: 'AQI Value',
            data: chartvalue
        }],
        chart: {
            type: 'area',
            stacked: false,
            height: 350,
            background: 'transparent',
            foreColor: '#a8b2c1',
            zoom: {
                type: 'x',
                enabled: true,
                autoScaleYaxis: true
            },
            toolbar: {
                show: true,
                autoSelected: 'zoom',
                export: {
                    svg: {
                        filename: 'AQI-History-SVG'
                    },
                    png: {
                        filename: 'AQI-History-PNG'
                    }
                },
                itemMargin: {
                    horizontal: 10
                },
                offsetY: -5,
            }
        },
        dataLabels: {
            enabled: false
        },
        markers: {
            size: 0,
            hover: {
                size: 0
            }
        },
        stroke: {
            curve: 'smooth',
            width: 2,
            colors: ['#00f260']
        },
        fill: {
            type: 'gradient',
            gradient: {
                type: 'vertical',
                shadeIntensity: 1,
                inverseColors: false,
                opacityFrom: 0.5,
                opacityTo: 0.1,
                stops: [0, 90, 100],
                colorStops: [
                    {
                        offset: 0,
                        color: '#00f260',
                        opacity: 0.5
                    },
                    {
                        offset: 100,
                        color: '#0575e6',
                        opacity: 0.1
                    }
                ]
            }
        },
        grid: {
            borderColor: 'rgba(255, 255, 255, 0.1)',
            strokeDashArray: 4,
            xaxis: {
                lines: {
                    show: true
                }
            },
            yaxis: {
                lines: {
                    show: true
                }
            }
        },
        yaxis: {
            labels: {
                style: {
                    colors: '#a8b2c1'
                }
            },
            title: {
                text: 'AQI Value',
                style: {
                    color: '#ffffff',
                    fontSize: '14px'
                }
            }
        },
        xaxis: {
            type: 'datetime',
            labels: {
                style: {
                    colors: '#a8b2c1'
                }
            },
            title: {
                text: 'Date',
                style: {
                    color: '#ffffff',
                    fontSize: '14px'
                }
            }
        },
        tooltip: {
            theme: 'dark',
            style: {
                fontSize: '12px'
            },
            x: {
                format: 'dd MMM yyyy'
            },
            y: {
                formatter: function (val) {
                    return val
                }
            }
        }
    };
      
    var chart = new ApexCharts(document.querySelector("#chart"), options);
    chart.render();
    STATE.aqihistory=[];
    console.log(STATE.aqihistory)
}

DOM_ELEMENTS.selectoption.addEventListener('change',async ()=>{
    spinner();
    console.log("select");
    console.log(DOM_ELEMENTS.selectoption.value)
    const selectvalue=parseInt(DOM_ELEMENTS.selectoption.value);
    if(isNaN(selectvalue)){
        document.querySelector("#chart").innerHTML="";
        const para = document.createElement("p");
        const node = document.createTextNode("Select a day from the option.");
        para.appendChild(node);
        document.querySelector("#chart").appendChild(para)
        return;
    }
    console.log("select value:",selectvalue)
    const chartfinalvalue=await chartdata(STATE.nextpage,STATE.latitude,STATE.longitude,selectvalue);
    console.log("chart final value:",chartfinalvalue);
    chartdisplay(chartfinalvalue);

})

window.onresize = function(){ location.reload(); }
