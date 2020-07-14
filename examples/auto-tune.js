const PID = require('../lib');
const AutoTune = require('../lib/pid-auto-tune');


let temperature = 150;
const iosp = {
  input: temperature,
  output: 0,
  setpoint: 250
};
const maxHeatingStepPerSecond = 0.00177;
const maxCoolingStepPerSecond = -0.0005;

/*
let Kp = 0.5;
let Ki = 0.2;
let Kd = 0.3;
//*/
/*
let Kp = 0.014986508732562508;
let Ki = 0.0013580886934809703;
let Kd = 0.04134403096595682;
//*/
let Kp = 0.15251817812024074;
let Ki = 0.004406575216914631;
let Kd = 1.319720730502178;


const timeframe = 250;
const lowerLimit = 0;
const upperLimit = 100;

PID.setup(iosp, Kp, Ki, Kd, PID.P_ON.E, PID.Direction.DIRECT);
PID.setSampleTime(timeframe);
PID.setOutputLimits(lowerLimit, upperLimit);
PID.setMode(PID.Mode.AUTOMATIC);

AutoTune.Setup(iosp, 0, 100);

const aTuneLookBack = 20;
let ATuneModeRemember = 2;

let tuning = false;
changeAutoTune();
tuning = true;
let i = 0;
setInterval(temperatureSimulation, timeframe);


function temperatureSimulation() {
  iosp.input = temperature;

  if (tuning) {
    var autoTuneResult = AutoTune.Runtime();
    tuning = autoTuneResult == 0;
    if (!tuning) {
      console.log(`Kp: ${AutoTune.GetKp()} ; Ki: ${AutoTune.GetKi()} ; Kd: ${AutoTune.GetKd()}`)
      Kp = AutoTune.GetKp();
      Ki = AutoTune.GetKi();
      Kd = AutoTune.GetKd();
      PID.setTunings(Kp, Ki, Kd, PID.P_ON.E);
      AutoTuneHelper(false);
    }
  } else PID.compute();

  if (i % (1000 / timeframe) === 0) {
    temperature += iosp.output * maxHeatingStepPerSecond + (upperLimit - iosp.output) * maxCoolingStepPerSecond;
  }
  console.log(`autoTuneResult : ${autoTuneResult} ; Output : ${iosp.output} ; Temp : ${Math.round(temperature * 100) / 100}°F`);
  i++;
};

function changeAutoTune() {
  if (!tuning) {
    //Set the output to the desired starting frequency.
    iosp.output = 0;
    AutoTune.SetNoiseBand(maxHeatingStepPerSecond / 3);
    AutoTune.SetOutputStep(10);
    AutoTune.SetLookbackSec(aTuneLookBack);
    AutoTuneHelper(true);
    tuning = true;
  } else { //cancel autotune
    AutoTune.Cancel();
    tuning = false;
    AutoTuneHelper(false);
  }
}

function AutoTuneHelper(start) {
  if (start)
    ATuneModeRemember = PID.getMode();
  else
    PID.setMode(ATuneModeRemember);
}
