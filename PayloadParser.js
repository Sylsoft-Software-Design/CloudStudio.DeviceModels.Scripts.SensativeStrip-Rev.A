function parseUplink(device, payload) {

    var payloadb = payload.asBytes();
    var decoded = Decoder(payloadb, payload.port)
    env.log(decoded);

    /*// Store humidity
    var e = device.endpoints.byType(endpointType.humiditySensor);
    if (e != null)
        e.updateHumiditySensorStatus(decoded.humidity);

    // Store temperature
    e = device.endpoints.byType(endpointType.temperatureSensor);
    if (e != null)
        e.updateTemperatureSensorStatus(decoded.temperature);*/

    // Store Presence
    e = device.endpoints.byType(endpointType.iasSensor, iasEndpointSubType.motionSensor);
    if (e != null)
    e.updateIASSensorStatus(decoded.presence.value);

    // Store Door
    e = device.endpoints.byType(endpointType.iasSensor, iasEndpointSubType.doorSensor);
    if (e != null)
    e.updateIASSensorStatus(decoded.door.value);

    /*// Store Illumination Sensor
    e = device.endpoints.byType(endpointType.genericSensor);
    if (e != null)
        e.updateGenericSensorStatus(decoded.illumination);*/

}

function buildDownlink(device, endpoint, command, payload) 
{ 
	// Esta función permite convertir un comando de la plataforma en un
	// payload que pueda enviarse al dispositivo.
	// Más información en https://wiki.cloud.studio/page/200

	// Los parámetros de esta función, son:
	// - device: objeto representando el dispositivo al cual se enviará el comando.
	// - endpoint: objeto endpoint representando el endpoint al que se enviará el 
	//   comando. Puede ser null si el comando se envía al dispositivo, y no a 
	//   un endpoint individual dentro del dispositivo.
	// - command: objeto que contiene el comando que se debe enviar. Más
	//   información en https://wiki.cloud.studio/page/1195.

	// Este ejemplo está escrito asumiendo un dispositivo que contiene un único 
	// endpoint, de tipo appliance, que se puede encender, apagar y alternar. 
	// Se asume que se debe enviar un solo byte en el payload, que indica el tipo 
	// de operación.

/*
	 payload.port = 25; 	 	 // Este dispositivo recibe comandos en el puerto LoRaWAN 25 
	 payload.buildResult = downlinkBuildResult.ok; 

	 switch (command.type) { 
	 	 case commandType.onOff: 
	 	 	 switch (command.onOff.type) { 
	 	 	 	 case onOffCommandType.turnOn: 
	 	 	 	 	 payload.setAsBytes([30]); 	 	 // El comando 30 indica "encender" 
	 	 	 	 	 break; 
	 	 	 	 case onOffCommandType.turnOff: 
	 	 	 	 	 payload.setAsBytes([31]); 	 	 // El comando 31 indica "apagar" 
	 	 	 	 	 break; 
	 	 	 	 case onOffCommandType.toggle: 
	 	 	 	 	 payload.setAsBytes([32]); 	 	 // El comando 32 indica "alternar" 
	 	 	 	 	 break; 
	 	 	 	 default: 
	 	 	 	 	 payload.buildResult = downlinkBuildResult.unsupported; 
	 	 	 	 	 break; 
	 	 	 } 
	 	 	 break; 
	 	 default: 
	 	 	 payload.buildResult = downlinkBuildResult.unsupported; 
	 	 	 break; 
	 }
*/

}

function Decoder(bytes, port) {
	// Decode an uplink message from a buffer
	// (array) of bytes to an object of fields.
	
	function decodeFrame(type, target)
	{
		switch(type & 0x7f) {
			case 0:
				target.emptyFrame = {};
				break;
			case 1: // Battery 1byte 0-100%
				target.battery = {};
				target.battery = bytes[pos++];
				break;
			case 2: // TempReport 2bytes 0.1degree C
				target.temperature = {}; // celcius 0.1 precision
				target.temperature.value = ((bytes[pos] & 0x80 ? 0xFFFF<<16 : 0) | (bytes[pos++] << 8) | bytes[pos++]) / 10;
				break;
			case 3:
				// Temp alarm
				target.tempAlarm = {};  // sends alarm after >x<
				target.tempAlarm.highAlarm = !!(bytes[pos] & 0x01); // boolean
				target.tempAlarm.lowAlarm = !!(bytes[pos] & 0x02);  // boolean
				pos++;
				break;
			case 4: // AvgTempReport 2bytes 0.1degree C
				target.averageTemperature = {};
				target.averageTemperature.value = ((bytes[pos] & 0x80 ? 0xFFFF<<16 : 0) | (bytes[pos++] << 8) | bytes[pos++]) / 10;
				break;
			case 5:
				// AvgTemp alarm
				target.avgTempAlarm = {}; // sends alarm after >x<
				target.avgTempAlarm.highAlarm = !!(bytes[pos] & 0x01); // boolean
				target.avgTempAlarm.lowAlarm = !!(bytes[pos] & 0x02);  // boolean
				pos++;
				break;
			case 6: // Humidity 1byte 0-100% in 0.5%
				target.humidity = {};
				target.humidity.value = bytes[pos++] / 2; // relativeHumidity percent 0,5
				break;
			case 7: // Lux 2bytes 0-65535lux
				target.lux = {};
				target.lux.value = ((bytes[pos++] << 8) | bytes[pos++]); // you can  the lux range between two sets (lux1 and 2)
				break;
			case 8: // Lux 2bytes 0-65535lux
				target.lux2 = {};
				target.lux2.value = ((bytes[pos++] << 8) | bytes[pos++]);
				break;
			case 9: // DoorSwitch 1bytes binary
				target.door = {};
				target.door.value = !!bytes[pos++] ? 1 : 2; // false = door open, true = door closed
				break;
			case 10: // DoorAlarm 1bytes binary
				target.doorAlarm = {};
				target.doorAlarm.value = !!bytes[pos++] ? 2 : 1; // boolean true = alarm
				break;
			case 11: // TamperReport 1bytes binary (was previously TamperSwitch)
				target.tamperReport = {};
				target.tamperReport.value = !!bytes[pos++];
				break;
			case 12: // TamperAlarm 1bytes binary
				target.tamperAlarm = {};
				target.tamperAlarm.value = !!bytes[pos++];
				break;
			case 13: // Flood 1byte 0-100%
				target.flood = {};
				target.flood.value = bytes[pos++]; // percentage, relative wetness
				break;
			case 14: // FloodAlarm 1bytes binary
				target.floodAlarm = {};
				target.floodAlarm.value = !!bytes[pos++]; // boolean, after >x<
				break;
			case 15: // oilAlarm 1bytes analog
				target.oilAlarm = {};
				target.oilAlarm.value = bytes[pos];
				target.foilAlarm = {}; // Compatibility with older strips
				target.foilAlarm.value = !!bytes[pos++];
				break;
			case 16: // UserSwitch1Alarm, 1 byte digital
				target.userSwitch1Alarm = {};
				target.userSwitch1Alarm.value = !!bytes[pos++];
				break;
			case 17: // DoorCountReport, 2 byte analog
				target.doorCount = {};
				target.doorCount.value = ((bytes[pos++] << 8) | bytes[pos++]);
				break;
			case 18: // PresenceReport, 1 byte digital
				target.presence = {};
				target.presence.value = !!bytes[pos++] ? 2 : 1;
				break;
			case 19: // IRProximityReport
				target.IRproximity = {};
				target.IRproximity.value = ((bytes[pos++] << 8) | bytes[pos++]);
				break;
			case 20: // IRCloseProximityReport, low power
				target.IRcloseproximity = {};
				target.IRcloseproximity.value = ((bytes[pos++] << 8) | bytes[pos++]);
				break;
			case 21: // CloseProximityAlarm, something very close to presence sensor
				target.closeProximityAlarm = {};
				target.closeProximityAlarm.value = !!bytes[pos++];
				break;
			case 22: // DisinfectAlarm
				target.disinfectAlarm = {};
				target.disinfectAlarm.value = bytes[pos++];
					if (target.disinfectAlarm.value === 0) target.disinfectAlarm.state='dirty';
					if (target.disinfectAlarm.value == 1) target.disinfectAlarm.state='occupied';
					if (target.disinfectAlarm.value == 2) target.disinfectAlarm.state='cleaning';
					if (target.disinfectAlarm.value == 3) target.disinfectAlarm.state='clean';
				break;
			case 80:
				target.humidity = {};
				target.humidity.value = bytes[pos++] / 2;
				target.temperature = {};
				target.temperature = ((bytes[pos] & 0x80 ? 0xFFFF<<16 : 0) | (bytes[pos++] << 8) | bytes[pos++]) / 10;
				break;
			case 81:
				target.humidity = {};
				target.humidity.value = bytes[pos++] / 2;
				target.averageTemperature = {};
				target.averageTemperature.value = ((bytes[pos] & 0x80 ? 0xFFFF<<16 : 0) | (bytes[pos++] << 8) | bytes[pos++]) / 10;
				break;
			case 82:
				target.door = {};
				target.door.value = !!bytes[pos++]; // true = door open, false = door closed
				target.temperature = {};
				target.temperature = ((bytes[pos] & 0x80 ? 0xFFFF<<16 : 0) | (bytes[pos++] << 8) | bytes[pos++]) / 10;
				break;
			case 112: // Capacitance Raw Sensor Value 2bytes 0-65535
				target.capacitanceFlood = {};
				target.capacitanceFlood.value = ((bytes[pos++] << 8) | bytes[pos++]); // should never trigger anymore
				break;
			case 113: // Capacitance Raw Sensor Value 2bytes 0-65535
				target.capacitancePad = {};
				target.capacitancePad.value = ((bytes[pos++] << 8) | bytes[pos++]); // should never trigger anymore
				break;
			case 110:
				pos += 8;
				break;
			case 114: // Capacitance Raw Sensor Value 2bytes 0-65535
				target.capacitanceEnd = {};
				target.capacitanceEnd.value = ((bytes[pos++] << 8) | bytes[pos++]); // should never trigger anymore
				break;
		}
	}
	
	var decoded = {};
	var pos = 0;
	var type;
	
	switch(port) {
		case 1:
		if(bytes.length < 2) {
			decoded.error = 'Wrong length of RX package';
			break;
		}
		decoded.historySeqNr = (bytes[pos++] << 8) | bytes[pos++];
		decoded.prevHistSeqNr = decoded.historySeqNr;
		while(pos < bytes.length) {
			type = bytes[pos++];
			if(type & 0x80)
			decoded.prevHistSeqNr--;
			decodeFrame(type, decoded);
		}
		break;
		
		case 2:
		var now = new Date();
		decoded.history = {};
		if(bytes.length < 2) {
			decoded.history.error = 'Wrong length of RX package';
			break;
		}	  
		var seqNr = (bytes[pos++] << 8) | bytes[pos++];
		while(pos < bytes.length) {
			decoded.history[seqNr] = {};
			decoded.history.now = now.toUTCString();
			secondsAgo = (bytes[pos++] << 24) | (bytes[pos++] << 16) | (bytes[pos++] << 8) | bytes[pos++];
			decoded.history[seqNr].timeStamp = new Date(now.getTime() - secondsAgo*1000).toUTCString();
			type = bytes[pos++];
			decodeFrame(type, decoded.history[seqNr]);
			seqNr++;
		}
	}
	return decoded;
}