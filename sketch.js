var MASS = 100;
var LENGTH = 150;
var GRAVITY = 9.81;
var SPRING_K = 50;
var MAX_POINTS = 1000;
var VISCOSITY = 0.001;

var dt = 0.1;

var paths = []

var sigmaBox;
var betaBox;
var rhoBox;

var pendulum;

function setup() {
  createCanvas(windowWidth, windowHeight);
  frameRate(60);

  pendulum = new DoublePendulum(0, 0, MASS, LENGTH, MASS, LENGTH, PI/2, 0);
}

function simulate_spring_pendulum() {
  for (var i=0; i < paths.length; ++i) {
    p = paths[i];

    var r = Math.sqrt(x*x + y*y);
    forceX = -SPRING_K*(r-LENGTH)*x/r;
    forceY = -SPRING_K*(r-LENGTH)*y/r + MASS*GRAVITY;

    vx += forceX/MASS*dt;
    vy += forceY/MASS*dt;

    x += vx*dt;
    y += vy*dt;

    p.push(x, y);
    p.display();
  }
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
  setPendulumEnd();
}

function mouseDragged() {
  print("dragged");
  setPendulumEnd();
}

function draw() {
  background(51);
  translate(width/2, height/2);
  pendulum.run();
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
  //this.path = new Path(x0)
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

  stroke(255);
  var pos1 = this.pos1();
  var pos2 = this.pos2();
  line(this.origin[0], this.origin[1], pos1[0], pos1[1]);
  line(pos1[0], pos1[1], pos2[0], pos2[1]);

  //p.push(x, y, dtheta1*dtheta1 + dtheta2*dtheta2);
  //for(var i=0; i<p.x.length; ++i) {
    //p.x[i] -= 0.5;
  //}
  //p.display();
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
  this.velocity = createVector(0, 0, 0);
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

// Method to update position
Path.prototype.update = function(){
  var prev = this.last;
  this.last = (this.last+1) % MAX_POINTS;
  this.x[this.last] = this.x[prev] + this.velocity.x * dt;
  this.y[this.last] = this.y[prev] + this.velocity.y * dt;
  this.z[this.last] = this.z[prev] + this.velocity.z * dt;
};

// Method to display
Path.prototype.display = function() {
  var count = 0;
  var j = (this.last+1)%MAX_POINTS;
  var pj = this.last;
  while (count < MAX_POINTS - 1 ){
    pj = j;
    j = (j+1) % MAX_POINTS;
    ++count;
    var val = count/MAX_POINTS*204 + 51;
    stroke(val);
    var linewidth = map(this.z[j], 0, 0.26, 0.2, 1);
    strokeWeight(linewidth);
    line(this.x[pj], this.y[pj], this.x[j], this.y[j]);
    //ellipse(this.x[j], this.y[j], linewidth, linewidth);
  }
};
