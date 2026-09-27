import { BRANCHES, commits } from "./commits.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const ROW_HEIGHT = 48;
const LANE_WIDTH = 20;
const GRAPH_PADDING = 14;
const NODE_RADIUS = 6;

const laneX = (lane) => GRAPH_PADDING + lane * LANE_WIDTH;
const rowY = (row) => row * ROW_HEIGHT + ROW_HEIGHT / 2;

// Builds the SVG path for one line between a parent commit (lower on the
// page) and its child (higher up). Lines in the same lane are straight.
// A fork curves out right above the parent; a merge curves in right below
// the child, which is how git tools draw branches.
function edgePath(parent, child) {
  const x1 = laneX(parent.lane);
  const y1 = rowY(parent.row);
  const x2 = laneX(child.lane);
  const y2 = rowY(child.row);
  const bend = ROW_HEIGHT / 2;

  if (x1 === x2) {
    return `M ${x1} ${y1} L ${x2} ${y2}`;
  }

  if (child.lane > parent.lane) {
    const curveEnd = y1 - ROW_HEIGHT;
    return `M ${x1} ${y1} C ${x1} ${y1 - bend}, ${x2} ${y1 - bend}, ${x2} ${curveEnd} L ${x2} ${y2}`;
  }

  const curveStart = y2 + ROW_HEIGHT;
  return `M ${x1} ${y1} L ${x1} ${curveStart} C ${x1} ${y2 + bend}, ${x2} ${y2 + bend}, ${x2} ${y2}`;
}

function createSvgElement(tag, attributes) {
  const element = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }
  return element;
}

function drawGraph(positions, width) {
  const height = commits.length * ROW_HEIGHT;
  const svg = createSvgElement("svg", {
    class: "journey__graph",
    width,
    height,
    viewBox: `0 0 ${width} ${height}`,
    "aria-hidden": "true",
  });

  // Lines first, so the commit dots are drawn on top of them.
  for (const commit of commits) {
    const child = positions.get(commit.hash);
    for (const parentHash of commit.parents) {
      const parent = positions.get(parentHash);
      // A line takes the color of the side branch it belongs to.
      const branch = child.lane >= parent.lane ? child.branch : parent.branch;
      const classes = ["graph-edge", `graph-edge--${branch}`];
      if (commit.isWip) {
        classes.push("graph-edge--wip");
      }
      svg.append(
        createSvgElement("path", {
          class: classes.join(" "),
          d: edgePath(parent, child),
        })
      );
    }
  }

  const nodes = commits.map((commit) => {
    const { row, lane, branch } = positions.get(commit.hash);
    const variant = commit.isWip ? "wip" : branch;
    const node = createSvgElement("circle", {
      class: `graph-node graph-node--${variant}`,
      cx: laneX(lane),
      cy: rowY(row),
      r: NODE_RADIUS,
    });
    svg.append(node);
    return node;
  });

  return { svg, nodes };
}

function createCommitButton(commit, index) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "commit";
  button.dataset.index = index;
  button.setAttribute("aria-pressed", "false");
  button.setAttribute("aria-controls", "commit-details");

  const text = document.createElement("span");
  text.className = "commit__text";
  const type = document.createElement("span");
  type.className = "commit__type";
  type.textContent = `${commit.type}: `;
  text.append(type, commit.message);
  button.append(text);

  if (commit.isWip) {
    const head = document.createElement("span");
    head.className = "commit__head";
    head.textContent = "HEAD";
    button.append(head);
  }

  const date = document.createElement("span");
  date.className = "commit__date";
  date.textContent = commit.date;
  button.append(date);

  return button;
}

function fillDetails(details, commit) {
  const meta = document.createElement("p");
  meta.className = "commit-details__meta";
  meta.textContent = commit.isWip
    ? `uncommitted changes · ${commit.branch}`
    : `commit ${commit.hash} · ${commit.branch}`;

  const title = document.createElement("h3");
  title.className = "commit-details__title";
  title.textContent = commit.title;

  const date = document.createElement("p");
  date.className = "commit-details__date";
  date.textContent = commit.date;

  const body = document.createElement("p");
  body.className = "commit-details__body";
  body.textContent = commit.body;

  details.replaceChildren(meta, title, date, body);
  details.dataset.branch = commit.branch;

  if (commit.links) {
    const list = document.createElement("ul");
    list.className = "commit-details__links";
    for (const link of commit.links) {
      const item = document.createElement("li");
      const anchor = document.createElement("a");
      anchor.className = "text-link";
      anchor.href = link.url;
      anchor.textContent = link.label;
      if (link.url.startsWith("http")) {
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
      }
      item.append(anchor);
      list.append(item);
    }
    details.append(list);
  }
}

export function renderJourney(container) {
  // Map each commit hash to its position: row (from the top) and lane.
  const positions = new Map(
    commits.map((commit, row) => [
      commit.hash,
      { row, lane: BRANCHES[commit.branch].lane, branch: commit.branch },
    ])
  );

  const laneCount = Object.keys(BRANCHES).length;
  const graphWidth = GRAPH_PADDING * 2 + (laneCount - 1) * LANE_WIDTH;
  container.style.setProperty("--graph-width", `${graphWidth}px`);
  container.style.setProperty("--row-height", `${ROW_HEIGHT}px`);

  const log = document.createElement("div");
  log.className = "journey__log";
  const { svg, nodes } = drawGraph(positions, graphWidth);

  const list = document.createElement("ol");
  list.className = "commit-list";
  list.setAttribute("aria-label", "Milestones, newest first");
  const buttons = commits.map((commit, index) => {
    const item = document.createElement("li");
    const button = createCommitButton(commit, index);
    item.append(button);
    list.append(item);
    return button;
  });
  log.append(svg, list);

  const details = document.createElement("aside");
  details.className = "commit-details";
  details.id = "commit-details";
  details.setAttribute("aria-live", "polite");

  container.replaceChildren(log, details);

  function selectCommit(index) {
    buttons.forEach((button, i) => {
      button.setAttribute("aria-pressed", String(i === index));
      nodes[i].classList.toggle("graph-node--selected", i === index);
    });
    fillDetails(details, commits[index]);
  }

  list.addEventListener("click", (event) => {
    const button = event.target.closest(".commit");
    if (button) {
      selectCommit(Number(button.dataset.index));
    }
  });

  // Arrow keys move between commits, like moving through a log.
  list.addEventListener("keydown", (event) => {
    const current = buttons.indexOf(document.activeElement);
    if (current === -1) {
      return;
    }
    let next;
    if (event.key === "ArrowDown") {
      next = Math.min(current + 1, buttons.length - 1);
    } else if (event.key === "ArrowUp") {
      next = Math.max(current - 1, 0);
    } else {
      return;
    }
    event.preventDefault();
    buttons[next].focus();
  });

  selectCommit(0);
}
