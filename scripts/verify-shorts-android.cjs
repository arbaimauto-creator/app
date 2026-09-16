// Local emulator inspection only: no publishing, account changes, or data clearing.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const adb = path.join(process.env.LOCALAPPDATA, 'Android/Sdk/platform-tools/adb.exe');
const out = path.resolve(__dirname, '../.harness/shorts-verification');
fs.mkdirSync(out, { recursive: true });
const run = (...args) => execFileSync(adb, ['-s', process.env.GREYD_VERIFY_SERIAL || 'emulator-5560', ...args], { encoding: 'utf8', timeout: 30000 });
const [action = 'capture', ...args] = process.argv.slice(2);
if (action === 'launch') {
  console.log(run('shell', 'getprop', 'sys.boot_completed'));
  run('reverse', 'tcp:8081', 'tcp:8081');
  console.log(run('shell', 'am', 'start', '-n', 'com.arbaim.greyd/.MainActivity'));
} else if (action === 'tap-label' && ['Comments', 'Close', 'more', 'less'].includes(args[0])) {
  run('shell', 'uiautomator', 'dump', '/sdcard/shorts-verify.xml');
  const xml = run('shell', 'cat', '/sdcard/shorts-verify.xml');
  const nodes = xml.match(/<node[^>]+>/g) || [];
  const node = nodes.find(x => x.includes('content-desc="' + args[0])) || nodes.find(x => x.includes('text="' + args[0] + '"'));
  if (!node) throw new Error('Label not found: ' + args[0]);
  const bounds = node.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/).slice(1).map(Number);
  console.log('Tap', args[0], bounds);
  run('shell', 'input', 'tap', String(Math.round((bounds[0] + bounds[2]) / 2)), String(Math.round((bounds[1] + bounds[3]) / 2)));
} else if (action === 'tap' && args.length === 2 && args.every(x => /^\d+$/.test(x))) {
  run('shell', 'input', 'tap', ...args);
} else if (action === 'swipe' && args.length === 4 && args.every(x => /^\d+$/.test(x))) {
  run('shell', 'input', 'swipe', ...args, '400');
} else if (action === 'back') {
  run('shell', 'input', 'keyevent', '4');
} else if (action === 'logs') {
  const lines = run('logcat', '-d', '-t', '1200').split('\n');
  console.log(lines.filter(x => /FATAL EXCEPTION|ReactNativeJS|AndroidRuntime|ExoPlayer.*error|Unable to load/i.test(x)).join('\n'));
} else if (action === 'shot' && /^[a-z0-9-]+$/.test(args[0] || 'current')) {
  run('shell', 'screencap', '-p', '/sdcard/shorts-verify.png');
  run('pull', '/sdcard/shorts-verify.png', path.join(out, (args[0] || 'current') + '.png'));
} else if (action === 'capture' && /^[a-z0-9-]+$/.test(args[0] || 'current')) {
  const name = args[0] || 'current';
  run('shell', 'screencap', '-p', '/sdcard/shorts-verify.png');
  run('pull', '/sdcard/shorts-verify.png', path.join(out, name + '.png'));
  try {
    run('shell', 'uiautomator', 'dump', '/sdcard/shorts-verify.xml');
    run('pull', '/sdcard/shorts-verify.xml', path.join(out, name + '.xml'));
    const xml = fs.readFileSync(path.join(out, name + '.xml'), 'utf8');
    console.log(xml.match(/<node[^>]+(?:text|content-desc)="[^"]+"[^>]*>/g)?.join('\n') || 'No accessible labels');
  } catch (e) { console.log('UI dump unavailable: ' + e.message); }
  // Capture after the accessibility tree settles, not during a navigation transition.
  run('shell', 'screencap', '-p', '/sdcard/shorts-verify.png');
  run('pull', '/sdcard/shorts-verify.png', path.join(out, name + '.png'));
  console.log(path.join(out, name + '.png'));
} else { throw new Error('Supported: capture NAME, tap X Y, swipe X1 Y1 X2 Y2, back, logs'); }
