// Maze generation using recursive backtracker.
// Produces a fine "solid" occupancy grid where walls and cells are both tiles.
// Grid dimensions: W = 2*cols+1, H = 2*rows+1.

export function generateMaze(cols, rows) {
  const W = 2 * cols + 1;
  const H = 2 * rows + 1;

  // true = solid wall, false = open floor
  const solid = Array.from({ length: H }, () => new Array(W).fill(true));

  const visited = Array.from({ length: rows }, () => new Array(cols).fill(false));

  // Convert a cell (cx, cy) to its tile coords in the solid grid.
  const cellTile = (cx, cy) => [2 * cx + 1, 2 * cy + 1];

  const stack = [[0, 0]];
  visited[0][0] = true;
  {
    const [tx, ty] = cellTile(0, 0);
    solid[ty][tx] = false;
  }

  const dirs = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ];

  while (stack.length) {
    const [cx, cy] = stack[stack.length - 1];

    // gather unvisited neighbors
    const options = [];
    for (const [dx, dy] of dirs) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && !visited[ny][nx]) {
        options.push([nx, ny, dx, dy]);
      }
    }

    if (options.length === 0) {
      stack.pop();
      continue;
    }

    const [nx, ny, dx, dy] = options[(Math.random() * options.length) | 0];
    visited[ny][nx] = true;

    // carve the chosen cell + the wall between
    const [ctx, cty] = cellTile(cx, cy);
    solid[cty + dy][ctx + dx] = false; // wall between
    const [ntx, nty] = cellTile(nx, ny);
    solid[nty][ntx] = false; // neighbor cell

    stack.push([nx, ny]);
  }

  // Knock out a handful of extra walls so there are loops / multiple routes.
  const extra = Math.floor(cols * rows * 0.08);
  for (let i = 0; i < extra; i++) {
    const wx = 1 + 2 * ((Math.random() * (cols - 1)) | 0) + 1; // an internal vertical/horizontal wall
    const wy = 1 + 2 * ((Math.random() * (rows - 1)) | 0) + 1;
    if (Math.random() < 0.5) solid[2 * ((Math.random() * rows) | 0) + 1][wx] = false;
    else solid[wy][2 * ((Math.random() * cols) | 0) + 1] = false;
  }

  return { solid, W, H, cols, rows };
}

// List all open floor tiles (excluding border) as [tx, ty].
export function openTiles(maze) {
  const out = [];
  for (let y = 1; y < maze.H - 1; y++) {
    for (let x = 1; x < maze.W - 1; x++) {
      if (!maze.solid[y][x]) out.push([x, y]);
    }
  }
  return out;
}
