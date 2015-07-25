var requestAnimFrame =
  (window.requestAnimationFrame
      || window.webkitRequestAnimationFrame
      || window.mozRequestAnimationFrame
      || function(cb){
          window.setTimeout(cb, 1000 / 60);
        });


var __active__ = 0;
export function scrollToY(scrollTargetY, speed, easing) {

  __active__ += 1;

  var scrollY = window.scrollY
    , scrollTargetY = scrollTargetY || 0
    , speed = speed || 2000
    , easing = easing || 'easeOutSine'
    , currentTime = 0;

  var time = Math.max(.1, Math.min(Math.abs(scrollY - scrollTargetY) / speed, .8));

  var PI_D2 = Math.PI / 2
    , easingEquations = {
        linear: (pos) =>  pos
      , easeOutSine: (pos) => {
          return Math.sin(pos * (Math.PI / 2));
        }
      , easeInOutSine: (pos) => {
          return (-0.5 * (Math.cos(Math.PI * pos) - 1));
        }
    };

  var n = __active__;
  function tick() {
    if (n != __active__) { return; }
    currentTime += 1 / 60;
    var p = currentTime / time
      , t = easingEquations[easing](p);
    if (p < 1) {
      requestAnimFrame(tick);
      window.scrollTo(0, scrollY + ((scrollTargetY - scrollY) * t));
    } else {
      window.scrollTo(0, scrollTargetY);
    }
  }

  tick();
}
