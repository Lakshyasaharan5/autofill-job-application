import { chromium } from 'playwright';

const launchBrowser = async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });

  const page = await browser.newPage();
  // await page.goto('file:///Users/lakshyasaharan/projects/stagehand-lite/examples/company-site/index.html');
  // await page.goto('https://ultimateqa.com/');
  await page.goto('https://google.com/');
  // await page.locator('//html[1]/body[1]/c-wiz[2]/div[1]/div[2]/c-wiz[1]/div[1]/c-wiz[1]/div[2]/div[2]/div[1]/section[5]/div[1]/div[1]/div[1]/div[1]/div[1]/span[1]/div[1]/button[1]').click();
  const client = await page.context().newCDPSession(page);
  await client.send('DOM.enable');
  await client.send('Accessibility.enable');
  const { root } = await client.send("DOM.getDocument", {
    depth: -1,
    pierce: true,
  });

  printDOM;

  const xpathMap = buildXpathMap(root);
  console.log(xpathMap.get(2132));

  const { nodes } = await client.send("Accessibility.getFullAXTree");
  const axTree = buildAXTree(nodes);
  printAXTree(axTree);

  const pruned = pruneAXTree(axTree);

  printCleanTree(pruned);

  await browser.close();
};

launchBrowser();

function pruneAXTree(nodes: any[]): any[] {
  const cleaned: any[] = [];

  const noiseRoles = new Set([
    "none",
    "InlineTextBox",
    "StaticText",
    "ListMarker",
    "generic",
    "group",
  ]);

  const semanticRoles = new Set([
    "RootWebArea",
    "heading",
    "paragraph",
    "link",
    "button",
    "textbox",
    "searchbox",
    "combobox",
    "list",
    "listitem",
    "navigation",
    "article",
    "banner",
    "contentinfo",
    "form",
    "image",
  ]);

  for (const node of nodes) {
    const role = node.role?.value || "";
    let name = node.name?.value || "";

    // 1️⃣ Recursively prune children first
    const children = pruneAXTree(node.children || []);

    // 2️⃣ Merge all descendant text for text-bearing roles
    if (["paragraph", "heading", "link", "button"].includes(role)) {
      const text = collectText(node);
      if (text && !name.trim()) {
        name = text;
      }
    }

    // 3️⃣ If ignored → hoist children
    if (node.ignored) {
      cleaned.push(...children);
      continue;
    }

    // 4️⃣ Drop noise roles entirely
    if (noiseRoles.has(role)) {
      cleaned.push(...children);
      continue;
    }

    // 5️⃣ Drop decorative images (no accessible name)
    if (role === "image" && !name.trim()) {
      continue;
    }

    // 6️⃣ If not semantic and has children → hoist
    if (!semanticRoles.has(role)) {
      cleaned.push(...children);
      continue;
    }

    // 7️⃣ Keep meaningful node
    cleaned.push({
      role,
      name,
      backendDOMNodeId: node.backendDOMNodeId,
      children,
    });
  }

  return cleaned;
}

function collectText(node: any): string {
  let text = "";

  function traverse(n: any) {
    const role = n.role?.value || "";

    // Only collect leaf text boxes
    if (role === "InlineTextBox") {
      text += (n.name?.value || "") + " ";
      return; // stop deeper traversal
    }

    for (const child of n.children || []) {
      traverse(child);
    }
  }

  traverse(node);

  return text.replace(/\s+/g, " ").trim();
}





function printCleanTree(nodes: any[], depth = 0) {
  const indent = "  ".repeat(depth);

  for (const node of nodes) {
    console.log(
      `${indent}${node.role}${node.name ? ` "${node.name}"` : ""}`
    );

    if (node.children?.length) {
      printCleanTree(node.children, depth + 1);
    }
  }
}


function buildAXTree(nodes: any[]) {
  const nodeMap = new Map<string, any>();
  const roots: any[] = [];

  // First pass: store nodes
  for (const node of nodes) {
    node.children = [];
    nodeMap.set(node.nodeId, node);
  }

  // Second pass: link parent-child
  for (const node of nodes) {
    if (node.parentId && nodeMap.has(node.parentId)) {
      nodeMap.get(node.parentId).children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

function printAXTree(nodes: any[], depth = 0) {
  const indent = "  ".repeat(depth);

  for (const node of nodes) {
    const role = node.role?.value || "unknown";
    const name = node.name?.value || "";

    console.log(
      `${indent}${role}${name ? ` "${name}"` : ""} (backendId: ${node.backendDOMNodeId || "-"})`
    );

    if (node.children?.length) {
      printAXTree(node.children, depth + 1);
    }
  }
}

function printDOM(node: any, depth = 0) {
  const indent = "  ".repeat(depth);

  const name = node.nodeName;
  const id = node.backendNodeId;

  console.log(`${indent}${name} (${id})`);

  if (!node.children) return;

  for (const child of node.children) {
    printDOM(child, depth + 1);
  }
}

function buildXpathMap(domRoot: any) {
  const xpathMap = new Map<number, string>();

  // Find real <html> root (skip #document)
  const htmlNode = domRoot.children?.find(
    (child: any) =>
      child.nodeType === 1 &&
      child.nodeName.toLowerCase() === "html"
  );

  if (!htmlNode) {
    throw new Error("HTML root not found");
  }

  // Start traversal from real html
  traverse(htmlNode, "/html[1]");

  function traverse(node: any, currentPath: string) {
    if (node.backendNodeId) {
      xpathMap.set(node.backendNodeId, currentPath);
    }

    if (!node.children) return;

    // Only count ELEMENT siblings
    const elementChildren = node.children.filter(
      (child: any) => child.nodeType === 1
    );

    const tagCounter: Record<string, number> = {};

    for (const child of elementChildren) {
      const tag = child.nodeName.toLowerCase();

      tagCounter[tag] = (tagCounter[tag] || 0) + 1;
      const index = tagCounter[tag];

      const childPath = `${currentPath}/${tag}[${index}]`;

      traverse(child, childPath);
    }
  }

  return xpathMap;
}
