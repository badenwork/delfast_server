import './style.css'
import { registerSW } from 'virtual:pwa-register'
import "@fortawesome/fontawesome-free/css/all.css";
import "@fortawesome/fontawesome-free/js/all.js";

import Delfast from './delfast';
const delfast = new Delfast();
// console.log("Delfast=", delfast);

// import { precacheAndRoute } from 'workbox-precaching'
// precacheAndRoute(self.__WB_MANIFEST)


const updateSW = registerSW({
  onNeedRefresh() {
      console.log("onNeedRefresh");
      alert("Application updated. Need refresh.");
      location.reload();
  },
  onOfflineReady() {
      console.log("onOfflineReady");
  },
});


const $ = document.querySelector

document.querySelector('button#connect').addEventListener('click', async () => {
    console.log("Connect...");
    try {
        const device = await delfast.connect( ()=> {
            document.querySelector('#conn_state').innerHTML = "Disconnected";
            document.querySelector('.control').style = "display: none";
            document.querySelector('button#disconnect').style = "display: none";
        });
        console.log("Connected.");

        delfast.startNotificationsMeasurement().then(handleMeasurement);
        delfast.startNotificationsDebug().then(handleDebug);

        document.querySelector('#conn_state').innerHTML = "Connected";
        document.querySelector('.control').style = "";
        document.querySelector('button#disconnect').style = "";

    } catch(error) {
        console.log("delfast_bt.connect:error", error);
        document.querySelector('#conn_state').innerHTML = "Connection error";
        document.querySelector('.control').style = "display: none";
        document.querySelector('button#disconnect').style = "display: none";
    }
});

document.querySelector('button#secured').addEventListener('click', () => {
    delfast._secured = !delfast._secured;
    const i = document.querySelector('button#secured>*');
    if(delfast._secured) {
        i.classList.remove('fa-lock-open');
        i.classList.add('fa-lock');
        i.style = "color: green";
    } else {
        i.classList.remove('fa-lock');
        i.classList.add('fa-lock-open');
        i.style = "color: darkred";
    }
});

document.querySelector('button#get_session_key').addEventListener('click', async () => {
    delfast.getSessionKey();
});

document.querySelector('button#drive').addEventListener('click', async () => {
    delfast.sendSetToDriveState(0x04);
});
document.querySelector('button#idle').addEventListener('click', async () => {
    delfast.sendSetToDriveState(0x00);
});
document.querySelector('button#force').addEventListener('click', async () => {
    delfast.sendSetToDriveState(0x01);
});

document.querySelector('button#search_s').addEventListener('click', async () => {
    delfast.searchBike(0x01);
});

document.querySelector('button#search_l').addEventListener('click', async () => {
    delfast.searchBike(0x02);
});

document.querySelector('button#search_sl').addEventListener('click', async () => {
    delfast.searchBike(0x03);
});

document.querySelector('button#read_status').addEventListener('click', async () => {
    const v = await delfast.readStatus();
    console.log("Status", v);
});

document.querySelector('button#disconnect').addEventListener('click', async () => {
    delfast.disconnect();
});

document.querySelector('button#read_manufacture_name').addEventListener('click', async () => {
    const manufacture_name = await delfast.readManufacturername();
    console.log('manufacture_name=', manufacture_name);
});

const change_limits = (pas, throttle, limit) => {
    let flags = 0;
    if(pas) flags |= 4;
    if(throttle) flags |= 8;
    if(limit == "1") flags |= 1;
    else if(limit == "2") flags |= 2;
    console.log("change_limits  flags=", flags);
    delfast.setDriveModes(flags);
}

const input_pas = document.querySelector('input#pas');
const input_throttle = document.querySelector('input#throttle');
const select_speed_limit = document.querySelector('select#speed_limit');
const changer = () => {
    change_limits(input_pas.checked, input_throttle.checked, select_speed_limit.value);
}
input_pas.addEventListener('change', changer);
input_throttle.addEventListener('change', changer);
select_speed_limit.addEventListener('change', changer);


/*
(async () => {
    const devices = await delfast.loadPaired();
    console.log("devices", devices);
})();
*/

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

function set_state(cond, id)
{
    // document.querySelector('#in_' + id).innerHTML = (state & (1<<bit)) ? "+" : "-";
    // document.querySelector('#in_' + id).style = "background-color: "+ ((state & (1<<bit)) ? "green" : "red") +";";
    document.querySelector('#in_' + id).className = cond ? "active" : "passive";
}

function handleMeasurement(measurement) {
    console.log("handleMeasurement()", measurement);
    measurement.addEventListener('characteristicvaluechanged', async (event) => {
        if(event.target.value.byteLength != 4) return;
        console.log("notify STATUS change", event.target.value);
        const v = await delfast.readStatus();
        const state = delfast.parseValue(v);
        console.log("status = ", state);

        // TODO: Debug only
        const inputs = state.odometer;
        // Debug inputs
        set_state(inputs & (1 << BT_INPUT_STATE_HORN), "horn");
        set_state(inputs & (1 << BT_INPUT_STATE_BREAK), "break");
        set_state(inputs & (1 << BT_INPUT_STATE_TURN_L), "turn_l");
        set_state(inputs & (1 << BT_INPUT_STATE_TURN_R), "turn_r");
        set_state(inputs & (1 << BT_INPUT_STATE_H_BEAM), "h_beam");
        set_state(inputs & (1 << BT_INPUT_STATE_L_BEAM), "l_beam");
        // set_state(inputs & (1 << BT_INPUT_STATE_L_SPEED), "l_speed");
        // set_state(inputs & (1 << BT_INPUT_STATE_H_SPEED), "h_speed");
        // set_state(inputs & (1 << BT_INPUT_STATE_THROTTLE), "throttle");
        // set_state(inputs & (1 << BT_INPUT_STATE_PAS), "pas");

        // Not a inputs, but place here while a better time
        set_state(state.status.panic, "panic");
        set_state(state.status.drive, "drive");
        set_state(state.status.guard, "guard");
        // console.log("xyz", x, y, z);
        // Log("X="+x+" Y="+y+" Z="+z);
        // statusText.innerHTML = heartRateMeasurement.heartRate + ' &#x2764;';
        // heartRates.push(heartRateMeasurement.heartRate);
        // drawWaves();

        input_pas.checked = state.drive_mode.pas;
        input_throttle.checked = state.drive_mode.throttle;
        // input_throttle.checked = inputs & (1 << BT_INPUT_STATE_THROTTLE);

        const speed_bits = inputs & ((1 << BT_INPUT_STATE_L_SPEED) | (1 << BT_INPUT_STATE_H_SPEED));

        switch(state.drive_mode.speed_limit) {
            case 0: select_speed_limit.value = "0"; break;
            case 1: select_speed_limit.value = "1"; break;
            case 2: select_speed_limit.value = "2"; break;
        }

        document.querySelector('span#speed').innerHTML = "" + state.speed;
        document.querySelector('span#odometer').innerHTML = "" + state.odometer;
        document.querySelector('span#battery').innerHTML = "" + (100 * state.power / 255).toFixed(1);

        // inputs & (1 << BT_INPUT_STATE_L_SPEED)
    });
}

function handleDebug(debug) {
    // console.log("handleDebug()", debug);
    debug.addEventListener('characteristicvaluechanged', event => {
        console.log("Debug value changed", event.target.value);
    });
}


if(false) {
  // const textDecoder = new TextDecoder("utf8")

  const Buffer_from = (value, encoding) => {
    if (encoding === "utf8") {
      const encoder = new TextEncoder()
      value = encoder.encode(value)
    } else if (encoding === "hex") {
      if (value === "") {
        return new Uint8Array()
      }
      value = new Uint8Array(value.match(/../g).map(byte => parseInt(byte, 16)))
    }
    return value
  }


console.log("Buffer", Buffer_from("313233", "hex"));

async function generateKey() {
  return await crypto.subtle.generateKey({
    "name":"AES-GCM",
    "length":256
  }, true, ['encrypt','decrypt']);
}

async function exportKey(key) {
  return await crypto.subtle.exportKey('jwk', key);
}

async function importKey(jwk) {
  return await crypto.subtle.importKey('jwk', jwk, {
    "name":"AES-GCM"
  }, false, ['encrypt','decrypt']);
}

async function encrypt(string,key) {
  let encoded = new TextEncoder().encode(string);
  let iv = crypto.getRandomValues(new Uint8Array(12));
  let encrypted = await crypto.subtle.encrypt({"name":"AES-GCM","iv":iv}, key, encoded);
  return encrypted = {"encrypted":encrypted, "iv": iv};
}

async function decrypt(encrypted,iv, key) {
  let decrypted = await crypto.subtle.decrypt({"name":"AES-GCM","iv":iv}, key, encrypted);
  let decoded = new TextDecoder().decode(decrypted);
  return decoded;
}

const key = await generateKey();
const {encrypted, iv} = await encrypt("1", key);
console.log('encrypted', encrypted, iv);
const decrypted = await decrypt(encrypted, key, iv);
}
