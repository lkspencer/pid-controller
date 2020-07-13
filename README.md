# pid-controller

Node.js PID controller

An advanced PID controller based on the Arduino PID library

## Installation

```
$ npm install pid-controller
```

## Use



## Example

##### Temperature Control Simulation

```javascript
const PID = require('pid-controller');
const iosp = {
  input: 10,
  output: 0,
  setpoint: 21
};

var temperature = 10,
    temperatureSetpoint = 21,
    heating = 0.001,
    cooling = -0.0005;

var Kp = 500,
    Ki = 200,
    Kd = 0;

PID.setup(iosp, Kp, Ki, Kd, PID.P_ON.E, PID.Direction.DIRECT);
const timeframe = 1000;
const lowerLimit = 0;
const upperLimit = 1000;

PID.setSampleTime(timeframe);
PID.setOutputLimits(lowerLimit, upperLimit);
PID.setMode(PID.Mode.AUTOMATIC);

var temperaturesimulation = function() {
    if (typeof temperaturesimulation.counter == 'undefined') {
        temperaturesimulation.counter = 0;
    }
    iosp.input = temperature;
    PID.compute();
    temperature += iosp.output * heating + (limit - iosp.output) * cooling;
    if (Math.round(temperature * 100) / 100 == 21) {
        temperaturesimulation.counter++;
        if (temperaturesimulation.counter == 5) {
            PID.setMode(newPid.Mode.MANUAL)
            iosp.output = 0;
            temperaturesimulation.counter = 0;
        }
    }
    if (Math.round(temperature * 100) / 100 == 1) {
        PID.setMode(newPid.Mode.AUTOMATIC)
    }
    console.log(`Output : ${iosp.output} ; Temp : ${Math.round(temperature * 100) / 100}°c`);
};
setInterval(temperaturesimulation, timeframe);
```

## Author

Rhys Williams
