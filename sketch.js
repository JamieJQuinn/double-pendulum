var MASS = 100;
var LENGTH = 50;
var GRAVITY = 9.81;
var MAX_POINTS = 1000;
var VISCOSITY = 0.001;
var SCALE = 4;
var BG_COLOUR = 51;
var ALPHA = 0.1;

var alphaBlendingButton;
var alphaBlending = false;
var clearEnabled = true;
var alphaVal = 1;

var showPathButton;
var showPathEnabled = true;
var showPendulumButton;
var showPendulumEnabled = true;

var dt = 0.1;

var pendulum;
var translate_x, translate_y

function setup() {
  createCanvas(windowWidth, windowHeight);
  frameRate(60);

  translate_x = width/2;
  translate_y = height/2;

  alphaBlendingButton = createButton('Toggle Alpha Blending');
  alphaBlendingButton.position(20, 20);
  alphaBlendingButton.mousePressed(toggleAlphaBlending);

  showPathButton = createButton('Toggle Path');
  showPathButton.position(20, 50);
  showPathButton.mousePressed(function() {showPathEnabled = !showPathEnabled});

  showPendulumButton = createButton('Toggle Pendulum');
  showPendulumButton.position(20, 80);
  showPendulumButton.mousePressed(function() {showPendulumEnabled = !showPendulumEnabled});

  pendulum = new DoublePendulum(0, 0, MASS, LENGTH, MASS, LENGTH, -PI, -PI/2);
}

function toggleAlphaBlending() {
  if (alphaBlending) {
    alphaVal = 1;
  } else {
    background(BG_COLOUR);
    alphaVal = ALPHA;
  }
  pendulum.getPathColour()[3] = alphaVal;
  pendulum.colour[3] = alphaVal;
  alphaBlending = !alphaBlending;
  clearEnabled = !clearEnabled;
}

function setPendulumEnd() {
  var xPos = mouseX-width/2;
  var yPos = mouseY-height/2;

  var alpha = atan2(xPos, yPos);
  var r = Math.sqrt(xPos*xPos + yPos*yPos);
  if (r >= 2*LENGTH) {
    theta1 = theta2 = alpha;
  } else {
    theta1 = alpha - Math.acos(r/(2*LENGTH));
    theta2 = alpha + Math.acos(r/(2*LENGTH));
  }
  dtheta1 = dtheta2 = 0;
  x2 = LENGTH*(Math.sin(theta1) + Math.sin(theta2));
  y2 = LENGTH*(Math.cos(theta1) + Math.cos(theta2));
  paths[0].setAll(x2, y2, 0);
}

function mouseReleased() {
  //setPendulumEnd();
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
    background(51);
  }
  translate(translate_x, translate_y);
  pendulum.run();
  pendulum.display();
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
  this.colour = [0, 0, 0, alphaVal];
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
  this.path.push(pos2[0], pos2[1], 0);
};

DoublePendulum.prototype.display = function() {
  var pos1 = this.pos1();
  var pos2 = this.pos2();
  if (showPendulumEnabled) {
    stroke(this.colour[0]*255, this.colour[1]*255, this.colour[2]*255, this.colour[3]*255);
    strokeWeight(1);
    line(SCALE*this.origin[0], SCALE*this.origin[1], SCALE*pos1[0], SCALE*pos1[1]);
    line(SCALE*pos1[0], SCALE*pos1[1], SCALE*pos2[0], SCALE*pos2[1]);
  }
  if (showPathEnabled) {
    this.path.display();
  }
};

DoublePendulum.prototype.getPathColour = function() {
  return this.path.colour;
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
  this.colour = [1, 1, 1, alphaVal];
};

Path.prototype.run = function() {
  this.update();
  this.display();
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
      var val = count/MAX_POINTS*204 + 51;
      stroke(val);
      var linewidth = map(this.z[j], 0, 0.26, 0.2, 1);
      strokeWeight(linewidth);
      line(SCALE*this.x[pj], SCALE*this.y[pj], SCALE*this.x[j], SCALE*this.y[j]);
      //ellipse(this.x[j], this.y[j], linewidth, linewidth);
    }
  } else {
    var j = this.last;
    var pj = (this.last-1)%MAX_POINTS;
    var val = 255-BG_COLOUR;
    stroke(val*this.colour[0]+BG_COLOUR,
           val*this.colour[1]+BG_COLOUR,
           val*this.colour[2]+BG_COLOUR,
           255*this.colour[3]);
    line(SCALE*this.x[pj], SCALE*this.y[pj], SCALE*this.x[j], SCALE*this.y[j]);
  }
};
