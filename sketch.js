var MAX_MASS = 200;
var MAX_LENGTH = 50;
var GRAVITY = 9.81;
var MAX_POINTS = 1000;
var VISCOSITY = 0.001;
var SCALE = 4;
var bg_colour;
var ALPHA = 0.1;

var pathFade = true;
var clearEnabled = true;
var alphaVal = 255;

var showPathEnabled = true;
var showPendulum1Enabled = true;
var showPendulum2Enabled = true;
var showVelocity = true;
var paused = false;
var soundWaveModeEnabled = false;

var dt = 0.1;

var settings;
var pendulum;
var translate_x, translate_y
var bg_colour;

function setup() {
  canvas = createCanvas(windowWidth, windowHeight);
  frameRate(60);

  translate_x = width/2;
  translate_y = height/2;
  bg_colour = color(51);

  pendulum = new DoublePendulum();

  QuickSettings.useExtStyleSheet();
  settings = QuickSettings.create(5, 5, "Settings ('s' to hide)");
  settings.setKey("s");
  settings.addBoolean("Path", showPathEnabled, function() {
    showPathEnabled = !showPathEnabled;
  });
  settings.addBoolean("Path Fade", pathFade, function() {
    pathFade = !pathFade;
  });
  settings.addBoolean("Path Velocity", showVelocity, function() {
    showVelocity = !showVelocity;
  });
  settings.addBoolean("Paused", paused, function() {
    paused = !paused;
  });
  settings.addRange("FPS", 1, 120, 60, 1, function(val) {
    frameRate(val);
  });
  settings.addBoolean("Show Pendulum 1", showPendulum1Enabled, function() {
    showPendulum1Enabled = !showPendulum1Enabled;
  });
  settings.addBoolean("Show Pendulum 2", showPendulum2Enabled, function() {
    showPendulum2Enabled = !showPendulum2Enabled;
  });
  settings.addButton("Randomise Colours", function() {
    settings.setValue("BG Colour", randomColour());
    settings.setValue("BG Alpha", random(255));
    settings.setValue("Path Colour", randomColour(false));
    settings.setValue("Pendulum Colour", randomColour(false));
  });
  settings.addButton("Randomise Pendulum", randomisePendulum);
  //settings.addBoolean("Sound Wave Mode", soundWaveModeEnabled, function() {
    //if (soundWaveModeEnabled) {
      //pendulum.origin = [0, 0];
      //pendulum.path.colour._array[3] = ALPHA;
    //} else {
      //pendulum.origin = getSimulationCoordinates(width*3/4, height/2);
      //pendulum.path.colour._array[3] = alphaVal;
    //}
    //soundWaveModeEnabled = !soundWaveModeEnabled;
  //});
  settings.addColor("BG Colour", stringFromColour(bg_colour), function(c) {
    bg_colour = color(c);
  });
  settings.addRange("BG Alpha", 0, 255, alpha(bg_colour), 0.1, function(val) {
    bg_colour = newColor(bg_colour, val);
  });
  settings.addColor("Path Colour", stringFromColour(pendulum.path.colour), function(c) {
    pendulum.path.colour = color(c);
  });
  settings.addRange("Path Alpha", 0, 255, alpha(pendulum.path.colour), 0.1, function(val) {
    pendulum.path.colour = newColor(pendulum.path.colour, val);
  });
  settings.addColor("Pendulum Colour", stringFromColour(pendulum.colour), function(c) {
    pendulum.colour = color(c);
  });
  settings.addRange("Pendulum 1 Mass", 0.1, MAX_MASS, pendulum.m1, 1, function(val) {
    pendulum.m1 = val;
  });
  settings.addRange("Pendulum 1 Length", 0.1, MAX_LENGTH, pendulum.l1, 1, function(val) {
    pendulum.l1 = val;
  });
  settings.addRange("Pendulum 2 Mass", 0.1, MAX_MASS, pendulum.m2, 1, function(val) {
    pendulum.m2 = val;
  });
  settings.addRange("Pendulum 2 Length", 0.1, MAX_LENGTH, pendulum.l2, 1, function(val) {
    pendulum.l2 = val;
  });

  randomisePendulum();
}

function randomColour(randomiseAlpha) {
  var r = random(255);
  var g = random(255);
  var b = random(255);
  var a = 255;
  if (randomiseAlpha) {
    a = random(255);
  } else {
    a = 255
  }
  return color(r, g, b, a);
}

function randomisePendulum() {
  var m1 = Math.random()*MAX_MASS + 1;
  var m2 = Math.random()*MAX_MASS + 1;
  var l1 = Math.random()*MAX_LENGTH + 1;
  var l2 = Math.random()*MAX_LENGTH + 1;

  settings.setValue("Pendulum 1 Mass", m1);
  settings.setValue("Pendulum 1 Length", l1);
  settings.setValue("Pendulum 2 Mass", m2);
  settings.setValue("Pendulum 2 Length", l2);

  pendulum.theta1 = Math.random()*2*PI;
  pendulum.theta2 = Math.random()*2*PI;
  pendulum.reset();
}

function hexFromNumber(n) {
  var hex = Math.round(n).toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function stringFromColour(c) {
  return '#' + hexFromNumber(red(c)) + hexFromNumber(green(c)) + hexFromNumber(blue(c));
}

function getSimulationCoordinates (x, y) {
  return [(x-translate_x)/SCALE, (y-translate_y)/SCALE];
}

function newColor(color_in, alpha) {
  return color(red(color_in), green(color_in), blue(color_in), alpha);
}

function setPendulumEnd(xPos, yPos) {
  var alpha = atan2(xPos, yPos);
  var r = Math.sqrt(xPos*xPos + yPos*yPos);
  if (r >= pendulum.l1 + pendulum.l2) {
    if(r >= pendulum.l1+pendulum.l2 + 10) {
      return;
    }
    pendulum.theta1 = pendulum.theta2 = alpha;
  } else if (pendulum.l1 > pendulum.l2 && r <= pendulum.l1 - pendulum.l2) {
    pendulum.theta1 = alpha;
    pendulum.theta2 = alpha+PI;
  } else if (pendulum.l2 > pendulum.l1 && r <= pendulum.l2 - pendulum.l1) {
    pendulum.theta1 = alpha+PI;
    pendulum.theta2 = alpha;
  } else {
    var x2 = (Math.pow(pendulum.l2, 2) - Math.pow(pendulum.l1, 2) + Math.pow(r, 2))/(2*r);
    var x1 = r - x2;
    pendulum.theta1 = alpha + Math.acos(x1/pendulum.l1);
    pendulum.theta2 = alpha - Math.acos(x2/pendulum.l2);
  }
  pendulum.reset();
}

function mouseWheel(event) {
  var delta = event.delta/30;
  SCALE -= delta;
}

function draw() {
  if (! paused) {
    background(bg_colour);
    translate(translate_x, translate_y);
    pendulum.run();
    pendulum.display();
  }
  if (keyIsDown(LEFT_ARROW)) {
    translate_x -= 5;
  } else if (keyIsDown(RIGHT_ARROW)) {
    translate_x += 5;
  } else if (keyIsDown(DOWN_ARROW)) {
    translate_y += 5;
  } else if (keyIsDown(UP_ARROW)) {
    translate_y -= 5;
  }
  if (mouseIsPressed) {
    if (mouseButton == LEFT) {
      var xPos = (mouseX-translate_x)/SCALE;
      var yPos = (mouseY-translate_y)/SCALE;

      setPendulumEnd(xPos, yPos);
    }
  }
}

var DoublePendulum = function(x0=0, y0=0, m1=0, l1=0, m2=0, l2=0, theta1=0, theta2=0) {
  this.origin = [x0, y0];
  this.m1 = m1;
  this.l1 = l1;
  this.m2 = m2;
  this.l2 = l2;
  this.theta1 = theta1;
  this.theta2 = theta2;
  this.dtheta1 = 0;
  this.dtheta2 = 0;
  this.path = new Path(this.pos2()[0], this.pos2()[1], 0);
  this.colour = color(255, 255, 255, alphaVal);
};

DoublePendulum.prototype.run = function() {
  var delta = this.theta2 - this.theta1;
  var LHS1 = this.m2*this.l2*Math.pow(this.dtheta2, 2)*Math.sin(delta) - (this.m1+this.m2)*GRAVITY*Math.sin(this.theta1);
  var LHS2 = -this.l1*Math.pow(this.dtheta1, 2)*Math.sin(delta) - GRAVITY*Math.sin(this.theta2);
  var ddtheta1 = 1/this.l1*(LHS1 - this.m2*LHS2*Math.cos(delta))/(this.m1 + this.m2*Math.pow(Math.sin(delta), 2));
  var ddtheta2 = 1/this.l2*(LHS2 - this.l1*ddtheta1*Math.cos(delta));
  this.dtheta1 += ddtheta1 * dt;
  this.dtheta2 += ddtheta2 * dt;
  this.theta1 += this.dtheta1 * dt;
  this.theta2 += this.dtheta2 * dt;

  var pos1 = this.pos1();
  var pos2 = this.pos2();

  if( soundWaveModeEnabled ) {
    this.path.push(this.origin[0], pos2[1], 0);
  } else {
    this.path.push(pos2[0], pos2[1], Math.pow(this.dtheta1, 2), Math.pow(this.dtheta2, 2));
  }
};

DoublePendulum.prototype.display = function() {
  var pos1 = this.pos1();
  var pos2 = this.pos2();
    stroke(this.colour);
    strokeWeight(1);
  if (showPendulum1Enabled) {
    line(SCALE*this.origin[0], SCALE*this.origin[1], SCALE*pos1[0], SCALE*pos1[1]);
  }
  if (showPendulum2Enabled) {
    line(SCALE*pos1[0], SCALE*pos1[1], SCALE*pos2[0], SCALE*pos2[1]);
  }
  if (soundWaveModeEnabled && !paused) {
    for (var i=0; i<this.path.x.length; ++i) {
      this.path.x[i] -= 0.2;
    }
  }
  if (showPathEnabled) {
    this.path.display();
  }
};

DoublePendulum.prototype.pos1 = function() {
  return [this.origin[0] + this.l1*Math.sin(this.theta1), this.origin[1] + this.l1*Math.cos(this.theta1)];
};

DoublePendulum.prototype.pos2 = function() {
  var pos1 = this.pos1();
  return [pos1[0] + this.l2*Math.sin(this.theta2), pos1[1] + this.l2*Math.cos(this.theta2)];
};

DoublePendulum.prototype.reset = function() {
  this.dtheta1 = this.dtheta2 = 0;
  var pos = this.pos2();
  this.path.setAll(pos[0], pos[1], 0);
};

// A simple Path class
var Path = function(x_0, y_0, z_0) {
  this.x = Array.apply(null, Array(MAX_POINTS)).map(Number.prototype.valueOf,x_0);
  this.y = Array.apply(null, Array(MAX_POINTS)).map(Number.prototype.valueOf,y_0);
  this.z = Array.apply(null, Array(MAX_POINTS)).map(Number.prototype.valueOf,z_0);
  this.last = 0;
  this.colour = color(255, 255, 255, alphaVal);
};

Path.prototype.setAll = function(x, y, z) {
  for(var i=0; i<this.x.length; ++i) {
    this.x[i] = x;
    this.y[i] = y;
    this.z[i] = z;
  }
  this.last = 0;
};

Path.prototype.push = function(x, y, z) {
  var prev = this.last;
  this.last = (this.last+1) % MAX_POINTS;
  this.x[this.last] = x;
  this.y[this.last] = y;
  this.z[this.last] = z;
};

// Method to display
Path.prototype.display = function() {
  var count = 0;
  var j = (this.last+1)%MAX_POINTS;
  var pj = this.last;
  if (pathFade) {
    while (count < MAX_POINTS - 1 ){
      pj = j;
      j = (j+1) % MAX_POINTS;
      ++count;
      var val = count/MAX_POINTS*255;
      stroke(red(this.colour), green(this.colour), blue(this.colour), alpha(this.colour)*count/MAX_POINTS);
      strokeCap(SQUARE);
      if(showVelocity) {
        var linewidth = map(this.z[j], 0, 0.26, 0.2, 1);
        strokeWeight(linewidth);
      }
      line(SCALE*this.x[pj], SCALE*this.y[pj], SCALE*this.x[j], SCALE*this.y[j]);
      //ellipse(this.x[j], this.y[j], linewidth, linewidth);
    }
  } else {
    var j = this.last;
    var pj = (this.last-1)%MAX_POINTS;
    stroke(this.colour);
    if(showVelocity) {
      var linewidth = map(this.z[j], 0, 0.26, 0.2, 1);
      strokeWeight(linewidth);
    }
    line(SCALE*this.x[pj], SCALE*this.y[pj], SCALE*this.x[j], SCALE*this.y[j]);
  }
};
