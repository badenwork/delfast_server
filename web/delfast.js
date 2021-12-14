export default class Delfast {
    // super();
    constructor() {
        console.log("Delfast class");
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
    }

    // API
    async connect(disconnected_event) {
        const device = await navigator.bluetooth.requestDevice({filters: [{services: [this.PRIMARY_SERVICE]}]});
        console.log("device", device);
        this.device = device;
        device.addEventListener('gattserverdisconnected', disconnected_event);
        const server = await device.gatt.connect();
        console.log("server", server);
        this.server = server;
        const service = await server.getPrimaryService(this.PRIMARY_SERVICE);
        console.log("service", service);

        return Promise.all([
            this._cacheCharacteristic(service, this.CHARACTERISTIC_COMMAND),
            this._cacheCharacteristic(service, this.CHARACTERISTIC_COMMUNICATION),
            this._cacheCharacteristic(service, this.CHARACTERISTIC_STATUS),
            this._cacheCharacteristic(service, this.CHARACTERISTIC_DEBUG),
        ]);
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
        this._writeCharacteristicValue(this.CHARACTERISTIC_COMMAND, value)
            .then(r => {
                console.log("r=", r);
            })
            .catch(error => {
                console.log("delfast_bt.writeValue:error", error);
            });
    }

    //         Отримання session_key
    //
    // Для отримання ключа session_key мобільний записує в командний атрибут пакет реєстрації (0x80). 
    //
    // Назва  Розмір (байт) Значення
    // version   1      A0
    // type     1       тип пакета 0x80
    // key_idx
    // 1
    // ідентифікатор ключа (idx)
    // key_check
    // 20 (4+16)
    // 4 байт: CD B1 5E 3F зашифровані ключом cc + auth tag (16 byte)
    // nonce = crc32(key) + rnd + session_id xor 64 65 6c 66 61 73 74 62 69 6b 65 73
    // тобто для розрахунку нонс (12 байт) берем хеш ключа (4 байт), випадковий номер з комунікаційного атрибуту (4 байт) і ідентифікатор сессії з комунікаційного атрибуту (4 байт) і робимо xor з константою 'delfastbikes' (ascii).

    getSessionKey() {
        const test_cc = "addb2c0ad42ec3cf20dadd52065a4f70bfec4233ffd0da682836285fdce93119";
        const IDX = 123;
        const version = 0xA0;
        const type = 0x80;  //

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
