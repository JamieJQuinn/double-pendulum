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

var x, y;
var vx, vy;
var forceX, forceY;

var theta1, theta2, p1, p2;
var dtheta1, dtheta2, dp1, dp2;

function setup() {
  createCanvas(windowHeight, windowHeight);
  frameRate(60);

  x = 100;
  y = 110;
  vx = 0;
  vy = 0;

  theta1 = 0;
  theta2 = 0;
  p1 = 0;
  p2 = 0
  dtheta1 = 0;
  dtheta2 = 0;
  dp1 = 0;
  dp2 = 0

  x = LENGTH*(Math.sin(theta1) + Math.sin(theta2));
  y = LENGTH*(Math.cos(theta1) + Math.cos(theta2));

  paths.push(new Path(x, y, 0));
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

function simulate_double_pendulum() {
  for (var i=0; i < paths.length; ++i) {
    p = paths[i];

    var ddtheta2 = -GRAVITY/LENGTH*Math.sin(theta2) - dtheta2*VISCOSITY;
    var ddtheta1 = -GRAVITY/LENGTH*(Math.sin(theta1) + Math.cos(theta2)*Math.sin(theta1 - theta2)) - dtheta1*VISCOSITY;
    dtheta1 += ddtheta1 * dt;
    dtheta2 += ddtheta2 * dt;
    theta1 += dtheta1 * dt;
    theta2 += dtheta2 * dt;

    x1 = LENGTH*Math.sin(theta1);
    y1 = LENGTH*Math.cos(theta1);

    x = LENGTH*(Math.sin(theta1) + Math.sin(theta2));
    y = LENGTH*(Math.cos(theta1) + Math.cos(theta2));

    //line(0, 0, x1, y1);
    //line(x1, y1, x, y);

    p.push(x, y, dtheta1*dtheta1 + dtheta2*dtheta2);
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
  paths[0].setAll(x2, y2, -1);
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
  simulate_double_pendulum();
}

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
    var linewidth = map(this.z[pj], 0, 0.26, 0.2, 1.5);
    strokeWeight(linewidth);
    line(this.x[pj], this.y[pj], this.x[j], this.y[j]);
    //ellipse(this.x[j], this.y[j], linewidth, linewidth);
  }
};
