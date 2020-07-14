const PID = require('../lib');
const AutoTune = require('../lib/pid-auto-tune');


let Kp = 0.5;
let Ki = 0.2;
let Kd = 0.2;
let temperature = 150;
const iosp = {
  input: temperature,
  output: 0,
  setpoint: 250
};
const maxHeatingStepPerSecond = 0.00177;
const maxCoolingStepPerSecond = -0.0005;
const timeframe = 250;
const lowerLimit = 0;
const upperLimit = 100;


function autoTuneSimulation() {
  AutoTune.Setup({ iosp, min: 0, max: 100, useFakeTime: true });
  AutoTune.SetNoiseBand(maxHeatingStepPerSecond / 3);
  AutoTune.SetOutputStep(1);
  AutoTune.SetLookbackSec(20);
  let temperature = 150;
  iosp.input = temperature;
  iosp.output = 0;
  iosp.setpoint = 250;
  for (let i = 0; true; i++) {
    iosp.input = temperature;
    var autoTuneResult = AutoTune.Runtime();
    if (autoTuneResult != 0) {
      Kp = AutoTune.GetKp();
      Ki = AutoTune.GetKi();
      Kd = AutoTune.GetKd();
      console.log(`let Kp = ${Kp};\nlet Ki = ${Ki};\nlet Kd = ${Kd};`)
      return {
        Kp,
        Ki,
        Kd
      };
    }

    if (i % (1000 / timeframe) === 0) {
      temperature += iosp.output * maxHeatingStepPerSecond + (upperLimit - iosp.output) * maxCoolingStepPerSecond;
    }
    console.log(`autoTuneResult : ${autoTuneResult} ; Output : ${iosp.output} ; Temp : ${Math.round(temperature * 100) / 100}°F`);
  }
};

function temperatureSimulation() {
  PID.setup(iosp, Kp, Ki, Kd, PID.P_ON.E, PID.Direction.DIRECT, true);
  PID.setSampleTime(timeframe);
  PID.setOutputLimits(lowerLimit, upperLimit);
  PID.setMode(PID.Mode.AUTOMATIC);
  let max = temperature;
  let min = temperature;
  let sinusoidalFluctuation = 2;
  let isValley = true;

  for (let i = 0; true; i++) {
    iosp.input = temperature;
    PID.compute();
  
    if (i % (1000 / timeframe) === 0) {
      temperature += iosp.output * maxHeatingStepPerSecond + (upperLimit - iosp.output) * maxCoolingStepPerSecond;
    }
    if (temperature < iosp.setpoint && !isValley) {
      if (max - min < sinusoidalFluctuation) return;
      min = temperature;
    }
    if (temperature >= iosp.setpoint && isValley) {
      if (max - min < sinusoidalFluctuation) return;
      max = temperature;
    }
    isValley = temperature < iosp.setpoint;
  
    max = temperature > max ? temperature : max;
    min = temperature < min ? temperature : min;
    console.log(`Temp: ${Math.round(temperature * 100) / 100}°F - Max: ${max}°F - Min: ${min} - i: ${i}`);
  }
};

({Kp, Ki, Kd} = autoTuneSimulation());
temperatureSimulation();
