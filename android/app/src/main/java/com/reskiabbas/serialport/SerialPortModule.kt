package com.example.serialport

import android.app.PendingIntent
import android.content.*
import android.hardware.usb.*
import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import kotlinx.coroutines.*
import java.io.IOException
import com.hoho.android.usbserial.driver.UsbSerialPort
import com.hoho.android.usbserial.driver.UsbSerialProber

class SerialPortModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val context = reactContext
    private var usbManager: UsbManager? = null
    private var connection: UsbDeviceConnection? = null
    private var serialPort: UsbSerialPort? = null
    private var readJob: Job? = null

    override fun getName(): String = "SerialPortModule"

    @ReactMethod
    fun initSerialPort(baudRate: Int, promise: Promise) {
        try {
            usbManager = context.getSystemService(Context.USB_SERVICE) as UsbManager
            val availableDrivers = com.hoho.android.usbserial.driver.UsbSerialProber.getDefaultProber()
                .findAllDrivers(usbManager)

            if (availableDrivers.isEmpty()) {
                promise.reject("NO_DEVICE", "No USB device found")
                return
            }

            val driver = availableDrivers[0]
            connection = usbManager?.openDevice(driver.device)

            if (connection == null) {
                promise.reject("NO_PERMISSION", "No permission to open USB device")
                return
            }

            serialPort = driver.ports[0]
            serialPort?.open(connection)
            serialPort?.setParameters(
                baudRate,
                8, // data bits
                UsbSerialPort.STOPBITS_1,
                UsbSerialPort.PARITY_NONE
            )

            startReading()

            promise.resolve("✅ Serial initialized with baud $baudRate")
        } catch (e: Exception) {
            promise.reject("INIT_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun sendCommand(data: String, promise: Promise) {
        try {
            val port = serialPort ?: run {
                promise.reject("NO_PORT", "Serial port not opened")
                return
            }

            val bytes = data.toByteArray()
            port.write(bytes, 1000)
            promise.resolve("📤 Sent: $data")
        } catch (e: IOException) {
            promise.reject("WRITE_ERROR", e.message, e)
        }
    }

    private fun startReading() {
        val port = serialPort ?: return
        readJob = CoroutineScope(Dispatchers.IO).launch {
            val buffer = ByteArray(1024)
            try {
                while (isActive) {
                    val len = port.read(buffer, 1000)
                    if (len > 0) {
                        val data = String(buffer, 0, len)
                        Log.d("SerialPort", "📩 Received: $data")
                        sendEvent("onReadData", data)
                    }
                }
            } catch (e: Exception) {
                Log.e("SerialPort", "Read error: ${e.message}")
                sendEvent("onError", e.message ?: "Unknown error")
            }
        }
    }

    private fun sendEvent(event: String, data: String) {
        context
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(event, data)
    }

    override fun onCatalystInstanceDestroy() {
        readJob?.cancel()
        serialPort?.close()
        connection?.close()
        super.onCatalystInstanceDestroy()
    }
}
