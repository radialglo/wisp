/**
 * wisp.js
 * 
 * @author Anthony Su
 *
 *
 */
(function() {

  /*==== ====*/
  // rFA
  /*==== ====*/

  // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
  // http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
   
  // requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
   
  // MIT license
 

    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] 
                                   || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
      };



  /*==== ====*/
  // Wisp
  /*==== ====*/
  

  var WIDTH = window.innerWidth
    , HEIGHT = window.innerHeight
    , FRAME_RATE = 60 // approximate
    , TTL = 8000
    , MAX_X = 5
    , MAX_Y = 2
    , MAX_RADIUS = 10;

 // render types

 var RENDER_TYPE = {
     jellyfish: "jellyfish"
   , firefly: "firefly"
   , orb: "orb"
   , random: "random"
 };

 var RENDER_VALUES = [];
 for(var key in RENDER_TYPE) {
    if(key !== "random") {
      RENDER_VALUES.push(RENDER_TYPE[key]);
    }
 }

  function Wisp(cfg) {
      this.x = WIDTH * Math.random();
      this.y = HEIGHT * Math.random();
      this.r = ((MAX_RADIUS - 1) * Math.random()) + 1;
      this.dx = (Math.random() * MAX_X) * (Math.random() < .5 ? -1 : 1);
      this.dy = (Math.random() * MAX_Y) * (Math.random() < .5 ? -1 : 1);
      this.hl = (TTL / FRAME_RATE) * (this.r / MAX_RADIUS);
      this.fr = Math.random() * this.hl;
      this.df = Math.random() + 1; 
      this.stop = Math.random() * .2 + .4;
      this.render = this[cfg.render_type];
  }

  Wisp.prototype = {
  
    fade: function() {
      this.fr += this.df;
    },

    draw: function(ctx) {

      if(this.fr <= 0 || this.fr >= this.hl) {
        
        // change the rate so that it toggles fadeIn or fadeOut
        this.df *= -1;
      }
    
      // when wisp is at its slowest velocity, opacity should be at its peak
      // likewise radius is at its peak
      var op =   1 - (this.fr / this.hl);

      // since we are using opacity to determine the radius of the radial gradient
      // make sure we don't have a negative radius
      if(op < 0) {
        op = 0;
      }
    
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.closePath();

      
      var g = ctx.createRadialGradient(this.x , this.y, 0, this.x, this.y, this.r * op );

      this.render(g, op);
    
      ctx.fillStyle = g;
      ctx.fill();
    },

    move: function() {

      // oscillate change in x and y
      var o_factor =  (this.fr / this.hl);
  

      this.x += o_factor * this.dx;
      this.y += o_factor * this.dy;

      // if out of bounds start moving in other direction
      if (this.x > WIDTH || this.x < 0) {
        this.dx *= -1;
      }

      if( this.y > HEIGHT || this.y < 0) {
        this.dy *= -1;
      }
    },

    // Rendering Functions
    jellyfish: function(g, op) {
      g.addColorStop(0.0, 'rgba(64,185,249,0)');
      g.addColorStop(this.stop, 'rgba(64,185,249,' + (op * .2) + ')');
      g.addColorStop(1.0, 'rgba(1,162,255,' + op + ')');
    },

    firefly: function(g, op) {
      g.addColorStop(0.0, 'rgba(1,162,255,' + op + ')');
      g.addColorStop(this.stop, 'rgba(64,185,249,' + (op * .2) + ')');
      g.addColorStop(1.0, 'rgba(64,185,249,0)');
    },

    orb: function(g, op) {
      this.jellyfish.apply(this, arguments);
      this.firefly.apply(this, arguments);
    }
    
  }

  /*==== ====*/
  // WispForest
  /*==== ====*/

  function WispForest(cfg) {

    var canvas = document.getElementById(cfg.id)
      , ctx = canvas.getContext('2d')
      , count = cfg.count
      , wisps = [];

    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    this.canvas = canvas;
    this.ctx = ctx;

    var render_type = cfg.render_type
      , render_random = (cfg.render_type === RENDER_TYPE.random)
      , render_count = RENDER_VALUES.length;

    if(!RENDER_TYPE.hasOwnProperty(render_type)) {
      throw new Error("Invalid Render Type");
    };



    for (var i = 0; i < count; i++) {

          if (render_random) {
              var idx = Math.floor((Math.random() * 100 % render_count))
              render_type = RENDER_VALUES[idx];
          }

          wisps[i] = new Wisp({render_type: render_type});
    }

    this.wisps = wisps
    this.draw();
  }


  WispForest.prototype = {

    constructor: WispForest,
    draw: function() {

      var self = this,
        ctx = self.ctx;

        requestAnimationFrame(function(time) {
          self.draw();
        });

      this.ctx.clearRect(0,0, WIDTH, HEIGHT);

      this.wisps.forEach(function(wisp) {
        wisp.fade();
        wisp.move();
        wisp.draw(ctx);
      });
    }
  };

  window.WispForest = WispForest;


})();


