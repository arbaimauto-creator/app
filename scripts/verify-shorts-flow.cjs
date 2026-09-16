// Read-only UI journey on the local Android emulator. Never posts or saves content.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const adb = path.join(process.env.LOCALAPPDATA, 'Android/Sdk/platform-tools/adb.exe');
const out = path.resolve(__dirname, '../.harness/shorts-verification/final');
fs.mkdirSync(out, { recursive: true });
const results = { startedAt: new Date().toISOString(), checks: [] };
const serial = process.env.GREYD_VERIFY_SERIAL || 'emulator-5560';
const run = (...args) => execFileSync(adb, ['-s', serial, ...args], { encoding: 'utf8', timeout: 30000, maxBuffer: 32 * 1024 * 1024 });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const check = (name, passed, detail) => {
  results.checks.push({ name, passed, detail });
  console.log((passed ? 'PASS ' : 'FAIL ') + name + ' ' + JSON.stringify(detail || ''));
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(results, null, 2));
  if (!passed) throw new Error(name);
};
function snapshotTree() {
  const remote = '/sdcard/shorts-flow-' + Date.now() + '.xml';
  const status = run('shell', 'uiautomator', 'dump', '--compressed', remote);
  if (!status.includes('dumped')) throw new Error('Fresh UI snapshot unavailable');
  const xml = run('shell', 'cat', remote);
  return (xml.match(/<node\s[^>]+>/g) || []).map(tag => {
    const attr = key => tag.match(new RegExp(key + '="([^"]*)"'))?.[1] || '';
    return { text: attr('text'), label: attr('content-desc'), bounds: (attr('bounds').match(/\d+/g) || []).map(Number) };
  });
}
function tree() {
  for (let attempt=0; attempt<4; attempt++) {
    try { return snapshotTree(); } catch (error) {
      if (error.message !== 'Fresh UI snapshot unavailable' || attempt===3) throw error;
      console.log('Retry fresh accessibility snapshot');
    }
  }
}
const find = (nodes, prefix) => nodes.find(n => n.label.startsWith(prefix)) || nodes.find(n => n.text.startsWith(prefix));
function tap(node) {
  if (!node || node.bounds.length !== 4) throw new Error('Missing tappable node');
  const [x1,y1,x2,y2] = node.bounds;
  run('shell', 'input', 'tap', String(Math.round((x1+x2)/2)), String(Math.round((y1+y2)/2)));
}
async function waitFor(prefix) {
  for (let i=0; i<8; i++) {
    const nodes = tree();
    if (find(nodes, prefix)) return nodes;
    if (find(nodes, 'Update Notice')) run('shell', 'input', 'tap', '35', '450');
    await delay(1000);
  }
  throw new Error('Timed out waiting for ' + prefix);
}
function capture(name) {
  run('shell', 'screencap', '-p', '/sdcard/shorts-flow.png');
  run('pull', '/sdcard/shorts-flow.png', path.join(out, name + '.png'));
}
function videoFrame() {
  const buf = execFileSync(adb, ['-s',serial,'exec-out','screencap'], { timeout: 30000, maxBuffer: 32*1024*1024 });
  const width=buf.readUInt32LE(0), height=buf.readUInt32LE(4), format=buf.readUInt32LE(8);
  if (format !== 1) throw new Error('Unexpected screenshot pixel format ' + format);
  const offset=buf.length-width*height*4;
  const hash=crypto.createHash('sha256');
  // Sample the exposed video above the sheet; exclude status bar, controls and captions.
  for (let y=Math.floor(height*.31);y<Math.floor(height*.37);y++) {
    hash.update(buf.subarray(offset+(y*width+Math.floor(width*.2))*4,offset+(y*width+Math.floor(width*.7))*4));
  }
  return hash.digest('hex');
}
async function frames() { const first=videoFrame(); await delay(2400); return [first, videoFrame()]; }
const author = nodes => nodes.find(n => /^@/.test(n.text))?.text;
async function main() {
  let nodes=tree();
  if (find(nodes,'Update Notice')) { run('shell','input','tap','35','450'); await delay(1000); nodes=tree(); }
  if (!find(nodes,'Comments \u00b7 Ask')) {
    const entry=find(nodes,'@mina') || nodes.find(n => /^@/.test(n.text));
    if (!entry) throw new Error('Open the home feed or a short before this journey');
    tap(entry);
  }
  nodes=await waitFor('Comments \u00b7 Ask');
  await delay(5000);
  const initialAuthor=author(tree());
  check('shorts loaded', !!initialAuthor, initialAuthor);
  capture('01-playing');
  let pair=await frames();
  check('video advancing before panel', pair[0]!==pair[1], pair);
  tap(find(tree(),'Comments \u00b7 Ask'));
  nodes=await waitFor('Close');
  await delay(2000);
  capture('02-panel-open');
  check('panel opens', !!find(nodes,'Close'));
  pair=await frames();
  check('video stays paused while panel open', pair[0]===pair[1], pair);
  tap(find(tree(),'Close'));
  nodes=await waitFor('Comments \u00b7 Ask');
  check('panel closes on same review', author(nodes)===initialAuthor, author(nodes));
  await delay(1500);
  pair=await frames();
  check('video resumes after close', pair[0]!==pair[1], pair);
  capture('03-resumed');
  // Tapping the video may pause playback, but must not hide the review information.
  run('shell','input','tap','550','700');
  await delay(1000);
  check('review remains after video tap', !!find(tree(),'Comments \u00b7 Ask'));
  run('shell','input','tap','550','700');
  const seen=[initialAuthor];
  for(let i=0;i<2;i++) {
    run('shell','input','swipe','620','1000','620','420','400');
    await delay(2500);
    nodes=await waitFor('Comments \u00b7 Ask');
    const next=author(nodes);
    check('next video '+(i+1), !!next && next!==seen[seen.length-1], next);
    seen.push(next);
    capture('04-next-'+i);
  }
  run('shell','input','swipe','620','420','620','1050','400');
  await delay(2500);
  nodes=await waitFor('Comments \u00b7 Ask');
  check('previous video', author(nodes)===seen[1], author(nodes));
  tap(find(nodes,'more'));
  nodes=await waitFor('less');
  capture('05-expanded');
  const less=find(nodes,'less');
  const y=Math.max(800, less.bounds[1]-150);
  run('shell','input','swipe','450',String(y),'450',String(y-450),'400');
  await delay(2500);
  nodes=await waitFor('Comments \u00b7 Ask');
  check('swipe on expanded card changes video', author(nodes)===seen[2], author(nodes));
  capture('06-expanded-swipe');
  await delay(8000);
  check('review remains visible over time', !!find(tree(),'Comments \u00b7 Ask'));
  results.completedAt=new Date().toISOString();
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));
  console.log('JOURNEY COMPLETE');
}
main().catch(error => {
  results.error=error.message;
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));
  try { capture('failure'); } catch {}
  console.error(error.message);
  process.exitCode=1;
});
