export function renderGraph(svgElement, notes, activeNoteId, onSelectNote) {
  while (svgElement.firstChild) svgElement.removeChild(svgElement.firstChild);

  const allNotes = notes.filter(Boolean);
  if (!allNotes.length) return;

  const width = 800;
  const height = 420;
  const radius = 34;
  const centerX = width / 2;
  const centerY = height / 2;
  const angleStep = (Math.PI * 2) / Math.max(allNotes.length, 1);

  const positions = allNotes.map((note, index) => {
    const angle = index * angleStep - Math.PI / 2;
    const radiusOffset = Math.min(160, 90 + allNotes.length * 10);
    return {
      id: note.id,
      x: centerX + Math.cos(angle) * radiusOffset,
      y: centerY + Math.sin(angle) * radiusOffset,
      title: note.title || 'Untitled',
    };
  });

  const connectionPairs = [];
  notes.forEach((note) => {
    note.connections.forEach((targetId) => {
      if (note.id < targetId) {
        connectionPairs.push({ from: note.id, to: targetId });
      }
    });
  });

  connectionPairs.forEach((edge) => {
    const source = positions.find((pos) => pos.id === edge.from);
    const target = positions.find((pos) => pos.id === edge.to);
    if (!source || !target) return;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', String(source.x));
    line.setAttribute('y1', String(source.y));
    line.setAttribute('x2', String(target.x));
    line.setAttribute('y2', String(target.y));
    line.setAttribute('class', 'edge-line');
    svgElement.appendChild(line);
  });

  positions.forEach((node) => {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', 'node-group');
    group.setAttribute('data-id', node.id);
    group.style.cursor = 'pointer';
    group.addEventListener('click', () => onSelectNote(node.id));

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', String(node.x));
    circle.setAttribute('cy', String(node.y));
    circle.setAttribute('r', String(radius));
    circle.setAttribute('class', 'node-circle');
    if (node.id === activeNoteId) {
      circle.setAttribute('stroke-width', '3');
    }

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', String(node.x));
    label.setAttribute('y', String(node.y + 4));
    label.setAttribute('class', 'node-text');
    label.setAttribute('text-anchor', 'middle');
    label.textContent = node.title.length > 18 ? `${node.title.slice(0, 18)}…` : node.title;

    group.appendChild(circle);
    group.appendChild(label);
    svgElement.appendChild(group);
  });
}
