package com.reskiabbas.serialport

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

    private val ACTION_USB_PERMISSION = "com.reskiabbas.serialport.USB_PERMISSION"

    // 🔧 Untuk pending connect (kalau belum ada permission)
    private var pendingPromise: Promise? = null
    private var pendingBaudRate: Int = 9600

    private val usbReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            when (intent.action) {
                ACTION_USB_PERMISSION -> {
                    synchronized(this) {
                        val device: UsbDevice? =
                            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
                                intent.getParcelableExtra(UsbManager.EXTRA_DEVICE, UsbDevice::class.java)
                            } else {
                                @Suppress("DEPRECATION")
                                intent.getParcelableExtra(UsbManager.EXTRA_DEVICE)
                            }

                        if (intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false)) {
                            device?.let {
                                openSerialPort(it, pendingBaudRate, pendingPromise)
                                pendingPromise = null
                            }
                        } else {
                            pendingPromise?.reject("PERMISSION_DENIED", "USB Permission denied")
                            sendEvent("onError", "USB Permission denied")
                            pendingPromise = null
                        }
                    }
                }

                UsbManager.ACTION_USB_DEVICE_ATTACHED -> {
                    sendEvent("onDeviceAttached", "USB device attached")
                }

                UsbManager.ACTION_USB_DEVICE_DETACHED -> {
                    closeSerial()
                    sendEvent("onDeviceDetached", "USB device detached")
                }
            }
        }
    }

    override fun getName(): String = "SerialPortModule"

    @ReactMethod
    fun initSerialPort(baudRate: Int, promise: Promise) {
        usbManager = context.getSystemService(Context.USB_SERVICE) as UsbManager
        val availableDrivers = UsbSerialProber.getDefaultProber().findAllDrivers(usbManager)

        if (availableDrivers.isEmpty()) {
            promise.reject("NO_DEVICE", "No USB device found")
            return
        }

        val driver = availableDrivers[0]

        // ✅ Register broadcast receiver untuk USB permission & attach/detach event
        val filter = IntentFilter().apply {
            addAction(ACTION_USB_PERMISSION)
            addAction(UsbManager.ACTION_USB_DEVICE_ATTACHED)
            addAction(UsbManager.ACTION_USB_DEVICE_DETACHED)
        }

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            context.registerReceiver(usbReceiver, filter, Context.RECEIVER_EXPORTED)
        } else {
            @Suppress("DEPRECATION")
            context.registerReceiver(usbReceiver, filter)
        }

        // ✅ PendingIntent dengan flag aman di Android 12+
        val permissionIntent = PendingIntent.getBroadcast(
            context,
            0,
            Intent(ACTION_USB_PERMISSION),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        if (usbManager?.hasPermission(driver.device) == true) {
            openSerialPort(driver.device, baudRate, promise)
        } else {
            // simpan promise & baudRate untuk resolve setelah permission diberikan
            pendingPromise = promise
            pendingBaudRate = baudRate
            usbManager?.requestPermission(driver.device, permissionIntent)
        }
    }

    private fun openSerialPort(device: UsbDevice, baudRate: Int = 9600, promise: Promise? = null) {
        try {
            val driver = UsbSerialProber.getDefaultProber().probeDevice(device)
            if (driver == null) {
                promise?.reject("NO_DRIVER", "No driver for device")
                return
            }

            connection = usbManager?.openDevice(device)
            if (connection == null) {
                promise?.reject("OPEN_FAILED", "Failed to open device connection")
                return
            }

            serialPort = driver.ports[0]
            serialPort?.open(connection)
            serialPort?.setParameters(
                baudRate,
                8,
                UsbSerialPort.STOPBITS_1,
                UsbSerialPort.PARITY_NONE
            )

            startReading()
            promise?.resolve("✅ Serial initialized with baud $baudRate")
        } catch (e: Exception) {
            promise?.reject("INIT_ERROR", e.message, e)
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

    private fun closeSerial() {
        try {
            readJob?.cancel()
            serialPort?.close()
            connection?.close()
            serialPort = null
            connection = null
        } catch (_: Exception) {
        }
    }

    private fun sendEvent(event: String, data: String) {
        context
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(event, data)
    }

    override fun invalidate() {
        try {
            closeSerial()
            context.unregisterReceiver(usbReceiver)
        } catch (_: Exception) {
        }
        super.invalidate()
    }
}
