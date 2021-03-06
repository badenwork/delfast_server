import Crc32 from './crc32';

const VERSION = 0xA0;
const CMD_GET_SESSION_KEY = 0x80;
const CMD_SET_DRIVE_MODE = 0x90;
const CMD_SET_LIMITS = 0x91;
const CMD_SEARCH_BIKE = 0x92;


// Test security data.
const test_cc = "addb2c0ad42ec3cf20dadd52065a4f70bfec4233ffd0da682836285fdce93119";
const IDX = 123;


async function generateKey() {
  return await crypto.subtle.generateKey({
    "name":"AES-GCM",
    "length":256
  }, true, ['encrypt','decrypt']);
}


export default class Delfast {
    // super();
    constructor() {
        this.PRIMARY_SERVICE = '0de1fa51-7504-44e5-95f4-9e791515f55a';
        // Командний атрибут
        // В цей атрибут мобільний записує команди для контролера.
        this.CHARACTERISTIC_COMMAND = 'de1fa510-7504-44e5-95f4-9e791515f55a';
        // Комунікаційний атрибут
        // В цей атрибут контролер записує зашифровані ключі.
        this.CHARACTERISTIC_COMMUNICATION = 'de1fa511-7504-44e5-95f4-9e791515f55a';
        // Статусний атрибут
        // В цей атрибут контролер записує інформацію про поточний стан. (Не частійше ніж раз на 500мс)
        this.CHARACTERISTIC_STATUS = 'de1fa512-7504-44e5-95f4-9e791515f55a';
        // Налагоджувальний атрибут
        // В цей атрибут контролер записує строку, яку мобільний пристрій зберігає у сторінку для аналізу можливих помилок
        this.CHARACTERISTIC_DEBUG = 'de1fa51f-7504-44e5-95f4-9e791515f55a';
        this.device = null;
        this.server = null;
        this._characteristics = new Map();
        this._secured = false;
        this.status = 0;

        this.algorithm = { name: 'AES-GCM', iv };
        this.key = await crypto.subtle.importKey('jwk', jwk, {
            "name":"AES-GCM"
          }, false, ['encrypt','decrypt']);

        // this.key = await crypto.subtle.deriveKey(
        //       {
        //         name: "PBKDF2",
        //         salt: salt,
        //         iterations: 250000,
        //         hash: "SHA-256",
        //       },
        //       keyMaterial,
        //       { name: "AES-GCM", length: 256 },
        //       false,
        //       ["encrypt", "decrypt"]
        //     );
    }


    // API
    async loadPaired() {
        if('getDevices' in navigator.bluetooth) {
            const devices = await navigator.bluetooth.getDevices();
            return devices;
        } else {
            return [];
        }
    }

    async connect(disconnected_event) {
        const device = await navigator.bluetooth.requestDevice({filters: [{services: [this.PRIMARY_SERVICE]}]});
        // console.log("device", device);
        if('watchAdvertisements' in device) {
            device.addEventListener('advertisementreceived', (event) => {
                // console.log("advertisementreceived", event);
            });
            device.watchAdvertisements();
        }
        this.device = device;
        device.addEventListener('gattserverdisconnected', disconnected_event);
        const server = await device.gatt.connect();
        // console.log("server", server);
        this.server = server;
        const service = await server.getPrimaryService(this.PRIMARY_SERVICE);
        // console.log("service", service);

        return Promise.all([
            this._cacheCharacteristic(service, this.CHARACTERISTIC_COMMAND),
            this._cacheCharacteristic(service, this.CHARACTERISTIC_COMMUNICATION),
            this._cacheCharacteristic(service, this.CHARACTERISTIC_STATUS),
            this._cacheCharacteristic(service, this.CHARACTERISTIC_DEBUG),
        ]);
    }

    async disconnect(disconnected_event) {
        return this.device.gatt.disconnect();
    }

    // Status
    startNotificationsMeasurement() {
      return this._startNotifications(this.CHARACTERISTIC_STATUS);
    }
    stopNotificationsMeasurement() {
      return this._stopNotifications(this.CHARACTERISTIC_STATUS);
    }
    // Debug
    startNotificationsDebug() {
      return this._startNotifications(this.CHARACTERISTIC_DEBUG);
    }
    stopNotificationsDebug() {
      return this._stopNotifications(this.CHARACTERISTIC_DEBUG);
    }
    parseShortValue(value) {
        const v = value.buffer ? value : new DataView(value);
        console.log("parseValue", v);
        return {
            flag: v.getUint8(1),
            speed: v.getUint8(5),
            power: v.getUint8(6),
            odometer: v.getUint8(10) + v.getUint8(9)*256 + v.getUint8(8)*256*256 + v.getUint8(7)*256*256*256,
        };
    }
    parseLongValue(value) {
        // In Chrome 50+, a DataView is returned instead of an ArrayBuffer.
        const v = value.buffer ? value : new DataView(value);
        console.log("parseValue", v);
        const status_value = v.getUint8(5);
        const status = {
            version: v.getUint8(0),
            counter: v.getUint8(1) + v.getUint8(2)*256 + v.getUint8(3)*256*256 + v.getUint8(4)*256*256*256,
            status: {
                charge: status_value & (1 << 0),
                drive: status_value & (1 << 1),
                block: status_value & (1 << 2),
                guard: status_value & (1 << 3),
                panic: status_value & (1 << 4),
                autolock: status_value & (1 << 5),
                battery: status_value & (1 << 6),
            },
            speed: v.getUint8(6),
            power: v.getUint8(7),
            odometer: v.getUint8(11) + v.getUint8(10)*256 + v.getUint8(9)*256*256 + v.getUint8(8)*256*256*256,
            drive_mode: {
                speed_limit: v.getUint8(12) & 0x03,
                pas: v.getUint8(12) & (1 << 2),
                throttle: v.getUint8(12) & (1 << 3),
            },
            change_cycles: v.getUint8(16) + v.getUint8(15)*256 + v.getUint8(14)*256*256 + v.getUint8(13)*256*256*256,
            auth_tag: new DataView(v.buffer, 17),
            // auth_tag: [],
        };
        this.status = status;
        return status;
        // const state = value.getUint32(0, /*littleEndian=*/true)
        // const x = value.getUint16(0, /*littleEndian=*/true)
        // const y = value.getUint16(2, /*littleEndian=*/true)
        // const z = value.getUint16(4, /*littleEndian=*/true)
        // let result = {x, y, z};
        // let result = {state};
        // return result;
    }
    async readStatus() {
        console.log("readStatus");
        const v = await this._readCharacteristicValue(this.CHARACTERISTIC_STATUS);
        console.log("v=", v);
        return v;
        // TODO: Parse value

            // .then(r => {
            //     return r;
            // })
            // .catch(error => {
            //     console.log("delfast_bt.readValue:error", error);
            // });
    }

    writeCommand(value) {
        console.log("writeValue", value);
        this._writeCharacteristicValue(this.CHARACTERISTIC_COMMAND, value)
            .then(r => {
                console.log("r=", r);
            })
            .catch(error => {
                console.log("delfast_bt.writeValue:error", error);
            });
    }

    // Отримання session_key
    getSessionKey() {

        // Для отримання ключа session_key мобільний записує в командний атрибут пакет реєстрації (0x80). 
        //
        // Назва        Розмір (байт)       Значення
        // version      1                   A0
        // type         1                   тип пакета 0x80
        // key_idx      1                   ідентифікатор ключа (idx)
        // key_check    20 (4+16)
        // 4 байт: CD B1 5E 3F зашифровані ключом cc + auth tag (16 byte)
        // nonce = crc32(key) + rnd + session_id xor 64 65 6c 66 61 73 74 62 69 6b 65 73
        // тобто для розрахунку нонс (12 байт) берем хеш ключа (4 байт), випадковий номер з комунікаційного атрибуту (4 байт) і ідентифікатор сессії з комунікаційного атрибуту (4 байт) і робимо xor з константою 'delfastbikes' (ascii).

        const buffer = new ArrayBuffer(23);
        const view = new DataView(buffer);
        view.setInt8(0, VERSION);               // version
        view.setInt8(1, CMD_GET_SESSION_KEY);   // type
        view.setInt8(2, IDX);                   // key_idx

        const key_check_view = new DataView(buffer, 3);
        let xor_mask = new Uint8Array([0x64, 0x65, 0x6c, 0x66, 0x61, 0x73, 0x74, 0x62, 0x69, 0x6b, 0x65, 0x73]);

        // FAKE
        let auth_tag = new Uint8Array(
            [0x64, 0x65, 0x6c, 0x66, 0x61, 0x73, 0x74, 0x62,
                0x64, 0x65, 0x6c, 0x66, 0x61, 0x73, 0x74, 0x62,]
        );
        // For debuggint MODEM_CMD_DIRECT_DEFINE
        // const auth_tag = (new TextEncoder()).encode("\r\n+WRITE:1,,,,,,");

        // nonce = crc32(key) + rnd + session_id xor 64 65 6c 66 61 73 74 62 69 6b 65 73

        // CD B1 5E 3F
        key_check_view.setInt8(0, 0x2D/*0xCD*/);
        key_check_view.setInt8(1, 0x21/*0xB1*/);
        key_check_view.setInt8(2, 0x5E);
        key_check_view.setInt8(3, 0x3F);
        new Uint8Array(buffer).set(auth_tag, 7);

        const crc32 = new Crc32(0);
        crc32.append([0x55]);

        console.log("--------- key_check_view", key_check_view);
        console.log("--------- buffer", buffer);
        console.log("--------- crc32", crc32.get());

        this.writeCommand(buffer);

    }

    sendSetToDriveState(flags) {
        const buffer = new ArrayBuffer(23);
        const view = new DataView(buffer);
        view.setInt8(0, VERSION);               // version
        view.setInt8(1, CMD_SET_DRIVE_MODE);    // type
        view.setInt8(2, IDX);                   // key_idx
        // const flags = 4;                        // 1 сигналізація включена  2 autolock   4 двигун
        view.setInt8(3, flags);                 // flags

        // FAKE
        let auth_tag = new Uint8Array(
            [0x64, 0x65, 0x6c, 0x66, 0x61, 0x73, 0x74, 0x62,
                0x64, 0x65, 0x6c, 0x66, 0x61, 0x73, 0x74, 0x62,]
        );
        new Uint8Array(buffer).set(auth_tag, 7);

        this.writeCommand(buffer);
    }

    // Керування режимами їзди
    setDriveModes(flags) {
        const buffer = new ArrayBuffer(23);
        const view = new DataView(buffer);
        view.setInt8(0, VERSION);               // version
        view.setInt8(1, CMD_SET_LIMITS);        // type
        view.setInt8(2, IDX);                   // key_idx
        // const flags = 4;                     // 1 сигналізація включена  2 autolock   4 двигун
        view.setInt8(3, flags);                 // flags

        // FAKE
        let auth_tag = new Uint8Array(
            [0x64, 0x65, 0x6c, 0x66, 0x61, 0x73, 0x74, 0x62,
                0x64, 0x65, 0x6c, 0x66, 0x61, 0x73, 0x74, 0x62,]
        );
        new Uint8Array(buffer).set(auth_tag, 7);

        this.writeCommand(buffer);
    }


    searchBike(flags) {
        const buffer = new ArrayBuffer(23);
        const view = new DataView(buffer);
        view.setInt8(0, VERSION);               // version
        view.setInt8(1, CMD_SEARCH_BIKE);       // type
        view.setInt8(2, IDX);                   // key_idx
        // const flags = 4;                     // 1 сигналізація включена  2 autolock   4 двигун
        view.setInt8(3, flags);                 // flags

        // FAKE
        let auth_tag = new Uint8Array(
            [0x64, 0x65, 0x6c, 0x66, 0x61, 0x73, 0x74, 0x62,
                0x64, 0x65, 0x6c, 0x66, 0x61, 0x73, 0x74, 0x62,]
        );
        new Uint8Array(buffer).set(auth_tag, 7);

        this.writeCommand(buffer);
    }


    async readManufacturername () {
      const service = await this.device.gatt.getPrimaryService("device_information");
      const characteristic = await service.getCharacteristic("manufacturer_name_string");
      return characteristic.readValue();
    }

    // Private
    _cacheCharacteristic(service, characteristicUuid) {
        return service.getCharacteristic(characteristicUuid)
            .then(characteristic => {
                // console.log("characteristic", characteristic);
                this._characteristics.set(characteristicUuid, characteristic);
            });
    }
    _readCharacteristicValue(characteristicUuid) {
        // console.log("_readCharacteristicValue", characteristicUuid);
        let characteristic = this._characteristics.get(characteristicUuid);
        return characteristic.readValue()
            .then(value => {
                // console.log("_readCharacteristicValue->readValue->value=", value)
                // In Chrome 50+, a DataView is returned instead of an ArrayBuffer.
                value = value.buffer ? value : new DataView(value);
                return value;
                // OR maybe: value.getUint8(0)
            });
    }
    _writeCharacteristicValue(characteristicUuid, value) {
        // console.log("_writeCharacteristicValue", characteristicUuid, value);
        let characteristic = this._characteristics.get(characteristicUuid);
        return characteristic.writeValue(value);
    }
    _startNotifications(characteristicUuid) {
        // console.log("_startNotifications()", characteristicUuid);
        let characteristic = this._characteristics.get(characteristicUuid);
        // Returns characteristic to set up characteristicvaluechanged event
        // handlers in the resolved promise.
        return characteristic.startNotifications().then(() => characteristic);
    }
    _stopNotifications(characteristicUuid) {
        let characteristic = this._characteristics.get(characteristicUuid);
        // Returns characteristic to remove characteristicvaluechanged event
        // handlers in the resolved promise.
        return characteristic.stopNotifications().then(() => characteristic);
    }

}
