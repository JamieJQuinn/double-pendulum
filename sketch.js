var MASS = 100;
var LENGTH = 100;
var GRAVITY = 9.81;
var SPRING_K = 50;
var MAX_POINTS = 600;
var SCALE=12;

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

  theta1 = PI/6;
  theta2 = PI/6;
  p1 = 0;
  p2 = 0
  dtheta1 = 0;
  dtheta2 = 0;
  dp1 = 0;
  dp2 = 0

  paths.push(new Path(0, 0, 0));

  //sigmaBox = createInput();
  //sigmaBox.position(20,20);
  //sigmaBox.value(INIT_SIGMA);
  //betaBox = createInput();
  //betaBox.position(20, 50);
  //betaBox.value(INIT_BETA);
  //rhoBox = createInput();
  //rhoBox.position(20, 80);
  //rhoBox.value(INIT_RHO);
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

    //line(0, 0, x, y);

    p.push(x, y);
    p.display();
  }
}

function simulate_double_pendulum() {
  for (var i=0; i < paths.length; ++i) {
    p = paths[i];

    var ddtheta = -GRAVITY/LENGTH*Math.sin(theta1);
    dtheta1 += ddtheta * dt;
    theta1 += dtheta1 * dt;

    x = LENGTH*Math.sin(theta1);
    y = LENGTH*Math.cos(theta1);

    p.push(x, y);
    p.display();
  }
}

function mouseReleased() {
  x = mouseX-width/2;
  y = mouseY-height/2;
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

Path.prototype.push = function(x, y, z) {
  var prev = this.last;
  this.last = (this.last+1) % MAX_POINTS;
  this.x[this.last] = x;
  this.y[this.last] = y;
  this.z[this.last] = z;
}

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
    //var linewidth = map(this.z[pj], 14, 30, 0.5, 2);
    //strokeWeight(linewidth);
    line(this.x[pj], this.y[pj], this.x[j], this.y[j]);
    //ellipse(SCALE*this.x[j], SCALE*this.y[j], linewidth, linewidth);
  }
};
