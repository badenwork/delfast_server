document.querySelector('button#connect').addEventListener('click', event => {
    delfast_bt.connect()
        .then(() => {
            delfast_bt.startNotificationsMeasurement().then(handleMeasurement);
            delfast_bt.startNotificationsDebug().then(handleDebug);

            document.querySelector('#conn_state').innerHTML = "Connected";
            document.querySelector('.control').style = "";
        })
        // .then((characteristics) => {
        //     console.log("characteristics:", characteristics)
        // })
        .catch(error => {
            console.log("delfast_bt.connect:error", error);
            document.querySelector('#conn_state').innerHTML = "Connection error";
            document.querySelector('.control').style = "display: none";
        })
});

// document.querySelector('button#test').addEventListener('click', event => {
//     console.log("Test");
//     var data = new Uint8Array([0x49, 0x50, 0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36]);
//     delfast_bt.writeCommand(data);
// });

if(0) {
document.querySelector('button#inspect').addEventListener('click', event => {
    console.log("Inspect BLE");
    inspectBle();
});
}

const BT_INPUT_STATE_HORN = 0;
const BT_INPUT_STATE_BREAK = 1;
const BT_INPUT_STATE_TURN_L = 2;
const BT_INPUT_STATE_TURN_R = 3;
const BT_INPUT_STATE_H_BEAM = 4;
const BT_INPUT_STATE_L_BEAM = 5;
const BT_INPUT_STATE_H_SPEED = 6;
const BT_INPUT_STATE_L_SPEED = 7;
const BT_INPUT_STATE_THROTTLE = 8;
const BT_INPUT_STATE_PAS = 9;

// Not a inputs, but place here while a better time
const BT_STATE_PANIC = 10;
const BT_STATE_DRIVE = 11;
const BT_STATE_GUARD = 12;

function set_state(state, id, bit)
{
    // document.querySelector('#in_' + id).innerHTML = (state & (1<<bit)) ? "+" : "-";
    // document.querySelector('#in_' + id).style = "background-color: "+ ((state & (1<<bit)) ? "green" : "red") +";";
    document.querySelector('#in_' + id).className = (state & (1<<bit)) ? "active" : "passive";
}

function handleMeasurement(measurement) {
    console.log("handleMeasurement()", measurement);
    measurement.addEventListener('characteristicvaluechanged', event => {
        // console.log("characteristicvaluechanged", event);
        var {state} = delfast_bt.parseValue(event.target.value);
        set_state(state, "horn", BT_INPUT_STATE_HORN);
        set_state(state, "break", BT_INPUT_STATE_BREAK);
        set_state(state, "turn_l", BT_INPUT_STATE_TURN_L);
        set_state(state, "turn_r", BT_INPUT_STATE_TURN_R);
        set_state(state, "h_beam", BT_INPUT_STATE_H_BEAM);
        set_state(state, "l_beam", BT_INPUT_STATE_L_BEAM);
        set_state(state, "h_speed", BT_INPUT_STATE_H_SPEED);
        set_state(state, "l_speed", BT_INPUT_STATE_L_SPEED);
        set_state(state, "throttle", BT_INPUT_STATE_THROTTLE);
        set_state(state, "pas", BT_INPUT_STATE_PAS);

        // Not a inputs, but place here while a better time
        set_state(state, "panic", BT_STATE_PANIC);
        set_state(state, "drive", BT_STATE_DRIVE);
        set_state(state, "guard", BT_STATE_GUARD);
        // console.log("xyz", x, y, z);
        // Log("X="+x+" Y="+y+" Z="+z);
        // statusText.innerHTML = heartRateMeasurement.heartRate + ' &#x2764;';
        // heartRates.push(heartRateMeasurement.heartRate);
        // drawWaves();
    });
}

function handleDebug(debug) {
    console.log("handleDebug()", debug);
    debug.addEventListener('characteristicvaluechanged', event => {
        console.log("Debug value changed", event.target.value);
    });
}

function Log(msg){
    document.querySelector('#logs').innerHTML =
        document.querySelector('#logs').innerHTML + "<br>" + msg;
}
