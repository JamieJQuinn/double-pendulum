var MASS = 100;
var LENGTH = 50;
var GRAVITY = 9.81;
var MAX_POINTS = 1000;
var VISCOSITY = 0.001;
var SCALE = 4;
var bg_colour;
var ALPHA = 0.1;

var alphaBlending = false;
var clearEnabled = true;
var alphaVal = 255;

var showPathEnabled = true;
var showPendulum1Enabled = true;
var showPendulum2Enabled = true;
var paused = false;

var dt = 0.1;

var pendulum;
var translate_x, translate_y
var bg_colour;

function setup() {
  createCanvas(windowWidth, windowHeight);
  frameRate(60);

  translate_x = width/2;
  translate_y = height/2;
  bg_colour = color(51);

  pendulum = new DoublePendulum(0, 0, MASS, LENGTH, MASS/2, LENGTH/2, -PI, -PI/2);

  var settings = QuickSettings.create(5, 5, "Settings ('s' to hide)");
  settings.setKey("s");
  settings.addBoolean("Alpha Blending", alphaBlending, toggleAlphaBlending);
  settings.addBoolean("Path", showPathEnabled, function() {
    showPathEnabled = !showPathEnabled;
  });
  settings.addBoolean("Paused", paused, function() {
    paused = !paused;
  });
  settings.addBoolean("Pendulum 1", showPendulum1Enabled, function() {
    showPendulum1Enabled = !showPendulum1Enabled;
  });
  settings.addBoolean("Pendulum 2", showPendulum2Enabled, function() {
    showPendulum2Enabled = !showPendulum2Enabled;
  });
  settings.addColor("BG Colour", bg_colour, function(c) {
    bg_colour = color(c);
  });
  settings.addColor("Path Colour", pendulum.path.colour, function(c) {
    pendulum.path.colour = color(c);
  });
  settings.addColor("Pendulum Colour", pendulum.colour, function(c) {
    pendulum.colour = color(c);
  });
  settings.addRange("Pendulum 1 Mass", 0.1, 100, pendulum.m1, 1, function(val) {
    print(val);
    pendulum.m1 = val;
  });
  settings.addRange("Pendulum 1 Length", 0.1, 100, pendulum.l1, 1, function(val) {
    pendulum.l1 = val;
  });
  settings.addRange("Pendulum 2 Mass", 0.1, 100, pendulum.m2, 1, function(val) {
    pendulum.m2 = val;
  });
  settings.addRange("Pendulum 2 Length", 0.1, 100, pendulum.l2, 1, function(val) {
    pendulum.l2 = val;
  });
}

function toggleAlphaBlending() {
  if (alphaBlending) {
    alphaVal = 255;
  } else {
    background(bg_colour);
    alphaVal = ALPHA;
  }
  pendulum.path.colour._array[3] = alphaVal*4;
  pendulum.colour._array[3] = alphaVal;
  alphaBlending = !alphaBlending;
  clearEnabled = !clearEnabled;
}

function setPendulumEnd() {
  var xPos = (mouseX-translate_x)/SCALE;
  var yPos = (mouseY-translate_y)/SCALE;

  var alpha = atan2(xPos, yPos);
  var r = Math.sqrt(xPos*xPos + yPos*yPos);
  if (r >= pendulum.l1 + pendulum.l2) {
    pendulum.theta1 = pendulum.theta2 = alpha;
  } else {
    var x2 = (Math.pow(pendulum.l2, 2) - Math.pow(pendulum.l1, 2) + Math.pow(r, 2))/(2*r);
    var x1 = r - x2;
    pendulum.theta1 = alpha + Math.acos(x1/pendulum.l1);
    pendulum.theta2 = alpha - Math.acos(x2/pendulum.l2);
  }
  pendulum.dtheta1 = pendulum.dtheta2 = 0;
  var pos = pendulum.pos2();
  pendulum.path.setAll(pos[0], pos[1], 0);
}

function mouseClicked() {
  if (mouseX > width/4 &&
      mouseX < width*3/4) {
    setPendulumEnd();
  }
}

function mouseWheel(event) {
  var delta = event.delta/30;
  SCALE -= delta;
  var x = (mouseX - translate_x)/SCALE;
  var y = (mouseY - translate_y)/SCALE;
  translate_x += x*delta;
  translate_y += y*delta;
}

function draw() {
  if (clearEnabled) {
    background(bg_colour);
  }
  translate(translate_x, translate_y);
  if (! paused) {
    pendulum.run();
  }
  if ( !(paused && alphaBlending) ) {
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
}

var DoublePendulum = function(x0, y0, m1, l1, m2, l2, theta1, theta2) {
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
  this.path.push(pos2[0], pos2[1], Math.pow(this.dtheta1, 2), Math.pow(this.dtheta2, 2));
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
  if (!alphaBlending) {
    while (count < MAX_POINTS - 1 ){
      pj = j;
      j = (j+1) % MAX_POINTS;
      ++count;
      var val = count/MAX_POINTS*255;
      stroke(red(this.colour), blue(this.colour), green(this.colour), val);
      var linewidth = map(this.z[j], 0, 0.26, 0.2, 1);
      strokeWeight(linewidth);
      line(SCALE*this.x[pj], SCALE*this.y[pj], SCALE*this.x[j], SCALE*this.y[j]);
      //ellipse(this.x[j], this.y[j], linewidth, linewidth);
    }
  } else {
    var j = this.last;
    var pj = (this.last-1)%MAX_POINTS;
    stroke(this.colour);
    line(SCALE*this.x[pj], SCALE*this.y[pj], SCALE*this.x[j], SCALE*this.y[j]);
  }
};
