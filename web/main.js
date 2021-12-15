import './style.css'

import Delfast from './delfast';
const delfast = new Delfast();
// console.log("Delfast=", delfast);

document.querySelector('button#connect').addEventListener('click', async () => {
    console.log("Connect...");
    try {
        const device = await delfast.connect( ()=> {
            document.querySelector('#conn_state').innerHTML = "Disconnected";
            document.querySelector('.control').style = "display: none";
        });
        console.log("Connected.");

        delfast.startNotificationsMeasurement().then(handleMeasurement);
        delfast.startNotificationsDebug().then(handleDebug);

        document.querySelector('#conn_state').innerHTML = "Connected";
        document.querySelector('.control').style = "";

    } catch(error) {
        console.log("delfast_bt.connect:error", error);
        document.querySelector('#conn_state').innerHTML = "Connection error";
        document.querySelector('.control').style = "display: none";
    }
});

document.querySelector('button#get_session_key').addEventListener('click', async () => {
    delfast.getSessionKey();
});

document.querySelector('button#disconnect').addEventListener('click', async () => {
    delfast.disconnect();
});

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

function set_state(state, id, bit)
{
    // document.querySelector('#in_' + id).innerHTML = (state & (1<<bit)) ? "+" : "-";
    // document.querySelector('#in_' + id).style = "background-color: "+ ((state & (1<<bit)) ? "green" : "red") +";";
    document.querySelector('#in_' + id).className = (state & (1<<bit)) ? "active" : "passive";
}

function handleMeasurement(measurement) {
    // console.log("handleMeasurement()", measurement);
    measurement.addEventListener('characteristicvaluechanged', event => {
        // console.log("characteristicvaluechanged", event);
        var {state} = delfast.parseValue(event.target.value);
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
