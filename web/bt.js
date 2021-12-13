(function() {
    'use strict';

    const BT_REQUEST_CFG = {

        filters: [{
            name: 'Test Delfast PC-001'
        }, {
            name: 'Delfast PC-001'
        }, {
            name: 'PC-001'
        }, {
            name: 'DelfastPC'
        },/* {
            services: ['0de1fa51-7504-44e5-95f4-9e791515f55a']
        }*/],

        // acceptAllDevices: true,
        optionalServices: [
            '0de1fa51-7504-44e5-95f4-9e791515f55a'
        ]

        // filters: [{ services: [
        //     0xa002,
        //     // '0de1fa51-7504-44e5-95f4-9e791515f55a',
        //     // "de1fa510-7504-44e5-95f4-9e791515f55a",
        //     // "de1fa511-7504-44e5-95f4-9e791515f55a",
        // ] }]
        // filters: [{ services: ['0000a002-0000-1000-8000-00805f9b34fb'] }]
        // filters: [{ services: [0x0de1fa51] }]
    };

    // const PRIMARY_SERVICE = "0000a002-0000-1000-8000-00805f9b34fb";
    const PRIMARY_SERVICE = "0de1fa51-7504-44e5-95f4-9e791515f55a";

    // Командний атрибут
    // В цей атрибут мобільний записує команди для контролера.
    const CHARACTERISTIC_COMMAND = "de1fa510-7504-44e5-95f4-9e791515f55a";
    // Комунікаційний атрибут
    // В цей атрибут контролер записує зашифровані ключі.
    const CHARACTERISTIC_COMMUNICATION = "de1fa511-7504-44e5-95f4-9e791515f55a";
    // Статусний атрибут
    // В цей атрибут контролер записує інформацію про поточний стан. (Не частійше ніж раз на 500мс)
    const CHARACTERISTIC_STATUS = "de1fa512-7504-44e5-95f4-9e791515f55a";
    // Налагоджувальний атрибут
    // В цей атрибут контролер записує строку, яку мобільний пристрій зберігає у сторінку для аналізу можливих помилок
    const CHARACTERISTIC_DEBUG = "de1fa51f-7504-44e5-95f4-9e791515f55a";

    console.log("TODO: Remove me!");

    class DelfastBT {
        constructor() {
            this.device = null;
            this.server = null;
            this._characteristics = new Map();
        }
        // API
        connect() {
            return navigator.bluetooth.requestDevice(BT_REQUEST_CFG)
                .then(device => {
                    console.log("device", device);
                    this.device = device;
                    device.addEventListener('gattserverdisconnected', () => {
                        document.querySelector('#conn_state').innerHTML = "Disconnected";
                        document.querySelector('.control').style = "display: none";
                    });
                    return device.gatt.connect();
                })
                .then(server => {
                    console.log("server", server);
                    this.server = server;
                    return server.getPrimaryService(PRIMARY_SERVICE);
                })
                .then(service => {
                    console.log("service", service);
                    return Promise.all([
                        this._cacheCharacteristic(service, CHARACTERISTIC_COMMAND),
                        this._cacheCharacteristic(service, CHARACTERISTIC_COMMUNICATION),
                        this._cacheCharacteristic(service, CHARACTERISTIC_STATUS),
                        this._cacheCharacteristic(service, CHARACTERISTIC_DEBUG),
                    ]);
                    // return service.getCharacteristics();
                });
        }
        // Status
        startNotificationsMeasurement() {
          return this._startNotifications(CHARACTERISTIC_STATUS);
        }
        stopNotificationsMeasurement() {
          return this._stopNotifications(CHARACTERISTIC_STATUS);
        }
        // Debug
        startNotificationsDebug() {
          return this._startNotifications(CHARACTERISTIC_DEBUG);
        }
        stopNotificationsDebug() {
          return this._stopNotifications(CHARACTERISTIC_DEBUG);
        }
        parseValue(value) {
            console.log("parseValue", value);
            // In Chrome 50+, a DataView is returned instead of an ArrayBuffer.
            value = value.buffer ? value : new DataView(value);
            const state = value.getUint32(0, /*littleEndian=*/true)
            // const x = value.getUint16(0, /*littleEndian=*/true)
            // const y = value.getUint16(2, /*littleEndian=*/true)
            // const z = value.getUint16(4, /*littleEndian=*/true)
            // let result = {x, y, z};
            let result = {state};
            return result;
        }
        writeCommand(value) {
            console.log("writeValue", value);
            this._writeCharacteristicValue(CHARACTERISTIC_COMMAND, value)
                .then(r => {
                    console.log("r=", r);
                })
                .catch(error => {
                    console.log("delfast_bt.writeValue:error", error);
                });
        }

        // Private
        _cacheCharacteristic(service, characteristicUuid) {
            return service.getCharacteristic(characteristicUuid)
                .then(characteristic => {
                    console.log("characteristic", characteristic);
                    this._characteristics.set(characteristicUuid, characteristic);
                });
        }
        _readCharacteristicValue(characteristicUuid) {
            console.log("_readCharacteristicValue", characteristicUuid);
            let characteristic = this._characteristics.get(characteristicUuid);
            return characteristic.readValue()
                .then(value => {
                    console.log("_readCharacteristicValue->readValue->value=", value)
                    // In Chrome 50+, a DataView is returned instead of an ArrayBuffer.
                    value = value.buffer ? value : new DataView(value);
                    return value;
                    // OR maybe: value.getUint8(0)
                });
        }
        _writeCharacteristicValue(characteristicUuid, value) {
            console.log("_writeCharacteristicValue", characteristicUuid, value);
            let characteristic = this._characteristics.get(characteristicUuid);
            return characteristic.writeValue(value);
        }
        _startNotifications(characteristicUuid) {
            console.log("_startNotifications()", characteristicUuid);
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

    window.delfast_bt = new DelfastBT();

})();
