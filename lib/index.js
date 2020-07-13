/**
 * pid-controller -  A node advanced PID controller based on the Arduino PID library
 * github@wilberforce.co.nz Rhys Williams
 * Based on:
 * Arduino PID Library - Version 1.0.1
 * by Brett Beauregard <br3ttb@gmail.com> brettbeauregard.com
 * 
 * This Library is licensed under a GPL-3.0 License
 */

"use strict";

const Mode = {
  AUTOMATIC: 1,
  MANUAL: 0
};
const Direction = {
  DIRECT: 0,
  REVERSE: 1
};
const P_ON = {
  M: 0,
  E: 1
};

let dispKp; // * we'll hold on to the tuning parameters in user-entered 
let dispKi; //   format for display purposes
let dispKd;

/** @type {number} */
let kp; // * (P)roportional Tuning Parameter
/** @type {number} */
let ki; // * (I)ntegral Tuning Parameter
/** @type {number} */
let kd; // * (D)erivative Tuning Parameter

/** @type {number} */
let controllerDirection;
/** @type {number} */
let pOn;

let my_iosp = {
  myOutput: 0,
  myInput: 0,
  mySetpoint: 0
};

/** @type {number} */
let lastTime;
/** @type {number} */
let outputSum
/** @type {number} */
let lastInput;

/** @type {number} */
let SampleTime;
/** @type {number} */
let outMin
/** @type {number} */
let outMax;
/** @type {boolean} */
let inAuto
/** @type {boolean} */
let pOnE;


/**
 * 
 * @param {{ myOutput: number, myInput: number, mySetpoint: number }} iosp 
 * @param {number} Kp 
 * @param {number} Ki 
 * @param {number} Kd 
 * @param {number} POn 
 * @param {number} controllerDirection 
 */
function setup(iosp, Kp, Ki, Kd, POn, controllerDirection) {
  my_iosp = iosp;
  inAuto = false;

  setOutputLimits(0, 255); //default output limit corresponds to the arduino pwm limits

  SampleTime = 100; //default Controller Sample Time is 0.1 seconds

  setControllerDirection(controllerDirection);
  setTunings(Kp, Ki, Kd, POn);

  lastTime = millis() - SampleTime;
}

function millis() {
  return (new Date()).getTime();
}

/**
 *   This, as they say, is where the magic happens.  this function should be called
 *   every time "void loop()" executes.  the function will decide for itself whether a new
 *   pid Output needs to be computed.  returns true when the output is computed,
 *   false when nothing has been done.
 */
function compute() {
  if (!inAuto) return false;
  const now = millis();
  const timeChange = (now - lastTime);
  if (timeChange >= SampleTime) {
    /*Compute all the working error variables*/
    const input = my_iosp.myInput;
    const error = my_iosp.mySetpoint - input;
    const dInput = (input - lastInput);
    outputSum += (ki * error);

    /*Add Proportional on Measurement, if P_ON_M is specified*/
    if (!pOnE) outputSum -= kp * dInput;

    if (outputSum > outMax) outputSum = outMax;
    else if (outputSum < outMin) outputSum = outMin;

    /*Add Proportional on Error, if P_ON_E is specified*/
    let output;
    if (pOnE) output = kp * error;
    else output = 0;

    /*Compute Rest of PID Output*/
    output += outputSum - kd * dInput;

    if (output > outMax) output = outMax;
    else if (output < outMin) output = outMin;
    my_iosp.myOutput = output;

    /*Remember some variables for next time*/
    lastInput = input;
    lastTime = now;
    return true;
  } else return false;
}
/**
 * This function allows the controller's dynamic performance to be adjusted.
 * it's called automatically from the constructor, but tunings can also
 * be adjusted on the fly during normal operation
 * @param {number} Kp 
 * @param {number} Ki 
 * @param {number} Kd 
 * @param {number} POn 
 */
function setTunings(Kp, Ki, Kd, POn = pOn) {
  if (Kp < 0 || Ki < 0 || Kd < 0) return;

  pOn = POn;
  pOnE = POn == P_ON.E;

  dispKp = Kp;
  dispKi = Ki;
  dispKd = Kd;

  const SampleTimeInSec = SampleTime / 1000;
  kp = Kp;
  ki = Ki * SampleTimeInSec;
  kd = Kd / SampleTimeInSec;

  if (controllerDirection == Direction.REVERSE) {
    kp = (0 - kp);
    ki = (0 - ki);
    kd = (0 - kd);
  }
}
/**
 * sets the period, in Milliseconds, at which the calculation is performed
 * @param {number} newSampleTime 
 */
function setSampleTime(newSampleTime) {
  if (newSampleTime > 0) {
    const ratio = newSampleTime / SampleTime;
    ki *= ratio;
    kd /= ratio;
    SampleTime = newSampleTime;
  }
}
/**
 *  This function will be used far more often than SetInputLimits.  while
 *  the input to the controller will generally be in the 0-1023 range (which is
 *  the default already,)  the output will be a little different.  maybe they'll
 *  be doing a time window and will need 0-8000 or something.  or maybe they'll
 *  want to clamp it from 0-125.  who knows.  at any rate, that can all be done
 *  here.
 * @param {number} min 
 * @param {number} max 
 */
function setOutputLimits(min, max) {
  if (min >= max) return;
  outMin = min;
  outMax = max;

  if (inAuto) {
    if (my_iosp.myOutput > outMax) my_iosp.myOutput = outMax;
    else if (my_iosp.myOutput < outMin) my_iosp.myOutput = outMin;

    if (outputSum > outMax) outputSum = outMax;
    else if (outputSum < outMin) outputSum = outMin;
  }
}
/**
 * Allows the controller Mode to be set to manual (0) or Automatic (non-zero)
 * when the transition from manual to auto occurs, the controller is
 * automatically initialized
 * @param {number} mode
 */
function setMode(mode) {
  const newAuto = (mode == Mode.AUTOMATIC);
  if (newAuto && !inAuto) {  /*we just went from manual to auto*/
    initialize();
  }
  inAuto = newAuto;
}
/**
 * does all the things that need to happen to ensure a bumpless transfer
 * from manual to automatic mode.
 */
function initialize() {
  outputSum = my_iosp.myOutput;
  lastInput = my_iosp.myInput;
  if (outputSum > outMax) outputSum = outMax;
  else if (outputSum < outMin) outputSum = outMin;
}
/**
 * The PID will either be connected to a DIRECT acting process (+Output leads
 * to +Input) or a REVERSE acting process(+Output leads to -Input.)  we need to
 * know which one, because otherwise we may increase the output when we should
 * be decreasing.  This is called from the constructor.
 * @param {number} direction
 */
function setControllerDirection(direction) {
  if (inAuto && direction != controllerDirection) {
    kp = (0 - kp);
    ki = (0 - ki);
    kd = (0 - kd);
  }
  controllerDirection = direction;
}
function getKp() { return dispKp; }
function getKi() { return dispKi; }
function getKd() { return dispKd; }
function getMode() { return inAuto ? AUTOMATIC : MANUAL; }
function getDirection() { return controllerDirection; }

module.exports = {
  Mode,
  Direction,
  P_ON,
  setup,
  setMode,
  compute,
  setOutputLimits,
  setTunings,
  setControllerDirection,
  setSampleTime,
  getKp,
  getKi,
  getKd,
  getMode,
  getDirection
}
