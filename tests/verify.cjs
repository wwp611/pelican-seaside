// Exercise the shipped animation logic in a deterministic DOM/clock harness.
// No npm dependencies are required; visual browser checks complement these invariants.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
function harness({reduced = false, mobile = false} = {}) {
  const ids = new Map(), raf = new Map(), media = new Map(), documentEvents = {};
  let nextId = 0;
  function element() {
    const attrs = {}, listeners = {};
    return { attrs, listeners, textContent:'', children:[],
      setAttribute(key,value) { attrs[key]=String(value);if(key==='id')ids.set(value,this); },
      getAttribute(key) { return attrs[key] ?? null; },
      append(child) { this.children.push(child); },
      addEventListener(name,fn) { listeners[name]=fn; }
    };
  }
  for(const match of html.matchAll(/\bid="([^"]+)"/g)) ids.set(match[1],element());
  const doc = {hidden:false,activeElement:{tagName:'BODY'},
    getElementById(id) { assert(ids.has(id),`Missing element ${id}`);return ids.get(id); },
    createElementNS() { return element(); },
    addEventListener(name,fn) { documentEvents[name]=fn; },
    body:{classList:{toggle(){}}}
  };
  const context = vm.createContext({document:doc,matchMedia(query) {
    if(!media.has(query)) media.set(query,{matches:query.includes('reduced-motion')?reduced:mobile,addEventListener(name,fn){this.listener=fn;}});
    return media.get(query);
  },requestAnimationFrame(fn){const id=++nextId;raf.set(id,fn);return id;},cancelAnimationFrame(id){raf.delete(id);}});
  // Instrument only the test-loaded source, leaving the delivered page unchanged.
  vm.runInContext(source.replace('draw(0);syncPlayback();',
    'globalThis.animationTest={legPose,draw,get state(){return {playing,speed,elapsed,night,showBones};}};draw(0);syncPlayback();'),context);
  return {ids,doc,media,raf,documentEvents,api:context.animationTest,
    click(id){ids.get(id).listeners.click();},
    step(now){const callbacks=[...raf.values()];raf.clear();callbacks.forEach(fn=>fn(now));},
    input(value){ids.get('speed').listeners.input({target:{value}});}
  };
}
const h=harness();
let maxLengthError=0,minReach=Infinity,maxReach=0;
for(let i=0;i<=1440;i++) {
  const theta=i*Math.PI*2/1440;
  const near=h.api.legPose(theta,'near'),far=h.api.legPose(theta,'far');
  for(const p of [near,far]) {
    const a=Math.hypot(p.hip.x-p.knee.x,p.hip.y-p.knee.y),b=Math.hypot(p.knee.x-p.ankle.x,p.knee.y-p.ankle.y);
    maxLengthError=Math.max(maxLengthError,Math.abs(a-89),Math.abs(b-91));
    assert(Math.abs(a-89)<1e-9 && Math.abs(b-91)<1e-9,'Rigid leg length invariant');
    assert.equal(p.ankle.x,p.pedal.x);assert.equal(p.ankle.y,p.pedal.y-8);
    assert(p.knee.x>p.hip.x,'Knee must bend forward');
    assert(p.pedal.y+4<600,'Pedal must stay above ground');
    const d=Math.hypot(p.hip.x-p.ankle.x,p.hip.y-p.ankle.y);minReach=Math.min(minReach,d);maxReach=Math.max(maxReach,d);
  }
  assert(Math.abs((near.pedal.x+far.pedal.x)/2-579.5)<1e-9,'Opposite crank phases in x');
  assert(Math.abs((near.pedal.y+far.pedal.y)/2-496)<1e-9,'Opposite crank phases in y');
  h.api.draw(i/1440/.48);
  for(const el of h.ids.values()) for(const value of Object.values(el.attrs)) assert(!/NaN|Infinity/.test(value),'Finite SVG geometry');
}
assert.equal(h.raf.size,1);h.step(0);h.step(16);assert(h.api.state.elapsed>0);
h.click('play');const paused=h.api.state.elapsed;assert.equal(h.raf.size,0);h.step(3000);assert.equal(h.api.state.elapsed,paused);
const before=[...h.ids].map(([id,el])=>[id,{...el.attrs}]);h.step(9000);
assert.deepEqual([...h.ids].map(([id,el])=>[id,{...el.attrs}]),before,'All scene elements freeze together');
h.input('2');assert.equal(h.api.state.speed,2);assert.equal(h.ids.get('speed-value').textContent,'2.00×');
h.click('play');h.step(10000);h.step(10020);assert(Math.abs(h.api.state.elapsed-paused-.04)<1e-9,'Speed scales time');
h.doc.hidden=true;h.documentEvents.visibilitychange();assert.equal(h.raf.size,0);h.doc.hidden=false;h.documentEvents.visibilitychange();assert.equal(h.raf.size,1);
h.click('theme');assert(h.api.state.night);assert.equal(h.ids.get('stars').attrs.opacity,'.8');h.click('theme');assert(!h.api.state.night);
h.click('geometry');assert.equal(h.ids.get('skeleton').attrs.display,'inline');assert(h.ids.get('bones').attrs.d.startsWith('M'));h.click('geometry');assert.equal(h.ids.get('skeleton').attrs.display,'none');
let prevented=false;h.documentEvents.keydown({code:'Space',repeat:false,preventDefault(){prevented=true;}});assert(prevented);assert(!h.api.state.playing);
h.doc.activeElement.tagName='INPUT';h.documentEvents.keydown({code:'Space',repeat:false,preventDefault(){throw Error('Input key intercepted');}});assert(!h.api.state.playing);
const quiet=harness({reduced:true});assert(!quiet.api.state.playing);assert.equal(quiet.raf.size,0);quiet.click('play');assert(quiet.api.state.playing,'Explicit playback still allowed');
const phone=harness({mobile:true});assert.equal(phone.ids.get('scene').attrs.viewBox,'260 45 660 635');
console.log(`PASS: 2,882 leg poses; fixed lengths, pedal contact, forward knees, opposite phases, ground clearance.`);
console.log(`Max bone length error: ${maxLengthError.toExponential(2)}px; hip-to-ankle range: ${minReach.toFixed(2)}–${maxReach.toFixed(2)}px.`);
console.log('PASS: scene-wide pause, speed, background suspension, theme, skeleton, keyboard, mobile framing, reduced motion.');
