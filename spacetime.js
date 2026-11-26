(() => {
  const canvas = document.querySelector('.spacetime');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const resting = { x: .72, y: .72, depth: .32 };
  const cursor = { ...resting };
  const target = { ...resting };
  const keys = ['x', 'y', 'depth'];
  const columns = 38;
  const rows = 28;
  let width = 0;
  let height = 0;
  let frame = 0;

  function schedule() {
    if (!frame) frame = requestAnimationFrame(draw);
  }

  function draw() {
    frame = 0;
    if (!width || !height) return;
    for (const key of keys) cursor[key] += (target[key] - cursor[key]) * .15;
    const length = Math.min(width, height);
    const radius = length * .28;
    const cx = cursor.x * width;
    const cy = cursor.y * height;

    const points = Array.from({ length: rows + 1 }, (_, row) => {
      const t = row / rows;
      const y = height * (.16 + .98 * t ** 1.65);
      const spread = .62 + 1.4 * t;
      return Array.from({ length: columns + 1 }, (_, column) => {
        const x = width * (.5 + (column / columns - .5) * spread);
        const dx = x - cx;
        const dy = y - cy;
        const pull = cursor.depth * Math.exp(-(dx * dx + dy * dy) / (radius * radius));
        return [x - dx * pull * .24, y + length * .20 * pull];
      });
    });

    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(51, 90, 153, .30)';
    ctx.beginPath();
    function trace(nodes) {
      nodes.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    }
    points.forEach(trace);
    for (let c = 0; c <= columns; c++) trace(points.map(row => row[c]));
    ctx.stroke();
    if (keys.some(key => Math.abs(cursor[key] - target[key]) > .001)) schedule();
  }

  const resize = new ResizeObserver(() => {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    schedule();
  });
  resize.observe(canvas);

  function rest() {
    Object.assign(target, resting);
    if (motion.matches) Object.assign(cursor, target);
    schedule();
  }

  window.addEventListener('pointermove', event => {
    if (motion.matches || event.pointerType === 'touch' || !width || !height) return;
    Object.assign(target, { x: event.clientX / width, y: event.clientY / height, depth: 1 });
    schedule();
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', rest);
  window.addEventListener('blur', rest);
  motion.addEventListener('change', rest);
})();
